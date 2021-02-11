import { mostReadable } from "@ctrl/tinycolor";

import { Flag } from "../../../types";

// flags grouped by categories, order is significant, earlier flags === more important
// https://www.figma.com/file/bnUUrsVRG6qPwDkTmVKACI/Design?node-id=1971%3A0
const categoriesAndFlags = {
  "Planning permission": {
    MISSING_INFO: ["Missing information", "#EAEAEA"],
    IMMUNE: ["Immune", "#BEE6E7"],
    PLANNING_PERMISSION_REQUIRED: ["Permission needed", "#A8A8A8"],
    PRIOR_APPROVAL: ["Prior approval", "#FCFF58"],
    "PP-NOTICE": ["Notice", "#CAFB8B"],
    NO_APP_REQUIRED: ["Permitted development", "#82E7A1"],
    "PP-NOT_DEVELOPMENT": ["Not development", "#FFF"],
  },
  "Listed building consent": {
    "LB-MISSING_INFO": ["Missing information", "#EAEAEA"],
    "LB-REQUIRED": ["Required", "#76B4E5"],
    "LB-DE_MINIMIS": ["De minimis", "#CEE4F6"],
    "LB-NOT_REQUIRED": ["Not required", "#FFF"],
  },
  "Works to trees & hedges": {
    "TR-MISSING_INFO": ["Missing information", "#EAEAEA"],
    "TR-REQUIRED": ["Required", "#9ED9B0"],
    "TR-DE_MINIMIS": ["De minimis", "#E5F5EA"],
    "TR-NOT_REQUIRED": ["Not required", "#FFF"],
  },
  "Demolition in a conservation area": {
    "DC-MISSING_INFO": ["Missing information", "#EAEAEA"],
    "DC-REQUIRED": ["Required", "#9ED9B0"],
    "DC-DE_MINIMIS": ["De minimis", "#E5F5EA"],
    "DC-NOT_REQUIRED": ["Not required", "#FFF"],
  },
  "Planning policy": {
    PO_MISSING_INFO: ["Missing information", "#EAEAEA"],
    LIKELY_FAIL: ["Fails to meet policy", "#FF7F78"],
    EDGE_CASE: ["Edge case", "#FFA05B"],
    LIKELY_PASS: ["Meets policy", "#AAEB61"],
  },
  "Community infrastructure levy": {
    CO_MISSING_INFO: ["Missing information", "#EAEAEA"],
    CO_EXEMPTION_VOID: ["Exemption void", "#CDB1C2"],
    CO_EXEMPT: ["Exempt", "#FFDEF2"],
    CO_RELIEF_VOID: ["Relief void", "#A4698C"],
    CO_RELIEF: ["Relief", "#FFA4DA"],
    CO_LIABLE: ["Liable", "#FF0099"],
    CO_NOT_LIABLE: ["Not liable", "#FFF"],
  },
};

export const flatFlags: Array<Flag> = [];

export default Object.entries(categoriesAndFlags).reduce(
  (acc: Record<string, any>, [category, flags]) => {
    acc[category] = Object.entries(flags).reduce(
      (acc: Record<string, any>, [id, [text, bgColor]]) => {
        // loop through all the flags and add a text color which is
        // white if it's a dark background or black if it's light
        const color =
          mostReadable(bgColor, ["#000", "#FFF"])?.toHexString() || "#000";

        acc[id] = {
          text,
          bgColor,
          color,
        };

        // check that no other flags share the same ID
        if (flatFlags.find((f: any) => f.id === id))
          throw new Error(`Multiple flags with same id (${id})`);

        // push the flag object to a flattened array for convenience
        flatFlags.push({ ...acc[id], value: id, category });
        return acc;
      },
      {}
    );
    return acc;
  },
  {}
);
