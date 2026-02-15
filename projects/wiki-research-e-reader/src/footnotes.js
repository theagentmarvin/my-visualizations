/**
 * Footnotes Manager Module
 * Handles footnote display and interactions
 */

class FootnotesManager {
  constructor() {
    this.panel = document.getElementById('footnotes-panel');
    this.content = document.getElementById('footnotes-content');
    this.closeBtn = document.getElementById('footnotes-close');
    this.isOpen = false;
    
    this.init();
  }

  init() {
    this.closeBtn?.addEventListener('click', () => this.close());
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Set footnotes content
   */
  setFootnotes(footnotesMap) {
    if (!this.content) return;
    
    if (footnotesMap.size === 0) {
      this.content.innerHTML = '<p class="empty-footnotes">No footnotes in this document.</p>';
      return;
    }
    
    const items = Array.from(footnotesMap.entries())
      .sort((a, b) => a[1].index - b[1].index)
      .map(([ref, footnote]) => `
        <div class="footnote-item" id="footnote-${ref}">
          <span class="footnote-number">${footnote.index}</span>
          <span class="footnote-content">${this.renderFootnoteContent(footnote.content)}</span>
        </div>
      `).join('');
    
    this.content.innerHTML = items;
  }

  /**
   * Render footnote content with link support
   */
  renderFootnoteContent(content) {
    // Convert URLs to links
    return content
      .replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  /**
   * Open footnotes panel
   */
  open() {
    this.panel?.classList.add('open');
    this.isOpen = true;
  }

  /**
   * Close footnotes panel
   */
  close() {
    this.panel?.classList.remove('open');
    this.isOpen = false;
  }

  /**
   * Toggle footnotes panel
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Scroll to specific footnote
   */
  scrollTo(ref) {
    this.open();
    
    setTimeout(() => {
      const element = document.getElementById(`footnote-${ref}`);
      if (element && this.content) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight');
        setTimeout(() => element.classList.remove('highlight'), 2000);
      }
    }, 100);
  }
}

export default FootnotesManager;