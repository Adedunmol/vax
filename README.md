### Vax
An invoicing API

### Features
- Client Management – Create and manage profiles for clients.
- Automated Invoice & Reminder Emails – Send automated reminder emails and invoices to clients.
- Due Date Notifications – Automatically notify clients when an invoice is due.
- Sales Performance Analytics – Track earnings, trends, and overall performance.

### Technologies used
- [x] Typescript
- [x] Fastify
- [x] Drizzle ORM
- [x] Docker
- [x] Redis
- [x] PostgreSQL

### Installation

#### Prerequisites:

* [Docker](https://www.docker.com/get-started)
* [Docker Compose](https://docs.docker.com/compose/install/)

##### Running the application:

1. Clone the repository
```bash
$ git clone https://github.com/Adedunmol/vax.git
```

2. Change the `.env.sample` to `.env` and define the necessary environment variables.

3. Start the application in dev environment with docker compose:
```bash
$ cd vax
$ docker-compose -f docker-compose.dev.yml up --build -d
```

4. Migrate the database:
```bash
$ docker exec -d vax-app npm run db:generate
$ docker exec -d vax-app npm run db:migrate
```

5. Navigate to this endpoint `127.0.01:{PORT}/docs` to access the docs. PORT is the port defined in the `.env` file.

6. Navigate to this endpoint `127.0.0.1:{PORT}/bull-board` to check the queues. PORT is the port defined in the `.env` file. 

7. To stop the running containers, use:
```bash
$ docker-compose -f docker-compose.dev.yml down
```