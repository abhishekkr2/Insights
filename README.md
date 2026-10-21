# Text Explainer

Paste text, get a summary and a point-by-point explanation.
React (Vite) frontend, Node + Express backend, Groq API.

## Setup

```bash
npm run install:all
cp server/.env.example server/.env   # then add your GROQ_API_KEY
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:5000 (the Vite dev server proxies /api to it)

## Deploying

- Backend env vars: `GROQ_API_KEY`, `GROQ_MODEL`, `CLIENT_ORIGIN` (your frontend URL, exact match for CORS).
- Frontend: set `VITE_API_URL` to the backend URL before `npm run build --prefix client`.
