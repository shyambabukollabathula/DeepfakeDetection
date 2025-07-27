# 🚀 Deployment Guide

## Frontend (Already deployed on Vercel)
Your frontend is deployed, but it needs to connect to a backend server.

## Backend Deployment Options

### Option 1: Railway (Recommended - Easy)

1. **Go to [railway.app](https://railway.app)**
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository**
6. **Railway will auto-detect it's a Python project**
7. **Set environment variables:**
   - `SECRET_KEY`: Generate a secure secret key
   - `PORT`: Railway will set this automatically
8. **Deploy!**

### Option 2: Render (Free tier available)

1. **Go to [render.com](https://render.com)**
2. **Create account and connect GitHub**
3. **Create new "Web Service"**
4. **Connect your repository**
5. **Settings:**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn deepfake_detection.app.main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables:**
   - `SECRET_KEY`: Your secure secret key
7. **Deploy!**

### Option 3: Heroku

1. **Install Heroku CLI**
2. **Login:** `heroku login`
3. **Create app:** `heroku create your-app-name`
4. **Set environment variables:**
   ```bash
   heroku config:set SECRET_KEY=your-secure-secret-key
   ```
5. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

## After Backend Deployment

1. **Get your backend URL** (e.g., `https://your-app.railway.app`)

2. **Update Vercel Environment Variables:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add: `VITE_API_BASE_URL` = `https://your-backend-url.com`
   - Redeploy your frontend

3. **Update Backend CORS:**
   - Replace `"https://your-frontend-domain.vercel.app"` in `main.py` with your actual Vercel URL
   - Redeploy backend

## Quick Test

After deployment, test these endpoints:
- `GET https://your-backend-url.com/` - Should return API message
- Your Vercel frontend should now be able to login/register

## Security Notes

- Generate a strong SECRET_KEY for production
- Consider using PostgreSQL instead of SQLite for production
- Add rate limiting for production use

## Troubleshooting

- **CORS errors**: Make sure your Vercel URL is in the CORS origins
- **Environment variables**: Double-check they're set correctly
- **Database**: SQLite works for small apps, but consider PostgreSQL for production