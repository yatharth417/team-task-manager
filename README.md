# Team Task Manager (TaskFlow)

Simple full-stack app where users create projects, assign tasks, and track progress with project-level roles.

## Live Demo

https://team-task-manager-drab-chi.vercel.app

## Features

- Authentication (signup/login)
- Project & team management
- Task creation, assignment, and status tracking
- Dashboard with task summary (status + overdue)
- Role-based access control per project (Admin/Member)

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB Atlas

## Local Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

Create a `.env` in `backend/`:

```
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret
FRONTEND_URL=http://localhost:5173
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Optional: set `VITE_API_URL` in `frontend/.env` for custom API base.

## Deployment (Render + Vercel)

### Backend (Render)

- Root: `backend`
- Build: `npm install`
- Start: `npm start`
- Env: `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`

### Frontend (Vercel)

- Root: `frontend`
- Build: `npm install && npm run build`
- Output: `dist`
- Env: `VITE_API_URL=https://<your-render-backend>.onrender.com/api`
