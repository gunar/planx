import Box from "@material-ui/core/Box";
import { makeStyles } from "@material-ui/core/styles";
import React, { ReactNode } from "react";

const modalSectionStyles = makeStyles((theme) => ({
  section: {
    paddingBottom: theme.spacing(3),
    "& + $section": {
      borderTop: `0.5px solid #bbb`,
    },
  },
}));

export default function ModalSection({
  children,
}: {
  children: ReactNode;
}): FCReturn {
  const classes = modalSectionStyles();
  return <Box className={classes.section}>{children}</Box>;
}
