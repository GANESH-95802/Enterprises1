# AI Enterprise Hub

A comprehensive enterprise management platform powered by AI. Manage businesses, products, customers, compliance, projects, healthcare records, skills, certificates, and more with intelligent automation.

## 🚀 Features

### Core Enterprise Management
- **Business Management** - Track and manage business entities
- **Product Management** - Inventory and sales tracking
- **Customer Management** - Customer relationship management
- **Compliance Tracking** - Regulatory compliance monitoring
- **Project Management** - Construction and enterprise project tracking
- **Healthcare Records** - Medical record management and AI analysis
- **Skills & Certificates** - Employee skill tracking and certification management
- **Report Generation** - Automated report creation

### AI-Powered Features
- **Sales Prediction** - AI-driven sales forecasting using Gemini/OpenAI
- **Document Generator** - Automated professional document creation
- **Medical Report Analysis** - AI-powered medical report explanations
- **Image Analysis** - Computer vision and image recognition
- **Skill Evaluation** - AI-based skill assessment and recommendations
- **AI Chatbot Assistant** - Intelligent enterprise assistant for queries and insights
- **Enterprise Report Generation** - Automated business intelligence reports
- **Sentiment Analysis** - Text sentiment analysis using OpenAI

### Enterprise Features
- **User Roles** - Admin, Manager, Employee role-based access
- **Activity Tracking** - Comprehensive audit logging
- **Notifications** - Real-time notification system
- **Dashboard Analytics** - Visual analytics with charts and metrics
- **Search & Pagination** - Advanced search with paginated results
- **File Management** - File upload and image processing

### Security
- **JWT Authentication** - Secure token-based authentication
- **Password Encryption** - bcrypt password hashing (12 rounds)
- **Rate Limiting** - API rate limiting protection
- **Input Validation** - Request validation using express-validator
- **Helmet Security** - HTTP security headers
- **CORS Protection** - Configurable cross-origin resource sharing
- **Role-Based Access** - Granular permission control

## 🏗️ Architecture

```
ai-enterprise-hub/
├── backend/
│   ├── config/           # Database and app configuration
│   ├── controllers/      # Route handlers
│   ├── middleware/        # Auth, validation, error handling
│   ├── models/           # Mongoose database models
│   ├── routes/           # Express route definitions
│   ├── services/         # Business logic layer
│   │   ├── ai/          # AI service integrations
│   │   └── ...
│   ├── utils/            # Helper utilities
│   ├── validators/       # Input validation rules
│   ├── server.js         # Application entry point
│   └── .env.example      # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React context providers
│   │   ├── pages/        # Page components
│   │   └── services/     # API service layer
│   ├── vercel.json       # Vercel deployment config
│   └── vite.config.js    # Vite build configuration
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: Google Gemini AI, OpenAI API
- **Security**: Helmet, CORS, Rate Limiting, bcrypt
- **Validation**: express-validator
- **File Processing**: Multer, Sharp

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Icons**: React Icons
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js >= 18.x
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key (optional)
- OpenAI API key (optional)

## 🔧 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd ai-enterprise-hub
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Environment Variables
Edit `backend/.env`:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
PORT=5000
NODE_ENV=development
```

### 5. Run Development Servers

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update user profile |

### CRUD Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{resource}` | List all (paginated) |
| GET | `/api/{resource}/:id` | Get by ID |
| POST | `/api/{resource}` | Create new |
| PUT | `/api/{resource}/:id` | Update |
| DELETE | `/api/{resource}/:id` | Delete |

Resources: `users`, `businesses`, `products`, `customers`, `compliance`, `construction-projects`, `healthcare-records`, `skills`, `certificates`, `reports`

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/predict-sales` | Sales prediction |
| POST | `/api/ai/generate-document` | Document generation |
| POST | `/api/ai/explain-medical` | Medical report analysis |
| POST | `/api/ai/analyze-image` | Image analysis |
| POST | `/api/ai/evaluate-skill` | Skill evaluation |
| POST | `/api/ai/recommendations` | AI recommendations |

### AI Chatbot
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chatbot/message` | Send chat message |
| POST | `/api/chatbot/generate-report` | Generate enterprise report |
| GET | `/api/chatbot/insights` | Get quick insights |

### Enterprise Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/enterprise/activities` | User activity log |
| GET | `/api/enterprise/activities/recent` | Recent activities (admin) |
| GET | `/api/enterprise/notifications` | User notifications |
| GET | `/api/enterprise/notifications/unread-count` | Unread count |
| PUT | `/api/enterprise/notifications/read-all` | Mark all read |
| PUT | `/api/enterprise/notifications/:id/read` | Mark one read |
| DELETE | `/api/enterprise/notifications/:id` | Delete notification |
| GET | `/api/enterprise/analytics` | Dashboard analytics |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/charts` | Chart data |

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

### Frontend (Netlify)
```bash
cd frontend
npm run build
# Upload dist/ folder to Netlify
```

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
4. Add environment variables from `.env.example`

### Backend (AWS Elastic Beanstalk)
1. Zip the backend folder
2. Upload to Elastic Beanstalk
3. Set environment variables in the console

### Database (MongoDB Atlas)
1. Create a free cluster at atlas.mongodb.com
2. Whitelist your deployment IP
3. Get connection string and update `MONGO_URI`

## 🧪 Testing

### Postman Collection
Import the Postman collection from `postman-collection.json` to test all API endpoints.

### Manual Testing
```bash
# Test backend health
curl http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🔒 Security Best Practices

1. **JWT Secret**: Use a strong, randomly generated secret
2. **MongoDB**: Use MongoDB Atlas with IP whitelisting
3. **API Keys**: Never commit API keys to version control
4. **Rate Limiting**: Adjust limits based on your needs
5. **CORS**: Restrict origins in production
6. **Input Validation**: All endpoints validate input
7. **Password Policy**: Enforce strong passwords
8. **HTTPS**: Always use HTTPS in production

## 📈 Performance Optimization

- Database indexes on frequently queried fields
- Pagination for all list endpoints
- Response compression
- Image optimization with Sharp
- Frontend code splitting with Vite
- Lazy loading for routes
- Caching headers for static assets

## 🗺️ Future Roadmap

### Phase 1 (Current)
- ✅ Core CRUD operations
- ✅ Authentication & authorization
- ✅ Basic AI integration
- ✅ Dashboard analytics

### Phase 2 (In Progress)
- ✅ OpenAI integration
- ✅ AI chatbot assistant
- ✅ Activity tracking
- ✅ Notification system
- ✅ Input validation
- ✅ Database indexes

### Phase 3 (Planned)
- 🔄 Real-time notifications (WebSocket)
- 🔄 Advanced analytics & reporting
- 🔄 Multi-language support
- 🔄 Mobile app (React Native)
- 🔄 CI/CD pipeline
- 🔄 Automated testing suite
- 🔄 Performance monitoring
- 🔄 Data export/import
- 🔄 Two-factor authentication
- 🔄 Audit trail dashboard

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For support, email support@aienterprisehub.com or create an issue in the repository.