import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePlus, faSpinner, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

const SuggestMultipleControls = ({ isOpen, onClose, controlData, onSuccess, readOnly }) => {
    const [approver, setApprover] = useState("");
    const [loading, setLoading] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [systemControlsSet, setSystemControlsSet] = useState(new Set());
    const [duplicateRowIds, setDuplicateRowIds] = useState(new Set());
    const [typedDuplicateRowIds, setTypedDuplicateRowIds] = useState(new Set());
    const [emptyRowIds, setEmptyRowIds] = useState(new Set());

    const [controlRows, setControlRows] = useState([
        { id: uuidv4(), value: "" }
    ]);

    useEffect(() => {
        const fetchSystemControls = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/controls`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });

                if (!res.ok) {
                    console.warn("controls fetch failed:", res.status);
                    setSystemControlsSet(new Set());
                    return;
                }

                const data = await res.json();

                // Be defensive: some APIs return {controls:[...]}, others return [...]
                const list = Array.isArray(data) ? data : (data?.controls || []);

                const norm = (s) =>
                    (s ?? "")
                        .toString()
                        .trim()
                        .replace(/\s+/g, " ")       // collapse repeated spaces
                        .toLowerCase();

                const set = new Set(
                    list
                        .map((c) => norm(c?.control))
                        .filter(Boolean)
                );

                setSystemControlsSet(set);

                console.log(set)
            } catch (e) {
                console.error("Failed to load system controls", e);
                setSystemControlsSet(new Set());
            }
        };

        fetchSystemControls();
    }, []);

    const handleControlChange = (id, value) => {
        setControlRows(prev => prev.map(r => (r.id === id ? { ...r, value } : r)));

        // remove "already in system" highlight
        setDuplicateRowIds(prev => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
        });

        // remove "duplicate typed" highlight
        setTypedDuplicateRowIds(prev => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
        });

        setEmptyRowIds(prev => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    // insert AFTER the given index
    const insertControlRowAfter = (rowIndex) => {
        setControlRows(prev => {
            const next = [...prev];
            next.splice(rowIndex + 1, 0, { id: uuidv4(), value: "" });
            return next;
        });
    };

    // delete row (keep at least one)
    const removeControlRow = (id) => {
        setControlRows(prev => {
            if (prev.length <= 1) {
                toast.warn("You must have at least one control.", { closeButton: false, autoClose: 1500 });
                return prev;
            }
            return prev.filter(r => r.id !== id);
        });
    };

    const norm = (s) =>
        (s ?? "")
            .toString()
            .trim()
            .replace(/\s+/g, " ")
            .toLowerCase();

    const findTypedDuplicateRowIds = () => {
        // highlight only the 2nd+ occurrences of the same typed control
        const seen = new Set();
        const dupRowIds = new Set();

        for (const row of controlRows) {
            const v = norm(row.value);
            if (!v) continue;

            if (seen.has(v)) {
                dupRowIds.add(row.id);   // only mark subsequent duplicates
            } else {
                seen.add(v);
            }
        }

        return dupRowIds;
    };

    const findDuplicateRowIds = () => {
        const dups = new Set();

        for (const row of controlRows) {
            const v = norm(row.value);
            if (v && systemControlsSet.has(v)) {
                dups.add(row.id);
            }
        }

        return dups;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (readOnly) return;

        const typedControls = controlRows
            .map(r => (r.value ?? "").trim())
            .filter(Boolean);

        if (typedControls.length === 0) {
            toast.warn("Please add at least one control name.");
            return;
        }

        const empties = new Set(
            controlRows
                .filter(r => !(r.value ?? "").trim())
                .map(r => r.id)
        );

        setEmptyRowIds(empties);

        if (empties.size > 0) {
            toast.warn("Please fill in all control rows.", {
                closeButton: false,
                autoClose: 3000,
            });
            return;
        }

        // 1) Typed duplicates check (different message)
        const typedDups = findTypedDuplicateRowIds();
        setTypedDuplicateRowIds(typedDups);

        if (typedDups.size > 0) {
            toast.warn(
                "You have duplicate controls in your list. Please change the highlighted duplicate entries.",
                { closeButton: false, autoClose: 3000 }
            );
            return;
        }

        // 2) System duplicates check (your existing logic)
        const dups = findDuplicateRowIds();
        setDuplicateRowIds(dups);

        if (dups.size > 0) {
            toast.warn(
                "One or more controls you entered already exist in the system. Please change the highlighted rows.",
                { closeButton: false, autoClose: 3000 }
            );
            return;
        }

        setLoading(true);

        try {
            const payload = { ...(controlData || {}), controls: typedControls };

            const starredControls = typedControls.map(c => (c.endsWith(" *") ? c : `${c} *`));
            onSuccess?.(starredControls);

            toast.success("Controls Added Successfully.");
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="abbr-popup-overlay">
            <div className="control-suggest-popup-content">
                <div className="abbr-popup-header">
                    <h2 className="abbr-popup-title">Add New Controls</h2>
                    <button className="abbr-popup-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="control-suggestion-popup-group">
                        <div className="control-suggestion-table-scroll">
                            <table className="control-suggestion-popup-page-table">
                                <tbody>
                                    {controlRows.map((row, index) => (
                                        <tr
                                            key={row.id}
                                            style={{
                                                backgroundColor:
                                                    (typedDuplicateRowIds.has(row.id) || duplicateRowIds.has(row.id)) || emptyRowIds.has(row.id)
                                                        ? "#ffd6d6"
                                                        : "transparent"
                                            }}
                                        >
                                            <td>
                                                <div className="ibra-popup-page-row-actions">
                                                    <textarea
                                                        value={row.value}
                                                        onChange={(e) => handleControlChange(row.id, e.target.value)}
                                                        className="ibra-popup-page-input-table-controls-text-areas ibra-popup-page-row-input"
                                                        placeholder="Insert Control Title"
                                                        style={{ resize: "none" }}
                                                        readOnly={readOnly}
                                                    />

                                                    {!readOnly && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="ibra-popup-page-action-button"
                                                                onClick={() => removeControlRow(row.id)}
                                                                title="Remove control"
                                                            >
                                                                <FontAwesomeIcon icon={faTrashAlt} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="ibra-popup-page-action-button-add-hazard"
                                                                onClick={() => insertControlRowAfter(index)}
                                                                title="Insert control below"
                                                            >
                                                                <FontAwesomeIcon icon={faCirclePlus} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="abbr-popup-buttons">
                        <button
                            type="submit"
                            className="abbr-popup-button"
                            disabled={loading || readOnly}
                            style={{ width: "40%" }}
                        >
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SuggestMultipleControls;
