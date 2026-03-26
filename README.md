# Strategy Forge Insight

Strategy Forge Insight is a comprehensive platform designed for creating, testing, and analyzing trading strategies. It combines a modern, responsive frontend with a robust, high-performance backend to provide traders and developers with the tools they need to gain insights into market data and strategy performance.

## 🚀 Features

### Frontend
The frontend is built with **React** and ** **, focusing on user experience and performance.
- **Modern UI/UX**: Built with **Shadcn UI** and **Tailwind CSS** for a sleek, responsive design.
- **Interactive Charts**: Visualizes market data and backtest results using **Recharts**.
- **Strategy Building**: Intuitive drag-and-drop interface powered by **dnd-kit**.
- **Efficient Data Management**: Uses **TanStack Query (React Query)** for caching and state management.
- **Robust Forms**: Implements **React Hook Form** with **Zod** validation.
- **Authentication**: Secure user authentication integrated with **Firebase**.

### Backend
The backend is a **FastAPI** application designed for speed and scalability.
- **RESTful API**: Provides endpoints for strategy management, market data, and backtesting.
- **Market Data Integration**: Fetches real-time and historical data using **yfinance**.
- **Backtesting Engine**: Powerful engine to test strategies against historical data.
- **Performance Optimization**: Utilizes **Redis** for caching frequently accessed data.
- **Data Processing**: Leverages **Pandas** and **NumPy** for efficient financial data analysis.
- **Security**: Secure authentication and authorization using **Firebase Admin**.

## 🛠️ Tools & Technologies

### Frontend
- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Lucide React
- **State/Fetching**: TanStack Query, Axios
- **Routing**: React Router DOM
- **Utilities**: date-fns, clsx, tailwind-merge

### Backend
- **Framework**: FastAPI
- **Server**: Uvicorn
- **Database**: MongoDB (Motor/PyMongo)
- **Caching**: Redis
- **Data Science**: Pandas, NumPy, yfinance
- **Auth**: Firebase Admin SDK

### DevOps & Infrastructure
- **Containerization**: Docker, Docker Compose
- **Deployment**: Vercel (Frontend), Render (Backend - implied)

## 💾 Database

- **MongoDB**: The primary database used to store:
  - User profiles and settings
  - Created trading strategies
  - Historical backtest results and logs
- **Redis**: Used as a caching layer to store:
  - Real-time market data
  - Session data
  - API response caching to reduce latency

## 🏃‍♂️ Running the Project

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB (Local or Atlas)
- Redis (Optional, for caching)

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:8082` (or similar).

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   - Create a `.env` file based on `.env.example`.
   - Add your MongoDB URI, Redis URL, and Firebase credentials.
5. Start the server:
   ```bash
   python main.py
   # OR
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### Docker (Full Stack)
To run the entire stack (Frontend, Backend, Redis) using Docker:
```bash
docker-compose up --build
```

## 📄 License
[Add License Information Here]
