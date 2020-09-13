import { Box, InputBaseProps, makeStyles } from "@material-ui/core";
import { convertToRaw } from "draft-js";
import { stateToMarkdown } from "draft-js-export-markdown";
import { stateFromMarkdown } from "draft-js-import-markdown";
import MUIRichTextEditor, { TMUIRichTextEditorRef } from "mui-rte";
import React, { ChangeEvent, useState, useRef, useEffect } from "react";

/**
 * Important: if the `value` prop changes for a reason other than changes in the editor,
 * this component will not react to the changes and will send new data based on its previous state.
 * Having the component work as a controlled input field causes bugs on cursor position and
 * focus.
 */

interface Props extends InputBaseProps {
  className?: string;
  onChange?: (ev: ChangeEvent<HTMLInputElement>) => void;
}

const rteContainerStyles = makeStyles((theme) => ({
  regular: {
    position: "relative",
    boxSizing: "border-box",
    padding: 2,
    outline: "none",
    width: "100%",
  },
  focused: {
    position: "relative",
    boxSizing: "border-box",
    padding: 2,
    outline: "none",
    boxShadow: `inset 0 0 0 2px ${theme.palette.primary.light}`,
    width: "100%",
  },
}));

const mdToEditorRawContent = (str: unknown) =>
  convertToRaw(stateFromMarkdown(str));

const RichTextInput: React.FC<Props> = (props) => {
  // Set the initial `value` prop and ignore updated values to avoid infinite loops
  const [defaultValue] = useState(mdToEditorRawContent(props.value));

  const [focused, setFocused] = useState(false);

  const editorRef = useRef<TMUIRichTextEditorRef>(null);

  const containerRef = useRef(null);
  useEffect(() => {
    const globalClickHandler = (ev: any) => {
      if (!containerRef.current) {
      }
      const container = containerRef.current;
      if (
        container.contains(ev.target) &&
        container.contains(document.querySelector(".DraftEditor-root"))
      ) {
        editorRef.current.focus();
        setFocused(true);
      }
    };
    document.addEventListener("click", globalClickHandler);
    return () => {
      document.removeEventListener("click", globalClickHandler);
    };
  }, []);

  const classes = rteContainerStyles();

  return (
    <Box
      ref={containerRef}
      className={focused ? classes.focused : classes.regular}
    >
      <MUIRichTextEditor
        onFocus={() => {
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
        }}
        defaultValue={JSON.stringify(defaultValue)}
        ref={editorRef}
        toolbarButtonSize="small"
        inlineToolbar={true}
        toolbar={false}
        inlineToolbarControls={[
          "bold",
          "italic",
          "underline",
          "link",
          "bulletList",
        ]}
        label={props.placeholder}
        onChange={(newState) => {
          if (!props.onChange) {
            return;
          }
          const md = stateToMarkdown(newState.getCurrentContent());

          if (md !== props.value) {
            // Construct and cast as a change event so the component stays compatible with formik helpers
            const changeEvent = ({
              target: {
                name: props.name,
                value: md,
              },
            } as unknown) as ChangeEvent<HTMLInputElement>;
            props.onChange(changeEvent);
          }
        }}
      />
    </Box>
  );
};

export default RichTextInput;
