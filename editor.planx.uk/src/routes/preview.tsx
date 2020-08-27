import gql from "graphql-tag";
import { NotFoundError, route } from "navi";
import React from "react";
import { client } from "../lib/graphql";
import { api } from "../pages/FlowEditor/lib/store";
import Preview from "../pages/Preview";

const routes = route(async (req) => {
  const { data } = await client.query({
    query: gql`
      query GetFlow($flowSlug: String!, $teamSlug: String!) {
        flows(
          limit: 1
          where: {
            slug: { _eq: $flowSlug }
            team: { slug: { _eq: $teamSlug } }
          }
        ) {
          id
          data
          team {
            theme
          }
        }
      }
    `,
    variables: {
      flowSlug: req.params.flow.split(",")[0],
      teamSlug: req.params.team,
    },
  });

  const flow = data.flows[0];

  if (!flow) {
    throw new NotFoundError();
  }

  api.getState().setFlow(flow.id, flow.data);

  return { view: <Preview theme={flow.team.theme} /> };
});

export default routes;
