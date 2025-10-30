🎓 E-Learning LMS - Backend API
Learning Management System (LMS) berbasis web dengan fitur lengkap untuk manajemen pembelajaran online.
📋 Features
✅ Completed Features

Authentication & Authorization

JWT-based authentication
Role-based access control (Admin, Dosen, Mahasiswa)
Secure password hashing


User Management

Full CRUD operations
Profile management
Password change
User statistics


Class Management

Create, read, update, delete classes
Student enrollment
Class details with student list


Material Management

Upload learning materials (PDF, videos, documents)
Material ordering
File management


Assignment Management

Create assignments with deadlines
Student submissions
Grading system
Feedback mechanism


Discussion Forum

Create discussion topics
Reply to discussions
Nested replies support


Notification System

Real-time notifications
Bulk notifications
Class-wide announcements
Mark as read/unread


Dashboard

Role-based statistics
Recent activities
Upcoming events



🛠️ Tech Stack

Runtime: Node.js
Framework: Express.js
Database: MySQL
Authentication: JWT (JSON Web Tokens)
Password Hashing: bcryptjs
File Upload: Multer
Security: Helmet, CORS
Logging: Morgan

📁 Project Structure
lms-backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── classController.js
│   │   ├── materialController.js
│   │   ├── assignmentController.js
│   │   ├── discussionController.js
│   │   ├── notificationController.js
│   │   └── dashboardController.js
│   ├── middlewares/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── classRoutes.js
│   │   ├── materialRoutes.js
│   │   ├── assignmentRoutes.js
│   │   ├── discussionRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── dashboardRoutes.js
│   └── app.js                   # Main application
├── public/
│   └── uploads/                 # Uploaded files
│       ├── materials/
│       ├── profiles/
│       └── assignments/
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
├── server.js                    # Entry point
└── README.md
🚀 Installation
Prerequisites

Node.js (v14 or higher)
MySQL (v8 or higher)
npm or yarn

Step 1: Clone Repository
bashgit clone <repository-url>
cd lms-backend
Step 2: Install Dependencies
bashnpm install
Step 3: Database Setup

Create MySQL database:

sqlCREATE DATABASE lms_database;

Import database schema:

bashmysql -u root -p lms_database < database/schema.sql
Or create tables manually using the schema from conversation sebelumnya.
Step 4: Environment Configuration

Copy .env.example to .env:

bashcp .env.example .env

Update .env with your configuration:

envNODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_database
DB_PORT=3306

JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
Step 5: Create Upload Directories
bashmkdir -p public/uploads/materials
mkdir -p public/uploads/profiles
mkdir -p public/uploads/assignments
Step 6: Run Application
Development mode:
bashnpm run dev
Production mode:
bashnpm start
Server will run on http://localhost:5000
📡 API Endpoints
Authentication
MethodEndpointDescriptionAuth RequiredPOST/api/auth/registerRegister new user❌POST/api/auth/loginLogin user❌GET/api/auth/meGet current user✅POST/api/auth/logoutLogout user✅
Users
MethodEndpointDescriptionAuth RequiredRoleGET/api/usersGet all users✅AdminGET/api/users/meGet current profile✅AllGET/api/users/:idGet user by ID✅Admin/SelfPOST/api/usersCreate user✅AdminPUT/api/users/:idUpdate user✅Admin/SelfPUT/api/users/:id/change-passwordChange password✅Admin/SelfDELETE/api/users/:idDelete user✅Admin
Classes
MethodEndpointDescriptionAuth RequiredRoleGET/api/classesGet all classes✅AllGET/api/classes/:idGet class detail✅AllPOST/api/classesCreate class✅Admin/DosenPUT/api/classes/:idUpdate class✅Admin/DosenDELETE/api/classes/:idDelete class✅AdminPOST/api/classes/:classId/enrollEnroll student✅AllGET/api/classes/:id/studentsGet class students✅All
Materials
MethodEndpointDescriptionAuth RequiredRoleGET/api/materials/class/:classIdGet materials by class✅AllGET/api/materials/:idGet material detail✅AllPOST/api/materialsCreate material✅Admin/DosenPUT/api/materials/:idUpdate material✅Admin/DosenDELETE/api/materials/:idDelete material✅Admin/Dosen
Assignments
MethodEndpointDescriptionAuth RequiredRoleGET/api/assignments/class/:classIdGet assignments✅AllGET/api/assignments/:idGet assignment detail✅AllPOST/api/assignmentsCreate assignment✅Admin/DosenPUT/api/assignments/:idUpdate assignment✅Admin/DosenDELETE/api/assignments/:idDelete assignment✅Admin/DosenPOST/api/assignments/:id/submitSubmit assignment✅MahasiswaGET/api/assignments/:id/submissionsGet submissions✅Admin/DosenPUT/api/assignments/submissions/:id/gradeGrade submission✅Admin/Dosen
Discussions
MethodEndpointDescriptionAuth RequiredGET/api/discussions/class/:classIdGet discussions✅GET/api/discussions/:idGet discussion detail✅POST/api/discussionsCreate discussion✅PUT/api/discussions/:idUpdate discussion✅DELETE/api/discussions/:idDelete discussion✅POST/api/discussions/:id/repliesCreate reply✅PUT/api/discussions/replies/:idUpdate reply✅DELETE/api/discussions/replies/:idDelete reply✅
Notifications
MethodEndpointDescriptionAuth RequiredRoleGET/api/notificationsGet notifications✅AllGET/api/notifications/unread-countGet unread count✅AllPOST/api/notifications/bulkSend bulk✅AdminPOST/api/notifications/send-to-classSend to class✅Admin/DosenPUT/api/notifications/:id/readMark as read✅AllPUT/api/notifications/read-allMark all as read✅AllDELETE/api/notifications/:idDelete notification✅All
Dashboard
MethodEndpointDescriptionAuth RequiredGET/api/dashboard/statsGet statistics✅GET/api/dashboard/recent-activitiesGet activities✅GET/api/dashboard/upcoming-eventsGet events✅
🧪 Testing API
Using cURL
Register:
bashcurl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "role_id": 3
  }'
Login:
bashcurl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123"
  }'
Get Current User (with token):
bashcurl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
Using Postman

Import the API endpoints
Set Authorization header: Bearer YOUR_JWT_TOKEN
Test all endpoints

🔒 Security

Passwords are hashed using bcryptjs
JWT tokens for authentication
Helmet for security headers
CORS configuration
Input validation
Role-based access control
File upload restrictions

📝 Default Users
After running the database schema, you'll have these demo accounts:
UsernamePasswordRoleadminadmin123Admindosen1dosen123Dosenmahasiswa1mahasiswa123Mahasiswa
⚠️ Important: Change these passwords in production!
🐛 Troubleshooting
Database Connection Error

Check if MySQL is running
Verify database credentials in .env
Ensure database exists

File Upload Error

Check upload directory permissions
Verify file size limits
Check allowed file types

JWT Token Error

Verify JWT_SECRET is set in .env
Check token expiration
Ensure proper Authorization header format