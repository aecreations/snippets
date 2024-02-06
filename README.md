# Snippets
### Saves snippets of text for later pasting into Thunderbird messages

Snippets was created during the course of an investigation of
Thunderbird [MailExtensions APIs](https://thunderbird-webextensions.readthedocs.io/en/latest/index.html) for reading and modifying message composer content, IndexedDB support, ability to add menu items to the message composer context menu, opening extension pages in popup windows, and using experimental APIs (in version 1.0).  The goal is to use this knowledge to port [Clippings for Thunderbird](https://github.com/aecreations/clippings-tb) to a MailExtension.

Requires Thunderbird 115.0 or newer, available from the [Thunderbird website](https://www.thunderbird.net/).

**N.B.:** This Thunderbird extension was created for research purposes only - not intended for regular everyday use.  No end-user support is available.

### Features

- Snippets popup window from where you can create, edit, delete and rearrange snippets, as well as select a snippet to insert into a message. To open it, click the Snippets icon in the message composer toolbar
- Create a snippet from selected text in the message composer
- Insert a snippet as rich text if it contains HTML tags
- Placeholders for date and time
- Import/export snippets to/from a CSV file

### Known Issues

See the [list of issues](https://github.com/aecreations/snippets/issues) for an up-to-date list of bugs and limitations.
