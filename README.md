### Vax
An invoicing API

### Features
- Client Management – Create and manage profiles for clients.
- Automated Invoice & Reminder Emails – Send automated reminder emails and invoices to clients.
- Due Date Notifications – Automatically notify clients when an invoice is due.
- Sales Performance Analytics – Track earnings, trends, and overall performance.

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
$ npm run db:generate
$ npm run db:migrate
```

5. Navigate to this endpoint `http://localhost:{PORT}/docs` to access the docs. PORT is the port defined in the `.env` file.
   

6. To stop the running containers, use:
```bash
$ docker-compose down
```