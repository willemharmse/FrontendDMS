import React, { useEffect, useState, forwardRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlusCircle, faInfoCircle, faChevronDown, faChevronRight, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from "uuid";
import RelevantControlsSelectionPopup from "./RelevantControlsSelectionPopup";
import ApplicableControlHelp from "./RiskInfo/ApplicableControlHelp";
import RiskAssessmentItemsDelete from "./RiskAssessmentItemsDelete";

const RelevantControlsTable = forwardRef(({ relevantControls, setFormData, readOnly = false, globalControls = [], isCollapsed, highlightedControlNames }, ref) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [help, setHelp] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // Initialize local state using the prop (defaults to false if undefined)
    const [collapsed, setCollapsed] = useState(true);

    const openHelp = () => {
        setHelp(true);
    }

    const closeHelp = () => {
        setHelp(false);
    }

    // Toggle logic: updates local state immediately, then updates parent FormData
    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);

        setFormData(prev => ({
            ...prev,
            isRelevantControlsCollapsed: newState
        }));
    };

    // Toggle the popup visibility
    const togglePopup = () => {
        setIsPopupOpen(!isPopupOpen);
    };

    const handleSaveControls = (selectedControlObjects) => {
        setFormData(prev => {
            const selectedNames = new Set(
                (selectedControlObjects || [])
                    .map(o => (o?.control || "").trim())
                    .filter(Boolean)
            );

            // existing controls map (preserve ids/descriptions where possible)
            const byName = new Map((prev.relevantControls || []).map(rc => [rc.control, rc]));

            const updatedList = Array.from(selectedNames).map(name => {
                const existing = byName.get(name);
                const fromPopup = (selectedControlObjects || []).find(o => o.control === name);

                if (existing) {
                    return {
                        ...existing,
                        category:
                            (existing?.category || fromPopup?.category || "").toString().trim(),
                    };
                }

                return {
                    id: uuidv4(),
                    control: name,
                    description: fromPopup?.description || "",
                    category: (fromPopup?.category ?? "").toString().trim(),
                };
            });

            // ✅ find what was removed (compare previous relevant controls vs new)
            const prevNamesNorm = new Set((prev.relevantControls || []).map(rc => norm(rc.control)));
            const nextNamesNorm = new Set(updatedList.map(rc => norm(rc.control)));
            const removedNamesNorm = Array.from(prevNamesNorm).filter(n => !nextNamesNorm.has(n));

            // ✅ purge removed controls from IBRA + CEA
            const withPurges = purgeControlNamesFromIBRAAndCEA(prev, removedNamesNorm);

            return {
                ...withPurges,
                relevantControls: updatedList,
            };
        });
    };

    const removeControl = (id) => {
        setFormData(prev => {
            const removed = (prev.relevantControls || []).find(c => c.id === id);
            const removedNameNorm = norm(removed?.control);

            const nextRelevant = (prev.relevantControls || []).filter(c => c.id !== id);

            // purge from IBRA + CEA
            const withPurges = purgeControlNamesFromIBRAAndCEA(
                prev,
                removedNameNorm ? [removedNameNorm] : []
            );

            return {
                ...withPurges,
                relevantControls: nextRelevant,
            };
        });
    };

    const requestRemoveControl = (id) => {
        setConfirmDeleteId(id);
    };

    const confirmRemoveControl = () => {
        if (confirmDeleteId != null) {
            removeControl(confirmDeleteId);
        }
        setConfirmDeleteId(null);
    };

    const cancelRemoveControl = () => {
        setConfirmDeleteId(null);
    };

    const sortedRelevantControls = [...(relevantControls || [])].sort((a, b) => {
        const normalize = (v) => (v == null ? "" : String(v).trim());
        const normCat = (v) => normalize(v).toLowerCase();

        const aCat = normCat(a.category);
        const bCat = normCat(b.category);

        const aIsGeneral = aCat === "general";
        const bIsGeneral = bCat === "general";

        // 1. General first
        if (aIsGeneral && !bIsGeneral) return -1;
        if (!aIsGeneral && bIsGeneral) return 1;

        // 2. Category A-Z
        if (aCat !== bCat) {
            return aCat.localeCompare(bCat);
        }

        // 3. Control name A-Z
        return normalize(a.control).localeCompare(normalize(b.control), undefined, {
            sensitivity: "base"
        });
    });

    const norm = (s) => (s ?? "").toString().trim().toLowerCase();

    const purgeControlNamesFromIBRAAndCEA = (prev, removedNamesNorm) => {
        if (!removedNamesNorm || removedNamesNorm.length === 0) return prev;

        const removedSet = new Set(removedNamesNorm);

        const nextIBRA = (prev.ibra || []).map(r => ({
            ...r,
            controls: (r.controls || []).filter(c => {
                const name = typeof c === "string" ? c : c?.control;
                return !removedSet.has(norm(name));
            })
        }));

        const nextCEA = (prev.cea || [])
            .filter(r => !removedSet.has(norm(r.control)))
            .map((r, i) => ({ ...r, nr: i + 1 })); // keep numbering clean

        return { ...prev, ibra: nextIBRA, cea: nextCEA };
    };

    const highlightedSet = new Set((highlightedControlNames || []).map(norm));

    return (
        <div className="input-row" ref={ref}>
            {/* Added relative positioning to ensure the button stays in the corner */}
            <div className="input-box-ref" style={{ position: "relative" }}>
                <button
                    className="top-left-button-refs"
                    title="Information"
                >
                    <FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} onClick={openHelp} className="icon-um-search" />
                </button>

                {/* Collapse Button placed in top-left using your existing class pattern */}
                <button
                    className="top-right-button-ibra"
                    title={collapsed ? "Expand Section" : "Collapse Section"}
                    onClick={toggleCollapse}
                    style={{ color: "gray" }}
                    type="button"
                >
                    <FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} />
                </button>

                <h3 className="font-fam-labels">
                    Applicable Controls <span className="required-field">*</span>
                </h3>

                {/* Only render table and buttons if NOT collapsed */}
                {!collapsed && (
                    <>
                        {relevantControls && relevantControls.length > 0 && (
                            <table className="vcr-table table-borders">
                                <thead className="cp-table-header" style={{ backgroundColor: "#002060", color: "white" }}>
                                    <tr>
                                        <th className="refColCen refNum" style={{ width: "5%" }}>Nr</th>
                                        <th className="refColCen refRef" style={{ width: "10%" }}>Category</th>
                                        <th className="refColCen refRef" style={{ width: "80%" }}>Control Name</th>
                                        {!readOnly && <th className="refColCen refBut" style={{ width: "5%" }}>Action</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedRelevantControls.map((row, index) => (
                                        <tr key={row.id}
                                            style={highlightedSet.has(norm(row.control)) ? { backgroundColor: "#ffcccc" } : undefined}
                                        >
                                            <td className="refCent" style={{ fontSize: "14px" }}>{index + 1}</td>
                                            <td className="refCent" style={{ fontSize: "14px", textAlign: "left", fontWeight: "normal", textAlign: "center" }}>
                                                {row.category}
                                            </td>
                                            <td className="refCent" style={{ fontSize: "14px", textAlign: "left", fontWeight: "normal" }}>
                                                {row.control}
                                            </td>
                                            {!readOnly && (
                                                <td className="ref-but-row procCent">
                                                    <button
                                                        className="remove-row-button"
                                                        onClick={() => requestRemoveControl(row.id)}
                                                        title="Remove Control"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {!readOnly && (
                            <>
                                {relevantControls.length === 0 ? (
                                    <button
                                        className="add-row-button-ref"
                                        onClick={togglePopup}
                                    >
                                        Select
                                    </button>
                                ) : (
                                    <button
                                        className="add-row-button-pic-plus"
                                        onClick={togglePopup}
                                    >
                                        <FontAwesomeIcon icon={faPlusCircle} title="Select More Controls" />
                                    </button>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {help && (<ApplicableControlHelp setClose={closeHelp} />)}

            {/* POPUP COMPONENT */}
            {isPopupOpen && (
                <RelevantControlsSelectionPopup
                    closePopup={togglePopup}
                    onSave={handleSaveControls}
                    globalControls={globalControls}
                    currentControls={relevantControls}
                />
            )}

            {confirmDeleteId != null && (
                <RiskAssessmentItemsDelete
                    closeModal={cancelRemoveControl}
                    type="Control"
                    removeRow={confirmRemoveControl}
                />
            )}
        </div>
    );
});

export default RelevantControlsTable;