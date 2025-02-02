import { Meta, Story } from "@storybook/react/types-6-0";
import React from "react";
import InputField from "ui/InputField";

const metadata: Meta = {
  title: "Design System/Atoms/Form Elements/InputField",
  component: InputField,
};

export const Basic: Story<{}> = () => (
  <InputField
    name="text"
    multiline={true}
    placeholder="Portal name"
    rows={2}
    disabled={false}
    required={false}
  />
);

export default metadata;
