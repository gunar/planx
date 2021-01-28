import { TYPES } from "@planx/components/types";
import React from "react";

import { useStore } from "../../../lib/store";
import { stripTagsAndLimitLength } from "../lib/utils";
import Breadcrumb from "./Breadcrumb";
import Checklist from "./Checklist";
import Filter from "./Filter";
import Option from "./Option";
import Page from "./Page";
import Portal from "./Portal";
import Question from "./Question";

const Node: React.FC<any> = (props) => {
  const node = useStore((state) => state.flow[props.id]);
  const type = props.type as TYPES;
  switch (type) {
    case TYPES.Content:
      return (
        <Question
          {...props}
          // TODO: we can probably render HTML here instead. TBD...
          text={stripTagsAndLimitLength(node?.data?.content, "Content", 100)}
        />
      );
    case TYPES.DateInput:
      return <Question {...props} text={node?.data?.title ?? "Date"} />;
    case TYPES.ExternalPortal:
      return <Portal {...props} />;
    case TYPES.InternalPortal:
      return props.href ? <Breadcrumb {...props} /> : <Portal {...props} />;
    case TYPES.FileUpload:
      return <Question {...props} text={node?.data?.title ?? "File upload"} />;
    case TYPES.Filter:
      return <Filter {...props} text="(Flags Filter)" />;
    case TYPES.FindProperty:
      return <Question {...props} text="Find property" />;
    case TYPES.Notice:
      return <Question {...props} text={node?.data?.title ?? "Notice"} />;
    case TYPES.Notify:
      return <Question {...props} text="Notify" />;
    case TYPES.NumberInput:
      return <Question {...props} text={node?.data?.title ?? "Number"} />;
    case TYPES.Page:
      return <Page {...props} text={node?.data?.title ?? "Page"} />;
    case TYPES.Pay:
      return <Question {...props} text={node?.data?.title ?? "Pay"} />;
    case TYPES.Result:
      return <Question {...props} text="(Result)" />;
    case TYPES.Review:
      return <Question {...props} text={node?.data?.title ?? "Review"} />;
    case TYPES.Send:
      return <Question {...props} text="Send" />;
    case TYPES.TaskList:
      return (
        <Question
          {...props}
          text={`${node?.data?.title ?? "Tasks"} (${
            node.data?.tasks?.length || 0
          })`}
        />
      );
    case TYPES.TextInput:
      return <Question {...props} text={node?.data?.title ?? "Text input"} />;

    case TYPES.Response:
      return <Option {...props} />;
    case TYPES.Statement:
    case TYPES.Checklist:
      return (
        <Checklist {...props} {...node} text={node?.data?.text ?? "[Empty]"} />
      );
    case TYPES.AddressInput:
      return <Question {...props} text={node?.data?.title ?? "Address"} />;
    case TYPES.Flow:
    case TYPES.Report:
    case TYPES.SignIn:
      return null;
    default:
      console.error({ nodeNotFound: props });
      return exhaustiveCheck(type);
  }
};

function exhaustiveCheck(type: never): never {
  throw new Error(`Missing type ${type}`);
}

export default Node;
