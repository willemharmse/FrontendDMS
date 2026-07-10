import React from "react";

const TemplateDescription = ({
    value,
    onChange,
    readOnly = false,
    error = false,
    required = true,
}) => {
    return (
        <div className={`input-box-type-risk-create ${error ? "error-create" : ""}`} style={{ width: "calc(100% - 40px)" }}>
            <h3 className="font-fam-labels">
                Template Description {required && <span className="required-field">*</span>}
            </h3>
            <textarea
                type="text"
                name="taskDescription"
                value={value || ""}
                className="aim-textarea-risk-create-ibra font-fam aim-textarea-text"
                placeholder="Enter Template Description"
                style={{ fontFamily: "Arial" }}
                onChange={onChange}
                readOnly={readOnly}
            />
        </div>
    );
};

export default TemplateDescription;
