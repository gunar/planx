import { vanillaStore } from "../store";

const { getState, setState } = vanillaStore;

beforeEach(() => {
  getState().resetPreview();
});

const setup = (args = {}) =>
  setState({
    flow: {
      _root: {
        edges: ["a", "b", "c"],
      },
      a: {},
      b: {},
      c: {},
    },
    ...args,
  });

describe("store.previousCard is", () => {
  test("undefined when there are no breadcrumbs", () => {
    setup();
    expect(getState().previousCard()).toBeUndefined();
  });

  test("undefined when cards were automatically answered", () => {
    setup({
      breadcrumbs: {
        a: { answers: [], auto: true },
        b: { answers: [], auto: true },
      },
    });
    expect(getState().previousCard()).toBeUndefined();
  });

  test("the most recent human-answered card id", () => {
    setup({
      breadcrumbs: {
        a: { answers: [], auto: false }, // a human answered this card
        b: { answers: [], auto: true },
      },
    });

    expect(getState().previousCard()).toEqual("a");
  });
});
