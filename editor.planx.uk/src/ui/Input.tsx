import InputBase, { InputBaseProps } from "@mui/material/InputBase";
import type { Theme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import classNames from "classnames";
import React, {
  ChangeEvent,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { borderedFocusStyle } from "theme";

import ErrorWrapper from "./ErrorWrapper";

export interface Props extends InputBaseProps {
  format?: "large" | "bold" | "data";
  classes?: any;
  className?: string;
  grow?: boolean;
  large?: boolean;
  bordered?: boolean;
  errorMessage?: string;
  onChange?: (ev: ChangeEvent<HTMLInputElement>) => void;
}

export const useClasses = makeStyles<Theme, Props>((theme) => ({
  input: {
    backgroundColor: "#fff",
    fontSize: 15,
    width: "100%",
    padding: theme.spacing(0, 1.5),
    height: 50,
    "& input": {
      fontWeight: "inherit",
    },
  },
  bordered: {
    border: `2px solid #000`,
  },
  inputMultiline: {
    height: "auto",
    "& textarea": {
      padding: theme.spacing(1.5, 0),
      lineHeight: 1.6,
    },
  },
  questionInput: {
    backgroundColor: "#fff",
    height: 50,
    fontSize: 25,
    width: "100%",
    fontWeight: 700,
  },
  bold: {
    fontWeight: 700,
  },
  data: {
    backgroundColor: "#fafafa",
  },
  adornedEnd: {
    paddingRight: 2,
  },
  focused: (props) => (props.bordered ? borderedFocusStyle : {}),
}));

export default forwardRef((props: Props, ref): FCReturn => {
  const classes = useClasses(props);

  const container = useRef<HTMLDivElement | null>(null);

  const {
    format,
    bordered,
    errorMessage,
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedBy,
    id,
    ...restProps
  } = props;

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        container.current?.querySelector("input")?.focus();
      },
      select: () => {
        container.current?.querySelector("input")?.select();
      },
    }),
    []
  );

  return (
    <ErrorWrapper error={errorMessage} id={id}>
      <InputBase
        className={classNames(
          classes.input,
          format === "large" && classes.questionInput,
          format === "bold" && classes.bold,
          format === "data" && classes.data,
          bordered && classes.bordered
        )}
        classes={{
          multiline: classes.inputMultiline,
          adornedEnd: classes.adornedEnd,
          focused: classes.focused,
        }}
        inputProps={{
          "aria-label": ariaLabel,
          "aria-describedby": ariaDescribedBy,
        }}
        id={id}
        ref={container}
        {...restProps}
      />
    </ErrorWrapper>
  );
});
