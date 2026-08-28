import React, { useEffect, useMemo } from "react";

const cleanText = (input) => String(input ?? "").trim();

const ActivityNamesField = ({
    value = "",
    activityVerb = "",
    taskName = "",
    onChange,
    readOnly = false,
    error = false,
    required = true,
    showUI = false,
}) => {
    // Activity Name is derived from the selected activity verb and task name.
    const combinedActivityName = useMemo(() => {
        return [activityVerb, taskName]
            .map(cleanText)
            .filter(Boolean)
            .join(" ");
    }, [activityVerb, taskName]);

    // Keep the value stored by the parent in sync with the derived value.
    // Including `value` means this also repairs the field if the parent clears
    // or replaces activityName without changing activityVerb/taskName.
    useEffect(() => {
        if (combinedActivityName !== cleanText(value)) {
            onChange?.(combinedActivityName);
        }
    }, [combinedActivityName, value, onChange]);

    if (!showUI) {
        return null;
    }

    return (
        <div className="input-row">
            <div className={`input-box-title ${error ? "error-create" : ""}`}>
                <h3 className="font-fam-labels">
                    Activity Name
                    {required && <span className="required-field"> *</span>}
                </h3>
                <input
                    spellCheck="true"
                    type="text"
                    name="activityName"
                    className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                    value={combinedActivityName}
                    placeholder="Activity Name of Work Order"
                    readOnly
                />
            </div>
        </div>
    );
};

export default ActivityNamesField;