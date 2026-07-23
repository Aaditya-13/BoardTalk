# BoardTalk Backend

The server-side application for BoardTalk. It acts as the central hub for real-time collaboration, handles OAuth authentication, interfaces with the Google GenAI API for drawing generations, and manages persistent state in PostgreSQL.

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Real-time:** Socket.io
- **AI Integration:** Google GenAI SDK (Gemini)
- **Security:** Passport.js (OAuth), JWT, express-rate-limit

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
   Fill in your specific keys for the database connection, OAuth providers, and Google Gemini API:
   ```env
   DATABASE_URL="postgresql://user:pass@localhost:5432/boardtalk"
   GEMINI_API_KEY="your_api_key_here"
   # ... add OAuth Client IDs and Secrets
   ```

3. **Database Migration:**
   Apply the Prisma schema to your local PostgreSQL instance:
   ```bash
   npx prisma db push
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The backend will start on `http://localhost:5000`.

*Note: Detailed architecture covering socket events, CRDT reconciliation, and backend data flow will be documented here later.*
