# BoardTalk

BoardTalk is a real-time collaborative whiteboard built for modern engineering teams. It allows users to brainstorm, wireframe, and chat seamlessly in real-time, augmented with AI-powered diagram generation.

## 🚀 Overview

The platform is split into two primary pieces:
- **[Frontend](./frontend/)**: A React + Vite application powered by Tldraw for the canvas and Socket.io for real-time collaboration.
- **[Backend](./backend/)**: A Node.js + Express server handling WebSockets, authentication, AI prompt processing via Google GenAI, and data persistence with PostgreSQL & Prisma.

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL

### Running Locally
To spin up the entire application locally, you will need to start both the frontend and backend servers. 

1. Install dependencies in both the `frontend` and `backend` directories.
2. Set up your environment variables by copying `.env.example` to `.env` in both the `frontend` and `backend` directories.
3. Start the backend server (`npm run dev` in `/backend`).
4. Start the frontend server (`npm run dev` in `/frontend`).

*Note: Detailed architecture, workflow diagrams, and engineering decisions will be documented here soon.*
