/**
 * E-Reader Application
 * Mobile-friendly e-reader with dark/light mode, TOC navigation, and offline support
 */

(function() {
    'use strict';

    // DOM Elements
    const header = document.getElementById('header');
    const menuToggle = document.getElementById('menuToggle');
    const tocSidebar = document.getElementById('tocSidebar');
    const tocClose = document.getElementById('tocClose');
    const tocList = document.getElementById('tocList');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const themeToggle = document.getElementById('themeToggle');
    const fontToggle = document.getElementById('fontToggle');
    const readingProgress = document.getElementById('readingProgress');
    const scrollTop = document.getElementById('scrollTop');
    const prevChapter = document.getElementById('prevChapter');
    const nextChapter = document.getElementById('nextChapter');
    const currentSectionEl = document.getElementById('currentSection');
    const totalSectionsEl = document.getElementById('totalSections');

    // State
    let chapters = [];
    let currentChapterIndex = 0;
    let fontSizes = ['font-small', 'font-medium', 'font-large', 'font-xlarge'];
    let currentFontIndex = 1; // Start with medium
    let themes = ['light', 'sepia', 'dark'];
    let currentThemeIndex = 0;

    /**
     * Initialize the e-reader
     */
    function init() {
        generateTOC();
        loadPreferences();
        setupEventListeners();
        setupIntersectionObserver();
        updateReadingProgress();
        updateNavigation();
        registerServiceWorker();
    }

    /**
     * Generate Table of Contents from h2 elements
     */
    function generateTOC() {
        const headings = document.querySelectorAll('.chapter h2');
        chapters = Array.from(document.querySelectorAll('.chapter'));
        
        totalSectionsEl.textContent = chapters.length;

        headings.forEach((heading, index) => {
            const chapter = chapters[index];
            const id = chapter.id || `chapter-${index}`;
            chapter.id = id;

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${id}`;
            a.textContent = heading.textContent;
            a.dataset.index = index;
            
            a.addEventListener('click', (e) => {
                e.preventDefault();
                closeSidebar();
                smoothScrollTo(chapter);
                currentChapterIndex = index;
                updateNavigation();
            });

            li.appendChild(a);
            tocList.appendChild(li);
        });
    }

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Sidebar toggle
        menuToggle.addEventListener('click', toggleSidebar);
        tocClose.addEventListener('click', closeSidebar);
        sidebarOverlay.addEventListener('click', closeSidebar);

        // Theme toggle (cycles through light -> sepia -> dark)
        themeToggle.addEventListener('click', cycleTheme);

        // Font size toggle
        fontToggle.addEventListener('click', cycleFontSize);

        // Scroll events
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateReadingProgress();
                    updateScrollTopButton();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // Scroll to top
        scrollTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Chapter navigation
        prevChapter.addEventListener('click', goToPreviousChapter);
        nextChapter.addEventListener('click', goToNextChapter);

        // Keyboard navigation
        document.addEventListener('keydown', handleKeyboard);

        // Touch gestures for mobile
        setupTouchGestures();

        // Update active TOC item on scroll
        window.addEventListener('scroll', updateActiveTOCItem, { passive: true });
    }

    /**
     * Setup Intersection Observer for chapter detection
     */
    function setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = chapters.indexOf(entry.target);
                    if (index !== -1) {
                        currentChapterIndex = index;
                        updateNavigation();
                        updateActiveTOCItem();
                    }
                }
            });
        }, options);

        chapters.forEach(chapter => observer.observe(chapter));
    }

    /**
     * Toggle sidebar open/closed
     */
    function toggleSidebar() {
        const isOpen = tocSidebar.classList.contains('open');
        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    /**
     * Open sidebar
     */
    function openSidebar() {
        tocSidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
        menuToggle.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateActiveTOCItem();
    }

    /**
     * Close sidebar
     */
    function closeSidebar() {
        tocSidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * Cycle through themes (light -> sepia -> dark)
     */
    function cycleTheme() {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        const theme = themes[currentThemeIndex];
        
        // Remove all theme classes
        document.body.classList.remove('theme-light', 'theme-dark', 'theme-sepia');
        document.body.removeAttribute('data-theme');
        
        // Add new theme
        document.body.classList.add(`theme-${theme}`);
        document.body.setAttribute('data-theme', theme);
        
        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            const colors = {
                light: '#faf8f5',
                dark: '#1a1a2e',
                sepia: '#f4ecd8'
            };
            metaThemeColor.content = colors[theme];
        }
        
        savePreferences();
    }

    /**
     * Cycle through font sizes
     */
    function cycleFontSize() {
        // Remove current font class
        document.body.classList.remove(...fontSizes);
        
        // Move to next size
        currentFontIndex = (currentFontIndex + 1) % fontSizes.length;
        
        // Apply new font class
        document.body.classList.add(fontSizes[currentFontIndex]);
        
        savePreferences();
    }

    /**
     * Update reading progress bar
     */
    function updateReadingProgress() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        readingProgress.style.width = progress + '%';
    }

    /**
     * Update scroll-to-top button visibility
     */
    function updateScrollTopButton() {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollY > 500) {
            scrollTop.classList.add('visible');
        } else {
            scrollTop.classList.remove('visible');
        }
    }

    /**
     * Update navigation buttons state
     */
    function updateNavigation() {
        currentSectionEl.textContent = currentChapterIndex + 1;
        
        prevChapter.disabled = currentChapterIndex === 0;
        nextChapter.disabled = currentChapterIndex === chapters.length - 1;
    }

    /**
     * Go to previous chapter
     */
    function goToPreviousChapter() {
        if (currentChapterIndex > 0) {
            currentChapterIndex--;
            smoothScrollTo(chapters[currentChapterIndex]);
            updateNavigation();
        }
    }

    /**
     * Go to next chapter
     */
    function goToNextChapter() {
        if (currentChapterIndex < chapters.length - 1) {
            currentChapterIndex++;
            smoothScrollTo(chapters[currentChapterIndex]);
            updateNavigation();
        }
    }

    /**
     * Smooth scroll to element
     */
    function smoothScrollTo(element) {
        const headerHeight = header.offsetHeight;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight - 20;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    /**
     * Update active TOC item
     */
    function updateActiveTOCItem() {
        const tocLinks = tocList.querySelectorAll('a');
        tocLinks.forEach((link, index) => {
            if (index === currentChapterIndex) {
                link.classList.add('active');
                link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * Handle keyboard navigation
     */
    function handleKeyboard(e) {
        // Don't trigger if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch(e.key) {
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                goToPreviousChapter();
                break;
            case 'ArrowRight':
            case 'PageDown':
            case ' ':
                e.preventDefault();
                goToNextChapter();
                break;
            case 'Home':
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'End':
                e.preventDefault();
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                break;
            case 't':
                cycleTheme();
                break;
            case 'f':
                cycleFontSize();
                break;
            case 'Escape':
                closeSidebar();
                break;
        }
    }

    /**
     * Setup touch gestures for mobile
     */
    function setupTouchGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;
        const minSwipeDistance = 50;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            // Only handle horizontal swipes
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
                if (diffX > 0) {
                    // Swipe right - previous chapter
                    goToPreviousChapter();
                } else {
                    // Swipe left - next chapter
                    goToNextChapter();
                }
            }
        }
    }

    /**
     * Save user preferences to localStorage
     */
    function savePreferences() {
        try {
            localStorage.setItem('ereader-theme', themes[currentThemeIndex]);
            localStorage.setItem('ereader-font', fontSizes[currentFontIndex]);
            localStorage.setItem('ereader-chapter', currentChapterIndex.toString());
        } catch (e) {
            // localStorage not available
        }
    }

    /**
     * Load user preferences from localStorage
     */
    function loadPreferences() {
        try {
            const savedTheme = localStorage.getItem('ereader-theme');
            const savedFont = localStorage.getItem('ereader-font');
            const savedChapter = localStorage.getItem('ereader-chapter');

            if (savedTheme) {
                const themeIndex = themes.indexOf(savedTheme);
                if (themeIndex !== -1) {
                    currentThemeIndex = themeIndex - 1; // Will be incremented in cycleTheme
                    cycleTheme();
                }
            }

            if (savedFont) {
                const fontIndex = fontSizes.indexOf(savedFont);
                if (fontIndex !== -1) {
                    currentFontIndex = fontIndex - 1; // Will be incremented in cycleFontSize
                    cycleFontSize();
                }
            }

            if (savedChapter) {
                const chapterIndex = parseInt(savedChapter, 10);
                if (!isNaN(chapterIndex) && chapterIndex >= 0 && chapterIndex < chapters.length) {
                    currentChapterIndex = chapterIndex;
                    // Don't auto-scroll, just update the indicator
                    updateNavigation();
                }
            }
        } catch (e) {
            // localStorage not available
        }
    }

    /**
     * Register service worker for offline support
     */
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    // Save position before leaving
    window.addEventListener('beforeunload', savePreferences);

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
