import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Custom Markdown renderer for research reports
 * Extends marked with e-reader specific features
 */

class MarkdownRenderer {
  constructor() {
    this.footnotes = new Map();
    this.footnoteIndex = 0;
    this.setupRenderer();
  }

  setupRenderer() {
    const renderer = new marked.Renderer();
    
    // Custom heading renderer with anchor IDs
    renderer.heading = (text, level, raw) => {
      const id = this.slugify(raw);
      const className = `heading-${level}`;
      return `<h${level} id="${id}" class="${className}">${text}</h${level}>`;
    };

    // Custom link renderer
    renderer.link = (href, title, text) => {
      // Handle footnote references like [s1], [1], etc.
      if (href.startsWith('#')) {
        return `<a href="${href}" class="footnote-ref" data-ref="${href.slice(1)}">${text}</a>`;
      }
      
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    };

    // Custom image renderer
    renderer.image = (href, title, text) => {
      const titleAttr = title ? ` title="${title}"` : '';
      const altAttr = text ? ` alt="${text}"` : '';
      return `<figure><img src="${href}"${altAttr}${titleAttr} loading="lazy"><figcaption>${text}</figcaption></figure>`;
    };

    // Custom paragraph renderer to handle footnote definitions
    renderer.paragraph = (text) => {
      // Check for footnote definitions like [1]: or [s1]:
      const footnoteMatch = text.match(/^\[(\w+)\]:\s*(.+)$/);
      if (footnoteMatch) {
        const [, ref, content] = footnoteMatch;
        this.footnotes.set(ref, {
          index: ++this.footnoteIndex,
          content: content
        });
        return ''; // Don't render footnote definitions in content
      }
      return `<p>${text}</p>`;
    };

    // Custom table renderer
    renderer.table = (header, body) => {
      return `<div class="table-wrapper"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
    };

    // Custom blockquote renderer
    renderer.blockquote = (quote) => {
      return `<blockquote>${quote}</blockquote>`;
    };

    marked.setOptions({
      renderer: renderer,
      gfm: true,
      breaks: false,
      headerIds: true,
      sanitize: false,
      smartLists: true,
      smartypants: true,
      xhtml: false
    });
  }

  /**
   * Convert text to URL-friendly slug
   */
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Parse footnotes from markdown content
   */
  parseFootnotes(content) {
    this.footnotes.clear();
    this.footnoteIndex = 0;
    
    // Find all footnote definitions
    const footnoteRegex = /^\[(\w+)\]:\s*(.+)$/gm;
    let match;
    while ((match = footnoteRegex.exec(content)) !== null) {
      const [, ref, text] = match;
      if (!this.footnotes.has(ref)) {
        this.footnotes.set(ref, {
          index: this.footnotes.size + 1,
          content: text
        });
      }
    }
    
    return this.footnotes;
  }

  /**
   * Process footnote references in content
   */
  processFootnoteRefs(content) {
    // Replace [ref] with superscript links (but not definitions)
    return content.replace(/\[(\w+)\](?!:)/g, (match, ref) => {
      if (this.footnotes.has(ref)) {
        const footnote = this.footnotes.get(ref);
        return `<a href="#footnote-${ref}" class="footnote-ref" data-ref="${ref}">${footnote.index}</a>`;
      }
      return match;
    });
  }

  /**
   * Render markdown to HTML
   */
  render(markdown) {
    // First pass: identify footnotes
    this.parseFootnotes(markdown);
    
    // Remove footnote definitions from content
    let cleanMarkdown = markdown.replace(/^\[\w+\]:\s*.+$/gm, '');
    
    // Process footnote references
    cleanMarkdown = this.processFootnoteRefs(cleanMarkdown);
    
    // Parse markdown
    let html = marked.parse(cleanMarkdown);
    
    // Sanitize HTML
    html = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'ul', 'ol', 'li',
        'strong', 'em', 'b', 'i', 'u', 'strike', 'del',
        'a', 'img', 'figure', 'figcaption',
        'blockquote', 'code', 'pre',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel', 'id', 'class',
        'src', 'alt', 'loading', 'data-ref'
      ]
    });
    
    return {
      html,
      footnotes: this.footnotes
    };
  }

  /**
   * Extract table of contents from markdown
   */
  extractTOC(markdown) {
    const toc = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    
    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = this.slugify(text);
      
      toc.push({
        level,
        text,
        id
      });
    }
    
    return toc;
  }

  /**
   * Get footnotes HTML
   */
  getFootnotesHTML() {
    if (this.footnotes.size === 0) return '';
    
    const items = Array.from(this.footnotes.entries())
      .sort((a, b) => a[1].index - b[1].index)
      .map(([ref, footnote]) => `
        <div class="footnote-item" id="footnote-${ref}">
          <span class="footnote-number">${footnote.index}</span>
          <span class="footnote-content">${footnote.content}</span>
        </div>
      `).join('');
    
    return items;
  }
}

export default MarkdownRenderer;