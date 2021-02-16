import { Meta, Story } from "@storybook/react/types-6-0";
import React from "react";

import Public, { Props } from "./Public";

const metadata: Meta = {
  title: "PlanX Components/Result",
  component: Public,
  argTypes: {
    handleSubmit: { control: { disable: true }, action: true },
  },
};

export const Frontend: Story<Props> = (args) => <Public {...args} />;
Frontend.args = {
  headingColor: {
    background: "#ADFF00",
    text: "#000",
  },
  headingTitle: "Heading",
  subheading: "Subheading",
  headingDescription: "Further description",
  reasonsTitle: "Reasons",
  responses: [
    {
      question: {
        id: "1234",
        data: {
          text: "A question with no further information",
        },
      },
      selections: [
        {
          id: "5678",
          data: {
            text: "answer",
          },
        },
      ],
      hidden: false,
    },
    {
      question: {
        id: "9999",
        data: {
          text: "A question with more information",
          info: "some more information",
        },
      },
      selections: [
        {
          id: "8888",
          data: {
            text: "answer",
          },
        },
      ],
      hidden: false,
    },
    {
      question: {
        id: "7777",
        data: {
          text: "A question with a policy reference",
          policyRef: "https://beta.planx.uk/southwark",
        },
      },
      selections: [
        {
          id: "6666",
          data: {
            text: "answer",
          },
        },
      ],
      hidden: false,
    },
    {
      question: {
        id: "5555",
        data: {
          text: "A question with more information and a policy reference",
          info: "Some more information",
          policyRef: "https://beta.planx.uk/southwark",
        },
      },
      selections: [
        {
          id: "4444",
          data: {
            text: "answer",
          },
        },
      ],
      hidden: false,
    },
    {
      question: {
        id: "5555",
        data: {
          text:
            "A question with more information and a policy reference and it's really long",
          info: "Some more information",
          policyRef: "https://beta.planx.uk/southwark",
        },
      },
      selections: [
        {
          id: "4444",
          data: {
            text: "answer is also really, really long",
          },
        },
      ],
      hidden: false,
    },
  ],
};

export default metadata;
