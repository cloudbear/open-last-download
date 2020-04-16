/**
 * Searches the download manager for the most recently started
 * download that is complete and where the file exists, then
 * puts the ID of that download in mostRecentDownload.
 * 
 * We have to use startTime instead of endTime because endTime
 * seems to be always null.
 */
async function search() {
  const searchQuery = {
    "orderBy": ['-startTime'],
    "limit": 1,
    "exists": true,
    "state": "complete",
  }

  let foundDownload = await browser.downloads.search(searchQuery)
      .then((result) => {
        let filepath = result[0].filename.split('\\');
        let filename = filepath[filepath.length-1];
        console.log(`Search result: newest download is ID#${result[0].id}: ${filename} from ${result[0].url}`);
        return result[0].id;
      });
  
  console.log(`search() found ${foundDownload}`);
  mostRecentDownload = foundDownload;
}

/**
 * Activated when a property of a download changes.
 * 
 * We check that "state" has changed and that it is now "complete".
 * If those conditions are met, we set mostRecentDownload to the
 * ID of the download.
 */
browser.downloads.onChanged.addListener((download) => {
  console.log(download);
  if ("state" in download) {
    if ("complete" === download.state.current) {
      mostRecentDownload = download.id;
    }
  }
})

/**
 * Listens for commands sent to the extension.
 * We only have one command right now, so we return early if
 * that command isn't what was sent.
 * 
 * Opens the download with the ID stored in mostRecentDownload.
 * 
 * If the download cannot be opened, it erases it from the
 * downloads list and runs search() again.
 */
browser.commands.onCommand.addListener((commandName) => {
  if ("open-last-download" !== commandName) {
    return;
  }

  console.log(commandName + " received!");

  if (mostRecentDownload) {
    console.log(`Opening download with id ${mostRecentDownload}.`)
    browser.downloads.open(mostRecentDownload)
        .catch(() => {
          browser.downloads.erase({"id": mostRecentDownload})
             .then(() => search());
        });
  } else {
    console.log(`No download to open.`);
  }
})

let mostRecentDownload = null;
search();