# Markdown Support in Project Descriptions

## Overview

The project description field now supports rich text formatting using Markdown syntax. The description is stored as plain text in MongoDB, making it safe for serialization while allowing rich formatting in the UI.

## Supported Formatting

### Bold Text
- **Syntax:** `**text**` or `__text__`
- **Example:** `**Important information**` renders as **Important information**

### Italic Text
- **Syntax:** `*text*` or `_text_`
- **Example:** `*emphasis*` renders as *emphasis*

### Line Breaks
- **Single line break:** Press Enter once for a line break (`<br>`)
- **Paragraph break:** Press Enter twice for a new paragraph (`<p>`)

## Usage

### In the Editor
1. Navigate to the edit view for a proposal
2. The description field now has two tabs:
   - **Edit:** Write your description with markdown syntax
   - **Preview:** See how your formatted text will appear

### Toolbar Buttons
- **B** button: Wraps selected text in bold formatting (`**text**`)
- **I** button: Wraps selected text in italic formatting (`*text*`)

## Technical Details

### Storage
- Descriptions are stored as plain text strings in MongoDB
- Markdown syntax characters (`*`, `**`, etc.) are preserved in the database
- No HTML is stored in the database

### Rendering
- Plain markdown text is converted to HTML only when displayed
- List views strip markdown formatting for clean display
- Detail views render full HTML with formatting
- All rendering goes through `src/utils/markdown.ts` — one implementation, used by the
  detail view, the editor preview and the list view

### Safety
The rendered HTML is injected with `v-html`, so `renderMarkdown()` HTML-escapes the
stored text **before** applying the bold/italic/line-break substitutions. Any markup a
user types is therefore displayed as literal text rather than executed. If you extend
the supported syntax, keep the escape step first or move to a real sanitizer.

### MongoDB Safety
The markdown text is completely safe for MongoDB storage because:
1. It's stored as plain text (string type)
2. No special characters that could affect MongoDB queries
3. Standard JSON serialization/deserialization works without modification
4. No embedded objects or arrays in the description field
