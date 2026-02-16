/**
 * WikiReader - Mobile-First E-Reader Template
 * JavaScript functionality for enhanced reading experience
 */

(function() {
    'use strict';

    // ============================================
    // State Management
    // ============================================
    const state = {
        theme: localStorage.getItem('wiki-reader-theme') || 'auto',
        sidebarOpen: false,
        searchOpen: false,
        searchQuery: '',
        searchResults: [],
        currentResultIndex: -1,
        readingProgress: 0
    };

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        body: document.body,
        header: document.getElementById('header'),
        menuToggle: document.getElementById('menuToggle'),
        sidebar: document.getElementById('sidebar'),
        sidebarClose: document.getElementById('sidebarClose'),
        sidebarOverlay: document.getElementById('sidebarOverlay'),
        toc: document.getElementById('toc'),
        themeToggle: document.getElementById('themeToggle'),
        searchToggle: document.getElementById('searchToggle'),
        searchBar: document.getElementById('searchBar'),
        searchClose: document.getElementById('searchClose'),
        searchInput: document.getElementById('searchInput'),
        searchResults: document.getElementById('searchResults'),
        progressBar: document.getElementById('progressBar'),
        scrollTop: document.getElementById('scrollTop'),
        footnotePopup: document.getElementById('footnotePopup'),
        footnotePopupText: document.querySelector('.footnote-popup-text'),
        footnotePopupLink: document.querySelector('.footnote-popup-link'),
        footnotePopupClose: document.querySelector('.footnote-popup-close'),
        toast: document.getElementById('toast'),
        article: document.getElementById('article'),
        articleBody: document.getElementById('articleBody')
    };

    // ============================================
    // Theme Management
    // ============================================
    function initTheme() {
        applyTheme(state.theme);
        elements.themeToggle.addEventListener('click', toggleTheme);
    }

    function applyTheme(theme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = theme === 'dark' || (theme === 'auto' && prefersDark);
        
        elements.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('wiki-reader-theme', theme);
        state.theme = theme;
    }

    function toggleTheme() {
        const currentTheme = state.theme;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = currentTheme === 'dark' || (currentTheme === 'auto' && prefersDark);
        
        const newTheme = isDark ? 'light' : 'dark';
        applyTheme(newTheme);
    }

    // ============================================
    // Sidebar / TOC Management
    // ============================================
    function initSidebar() {
        generateTOC();
        
        elements.menuToggle.addEventListener('click', toggleSidebar);
        elements.sidebarClose.addEventListener('click', closeSidebar);
        elements.sidebarOverlay.addEventListener('click', closeSidebar);
        
        // Close sidebar on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.sidebarOpen) {
                closeSidebar();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                closeSidebar();
            }
        });
    }

    function generateTOC() {
        const headings = elements.articleBody.querySelectorAll('h2, h3');
        const tocList = document.createElement('ul');
        
        headings.forEach((heading, index) => {
            // Ensure heading has an ID
            if (!heading.id) {
                heading.id = `section-${index}`;
            }
            
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${heading.id}`;
            link.textContent = heading.textContent;
            link.className = heading.tagName.toLowerCase() === 'h2' ? 'toc-h2' : 'toc-h3';
            link.dataset.target = heading.id;
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                closeSidebar();
                smoothScrollTo(heading);
            });
            
            listItem.appendChild(link);
            tocList.appendChild(listItem);
        });
        
        elements.toc.innerHTML = '';
        elements.toc.appendChild(tocList);
    }

    function toggleSidebar() {
        state.sidebarOpen = !state.sidebarOpen;
        elements.sidebar.classList.toggle('open', state.sidebarOpen);
        elements.sidebarOverlay.classList.toggle('active', state.sidebarOpen);
        elements.menuToggle.setAttribute('aria-expanded', state.sidebarOpen);
        elements.body.style.overflow = state.sidebarOpen ? 'hidden' : '';
    }

    function closeSidebar() {
        state.sidebarOpen = false;
        elements.sidebar.classList.remove('open');
        elements.sidebarOverlay.classList.remove('active');
        elements.menuToggle.setAttribute('aria-expanded', 'false');
        elements.body.style.overflow = '';
    }

    // ============================================
    // Search Functionality
    // ============================================
    function initSearch() {
        elements.searchToggle.addEventListener('click', openSearch);
        elements.searchClose.addEventListener('click', closeSearch);
        elements.searchInput.addEventListener('input', debounce(handleSearch, 150));
        elements.searchInput.addEventListener('keydown', handleSearchKeydown);
        
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + K to open search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                openSearch();
            }
            // Escape to close search
            if (e.key === 'Escape' && state.searchOpen) {
                closeSearch();
            }
        });
    }

    function openSearch() {
        state.searchOpen = true;
        elements.searchBar.classList.add('active');
        elements.searchInput.focus();
        elements.body.style.overflow = 'hidden';
    }

    function closeSearch() {
        state.searchOpen = false;
        elements.searchBar.classList.remove('active');
        elements.searchInput.value = '';
        elements.searchResults.innerHTML = '';
        elements.body.style.overflow = '';
        state.currentResultIndex = -1;
    }

    function handleSearch(e) {
        const query = e.target.value.trim().toLowerCase();
        
        if (query.length < 2) {
            elements.searchResults.innerHTML = '';
            state.searchResults = [];
            state.currentResultIndex = -1;
            return;
        }
        
        state.searchQuery = query;
        performSearch(query);
    }

    function performSearch(query) {
        const contentElements = elements.articleBody.querySelectorAll('p, h2, h3, li, td');
        const results = [];
        
        contentElements.forEach((el, index) => {
            const text = el.textContent.toLowerCase();
            if (text.includes(query)) {
                const preview = getSearchPreview(el.textContent, query);
                const heading = findNearestHeading(el);
                
                results.push({
                    element: el,
                    heading: heading,
                    preview: preview,
                    index: index
                });
            }
        });
        
        state.searchResults = results;
        renderSearchResults(results, query);
    }

    function getSearchPreview(text, query) {
        const maxLength = 120;
        const queryIndex = text.toLowerCase().indexOf(query);
        let start = Math.max(0, queryIndex - 40);
        let end = Math.min(text.length, queryIndex + query.length + 40);
        
        if (start > 0) start = text.indexOf(' ', start) + 1 || start;
        if (end < text.length) end = text.lastIndexOf(' ', end);
        
        let preview = text.slice(start, end);
        if (start > 0) preview = '...' + preview;
        if (end < text.length) preview = preview + '...';
        
        return preview;
    }

    function findNearestHeading(element) {
        let el = element;
        while (el && el !== elements.articleBody) {
            if (el.tagName === 'H2' || el.tagName === 'H3') {
                return el.textContent;
            }
            el = el.previousElementSibling || el.parentElement;
        }
        return 'Document';
    }

    function renderSearchResults(results, query) {
        if (results.length === 0) {
            elements.searchResults.innerHTML = `
                <div class="search-no-results">
                    No results found for "${escapeHtml(query)}"
                </div>
            `;
            return;
        }
        
        const html = results.map((result, index) => {
            const highlightedPreview = highlightText(result.preview, query);
            return `
                <div class="search-result-item" data-index="${index}">
                    <h4>${escapeHtml(result.heading)}</h4>
                    <p>${highlightedPreview}</p>
                </div>
            `;
        }).join('');
        
        elements.searchResults.innerHTML = html;
        
        // Add click handlers
        elements.searchResults.querySelectorAll('.search-result-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                navigateToSearchResult(index);
            });
        });
    }

    function highlightText(text, query) {
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        return escapeHtml(text).replace(regex, '<mark>$1</mark>');
    }

    function handleSearchKeydown(e) {
        if (!state.searchResults.length) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            state.currentResultIndex = (state.currentResultIndex + 1) % state.searchResults.length;
            updateSearchSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            state.currentResultIndex = state.currentResultIndex <= 0 
                ? state.searchResults.length - 1 
                : state.currentResultIndex - 1;
            updateSearchSelection();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (state.currentResultIndex >= 0) {
                navigateToSearchResult(state.currentResultIndex);
            } else if (state.searchResults.length > 0) {
                navigateToSearchResult(0);
            }
        }
    }

    function updateSearchSelection() {
        const items = elements.searchResults.querySelectorAll('.search-result-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === state.currentResultIndex);
        });
        
        const selected = items[state.currentResultIndex];
        if (selected) {
            selected.scrollIntoView({ block: 'nearest' });
        }
    }

    function navigateToSearchResult(index) {
        const result = state.searchResults[index];
        if (result) {
            closeSearch();
            smoothScrollTo(result.element);
            // Highlight the element briefly
            result.element.style.backgroundColor = 'var(--accent-light)';
            setTimeout(() => {
                result.element.style.backgroundColor = '';
            }, 2000);
        }
    }

    // ============================================
    // Reading Progress
    // ============================================
    function initReadingProgress() {
        updateReadingProgress();
        window.addEventListener('scroll', throttle(updateReadingProgress, 50));
    }

    function updateReadingProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        
        state.readingProgress = progress;
        elements.progressBar.style.width = `${progress}%`;
        
        // Update TOC active state
        updateTOCHighlight();
    }

    function updateTOCHighlight() {
        const headings = elements.articleBody.querySelectorAll('h2, h3');
        const scrollPos = window.scrollY + 100;
        
        let currentHeading = null;
        headings.forEach(heading => {
            if (heading.offsetTop <= scrollPos) {
                currentHeading = heading;
            }
        });
        
        elements.toc.querySelectorAll('a').forEach(link => {
            link.classList.remove('active');
            if (currentHeading && link.dataset.target === currentHeading.id) {
                link.classList.add('active');
            }
        });
    }

    // ============================================
    // Scroll to Top
    // ============================================
    function initScrollTop() {
        elements.scrollTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        window.addEventListener('scroll', throttle(() => {
            const show = window.scrollY > 500;
            elements.scrollTop.classList.toggle('visible', show);
        }, 100));
    }

    // ============================================
    // Footnotes
    // ============================================
    function initFootnotes() {
        const footnoteRefs = elements.articleBody.querySelectorAll('.footnote-ref');
        
        footnoteRefs.forEach(ref => {
            ref.addEventListener('click', (e) => {
                e.preventDefault();
                const footnoteId = ref.getAttribute('href').slice(1);
                showFootnotePopup(footnoteId, ref);
            });
        });

        elements.footnotePopupClose.addEventListener('click', hideFootnotePopup);
        
        document.addEventListener('click', (e) => {
            if (!elements.footnotePopup.contains(e.target) && 
                !e.target.classList.contains('footnote-ref')) {
                hideFootnotePopup();
            }
        });
    }

    function showFootnotePopup(footnoteId, refElement) {
        const footnote = document.getElementById(footnoteId);
        if (!footnote) return;
        
        const content = footnote.querySelector('p') || footnote;
        elements.footnotePopupText.innerHTML = content.innerHTML;
        elements.footnotePopupLink.href = `#${footnoteId}`;
        
        elements.footnotePopup.classList.add('active');
        elements.footnotePopup.setAttribute('aria-hidden', 'false');
        
        // Auto-hide after 8 seconds
        setTimeout(hideFootnotePopup, 8000);
    }

    function hideFootnotePopup() {
        elements.footnotePopup.classList.remove('active');
        elements.footnotePopup.setAttribute('aria-hidden', 'true');
    }

    // ============================================
    // Share & Print
    // ============================================
    function initShareButtons() {
        const shareButtons = document.querySelectorAll('.share-btn');
        
        shareButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                
                if (action === 'copy') {
                    copyToClipboard(window.location.href);
                    showToast('Link copied to clipboard');
                } else if (action === 'print') {
                    window.print();
                }
            });
        });
    }

    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }

    function showToast(message) {
        elements.toast.textContent = message;
        elements.toast.classList.add('visible');
        
        setTimeout(() => {
            elements.toast.classList.remove('visible');
        }, 3000);
    }

    // ============================================
    // Utility Functions
    // ============================================
    function smoothScrollTo(element) {
        const offset = 80;
        const targetPosition = element.getBoundingClientRect().top + window.scrollY - offset;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ============================================
    // Reading Time Estimation
    // ============================================
    function initReadingTime() {
        const text = elements.articleBody.textContent;
        const wordCount = text.trim().split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200); // ~200 WPM
        
        const readingTimeEl = document.getElementById('readingTime');
        if (readingTimeEl) {
            readingTimeEl.textContent = `${readingTime} min read`;
        }
    }

    // ============================================
    // Keyboard Navigation
    // ============================================
    function initKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            // Skip if in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            // Navigate between headings with arrow keys
            if (e.key === 'j' || e.key === 'ArrowDown') {
                e.preventDefault();
                navigateHeading(1);
            } else if (e.key === 'k' || e.key === 'ArrowUp') {
                e.preventDefault();
                navigateHeading(-1);
            }
        });
    }

    function navigateHeading(direction) {
        const headings = Array.from(elements.articleBody.querySelectorAll('h2, h3'));
        const scrollPos = window.scrollY + 100;
        
        let currentIndex = -1;
        headings.forEach((heading, index) => {
            if (heading.offsetTop <= scrollPos) {
                currentIndex = index;
            }
        });
        
        const targetIndex = currentIndex + direction;
        if (targetIndex >= 0 && targetIndex < headings.length) {
            smoothScrollTo(headings[targetIndex]);
        }
    }

    // ============================================
    // Initialize
    // ============================================
    function init() {
        initTheme();
        initSidebar();
        initSearch();
        initReadingProgress();
        initScrollTop();
        initFootnotes();
        initShareButtons();
        initReadingTime();
        initKeyboardNav();
        
        console.log('📖 WikiReader initialized');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
