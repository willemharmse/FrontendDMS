import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSearch, faTimes, faDownload, faCaretLeft, faCaretRight, faTableColumns, faArrowsRotate, faFilter, faX, faFile } from "@fortawesome/free-solid-svg-icons";
import { saveAs } from "file-saver";
import TopBar from "../Notifications/TopBar"; // Ensure path is correct relative to your folder structure
import "./ControlAttributes.css"; // We can reuse the CSS as the classes are generic enough
import { canIn, getCurrentUser } from "../../utils/auth";
import { ToastContainer, toast } from "react-toastify";

const JRAAttributes = () => {
    // --- State ---
    const [rows, setRows] = useState([]); // Holds the flattened JRA data
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const access = getCurrentUser();

    // --- Refs ---
    const scrollerRef = useRef(null);
    const tbodyRef = useRef(null);
    const excelPopupRef = useRef(null);

    // --- Sorting & Filtering Config ---
    const DEFAULT_SORT = { colId: null, direction: null };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);

    const [activeExcelFilters, setActiveExcelFilters] = useState({});
    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());

    // --- Dragging Logic (Horizontal Scroll) ---
    const DRAG_THRESHOLD_PX = 6;
    const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

    // --- Data Fetching & Processing ---
    useEffect(() => {
        fetchJRAInfo();
    }, []);

    const fetchJRAInfo = async () => {
        const route = `/api/riskInfo/jraInfo`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch JRA info');
            }
            const data = await response.json();

            // Flatten the nested structure
            const flattened = flattenJRAData(data.jraInfo);
            setRows(flattened);
        } catch (error) {
            setError(error.message);
            console.error(error);
        }
    };

    // Helper to flatten the MainTask -> Hazard -> UnwantedEvent -> SubStep hierarchy
    const flattenJRAData = (jraData) => {
        const flatRows = [];
        let counter = 0;

        if (!Array.isArray(jraData)) return flatRows;

        jraData.forEach(mainGroup => {
            const mainTaskStep = mainGroup.mainTaskStep || "";
            const hazards = mainGroup.hazards || [];

            hazards.forEach(hazardGroup => {
                const hazard = hazardGroup.hazard || "";
                const unwantedEvents = hazardGroup.unwantedEvents || [];

                unwantedEvents.forEach(ueGroup => {
                    const unwantedEvent = ueGroup.unwantedEvent || "";
                    // Sometimes subTaskSteps might be an array of strings inside the UE object
                    const subTasks = Array.isArray(ueGroup.subTaskSteps) ? ueGroup.subTaskSteps : [];

                    // If there are subtasks, create a row for each. 
                    // If not, create one row with empty subtask to ensure data appears.
                    if (subTasks.length > 0) {
                        subTasks.forEach(subStep => {
                            flatRows.push({
                                _id: `row-${counter++}`, // Synthetic ID for React keys
                                hazard,
                                unwantedEvent,
                                subTaskStep: subStep
                            });
                        });
                    } else {
                        flatRows.push({
                            _id: `row-${counter++}`,
                            hazard,
                            unwantedEvent,
                            subTaskStep: ""
                        });
                    }
                });
            });
        });

        return flatRows;
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    // --- Filtering & Sorting Logic ---

    const getFilterValuesForCell = (row, colId, index) => {
        if (colId === "nr") return [String(index + 1)];
        const val = row[colId];
        return [val ? String(val).trim() : "-"];
    };

    const processedRows = useMemo(() => {
        let current = [...rows];

        // 1. Global Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            current = current.filter(r =>
                (r.mainTaskStep && r.mainTaskStep.toLowerCase().includes(lowerQ)) ||
                (r.hazard && r.hazard.toLowerCase().includes(lowerQ)) ||
                (r.unwantedEvent && r.unwantedEvent.toLowerCase().includes(lowerQ)) ||
                (r.subTaskStep && r.subTaskStep.toLowerCase().includes(lowerQ))
            );
        }

        // 2. Excel Column Filters
        current = current.filter((row, originalIndex) => {
            for (const [colId, selectedValues] of Object.entries(activeExcelFilters)) {
                if (!selectedValues || !Array.isArray(selectedValues)) continue;
                const cellValues = getFilterValuesForCell(row, colId, originalIndex);
                const match = cellValues.some(v => selectedValues.includes(v));
                if (!match) return false;
            }
            return true;
        });

        // 3. Sorting
        const { colId, direction } = sortConfig;
        const dir = direction === "desc" ? -1 : 1;

        // Helper to handle nulls/undefined and empty strings consistent with Excel style
        const normalize = (v) => {
            const s = v == null ? "" : String(v).trim();
            return s === "" ? "(Blanks)" : s;
        };

        if (colId && colId !== "nr") {
            // --- Specific Column Sort ---
            current.sort((a, b) => {
                const valA = a[colId];
                const valB = b[colId];
                const normA = normalize(valA);
                const normB = normalize(valB);

                if (normA === "(Blanks)" && normB !== "(Blanks)") return 1;
                if (normA !== "(Blanks)" && normB === "(Blanks)") return -1;

                return normA.localeCompare(normB, undefined, { numeric: true, sensitivity: 'base' }) * dir;
            });
        } else {
            // --- Default Sort: Hazard -> Unwanted Event -> SubTask Step ---
            current.sort((a, b) => {
                // 1. Sort by Hazard
                const hazA = normalize(a.hazard);
                const hazB = normalize(b.hazard);

                // Handle blanks for Hazard
                if (hazA === "(Blanks)" && hazB !== "(Blanks)") return 1;
                if (hazA !== "(Blanks)" && hazB === "(Blanks)") return -1;

                const hazardCompare = hazA.localeCompare(hazB, undefined, { numeric: true, sensitivity: 'base' });
                if (hazardCompare !== 0) return hazardCompare;

                // 2. Sort by Unwanted Event
                const ueA = normalize(a.unwantedEvent);
                const ueB = normalize(b.unwantedEvent);
                const ueCompare = ueA.localeCompare(ueB, undefined, { numeric: true, sensitivity: 'base' });
                if (ueCompare !== 0) return ueCompare;

                // 3. Sort by Sub Step
                const subA = normalize(a.subTaskStep);
                const subB = normalize(b.subTaskStep);
                return subA.localeCompare(subB, undefined, { numeric: true, sensitivity: 'base' });
            });
        }

        return current;

    }, [rows, searchQuery, activeExcelFilters, sortConfig]);

    const rowSpans = useMemo(() => {
        if (!processedRows.length) return {};

        const spans = {};

        // Track the index of the "leader" row for each mergeable column
        let hazardTracker = 0;
        let ueTracker = 0;

        // Initialize first row
        spans[processedRows[0]._id] = {
            hazard: 1,
            unwantedEvent: 1,
            nr: 1 // Add nr tracker
        };

        for (let i = 1; i < processedRows.length; i++) {
            const curr = processedRows[i];
            const prev = processedRows[i - 1];
            const id = curr._id;

            // Default spans
            spans[id] = { hazard: 1, unwantedEvent: 1, nr: 1 };

            // 1. Merge Hazard (and Nr)
            // Note: If you have mainTaskStep, add that check back. 
            // Based on your current file, we check hazard directly.
            if (curr.hazard === prev.hazard) {
                spans[processedRows[hazardTracker]._id].hazard++;
                spans[id].hazard = 0;

                // Sync Nr with Hazard
                spans[processedRows[hazardTracker]._id].nr++;
                spans[id].nr = 0;
            } else {
                hazardTracker = i;
            }

            // 2. Merge Unwanted Event (Must match UE AND Hazard)
            const sameHazard = curr.hazard === prev.hazard;
            if (sameHazard && curr.unwantedEvent === prev.unwantedEvent) {
                spans[processedRows[ueTracker]._id].unwantedEvent++;
                spans[id].unwantedEvent = 0;
            } else {
                ueTracker = i;
            }
        }
        return spans;
    }, [processedRows]);

    // --- Columns Definition ---
    const availableColumns = [
        { id: "nr", title: "Nr" },
        { id: "hazard", title: "Hazard" },
        { id: "unwantedEvent", title: "Unwanted Event" },
        { id: "subTaskStep", title: "Sub Task Step" },
    ];

    const [showColumns, setShowColumns] = useState([
        "nr",
        "hazard",
        "unwantedEvent",
        "subTaskStep"
    ]);

    const [columnWidths, setColumnWidths] = useState({
        nr: 50,
        hazard: 150,
        unwantedEvent: 300,
        subTaskStep: 300
    });

    const [initialColumnWidths] = useState({
        nr: 50,
        hazard: 150,
        unwantedEvent: 300,
        subTaskStep: 300
    });

    const columnSizeLimits = {
        nr: { min: 50, max: 50 },
        hazard: { min: 150, max: 200 },
        unwantedEvent: { min: 150, max: 1000 },
        subTaskStep: { min: 150, max: 1000 }
    };

    // --- UI Interactions (Sort, Filter Popup, Resize) ---

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT;
            }
            return { colId, direction };
        });
    };

    const openExcelFilterPopup = (colId, e) => {
        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        const values = Array.from(
            new Set(
                (rows || []).flatMap((r, i) => getFilterValuesForCell(r, colId, i))
            )
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

        const existing = activeExcelFilters[colId];
        const initialSelected = new Set(existing && Array.isArray(existing) ? existing : values);

        setExcelSelected(initialSelected);
        setExcelSearch("");

        setExcelFilter({
            open: true,
            colId,
            anchorRect: rect,
            pos: {
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: Math.max(220, rect.width),
            },
        });
    };

    // --- Column Resizing Logic ---
    const isResizingRef = useRef(false);
    const resizingColRef = useRef(null);
    const resizeStartXRef = useRef(0);
    const resizeStartWidthRef = useRef(0);
    const [tableWidth, setTableWidth] = useState(null);
    const [wrapperWidth, setWrapperWidth] = useState(0);
    const [hasFittedOnce, setHasFittedOnce] = useState(false);
    const widthsInitializedRef = useRef(false);

    const startColumnResize = (e, columnId) => {
        e.preventDefault();
        e.stopPropagation();
        isResizingRef.current = true;
        resizingColRef.current = columnId;
        resizeStartXRef.current = e.clientX;
        const th = e.target.closest('th');
        resizeStartWidthRef.current = columnWidths[columnId] ?? (th ? th.getBoundingClientRect().width : 150);
        document.addEventListener('mousemove', handleColumnResizeMove);
        document.addEventListener('mouseup', stopColumnResize);
    };

    const handleColumnResizeMove = (e) => {
        const colId = resizingColRef.current;
        if (!colId) return;

        const deltaX = e.clientX - resizeStartXRef.current;
        let newWidth = resizeStartWidthRef.current + deltaX;

        const limits = columnSizeLimits[colId];
        if (limits) {
            if (limits.min != null) newWidth = Math.max(limits.min, newWidth);
            if (limits.max != null) newWidth = Math.min(limits.max, newWidth);
        }

        setColumnWidths(prev => {
            const updated = { ...prev, [colId]: newWidth };
            const visibleCols = getDisplayColumns().filter(
                id => typeof updated[id] === "number"
            );
            const totalWidth = visibleCols.reduce(
                (sum, id) => sum + (updated[id] || 0),
                0
            );
            setTableWidth(totalWidth);
            return updated;
        });
    };

    const stopColumnResize = () => {
        document.removeEventListener('mousemove', handleColumnResizeMove);
        document.removeEventListener('mouseup', stopColumnResize);
        setTimeout(() => { isResizingRef.current = false; }, 0);
        resizingColRef.current = null;
    };

    // --- Auto Fit / Reset Widths ---
    useEffect(() => {
        if (widthsInitializedRef.current) return;
        if (!scrollerRef.current) return;

        const wrapperEl = scrollerRef.current;
        const wWidth = wrapperEl.clientWidth;
        if (!wWidth) return;

        const displayColumns = getDisplayColumns();

        const totalWidth = displayColumns.reduce((sum, colId) => {
            const w = columnWidths[colId];
            return sum + (typeof w === "number" ? w : 0);
        }, 0);

        if (!totalWidth) return;

        const factor = wWidth / totalWidth;

        setColumnWidths(prev => {
            const updated = { ...prev };
            displayColumns.forEach(colId => {
                const w = prev[colId];
                if (typeof w === "number") {
                    updated[colId] = Math.round(w * factor);
                }
            });
            return updated;
        });

        setWrapperWidth(wrapperEl.getBoundingClientRect().width);
        setTableWidth(wWidth);
        setHasFittedOnce(true);

        widthsInitializedRef.current = true;
    }, [showColumns, columnWidths]);

    const isTableFitted =
        hasFittedOnce &&
        wrapperWidth > 0 &&
        tableWidth != null &&
        Math.abs(tableWidth - wrapperWidth) <= 1;

    const showResetButton =
        hasFittedOnce && !isTableFitted;

    const getDisplayColumns = () => showColumns;

    const resetColumnWidths = () => {
        const wrapper = scrollerRef.current;
        if (!wrapper) return;

        const wrapperWidth = wrapper.getBoundingClientRect().width;
        if (!wrapperWidth) return;

        const visibleCols = getDisplayColumns().filter(
            id => typeof initialColumnWidths[id] === "number"
        );
        if (!visibleCols.length) return;

        const prevWidths = visibleCols.map(id => initialColumnWidths[id]);
        const totalWidth = prevWidths.reduce((a, b) => a + b, 0);
        if (!totalWidth) return;

        const scale = wrapperWidth / totalWidth;
        let newWidths = prevWidths.map(w => w * scale);
        newWidths = newWidths.map(w => Math.round(w));

        let diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);
        let i = 0;
        while (diff !== 0 && i < newWidths.length * 2) {
            const idx = i % newWidths.length;
            newWidths[idx] += diff > 0 ? 1 : -1;
            diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);
            i++;
        }

        setColumnWidths(prev => {
            const updated = { ...prev };
            visibleCols.forEach((id, index) => {
                updated[id] = newWidths[index];
            });
            return updated;
        });

        setTableWidth(wrapperWidth);
        setWrapperWidth(wrapperWidth);
    };

    const fitTableToWidth = () => {
        const wrapper = scrollerRef.current;
        if (!wrapper) return;

        const wrapperWidth = wrapper.getBoundingClientRect().width;
        if (!wrapperWidth) return;

        const visibleCols = getDisplayColumns().filter(
            id => typeof columnWidths[id] === "number"
        );
        if (!visibleCols.length) return;

        const prevWidths = visibleCols.map(id => columnWidths[id]);
        const totalWidth = prevWidths.reduce((a, b) => a + b, 0);

        if (totalWidth >= wrapperWidth) {
            setTableWidth(totalWidth);
            return;
        }

        const scale = wrapperWidth / totalWidth;
        let newWidths = prevWidths.map(w => w * scale);
        newWidths = newWidths.map(w => Math.round(w));

        let diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);
        let i = 0;
        while (diff !== 0 && i < newWidths.length * 2) {
            newWidths[i % newWidths.length] += diff > 0 ? 1 : -1;
            diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);
            i++;
        }

        setColumnWidths(prev => {
            const updated = { ...prev };
            visibleCols.forEach((id, index) => {
                updated[id] = newWidths[index];
            });
            return updated;
        });

        setTableWidth(wrapperWidth);
        setWrapperWidth(wrapperWidth);
    };

    // --- Mouse Drag Scroll ---
    const onRowPointerDown = (e) => {
        if (e.target.closest("button") || e.target.closest("input")) return;
        const tr = e.target.closest("tr");
        if (!tr) return;
        drag.current.active = true;
        drag.current.moved = false;
        drag.current.startX = e.clientX;
        drag.current.startLeft = scrollerRef.current.scrollLeft;
        tr.setPointerCapture?.(e.pointerId);
    };

    const onRowPointerMove = (e) => {
        if (!drag.current.active) return;
        const dx = e.clientX - drag.current.startX;
        if (!drag.current.moved) {
            if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
            drag.current.moved = true;
            scrollerRef.current.classList.add("dragging");
        }
        scrollerRef.current.scrollLeft = drag.current.startLeft - dx;
    };

    const endRowDrag = (e) => {
        if (!drag.current.active) return;
        drag.current.active = false;
        scrollerRef.current?.classList.remove("dragging");
        const tr = e.target.closest("tr");
        tr?.releasePointerCapture?.(e.pointerId);
    };

    // --- Render ---
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [filterMenu, setFilterMenu] = useState({ isOpen: false });
    const hasActiveFilters = Object.keys(activeExcelFilters).length > 0 || sortConfig.colId !== null;

    const allColumnIds = availableColumns.map(c => c.id);

    const handleClearFilters = () => {
        setActiveExcelFilters({});
        setSortConfig(DEFAULT_SORT);
    };

    const toggleColumn = (columnId) => {
        if (columnId === "nr") return;
        if (columnId === "action") return;

        setShowColumns(prev => {
            if (prev.includes(columnId)) {
                return prev.filter(id => id !== columnId);
            }
            return [...prev, columnId];
        });
    };

    const toggleAllColumns = (selectAll) => {
        if (selectAll) {
            setShowColumns(allColumnIds);
        } else {
            setShowColumns(["nr", "action"]);
        }
    };

    const areAllColumnsSelected = () => {
        return allColumnIds.every(id => showColumns.includes(id));
    };

    useEffect(() => {
        if (!hasFittedOnce) return;
        fitTableToWidth();
    }, [isSidebarVisible, showColumns]);

    useEffect(() => {
        if (!excelFilter.open) return;
        const el = excelPopupRef.current;
        if (!el) return;

        const popupRect = el.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const margin = 8;

        let newTop = excelFilter.pos.top;
        let newLeft = excelFilter.pos.left;

        if (popupRect.bottom > viewportH - margin) {
            const anchor = excelFilter.anchorRect;
            if (anchor) {
                const desiredTop = anchor.top - popupRect.height - 4;
                newTop = Math.max(margin, desiredTop);
            }
        }

        if (popupRect.right > viewportW - margin) {
            const overflow = popupRect.right - (viewportW - margin);
            newLeft = Math.max(margin, newLeft - overflow);
        }
        if (popupRect.left < margin) newLeft = margin;

        if (newTop !== excelFilter.pos.top || newLeft !== excelFilter.pos.left) {
            setExcelFilter(prev => ({
                ...prev,
                pos: { ...prev.pos, top: newTop, left: newLeft }
            }));
        }
    }, [excelFilter.open, excelFilter.pos, excelSearch]);

    return (
        <div className="risk-control-attributes-container">
            {/* Sidebar */}
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src="/CH_Logo.svg" alt="Logo" className="logo-img-um" onClick={() => navigate('/home')} />
                        <p className="logo-text-um">Risk Management</p>
                    </div>
                    <div className="button-container-create">
                        {/* Add buttons if needed for JRA specific actions */}
                    </div>
                    <div className="sidebar-logo-dm-fi">
                        <FontAwesomeIcon icon={faFile} className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">JRA Info</p>
                    </div>
                </div>
            )}
            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div className="sidebar-toggle-icon" onClick={() => setIsSidebarVisible(true)}>
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="main-box-risk-control-attributes">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search JRA..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" ? (
                            <i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" /></i>
                        ) : (
                            <i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>
                        )}
                    </div>
                    <div className="spacer"></div>
                    <TopBar />
                </div>

                <div className="table-container-risk-control-attributes">
                    <div className="risk-control-label-wrapper">
                        <label className="risk-control-label">JRA Information</label>

                        <FontAwesomeIcon
                            icon={faTableColumns}
                            title="Columns"
                            className="top-right-button-control-att"
                            onClick={() => setShowColumnSelector(!showColumnSelector)}
                        />
                        <FontAwesomeIcon
                            icon={faFilter}
                            className={hasActiveFilters ? "top-right-button-control-att-2" : "top-right-button-control-att-2"}
                            title="Clear Filters"
                            style={{ color: hasActiveFilters ? "#002060" : "gray" }}
                            onDoubleClick={handleClearFilters}
                        />
                        {showResetButton && (<FontAwesomeIcon
                            icon={faArrowsRotate}
                            title="Reset Widths"
                            className="top-right-button-control-att-3"
                            onClick={resetColumnWidths}
                        />)}

                        {showColumnSelector && (
                            <div className="column-selector-popup" onMouseDown={e => e.stopPropagation()}>
                                <div className="column-selector-header">
                                    <h4>Select Columns</h4>
                                    <button
                                        className="close-popup-btn"
                                        type="button"
                                        onClick={() => setShowColumnSelector(false)}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>

                                <div className="column-selector-content">
                                    <p className="column-selector-note">Select columns to display</p>

                                    <div className="select-all-container">
                                        <label className="select-all-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={areAllColumnsSelected()}
                                                onChange={(e) => toggleAllColumns(e.target.checked)}
                                            />
                                            <span className="select-all-text">Select All</span>
                                        </label>
                                    </div>

                                    <div
                                        className="column-checkbox-container"
                                    >
                                        {availableColumns.map(column => (
                                            <div className="column-checkbox-item" key={column.id}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={showColumns.includes(column.id)}
                                                        disabled={column.id === 'nr' || column.id === 'action'}
                                                        onChange={() => toggleColumn(column.id)}
                                                    />
                                                    <span>{column.title}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="column-selector-footer">
                                        <p>{showColumns.length} columns selected</p>
                                        <button
                                            className="apply-columns-btn"
                                            type="button"
                                            onClick={() => setShowColumnSelector(false)}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="table-scroll-wrapper-attributes-controls" ref={scrollerRef}>
                        <table className={`${isSidebarVisible ? `risk-control-attributes-table` : `risk-control-attributes-table-ws`}`}>
                            <thead className="risk-control-attributes-head">
                                <tr>
                                    {availableColumns.map(col => {
                                        if (!showColumns.includes(col.id)) return null;
                                        const isActiveFilter = activeExcelFilters[col.id];
                                        const isActiveSort = sortConfig.colId === col.id;

                                        return (
                                            <th
                                                key={col.id}
                                                style={{
                                                    width: columnWidths[col.id],
                                                    minWidth: columnSizeLimits[col.id]?.min,
                                                    maxWidth: columnSizeLimits[col.id]?.max,
                                                    cursor: "pointer",
                                                    position: "relative",
                                                    textAlign: "center",
                                                }}
                                                onClick={(e) => {
                                                    if (isResizingRef.current) return;
                                                    if (e.target.classList.contains('rca-col-resizer')) return;
                                                    if (col.id === 'nr') return;
                                                    openExcelFilterPopup(col.id, e);
                                                }}
                                            >
                                                <span>{col.title}</span>
                                                {(isActiveFilter || isActiveSort) && (
                                                    <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                                )}
                                                <div className="rca-col-resizer" onMouseDown={(e) => startColumnResize(e, col.id)} />
                                            </th>
                                        )
                                    })}
                                </tr>
                            </thead>
                            <tbody
                                ref={tbodyRef}
                                onPointerDown={onRowPointerDown}
                                onPointerMove={onRowPointerMove}
                                onPointerUp={endRowDrag}
                                onPointerCancel={endRowDrag}
                            >
                                {(() => {
                                    let hazardCount = 0; // Initialize counter outside map

                                    return processedRows.map((row, index) => {
                                        const spans = rowSpans[row._id];

                                        // Increment count only when a new hazard block starts
                                        if (spans?.hazard > 0) {
                                            hazardCount++;
                                        }

                                        return (
                                            <tr key={row._id} className="table-scroll-wrapper-attributes-controls">
                                                {/* Nr Column - Merged per Hazard */}
                                                {showColumns.includes("nr") && spans?.nr > 0 && (
                                                    <td
                                                        rowSpan={spans.nr}
                                                        className="procCent"
                                                        style={{ verticalAlign: 'middle', background: '#fff', borderRight: "1px solid #e0e0e0", borderLeft: "1px solid #e0e0e0" }}
                                                    >
                                                        {hazardCount}
                                                    </td>
                                                )}

                                                {/* Merged Hazard - Vertically Centered */}
                                                {showColumns.includes("hazard") && spans?.hazard > 0 && (
                                                    <td rowSpan={spans.hazard} style={{ verticalAlign: 'middle', background: '#fff', borderRight: "1px solid #e0e0e0", borderLeft: "1px solid #e0e0e0" }}>
                                                        {row.hazard}
                                                    </td>
                                                )}

                                                {/* Merged Unwanted Event - Vertically Centered */}
                                                {showColumns.includes("unwantedEvent") && spans?.unwantedEvent > 0 && (
                                                    <td rowSpan={spans.unwantedEvent} style={{ verticalAlign: 'middle', background: '#fff' }}>
                                                        {row.unwantedEvent}
                                                    </td>
                                                )}

                                                {/* Sub Task Steps (Never Merged) */}
                                                {showColumns.includes("subTaskStep") && (
                                                    <td style={{ borderLeft: "1px solid #e0e0e0" }}>
                                                        {row.subTaskStep}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Excel Filter Popup */}
            {excelFilter.open && (
                <div
                    className="excel-filter-popup"
                    ref={excelPopupRef}
                    style={{
                        position: "fixed",
                        top: excelFilter.pos.top,
                        left: excelFilter.pos.left,
                        width: excelFilter.pos.width,
                        zIndex: 9999,
                    }}
                    onWheel={(e) => e.stopPropagation()}
                >
                    <div className="excel-filter-sortbar">
                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId &&
                                sortConfig.direction === "asc" ? "active" : ""
                                }`}
                            onClick={() => toggleSort(excelFilter.colId, "asc")}
                        >
                            Sort Acsending
                        </button>

                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId &&
                                sortConfig.direction === "desc" ? "active" : ""
                                }`}
                            onClick={() => toggleSort(excelFilter.colId, "desc")}
                        >
                            Sort Descending
                        </button>
                    </div>

                    <input
                        type="text"
                        className="excel-filter-search"
                        placeholder="Search"
                        value={excelSearch}
                        onChange={(e) => setExcelSearch(e.target.value)}
                    />

                    {(() => {
                        const colId = excelFilter.colId;

                        const allValues = Array.from(
                            new Set((rows || []).flatMap((r, i) => getFilterValuesForCell(r, colId, i)))
                        ).sort((a, b) => String(a).localeCompare(String(b)));

                        const visibleValues = allValues.filter(v =>
                            String(v).toLowerCase().includes(excelSearch.toLowerCase())
                        );

                        const allSelected =
                            allValues.length > 0 && allValues.every(v => excelSelected.has(v));

                        const toggleAll = (checked) => {
                            setExcelSelected(() => {
                                if (checked) return new Set(allValues); // select everything
                                return new Set();                      // clear everything
                            });
                        };

                        const toggleValue = (v) => {
                            setExcelSelected(prev => {
                                const next = new Set(prev);
                                if (next.has(v)) next.delete(v);
                                else next.add(v);
                                return next;
                            });
                        };

                        const onOk = () => {
                            const selectedArr = Array.from(excelSelected);
                            const isAllSelected = allValues.length > 0 && allValues.every(v => excelSelected.has(v));

                            setActiveExcelFilters(prev => {
                                const next = { ...prev };
                                if (isAllSelected) delete next[colId];
                                else next[colId] = selectedArr;
                                return next;
                            });

                            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
                        };

                        const onCancel = () => {
                            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
                        };

                        return (
                            <>
                                <div className="excel-filter-list">
                                    <label className="excel-filter-item">
                                        <span className="excel-filter-checkbox">
                                            <input
                                                type="checkbox"
                                                className="checkbox-excel-attend"
                                                checked={allSelected}
                                                onChange={(e) => toggleAll(e.target.checked)}
                                            />
                                        </span>
                                        <span className="excel-filter-text">(Select All)</span>
                                    </label>

                                    {visibleValues.map(v => (
                                        <label className="excel-filter-item" key={String(v)}>
                                            <span className="excel-filter-checkbox">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox-excel-attend"
                                                    checked={excelSelected.has(v)}
                                                    onChange={() => toggleValue(v)}
                                                />
                                            </span>
                                            <span className="excel-filter-text">{v}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="excel-filter-actions">
                                    <button type="button" className="excel-filter-btn" onClick={onOk}>Apply</button>
                                    <button type="button" className="excel-filter-btn-cnc" onClick={onCancel}>Cancel</button>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}

            <ToastContainer />
        </div>
    );
};

export default JRAAttributes;