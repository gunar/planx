import Box from "@material-ui/core/Box";
import Collapse from "@material-ui/core/Collapse";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Warning from "@material-ui/icons/WarningOutlined";
import Card from "@planx/components/shared/Preview/Card";
import SimpleExpand from "@planx/components/shared/Preview/SimpleExpand";
import { useFormik } from "formik";
import type { handleSubmit } from "pages/Preview/Node";
import React, { useState } from "react";
import type { Node, TextContent } from "types";
import CollapsibleInput from "ui/CollapsibleInput";

import ResultReason from "./ResultReason";
import ResultSummary from "./ResultSummary";

export interface Props {
  handleSubmit: handleSubmit;
  headingColor: {
    text: string;
    background: string;
  };
  headingTitle?: string;
  description?: string;
  reasonsTitle?: string;
  responses: Array<{
    question: Node;
    selections?: Array<Node>;
    hidden: boolean;
  }>;
  disclaimer?: TextContent;
}

const useClasses = makeStyles((theme) => ({
  disclaimer: {
    cursor: "pointer",
  },
  readMore: {
    marginLeft: theme.spacing(1),
    color: theme.palette.grey[500],
    "&:hover": {
      color: theme.palette.grey[400],
    },
  },
  disclaimerContent: {
    marginTop: theme.spacing(1),
  },
}));

const Responses = ({ responses }: any) => (
  <>
    {responses.map(({ question, selections }: any) => (
      <ResultReason
        key={question.id}
        id={question.id}
        question={question}
        response={selections.map((s: any) => s.data.text).join(",")}
      />
    ))}
  </>
);

const Result: React.FC<Props> = ({
  handleSubmit,
  headingColor,
  headingTitle = "",
  description = "",
  reasonsTitle = "",
  responses,
  disclaimer,
}) => {
  const formik = useFormik({
    initialValues: {
      feedback: "",
    },
    onSubmit: (values) => {
      const feedback = values.feedback.length > 0 ? values.feedback : [];
      handleSubmit && handleSubmit(feedback);
    },
  });
  const visibleResponses = responses.filter((r) => !r.hidden);
  const hiddenResponses = responses.filter((r) => r.hidden);

  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const classes = useClasses();
  const theme = useTheme();

  return (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
      <ResultSummary
        heading={headingTitle}
        description={description}
        color={headingColor}
      />
      <Card handleSubmit={formik.handleSubmit} isValid>
        <Box mt={4} mb={3}>
          <Typography variant="h3" gutterBottom>
            {reasonsTitle}
          </Typography>
        </Box>
        <Box mb={3}>
          <Responses responses={visibleResponses} />

          {hiddenResponses.length > 0 && (
            <SimpleExpand
              buttonText={{
                open: "Show all responses",
                closed: "Hide other responses",
              }}
            >
              <Responses responses={hiddenResponses} />
            </SimpleExpand>
          )}
        </Box>
        {disclaimer?.show && (
          <Box
            bgcolor="background.paper"
            p={1.25}
            display="flex"
            color={theme.palette.grey[600]}
            className={classes.disclaimer}
          >
            <Warning />
            <Box ml={1}>
              <Box
                display="flex"
                alignItems="center"
                onClick={() =>
                  setShowDisclaimer((showDisclaimer) => !showDisclaimer)
                }
              >
                <Typography variant="h6" color="inherit">
                  {disclaimer.heading}
                </Typography>
                <Typography variant="body2" className={classes.readMore}>
                  read {showDisclaimer ? "less" : "more"}
                </Typography>
              </Box>
              <Collapse in={showDisclaimer}>
                <Typography
                  variant="body2"
                  color="inherit"
                  className={classes.disclaimerContent}
                >
                  {disclaimer.content}
                </Typography>
              </Collapse>
            </Box>
          </Box>
        )}
        <CollapsibleInput
          handleChange={formik.handleChange}
          name="feedback"
          value={formik.values.feedback}
        >
          <Typography variant="body2">
            Is this information inaccurate? <b>Tell us why.</b>
          </Typography>
        </CollapsibleInput>
      </Card>
    </Box>
  );
};
export default Result;
