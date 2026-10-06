# AI Study Planner

## Description

AI Study Planner helps users organize study tasks, track progress, and receive personalized recommendations for their pending work.

## Features

- User authentication
- Study task management
- Task priorities
- Pending and completed tasks
- Simple task summary
- Personalized AI study recommendations using Groq

## Tech Stack

Frontend:
- React
- Vite
- JavaScript
- CSS

Backend:
- Node.js
- Express.js
- REST APIs

Database:
- MongoDB Atlas
- Mongoose

Authentication:
- JWT
- bcryptjs

AI:
- Groq API

## Project Structure

```text
AIStudyPlanner/
├── client/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── services/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── server.js
├── .gitignore
└── README.md
```

## Environment Variables

The backend requires these variables in `server/.env`:

```env
PORT=
MONGODB_URI=
JWT_SECRET=
GROQ_API_KEY=
GROQ_MODEL=
```

Do not commit real values. These variables are used only by the backend.

## Running the Project

Run the backend in one terminal:

```bash
cd server
npm install
npm start
```

Run the frontend separately in another terminal:

```bash
cd client
npm install
npm run dev
```

The backend runs on port 5000 by default and the Vite frontend runs on port 5173.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a user.
- `POST /api/auth/login` - Log in and receive a JWT.
- `GET /api/auth/me` - Get the authenticated user.

### Tasks

- `POST /api/tasks` - Create a task.
- `GET /api/tasks` - List the authenticated user's tasks.
- `GET /api/tasks/:id` - Get one owned task.
- `PUT /api/tasks/:id` - Update an owned task.
- `DELETE /api/tasks/:id` - Delete an owned task.

### AI

- `POST /api/ai/recommendations` - Generate a recommendation from pending tasks.

Protected endpoints require a valid JWT in the `Authorization` header.
