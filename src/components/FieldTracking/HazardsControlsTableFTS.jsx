import React, { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronDown,
    faChevronUp,
    faTrash,
    faPlusCircle
} from "@fortawesome/free-solid-svg-icons";
import AddHazardRowPopup from "./AddHazardRowPopup";

const HazardsControlsTableFTS = ({
    collapsible = false,
    defaultCollapsed = true,
    hazardControlRows = [],
    addHazardControlRow,
    removeHazardControlRow,
    updateHazardControlRow,
    updateHazardControlRows,
    readOnly = false,
    required = false
}) => {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    const isCollapsed = collapsible ? collapsed : false;

    // Tracks which row (by original index) is currently hovered, so the
    // remove icon only shows for that row.
    const [hoveredRowKey, setHoveredRowKey] = useState(null);

    // Tracks the position (and hazard context) of the "Add Item" icon that
    // floats, centered across the full table width, at the bottom edge of
    // whichever row is currently hovered.
    const [hoveredRowRect, setHoveredRowRect] = useState(null);
    const tableWrapperRef = useRef(null);

    // The icon lives outside the row's own DOM box (it's an absolutely
    // positioned sibling after the table), so moving the cursor off the row
    // and onto the icon would otherwise hide it before a click can land.
    // This timeout gives a brief grace period, cancelled if the row or the
    // icon itself is re-entered before it fires.
    const hideAddIconTimeoutRef = useRef(null);

    const cancelHideAddIcon = () => {
        if (hideAddIconTimeoutRef.current) {
            clearTimeout(hideAddIconTimeoutRef.current);
            hideAddIconTimeoutRef.current = null;
        }
    };

    const scheduleHideAddIcon = () => {
        cancelHideAddIcon();
        hideAddIconTimeoutRef.current = setTimeout(() => {
            setHoveredRowKey(null);
            setHoveredRowRect(null);
        }, 150);
    };

    useEffect(() => {
        return () => cancelHideAddIcon();
    }, []);

    // Popup state for adding a new hazard/control via AddHazardRowPopup.
    // addPopupHazard pre-fills the popup's hazard field when opened from an
    // existing hazard row's Add Item icon.
    const [showAddPopup, setShowAddPopup] = useState(false);
    const [addPopupHazard, setAddPopupHazard] = useState(null);

    const toggleCollapse = () => {
        setCollapsed((prev) => !prev);
    };

    const openAddPopup = (hazard = null) => {
        setAddPopupHazard(hazard);
        setShowAddPopup(true);
    };

    const closeAddPopup = () => {
        setShowAddPopup(false);
        setAddPopupHazard(null);
    };

    const handleAddPopupSubmit = (popupData) => {
        const hazard = normalize(popupData?.hazard);
        const unwantedEvent = normalize(popupData?.unwantedEvent);

        const newRows = (popupData?.controls || [])
            .map((c) => normalize(c?.control))
            .filter((control) => control !== "")
            .map((control) => ({ hazard, unwantedEvent, control }));

        if (newRows.length > 0) {
            if (typeof updateHazardControlRows === "function") {
                updateHazardControlRows([...hazardControlRows, ...newRows]);
            } else if (typeof addHazardControlRow === "function") {
                newRows.forEach((row) => addHazardControlRow(row));
            }
        }

        closeAddPopup();
    };

    const normalize = (value) => String(value || "").trim();

    const sortedRows = useMemo(() => {
        return [...hazardControlRows]
            .map((row, index) => ({
                ...row,
                __originalIndex: index,
                hazard: normalize(row.hazard),
                unwantedEvent: normalize(row.unwantedEvent),
                control: normalize(row.control)
            }))
            .sort((a, b) => {
                const hazardCompare = a.hazard.localeCompare(b.hazard, undefined, {
                    sensitivity: "base",
                    numeric: true
                });
                if (hazardCompare !== 0) return hazardCompare;

                const ueCompare = a.unwantedEvent.localeCompare(b.unwantedEvent, undefined, {
                    sensitivity: "base",
                    numeric: true
                });
                if (ueCompare !== 0) return ueCompare;

                return a.control.localeCompare(b.control, undefined, {
                    sensitivity: "base",
                    numeric: true
                });
            });
    }, [hazardControlRows]);

    // groupedRows preserves sortedRows' order (Map insertion order), so the
    // very last row rendered is always the last entry of sortedRows. Used to
    // tell the icon below the final row apart from icons below every other
    // row - the bottom-of-table one shouldn't pre-fill a hazard.
    const lastRowOriginalIndex = sortedRows.length > 0
        ? sortedRows[sortedRows.length - 1].__originalIndex
        : null;

    const groupedRows = useMemo(() => {
        const hazardMap = new Map();

        sortedRows.forEach((row) => {
            const hazardKey = row.hazard || "";
            const ueKey = row.unwantedEvent || "";

            if (!hazardMap.has(hazardKey)) {
                hazardMap.set(hazardKey, {
                    hazard: hazardKey,
                    totalRows: 0,
                    unwantedEvents: new Map()
                });
            }

            const hazardGroup = hazardMap.get(hazardKey);

            if (!hazardGroup.unwantedEvents.has(ueKey)) {
                hazardGroup.unwantedEvents.set(ueKey, {
                    unwantedEvent: ueKey,
                    rows: []
                });
            }

            hazardGroup.unwantedEvents.get(ueKey).rows.push(row);
            hazardGroup.totalRows += 1;
        });

        return Array.from(hazardMap.values()).map((hazardGroup) => ({
            ...hazardGroup,
            unwantedEvents: Array.from(hazardGroup.unwantedEvents.values()).map((ueGroup) => ({
                ...ueGroup,
                rowSpan: ueGroup.rows.length
            }))
        }));
    }, [sortedRows]);

    return (
        <div className="input-row">
            <div className="input-box-ref">
                <h3 className="font-fam-labels">
                    Hazards and Controls <span className="required-field">{required ? "*" : ""}</span>
                </h3>

                {collapsible && (
                    <button
                        className="top-right-button-ibra"
                        title={collapsed ? "Expand Section" : "Collapse Section"}
                        onClick={toggleCollapse}
                        style={{ color: "gray" }}
                        type="button"
                    >
                        <FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} />
                    </button>
                )}

                {!isCollapsed && (
                    <div
                        className="hazard-control-table-wrapper"
                        ref={tableWrapperRef}
                        style={{ position: "relative", width: "100%" }}
                    >
                        <table className="vcr-table table-borders">
                            <thead className="cp-table-header">
                                <tr>
                                    <th className="refColCen refRef" style={{ width: "15%" }}>Hazard</th>
                                    <th className="refColCen refRef" style={{ width: "15%" }}>Unwanted Event</th>
                                    <th className="refColCen refRef" style={{ width: "65%" }}>Control</th>
                                    {!readOnly && (<th className="refColCen refBut" style={{ width: "5%" }}>Action</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {hazardControlRows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            style={{
                                                textAlign: "center",
                                                fontSize: "14px",
                                                padding: "12px"
                                            }}
                                        >
                                            No information available
                                        </td>
                                    </tr>
                                ) : (
                                    groupedRows.map((hazardGroup) =>
                                        hazardGroup.unwantedEvents.map((ueGroup, ueIndex) =>
                                            ueGroup.rows.map((row, rowIndex) => {
                                                const isFirstHazardRow = ueIndex === 0 && rowIndex === 0;
                                                const isFirstUERow = rowIndex === 0;

                                                const isRowHovered = hoveredRowKey === row.__originalIndex;

                                                return (
                                                    <tr
                                                        key={`${row.__originalIndex}-${row.hazard}-${row.unwantedEvent}-${row.control}`}
                                                        className={isRowHovered ? "hazard-control-row-hovered" : ""}
                                                        onMouseEnter={(e) => {
                                                            cancelHideAddIcon();
                                                            setHoveredRowKey(row.__originalIndex);

                                                            const rowEl = e.currentTarget;
                                                            const wrapperEl = tableWrapperRef.current;
                                                            if (rowEl && wrapperEl) {
                                                                const rowRect = rowEl.getBoundingClientRect();
                                                                const wrapperRect = wrapperEl.getBoundingClientRect();
                                                                const isLastRow = row.__originalIndex === lastRowOriginalIndex;
                                                                setHoveredRowRect({
                                                                    bottom: rowRect.bottom - wrapperRect.top + wrapperEl.scrollTop,
                                                                    hazard: isLastRow ? null : row.hazard
                                                                });
                                                            }
                                                        }}
                                                        onMouseLeave={scheduleHideAddIcon}
                                                    >
                                                        {isFirstHazardRow && (
                                                            <td
                                                                rowSpan={hazardGroup.totalRows}
                                                                style={{ verticalAlign: "middle", fontSize: "14px" }}
                                                            >
                                                                {row.hazard}
                                                            </td>
                                                        )}

                                                        {isFirstUERow && (
                                                            <td
                                                                rowSpan={ueGroup.rowSpan}
                                                                style={{ verticalAlign: "middle", fontSize: "14px" }}
                                                            >
                                                                {row.unwantedEvent}
                                                            </td>
                                                        )}

                                                        <td style={{ fontSize: "14px" }}>
                                                            {row.control}
                                                        </td>

                                                        {!readOnly && (<td
                                                            className="procCent action-cell-auth-risk"
                                                            style={{ verticalAlign: "middle", border: "none", height: "100%" }}
                                                        >
                                                            {!readOnly && (
                                                                <div
                                                                    style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        height: "100%"
                                                                    }}
                                                                >
                                                                    <button
                                                                        className="remove-row-button"
                                                                        onClick={() => removeHazardControlRow(row.__originalIndex)}
                                                                        title="Remove Control"
                                                                        type="button"
                                                                    >
                                                                        <FontAwesomeIcon icon={faTrash} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>)}
                                                    </tr>
                                                );
                                            })
                                        )
                                    )
                                )}
                            </tbody>
                        </table>

                        {!readOnly && hazardControlRows.length > 0 && hoveredRowRect && (
                            <FontAwesomeIcon
                                icon={faPlusCircle}
                                className="insert-row-button-sig-risk font-fam"
                                title="Add Item"
                                style={{
                                    position: "absolute",
                                    top: hoveredRowRect.bottom,
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    opacity: 1,
                                    visibility: "visible",
                                    zIndex: 5
                                }}
                                onMouseEnter={cancelHideAddIcon}
                                onMouseLeave={scheduleHideAddIcon}
                                onClick={() => openAddPopup(hoveredRowRect.hazard)}
                            />
                        )}
                    </div>
                )}

                {!isCollapsed && !readOnly && hazardControlRows.length === 0 && (
                    <button
                        className="add-row-button-ds-risk font-fam"
                        onClick={() => openAddPopup()}
                    >
                        <FontAwesomeIcon icon={faPlusCircle} title="Add Item" />
                    </button>
                )}
            </div>

            {showAddPopup && (
                <AddHazardRowPopup
                    onClose={closeAddPopup}
                    onSubmit={handleAddPopupSubmit}
                    data={{ hazard: addPopupHazard || "" }}
                    readOnly={readOnly}
                />
            )}
        </div>
    );
};

export default HazardsControlsTableFTS;