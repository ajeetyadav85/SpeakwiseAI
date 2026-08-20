# SpeakWise AI — Production Deployment Guide

This guide outlines step-by-step instructions for deploying SpeakWise AI across production cloud infrastructure (Vercel, Render/Railway, MongoDB Atlas, Cloudinary).

---

## 1. Prerequisites & Services Inventory

Before deploying, provision account credentials for the following services:
- **MongoDB Atlas**: Cloud MongoDB database cluster.
- **Cloudinary / AWS S3**: Media storage vault for speech audio recordings.
- **Vercel Account**: Hosting for the React Vite client application.
- **Render / Railway / AWS ECS**: Hosting for Node.js API & Socket.IO server.

---

## 2. Database Provisioning (MongoDB Atlas)

1. Log into [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new **M10 / Shared Cluster** (AWS or GCP).
3. Under **Database Access**, create a database user with `readWriteAnyDatabase` permissions.
4. Under **Network Access**, whitelist your Render/Railway backend IP addresses (or `0.0.0.0/0` for serverless API providers).
5. Copy your connection string URI:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/speakwise_db?retryWrites=true&w=majority`

---

## 3. Frontend Deployment (Vercel)

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Set **Framework Preset** to `Vite`.
4. Configure environment variables in Vercel project settings:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com/api/v1`
5. Click **Deploy**. Vercel will automatically build static assets from `client/src` and serve via global edge CDN.

---

## 4. Backend Deployment (Render / Railway)

1. Connect your GitHub repository to [Render](https://render.com) or [Railway](https://railway.app).
2. Create a new **Web Service**.
3. Set **Root Directory** to `server`.
4. Set **Build Command**: `npm ci && npm run build`
5. Set **Start Command**: `node dist/app.js`
6. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: `<Your MongoDB Atlas URI>`
   - `REDIS_HOST`: `<Your Redis Host>`
   - `JWT_ACCESS_SECRET`: `<Random 32+ char secret>`
   - `JWT_REFRESH_SECRET`: `<Random 32+ char secret>`
7. Click **Deploy Service**.

---

## 5. Docker Production Container Deployment (Self-Hosted VPS)

To deploy on your own VPS (Ubuntu 22.04 LTS / AWS EC2):

```bash
git clone https://github.com/your-org/speakwise-AI.git
cd speakwise-AI

# Create production .env file
cp .env.example .env

# Launch Docker Compose Stack with Nginx SSL
docker-compose -f docker-compose.prod.yml up -d --build
```
