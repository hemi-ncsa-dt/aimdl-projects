/**
 * The one implementation of the tiny markdown subset used for project descriptions.
 *
 * Descriptions are stored as plain markdown text and only rendered to HTML for display,
 * so nothing here ever reaches the database. Supported: bold, italic, line breaks.
 *
 * The output is fed to `v-html`, so the source is HTML-escaped *before* the markdown
 * substitutions run. Without that, a description containing markup would execute when
 * rendered. Keep the escape first if you extend this.
 */

const HTML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] as string);
}

/** Markdown -> safe HTML, for `v-html` in the detail view and the editor preview. */
export function renderMarkdown(markdown: string | undefined | null): string {
    if (!markdown) return '';

    const html = escapeHtml(markdown)
        // Bold: **text** or __text__
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        // Italic: *text* or _text_
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        // Paragraph break, then single line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    return `<p>${html}</p>`;
}

/** Markdown -> one line of plain text, for the truncated list view. */
export function stripMarkdown(markdown: string | undefined | null): string {
    if (!markdown) return '';

    return markdown
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/_(.+?)_/g, '$1')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
