# Агентство недвижимости — Фронтенд

Сайт для поиска и управления объектами недвижимости.

Фронтенд-приложение для системы управления объектами недвижимости, построено с использованием Vue.js 3.

## Features

- 🔐 **Authentication**: User registration, login with JWT tokens
- 🏠 **Property Management**: Browse, search, filter, create, and manage properties
- ❤️ **Favorites**: Save properties to favorites for easy access
- 👥 **User Management**: Admin panel for managing users and roles
- 🏷️ **Property Types**: Manage property categories
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Vue.js 3** - Progressive JavaScript Framework
- **Vite** - Next Generation Frontend Tooling
- **Vue Router** - Official router for Vue.js
- **Pinia** - State management for Vue.js
- **Axios** - HTTP client for API communication

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see [estate-agency](https://github.com/Oleja123/estate-agency))

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Oleja123/estate-agency-frontend.git
cd estate-agency-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and set your API URL:
```
VITE_API_URL=http://localhost:8080
```

4. Start development server:
```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── api/              # API service layer
├── components/       # Reusable Vue components
│   ├── common/       # Common UI components
│   └── layout/       # Layout components
├── router/           # Vue Router configuration
├── stores/           # Pinia stores
├── views/            # Page components
│   ├── auth/         # Authentication pages
│   ├── properties/   # Property pages
│   ├── property-types/# Property type management
│   └── users/        # User management
├── App.vue           # Root component
├── main.js           # Application entry point
└── style.css         # Global styles
```

## API Endpoints

The frontend communicates with the following API endpoints:

- `/users/login` - User authentication
- `/users/register` - User registration
- `/tokens/refresh` - Token refresh
- `/properties` - Property CRUD operations
- `/property_types` - Property type management
- `/users` - User management

## Author

Салин Олег Алексеевич - ПИбд-43 - ФИСТ

## License

This project is private.
