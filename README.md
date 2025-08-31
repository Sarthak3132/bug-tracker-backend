# Bug Tracker API

A robust RESTful backend API for project bug tracking and management. Built with Node.js, Express, and MongoDB, featuring secure authentication, role-based access control, detailed project and bug management, and audit trails.

## Features

- 🔐 User authentication with JWT and OAuth (Google)
- 👥 Role-based access control (Admin, Developer, Tester)
- 📁 Project creation and membership management
- 🐛 Bug tracking with status, priority, assignment, and history
- 💬 Bug commenting system
- 📸 Secure file uploads for avatars
- 📄 Pagination, filtering, and sorting on list endpoints
- ✅ Validation and comprehensive error handling
- 🔒 Security middleware (Helmet, CORS, Rate limiting)

## Table of Contents

- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Authentication](#api-authentication)
- [API Endpoints](#api-endpoints)
- [Query Parameters](#query-parameters)
- [Error Handling](#error-handling)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

### Prerequisites

- Node.js >= 16.x
- MongoDB instance (local or cloud)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bug-tracker-backend.git
cd bug-tracker-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (see below) by creating a `.env` file.

4. Start the server in development mode:
```bash
npm run dev
```

The API will be available at: `http://localhost:5000`

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/bug-tracker

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Session Configuration
SESSION_SECRET=your_random_session_secret

# Email Configuration (Optional)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
```

## API Authentication

Authentication is via Bearer JWT tokens.

1. Obtain token by logging in via `/api/auth/login` or using OAuth endpoints
2. Include token in header for protected routes:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication
| Method | URL | Description | Auth Required |
|--------|-----|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/google` | Google OAuth login | No |

### Users
| Method | URL | Description | Auth Required | Roles |
|--------|-----|-------------|---------------|-------|
| GET | `/api/users/profile` | Get logged-in user profile | Yes | Any |
| PUT | `/api/users/profile` | Update logged-in user profile | Yes | Any |
| POST | `/api/users/profile/avatar` | Upload/update user avatar | Yes | Any |
| GET | `/api/users` | Get all users | Yes | Admin Only |

### Projects
| Method | URL | Description | Auth Required | Roles |
|--------|-----|-------------|---------------|-------|
| GET | `/api/projects` | Get projects user is member of | Yes | Any (member only) |
| POST | `/api/projects` | Create a project (creator auto admin) | Yes | Any |
| GET | `/api/projects/:projectId` | Get project details | Yes | Member |
| PUT | `/api/projects/:projectId` | Update project | Yes | Admin |
| DELETE | `/api/projects/:projectId` | Delete project | Yes | Admin |
| GET | `/api/projects/:projectId/members` | List project members | Yes | Member |
| POST | `/api/projects/:projectId/members` | Add member to project | Yes | Admin |
| DELETE | `/api/projects/:projectId/members/:memberId` | Remove member from project | Yes | Admin |

### Bugs (per Project)
| Method | URL | Description | Auth Required | Roles |
|--------|-----|-------------|---------------|-------|
| GET | `/api/projects/:projectId/bugs` | Get all bugs of a project | Yes | Member |
| POST | `/api/projects/:projectId/bugs` | Add new bug to project | Yes | Member |
| GET | `/api/projects/:projectId/bugs/:bugId` | Get details of a bug | Yes | Member |
| PUT | `/api/projects/:projectId/bugs/:bugId` | Update a bug including assignment | Yes | Member |
| DELETE | `/api/projects/:projectId/bugs/:bugId` | Delete a bug | Yes | Admin or Assigned Role |
| POST | `/api/projects/:projectId/bugs/:bugId/assign` | Assign bug to user | Yes | Member |
| POST | `/api/projects/:projectId/bugs/:bugId/comments` | Add comment to a bug | Yes | Member |

## Query Parameters

### Bug Filtering & Sorting
```
GET /api/projects/:projectId/bugs?status=open&priority=high&limit=20&skip=0&sortBy=createdAt&sortOrder=desc
```

**Available Parameters:**
- `status`: Filter by bug status (open, in-progress, resolved, closed)
- `priority`: Filter by priority (low, medium, high, critical)
- `assignedTo`: Filter by assigned user ID
- `reportedBy`: Filter by reporter user ID
- `startDate`: Filter bugs created after this date
- `endDate`: Filter bugs created before this date
- `searchText`: Search in title and description
- `limit`: Number of results (max 100, default 10)
- `skip`: Number of results to skip (pagination)
- `sortBy`: Sort field (createdAt, priority, status, title)
- `sortOrder`: Sort direction (asc, desc)

## Request & Response Examples

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "developer"
}
```

### Create Bug
```bash
POST /api/projects/64c4d8f94f1eab0012345676/bugs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "UI button not working",
  "description": "The submit button is not clickable on mobile",
  "status": "open",
  "priority": "high",
  "assignedTo": "64b0a2f4e5d3c2b4a7f9d123"
}
```

**Response:**
```json
{
  "_id": "64c4d8f94f1eab0012345678",
  "title": "UI button not working",
  "description": "The submit button is not clickable on mobile",
  "status": "open",
  "priority": "high",
  "assignedTo": {
    "_id": "64b0a2f4e5d3c2b4a7f9d123",
    "username": "developer1",
    "email": "dev1@example.com"
  },
  "reportedBy": {
    "_id": "64c4d8f94f1eab0012345677",
    "username": "tester1",
    "email": "tester1@example.com"
  },
  "project": "64c4d8f94f1eab0012345676",
  "comments": [],
  "createdAt": "2025-01-28T12:00:00.000Z",
  "updatedAt": "2025-01-28T12:00:00.000Z"
}
```

## Error Handling

The API uses conventional HTTP response codes and returns JSON error responses:

```json
{
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Set secure JWT secrets
4. Configure proper CORS origins

### Docker Deployment
```bash
# Build image
docker build -t bug-tracker-api .

# Run container
docker run -p 5000:5000 --env-file .env bug-tracker-api
```

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middlewares/     # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── app.js          # Express app setup
└── server.js       # Server entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT + Passport.js
- **Security:** Helmet, CORS, Rate limiting
- **File Upload:** Multer
- **Logging:** Winston
- **Validation:** Express-validator