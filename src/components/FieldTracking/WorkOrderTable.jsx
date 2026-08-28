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
    // Work order types that have been suggested (either just now, via the
    // popup, or previously - loaded in from a draft) but aren't yet part of
    // the official list returned by the backend. Rendered with a trailing
    // "*" so it's clear they're pending, and automatically dropped once the
    // matching official option shows up (e.g. after an admin approves it
    // and we refetch).
    const [suggestedTypes, setSuggestedTypes] = useState([]);

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

    // Normalize whatever we have (prop or fetched) into { value, label, description}.
    // These are the "official" options - i.e. actually present in the system.
    const officialOptions = useMemo(() => {
        const source = typeOptionsProp || fetchedOptions;

        const normalized = source.map((opt) => ({
            value: opt.value ?? opt.type,
            label: opt.label ?? opt.type,
            description: opt.description ?? "",
        }));

        // Pull "Other" out of wherever it landed (start, middle, end - doesn't
        // matter where the backend returned it), it gets placed last separately.
        return normalized.filter(
            (opt) => String(opt.value).toLowerCase() !== OTHER_VALUE.toLowerCase()
        );
    }, [typeOptionsProp, fetchedOptions]);

    const isOfficialValue = (value) =>
        officialOptions.some(
            (opt) => String(opt.value).toLowerCase() === String(value).toLowerCase()
        );

    // Seed a "suggested" (unofficial) option whenever the current value isn't
    // part of the official list yet - this covers a draft being loaded with a
    // workOrderType that was only ever suggested, never approved. Skipped
    // while options are still loading so we don't briefly flag an official
    // type as suggested before the real list arrives.
    useEffect(() => {
        if (loadingOptions) return;

        const value = workOrderType;
        if (!value || String(value).toLowerCase() === OTHER_VALUE.toLowerCase()) return;
        if (isOfficialValue(value)) return;

        setSuggestedTypes((prev) => {
            const exists = prev.some(
                (opt) => String(opt.value).toLowerCase() === String(value).toLowerCase()
            );

            if (exists) {
                // Keep the description synced in case it arrived after mount
                // (e.g. the draft finished loading a moment later).
                return prev.map((opt) =>
                    String(opt.value).toLowerCase() === String(value).toLowerCase()
                        ? { ...opt, description: description || opt.description }
                        : opt
                );
            }

            return [...prev, { value, label: value, description: description || "" }];
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workOrderType, description, loadingOptions, officialOptions]);

    // Drop any local suggestion that has since become official (e.g. once an
    // admin approves it and we refetch the real list) so the "*" disappears.
    useEffect(() => {
        setSuggestedTypes((prev) => prev.filter((s) => !isOfficialValue(s.value)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [officialOptions]);

    // Merge official + suggested options. The "Other" option has been
    // removed - the type is always picked from the list, so the
    // description is always derived rather than typed by hand.
    const typeOptions = useMemo(() => {
        const unofficialSuggestions = suggestedTypes
            .filter((s) => !isOfficialValue(s.value))
            .map((s) => ({ ...s, label: `${s.label} *` }));

        return [...officialOptions, ...unofficialSuggestions];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [officialOptions, suggestedTypes]);

    const handleTypeChange = (value) => {
        onTypeChange && onTypeChange(value);

        const match = typeOptions.find((opt) => opt.value === value);
        onDescriptionChange && onDescriptionChange(match ? match.description : "");
    };

    // Called by WorkOrderSuggestion right after a new type is successfully
    // submitted: select it immediately and register it as a suggested
    // (unofficial) option so it shows up in the dropdown marked with a "*".
    const handleSuggested = ({ type, description: suggestedDescription }) => {
        if (!type) return;

        setSuggestedTypes((prev) => {
            const filtered = prev.filter(
                (opt) => String(opt.value).toLowerCase() !== String(type).toLowerCase()
            );
            return [
                ...filtered,
                { value: type, label: type, description: suggestedDescription || "" },
            ];
        });

        onTypeChange && onTypeChange(type);
        onDescriptionChange && onDescriptionChange(suggestedDescription || "");
    };

    return (
        <>
            <div className="input-row-risk-create" style={{ alignItems: "stretch" }}>
                <div
                    className={`input-box-type-risk-create ${typeError ? "error-create" : ""}`}
                    style={{ display: "flex", flexDirection: "column" }}
                >
                    <h3 className="font-fam-labels">
                        Work Order Type {required && <span className="required-field">*</span>}
                    </h3>
                    <div className="jra-info-popup-page-select-container" style={{ flex: 1 }}>
                        <select
                            className="table-control font-fam remove-default-styling"
                            name="workOrderType"
                            value={workOrderType}
                            style={{ fontFamily: "Arial", height: "100%" }}
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
                    {false && !readOnly && (
                        <button
                            type="button"
                            className="abbr--butt-cent-1"
                            onClick={() => setIsSuggestionOpen(true)}
                        >
                            Suggest New
                        </button>
                    )}
                </div>

                {/* Block 2: Description - derived from the selected type, display only */}
                <div
                    className={`input-box-type-risk-create ${descriptionError ? "error-create" : ""}`}
                    style={{ display: "flex", flexDirection: "column", backgroundColor: "#e6e6e6" }}
                >
                    <h3 className="font-fam-labels">
                        Work Order Type Description
                    </h3>
                    <div
                        style={{
                            fontFamily: "Arial",
                            whiteSpace: "pre-wrap",
                            fontSize: "16px",
                            flex: 1,
                            overflowY: "auto",
                            boxSizing: "border-box"
                        }}
                    >
                        {description || ""}
                    </div>
                </div>
            </div>
            {false && (<WorkOrderSuggestion
                isOpen={isSuggestionOpen}
                onClose={() => {
                    setIsSuggestionOpen(false);
                    refetchTypeOptions();
                }}
                onSuggested={handleSuggested}
                userID={userID}
            />)}
        </>
    );
};

export default WorkOrderTable;