import React, { useEffect, useMemo, useState } from "react";

const FrequencyTemplateCreation = ({
    value,
    onChange,
    onFocus,
    readOnly = false,
    error = false,
    required = true,
    frequencyOptions: frequencyOptionsProp,
}) => {
    const [fetchedOptions, setFetchedOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(!frequencyOptionsProp);

    // If the parent doesn't pass frequencyOptions in directly, fetch them from
    // the same values-upload route family WorkOrderTable uses, just for frequency.
    useEffect(() => {
        if (frequencyOptionsProp) return;

        let isMounted = true;

        const fetchFrequencies = async () => {
            try {
                setLoadingOptions(true);
                const res = await fetch(`${process.env.REACT_APP_URL}/api/valuesUpload/frequency`);
                const data = await res.json();

                if (isMounted) {
                    setFetchedOptions(Array.isArray(data.frequency) ? data.frequency : []);
                }
            } catch (err) {
                console.error("Error fetching frequency options:", err);
            } finally {
                if (isMounted) setLoadingOptions(false);
            }
        };

        fetchFrequencies();

        return () => {
            isMounted = false;
        };
    }, [frequencyOptionsProp]);

    // Normalize whatever we have (prop or fetched) into { value, label },
    // same shape WorkOrderTable normalizes its type options into.
    const frequencyOptions = useMemo(() => {
        const source = frequencyOptionsProp || fetchedOptions;

        return source.map((opt) => ({
            value: opt.value ?? opt.frequency ?? opt,
            label: opt.label ?? opt.frequency ?? opt,
        }));
    }, [frequencyOptionsProp, fetchedOptions]);

    return (
        <div className={`input-box-type-risk-create ${error ? "error-create" : ""}`}>
            <h3 className="font-fam-labels">
                Frequency {required && <span className="required-field">*</span>}
            </h3>

            <div className="jra-info-popup-page-select-container">
                <select
                    className="table-control font-fam remove-default-styling"
                    name="frequency"
                    value={value || ""}
                    onChange={onChange}
                    onFocus={onFocus}
                    disabled={readOnly || loadingOptions}
                >
                    <option value="" disabled>
                        {loadingOptions ? "Loading..." : "Select Frequency"}
                    </option>
                    {frequencyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default FrequencyTemplateCreation;