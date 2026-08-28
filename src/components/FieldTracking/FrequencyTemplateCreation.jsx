import React, { useEffect, useMemo, useState } from "react";

const DAYS_PER_UNIT = {
    hour: 1 / 24,
    day: 1,
    week: 7,
    month: 365.25 / 12,
    quarter: 365.25 / 4,
    year: 365.25,
};

const normalizeFrequencyText = (value) =>
    String(value ?? "")
        .toLowerCase()
        .replace(/[–—]/g, "-")
        .replace(/\s+/g, " ")
        .trim();

const getFrequencySortMeta = (option) => {
    const text = normalizeFrequencyText(option.label || option.value);

    // Non-interval choices always appear after actual time frequencies.
    if (/\b(ad[\s-]?hoc|as needed|on demand|irregular)\b/.test(text)) {
        return { group: 2, days: Number.POSITIVE_INFINITY, text };
    }

    if (/\bother\b/.test(text)) {
        return { group: 3, days: Number.POSITIVE_INFINITY, text };
    }

    // A shift is normally shorter than a day, so it sorts first.
    if (/\b(per|each|every)?\s*shift\b/.test(text)) {
        return { group: 0, days: 0.5, text };
    }

    // Handles values such as 3-Monthly, 2 Weeks, 6-month, and 1 Yearly.
    const numberedFrequency = text.match(
        /(\d+(?:\.\d+)?)\s*[- ]?\s*(hour(?:ly)?|day(?:ly)?|week(?:ly)?|month(?:ly)?|quarter(?:ly)?|year(?:ly)?)/
    );

    if (numberedFrequency) {
        const amount = Number(numberedFrequency[1]);
        const rawUnit = numberedFrequency[2];
        const unit = Object.keys(DAYS_PER_UNIT).find((key) => rawUnit.startsWith(key));

        if (unit && Number.isFinite(amount)) {
            return { group: 0, days: amount * DAYS_PER_UNIT[unit], text };
        }
    }

    const namedFrequencies = [
        { pattern: /\b(hourly|every hour)\b/, days: DAYS_PER_UNIT.hour },
        { pattern: /\b(twice daily|twice a day)\b/, days: 0.5 },
        { pattern: /\b(daily|every day)\b/, days: DAYS_PER_UNIT.day },
        { pattern: /\b(fortnightly|biweekly|every two weeks)\b/, days: 2 * DAYS_PER_UNIT.week },
        { pattern: /\b(weekly|every week)\b/, days: DAYS_PER_UNIT.week },
        { pattern: /\b(bimonthly|every two months)\b/, days: 2 * DAYS_PER_UNIT.month },
        { pattern: /\b(monthly|every month)\b/, days: DAYS_PER_UNIT.month },
        { pattern: /\b(quarterly|every quarter)\b/, days: DAYS_PER_UNIT.quarter },
        {
            pattern: /\b(semi[\s-]?annual(?:ly)?|half[\s-]?yearly|twice a year)\b/,
            days: 0.5 * DAYS_PER_UNIT.year,
        },
        { pattern: /\b(annual(?:ly)?|yearly|every year)\b/, days: DAYS_PER_UNIT.year },
    ];

    const namedMatch = namedFrequencies.find(({ pattern }) => pattern.test(text));

    if (namedMatch) {
        return { group: 0, days: namedMatch.days, text };
    }

    // New or unrecognized values remain usable and are placed near the end.
    return { group: 1, days: Number.POSITIVE_INFINITY, text };
};

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

    const frequencyOptions = useMemo(() => {
        const source = frequencyOptionsProp || fetchedOptions;
        const collator = new Intl.Collator(undefined, {
            numeric: true,
            sensitivity: "base",
        });

        return source
            .map((opt) => ({
                value: opt.value ?? opt.frequency ?? opt,
                label: opt.label ?? opt.frequency ?? opt,
            }))
            .sort((a, b) => {
                const aMeta = getFrequencySortMeta(a);
                const bMeta = getFrequencySortMeta(b);

                return (
                    aMeta.group - bMeta.group ||
                    aMeta.days - bMeta.days ||
                    collator.compare(aMeta.text, bMeta.text)
                );
            });
    }, [frequencyOptionsProp, fetchedOptions]);

    return (
        <div className={`input-box-type-risk-create ${error ? "error-create" : ""}`}>
            <h3 className="font-fam-labels">
                Work Order Frequency {required && <span className="required-field">*</span>}
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
                        {loadingOptions ? "Loading..." : "Select Work Order Frequency"}
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