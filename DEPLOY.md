# Deployment Guide

This guide covers the steps to deploy the Storyboard application to production.

## Architecture Overview

- **Frontend**: Next.js application (deploy to Vercel)
- **Backend**: Node.js/Express application (deploy to Render/Heroku/Railway)
- **Database**: MongoDB Atlas

## 1. Backend Deployment (Render.com recommended)

### Prerequisites
- A Render account
- A MongoDB Atlas cluster (connection string)

### Environment Variables
Configure the following environment variables in your backend hosting service:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port number (usually set by host) | `10000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for signing tokens | `your-secure-secret-key` |
| `NODE_ENV` | Environment mode | `production` |
| `CLIENT_URL` | URL of the deployed frontend | `https://your-app.vercel.app` |

### Steps
1. Connect your GitHub repository to Render.
2. Create a new **Web Service**.
3. Select the `Backend` folder as the Root Directory.
4. Set the Build Command: `npm install`
5. Set the Start Command: `node server.js`
6. Add the environment variables listed above.
7. Deploy.

## 2. Frontend Deployment (Vercel recommended)

### Prerequisites
- A Vercel account

### Environment Variables
Configure the following environment variables in Vercel:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL of the deployed backend | `https://your-backend.onrender.com/api` |

### Steps
1. Connect your GitHub repository to Vercel.
2. Import the project.
3. Select the `story-board` folder as the Root Directory.
4. The framework preset should automatically detect Next.js.
5. Add the `NEXT_PUBLIC_API_URL` environment variable.
6. Deploy.

## 3. Post-Deployment Checks

1. **CORS Configuration**: Ensure the `CLIENT_URL` in the backend matches the actual Vercel URL of your frontend.
2. **Database Connection**: Check backend logs to verify successful MongoDB connection.
3. **Authentication**: Test Sign Up and Login flows in the production environment.
4. **AI Features**: Verify that AI image generation works (Pollinations AI requires no API key).

## Troubleshooting

- **CORS Errors**: If you see CORS errors in the browser console, verify that `CLIENT_URL` is set correctly in the backend and that you are accessing the frontend via that exact URL (including https).
- **Connection Refused**: If the backend fails to start, check the MongoDB connection string and ensure your IP whitelist in MongoDB Atlas allows access from anywhere (`0.0.0.0/0`) or specifically from your hosting provider's IPs.
