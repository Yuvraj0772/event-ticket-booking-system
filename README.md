# ShowNest – Event Ticket Booking System

ShowNest is a full-stack event ticket booking application where users can explore events, view showtimes, select seats, create bookings, and complete a simulated payment.

## Features

- User registration and login
- Browse and search events
- Filter events by category
- View available showtimes
- Interactive seat selection
- Redis-based temporary seat locking
- Booking creation and management
- Demo payment success and failure simulation
- Booking confirmation and status tracking

## Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express.js
- REST APIs

### Database and Infrastructure
- MongoDB
- Mongoose
- Redis
- JSON Web Tokens (JWT)

## Project Structure

```text
event-ticket-booking-system/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── routes/
│   └── package.json
│
└── README.md
```

## Local Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd event-ticket-booking-system
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Install frontend dependencies

```bash
cd ../client
npm install
```

### 4. Configure environment variables

Create a `.env` file in the server directory.

```env
PORT=5000
MONGODB_URI=mongodb_connection_string
REDIS_URL=redis_connection_string
JWT_SECRET=jwt_secret
```

Use the exact variable names expected by your backend configuration files.

### 5. Run the application

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

## Payment Information

ShowNest currently uses a simulated payment flow for demonstration purposes. No real money is charged.

## Future Improvements

- Integration with a real payment gateway
- Booking history and user dashboard
- Email booking confirmation
- Improved event recommendations

## Author

Developed as a full-stack development project.

