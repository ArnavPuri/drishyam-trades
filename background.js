
/* A function creator for callbacks */
function printJobs(jobs) {
  console.log("elements", jobs);
  console.log(jobs.map(job => job.link))
  console.log(jobs.filter(job => job.ratingValue > 30));
}

/* When the browser-action button is clicked... */
chrome.action.onClicked.addListener(function (tab) {
  chrome.tabs.sendMessage(tab.id, { text: "report_back" }, printJobs);
});
