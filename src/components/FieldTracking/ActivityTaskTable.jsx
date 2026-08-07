import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faSpinner } from "@fortawesome/free-solid-svg-icons";
import WorkOrderSuggestion from "./WorkOrderSuggestion";

const ActivityTaskTable = ({
    typeOptions: typeOptionsProp,
    activityVerb = "",
    taskName = "",
    onActivityVerbChange,
    onTaskNameChange,
    readOnly = false,
    activityVerbError = false,
    taskNameError = false,
    required = true,
    userID,
}) => {
    const [fetchedOptions, setFetchedOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(!typeOptionsProp);
    const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

    // If the parent doesn't pass typeOptions in directly, fetch them from
    // the Work Order Types route (type + description for each).
    // NOTE: this reuses the same backend route as WorkOrderTable for now.
    useEffect(() => {
        if (typeOptionsProp) return;

        let isMounted = true;

        const fetchActivityNames = async () => {
            try {
                setLoadingOptions(true);

                const res = await fetch(
                    `${process.env.REACT_APP_URL}/api/valuesUpload/activityNames`
                );

                if (!res.ok) {
                    throw new Error(`Failed to fetch activities: ${res.status}`);
                }

                const data = await res.json();

                if (isMounted) {
                    setFetchedOptions(
                        Array.isArray(data.activityNames)
                            ? data.activityNames
                            : []
                    );
                }
            } catch (err) {
                console.error("Error fetching activity names:", err);

                if (isMounted) {
                    setFetchedOptions([]);
                }
            } finally {
                if (isMounted) {
                    setLoadingOptions(false);
                }
            }
        };

        fetchActivityNames();

        return () => {
            isMounted = false;
        };
    }, [typeOptionsProp]);

    // Normalize whatever we have (prop or fetched) into { value, label, description },
    // and guarantee an "Other" option is always available so users can
    // always type a custom value.
    const typeOptions = useMemo(() => {
        const source = typeOptionsProp || fetchedOptions;

        const normalized = source.map((opt) => ({
            value: opt.activity ?? opt.activity,
            label: opt.activity ?? opt.activity,
        }));

        // If an "Other" entry is present, move it to the end regardless of
        // where the backend returned it.
        const withoutOther = normalized.filter(
            (opt) => String(opt.value).toLowerCase() !== "other"
        );
        const other = normalized.filter(
            (opt) => String(opt.value).toLowerCase() === "other"
        );

        return [...withoutOther, ...other];
    }, [typeOptionsProp, fetchedOptions]);

    const handleActivityVerbChange = (value) => {
        onActivityVerbChange && onActivityVerbChange(value);
    };

    return (
        <>
            <div className="input-row-risk-create" style={{ alignItems: "center", marginBottom: "0px" }}>
                <div className={`input-box-type-risk-create ${activityVerbError ? "error-create" : ""}`} style={{ position: "relative", marginBottom: "0px" }} >
                    <h3 className="font-fam-labels">
                        Activity Verb {required && <span className="required-field">*</span>}
                    </h3>
                    <div className="jra-info-popup-page-select-container">
                        <select
                            className="table-control font-fam remove-default-styling"
                            name="activityVerb"
                            value={activityVerb}
                            style={{ fontFamily: "Arial" }}
                            disabled={readOnly || loadingOptions}
                            onChange={(e) => handleActivityVerbChange(e.target.value)}
                        >
                            <option value="" disabled>
                                {loadingOptions ? "Loading..." : "Select Activity Verb"}
                            </option>
                            {typeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Block 2: Task Name - independent of the Activity Verb selection */}
                <div className={`input-box-type-risk-create ${taskNameError ? "error-create" : ""}`} style={{ marginBottom: "0px" }} >
                    <h3 className="font-fam-labels">
                        Task Name {required && <span className="required-field">*</span>}
                    </h3>
                    <textarea
                        type="text"
                        name="taskName"
                        value={taskName || ""}
                        className="aim-textarea-risk-create-textarea-nopads font-fam aim-textarea-text"
                        placeholder="Insert task name here"
                        style={{ fontFamily: "Arial", minHeight: 0, paddingLeft: "10px" }}
                        onChange={(e) => onTaskNameChange && onTaskNameChange(e.target.value)}
                        readOnly={readOnly}
                    />
                </div>
            </div>
        </>
    );
};

export default ActivityTaskTable;