console.log("Updating trades");
let runningPnL = 0;
class Trade {
  // Trade has instrument, buyPrice, sellPrice, qty, profit or loss
  constructor(buyObj) {
    this.buyTime = buyObj.time;
    this.buyPrice = buyObj.price;
    this.netInvestment = buyObj.price * buyObj.quantity;
    this.pts = 0;
    this.quantity = buyObj.quantity;
    this.sellTime = undefined;
    this.isWin = false;
    this.isClosed = false;
    this.profit = 0;
    this.instrument = buyObj.instrument;
    this.duration = undefined;
    this.sellQuantity = 0;
    this.percentageChange = 0;
  }

  updatePriceAvg(orderObj) {
    this.buyPrice =
      (this.buyPrice * this.quantity + orderObj.price * orderObj.quantity) /
      (this.quantity + orderObj.quantity);
    this.netInvestment += orderObj.price * orderObj.quantity;
    this.quantity += orderObj.quantity;
  }
  sellTrade(orderObj) {
    if (orderObj.quantity === this.quantity) {
      this.isClosed = true;
      this.profit += Number(
        (
          this.quantity * orderObj.price -
          this.quantity * this.buyPrice
        ).toFixed(0)
      );
      this.isWin = this.profit >= 0;
      this.quantity -= orderObj.quantity;
      this.sellQuantity += orderObj.quantity;
      this.sellTime = orderObj.time;
      this.duration = (this.sellTime.getTime() - this.buyTime.getTime()) / 1000;
      this.pts = Number((this.profit / this.sellQuantity).toFixed(0));
      this.percentageChange = (
        (this.profit * 100) /
        this.netInvestment
      ).toFixed(2);
    } else {
      this.isClosed = false;
      this.profit += Number(
        (
          orderObj.quantity * orderObj.price -
          orderObj.quantity * this.buyPrice
        ).toFixed(0)
      );
      this.quantity -= orderObj.quantity;
      this.sellQuantity += orderObj.quantity;
    }
  }
}

let sleep = (time) => new Promise((res, rej) => setTimeout(() => res(), time));

setTimeout(async () => {
  let showAllBtn = document.querySelector("table td.show-all-col > a");
  if (showAllBtn !== null) {
    showAllBtn.click();
    await sleep(1000);
  }
  let tableEl = document.querySelector("table");
  if (tableEl == null) {
    tradeOverview([]);
    return;
  }
  let allOrdersEl = tableEl.querySelectorAll("tr");
  let allOrders = [];
  for (let i = 0; i < allOrdersEl.length; i++) {
    let order = getOrderData(allOrdersEl[i]);
    if (order) allOrders.push(order);
  }
  allOrders = allOrders.filter((order) => order.status === "COMPLETE");
  allOrders.sort((a, b) => a.time - b.time);

  const allTrades = [];
  for (const order of allOrders) {
    const existingTrade = allTrades.find(
      (trade) => trade.instrument === order.instrument && !trade.isClosed
    );
    if (order.type === "BUY" && existingTrade === undefined) {
      const trade = new Trade(order);
      allTrades.push(trade);
    } else if (order.type === "BUY") {
      existingTrade.updatePriceAvg(order);
    } else if (existingTrade !== undefined) {
      existingTrade.sellTrade(order);
    } else {
      console.log("Ignored order:", order);
    }
  }

  console.log(allTrades);
  tradeOverview(allTrades);
}, 1200);

