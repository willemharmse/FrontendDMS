import React from "react";

const TemplateNumberField = ({
    value,
    onChange,
    readOnly = false,
    error = false,
    required = true,
}) => {
    return (
        <div className={`input-box-type-risk-create ${error ? "error-create" : ""}`}>
            <h3 className="font-fam-labels">
                Template Number {required && <span className="required-field">*</span>}
            </h3>
            <input
                type="text"
                name="templateNumber"
                value={value || ""}
                className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                placeholder="Enter Template Number"
                onChange={onChange}
                readOnly={readOnly}
            />
        </div>
    );
};

export default TemplateNumberField;
