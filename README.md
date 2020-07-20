# Snippets
### Saves snippets of text for later pasting into messages

Snippets was created during the course of an investigation of [MailExtensions APIs](https://thunderbird-webextensions.readthedocs.io/en/latest/index.html) for reading and modifying message composer content, IndexedDB support, ability to add menu items to the message composer context menu, opening extension pages in popup windows, and using experimental APIs.  The goal is to use this knowledge to port [Clippings for Thunderbird](https://github.com/aecreations/clippings-tb) to a MailExtension.

Requires Thunderbird 78 beta 4 or newer, available from the [Thunderbird website](https://www.thunderbird.net/).

### Features

- Snippets popup window from where you can create, edit, delete and rearrange snippets, as well as select a snippet to insert into a message. To open it, click the Snippets icon in the message composer toolbar
- Create a snippet from selected text in the message composer
- Insert a snippet as rich text if it contains HTML tags
- Placeholders for date and time
- Import/export snippets to/from a CSV file

### Things You Should Know About

On first run, Snippets will detect if there is a Clippings backup JSON data file (clippings.json) in the Clippings data folder (by default, this is the Thunderbird profile folder).  It doesn't do anything with it other than report basic file properties to the debugging console.

### Known Issues

See the [list of issues](https://github.com/aecreations/snippets/issues) for an up-to-date list of bugs and enhancement requests.

### How To Get It

1. Click [Releases](https://github.com/aecreations/snippets/releases) at the top.
2. Look for the latest release in the list and download the XPI file.
3. Launch Thunderbird, then click the Thunderbird menu button, and then select Add-ons.
4. Click the gear icon at the top-right corner and then select Install Add-on From File.
5. Locate the downloaded XPI file and then click Open.
6. Follow the prompts to finish the installation.

### To Do

- Keyboard shortcut in the message composer to display the Snippets popup window
- [DONE] ~~Extension pref UI for HTML insert mode (as rich text, or with HTML tags)~~
- [DONE] ~~Detect Clippings JSON file in a user-specified folder location (read the Clippings user pref `extensions.aecreations.clippings.datasource.location` and check for non-empty folder path)~~
- [DONE] ~~Move all UI strings into messages.json~~
- Show all snippets in a Snippets context menu in the message composer
- Replace generic extension icon
- [DONE] ~~A better popup window, with the unnecessary browser navigation toolbar removed~~
