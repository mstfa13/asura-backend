# Asura LifeTracker - Backend API# Asura LifeTracker - Backend Documentation



Backend API for the Asura LifeTracker application providing user authentication and data persistence.## Overview



## 🚀 Quick Deploy to RailwayThe backend provides user authentication and data persistence for the Asura LifeTracker application. Each user has their own profile with distinct data, progress, and analytics.



1. Go to [railway.app](https://railway.app)## Technology Stack

2. Connect this GitHub repository

3. Add environment variables (see below)- **Runtime**: Node.js

4. Deploy!- **Framework**: Express.js

- **Database**: SQLite3

## 🛠️ Technology Stack- **Authentication**: JWT (JSON Web Tokens)

- **Password Hashing**: bcryptjs

- **Runtime**: Node.js

- **Framework**: Express.js## API Endpoints

- **Database**: SQLite3

- **Authentication**: JWT (JSON Web Tokens)### Authentication

- **Password Hashing**: bcryptjs

#### Register a new user

## 📋 Environment Variables```

POST /api/register

| Variable | Description | Required |Content-Type: application/json

|----------|-------------|----------|

| `JWT_SECRET` | Secret key for JWT tokens (64+ chars) | ✅ |{

| `NODE_ENV` | Environment (`production` or `development`) | ✅ |  "username": "string",

| `FRONTEND_URL` | Your Vercel frontend URL for CORS | ✅ |  "password": "string"

| `PORT` | Server port (auto-set by Railway) | ❌ |}



Generate a JWT secret:Response:

```bash{

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  "token": "jwt_token",

```  "user": { "id": number, "username": "string" }

}

## 🔌 API Endpoints```



### Health Check#### Login

``````

GET /healthPOST /api/login

GET /api/healthContent-Type: application/json

```

{

### Authentication  "username": "string",

  "password": "string"

#### Register}

```http

POST /api/registerResponse:

Content-Type: application/json{

  "token": "jwt_token",

{  "user": { "id": number, "username": "string" }

  "username": "string",}

  "password": "string"```

}

```### Data Storage (Protected - Requires JWT)



#### LoginAll data endpoints require the `Authorization: Bearer <token>` header.

```http

POST /api/login#### Get user data by key

Content-Type: application/json```

GET /api/data/:key

{

  "username": "string",Response:

  "password": "string"{

}  "data": <stored_json_data> | null

```}

```

### User Data (Protected - requires Bearer token)

#### Save user data by key

#### Get Data```

```httpPOST /api/data/:key

GET /api/data/:keyContent-Type: application/json

Authorization: Bearer <token>

```<any_json_body>



#### Save DataResponse:

```http{

POST /api/data/:key  "success": true

Authorization: Bearer <token>}

Content-Type: application/json```



{ ...data }## Data Keys Used

```

| Key | Description |

## 🏃 Local Development|-----|-------------|

| `activity-store` | All activity data (boxing, gym, languages, custom activities) |

```bash| `gamification-store` | XP, levels, achievements, streaks |

# Install dependencies

npm install## Database Schema



# Create .env file### Users Table

cp .env.example .env| Column | Type | Description |

|--------|------|-------------|

# Start development server| id | INTEGER | Primary key, auto-increment |

npm run dev| username | TEXT | Unique username |

| password | TEXT | Bcrypt hashed password |

# Or start production server| created_at | DATETIME | Account creation timestamp |

npm start

```### User Data Table

| Column | Type | Description |

## 📁 Project Structure|--------|------|-------------|

| user_id | INTEGER | Foreign key to users |

```| key | TEXT | Data key identifier |

backend/| value | TEXT | JSON stringified data |

├── server.js        # Express server & routes| updated_at | DATETIME | Last update timestamp |

├── database.js      # SQLite database setup

├── package.json     # Dependencies## Running the Backend

├── .env.example     # Environment template

└── database/        # SQLite DB files (gitignored)```powershell

```cd backend

npm install

## 🔒 Security Notesnpm start

```

- Never commit `.env` files

- Use strong, unique `JWT_SECRET` in productionThe server runs on `http://localhost:3001` by default.

- CORS is configured to only allow your frontend URL in production

## Security Notes

1. **JWT Secret**: Change the `SECRET_KEY` in `server.js` for production
2. **CORS**: Currently allows all origins - restrict in production
3. **HTTPS**: Use HTTPS in production environments

## Data Flow

1. User registers/logs in → receives JWT token
2. Frontend stores token in localStorage
3. All subsequent API calls include token in Authorization header
4. Data changes are automatically synced to backend (debounced)
5. On login, data is loaded from backend and merged with local state
