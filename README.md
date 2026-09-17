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

For immediate local development without Docker, the backend automatically uses
the `local` profile. It runs on H2, keeps OTP and rate-limit state in memory,
and seeds the admin account below:

```text
User ID: ADM00001
Password: Pass@123
```

Start it with:

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

The Angular development proxy forwards `/api` and `/ws` to this backend. Run
the admin application in a second terminal:

```powershell
cd MedVerse_Frontend
npm ci
npm run start:admin
```

Open `http://localhost:4202/login`. The healthcare and learning apps are
available with `npm start` on port 4200 and `npm run start:learning` on port 4201.

## Frontend Setup

Open PowerShell in the frontend directory and install the locked dependencies:

```powershell
cd MedVerse_Frontend
npm ci
```

This is a multi-project Angular workspace. The default start command runs the healthcare app:

```powershell
npm start
```

The development server runs on `http://localhost:4200`.

Build all three production applications for the unified frontend image:

```powershell
npm run build
```

The container serves the applications from one host:

```text
http://localhost:4200/healthcare/
http://localhost:4200/learning/
http://localhost:4200/admin/
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

## Netlify Deployment

The root `netlify.toml` configures one Netlify site for all three Angular apps:

```text
/healthcare/
/learning/
/admin/
```

In Netlify, choose **Add new site > Import an existing project**, select the
GitHub repository `nirajkumar2001/MedVerse`, and keep the repository root as
the base. Netlify will read `netlify.toml` and run the frontend build.

Set this Netlify environment variable to the public HTTPS URL of the deployed
Spring Boot backend:

```text
MEDVERSE_API_ORIGIN=https://your-backend-domain.example.com
```

The build generates proxy rules for `/api` and `/ws` from that value. Enable
automatic deploys for the `main` branch in **Site configuration > Build &
deploy > Continuous deployment**. Every pushed frontend change will then
trigger a new Netlify deployment; backend-only changes do not trigger the
frontend build unless the push also changes frontend files or Netlify is set to
build every push.

## Vercel Deployment

The root `vercel.json` is configured for the Vercel import flow. In the Vercel
form, enter:

```text
Framework Preset: Other
Root Directory: .
Build Command: npm run build:vercel --prefix MedVerse_Frontend
Output Directory: MedVerse_Frontend/dist
Install Command: npm ci --prefix MedVerse_Frontend
```

Add this environment variable for Production, Preview, and Development:

```text
MEDVERSE_API_ORIGIN=https://your-public-backend-domain.example.com
```

After the first deployment, Vercel automatically redeploys when changes are
pushed to the connected GitHub branch. The three applications are available at
`/healthcare/`, `/learning/`, and `/admin/` on the Vercel domain.

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

## Docker, Redis, and Kafka

The repository includes Dockerfiles and a Compose stack for PostgreSQL, Redis,
Kafka, the backend, and all three frontend applications behind one nginx server.

Build the backend image first, then start the stack:

```powershell
cd MedVerse_Backend
.\mvnw.cmd clean package
cd ..
docker compose up --build
```

With Compose enabled, the backend uses the `docker` profile and Redis for OTP/rate-limit state and
publishes `medical-record-updated` events to Kafka. Local and test profiles
keep the in-memory OTP/rate-limit fallback and disable Kafka so the backend can
still run without infrastructure services.

For a deployed frontend hostname, set `MEDVERSE_CORS_ALLOWED_ORIGINS` to the
frontend origin before starting Compose, for example:

```powershell
$env:MEDVERSE_CORS_ALLOWED_ORIGINS="https://medverse.example.com"
docker compose up --build
```

The Compose defaults are development-only. Set `POSTGRES_PASSWORD`,
`REDIS_PASSWORD`, `JWT_SECRET`, and `MEDVERSE_ADMIN_PASSWORD` through the
environment before using the stack outside local development.

## Continuous Integration

GitHub Actions is configured in `.github/workflows/ci.yml`. Pull requests and
pushes to `main` run the backend Maven tests and build the `auth-admin`
Angular application.

## Security Notes

- Do not commit database passwords, JWT secrets, SMTP passwords, or private API keys.
- Use environment variables for local and deployment secrets.
- Generated files, logs, build output, IDE settings, and local configuration are excluded by `.gitignore`.
- Change all default development passwords before deploying the application.

## Repository

[MedVerse on GitHub](https://github.com/nirajkumar2001/MedVerse)
