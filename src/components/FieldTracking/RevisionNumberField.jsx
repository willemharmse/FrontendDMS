import React from "react";

const RevisionNumberField = ({
    value,
    onChange,
    readOnly = false,
    error = false,
    required = true,
    showUI = false
}) => {
    return (
        <>
            {showUI && (<div className={`input-box-type-risk-create ${error ? "error-create" : ""}`}>
                <h3 className="font-fam-labels">
                    Revision Number {required && <span className="required-field">*</span>}
                </h3>
                <input
                    type="text"
                    name="version"
                    value={value || ""}
                    className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                    placeholder="Enter Version Number"
                    onChange={onChange}
                    readOnly={readOnly}
                    style={{ color: "grey" }}
                />
            </div>)}
        </>
    );
};

export default RevisionNumberField;
