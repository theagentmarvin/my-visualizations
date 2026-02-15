/**
 * Wiki E-Reader Template - App Logic
 * Vanilla JavaScript, no dependencies
 */

(function() {
    'use strict';

    // DOM Elements
    const elements = {
        menuToggle: document.getElementById('menuToggle'),
        navOverlay: document.getElementById('navOverlay'),
        navClose: document.getElementById('navClose'),
        tocContainer: document.getElementById('tocContainer'),
        searchToggle: document.getElementById('searchToggle'),
        searchOverlay: document.getElementById('searchOverlay'),
        searchClose: document.getElementById('searchClose'),
        searchInput: document.getElementById('searchInput'),
        searchResults: document.getElementById('searchResults'),
        themeToggle: document.getElementById('themeToggle'),
        themeIcon: document.getElementById('themeIcon'),
        scrollTop: document.getElementById('scrollTop'),
        progressBar: document.getElementById('progressBar'),
        content: document.getElementById('content'),
        article: document.querySelector('.article')
    };

    // Icons
    const icons = {
        sun: '<path fill="currentColor" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>',
        moon: '<path fill="currentColor" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>'
    };

    // State
    let searchIndex = [];
    let currentHeading = null;

    // ========================================
    // Theme Management
    // ========================================

    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        setTheme(theme);
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        elements.themeIcon.innerHTML = theme === 'dark' ? icons.moon : icons.sun;
        localStorage.setItem('theme', theme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }

    // ========================================
    // Table of Contents
    // ========================================

    function generateTOC() {
        const headings = elements.article.querySelectorAll('h2, h3');
        const toc = document.createDocumentFragment();

        headings.forEach((heading, index) => {
            // Generate ID if not exists
            if (!heading.id) {
                heading.id = 'section-' + index;
            }

            const link = document.createElement('a');
            link.href = '#' + heading.id;
            link.textContent = heading.textContent;
            link.className = heading.tagName.toLowerCase() === 'h3' ? 'toc-h3' : '';
            link.dataset.target = heading.id;
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                closeNav();
                heading.scrollIntoView({ behavior: 'smooth' });
                history.pushState(null, null, '#' + heading.id);
            });

            toc.appendChild(link);
        });

        elements.tocContainer.innerHTML = '';
        elements.tocContainer.appendChild(toc);
    }

    function updateActiveHeading() {
        const headings = elements.article.querySelectorAll('h2, h3');
        const scrollPos = window.scrollY + 100;
        let activeHeading = null;

        headings.forEach(heading => {
            if (heading.offsetTop <= scrollPos) {
                activeHeading = heading;
            }
        });

        if (activeHeading !== currentHeading) {
            currentHeading = activeHeading;
            
            // Update TOC links
            elements.tocContainer.querySelectorAll('a').forEach(link => {
                link.classList.remove('active');
                if (activeHeading && link.dataset.target === activeHeading.id) {
                    link.classList.add('active');
                    link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }
    }

    // ========================================
    // Navigation
    // ========================================

    function openNav() {
        elements.navOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        elements.navOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    // ========================================
    // Search
    // ========================================

    function buildSearchIndex() {
        const sections = elements.article.querySelectorAll('section, .article-header');
        searchIndex = [];

        sections.forEach(section => {
            const heading = section.querySelector('h1, h2, h3');
            const text = section.textContent;
            
            if (heading) {
                searchIndex.push({
                    id: heading.id || section.id,
                    title: heading.textContent,
                    content: text.substring(0, 200) + '...',
                    fullText: text.toLowerCase()
                });
            }
        });
    }

    function openSearch() {
        elements.searchOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        elements.searchInput.value = '';
        elements.searchInput.focus();
        elements.searchResults.innerHTML = '';
    }

    function closeSearch() {
        elements.searchOverlay.classList.remove('open');
        document.body.style.overflow = '';
        elements.searchInput.value = '';
        elements.searchResults.innerHTML = '';
    }

    function performSearch(query) {
        if (!query.trim()) {
            elements.searchResults.innerHTML = '';
            return;
        }

        const normalizedQuery = query.toLowerCase();
        const results = searchIndex.filter(item => 
            item.fullText.includes(normalizedQuery)
        );

        displaySearchResults(results, query);
    }

    function displaySearchResults(results, query) {
        elements.searchResults.innerHTML = '';

        if (results.length === 0) {
            elements.searchResults.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No results found</p>';
            return;
        }

        const fragment = document.createDocumentFragment();

        results.forEach(result => {
            const div = document.createElement('div');
            div.className = 'search-result';
            
            // Highlight query in content preview
            const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
            const highlightedContent = result.content.replace(regex, '<span class="highlight">$1</span>');
            
            div.innerHTML = `
                <h4>${escapeHtml(result.title)}</h4>
                <p>${highlightedContent}</p>
            `;
            
            div.addEventListener('click', () => {
                closeSearch();
                const target = document.getElementById(result.id);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    history.pushState(null, null, '#' + result.id);
                }
            });

            fragment.appendChild(div);
        });

        elements.searchResults.appendChild(fragment);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ========================================
    // Scroll Progress & Top Button
    // ========================================

    function updateProgressBar() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        elements.progressBar.style.width = progress + '%';
    }

    function updateScrollTop() {
        if (window.scrollY > 300) {
            elements.scrollTop.classList.add('visible');
        } else {
            elements.scrollTop.classList.remove('visible');
        }
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ========================================
    // Event Listeners
    // ========================================

    function initEventListeners() {
        // Theme
        elements.themeToggle.addEventListener('click', toggleTheme);

        // Navigation
        elements.menuToggle.addEventListener('click', openNav);
        elements.navClose.addEventListener('click', closeNav);
        elements.navOverlay.addEventListener('click', (e) => {
            if (e.target === elements.navOverlay) closeNav();
        });

        // Search
        elements.searchToggle.addEventListener('click', openSearch);
        elements.searchClose.addEventListener('click', closeSearch);
        elements.searchOverlay.addEventListener('click', (e) => {
            if (e.target === elements.searchOverlay) closeSearch();
        });
        elements.searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });

        // Scroll
        elements.scrollTop.addEventListener('click', scrollToTop);
        
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateProgressBar();
                    updateActiveHeading();
                    updateScrollTop();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC to close overlays
            if (e.key === 'Escape') {
                closeNav();
                closeSearch();
            }
            
            // Cmd/Ctrl + K to open search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                openSearch();
            }
        });

        // Handle hash on load
        if (window.location.hash) {
            const target = document.querySelector(window.location.hash);
            if (target) {
                setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }

    // ========================================
    // Initialization
    // ========================================

    function init() {
        initTheme();
        generateTOC();
        buildSearchIndex();
        initEventListeners();
        updateProgressBar();
        updateActiveHeading();
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
