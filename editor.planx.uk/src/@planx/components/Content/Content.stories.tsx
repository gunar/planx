import { Meta, Story } from "@storybook/react/types-6-0";
import React from "react";

import Wrapper from "../fixtures/Wrapper";
import Editor from "./Editor";
import type { Props as PublicProps } from "./Public";
import Public from "./Public";

const metadata: Meta = {
  title: "PlanX Components/Content",
  component: Public,
  argTypes: {
    handleSubmit: { action: true },
  },
};

export const Frontend: Story<PublicProps> = (args) => <Public {...args} />;
Frontend.args = {
  content: `**Good Morning** _Bom dia_`,
  color: "white",
};

export const WithEditor = () => <Wrapper Editor={Editor} Public={Public} />;

export default metadata;
