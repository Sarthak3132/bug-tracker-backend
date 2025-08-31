# Bug Tracker Backend

A RESTful API for managing bugs and issues in software projects.

## Features

- User authentication and authorization
- Role-based access control (Admin, Developer, Tester)
- Bug CRUD operations
- User management
- JWT-based authentication
- Input validation
- Error handling
- Rate limiting
- Security middleware

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Winston for logging

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env` file

3. Start MongoDB service

4. Run the application:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/logout` - Logout user

### Bugs
- GET `/api/bugs` - Get all bugs
- POST `/api/bugs` - Create new bug
- GET `/api/bugs/:id` - Get bug by ID
- PUT `/api/bugs/:id` - Update bug
- DELETE `/api/bugs/:id` - Delete bug

### Users
- GET `/api/users/profile` - Get user profile
- PUT `/api/users/profile` - Update user profile
- GET `/api/users` - Get all users (Admin only)