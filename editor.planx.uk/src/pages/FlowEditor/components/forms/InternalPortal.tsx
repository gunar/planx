import { useFormik } from "formik";
import { TYPES } from "planx-nodes/types";
import { FormError } from "planx-nodes/ui";
import React from "react";
import InputField from "ui/InputField";

interface Flow {
  id: string;
  text: string;
}

const InternalPortalForm: React.FC<{
  id?: string;
  text?: string;
  flowId?: string;
  handleSubmit?;
  flows?: Array<Flow>;
}> = ({ id, handleSubmit, text = "", flowId = "", flows = [] }) => {
  const formik = useFormik({
    initialValues: {
      text,
      flowId,
    },
    validate: (values) => {
      const errors: Record<string, string> = {};

      if (!values.flowId && !values.text) {
        errors.text =
          flows.length > 0 ? "Required if no flow is selected" : "Required.";
      }

      return errors;
    },
    onSubmit: (values) => {
      const payload = values.flowId
        ? values.flowId
        : { type: TYPES.InternalPortal, data: values };
      if (handleSubmit) {
        handleSubmit(payload);
      } else {
        alert(JSON.stringify(payload, null, 2));
      }
    },
  });

  return (
    <form id="modal" onSubmit={formik.handleSubmit} data-testid="form">
      <div>
        <InputField
          autoFocus
          name="text"
          onChange={formik.handleChange}
          placeholder="Portal name"
          rows={2}
          value={formik.values.text}
          disabled={!!formik.values.flowId}
          // required={!formik.values.flowId} (was ignored by @testing-library?)
        />
        <FormError message={formik.errors.text} />
      </div>
      {flows?.length > 0 && (
        <>
          <span> OR </span>
          <select
            data-testid="flowId"
            name="flowId"
            value={formik.values.flowId}
            onChange={formik.handleChange}
            disabled={!!formik.values.text}
          >
            {!id && <option value="" />}
            {flows.map((flow) => (
              <option key={flow.id} value={flow.id}>
                {flow.text}
              </option>
            ))}
          </select>
        </>
      )}
    </form>
  );
};

export default InternalPortalForm;
