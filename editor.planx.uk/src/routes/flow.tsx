import { gql } from "@apollo/client";
import natsort from "natsort";
import { compose, mount, route, withData } from "navi";
import React from "react";
import { client } from "../lib/graphql";
import FlowEditor from "../pages/FlowEditor";
import FlowSettings from "../pages/FlowEditor/components/Settings";
import Checklist from "../pages/FlowEditor/components/forms/Checklist";
import FormModal from "../pages/FlowEditor/components/forms/FormModal";
import Portal from "../pages/FlowEditor/components/forms/Portal";
import Question from "../pages/FlowEditor/components/forms/Question";
import { api } from "../pages/FlowEditor/lib/store";
import { TYPES } from "../pages/FlowEditor/lib/flow";
import { makeTitle } from "./utils";

const components = {
  portal: Portal,
  question: Question,
  checklist: Checklist,
};

const newNode = route(async (req) => {
  const { type = "question", before = null, parent = null } = req.params;

  const extraProps = {} as any;

  const [flow, ...breadcrumbs] = req.params.flow.split(",");

  if (type === "portal") {
    const { data } = await client.query({
      query: gql`
        query GetFlows {
          flows(order_by: { name: asc }) {
            id
            name
            slug
            team {
              slug
            }
          }
        }
      `,
    });

    const sorter = natsort({ insensitive: true });

    extraProps.externalFlows = data.flows
      .filter(
        (flow) =>
          !window.location.pathname.includes(`${flow.team.slug}/${flow.slug}`)
      )
      .sort(sorter);

    extraProps.internalFlows = Object.entries(api.getState().flow.nodes)
      .filter(
        ([id, v]: any) =>
          v.$t === TYPES.Portal &&
          !window.location.pathname.includes(id) &&
          v.text
      )
      .map(([id, { text }]: any) => ({ id, text }))
      .sort((a, b) =>
        sorter(a.text.replace(/\W|\s/g, ""), b.text.replace(/\W|\s/g, ""))
      );
  }

  return {
    title: makeTitle(`New ${type}`),
    view: (
      <>
        <FlowEditor flow={flow} breadcrumbs={breadcrumbs} />,
        <FormModal
          type={type}
          Component={components[type]}
          extraProps={extraProps}
          before={before}
          parent={parent}
        />
      </>
    ),
  };
});

const editNode = route((req) => {
  const { id, before = null, parent = null } = req.params;

  const [flow, ...breadcrumbs] = req.params.flow.split(",");

  const { $t } = api.getState().getNode(id);

  const extraProps = {} as any;

  let type;
  switch ($t) {
    case TYPES.Portal:
      type = "portal";
      break;
    case TYPES.Checklist:
      type = "checklist";
      break;
    default:
      type = "question";
  }

  if (type === "checklist" || type === "question") {
    extraProps.options = api.getState().childNodesOf(id);
  }

  return {
    title: makeTitle(`Edit ${type}`),
    view: (
      <>
        <FlowEditor flow={flow} breadcrumbs={breadcrumbs} />,
        <FormModal
          type={type}
          Component={components[type]}
          extraProps={extraProps}
          id={id}
          handleDelete={() => {
            api.getState().removeNode(id, parent);
          }}
          before={before}
          parent={parent}
        />
      </>
    ),
  };
});

const nodeRoutes = mount({
  "/new/:before": newNode,
  "/new": newNode,
  "/:parent/nodes/new/:before": newNode,
  "/:parent/nodes/new": newNode,

  "/:id/edit": editNode,
  "/:id/edit/:before": editNode,
  "/:parent/nodes/:id/edit/:before": editNode,
  "/:parent/nodes/:id/edit": editNode,
});

const routes = compose(
  withData((req) => ({
    flow: req.params.flow.split(",")[0],
  })),

  mount({
    "/": route(async (req) => {
      const [flow, ...breadcrumbs] = req.params.flow.split(",");
      return {
        title: makeTitle([req.params.team, req.params.flow].join("/")),
        view: <FlowEditor flow={flow} breadcrumbs={breadcrumbs} />,
      };
    }),

    "/nodes": nodeRoutes,
    "/settings": route(async (req) => {
      return {
        title: makeTitle(
          [req.params.team, req.params.flow, "Settings"].join("/")
        ),
        view: <FlowSettings />,
      };
    }),
    "/settings/:tab": route(async (req) => {
      return {
        title: makeTitle(
          [req.params.team, req.params.flow, "Settings"].join("/")
        ),
        view: <FlowSettings tab={req.params.tab} />,
      };
    }),
  })
);

export default routes;
