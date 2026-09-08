# MedVerse

MedVerse is a healthcare platform with a Spring Boot backend and a multi-project Angular frontend.

## Project Structure

```text
MedVerse/
├── MedVerse_Backend/       # Spring Boot REST/WebSocket backend
├── MedVerse_Frontend/      # Angular workspace
│   ├── projects/auth-admin
│   ├── projects/healthcare-app
│   ├── projects/learning-app
│   └── projects/shared-*
└── shared-assets/          # Shared frontend assets and UI references
```

## Technology Stack

### Backend

- Java 17
- Spring Boot 3.2.5
- Spring Security and JWT
- Spring Data JPA and JDBC
- PostgreSQL and H2
- WebSocket/STOMP
- Maven Wrapper

### Frontend

- Angular 18
- TypeScript
- Tailwind CSS
- Chart.js and ng2-charts
- STOMP.js
- RxJS

## Prerequisites

Install the following before running the project:

- Java 17 or newer
- Node.js and npm
- PostgreSQL for the normal backend runtime

## Backend Setup

Open PowerShell in the backend directory:

```powershell
cd MedVerse_Backend
```

Configure the database and JWT secret using environment variables:

```powershell
$env:POSTGRES_URL="jdbc:postgresql://localhost:5432/medverse"
$env:POSTGRES_USER="postgres"
$env:POSTGRES_PASSWORD="your-database-password"
$env:JWT_SECRET="your-long-random-jwt-secret"
$env:MEDVERSE_ADMIN_PASSWORD="your-admin-password"
```

Run the backend:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend runs on:

```text
http://localhost:9090
```

## Frontend Setup

Open PowerShell in the frontend directory and install the locked dependencies:

```powershell
cd MedVerse_Frontend
npm ci
```

This is a multi-project Angular workspace. Start an application by specifying its project name:

```powershell
npx ng serve auth-admin
npx ng serve healthcare-app
npx ng serve learning-app
```

The development server runs on:

```text
http://localhost:4200
```

## Frontend Builds

Build an individual application:

```powershell
npx ng build auth-admin
npx ng build healthcare-app
npx ng build learning-app
```

Build shared libraries:

```powershell
npx ng build shared-auth
npx ng build shared-models
npx ng build shared-services
npx ng build shared-ui
```

Build artifacts are written to `MedVerse_Frontend/dist/` and are excluded from Git.

## Testing

Run backend tests with:

```powershell
cd MedVerse_Backend
.\mvnw.cmd test
```

Run frontend tests with:

```powershell
cd MedVerse_Frontend
npm test
```

## Security Notes

- Do not commit database passwords, JWT secrets, SMTP passwords, or private API keys.
- Use environment variables for local and deployment secrets.
- Generated files, logs, build output, IDE settings, and local configuration are excluded by `.gitignore`.
- Change all default development passwords before deploying the application.

## Repository

[MedVerse on GitHub](https://github.com/nirajkumar2001/MedVerse)
