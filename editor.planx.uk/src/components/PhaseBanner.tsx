import { FeedbackFish } from "@feedback-fish/react";
import Box from "@material-ui/core/Box";
import { makeStyles, Theme, useTheme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React from "react";

const useClasses = makeStyles((theme: Theme) => ({
  root: {
    cursor: "pointer",
    "&:hover": {
      "& a": {
        textDecoration: "underline",
      },
    },
    [theme.breakpoints.up("sm")]: {
      padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
      flexDirection: "row",
    },
  },
  betaIcon: {
    width: "100%",
    "& > *": {
      width: "100%",
    },
    [theme.breakpoints.up("sm")]: {
      width: "auto",
      marginRight: theme.spacing(2),
    },
  },
}));

export default function PhaseBanner(): FCReturn {
  const classes = useClasses();
  const theme = useTheme();
  const feedbackFishId = process.env.REACT_APP_FEEDBACK_FISH_ID || "";

  return (
    <FeedbackFish projectId={feedbackFishId}>
      <Box
        className={classes.root}
        bgcolor="background.default"
        display="flex"
        flexDirection="column"
        alignItems="center"
        borderBottom={`1px solid ${theme.palette.grey[300]}`}
        px={1}
        py={1}
      >
        <Box
          bgcolor="primary.main"
          color="white"
          display="flex"
          alignItems="center"
          px={2}
          className={classes.betaIcon}
        >
          <Typography color="inherit" variant="h6" align="center">
            BETA
          </Typography>
        </Box>
        <Typography variant="body2" align="center" color="textPrimary">
          This is a new service. Your <a>feedback</a> will help us improve it.
        </Typography>
      </Box>
    </FeedbackFish>
  );
}
