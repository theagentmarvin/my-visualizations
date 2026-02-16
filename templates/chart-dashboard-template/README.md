# Chart Dashboard Template

Interactive data visualization dashboard with Chart.js.

## Features

- 📊 Multiple chart types (line, bar, pie, doughnut, radar)
- 📱 Responsive grid layout
- 🎨 Tailwind CSS styling
- 🌙 Dark mode ready
- 📥 Export charts as images
- 🔄 Live data updates (WebSocket ready)

## Tech Stack

- **React** - UI framework
- **Chart.js** - Charting library
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Usage

### Add New Chart

Edit `src/App.jsx`:

```javascript
import { Line, Bar, Pie } from 'react-chartjs-2';

const data = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [{
    label: 'Sales',
    data: [12, 19, 3, 5, 2],
    borderColor: 'rgb(75, 192, 192)',
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
  }]
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    title: { display: true, text: 'Monthly Sales' }
  }
};

<Line data={data} options={options} />
```

### Fetch Live Data

```javascript
import { useState, useEffect } from 'react';

function Dashboard() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);
  
  return <Line data={formatData(data)} />;
}
```

### Customize Styling

Tailwind classes in JSX:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
    <h2 className="text-xl font-bold mb-4">Sales Overview</h2>
    <Line data={data} />
  </div>
</div>
```

## Project Structure

```
src/
├── App.jsx              # Main dashboard
├── components/
│   ├── ChartCard.jsx    # Reusable chart container
│   ├── MetricCard.jsx   # KPI display
│   └── DatePicker.jsx   # Date range selector
├── utils/
│   └── dataFormatters.js # Data transformation
└── styles/
    └── index.css        # Global styles
```

## Chart Types

### Line Chart
```javascript
import { Line } from 'react-chartjs-2';
<Line data={data} options={options} />
```

### Bar Chart
```javascript
import { Bar } from 'react-chartjs-2';
<Bar data={data} options={options} />
```

### Pie/Doughnut
```javascript
import { Pie, Doughnut } from 'react-chartjs-2';
<Pie data={data} />
<Doughnut data={data} />
```

### Mixed Chart
```javascript
const data = {
  datasets: [
    { type: 'line', label: 'Target', data: [10, 20, 30] },
    { type: 'bar', label: 'Actual', data: [8, 22, 28] }
  ]
};
```

## Deployment

### GitHub Pages

Update `vite.config.js`:
```javascript
export default defineConfig({
  base: '/my-visualizations/projects/dashboard/',
  // ...
});
```

Build and deploy:
```bash
npm run build
# Deploy dist/ to gh-pages
```

## Troubleshooting

**Chart not rendering:**
- Ensure Chart.js is imported properly
- Check data format matches chart type
- Verify container has width/height

**Performance issues:**
- Limit data points (< 1000 recommended)
- Disable animations for large datasets
- Use `decimation` plugin for downsampling

## Resources

- [Chart.js Docs](https://www.chartjs.org/docs/latest/)
- [react-chartjs-2 Guide](https://react-chartjs-2.js.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## License

MIT
