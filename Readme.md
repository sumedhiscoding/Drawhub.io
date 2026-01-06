# DrawHub

**DrawHub** is a modern, collaborative whiteboard application that enables teams to create, share, and collaborate on visual ideas in real-time. Built with React and Node.js, DrawHub provides a powerful digital canvas with professional drawing tools and seamless collaboration features.

## 🎨 Overview

DrawHub transforms the way teams brainstorm, design, and work together. Whether you're sketching ideas, creating diagrams, or collaborating on visual projects, DrawHub provides an intuitive and powerful platform for visual collaboration.

## ✨ Current Features

### Drawing Tools
- **Pencil Tool** with advanced settings:
  - Customizable thinning, streamline, smoothing, and easing
  - Adjustable stroke width and colors
- **Shape Tools**: Line, Rectangle, Circle
- **Text Tool** with adjustable font sizes
- **Color Palette**: Extensive color selection for strokes and fills
- **Fill Styles**: Multiple fill pattern options
- **Undo/Redo**: Full history management

### Canvas Management
- Create, save, and organize multiple canvases
- Personal dashboard to manage all your canvases
- Canvas sharing via email invitation
- View and manage shared users per canvas
- Secure canvas access control

### User Experience
- **Modern UI**: Clean, responsive design with dark mode support
- **Intuitive Interface**: Easy-to-use toolbar and toolbox
- **Real-time Updates**: Instant canvas synchronization
- **User Authentication**: Secure registration and login system
- **Profile Management**: Update user information and passwords

## 🚀 Coming Soon

### Real-time Live Collaboration
- Multiple users editing simultaneously on the same canvas
- Live cursor tracking and presence indicators
- Instant updates across all connected users
- Conflict-free collaborative editing

### Commenting System
- Add contextual comments to specific areas of the canvas
- Threaded discussions for better collaboration
- @mentions and notifications
- Comment resolution and management

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Perfect Freehand** - Smooth drawing library
- **Rough.js** - Hand-drawn style graphics
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL** - Relational database
- **Slonik** - PostgreSQL client
- **Passport.js** - Authentication middleware
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **Express Validator** - Input validation

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/drawhub
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port Vite assigns).

## 🏗️ Project Structure

```
com.sic.WhiteBoard/
├── backend/
│   ├── controllers/        # Request handlers
│   │   ├── CanvasControllers/
│   │   └── UserControllers/
│   ├── models/            # Data models and queries
│   ├── routes/            # API routes
│   ├── migrations/         # Database migrations
│   ├── utils/             # Utility functions
│   └── config/            # Configuration files
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Board/     # Canvas component
│   │   │   ├── Toolbar/   # Toolbar component
│   │   │   ├── Toolbox/   # Toolbox component
│   │   │   └── GoLiveTool/# Sharing component
│   │   ├── pages/         # Page components
│   │   ├── store/         # State management
│   │   └── utils/         # Utility functions
│   └── components/        # UI components
└── Readme.md
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `PUT /users/:id/password` - Update password
- `DELETE /users/:id` - Delete user

### Canvas
- `GET /canvas` - Get all canvases
- `GET /canvas/:id` - Get canvas by ID
- `POST /canvas` - Create new canvas
- `PUT /canvas/:id` - Update canvas
- `DELETE /canvas/:id` - Delete canvas
- `POST /canvas/share/:id` - Share canvas with user
- `GET /canvas/shared-users/:id` - Get shared users
- `GET /canvas/owner/:ownerId` - Get canvases by owner
- `GET /canvas/shared/:userId` - Get shared canvases

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

ISC

## 👥 Authors

Built with ❤️ by the DrawHub team

---

**Note**: Real-time collaboration and commenting features are currently in development. Stay tuned for updates!

