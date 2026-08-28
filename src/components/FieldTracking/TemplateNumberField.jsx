import React, { useEffect } from "react";

const TemplateNumberField = ({
    value,
    workOrderType = "",
    department = "",
    mainArea = "",
    onChange,
    error = false,
    required = true,
    showUI = false
}) => {
    // Always derived, never user-editable: {WorkOrderType first 3 chars}-
    // {Department first 3 chars}-{Main Area first 3 chars}-001-{year}.
    // Recomputes whenever the three source fields change, same pattern as
    // the other derived fields (Activity Name, Sub Information, etc).
    useEffect(() => {
        const first3 = (str) => (str || "").trim().slice(0, 3).toUpperCase();

        const workOrderTypePart = first3(workOrderType);
        const departmentPart = first3(department);
        const mainAreaPart = first3(mainArea);

        const allFilled = [workOrderTypePart, departmentPart, mainAreaPart].every(Boolean);
        if (!allFilled) return;

        const year = new Date().getFullYear();
        const combined = `${workOrderTypePart}-${departmentPart}-${mainAreaPart}-001-${year}`;

        if (combined !== value) {
            onChange && onChange(combined);
        }
    }, [workOrderType, department, mainArea]);

    return (
        <>
            {showUI && (<div className={`input-box-type-risk-create ${error ? "error-create" : ""}`}>
                <h3 className="font-fam-labels">
                    Template Number {required && <span className="required-field">*</span>}
                </h3>
                <input
                    type="text"
                    name="templateNumber"
                    value={value || ""}
                    className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                    placeholder="Template Number of Work Order"
                    readOnly={true}
                    style={{ color: "grey" }}
                />
            </div>)}
        </>
    );
};

export default TemplateNumberField;