import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-multi-date-picker";

const getTodayLocalISO = () => {
    const d = new Date();
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60 * 1000);
    return local.toISOString().slice(0, 10); // YYYY-MM-DD (local)
};

const ModifySerialDate = ({
    isOpen,
    onClose,
    onUpdate,
    component,
    rows,
    setRows,
    index,
}) => {
    const todayStr = getTodayLocalISO();

    // --- Private draft of rows ---
    const [draftRows, setDraftRows] = useState([]);
    useEffect(() => {
        if (isOpen) setDraftRows((rows || []).map((r) => ({ ...r })));
    }, [isOpen, rows]);

    const activeRow = draftRows[index] || {};
    const [dateVal, setDateVal] = useState(activeRow.dateUpdatedStr || "");
    const [serialNumber, setSerialNumber] = useState(activeRow.serialNumber || "");

    useEffect(() => {
        if (!isOpen) return;
        const r = draftRows[index] || {};
        setDateVal(r.dateUpdatedStr || "");
        setSerialNumber(r.serialNumber || "");
    }, [isOpen, index, draftRows]);

    // --- Helpers you already had ---
    const isValidDateObj = (d) => d instanceof Date && !Number.isNaN(d.getTime());
    const normalizeLooseDate = (s) => {
        if (!s) return "";
        const m = String(s).trim().match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
        if (!m) return "";
        let [, yStr, moStr, dStr] = m;
        const y = Number(yStr), mo = Number(moStr), d = Number(dStr);
        if (mo < 1 || mo > 12 || d < 1 || d > 31) return "";
        const dt = new Date(Date.UTC(y, mo - 1, d));
        if (!isValidDateObj(dt)) return "";
        if (dt.getUTCFullYear() !== y || dt.getUTCMonth() + 1 !== mo || dt.getUTCDate() !== d) return "";
        return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };
    const toISOFromInputLoose = (s) => {
        const norm = normalizeLooseDate(s);
        if (!norm) return null;
        const dt = new Date(`${norm}T00:00:00.000Z`);
        return isValidDateObj(dt) ? dt.toISOString() : null;
    };
    const clampToToday = (yyyyMmDd) => (!yyyyMmDd ? "" : (yyyyMmDd > todayStr ? todayStr : yyyyMmDd));

    const updateDraftRow = (idx, patch) => {
        setDraftRows((prev) => {
            const next = prev.slice();
            const r = next[idx] || {};
            const merged = { ...r, ...patch };
            const newISO = toISOFromInputLoose(merged.dateUpdatedStr || "");
            const dateChanged = newISO !== r.originalISO;
            const serialChanged = merged.serialNumber !== r.serialNumber;
            merged.changed = Boolean(dateChanged || serialChanged);
            next[idx] = merged;
            return next;
        });
    };

    // --- Date handlers (keep clamping if you want immediate correction) ---
    const handleDateRaw = (raw) => clampToToday(normalizeLooseDate(raw) || raw);
    const onDateChange = (value) => {
        const clamped = handleDateRaw(value);
        setDateVal(clamped);
        updateDraftRow(index, { dateUpdatedStr: clamped });
    };
    const onDateBlur = (value) => {
        const clamped = handleDateRaw(value);
        setDateVal(clamped);
        updateDraftRow(index, { dateUpdatedStr: clamped });
    };

    // --- Serial handler ---
    const onSerialChange = (e) => {
        const v = e.target.value;
        setSerialNumber(v);
        updateDraftRow(index, { serialNumber: v });
    };

    // --- SUBMIT GUARD: only enable when full date and <= today ---
    const canSubmit = useMemo(() => {
        const norm = normalizeLooseDate(dateVal);
        return Boolean(norm && norm <= todayStr);
    }, [dateVal, todayStr]);

    if (!isOpen) return null;

    return (
        <div className="review-popup-overlay">
            <div className="review-popup-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Modify {component}</h2>
                    <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="review-date-group">
                    <label className="review-date-label" htmlFor="serial-number">Serial Number</label>
                    <input
                        id="serial-number"
                        type="text"
                        value={serialNumber}
                        placeholder="Enter serial number"
                        onChange={onSerialChange}
                        className="review-popup-input"
                    />
                </div>

                <div className="review-date-group">
                    <label className="review-date-label" htmlFor="component-date">Update / Installation Date</label>
                    <div className="ump-input-select-container-new">
                        <DatePicker
                            id="component-date"
                            required
                            value={dateVal || ""}
                            format="YYYY-MM-DD"
                            onChange={(val) =>
                                onDateChange(val?.format("YYYY-MM-DD"))
                            }
                            onBlur={(val) =>
                                onDateBlur(val?.format("YYYY-MM-DD"))
                            }
                            rangeHover={false}
                            highlightToday={false}
                            editable={false}
                            inputClass="ump-input-select-new-2"
                            placeholder="YYYY-MM-DD"
                            hideIcon={false}
                            maxDate={todayStr}
                            style={{ width: "100%" }}
                        />
                    </div>
                </div>

                <div className="review-date-buttons">
                    <button
                        disabled={!canSubmit}
                        aria-disabled={!canSubmit}
                        title={!canSubmit ? `Pick a date on or before ${todayStr}` : "Submit"}
                        onClick={async () => {
                            if (!canSubmit) return; // double-guard
                            setRows(draftRows);
                            await onUpdate?.(draftRows);
                            onClose();
                        }}
                        style={{ cursor: !canSubmit ? "not-allowed" : "" }}
                        className={`review-date-button ${!canSubmit ? "is-disabled" : ""}`}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModifySerialDate;
