# Snippets
### Save snippets of text for later pasting into messages

Snippets was created during the course of an investigation of [MailExtensions APIs](https://thunderbird-webextensions.readthedocs.io/en/latest/index.html) for reading and modifying message composer content, IndexedDB support, ability to add menu items to the message composer context menu, opening extension pages in popup windows, and using experimental APIs.  The goal is to use this knowledge to port [Clippings for Thunderbird](https://github.com/aecreations/clippings-tb) to a MailExtension.

Requires Thunderbird 77 beta 3 or newer.

### Features

- Create a snippet from selected text in the message composer
- Snippets popup window from where you can select a snippet to insert into a message, as well as create, delete and rearrange snippets
- Insert a snippet as rich text if it contains HTML tags

### Things You Should Know About

On first run, Snippets will detect if there is a Clippings backup JSON data file (clippings.json) in the Thunderbird user profile folder.  It currently won't do anything with it other than report basic file properties to the debugging console.

### Known Issues

The user interface is very minimal and rather awkward to use, due to missing capabilities such as adding to the message composer context menu.  As this is a proof-of-concept MailExtension, expect numerous bugs and gaps in functionality.  See the [list of issues](https://github.com/aecreations/snippets/issues) for an up-to-date list.

### To Do

- Edit a snippet
- Export snippets to a Clippings 6 JSON file
- Keyboard shortcut in the message composer to display the Snippets popup window
- Placeholders for date, time, and snippet name
- Show all snippets in a Snippets context menu in the message composer - if this still isn't possible in Thunderbird 78 ESR, then put the UI in a compose action popup
- Move all UI strings into messages.json
- Replace generic extension icon
- A better popup window, with the unnecessary browser navigation toolbar removed
