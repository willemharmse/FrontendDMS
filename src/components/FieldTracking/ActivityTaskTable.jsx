import React, { useEffect, useMemo, useState } from "react";

const getOptionValue = (option) => {
    if (typeof option === "string" || typeof option === "number") {
        return String(option).trim();
    }

    return String(
        option?.activity ??
        option?.value ??
        option?.label ??
        option?.name ??
        option?.type ??
        ""
    ).trim();
};

const getOptionLabel = (option, fallback) => {
    if (typeof option === "string" || typeof option === "number") {
        return String(option).trim();
    }

    return String(option?.label ?? option?.activity ?? option?.name ?? fallback).trim();
};

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
}) => {
    const hasProvidedOptions = Array.isArray(typeOptionsProp);
    const [fetchedOptions, setFetchedOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(!hasProvidedOptions);

    useEffect(() => {
        if (hasProvidedOptions) {
            setLoadingOptions(false);
            return undefined;
        }

        let isMounted = true;

        const fetchActivityNames = async () => {
            try {
                setLoadingOptions(true);

                const response = await fetch(
                    `${process.env.REACT_APP_URL}/api/valuesUpload/activityNames`
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch activities: ${response.status}`);
                }

                const data = await response.json();
                const activityNames = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.activityNames)
                        ? data.activityNames
                        : Array.isArray(data?.values)
                            ? data.values
                            : [];

                if (isMounted) {
                    setFetchedOptions(activityNames);
                }
            } catch (error) {
                console.error("Error fetching activity names:", error);

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
    }, [hasProvidedOptions]);

    const typeOptions = useMemo(() => {
        const source = hasProvidedOptions ? typeOptionsProp : fetchedOptions;
        const seen = new Set();

        const normalized = (Array.isArray(source) ? source : [])
            .map((option) => {
                const optionValue = getOptionValue(option);

                return {
                    value: optionValue,
                    label: getOptionLabel(option, optionValue),
                };
            })
            .filter((option) => {
                const key = option.value.toLocaleLowerCase();

                if (!option.value || seen.has(key)) {
                    return false;
                }

                seen.add(key);
                return true;
            });

        // Preserve a value that may already exist on an edited record, even if
        // it is no longer returned by the options endpoint.
        const currentValue = String(activityVerb ?? "").trim();
        if (currentValue && !seen.has(currentValue.toLocaleLowerCase())) {
            normalized.push({ value: currentValue, label: currentValue });
        }

        const regularOptions = normalized.filter(
            (option) => option.value.toLocaleLowerCase() !== "other"
        );
        const otherOption = normalized.find(
            (option) => option.value.toLocaleLowerCase() === "other"
        ) ?? { value: "Other", label: "Other" };

        return [...regularOptions, otherOption];
    }, [hasProvidedOptions, typeOptionsProp, fetchedOptions, activityVerb]);

    return (
        <div className="input-row">
            <div
                className={`input-box-title ${activityVerbError || taskNameError ? "error-create" : ""
                    }`}
            >
                <h3 className="font-fam-labels">
                    Activity Name
                    {required && <span className="required-field"> *</span>}
                </h3>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        gap: "10px",
                    }}
                >
                    <div
                        className="jra-info-popup-page-select-container"
                        style={{
                            flex: "0 0 23.5%",
                            maxWidth: "23.5%",
                            boxSizing: "border-box",
                        }}
                    >
                        <select
                            className="table-control font-fam remove-default-styling"
                            name="activityVerb"
                            value={activityVerb || ""}
                            style={{
                                fontFamily: "Arial",
                                width: "100%",
                                boxSizing: "border-box",
                                height: "38px",
                            }}
                            disabled={readOnly || loadingOptions}
                            onChange={(event) => onActivityVerbChange?.(event.target.value)}
                        >
                            <option value="" disabled>
                                {loadingOptions ? "Loading..." : "Select Activity"}
                            </option>
                            {typeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <textarea
                        name="taskName"
                        value={taskName || ""}
                        className="aim-textarea-risk-create-textarea-nopads font-fam aim-textarea-text"
                        placeholder="Insert task name"
                        style={{
                            fontFamily: "Arial",
                            minHeight: 0,
                            paddingLeft: "10px",
                            flex: "0 0 auto",
                            width: "calc(76.5% - 10px)",
                            maxWidth: "calc(76.5% - 10px)",
                            boxSizing: "border-box",
                        }}
                        onChange={(event) => onTaskNameChange?.(event.target.value)}
                        readOnly={readOnly}
                    />
                </div>
            </div>
        </div>
    );
};

export default ActivityTaskTable;