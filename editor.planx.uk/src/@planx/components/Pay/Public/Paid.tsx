import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import DownloadIcon from "@material-ui/icons/GetApp";
import Card from "@planx/components/shared/Preview/Card";
import React from "react";

export default Component;

const useStyles = makeStyles({
  root: {
    "& *": {
      fontFamily: "Inter, sans-serif",
      boxSizing: "border-box",
      margin: 0,
      padding: 0,
    },
    "& p": {},
    "& p span": {
      fontWeight: 700,
      marginRight: "2rem",
    },
  },
  banner: {
    background: "#F0F9FA",
    marginBottom: "30px",
    padding: "13px",
    "& p": {
      margin: "20px 0",
    },
  },
});

function Component(props: any) {
  const c = useStyles();
  return (
    <Card isValid handleSubmit={props.handleSubmit}>
      <div className={c.root}>
        <div className={c.banner}>
          <Typography variant="h3">Payment summary</Typography>
          <Typography>Amount</Typography>
          <Typography variant="h1">£206</Typography>
        </div>
        <p>
          <span>Paid</span>11th November 2020 14.32
        </p>
        <p>
          <span>GOV.UK Payment reference</span>JG669323
        </p>
        <p>
          <span>Application reference</span>LBH-2020-LDC-100
        </p>
        <br />
        <br />
        <div style={{ textAlign: "right" }}>
          <Button endIcon={<DownloadIcon />} color="default">
            Download this application
          </Button>
        </div>
      </div>
    </Card>
  );
}
