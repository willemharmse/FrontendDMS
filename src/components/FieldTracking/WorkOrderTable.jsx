import React, { useEffect, useMemo, useState } from "react";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import WorkOrderSuggestion from "./WorkOrderSuggestion";

const OTHER_VALUE = "Other";

const WorkOrderTable = ({
    typeOptions: typeOptionsProp,
    workOrderType = "",
    description = "",
    onTypeChange,
    onDescriptionChange,
    readOnly = false,
    typeError = false,
    descriptionError = false,
    required = true,
    userID,
}) => {
    const [fetchedOptions, setFetchedOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(!typeOptionsProp);
    const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

    // If the parent doesn't pass typeOptions in directly, fetch them from
    // the Work Order Types route (type + description for each).
    useEffect(() => {
        if (typeOptionsProp) return;

        let isMounted = true;

        const fetchTypes = async () => {
            try {
                setLoadingOptions(true);
                const res = await fetch(`${process.env.REACT_APP_URL}/api/valuesUpload/workOrderTypes`);
                const data = await res.json();

                if (isMounted) {
                    setFetchedOptions(Array.isArray(data.workOrderTypes) ? data.workOrderTypes : []);
                }
            } catch (err) {
                console.error("Error fetching work order types:", err);
            } finally {
                if (isMounted) setLoadingOptions(false);
            }
        };

        fetchTypes();

        return () => {
            isMounted = false;
        };
    }, [typeOptionsProp]);

    const refetchTypeOptions = async () => {
        if (typeOptionsProp) return;

        try {
            const res = await fetch(`${process.env.REACT_APP_URL}/api/valuesUpload/workOrderTypes`);
            const data = await res.json();
            setFetchedOptions(Array.isArray(data.workOrderTypes) ? data.workOrderTypes : []);
        } catch (err) {
            console.error("Error refetching work order types:", err);
        }
    };

    // Normalize whatever we have (prop or fetched) into { value, label, description },
    // and guarantee an "Other" option is always available so users can
    // always type a custom description.
    const typeOptions = useMemo(() => {
        const source = typeOptionsProp || fetchedOptions;

        const normalized = source.map((opt) => ({
            value: opt.value ?? opt.type,
            label: opt.label ?? opt.type,
            description: opt.description ?? "",
        }));

        // Pull "Other" out of wherever it landed (start, middle, end - doesn't
        // matter where the backend returned it) and always place it last.
        const withoutOther = normalized.filter(
            (opt) => String(opt.value).toLowerCase() !== OTHER_VALUE.toLowerCase()
        );

        return [
            ...withoutOther,
            { value: OTHER_VALUE, label: OTHER_VALUE, description: "" },
        ];
    }, [typeOptionsProp, fetchedOptions]);

    const isOtherSelected = String(workOrderType).toLowerCase() === OTHER_VALUE.toLowerCase();

    const descriptionIsReadOnly = readOnly || (workOrderType !== "" && !isOtherSelected);

    const handleTypeChange = (value) => {
        onTypeChange && onTypeChange(value);

        const selectedIsOther = String(value).toLowerCase() === OTHER_VALUE.toLowerCase();

        if (selectedIsOther) {
            // Clear the description so the user can type their own.
            onDescriptionChange && onDescriptionChange("");
        } else {
            const match = typeOptions.find((opt) => opt.value === value);
            onDescriptionChange && onDescriptionChange(match ? match.description : "");
        }
    };

    return (
        <>
            <div className="input-row-risk-create" style={{ alignItems: "center" }}>
                <div className={`input-box-type-risk-create ${typeError ? "error-create" : ""}`} >
                    <h3 className="font-fam-labels">
                        Work Order Type {required && <span className="required-field">*</span>}
                    </h3>
                    <div className="jra-info-popup-page-select-container">
                        <select
                            className="table-control font-fam remove-default-styling"
                            name="workOrderType"
                            value={workOrderType}
                            style={{ fontFamily: "Arial" }}
                            disabled={readOnly || loadingOptions}
                            onChange={(e) => handleTypeChange(e.target.value)}
                        >
                            <option value="" disabled>
                                {loadingOptions ? "Loading..." : "Select Work Order Type"}
                            </option>
                            {typeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {!readOnly && (
                        <button
                            type="button"
                            className="abbr--butt-cent-1"
                            onClick={() => setIsSuggestionOpen(true)}
                        >
                            Suggest New
                        </button>
                    )}
                </div>

                {/* Block 2: Description */}
                <div className={`input-box-type-risk-create ${descriptionError ? "error-create" : ""}`} >
                    <h3 className="font-fam-labels">
                        Work Order Description {required && <span className="required-field">*</span>}
                    </h3>
                    <textarea
                        type="text"
                        name="description"
                        value={description || ""}
                        className="aim-textarea-risk-create-textarea-nopads-workOrder font-fam aim-textarea-text"
                        placeholder="Insert description here..."
                        style={{ fontFamily: "Arial", minHeight: 0, paddingLeft: "10px" }}
                        onChange={(e) => onDescriptionChange && onDescriptionChange(e.target.value)}
                        readOnly={descriptionIsReadOnly}
                    />
                </div>
            </div>
            <WorkOrderSuggestion
                isOpen={isSuggestionOpen}
                onClose={() => {
                    setIsSuggestionOpen(false);
                    refetchTypeOptions();
                }}
                userID={userID}
            />
        </>
    );
};

export default WorkOrderTable;