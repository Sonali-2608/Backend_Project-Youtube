# Backend Project

A Node.js and Express backend API for a YouTube-style application. It includes user authentication, video publishing, comments, likes, playlists, subscriptions, dashboard stats, and health checks.

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- Cloudinary for media uploads
- Multer for file handling
- Cookie-based auth support

## Project Structure

```text
src/
  controllers/     Request handlers for each resource
  db/              MongoDB connection setup
  middlewares/     Auth and file upload middleware
  models/          Mongoose schemas and models
  routes/          Express route definitions
  utils/           Shared helpers and response/error classes
  app.js           Express app configuration
  constants.js     Shared constants
  index.js         Server entry point
public/
  temp/            Temporary local upload directory
```

## Getting Started

### Prerequisites

- Node.js
- MongoDB connection string
- Cloudinary account credentials

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=8000
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

The database name is configured as `youtube` in `src/constants.js`.

### Run the Development Server

```bash
npm run dev
```

By default, the API runs on:

```text
http://localhost:8000
```

## API Routes

Base URL:

```text
/api/v1
```

### Health Check

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/healthcheck` | Check API health |

### Users

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/users/register` | Register a user with avatar and optional cover image |
| POST | `/users/login` | Log in a user |
| POST | `/users/logout` | Log out current user |
| POST | `/users/refresh-token` | Refresh access token |
| POST | `/users/change-password` | Change current user's password |
| GET | `/users/current-user` | Get current authenticated user |
| PATCH | `/users/update-account` | Update account details |
| PATCH | `/users/avatar` | Update avatar image |
| PATCH | `/users/cover-image` | Update cover image |
| GET | `/users/c/:username` | Get channel profile by username |
| GET | `/users/history` | Get watch history |

### Videos

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/videos` | Get videos |
| POST | `/videos` | Publish a video with video file and thumbnail |
| GET | `/videos/:videoId` | Get video by ID |
| PATCH | `/videos/:videoId` | Update video details or thumbnail |
| DELETE | `/videos/:videoId` | Delete video |
| PATCH | `/videos/toggle/publish/:videoId` | Toggle publish status |

### Comments

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/comments/:videoId` | Get comments for a video |
| POST | `/comments/:videoId` | Add comment to a video |
| PATCH | `/comments/c/:commentId` | Update a comment |
| DELETE | `/comments/c/:commentId` | Delete a comment |

### Likes

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/likes/toggle/v/:videoId` | Toggle video like |
| POST | `/likes/toggle/c/:commentId` | Toggle comment like |
| POST | `/likes/toggle/t/:tweetId` | Toggle tweet like |
| GET | `/likes/videos` | Get liked videos |

### Playlists

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/playlist` | Create playlist |
| GET | `/playlist/:playlistId` | Get playlist by ID |
| PATCH | `/playlist/:playlistId` | Update playlist |
| DELETE | `/playlist/:playlistId` | Delete playlist |
| PATCH | `/playlist/add/:videoId/:playlistId` | Add video to playlist |
| PATCH | `/playlist/remove/:videoId/:playlistId` | Remove video from playlist |
| GET | `/playlist/user/:userId` | Get user's playlists |

### Tweets

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/tweets` | Create tweet |
| GET | `/tweets/user/:userId` | Get tweets by user |
| PATCH | `/tweets/:tweetId` | Update tweet |
| DELETE | `/tweets/:tweetId` | Delete tweet |

### Subscriptions

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/subscriptions/c/:channelId` | Get subscribed channels |
| POST | `/subscriptions/c/:channelId` | Toggle channel subscription |
| GET | `/subscriptions/u/:subscriberId` | Get channel subscribers |

### Dashboard

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/dashboard/stats` | Get channel statistics |
| GET | `/dashboard/videos` | Get channel videos |

## Authentication

Most routes are protected by JWT authentication. Send the access token either as an HTTP-only cookie named `accessToken` or in the authorization header:

```text
Authorization: Bearer <access_token>
```

## File Uploads

Uploads are handled with Multer and then sent to Cloudinary.

- User registration accepts `avatar` and optional `coverImage`
- Video publishing accepts `videoFile` and `thumbnail`
- Avatar update accepts `avatar`
- Cover image update accepts `coverImage`
- Video update can accept `thumbnail`

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with Nodemon |

## Notes

- Temporary upload files are stored in `public/temp`.
- API responses and errors are standardized through utility classes in `src/utils`.
- The app uses CORS with credentials enabled, so set `CORS_ORIGIN` to your frontend URL.
