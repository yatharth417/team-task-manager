# TaskFlow

## Railway Deployment

This repo has two services:
- Backend (Node/Express)
- Frontend (Vite/React)

### Backend (Railway)

**Service root:** `backend`

**Environment variables:**
- `MONGO_URI` = your MongoDB connection string
- `JWT_SECRET` = strong secret string
- `FRONTEND_URL` = your frontend Railway URL (comma-separated if multiple)
- `PORT` = optional (Railway sets this)

**Commands:**
- Build: `npm install`
- Start: `npm start`

### Frontend (Railway)

**Service root:** `frontend`

**Environment variables:**
- `VITE_API_URL` = `https://<your-backend>.up.railway.app/api`

**Commands:**
- Build: `npm install` then `npm run build`
- Start: `npx serve -s dist -l $PORT`

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
