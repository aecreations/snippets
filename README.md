# Snippets
### Saves snippets of text for later pasting into messages

Snippets was created during the course of an investigation of [MailExtensions APIs](https://thunderbird-webextensions.readthedocs.io/en/latest/index.html) for reading and modifying message composer content, IndexedDB support, ability to add menu items to the message composer context menu, opening extension pages in popup windows, and using experimental APIs.  The goal is to use this knowledge to port [Clippings for Thunderbird](https://github.com/aecreations/clippings-tb) to a MailExtension.

Requires Thunderbird 78 beta 4 or newer, available from the [Thunderbird website](https://www.thunderbird.net/).

### Features

- Snippets popup window from where you can create, edit, delete and rearrange snippets, as well as select a snippet to insert into a message. To open it, click the Snippets icon in the message composer toolbar
- Create a snippet from selected text in the message composer
- Insert a snippet as rich text if it contains HTML tags
- Import/export snippets to/from a CSV file

### Things You Should Know About

On first run, Snippets will detect if there is a Clippings backup JSON data file (clippings.json) in the Thunderbird user profile folder.  It currently won't do anything with it other than report basic file properties to the debugging console.

### Known Issues

The user interface is very minimal and rather awkward to use, due to missing capabilities such as adding to the message composer context menu.  As this is a proof-of-concept MailExtension, expect numerous bugs and gaps in functionality.  See the [list of issues](https://github.com/aecreations/snippets/issues) for an up-to-date list.

### How To Get It

1. Click [Releases](https://github.com/aecreations/snippets/releases) at the top.
2. Look for the latest release in the list and download the zip file.
3. Open the zip file and unzip it to a location on your system.
4. Launch Thunderbird, open Add-ons Manager, then click the gear icon and select "Debug Add-ons".
5. Click "Load Temporary Add-on" and select the file named "manifest.json" in the folder where the zip file was unzipped.

**Notes:**
- Snippets will only be loaded for the duration of your Thunderbird session, and will uninstall itself automatically when quitting (but the data will be saved unless you removed Snippets from the Thunderbird Debugging tab).  You will need to repeat step 5 above to reload Snippets when Thunderbird is started again.
- Do _not_ attempt to add Snippets to Thunderbird by installing the zip file from Add-ons Manager!  There is currently a bug in Thunderbird where an extension won't uninstall itself from Add-ons Manager.  NOTE: This bug may have been fixed in Thunderbird 78 beta 4.

### To Do

- Keyboard shortcut in the message composer to display the Snippets popup window
- [DONE] ~~Extension pref UI for HTML insert mode (as rich text, or with HTML tags)~~
- Placeholders for date, time, and snippet name
- Detect Clippings JSON file in a user-specified folder location (read the Clippings user pref `extensions.aecreations.clippings.datasource.location` and check for non-empty folder path)
- Move all UI strings into messages.json
- Show all snippets in a Snippets context menu in the message composer
- Replace generic extension icon
- [DONE] ~~A better popup window, with the unnecessary browser navigation toolbar removed~~
