import { gql } from "@apollo/client";
import tinycolor from "@ctrl/tinycolor";
import { TYPES } from "@planx/components/types";
import {
  add,
  clone,
  isClone,
  makeUnique,
  move,
  remove,
  ROOT_NODE_KEY,
  update,
} from "@planx/graph";
import debounce from "lodash/debounce";
import difference from "lodash/difference";
import omit from "lodash/omit";
import uniq from "lodash/uniq";
import pgarray from "pg-array";
import create from "zustand";
import vanillaCreate from "zustand/vanilla";

import { client } from "../../../lib/graphql";
import type { Flag, FlowSettings } from "../../../types";
import { FlowLayout } from "../components/Flow";
import { DEFAULT_FLAG_CATEGORY, flatFlags } from "../data/flags";
import { connectToDB, getConnection } from "./sharedb";

const SUPPORTED_DECISION_TYPES = [TYPES.Checklist, TYPES.Statement];

let doc: any;

const send = (ops: Array<any>) => {
  if (ops.length > 0) {
    console.log({ ops });
    doc.submitOp(ops);
  }
};

export type componentOutput = undefined | null | any | Array<any>;
export type userData = { answers: componentOutput; auto?: boolean };
export type breadcrumbs = Record<string, userData>;
export type nodeId = string;
export type node = { id?: nodeId; type?: TYPES; data?: any; edges?: nodeId[] };
export type flow = Record<string, node>;
export interface passport {
  data?: any;
  info?: any;
}

interface Store extends Record<string | number | symbol, unknown> {
  addNode: any; //: () => void;
  childNodesOf: (id: string | undefined) => Record<string, any>[];
  connect: (src: string, tgt: string, object?: any) => void;
  connectTo: (id: string) => void;
  copyNode: (id: string) => void;
  createFlow: any; //: () => Promise<string>;
  deleteFlow: (teamId: number, flowSlug: string) => Promise<object>;
  flow: flow;
  flowLayout: FlowLayout;
  getFlows: any; //: () => any;
  getNode: (id: string) => Record<string, any>;
  id: string;
  isClone: (id: string) => boolean;
  makeUnique: any; //: () => void;
  moveNode: any; //: () => void;
  pasteNode: any; //: () => void;
  removeNode: any; //: () => void;
  showPreview: boolean;
  togglePreview: () => void;
  updateNode: any; //: () => void;
  // preview
  breadcrumbs: breadcrumbs;
  currentCard: () => Record<string, any> | null;
  passport: passport;
  record: any; //: () => void;
  resultData: (
    flagSet?: string,
    overrides?: { [flagId: string]: { heading?: string; description?: string } }
  ) => {
    [category: string]: {
      flag: Flag;
      responses: any[];
      displayText: { heading: string; description: string };
    };
  };
  resetPreview: any; //: () => void;
  sessionId: any; //: string;
  setFlow: any; //: () => void;
  startSession: any; //: () => void;
  previousCard: () => nodeId | undefined;
  collectedFlags: (
    upToNodeId: string,
    visited?: Array<string>
  ) => Array<string>;
  upcomingCardIds: () => nodeId[];
  updateFlowSettings: (
    flowId: string,
    newSettings: FlowSettings
  ) => Promise<number>;
}

