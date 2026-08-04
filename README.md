
# Ethara - Employee Seat Allocation & Workspace Management System

## Overview

Ethara is a full-stack Employee Seat Allocation and Workspace Management System developed to simplify employee, project, and office seat management within an organization.

The application allows administrators to manage employees, assign projects, allocate office seats, visualize seat occupancy, and monitor workspace utilization through an interactive dashboard.

The project is built with a React frontend, FastAPI backend, PostgreSQL database, and integrates Google Gemini API for AI-based workspace assistance.

---

## Features

- Dashboard with workspace statistics
- Employee Management
- Project Management
- Interactive Seat Map Grid
- Seat Allocation and Release
- Employee Search and Filters
- CSV Import and Export
- Audit Logs
- AI Assistant (Google Gemini)

---

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- JavaScript

### Backend
- Python
- FastAPI
- SQLAlchemy

### Database
- PostgreSQL (Neon)

### AI
- Google Gemini API

---

## Project Structure

```
ethara-seat-allocation-project/
│
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── .env
│
├── src/
├── public/
├── package.json
├── README.md
└── .env
```

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ethara-seat-allocation-project
```

---

## Frontend Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Frontend will run at:

```
http://localhost:5173
```

---

## Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate the virtual environment.

### Windows

```bash
.venv\Scripts\activate
```

### Linux / macOS

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory:

```env
DATABASE_URL=<your_postgresql_database_url>

GEMINI_API_KEY=<your_gemini_api_key>
```

Run the backend server:

```bash
uvicorn app.main:app --reload
```

Backend will run at:

```
http://localhost:8000
```

---

## Default URLs

Frontend

```
http://localhost:5173
```

Backend

```
http://localhost:8000
```

API Documentation

```
http://localhost:8000/docs
```

---