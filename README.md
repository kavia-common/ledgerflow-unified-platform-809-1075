# ledgerflow-unified-platform-809-1075

Backend (Express + Prisma) quick start

1) Set environment variables
- Create a .env file inside ledgerflow_backend_api with DATABASE_URL pointing to your MySQL instance and JWT_SECRET for signing JWTs.
  See .env.example for a template:
  DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DBNAME"
  JWT_SECRET="replace-with-strong-random-secret"

Note: The deployment environment will provide actual values; do not hardcode credentials in code.

2) Install dependencies
cd ledgerflow_backend_api
npm install

3) Generate Prisma Client
npm run prisma:generate

4) Run initial migration
- For development (creates a new migration if needed):
npm run prisma:migrate

- For deploying existing migrations:
npm run prisma:deploy

5) Seed database with basic test data
npm run db:seed

6) Start the backend
npm run dev  (for dev with nodemon)
or
npm start   (for production-like start)

Auth Endpoints
- POST /auth/signup
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh
- GET  /auth/me (requires Authorization: Bearer <accessToken>)

Useful scripts (from package.json)
- prisma:generate -> prisma generate
- prisma:migrate -> prisma migrate dev --name init
- prisma:deploy  -> prisma migrate deploy
- prisma:studio  -> prisma studio
- db:seed        -> node prisma/seed.js

Troubleshooting
- Ensure DATABASE_URL is reachable from the container.
- Ensure JWT_SECRET is set; otherwise JWT verification will fail.
- If using a separate database container, verify host/port/user/password and that the DB exists.
- If you edited prisma/schema.prisma, re-run prisma:generate and prisma:migrate.