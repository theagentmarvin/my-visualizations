# 📚 Wiki Research E-Reader

A clean, focused e-reader style static site for rendering Markdown research reports. Built with webpack and modern JavaScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Webpack](https://img.shields.io/badge/webpack-5.x-8DD6F9.svg)

## Features

- 📖 **E-reader Optimized Typography** — Clean, readable fonts with optimal line spacing
- 🌓 **Dark & Light Mode** — Toggle between themes with system preference detection
- 📑 **Table of Contents** — Auto-generated TOC with smooth navigation
- 📱 **Mobile Responsive** — Works beautifully on all screen sizes
- 🔗 **Footnotes Support** — Click-to-view footnote references
- 📊 **Reading Progress** — Visual indicator of scroll position
- 🔤 **Font Size Controls** — Adjustable text size for accessibility
- ⚡ **Fast Loading** — Optimized webpack build with code splitting

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build
```

## Adding Research Reports

1. Add your `.md` files to the `reports/` directory
2. Update the `availableReports` array in `src/index.js`:

```javascript
this.availableReports = [
  { id: 'your-report', title: 'Your Report Title', file: 'reports/your-report.md' },
  // ...
];
```

## Project Structure

```
wiki-research-e-reader/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── index.js            # Main entry point
│   ├── styles.css          # E-reader styles
│   ├── markdown-renderer.js # Markdown parsing
│   ├── toc.js              # Table of contents
│   ├── theme.js            # Dark/light mode
│   ├── footnotes.js        # Footnote handling
│   └── progress.js         # Reading progress
├── reports/                # Markdown reports
├── dist/                   # Build output
└── webpack.config.js       # Webpack configuration
```

## Markdown Features

The e-reader supports standard Markdown plus:

- **Footnotes**: Use `[ref]` for references and `[ref]: content` for definitions
- **Tables**: Full GitHub-flavored table support
- **Images**: Lazy-loaded with figure captions
- **Code blocks**: Syntax highlighted
- **Blockquotes**: Styled callouts

## Deployment

Build for production:

```bash
npm run build
```

The `dist/` folder contains all static assets ready for deployment to GitHub Pages, Netlify, Vercel, or any static host.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari/Chrome

## License

MIT