# Signape Backend

TypeScript REST API with **MongoDB** for the Signape digital signage dashboard.

## Stack

- Node.js + Express + TypeScript
- MongoDB + Mongoose
- Media metadata stored in MongoDB (files uploaded via UploadThing on the frontend)

## Setup

1. Install and start MongoDB locally, or use MongoDB Atlas.

2. Install dependencies and configure env:

```bash
cd signape/backend
npm install
cp .env.example .env
```

3. Start the server:

```bash
npm run dev
```

Server runs at `http://localhost:5000`. Start with an empty database — create screens, playlists, and media from the dashboard.

## Environment

Set your MongoDB connection URL in `.env`:

```env
PORT=5000
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/signape?retryWrites=true&w=majority
```

You can also use `MONGODB_URL` instead of `MONGODB_URI`.

Get the connection string from MongoDB Atlas: **Database → Connect → Drivers**.

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health check |
| GET | `/api/overview` | Dashboard overview stats |
| GET | `/api/devices/live` | Live device count |
| GET | `/api/devices` | List devices |
| POST | `/api/devices` | Create device |
| PATCH | `/api/devices/:id` | Update device |
| DELETE | `/api/devices/:id` | Delete device |
| GET | `/api/media` | List media assets |
| POST | `/api/media` | Save media metadata (called after UploadThing upload) |
| DELETE | `/api/media/:id` | Delete media record |
| GET | `/api/playlists` | List playlists |
| GET | `/api/schedules` | List schedules |
| GET/PATCH | `/api/settings` | User settings |
| GET/POST | `/api/present` | Present session |

## Media uploads

Files are uploaded through **UploadThing** on the Next.js frontend. After upload completes, metadata is saved to MongoDB via `POST /api/media`.
