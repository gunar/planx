import CircularProgress from "@material-ui/core/CircularProgress";
import makeStyles from "@material-ui/core/styles/makeStyles";
import React, { useEffect, useState } from "react";

const useClasses = makeStyles({
  container: {
    padding: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

const DelayedLoadingIndicator: React.FC<{ msDelayBeforeVisible: number }> = ({
  msDelayBeforeVisible = 0,
}) => {
  const [visible, setVisible] = useState(false);

  const classes = useClasses();

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), msDelayBeforeVisible);
    return () => {
      clearTimeout(timeout);
    };
  }, [msDelayBeforeVisible]);

  return visible ? (
    <div className={classes.container}>
      <CircularProgress />
    </div>
  ) : null;
};

export default DelayedLoadingIndicator;
