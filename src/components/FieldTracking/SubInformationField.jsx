import React, { useEffect } from "react";

const SubInformationField = ({
    value,
    site = "",
    mainArea = "",
    subArea = "",
    department = "",
    onChange,
    readOnly = false,
    error = false,
    required = true,
}) => {
    // Whenever Site, Main Area, Sub Area, or Department change, recompute
    // the combined Sub Information string and push it up to the parent's
    // formData. This field is view-only, so the user never edits it
    // directly - it's purely derived from the four source fields.
    useEffect(() => {
        const parts = [];

        const siteVal = (site || "").trim();
        if (siteVal) parts.push(`${siteVal}:`);

        const mainAreaVal = (mainArea || "").trim();
        if (mainAreaVal) parts.push(`${mainAreaVal}:`);

        const subAreaVal = (subArea || "").trim();
        if (subAreaVal && subAreaVal.toLowerCase() !== "n/a") {
            parts.push(`${subAreaVal}:`);
        }

        const departmentVal = (department || "").trim();
        if (departmentVal) parts.push(`${departmentVal}`);

        const combined = parts.join(" ");

        if (combined !== value) {
            onChange && onChange(combined);
        }
    }, [site, mainArea, subArea, department]);

    return (
        <div className="input-row">
            <div className={`input-box-title ${error ? "error-create" : ""}`}>
                <h3 className="font-fam-labels">
                    Work Order Sub Information {required && <span className="required-field">*</span>}
                </h3>
                <textarea
                    spellCheck="true"
                    type="text"
                    name="workOrderSubInformation"
                    className="aim-textarea-risk-create-textarea-nopads font-fam aim-textarea-text"
                    value={value}
                    placeholder="Site / Area / Department of Work Order"
                    readOnly={true}
                    style={{ minHeight: 0 }}
                />
            </div>
        </div>
    );
};

export default SubInformationField;