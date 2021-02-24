import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Collapse from "@material-ui/core/Collapse";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { useFormik } from "formik";
import flags, { FlagSet } from "pages/FlowEditor/data/flags";
import React, { useEffect, useState } from "react";
import Input from "ui/Input";
import InputRow from "ui/InputRow";
import ModalSection from "ui/ModalSection";
import ModalSectionContent from "ui/ModalSectionContent";

import { Flag } from "../../../types";
import { TYPES } from "../types";
import { ICONS } from "../ui";
import type { Result } from "./model";

interface FormData {
  flagSet: FlagSet;
  overrides?: { [flagId: string]: { heading?: string; description?: string } };
}

interface FlagDisplayText {
  heading?: string;
  description?: string;
}

const useClasses = makeStyles({
  flagEditor: {
    cursor: "pointer",
  },
});

const FlagEditor: React.FC<{
  flag: Flag;
  existingOverrides?: FlagDisplayText;
  onChange: (newValues: any) => any;
}> = (props) => {
  const { flag, existingOverrides, onChange } = props;
  const classes = useClasses();

  const [show, setShow] = useState(false);

  const showEditedIndicator = !!existingOverrides;

  return (
    <Box
      className={classes.flagEditor}
      padding={1}
      bgcolor={flag.bgColor}
      color={flag.color}
      mt={1}
    >
      <Box onClick={() => setShow(!show)}>
        <Typography variant="body2">
          {flag.text}
          {showEditedIndicator && "*"}
        </Typography>
      </Box>
      <Collapse in={show}>
        <Box display="flex" mt={1}>
          <Input
            value={existingOverrides?.heading ?? ""}
            placeholder={"Heading"}
            onChange={(ev) =>
              onChange({ ...existingOverrides, heading: ev.target.value })
            }
          />
          <Box width={10} />
          <Input
            value={existingOverrides?.description ?? ""}
            placeholder={"Description"}
            onChange={(ev) =>
              onChange({ ...existingOverrides, description: ev.target.value })
            }
          />
        </Box>
      </Collapse>
    </Box>
  );
};

const ResultComponent: React.FC<Result> = (props) => {
  const formik = useFormik<FormData>({
    initialValues: {
      // TODO: maybe don't store string key here as it's likely to change
      flagSet: props.node?.data?.flagSet || "",
      overrides: props.node?.data?.overrides || {},
    },
    onSubmit: (newValues) => {
      if (props.handleSubmit) {
        props.handleSubmit({ type: TYPES.Result, data: newValues });
      }
    },
    validate: () => {},
  });

  const allFlagsForSet: Record<string, Flag> = flags[formik.values.flagSet];

  return (
    <form onSubmit={formik.handleSubmit} id="modal">
      <ModalSection>
        <ModalSectionContent title="Result" Icon={ICONS[TYPES.Result]}>
          <InputRow>
            <Typography variant="h6">
              <label htmlFor="result-flagSet">Flag set</label>
            </Typography>
            <select
              id="result-flagSet"
              name="flagSet"
              value={formik.values.flagSet}
              onChange={formik.handleChange}
              required
            >
              {Object.keys(flags).map((flagSet) => (
                <option key={flagSet} value={flagSet}>
                  {flagSet}
                </option>
              ))}
            </select>
          </InputRow>

          <Box mt={2}>
            <Typography variant="h6">Flag Text Overrides (optional)</Typography>
            <Typography variant="body2">
              The overrides you set here will change what is displayed to the
              user upon arriving at this result. If you provide no overrides,
              the flag title will be used.
            </Typography>
            <Box mt={2}>
              {Object.entries(allFlagsForSet).map(([key, flag]) => {
                return (
                  <FlagEditor
                    key={key}
                    flag={flag}
                    existingOverrides={
                      formik.values.overrides && formik.values.overrides[key]
                    }
                    onChange={(newValues: FlagDisplayText) => {
                      const newOverride = { [key]: newValues };
                      formik.setFieldValue("overrides", {
                        ...formik.values.overrides,
                        ...newOverride,
                      });
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        </ModalSectionContent>
      </ModalSection>
    </form>
  );
};

export default ResultComponent;
