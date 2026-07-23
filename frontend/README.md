# BoardTalk Frontend

The client-side application for BoardTalk, built with React, Vite, and Tailwind CSS. It leverages the Tldraw library for the interactive canvas experience and Socket.io for real-time collaboration.

## 🛠 Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + UI components via `lucide-react`
- **Canvas:** Tldraw
- **Real-time:** Socket.io-client
- **State Management:** React Query, Zustand
- **Routing:** React Router

## 🚀 Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Ensure your variables point to your local or remote backend:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   VITE_WS_URL=http://localhost:5000
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:5173`.

*Note: Detailed component architecture and UI workflow designs will be documented here later.*
