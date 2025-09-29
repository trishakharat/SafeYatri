# SafeYatri Frontend - Authority Dashboard

Modern React + TypeScript frontend for the SafeYatri Smart Tourist Safety Monitoring System.

## 🏗️ Architecture

- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: React Context + Hooks
- **Real-time**: Socket.IO Client
- **Maps**: Mapbox GL JS
- **Charts**: Recharts
- **Icons**: Heroicons
- **Forms**: React Hook Form
- **Routing**: React Router v6

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend server running on port 5000

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables (optional)
cp .env.example .env.local

# Start development server
npm start
```

The application will open at `http://localhost:3000`

### Environment Variables

Create `.env.local` file:

```bash
# Mapbox token for maps (optional - uses fallback)
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here

# Backend API URL (defaults to localhost:5000)
REACT_APP_API_URL=http://localhost:5000

# WebSocket URL (defaults to localhost:5000)
REACT_APP_WS_URL=http://localhost:5000
```

## 👥 User Roles & Access

### Login Credentials (Demo)
- **Admin**: `admin` / `SafeYatri@2024`
- **Dispatcher**: `dispatcher` / `SafeYatri@2024` (2FA enabled)
- **Police**: `police` / `SafeYatri@2024`
- **Tourism**: `tourism` / `SafeYatri@2024`
- **Auditor**: `auditor` / `SafeYatri@2024`

### Role-Based Dashboards

#### Dispatcher Dashboard
- Live CCTV monitoring grid
- Real-time alert management
- Tourist location mapping
- Incident workflow with e-FIR generation
- Emergency dispatch controls

#### Police Dashboard  
- Assigned incident queue
- Field status updates
- Tourist profile access
- Evidence review
- Report submission

#### Tourism Dashboard
- Tourist flow analytics
- Safety score monitoring
- Popular destination tracking
- Travel advisory management
- Demographic insights

#### Admin Dashboard
- User management
- Camera configuration
- System settings
- Security policies
- Performance monitoring

#### Auditor Dashboard
- Comprehensive audit logs
- Compliance monitoring
- Evidence access tracking
- Privacy violation alerts
- Export capabilities

## 🎯 Key Features

### Real-time Monitoring
- Live CCTV feeds with AI detection overlays
- WebSocket-based alert streaming
- Tourist location tracking
- System health monitoring

### Interactive Maps
- Mapbox-powered live tourist map
- Geo-fence visualization
- Alert location markers
- Tourist cluster analysis
- Risk zone highlighting

### AI Integration
- Violence detection alerts
- Confidence scoring
- Evidence capture
- Face blur privacy protection
- Anomaly detection

### Incident Workflow
- Alert → Review → Dispatch pipeline
- Evidence package generation
- e-FIR draft creation
- Officer assignment
- Status tracking

### IoT Band Integration
- Real-time health monitoring
- Panic button alerts
- Battery level tracking
- Location accuracy
- Activity detection

## 📱 Demo Features

### Phone Camera Setup
- QR code connection
- Webcam fallback
- Simulated AI detection
- Live stream preview
- Demo alert generation

### Mock Data
- Realistic tourist locations
- Sample CCTV feeds
- Simulated alerts
- Demo user accounts
- Test scenarios

## 🔧 Development

### Project Structure
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── alerts/          # Alert management
│   │   ├── cctv/           # Camera feeds
│   │   ├── common/         # Shared components
│   │   ├── dashboard/      # Dashboard widgets
│   │   ├── demo/           # Demo components
│   │   ├── iot/            # IoT band management
│   │   ├── layout/         # Layout components
│   │   ├── map/            # Map components
│   │   └── workflow/       # Incident workflow
│   ├── contexts/           # React contexts
│   ├── pages/              # Page components
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── tailwind.config.js
└── package.json
```

### Available Scripts

```bash
# Development
npm start                 # Start dev server
npm run build            # Production build
npm test                 # Run tests
npm run eject           # Eject from CRA

# Linting & Formatting
npm run lint            # ESLint check
npm run lint:fix        # Fix lint issues
npm run format          # Prettier format
```

### Adding New Components

1. Create component in appropriate directory
2. Export from index file
3. Add to routing if needed
4. Update type definitions
5. Add to Storybook (if applicable)

### State Management

Uses React Context for:
- **AuthContext**: User authentication & authorization
- **SocketContext**: Real-time WebSocket connections
- **AlertContext**: Alert state management
- **MapContext**: Map state & interactions

### API Integration

All API calls go through axios with:
- Automatic JWT token handling
- Request/response interceptors
- Error handling
- Loading states
- Retry logic

## 🎨 UI/UX Guidelines

### Design System
- **Colors**: Primary blue, semantic colors for status
- **Typography**: Inter font family
- **Spacing**: Tailwind spacing scale
- **Components**: Headless UI primitives
- **Icons**: Heroicons outline style

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Flexible grid layouts
- Touch-friendly interactions

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus management

## 🔒 Security

### Authentication
- JWT token-based auth
- Automatic token refresh
- Secure token storage
- Session timeout handling

### Authorization
- Role-based access control
- Route protection
- Component-level permissions
- API endpoint restrictions

### Data Protection
- Input sanitization
- XSS prevention
- CSRF protection
- Secure headers

## 📊 Performance

### Optimization
- Code splitting by routes
- Lazy loading components
- Image optimization
- Bundle analysis
- Tree shaking

### Monitoring
- Performance metrics
- Error boundaries
- Loading states
- User analytics

## 🧪 Testing

### Test Structure
```bash
src/
├── __tests__/           # Unit tests
├── components/
│   └── __tests__/       # Component tests
└── pages/
    └── __tests__/       # Page tests
```

### Testing Tools
- Jest for unit testing
- React Testing Library
- MSW for API mocking
- Cypress for E2E testing

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```bash
# Build image
docker build -t safeyatri-frontend .

# Run container
docker run -p 3000:3000 safeyatri-frontend
```

### Environment-specific Builds
- Development: Hot reload, source maps
- Staging: Minified, source maps
- Production: Optimized, no source maps

## 🔍 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check backend server is running
   - Verify CORS settings
   - Check firewall/proxy settings

2. **Map Not Loading**
   - Verify Mapbox token
   - Check network connectivity
   - Review browser console

3. **Camera Feed Issues**
   - Check camera permissions
   - Verify HTTPS for webcam access
   - Test with different browsers

### Debug Mode
Set `REACT_APP_DEBUG=true` for verbose logging.

## 📚 Resources

- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js)
- [Socket.IO Client](https://socket.io/docs/v4/client-api)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review process

---

**SafeYatri Frontend** - Modern, secure, and scalable authority dashboard for tourist safety monitoring.
