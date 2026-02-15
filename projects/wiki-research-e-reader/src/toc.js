/**
 * Table of Contents Module
 * Manages TOC generation and navigation
 */

class TableOfContents {
  constructor(containerId, navId) {
    this.container = document.getElementById(containerId);
    this.nav = document.getElementById(navId);
    this.toggleBtn = document.getElementById('toc-toggle');
    this.closeBtn = document.getElementById('toc-close');
    this.overlay = document.getElementById('toc-overlay');
    this.tocData = [];
    
    this.init();
  }

  init() {
    // Event listeners
    this.toggleBtn?.addEventListener('click', () => this.open());
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });

    // Update active section on scroll
    window.addEventListener('scroll', this.throttle(() => {
      this.updateActiveSection();
    }, 100));
  }

  /**
   * Generate TOC from heading data
   */
  generate(tocData) {
    this.tocData = tocData;
    
    if (!this.nav || tocData.length === 0) return;
    
    const ul = document.createElement('ul');
    
    tocData.forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      
      a.href = `#${item.id}`;
      a.textContent = item.text;
      a.className = `toc-h${item.level}`;
      a.dataset.target = item.id;
      
      a.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(item.id);
      });
      
      li.appendChild(a);
      ul.appendChild(li);
    });
    
    this.nav.innerHTML = '';
    this.nav.appendChild(ul);
  }

  /**
   * Navigate to a section
   */
  navigateTo(id) {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Close sidebar on mobile
      if (window.innerWidth < 1200) {
        this.close();
      }
    }
  }

  /**
   * Update active section based on scroll position
   */
  updateActiveSection() {
    const scrollPos = window.scrollY + 100;
    let activeId = null;
    
    // Find the current section
    for (const item of this.tocData) {
      const element = document.getElementById(item.id);
      if (element && element.offsetTop <= scrollPos) {
        activeId = item.id;
      }
    }
    
    // Update active class
    this.nav?.querySelectorAll('a').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.target === activeId) {
        link.classList.add('active');
      }
    });
  }

  /**
   * Open TOC sidebar
   */
  open() {
    this.container?.classList.add('open');
    this.overlay?.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close TOC sidebar
   */
  close() {
    this.container?.classList.remove('open');
    this.overlay?.classList.remove('visible');
    document.body.style.overflow = '';
  }

  /**
   * Throttle function for scroll events
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

export default TableOfContents;