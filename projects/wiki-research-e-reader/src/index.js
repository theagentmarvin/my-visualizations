import { marked } from 'marked';
import DOMPurify from 'dompurify';

// E-reader config
const config = {
  fontSize: 18,
  lineHeight: 1.6,
  serif: true,
  darkMode: false
};

// Toggle dark mode
document.getElementById('dark-toggle')?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  config.darkMode = !config.darkMode;
  localStorage.setItem('darkMode', config.darkMode);
});

// Load MD from reports (first .md file)
async function loadResearch() {
  try {
    const response = await fetch('/reports/sample-research.md');
    const md = await response.text();
    const html = DOMPurify.sanitize(marked.parse(md));
    
    // Simple TOC gen (h1-h3)
    const toc = generateTOC(html);
    
    document.getElementById('toc').innerHTML = toc;
    document.getElementById('content').innerHTML = html;
    
    applyStyles();
  } catch (e) {
    document.getElementById('content').innerHTML = '<p>No research loaded. Add MD to /reports/.</p>';
  }
}

function generateTOC(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3');
  let toc = '<ul>';
  headings.forEach(h => {
    const id = h.id || h.textContent.toLowerCase().replace(/\\s+/g, '-');
    h.id = id;
    toc += `<li><a href="#${id}">${h.textContent}</a></li>`;
  });
  toc += '</ul>';
  return toc;
}

function applyStyles() {
  const root = document.documentElement.style;
  root.setProperty('--font-size', `${config.fontSize}px`);
  root.setProperty('--line-height', config.lineHeight);
  root.classList.toggle('serif', config.serif);
  root.classList.toggle('dark', config.darkMode);
}

// Init
loadResearch();
window.addEventListener('storage', loadResearch); // Sync across tabs