# TaskFlow

## Render + Vercel + MongoDB Atlas Deployment

This repo has two services:
- Backend (Node/Express)
- Frontend (Vite/React)

### Backend (Render)

**Service root:** `backend`

**Environment variables:**
- `MONGO_URI` = your MongoDB Atlas connection string
- `JWT_SECRET` = strong secret string
- `FRONTEND_URL` = your Vercel frontend URL (comma-separated if multiple)
- `PORT` = optional (Render sets this)

**Commands:**
- Build: `npm install`
- Start: `npm start`

### Frontend (Vercel)

**Service root:** `frontend`

**Environment variables:**
- `VITE_API_URL` = `https://<your-render-backend>.onrender.com/api`

**Build command:** `npm install` then `npm run build`

**Output directory:** `dist`

### Local Dev

**Backend**
- `cd backend`
- `npm install`
- `npm run dev`

**Frontend**
- `cd frontend`
- `npm install`
- `npm run dev`

The frontend uses `VITE_API_URL` if set; otherwise it calls `/api`.
