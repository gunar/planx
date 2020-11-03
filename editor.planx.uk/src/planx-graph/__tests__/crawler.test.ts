import Crawler from "../crawler";

describe("navigating a basic graph", () => {
  test("simple navigation", () => {
    const crawler = new Crawler({
      _root: {
        edges: ["a", "b"],
      },
      a: {
        edges: ["c"],
      },
      b: {},
      c: {},
      d: {},
    });

    expect(crawler.upcomingIds).toEqual(["a", "b"]);

    crawler.visit("a");

    expect(crawler.upcomingIds).toEqual(["b"]);

    crawler.visit("b");

    expect(crawler.upcomingIds).toEqual([]);
  });
});

describe("callbacks", () => {
  test("calls onVisit when visiting a node", () => {
    const onVisit = jest.fn();
    const crawler = new Crawler(
      {
        _root: {
          edges: ["a"],
        },
        a: {},
      },
      {
        onVisit,
      }
    );

    crawler.visit("a");

    expect(onVisit).toHaveBeenCalledWith("a");
  });
});

describe("error handling", () => {
  test("cannot visit id that doesn't exist", () => {
    const crawler = new Crawler({
      _root: {
        edges: ["a"],
      },
      a: {},
    });

    expect(() => crawler.visit("x")).toThrowError("id not found");
  });

  test("cannot visit id that's already been visited", () => {
    const crawler = new Crawler({
      _root: {
        edges: ["a"],
      },
      a: {},
    });

    crawler.visit("a");

    expect(() => crawler.visit("a")).toThrowError("already visited");
  });
});
