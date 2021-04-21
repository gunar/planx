import Box from "@material-ui/core/Box";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Card from "@planx/components/shared/Preview/Card";
import React from "react";
import Banner from "ui/Banner";
import CollapsibleInput from "ui/CollapsibleInput";
import NumberedList from "ui/NumberedList";
import ReactMarkdownOrHtml from "ui/ReactMarkdownOrHtml";

const useClasses = makeStyles((theme) => ({
  table: {
    borderCollapse: "collapse",
    "& tr": {
      borderBottom: `1px solid ${theme.palette.grey[400]}`,
      "&:last-of-type": {
        border: "none",
      },
      "& td": {
        padding: `${theme.spacing(1.5)}px ${theme.spacing(1)}px`,
      },
    },
  },
  listHeading: {
    marginBottom: theme.spacing(2),
  },
  feedback: {
    textDecoration: "underline",
  },
}));

export interface Props {
  heading: string;
  description?: string;
  color?: { text: string; background: string };
  details?: { [key: string]: string };
  nextSteps?: { title: string; description: string }[];
  moreInfo?: string;
  contactInfo?: { heading?: string; content?: string };
  feedbackCTA?: string;
}

export default function Confirmation(props: Props) {
  const classes = useClasses();

  return (
    <Box>
      <Banner heading={props.heading} color={props.color}>
        {props.description && (
          <Box mt={4}>
            <Typography>{props.description}</Typography>
          </Box>
        )}
      </Banner>
      <Card>
        {props.details && (
          <table className={classes.table}>
            <tbody>
              {Object.entries(props.details).map((item, i) => (
                <tr key={i}>
                  <td>{item[0]}</td>
                  <td>
                    <b>{item[1]}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {props.nextSteps && (
          <Box pt={3}>
            <Typography variant="h3" className={classes.listHeading}>
              What happens next?
            </Typography>
            <NumberedList items={props.nextSteps} />
          </Box>
        )}

        {props.moreInfo && (
          <Box py={1}>
            <ReactMarkdownOrHtml source={props.moreInfo} />
          </Box>
        )}

        <hr />

        {props.contactInfo && (
          <Box py={1}>
            <Typography variant="h3">
              {props.contactInfo.heading || "Contact us"}
            </Typography>
            <ReactMarkdownOrHtml source={props.contactInfo.content} />
          </Box>
        )}

        <hr />

        {props.feedbackCTA && (
          <CollapsibleInput handleChange={() => {}} name="feedback" value={""}>
            <Typography variant="body2" className={classes.feedback}>
              {props.feedbackCTA}
            </Typography>
          </CollapsibleInput>
        )}
      </Card>
    </Box>
  );
}
