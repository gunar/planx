import { render } from "@testing-library/react";
import React from "react";

import Public from "./Public";

// TODO: fix this test as it has async problems
test.skip("renders", async () => {
  const handleSubmit = jest.fn();
  render(
    <Public
      handleSubmit={handleSubmit}
      token="placeholder"
      templateId="placeholder"
      personalisation={{}}
      addressee="placeholder"
    />
  );
});

// XXX: Further tests such as
//      1) It throws an error
//      2) It shows the loading screen
//      3) It sends an email
//      are not being written today as this whole logic will be deprecated
//      in favour of a backend-based implementation.
