# 🚗 SmartPark – Smart Parking Reservation System

<p align="center">
  <strong>Your Parking Spot, Just a Click Away.</strong>
</p>

<p align="center">
  A full-stack Smart Parking Reservation System designed to simplify parking management through online reservations, digital payments, QR-based entry and exit, and administrative controls.
</p>

<p align="center">
  <a href="https://smart-parking-reservation-system-one.vercel.app/">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-Visit_SmartPark-blue?style=for-the-badge" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React.js-blue?logo=react" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql" />
  <img src="https://img.shields.io/badge/Language-Python-yellow?logo=python" />
  <img src="https://img.shields.io/badge/Build-Vite-646CFF?logo=vite" />
</p>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [User Portal](#-user-portal)
  - [Admin Dashboard](#-admin-dashboard)
  - [Smart Parking Management](#-smart-parking-management)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Installation and Setup](#-installation-and-setup)
- [Database Information](#-database-information)
- [Booking and QR Workflow](#-booking-and-qr-workflow)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Version Control and Collaboration](#-version-control-and-collaboration)
- [Future Enhancements](#-future-enhancements)
- [Project Information](#-project-information)

---

## 🌟 Overview

**SmartPark** is a web-based smart parking management platform that allows users to find available parking spaces, reserve slots in advance, make digital payments, and navigate to their allocated parking locations.

The system also provides an administrative dashboard to manage parking areas, parking slots, bookings, users, EV charging facilities, and parking operations.

The project aims to reduce the time spent searching for parking, improve parking space utilization, and provide a convenient and organized parking experience.

## ✨ Key Features

<details>
<summary><strong>👤 User Portal</strong></summary>

- User registration and secure login.
- Search parking areas and view available parking slots.
- Check slot availability based on date and time.
- Book parking slots online.
- View booking history and booking details.
- Make digital payments through the payment module.
- Generate QR codes for parking entry.
- Access QR-based parking exit functionality.
- Navigate to assigned parking locations.
- View booking-related notifications.
- Submit, update, and delete parking feedback where permitted.

</details>

<details>
<summary><strong>🛠️ Admin Dashboard</strong></summary>

- Centralized administrative dashboard.
- Manage parking areas and parking slots.
- View and manage user bookings.
- Manage registered users.
- Monitor parking occupancy and availability.
- Manage EV charging facilities.
- Generate parking reports.
- Manage administrative settings.
- Monitor payment and refund information.
- Handle QR-based entry and exit operations.

</details>

<details>
<summary><strong>🚘 Smart Parking Management</strong></summary>

- Real-time parking slot availability based on existing bookings.
- Prevention of overlapping reservations.
- Automated booking status updates.
- QR-based vehicle entry and exit.
- Automatic booking completion after exit verification.
- Parking slot release after booking completion or cancellation.
- Support for EV charging facilities.
- Indoor parking navigation support.

</details>

## 💻 Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript, HTML, CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | JWT-based authentication |
| API Documentation | Swagger UI |
| QR Code | Python qrcode, qrcode.react, html5-qrcode |
| Frontend Routing | React Router |
| Version Control | Git and GitHub |

## 🏗️ System Architecture

SmartPark follows a client-server architecture in which the React frontend communicates with the FastAPI backend through REST APIs. The backend handles application logic, authentication, and database operations using SQLAlchemy ORM.

```text
                   SMARTPARK
                       |
          +------------+------------+
          |                         |
      USER PORTAL               ADMIN PORTAL
          |                         |
          +------------+------------+
                       |
                REACT FRONTEND
                       |
                   REST APIs
                       |
                FASTAPI BACKEND
                       |
          +------------+------------+
          |                         |
    APPLICATION                AUTHENTICATION
      ROUTES                       (JWT)
          |
      SQLALCHEMY ORM
          |
       POSTGRESQL
        DATABASE
```

## 📁 Project Structure

<details>
<summary><strong>View complete folder structure</strong></summary>

```text
SmartParkingSystem/
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── admin.py
│   │   │   ├── bookings.py
│   │   │   ├── feedback.py
│   │   │   ├── navigation.py
│   │   │   ├── notifications.py
│   │   │   ├── parking.py
│   │   │   ├── payments.py
│   │   │   ├── qr.py
│   │   │   ├── search.py
│   │   │   ├── slots.py
│   │   │   └── users.py
│   │   │
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   │
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   └── frontendSmartPark/
│       ├── public/
│       ├── src/
│       │   ├── admin/
│       │   ├── assets/
│       │   ├── components/
│       │   └── pages/
│       ├── package.json
│       └── vite.config.js
│
├── database/
│
├── .gitignore
└── README.md
```

</details>

## ⚙️ Installation and Setup

### Prerequisites

Make sure the following are installed:

- Python 3.10 or later
- Node.js and npm
- PostgreSQL
- Git

<details>
<summary><strong>Step 1: Clone the Repository</strong></summary>

```bash
git clone https://github.com/SiyaGarg9/SmartParkingSystem.git

cd SmartParkingSystem
```

</details>

<details>
<summary><strong>Step 2: Backend Setup</strong></summary>

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

</details>

<details>
<summary><strong>Step 3: Environment Configuration</strong></summary>

Create a `.env` file inside the `backend` directory.

Add the following configuration:

```env
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/smartparking
SECRET_KEY=YOUR_SECRET_KEY
```

Replace `YOUR_PASSWORD` with your PostgreSQL password and use a secure secret key.

**Important:** Never upload your `.env` file or expose database credentials and secret keys on GitHub.

</details>

<details>
<summary><strong>Step 4: Database Setup</strong></summary>

1. Start PostgreSQL.
2. Create a database named `smartparking`.
3. Ensure the database credentials match the `DATABASE_URL` in your `.env` file.
4. Execute the SQL schema or use the project's database initialization process to create the required tables.

</details>

<details>
<summary><strong>Step 5: Run the Backend</strong></summary>

From the `backend` directory, execute:

```bash
python -m uvicorn app.main:app --reload
```

Backend server:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

</details>

<details>
<summary><strong>Step 6: Frontend Setup</strong></summary>

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend/frontendSmartPark
```

Install frontend dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal, usually:

```text
http://localhost:5173
```

</details>

## 🗄️ Database Information

The system uses PostgreSQL for persistent storage and SQLAlchemy as its ORM.

The database supports information related to:

- Users and authentication.
- Parking areas and parking slots.
- Reservations and booking status.
- Payments and refunds.
- EV charging facilities.
- Indoor navigation.
- QR-based parking operations.
- Notifications and feedback.

## 🔄 Booking and QR Workflow

```text
Search Parking Area
        ↓
View Available Slots
        ↓
Select Parking Slot
        ↓
Create Booking
        ↓
Complete Payment
        ↓
Generate Booking QR
        ↓
Verify Entry
        ↓
Verify Exit
        ↓
Complete Booking
        ↓
Release Parking Slot
```

## 🔌 API Documentation

SmartPark uses RESTful APIs developed with FastAPI.

Interactive API documentation is available through Swagger UI:

**Local API Documentation:** http://127.0.0.1:8000/docs

The API includes endpoints for:

- User management
- Parking areas
- Parking slots
- Bookings
- Payments
- QR operations
- Navigation
- Notifications
- Feedback
- Administration

## 🔐 Security

- JWT-based authentication.
- Role-based access for users and administrators.
- Environment variables for sensitive configuration.
- Password and credential information is not stored in the public repository.
- Backend validation for booking and parking operations.

## 🤝 Version Control and Collaboration

This project is maintained using Git and GitHub.

Contributions from team members are managed through individual GitHub accounts, commits, branches, and pull requests.

### Contribution Guidelines

1. Fork or clone the repository.
2. Create a separate branch for your changes.
3. Implement and test your changes.
4. Commit your work with a meaningful commit message.
5. Push your branch to GitHub.
6. Create a Pull Request for review.

## 🚀 Future Enhancements

- Integration with real-time IoT parking sensors.
- Live parking occupancy monitoring.
- GPS-based navigation to parking locations.
- Integration with additional payment gateways.
- Mobile application support.
- Advanced analytics and predictive parking availability.

## 📌 Project Information

| Detail | Information |
|---|---|
| Project Name | SmartPark – Smart Parking Reservation System |
| Project Type | Full-Stack Web Application |
| Domain | Smart Cities, Intelligent Transportation Systems and Parking Management |
| Repository | [SmartParkingReservationSystem](https://github.com/SiyaGarg9/SmartParkingReservationSystem) |

## 👥 Contributors

This project was developed collaboratively by:

| Contributor | GitHub Profile | Role |
|---|---|---|
| Siya Garg | [@SiyaGarg9](https://github.com/SiyaGarg9) | Backend |
| Vaishnavi Singla | [@vaishnavisingla222](https://github.com/vaishnavisingla222) | Frontend |
| Nehmat Kaushal | [@nkaushalbe24-crypto](https://github.com/nkaushalbe24-crypto) | Database |

We collaborated on designing, developing, and integrating the different components of this project.

---

<p align="center">
  <strong>Developed as an academic team project with the objective of making parking management smarter, more efficient, and more accessible.</strong>
</p>

<h3 align="center">🚗 SmartPark – Your Parking Spot, Just a Click Away.</h3>
