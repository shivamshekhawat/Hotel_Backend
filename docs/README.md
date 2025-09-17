# Smart Hotel Room Automation Backend

A comprehensive Node.js backend API for hotel room automation and management.

## 🏗️ Project Structure

```
Hotel_Backend/
├── 📁 config/                    # Configuration files
│   ├── database.js              # Database configuration
│   ├── jwt.js                   # JWT configuration
│   ├── firebase.js              # Firebase/FCM configuration
│   └── index.js                 # Main config file
├── 📁 src/                      # Source code
│   ├── 📁 controllers/          # HTTP request handlers
│   │   ├── authController.js
│   │   ├── roomController.js
│   │   └── ...
│   ├── 📁 services/             # Business logic layer
│   │   ├── authService.js
│   │   ├── roomService.js
│   │   └── ...
│   ├── 📁 models/               # Database operations
│   │   ├── Hotel.js
│   │   ├── Room.js
│   │   └── ...
│   ├── 📁 routes/               # API route definitions
│   │   ├── authRoutes.js
│   │   ├── roomRoutes.js
│   │   └── ...
│   ├── 📁 middleware/           # Custom middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── 📁 utils/                # Utility functions
│   │   ├── logger.js
│   │   ├── helpers.js
│   │   └── ...
│   └── 📁 validators/           # Input validation schemas
│       ├── authValidators.js
│       ├── roomValidators.js
│       └── ...
├── 📁 tests/                    # Test files
│   ├── 📁 unit/
│   ├── 📁 integration/
│   └── 📁 fixtures/
├── 📁 docs/                     # Documentation
├── 📁 scripts/                  # Utility scripts
├── 📁 uploads/                  # File uploads
├── .env                        # Environment variables
├── .env.example               # Environment template
├── .gitignore
├── package.json
└── server.js                   # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- SQL Server (MSSQL)
- Firebase Admin SDK (for notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Hotel_Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   - Ensure SQL Server is running
   - Create the required database
   - Update connection details in `.env`

5. **Firebase Setup** (Optional)
   - Download Firebase Admin SDK key
   - Place `firebaseAdminSDK.json` in `config/` folder

### Environment Variables

```env
# Database Configuration
MSSQL_HOST=localhost
MSSQL_DB=hotel_db
MSSQL_USER=your_username
MSSQL_PASSWORD=your_password
MSSQL_PORT=1433

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=3153600000s

# Server Configuration
PORT=5000
NODE_ENV=development
```

## 🏃‍♂️ Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## 📚 API Documentation

### Authentication Endpoints

#### Register Hotel
```http
POST /api/auth/register
Content-Type: application/json

{
  "hotel_name": "Grand Hotel",
  "email": "admin@grandhotel.com",
  "password": "securepassword",
  "contact_number": "+1234567890",
  "address": "123 Main St, City, Country"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@grandhotel.com",
  "password": "securepassword"
}
```

### Room Management Endpoints

#### Create Room
```http
POST /api/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "room_number": "101",
  "room_type": "Standard",
  "price": 150.00,
  "capacity_adults": 2,
  "capacity_children": 1
}
```

#### Get All Rooms
```http
GET /api/rooms
Authorization: Bearer <token>
```

#### Update Room Temperature
```http
PUT /api/rooms/:id/temperature
Authorization: Bearer <token>
Content-Type: application/json

{
  "temperature": 22.5
}
```

#### Update DND Status
```http
PUT /api/rooms/:id/dnd
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_active": true
}
```

## 🏗️ Architecture

### Layer Separation

1. **Controllers**: Handle HTTP requests/responses
2. **Services**: Business logic and coordination
3. **Models**: Database operations only
4. **Routes**: API endpoint definitions
5. **Middleware**: Request processing pipeline
6. **Validators**: Input validation schemas
7. **Utils**: Reusable utility functions

### Key Features

- ✅ **Authentication & Authorization**: JWT-based auth
- ✅ **Input Validation**: Joi schema validation
- ✅ **Error Handling**: Centralized error management
- ✅ **Logging**: Comprehensive logging system
- ✅ **Database**: SQL Server with connection pooling
- ✅ **Notifications**: Firebase Cloud Messaging
- ✅ **Security**: Password hashing, token validation
- ✅ **Testing**: Jest test framework ready
- ✅ **Documentation**: Comprehensive API docs

## 🔧 Development

### Adding New Features

1. **Create Model**: Add database operations in `src/models/`
2. **Create Service**: Add business logic in `src/services/`
3. **Create Controller**: Add HTTP handlers in `src/controllers/`
4. **Create Routes**: Add API endpoints in `src/routes/`
5. **Add Validation**: Create validators in `src/validators/`
6. **Add Tests**: Create tests in `tests/`

### Code Style

- Use ES6+ features
- Follow async/await pattern
- Implement proper error handling
- Add comprehensive logging
- Write unit tests
- Document API endpoints

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- roomService.test.js
```

## 📝 Logging

The application includes comprehensive logging:

- **Info**: General application flow
- **Error**: Error conditions and exceptions
- **Warn**: Warning conditions
- **Debug**: Debug information (development only)

Logs are written to both console and `logs/app.log` file.

## 🔒 Security

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Rate limiting ready

## 🚀 Deployment

1. Set production environment variables
2. Ensure database is accessible
3. Configure Firebase Admin SDK
4. Run database migrations
5. Start the application

## 📞 Support

For issues and questions:
1. Check the logs in `logs/app.log`
2. Verify environment variables
3. Ensure database connectivity
4. Check Firebase configuration

## 📄 License

ISC License
