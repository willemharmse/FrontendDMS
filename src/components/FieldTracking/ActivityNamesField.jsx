import React, { useEffect } from "react";

const ActivityNamesField = ({
    value,
    activityVerb = "",
    taskName = "",
    onChange,
    readOnly = false,
    error = false,
    required = true,
    showUI = false
}) => {
    // Whenever the Activity Verb or Task Name changes, recompute the
    // combined Activity Name and push it up to the parent's formData.
    // This field is view-only, so the user never edits it directly -
    // it's purely derived from the two source fields.
    useEffect(() => {
        const combined = [activityVerb, taskName]
            .map((part) => (part || "").trim())
            .filter(Boolean)
            .join(" ");

        if (combined !== value) {
            onChange && onChange(combined);
        }
    }, [activityVerb, taskName]);

    return (
        <>
            {showUI && (<div className="input-row">
                <div className={`input-box-title`}>
                    <h3 className="font-fam-labels">Activity Name</h3>
                    <input
                        spellCheck="true"
                        type="text"
                        name="activityName"
                        className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                        value={value}
                        placeholder="Activity Name of Work Order"
                        readOnly={true}
                    />
                </div>
            </div>)}
        </>
    );
};

export default ActivityNamesField;