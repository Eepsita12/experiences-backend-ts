# Experiences Backend (TypeScript)

Backend API for managing experiences and bookings with authentication and role-based access control (RBAC).

Offering features like user signup/login, experience creation & moderation, public listing, and booking.

---

## Tech Stack
- Node.js
- Express
- TypeScript
- SQLite
- JWT Authentication

---

## Setup Instructions & Environment Variables

### 1. Install dependencies
```bash
npm install
````

### 2. Environment variables

Create a `.env` file in the project root:

```env
PORT=4000
JWT_SECRET=supersecretkey
```

---

## Database Setup (Schema / Migrations)

This project uses **SQLite**.

The database file is created automatically when the server starts.

Schema is initialized in code using `CREATE TABLE IF NOT EXISTS`.

### Tables

#### users

* id (PK)
* email (unique)
* password_hash
* role (user | host | admin)
* created_at

#### experiences

* id (PK)
* title
* description
* location
* date
* created_by (user id)
* status (draft | published | blocked)
* created_at

#### bookings

* id (PK)
* user_id
* experience_id
* created_at
* UNIQUE(user_id, experience_id)

No manual migrations are required.

---

## How to Run

```bash
npm run dev
```

Server runs at:

```
http://localhost:4000
```

---

## Example cURL Requests

### Signup

```bash
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "password123",
    "role": "user"
  }'
```

---

### Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "password123"
  }'
```

Response includes a JWT token.

---

### Create Experience (host/admin)

```bash
curl -X POST http://localhost:4000/experiences \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Beach Trek",
    "description": "Morning guided trek",
    "location": "Goa",
    "date": "2026-03-01"
  }'
```

---

### Publish Experience (owner/admin)

```bash
curl -X PATCH http://localhost:4000/experiences/1/publish \
  -H "Authorization: Bearer <TOKEN>"
```

---

### Block Experience (admin only)

```bash
curl -X PATCH http://localhost:4000/experiences/block/1 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### List Published Experiences (public)

```bash
curl "http://localhost:4000/experiences?location=Goa&page=1&limit=5&sort=desc"
```

---

### Book Experience (user only)

```bash
curl -X POST http://localhost:4000/experiences/1/book \
  -H "Authorization: Bearer <USER_TOKEN>"
```

Duplicate bookings are prevented.

---

## RBAC Rules Implemented

* **User**

  * Can book published experiences
  * Cannot create or manage experiences

* **Host**

  * Can create experiences
  * Can publish their own experiences
  * Cannot block experiences

* **Admin**

  * Can publish or block any experience
  * Cannot book experiences

* **General**

  * Only published experiences are visible publicly
  * Blocked or draft experiences cannot be booked
  * JWT authentication required for protected routes

---

## Notes

* SQLite database file is generated locally and not committed
* Passwords are hashed using bcrypt
* JWT is used for stateless authentication

---

## Author

Eepsita Modi

```