function getOrderData(rowEl) {
  if (rowEl.classList.contains("show-all-row")) {
    return;
  }
  let quantity = rowEl.querySelector(".quantity").innerText;
  quantity = Number(quantity.split("/")[0].trim());

  let price = rowEl.querySelector(".average-price").innerText;
  if (price.includes("/")) {
    price = price.split("/")[0].trim();
  }
  price = Number(price);
  let timeArr = rowEl.querySelector(".order-timestamp").innerText.split(":");

  let time = new Date();
  time.setHours(timeArr[0]);
  time.setMinutes(timeArr[1]);
  time.setSeconds(timeArr[2]);
  const type = rowEl.querySelector(".transaction-type").innerText;
  const status = rowEl.querySelector(".order-status").innerText;
  let instrument = rowEl.querySelector(".instrument").innerText;
  instrument = instrument.replace(/ NFO /gi, "");
  instrument = instrument.replace(/ w /g, "");
  return { quantity, price, time, type, status, instrument };
}
const cleanTimeStr = (timeStr = "") => {
  let trimmedTime = timeStr.split(" ");
  trimmedTime.pop();
  return trimmedTime.join("");
};
let globalTableRef = null;
function createTradeTable(allTrades = [new Trade({})]) {
  let tableContainer = document.createElement("div");
  globalTableRef = tableContainer;
  tableContainer.classList.add("summary-container");

  let newTable = document.createElement("table");
  newTable.classList.add("summary");
  let tableHeading = document.createElement("thead");
  tableHeading.innerHTML = createHeading();
  newTable.appendChild(tableHeading);
  let tableBody = document.createElement("tbody");

  for (let i = 0; i < allTrades.length; i++) {
    const trade = allTrades[i];
    tableBody.innerHTML += createRow(trade);
  }
  newTable.appendChild(tableBody);
  tableContainer.appendChild(newTable);
  document.body.appendChild(tableContainer);
}

function createTradeSummary(winTrades, loseTrades) {
  let card = document.createElement("div");
  card.classList.add("summary-card");
  if (winTrades.length === 0 && loseTrades.length === 0) {
    card.innerHTML += `<h2>No trades yet.</h2>`;
  } else {
    const winAmount = Number(
      winTrades.reduce((a, b) => a + b.profit, 0).toFixed(2)
    );
    const loseAmount = Number(
      loseTrades.reduce((a, b) => a + b.profit, 0).toFixed(2)
    );
    let netPoints =
      winTrades.reduce((a, b) => a + b.pts, 0) +
      loseTrades.reduce((a, b) => a + b.pts, 0);
    card.innerHTML += `<h2>TRADE SUMMARY</h2>`;
    card.innerHTML += `<h2 class="subheading">Winning Trades</h2>`;
    card.innerHTML += `<p>Trades: ${winTrades.length}, Net Profit: ₹${winAmount}</p>`;
    card.innerHTML += `<p class="success">${(
      winAmount / winTrades.length
    ).toFixed(2)} profit per trade</p>`;
    card.innerHTML += `<hr>`;
    card.innerHTML += `<h2 class="subheading">Losing Trades</h2>`;
    card.innerHTML += `<p>Trades: ${loseTrades.length}, Net Loss: ₹${loseAmount}</p>`;
    card.innerHTML += `<p class="danger">${(
      loseAmount / loseTrades.length
    ).toFixed(2)} loss per trade</p>`;
    card.innerHTML += `<hr>`;
    card.innerHTML += `<h2>Total: ₹${winAmount + loseAmount} (${
      winTrades.length + loseTrades.length
    } trades)</h2>`;
    card.innerHTML += `<h2>Net Points: ${netPoints}</h2>`;
  }
  document.body.appendChild(card);
}

function tradeOverview(allTrades = [new Trade({})]) {
  if (allTrades.length === 0) {
    createTradeSummary([], []);
  }
  let winTrades = [];
  let loseTrades = [];
  for (const trade of allTrades) {
    if (trade.isWin && trade.isClosed) {
      winTrades.push(trade);
    } else if (trade.isClosed && !trade.isWin) {
      loseTrades.push(trade);
    } else {
      console.log("IGNORED", trade);
    }
  }
  createTradeTable(allTrades);
  createTradeSummary(winTrades, loseTrades);
}

function createRow(trade) {
  runningPnL += trade.profit;
  return `
        <tr class="${trade.isWin ? "win" : "loss"}">
            <td>
                ${trade.instrument}
            </td>
            <td>
                ₹${trade.profit}
            </td>
            <td>
                ${trade.pts}
            </td>
            <td>
              ${trade.percentageChange}%
            </td>
            <td>
              ₹${runningPnL}
            </td>
        </tr>
    `;
}

function createHeading() {
  return `
        <tr>
            <th scope="col">Instrument</th>
            <th scope="col">Profit</th>
            <th scope="col">Points</th>
            <th scope="col">% gained</th>
            <th scope="col">PnL Running</th>
        </tr>
    `;
}
// Not functional yet
function hideAll() {
  if (globalTableRef !== null) {
    globalTableRef.remove();
  }
}
