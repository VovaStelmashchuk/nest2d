## The development instruction

### Prerequisites
- Machine with docker

Note: ** The local development tested only on mac os with Intel arch with [colima](https://github.com/abiosoft/colima) as docker engine. **
To install colima use brew 

```sh
brew install colima
```

### Postgres setup

```sh
mkdir .postgres-data
docker run -d --name nest2d_postgres -p 5432:5432 \
  -e POSTGRES_USER=nest2d -e POSTGRES_PASSWORD=nest2d -e POSTGRES_DB=nest2d \
  -v "$(pwd)/.postgres-data":/var/lib/postgresql/data postgres:17
```

Point the app at it (e.g. in `.env`):

```sh
NUXT_DATABASE_URL=postgres://nest2d:nest2d@localhost:5432/nest2d
```

The app creates and migrates the schema on startup (see `server/db/schema.js`);
the workers only read and write rows, so start the app at least once before the workers.

To stop the container runs

```sh
docker stop nest2d_postgres
```

To clean data 
```sh
docker rm nest2d_postgres
rm -rf .postgres-data
```

Postgres is the only storage needed to run the project locally: all files (dxf, svg, and user avatars) are saved
in the `files` table. It's implemented on purpose to make the developer life easier.

### Run the workers

```sh
docker stack deploy -c docker-stack-external.yml nest2d
```

The command runs a Postgres container and the workers (user file processing, nesting, strip file processing and strip nesting). Each workes will have the replication equals to **one**. 


### Rfor windows

```sh
docker compose -f docker-stack-external.yml up
```