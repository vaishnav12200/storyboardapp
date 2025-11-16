# CineCore - AI-Powered Film Storyboard Platform

A comprehensive film production platform featuring AI-powered storyboard generation, script management, budget tracking, and scheduling tools.

## 🚀 Features

- **Visual Storyboarding**: Create stunning storyboards with AI-powered image generation
- **AI Image Generation**: Support for multiple AI providers (OpenAI DALL-E, Stability AI, Replicate)
- **Script Management**: Professional script writing and breakdown tools
- **Budget Tracking**: Comprehensive budget management system
- **Location Scouting**: Location management with Google Maps integration
- **Schedule Management**: Production scheduling and timeline tools
- **Export Options**: Export storyboards and scripts to PDF

## 🛠️ Tech Stack

### Frontend (story-board)
- **Next.js 14** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Hook Form** for form handling
- **Redux Toolkit** for state management

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Axios** for AI API integration

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB
- API keys for AI services (optional but recommended):
  - OpenAI API key
  - Stability AI API key
  - Replicate API key
- Google Maps API key (for location features)

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd ReactNative
```

### 2. Backend Setup
```bash
cd Backend
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your actual values
```

### 3. Frontend Setup
```bash
cd ../story-board
npm install
```

### 4. Environment Configuration

#### Backend (.env)
Copy `Backend/.env.example` to `Backend/.env` and configure:

**Required:**
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secure JWT secret key

**Optional (for full functionality):**
- `OPENAI_API_KEY` - For AI image generation
- `STABILITY_AI_KEY` - For Stability AI image generation
- `REPLICATE_API_KEY` - For Replicate AI models
- `GOOGLE_MAPS_API_KEY` - For location features

#### Frontend
The frontend automatically connects to the backend at `http://localhost:5000`

### 5. Run the Application

#### Start Backend (Terminal 1)
```bash
cd Backend
npm start
# Server will run on http://localhost:5000
```

#### Start Frontend (Terminal 2)
```bash
cd story-board
npm run dev
# App will run on http://localhost:3000
```

### 6. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔧 API Keys Setup

### OpenAI (for DALL-E)
1. Go to https://platform.openai.com/
2. Create an API key
3. Add to `.env` as `OPENAI_API_KEY`

### Stability AI
1. Go to https://platform.stability.ai/
2. Generate an API key
3. Add to `.env` as `STABILITY_AI_KEY`

### Replicate
1. Go to https://replicate.com/
2. Get your API token
3. Add to `.env` as `REPLICATE_API_KEY`

### Google Maps (for location features)
1. Go to Google Cloud Console
2. Enable Maps JavaScript API
3. Create an API key
4. Add to `.env` as `GOOGLE_MAPS_API_KEY`

## 📁 Project Structure

```
ReactNative/
├── Backend/                 # Express.js backend
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Custom middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── services/           # Business logic (AI, etc.)
│   └── server.js           # Main server file
├── story-board/            # Next.js frontend
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # Reusable components
│   │   ├── lib/           # Utilities and API clients
│   │   └── types/         # TypeScript types
└── README.md
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details

### Storyboard
- `GET /api/storyboard/projects/:id/scenes` - Get project scenes
- `POST /api/storyboard/scenes` - Create new scene
- `POST /api/storyboard/scenes/:id/panels/:panelId/generate-image` - Generate AI image

## 🤖 AI Features

The platform supports multiple AI providers for image generation:

1. **OpenAI DALL-E**: High-quality, natural images
2. **Stability AI**: Artistic and customizable styles
3. **Replicate**: Advanced AI models including Midjourney-style

AI features include:
- Automatic prompt enhancement
- Style presets (realistic sketch, cartoon, dramatic, etc.)
- Mood controls (neutral, dramatic, bright, dark, vintage)
- Multiple aspect ratios

## 🔒 Security Features

- JWT-based authentication
- Rate limiting on auth endpoints
- Input validation and sanitization
- Secure file upload handling
- Environment variable protection

## 📱 Deployment

### Backend Deployment (Railway/Heroku)
1. Set environment variables in your hosting platform
2. Deploy the `Backend` directory
3. Ensure MongoDB Atlas is accessible

### Frontend Deployment (Vercel)
1. Deploy the `story-board` directory
2. Set `NEXT_PUBLIC_API_URL` to your backend URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Backend won't start
- Check MongoDB connection string in `.env`
- Ensure MongoDB Atlas cluster is running
- Verify IP whitelist in MongoDB Atlas

### AI image generation fails
- Check API keys are correctly set in `.env`
- Verify API key has sufficient credits
- Check API provider status pages

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check for CORS issues in browser console
- Verify API URLs in frontend code

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information

---

Made with ❤️ for filmmakers and storytellers