export const vanillaStore = vanillaCreate<Store>((set, get) => ({
  flow: (undefined as unknown) as flow,

  id: (undefined as unknown) as string,

  showPreview: true,

  togglePreview: () => {
    set({ showPreview: !get().showPreview });
  },

  flowLayout: FlowLayout.TOP_DOWN,

  connectTo: async (id: string) => {
    if (id === get().id) return; // already connected to this ID

    console.log("connecting to", id, get().id);

    doc = getConnection(id);
    (window as any)["doc"] = doc;

    await connectToDB(doc);

    // set the ID of the flow to assist with deciding what to render
    set({ id });

    const cloneStateFromShareDb = () => {
      // console.debug("[NF]:", JSON.stringify(doc.data, null, 0));
      const flow = JSON.parse(JSON.stringify(doc.data));
      set({ flow });
    };

    // set state from initial load
    cloneStateFromShareDb();

    // local operation so we can assume that multiple ops will arrive
    // almost instantaneously so wait for 100ms of 'silence' before running
    const cloneStateFromLocalOps = debounce(cloneStateFromShareDb, 100);

    // remote operation, there might be network latency so wait for 0.5s
    const cloneStateFromRemoteOps = debounce(cloneStateFromShareDb, 500);

    doc.on("op", (_op: any, isLocalOp?: boolean) =>
      isLocalOp ? cloneStateFromLocalOps() : cloneStateFromRemoteOps()
    );
  },

  isClone: (id: string) => {
    // TODO: this can be faster!
    return isClone(id, get().flow);
  },

  getNode(id: any) {
    return {
      id,
      ...get().flow[id],
    };
  },

  connect: (src: string, tgt: string, { before = undefined } = {}) => {
    try {
      const [, ops] = clone(tgt, { toParent: src, toBefore: before })(
        get().flow
      );
      send(ops);
    } catch (err) {
      alert(err.message);
    }
  },

  addNode: (
    { id = undefined, type, data }: any,
    { children = undefined, parent = ROOT_NODE_KEY, before = undefined } = {}
  ) => {
    const [, ops] = add(
      { id, type, data },
      { children, parent, before }
    )(get().flow);
    send(ops);
  },

  updateNode: ({ id, data }: any, { children = undefined } = {}) => {
    const [, ops] = update(id, data, {
      children,
      removeKeyIfMissing: true,
    })(get().flow);
    send(ops);
  },

  makeUnique: (id: any, parent = undefined) => {
    const [, ops] = makeUnique(id, parent)(get().flow);
    send(ops);
  },

  removeNode: (id: any, parent: any = undefined) => {
    const [, ops] = remove(id, parent)(get().flow);
    send(ops);
  },

  moveNode(
    id: string,
    parent = undefined,
    toBefore = undefined,
    toParent = undefined
  ) {
    try {
      const [, ops] = move(id, (parent as unknown) as string, {
        toParent,
        toBefore,
      })(get().flow);
      send(ops);
      get().resetPreview();
    } catch (err) {
      alert(err.message);
    }
  },

  copyNode(id: string) {
    localStorage.setItem("clipboard", id);
  },

  pasteNode(toParent: any, toBefore: any) {
    try {
      const id = localStorage.getItem("clipboard");
      if (id) {
        const [, ops] = clone(id, { toParent, toBefore })(get().flow);
        send(ops);
      }
    } catch (err) {
      alert(err.message);
    }
  },

  childNodesOf(id: string | undefined = ROOT_NODE_KEY) {
    const { flow } = get();
    return (flow[id]?.edges || []).map((id) => ({ id, ...flow[id] }));
  },

  getFlows: async (teamId: number) => {
    client.cache.reset();
    const { data } = await client.query({
      query: gql`
        query GetFlow($teamId: Int!) {
          flows(
            order_by: { updated_at: desc }
            where: { team: { id: { _eq: $teamId } } }
          ) {
            id
            name
            slug
            updated_at
            operations(limit: 1, order_by: { id: desc }) {
              actor {
                first_name
                last_name
              }
            }
          }
        }
      `,
      variables: {
        teamId,
      },
    });

    return data;
  },

  createFlow: async (teamId: any, newName: any, data = {}): Promise<string> => {
    let response = (await client.mutate({
      mutation: gql`
        mutation CreateFlow(
          $name: String
          $data: jsonb
          $slug: String
          $teamId: Int
        ) {
          insert_flows_one(
            object: {
              name: $name
              data: $data
              slug: $slug
              team_id: $teamId
              version: 1
            }
          ) {
            id
            data
          }
        }
      `,
      variables: {
        name: newName,
        slug: newName,
        teamId,
        data,
      },
    })) as any;

    const { id } = response.data.insert_flows_one;

    response = await client.mutate({
      mutation: gql`
        mutation MyMutation($flow_id: uuid, $data: jsonb) {
          insert_operations_one(
            object: { flow_id: $flow_id, data: $data, version: 1 }
          ) {
            id
          }
        }
      `,
      variables: {
        flow_id: id,
        data: {
          m: { ts: 1592485241858 },
          v: 0,
          seq: 1,
          src: "143711878a0ab64c35c32c6055358f5e",
          create: {
            data,
            type: "http://sharejs.org/types/JSONv0",
          },
        },
      },
    });

    return newName;
  },

  deleteFlow: async (teamId, flowSlug) => {
    const response = await client.mutate({
      mutation: gql`
        mutation MyMutation($team_id: Int, $flow_slug: String) {
          delete_flows(
            where: { team_id: { _eq: $team_id }, slug: { _eq: $flow_slug } }
          ) {
            affected_rows
          }
        }
      `,
      variables: {
        flow_slug: flowSlug,
        team_id: teamId,
      },
    });
    return response;
  },

  // Preview

  passport: {
    data: {},
  },

  sessionId: "",

  breadcrumbs: {},

  async startSession({
    passport,
  }: {
    passport: { data: Record<string, any>; info: any };
  }) {
    // ------ BEGIN PASSPORT DATA OVERRIDES ------

    // TODO: move all of the logic in this block out of here and update the API

    // In this block we are converting the vars stored in passport.data object
    // from the old boolean values style to the new array style. This should be
    // done on a server but as a temporary fix the data is currently being
    // converted here.

    // More info:
    // GitHub comment explaining what's happening here https://bit.ly/2HFnxX2
    // Google sheet with new passport schema https://bit.ly/39eYp4A

    // https://tinyurl.com/3cdrnr7j

    // converts what is here
    // https://gist.github.com/johnrees/e0e3197e3915489a69c743b38faf489e
    // into { 'property.constraints.planning': { value: ['property.landConservation'] } }
    const constraintsDictionary = {
      "property.article4.lambeth.albertsquare": "article4.lambeth.albert",
      "property.article4.lambeth.hydefarm": "article4.lambeth.hydeFarm",
      "property.article4.lambeth.lansdowne": "article4.lambeth.lansdowne",
      "property.article4.lambeth.leighamcourt": "article4.lambeth.leigham",
      "property.article4.lambeth.parkhallroad": "article4.lambeth.parkHall",
      "property.article4.lambeth.stockwell": "article4.lambeth.stockwell",
      "property.article4.lambeth.streatham": "article4.lambeth.streatham",
      "property.article4s": "article4",
      "property.buildingListed": "listed",
      "property.landAONB": "designated.AONB",
      "property.landBroads": "designated.broads",
      "property.landConservation": "designated.conservationArea",
      "property.landExplosivesStorage": "defence.explosives",
      "property.landNP": "designated.nationalPark",
      "property.landSafeguarded": "defence.safeguarded",
      "property.landSafetyHazard": "hazard",
      "property.landSSI": "nature.SSSI",
      "property.landTPO": "tpo",
      "property.landWHS": "designated.WHS",
      "property.southwarkSunrayEstate": "article4.southwark.sunray",
    };

    const newPassportData = Object.entries(constraintsDictionary).reduce(
      (dataObject, [oldName, newName]) => {
        if (passport.data?.[oldName]?.value) {
          dataObject["property.constraints.planning"] = dataObject[
            "property.constraints.planning"
          ] ?? { value: [] };
          dataObject["property.constraints.planning"].value.push(newName);
        }
        return dataObject;
      },
      {
        ...(get().passport.data || {}),
      }
    );

    if (passport.info?.planx_value) {
      newPassportData["property.type"] = {
        value: [passport.info.planx_value],
      };
    }

    set({
      passport: {
        ...passport,
        data: newPassportData,
      },
    });

    // ------ END PASSPORT DATA OVERRIDES ------

    try {
      const response = await client.mutate({
        mutation: gql`
          mutation CreateSession(
            $flow_data: jsonb
            $flow_id: uuid
            $flow_version: Int
            $passport: jsonb
          ) {
            insert_sessions_one(
              object: {
                flow_data: $flow_data
                flow_id: $flow_id
                flow_version: $flow_version
                passport: $passport
              }
            ) {
              id
            }
          }
        `,
        variables: {
          flow_data: get().flow,
          flow_id: get().id,
          flow_version: 0, // TODO: add flow version
          passport,
        },
      });
      const sessionId = response.data.insert_sessions_one.id;
      set({ sessionId });
    } catch (e) {}
  },

  resetPreview() {
    set({ breadcrumbs: {}, passport: { data: {} }, sessionId: "" });
  },

  setFlow(id: any, flow: any) {
    set({ id, flow });
  },

  previousCard: () => {
    const goBackable = Object.entries(get().breadcrumbs)
      .filter(([k, v]: any) => !v.auto)
      .map(([k]) => k);

    return goBackable.pop();
  },

  upcomingCardIds() {
    const { flow, breadcrumbs, passport, collectedFlags } = get();

    const ids: Set<string> = new Set();

    const mostToLeastNumberOfValues = (b: any, a: any) =>
      String(a.data?.val).split(",").length -
      String(b.data?.val).split(",").length;

    let visited = new Set();

    const nodeIdsConnectedFrom = (source: string) => {
      return (flow[source]?.edges ?? [])
        .map((id) => {
          visited.add(id);
          return id;
        })
        .filter(
          (id) =>
            !Object.keys(breadcrumbs).includes(id) &&
            (!SUPPORTED_DECISION_TYPES.includes(flow[id]?.type as TYPES) ||
              (flow[id]?.edges as any)?.length > 0)
        )
        .forEach((id) => {
          if (
            [TYPES.InternalPortal, TYPES.Page].includes(flow[id]?.type as TYPES)
          ) {
            nodeIdsConnectedFrom(id);
          } else {
            const useFlag = flow[id]?.type === TYPES.Filter;

            const fn = useFlag ? "flag" : flow[id]?.data?.fn;

            const [globalFlag] = collectedFlags(id, [...visited] as Array<
              string
            >);

            let passportValues =
              fn === "flag" ? globalFlag : passport.data[fn]?.value?.sort();

            if (fn && (fn === "flag" || passportValues !== undefined)) {
              const responses = flow[id]?.edges?.map((id) => ({
                id,
                ...flow[id],
              }));

              let responsesThatCanBeAutoAnswered = [] as any[];

              const sortedResponses = responses
                ? responses
                    .sort(mostToLeastNumberOfValues)
                    .filter((response) => response.data?.val)
                : [];

              if (passportValues !== undefined) {
                if (!Array.isArray(passportValues))
                  passportValues = [passportValues];

                passportValues = (passportValues || []).filter((pv: any) =>
                  sortedResponses.some((r) => pv.startsWith(r.data.val))
                );

                if (passportValues.length > 0) {
                  responsesThatCanBeAutoAnswered = (
                    sortedResponses || []
                  ).filter((r) => {
                    const responseValues = String(r.data.val).split(",").sort();
                    return String(responseValues) === String(passportValues);
                  });

                  if (responsesThatCanBeAutoAnswered.length === 0) {
                    responsesThatCanBeAutoAnswered = (
                      sortedResponses || []
                    ).filter((r) => {
                      const responseValues = String(r.data.val)
                        .split(",")
                        .sort();

                      for (const responseValue of responseValues) {
                        return passportValues.some((passportValue: any) =>
                          String(passportValue).startsWith(responseValue)
                        );
                      }
                    });
                  }
                }
              }

              if (responsesThatCanBeAutoAnswered.length === 0) {
                responsesThatCanBeAutoAnswered = (responses || []).filter(
                  (r) => !r.data?.val
                );
              }

              if (responsesThatCanBeAutoAnswered.length > 0) {
                if (flow[id]?.type !== TYPES.Checklist) {
                  responsesThatCanBeAutoAnswered = responsesThatCanBeAutoAnswered.slice(
                    0,
                    1
                  );
                }

                if (fn !== "flag") {
                  set({
                    breadcrumbs: {
                      ...breadcrumbs,
                      [id]: {
                        answers: responsesThatCanBeAutoAnswered.map(
                          (r) => r.id
                        ),
                        auto: true,
                      },
                    },
                  });
                }

                responsesThatCanBeAutoAnswered.forEach((r) =>
                  nodeIdsConnectedFrom(r.id)
                );
              }
            } else {
              ids.add(id);
            }
          }
        });
    };

    Object.entries(breadcrumbs)
      .reverse()
      .forEach(([, { answers }]: any) => {
        answers.forEach((answer: any) => nodeIdsConnectedFrom(answer));
      });

    nodeIdsConnectedFrom(ROOT_NODE_KEY);

    return Array.from(ids);
  },

  currentCard() {
    const { upcomingCardIds, flow } = get();
    const upcoming = upcomingCardIds();

    if (upcoming.length > 0) {
      const id = upcoming[0];
      return {
        id,
        ...flow[id],
      };
    } else {
      return null;
    }
  },

  record(id: nodeId, vals: componentOutput) {
    const { breadcrumbs, sessionId, upcomingCardIds, flow, passport } = get();

    if (!flow[id]) throw new Error("id not found");

    if (vals) {
      vals = Array.isArray(vals) ? vals : [vals];

      const key = flow[id].data?.fn;
      if (key) {
        let passportValue;

        passportValue = vals.map((id: string) => flow[id]?.data?.val);

        passportValue = passportValue.filter(
          (val: any) =>
            val !== undefined && val !== null && String(val).trim() !== ""
        );

        if (passportValue.length > 0) {
          if (passport.data[key] && Array.isArray(passport.data[key].value)) {
            passportValue = uniq(
              passport.data[key].value.concat(passportValue)
            );
          }

          set({
            breadcrumbs: {
              ...breadcrumbs,
              [id]: { answers: vals, auto: false },
            },
            passport: {
              ...passport,
              data: {
                ...passport.data,
                [key]: { value: passportValue },
              },
            },
          });
        } else {
          set({
            breadcrumbs: {
              ...breadcrumbs,
              [id]: { answers: vals, auto: false },
            },
          });
        }
      } else {
        set({
          breadcrumbs: { ...breadcrumbs, [id]: { answers: vals, auto: false } },
        });
      }

      const flowIdType = flow[id]?.type;

      // only store breadcrumbs in the backend if they are answers provided for
      // either a Statement or Checklist type. TODO: make this more robust
      if (
        flowIdType &&
        SUPPORTED_DECISION_TYPES.includes(flowIdType) &&
        sessionId
      ) {
        addSessionEvent();
        if (upcomingCardIds().length === 0) {
          endSession();
        }
      }
    } else {
      // remove breadcrumbs that were stored from id onwards
      let keepBreadcrumb = true;
      const fns: Array<any> = [];
      const newFns: Array<any> = [];
      const newBreadcrumbs = Object.entries(breadcrumbs).reduce(
        (acc: Record<string, any>, [k, v]) => {
          const fn = flow[k]?.data?.fn;
          if (fn) fns.push(fn);
          if (k === id) {
            keepBreadcrumb = false;
          } else if (keepBreadcrumb) {
            if (fn) newFns.push(fn);
            acc[k] = v;
          }
          return acc;
        },
        {}
      );

      set({
        breadcrumbs: newBreadcrumbs,
        passport: {
          ...passport,
          data: omit(passport.data, ...difference(fns, newFns)),
        },
      });
    }

    function addSessionEvent() {
      client.mutate({
        mutation: gql`
          mutation CreateSessionEvent(
            $chosen_node_ids: _text
            $type: session_event_type
            $session_id: uuid
            $parent_node_id: String
          ) {
            insert_session_events_one(
              object: {
                chosen_node_ids: $chosen_node_ids
                session_id: $session_id
                type: $type
                parent_node_id: $parent_node_id
              }
            ) {
              id
            }
          }
        `,
        variables: {
          chosen_node_ids: Array.isArray(vals)
            ? pgarray(vals)
            : pgarray([vals]),
          session_id: get().sessionId,
          type: "human_decision", // TODO
          parent_node_id: id,
        },
      });
    }

    function endSession() {
      client.mutate({
        mutation: gql`
          mutation EndSession($id: uuid!, $completed_at: timestamptz!) {
            update_sessions_by_pk(
              pk_columns: { id: $id }
              _set: { completed_at: $completed_at }
            ) {
              id
            }
          }
        `,
        variables: {
          id: get().sessionId,
          // TODO: Move this logic to the backend
          //       Could be done with a SQL Function exposed through Hasura as a mutation (e.g. end_session)
          completed_at: new Date(),
        },
      });
    }
  },

  collectedFlags(upToNodeId, visited = []) {
    const { breadcrumbs, flow } = get();

    // TODO: Should this be all flags?
    const possibleFlags = flatFlags.filter(
      (f) => f.category === DEFAULT_FLAG_CATEGORY
    );
    const flagKeys = possibleFlags.map((f) => f.value);

    const breadcrumbIds = Object.keys(breadcrumbs);

    const idx = breadcrumbIds.indexOf(upToNodeId);

    let ids: Array<string> = [];

    if (idx >= 0) {
      ids = breadcrumbIds.slice(0, idx + 1);
    } else if (visited.length > 1 && visited.includes(upToNodeId)) {
      ids = breadcrumbIds.filter((id) => visited.includes(id));
    }

    const res = ids
      .reduce((acc, k) => {
        breadcrumbs[k].answers.forEach((id: string) => {
          acc.push(flow[id]?.data?.flag);
        });
        return acc;
      }, [] as Array<string>)
      .filter((flag) => flag && flagKeys.includes(flag))
      .sort((a, b) => flagKeys.indexOf(a) - flagKeys.indexOf(b));

    return res;
  },

  resultData(flagSet = DEFAULT_FLAG_CATEGORY, overrides) {
    const { breadcrumbs, flow } = get();

    const categories = [flagSet];

    return categories.reduce(
      (
        acc: {
          [category: string]: {
            flag: Flag;
            responses: any[];
            displayText: { heading: string; description: string };
          };
        },
        category: string
      ) => {
        // TODO: DRY this up with preceding collectedFlags function?
        const possibleFlags = flatFlags.filter((f) => f.category === category);
        const keys = possibleFlags.map((f) => f.value);
        const collectedFlags = Object.values(
          breadcrumbs
        ).flatMap(({ answers }) =>
          Array.isArray(answers)
            ? answers.map((id) => flow[id]?.data?.flag)
            : flow[answers]?.data?.flag
        );

        const filteredCollectedFlags = collectedFlags
          .filter((flag) => flag && keys.includes(flag))
          .sort((a, b) => keys.indexOf(a) - keys.indexOf(b));

        const flag = possibleFlags.find(
          (f) => f.value === filteredCollectedFlags[0]
        ) || {
          // value: "PP-NO_RESULT",
          value: undefined,
          text: "No result",
          category,
          bgColor: "#EEEEEE",
          color: tinycolor("black").toHexString(),
        };
        // globalFlag = flag.value;

        const responses = Object.entries(breadcrumbs)
          .map(
            ([k, { answers }]: [
              string,
              { answers: string | Array<string> }
            ]) => {
              const question = { id: k, ...flow[k] };

              const questionType = question?.type;

              if (
                !questionType ||
                !SUPPORTED_DECISION_TYPES.includes(questionType)
              )
                return null;

              answers = Array.isArray(answers) ? answers : [answers];

              const selections = answers.map((id) => ({ id, ...flow[id] }));
              const hidden = !selections.some(
                (r) => r.data?.flag && r.data.flag === flag?.value
                // possibleFlags.includes(r.data.flag)
              );

              return {
                question,
                selections,
                hidden,
              };
            }
          )
          .filter(Boolean);

        const heading =
          (flag.value && overrides && overrides[flag.value]?.heading) ||
          flag.text;
        const description =
          (flag.value && overrides && overrides[flag.value]?.description) ||
          flagSet;

        acc[category] = {
          flag,
          displayText: { heading, description },
          responses: responses.every((r: any) => r.hidden)
            ? responses.map((r: any) => ({ ...r, hidden: false }))
            : responses,
        };

        return acc;
      },
      {}
    );
  },

  updateFlowSettings: async (
    flowSlug: string,
    newSettings: FlowSettings
  ): Promise<any> => {
    let response = await client.mutate({
      mutation: gql`
        mutation UpdateFlowSettings($slug: String, $settings: jsonb) {
          update_flows(
            where: { slug: { _eq: $slug } }
            _set: { settings: $settings }
          ) {
            affected_rows
            returning {
              slug
              settings
            }
          }
        }
      `,
      variables: {
        slug: flowSlug,
        settings: newSettings,
      },
    });

    return response.data.update_flows.affected_rows;
  },
}));

export const useStore = create(vanillaStore);

(window as any)["api"] = useStore;
