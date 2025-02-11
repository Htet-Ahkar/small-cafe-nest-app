# Development Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (>= 18.x)

- npm (>= 9.x)

- Docker

## Project Setup

### 1. Clone the Repository

### 2. Install Dependencies

```npm
npm i
```

### 3. Set Up Environment Variables

Copy the example environment file and update the values accordingly:

```terminal
cp .env.example .env
```

Modify `.env` with your database credentials and other configurations.

### 4. Database Setup

Using Docker

To start database

```npm
npm run db:dev:start
```

To restart database

```npm
npm run db:dev:restart
```

You can see these scripts in `package.json` file.

### 5. Start the Development Server

```terminal
npm run start:dev
```

Codebase Structure

```
/project-root
├── src/ # Main application code
│ ├── modules/ # Feature modules
│ ├── prisma/ # Prisma database setup
│ ├── common/ # Shared utilities
│ └── main.ts # Application entry point
├── test/ # Tests
├── docs/ # Documentation files
├── .env.example # Environment variables template
├── package.json # Dependencies and scripts
├── tsconfig.json # TypeScript configuration
└── README.md # Project overview
```

<!-- Useful Commands

Running the App

npm run start # Start in production mode
npm run start:dev # Start in development mode

Running Tests

npm run test # Run unit tests
npm run test:e2e # Run end-to-end tests

Linting & Formatting

npm run lint # Check for linting errors
npm run format # Format the codebase -->

## Debugging

Use `console.log()` for quick debugging.

<!-- Use npm run start:debug to attach a debugger. -->

<!-- Check logs in logs/ folder for errors. -->

## Contributing

Fork the repository.

Create a new branch.

Make your changes and commit them.

Open a pull request.

<!-- ## Troubleshooting

Issue

Solution

Port already in use

Run lsof -i :PORT and kill the process using kill -9 PID

Database connection error

Ensure PostgreSQL is running and credentials in .env are correct

Module not found

Run npm install to install dependencies -->

---

Happy Coding! 🚀
