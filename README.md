# PlanX

## https://editor.planx.uk

### Running Locally

1. [Download and install Docker](https://docs.docker.com/get-docker/) if you don't have it already

1. Run the following command to get everything (postgres, sharedb, api and hasura server processes) up and running `docker-compose up --build -d`

1. Move into the hasura directory `cd hasura.planx.uk`

1. Install [hasura-cli](https://hasura.io/docs/latest/graphql/core/hasura-cli/index.html) if you don't have it `npm install -g hasura-cli`

1. Seed the database

   `hasura seed apply`

1. Move into the editor directory `cd ../editor.planx.uk`

1. Install [pnpm](https://github.com/pnpm/pnpm) if you don't have it `npm install -g pnpm`

1. Install dependencies `pnpm i`

1. Start the dev server! `pnpm start`, open http://localhost:3000 and login with a Google account

1. Optionally start the database console & graphiql at http://localhost:9695

   `hasura console`

#### Analytics

Running `docker-compose up` won't spin up [metabase](https://www.metabase.com/).
To spin it up, run:

  `docker-compose --profile analytics up`
