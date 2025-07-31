# Plant Analytics Frontend

A modern React dashboard for exploring US power generation data.

## Features

🏭 **Power Plant Analytics**
- View top power plants by net generation
- Filter by state and year
- Interactive data table
- Bar chart visualization

📊 **Data Visualization**
- Responsive charts with Recharts
- Formatted numbers (e.g., 1.2M MWh)
- Real-time data from APIs

🎨 **Modern UI**
- Clean, professional design
- Mobile responsive
- Loading states and error handling

## Quick Start

### Development Mode
```bash
cd apps/frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:4000

### Production Build
```bash
npm run build
npm run preview
```

### Docker (Recommended)
```bash
# From project root
./scripts/run-system.sh
```

This starts the complete system including frontend at http://localhost:4000

## Project Structure

```
apps/frontend/
├── src/
│   ├── components/          # React components
│   │   ├── FilterControls.tsx    # State/limit filters
│   │   ├── PowerPlantsTable.tsx  # Data table
│   │   └── PowerPlantsChart.tsx  # Bar chart
│   ├── services/           # API services
│   │   └── api.ts         # Gateway API calls
│   ├── types/             # TypeScript types
│   │   └── api.ts         # API response types
│   ├── App.tsx            # Main application
│   ├── main.tsx           # Entry point
│   └── *.css              # Styling
├── public/                # Static assets
├── Dockerfile            # Production container
├── nginx.conf           # Production server config
└── package.json         # Dependencies
```

## API Integration

The frontend calls these gateway endpoints:

- `GET /api/power-plants/states` - Available states
- `GET /api/power-plants/top?limit=N&state=XX` - Top power plants

## Environment Variables

- `VITE_API_URL` - API gateway URL (default: http://localhost:8000)

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **CSS3** - Modern styling

## Development

### Adding New Features

1. Create new components in `src/components/`
2. Add API calls to `src/services/api.ts`
3. Update types in `src/types/api.ts`
4. Test with the development server

### Code Quality

- TypeScript for type safety
- Modern CSS with flexbox/grid
- Responsive design patterns
- Error boundaries and loading states

## Production Deployment

The frontend builds to static files and runs on Nginx:

1. Vite builds optimized bundles
2. Nginx serves static files
3. API calls proxied to gateway
4. Gzip compression enabled
5. Security headers included

Access the live dashboard at http://localhost:4000 