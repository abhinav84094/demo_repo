# Careloop clinic demo

React/Vite workspace for the Clinic SaaS API. The dashboard supports account sign-in and verification, clinic setup and profile editing, care team management, services and provider fees, recurring schedules, public slot availability, publishing checks, and Razorpay subscription checkout.

## Run locally

1. Start the backend from `server` with its required `.env` values and MongoDB connection available. The API defaults to `http://localhost:5000`.
2. From `client`, run `npm ci` and `npm run dev`.
3. Open the Vite URL shown in the terminal. Vite forwards `/api` requests to `http://localhost:5000` so the HTTP-only login cookie works in local development.

To use another API host in development, set `VITE_API_TARGET` before starting Vite. For a separately hosted API, set `VITE_API_URL`; the server must allow credentialed CORS from the client origin.

## Backend boundaries

Public clinic pages and availability use the API. The backend currently has no mounted route for creating booking holds or appointments, so the public demo lets visitors inspect slots and select a time but directs them to contact the clinic to request a visit. Subscription checkout is real and requires the backend's Razorpay keys and configured plan prices. Registration email verification requires the backend email provider configuration.
