import React, { useState, useEffect, useRef, useMemo } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsUpDown, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faSearch, faTrash, faArrowUpRightFromSquare, faPlusCircle, faDatabase, faDownload, faTableColumns, faTimes, faFilter, faArrowsLeftRight, faArrowRotateBack, faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import "./ControlAnalysisTable.css";
import { v4 as uuidv4 } from "uuid";
import ControlEAPopup from "./ControlEAPopup";
import { saveAs } from "file-saver";
import DeleteControlPopup from "./RiskComponents/DeleteControlPopup";

const ControlAnalysisTable = ({ rows, updateRows, ibra, addRow, removeRow, updateRow, error, title, onControlRename, isSidebarVisible, readOnly = false }) => {
    const [insertPopup, setInsertPopup] = useState();
    const [selectedRowData, setSelectedRowData] = useState();
    const ceaSavedWidthRef = useRef(null);
    const caeBoxRef = useRef(null);
    const ceaTableWrapperRef = useRef(null);
    const [armedDragRow, setArmedDragRow] = useState(null);
    const [draggedRowIndex, setDraggedRowIndex] = useState(null);
    const [dragOverRowIndex, setDragOverRowIndex] = useState(null);
    const [deletePopupVisible, setDeletePopupVisible] = useState(false);
    const [controlToDelete, setControlToDelete] = useState(null);
    const [filters, setFilters] = useState({});
    const [filterPopup, setFilterPopup] = useState({
        visible: false,
        column: null,
        pos: { top: 0, left: 0, width: 0 }
    });

    const availableColumns = [
        { id: "nr", title: "Nr", className: "control-analysis-nr", icon: null },
        { id: "control", title: "Control Name", className: "control-analysis-control", icon: null },
        { id: "description", title: "Control Description", className: "control-analysis-control", icon: null },
        { id: "performance", title: "Performance Requirements & Verifications", className: "control-analysis-control", icon: null },
        { id: "critical", title: "Critical Control", className: "control-analysis-critcal", icon: null },
        { id: "act", title: "Act, Object or System", className: "control-analysis-act", icon: null },
        { id: "activation", title: "Control Activation (Pre or Post Unwanted Event)", className: "control-analysis-activation", icon: null },
        { id: "hierarchy", title: "Hierarchy of Controls", className: "control-analysis-hiearchy", icon: null },
        { id: "quality", title: "Quality (%)", className: "control-analysis-quality", icon: null },
        { id: "cer", title: "Control Effectiveness Rating (CER)", className: "control-analysis-cer", icon: null },
        { id: "cons", title: "Specific Consequence Addressed", className: "control-analysis-cons", icon: null },
        { id: "notes", title: "Notes Regarding the Control", className: "control-analysis-notes", icon: null },
        { id: "action", title: "Control Improvement/ Action", className: "control-analysis-action", icon: null },
        { id: "responsible", title: "Responsible Person", className: "control-analysis-responsible", icon: null },
        { id: "dueDate", title: "Due Date", className: "control-analysis-date", icon: null },
        ...(!readOnly
            ? [{ id: "actions", title: "Action", className: "control-analysis-nr", icon: null }] : []),
    ];

    const initialColumnWidths = {
        nr: 55,
        control: 500,
        description: 500,
        performance: 500,
        critical: 75,
        act: 75,
        activation: 120,
        hierarchy: 120,
        cons: 100,
        quality: 75,
        cer: 120,
        action: 350,
        responsible: 150,
        dueDate: 100,
        notes: 400,
        actions: 80
    };

    const [columnWidths, setColumnWidths] = useState(initialColumnWidths);
    const columnSizeLimits = {
        nr: { min: 40, max: 120 },
        control: { min: 200, max: 900 },
        description: { min: 200, max: 900 },
        performance: { min: 200, max: 900 },
        critical: { min: 60, max: 150 },
        act: { min: 60, max: 250 },
        activation: { min: 100, max: 300 },
        hierarchy: { min: 100, max: 300 },
        cons: { min: 80, max: 250 },
        quality: { min: 60, max: 160 },
        cer: { min: 80, max: 200 },
        action: { min: 200, max: 600 },
        responsible: { min: 100, max: 250 },
        dueDate: { min: 80, max: 200 },
        notes: { min: 250, max: 700 },
        actions: { min: 60, max: 150 }
    };

    const resizingColRef = useRef(null);
    const resizeStartXRef = useRef(0);
    const resizeStartWidthRef = useRef(0);
    const isResizingRef = useRef(false);

    const [tableWidth, setTableWidth] = useState(null);
    const [wrapperWidth, setWrapperWidth] = useState(0);
    const [hasFittedOnce, setHasFittedOnce] = useState(false);
    const widthsInitializedRef = useRef(false);

    const openDeletePopup = (id, controlName) => {
        setControlToDelete({ id, controlName });
        setDeletePopupVisible(true);
    };

    const closeDeletePopup = () => {
        setControlToDelete(null);
        setDeletePopupVisible(false);
    };

    const confirmDeleteControl = () => {
        if (controlToDelete) removeRow(controlToDelete.id);
        closeDeletePopup();
    };

    const handleDragStart = (e, rowIndex) => {
        setDraggedRowIndex(rowIndex);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", "");
    };

    const handleDragOver = (e, rowIndex) => {
        e.preventDefault();
        setDragOverRowIndex(rowIndex);
    };

    const handleDragLeave = () => {
        setDragOverRowIndex(null);
    };

    const handleDrop = (e, dropRowIndex) => {
        e.preventDefault();
        if (
            draggedRowIndex === null ||
            draggedRowIndex === dropRowIndex
        ) {
            return;
        }
        const newRows = [...rows];
        const [moved] = newRows.splice(draggedRowIndex, 1);
        newRows.splice(dropRowIndex, 0, moved);
        // renumber
        newRows.forEach((r, i) => (r.nr = i + 1));
        updateRow(newRows);
        // clear state
        setDraggedRowIndex(null);
        setDragOverRowIndex(null);
        setArmedDragRow(null);
    };

    const handleDragEnd = () => {
        // all styling is via CSS classes, so just clear state
        setDraggedRowIndex(null);
        setDragOverRowIndex(null);
        setArmedDragRow(null);
    };

    useEffect(() => {
        const wrapper = ceaTableWrapperRef.current;
        if (!wrapper) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        const mouseDownHandler = (e) => {
            if (
                e.target.closest('input, textarea, select, button') ||
                e.target.closest('.drag-handle') ||
                e.target.closest('.ibra-col-resizer') // ← NEW
            ) {
                return;
            }
            isDown = true;
            wrapper.classList.add('grabbing');
            startX = e.pageX - wrapper.offsetLeft;
            scrollLeft = wrapper.scrollLeft;
        };

        const mouseLeaveHandler = () => {
            isDown = false;
            wrapper.classList.remove('grabbing');
        };

        const mouseUpHandler = () => {
            isDown = false;
            wrapper.classList.remove('grabbing');
        };

        const mouseMoveHandler = (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - wrapper.offsetLeft;
            const walk = (x - startX) * 1.5;
            wrapper.scrollLeft = scrollLeft - walk;
        };

        wrapper.addEventListener('mousedown', mouseDownHandler);
        wrapper.addEventListener('mouseleave', mouseLeaveHandler);
        wrapper.addEventListener('mouseup', mouseUpHandler);
        wrapper.addEventListener('mousemove', mouseMoveHandler);

        return () => {
            wrapper.removeEventListener('mousedown', mouseDownHandler);
            wrapper.removeEventListener('mouseleave', mouseLeaveHandler);
            wrapper.removeEventListener('mouseup', mouseUpHandler);
            wrapper.removeEventListener('mousemove', mouseMoveHandler);
        };
    }, []);

    useEffect(() => {
        const adjust = () => {
            if (!caeBoxRef.current || !ceaTableWrapperRef.current) return;
            const boxW = caeBoxRef.current.offsetWidth;
            const w = boxW - 60;
            ceaTableWrapperRef.current.style.width = `${w}px`;
            setWrapperWidth(ceaTableWrapperRef.current.getBoundingClientRect().width);
        };
        window.addEventListener('resize', adjust);
        adjust();
        return () => window.removeEventListener('resize', adjust);
    }, []);

    useEffect(() => {
        const wrapper = ceaTableWrapperRef.current;
        if (!wrapper) return;

        if (!isSidebarVisible) {
            ceaSavedWidthRef.current = wrapper.offsetWidth;
        } else if (ceaSavedWidthRef.current != null) {
            wrapper.style.width = `${ceaSavedWidthRef.current}px`;
            setWrapperWidth(wrapper.getBoundingClientRect().width); // ← NEW
            return;
        }
        const boxW = caeBoxRef.current.offsetWidth;
        wrapper.style.width = `${boxW - 30}px`;
        setWrapperWidth(wrapper.getBoundingClientRect().width); // ← NEW
    }, [isSidebarVisible]);

    const [showColumns, setShowColumns] = useState([
        "nr", "control", "critical", "act", "activation", "hierarchy", "cons", "quality", "cer", "notes", ...(readOnly ? [] : ["actions"])
    ]);

    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const getDisplayColumns = () => {
        const raw = availableColumns
            .map(c => c.id)
            .filter(id => showColumns.includes(id));

        const expanded = [];
        raw.forEach(id => expanded.push(id));

        while (expanded.length < 5) expanded.push(`blank-${expanded.length}`);

        // only force-add actions when not readOnly
        if (!readOnly && !expanded.includes("actions")) {
            expanded.push("actions");
        }
        return expanded;
    };

    const ceaPopupRef = useRef(null);

    const toggleColumn = (columnId) => {
        setShowColumns(prev => {
            if (prev.includes(columnId)) {
                if (columnId === 'actions' || columnId === 'nr') return prev;
                return prev.filter(id => id !== columnId);
            } else {
                const actionIndex = prev.indexOf('actions');
                if (actionIndex !== -1) {
                    return [...prev.slice(0, actionIndex), columnId, ...prev.slice(actionIndex)];
                } else {
                    return [...prev, columnId];
                }
            }
        });
    };

    const toggleAllColumns = (selectAll) => {
        if (selectAll) {
            const allColumns = availableColumns
                .map(col => col.id)
                .filter(id => id !== 'actions');
            setShowColumns([...allColumns, 'actions']);
        } else {
            setShowColumns(['nr', 'actions']);
        }
    };

    const areAllColumnsSelected = () => {
        const selectableColumns = availableColumns
            .filter(col => col.id !== 'actions')
            .map(col => col.id);

        return selectableColumns.every(colId =>
            showColumns.includes(colId) || colId === 'nr'
        );
    };

    const displayColumns = getDisplayColumns();

    // One-time initial fit so the table starts at wrapper width
    useEffect(() => {
        if (widthsInitializedRef.current) return;
        if (!ceaTableWrapperRef.current) return;

        const wrapperEl = ceaTableWrapperRef.current;
        const wWidth = wrapperEl.clientWidth;
        if (!wWidth) return;

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
    }, [displayColumns, columnWidths]);

    const insertRowAt = (insertIndex) => {
        const newRows = [...rows];

        const newRow = {
            id: uuidv4(), nr: 0, control: "", critical: "", act: "", activation: "", hierarchy: "", cons: "", quality: "", cer: "", notes: "", dueDate: "", responsible: "", action: ""
        }

        newRows.splice(insertIndex, 0, newRow);
        newRows.forEach((r, i) => {
            r.nr = i + 1;
        });

        updateRow(newRows);
    };

    const closeInsertPopup = () => {
        setInsertPopup(false);
    }

    const handleDownload = async () => {
        const dataToStore = rows;

        const documentName = title + ` Control Effectiveness Analysis Table`;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/generateExcels/generate-xlsx-cea`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            const blob = await response.blob();
            saveAs(blob, `${documentName}.xlsx`);
            //saveAs(blob, `${documentName}.pdf`);
        } catch (error) {
            console.error("Error generating document:", error);
        }
    };

    const getClass = (type) => {
        switch (type) {
            case "Very Effective":
                return 'cea-table-page-input-green';
            case "Could Improve":
                return 'cea-table-page-input-yellow';
            case "Not Effective":
                return 'cea-table-page-input-red';
            default:
                return ''; // Or some fallback class
        }
    }

    const filteredRows = useMemo(() => {
        // Start with a copy of the base rows
        let currentRows = [...rows];

        // 1. Apply Filtering
        currentRows = currentRows.filter(row => {
            for (const [col, value] of Object.entries(filters)) {
                const text = value.toLowerCase();
                if (col === 'control' || col === 'critical' || col === 'act' ||
                    col === 'activation' || col === 'hierarchy' || col === 'cons' ||
                    col === 'notes' || col === 'dueDate' || col === 'responsible' || col === 'action') {
                    if (!String(row[col] ?? '').toLowerCase().includes(text)) return false;
                } else if (col === 'quality' || col === 'cer') {
                    if (!String(row[col]).toLowerCase().includes(text)) return false;
                }
            }
            return true;
        });

        // 2. Apply Sorting (from existing getSortedRows logic)
        currentRows.sort((a, b) => {
            const controlA = a.control.toUpperCase();
            const controlB = b.control.toUpperCase();

            if (controlA < controlB) return -1;
            if (controlA > controlB) return 1;
            return 0;
        });

        // 3. Renumber
        currentRows.forEach((r, i) => (r.nr = i + 1));

        return currentRows;
    }, [rows, filters]);

    const getSortedRows = () => {
        // Create a copy of the rows array
        const sortedRows = [...rows];

        // Sort the array by the 'control' property (case-insensitive)
        sortedRows.sort((a, b) => {
            const controlA = a.control.toUpperCase();
            const controlB = b.control.toUpperCase();

            if (controlA < controlB) {
                return -1;
            }
            if (controlA > controlB) {
                return 1;
            }
            return 0; // names must be equal
        });

        // Re-number the 'nr' field after sorting
        sortedRows.forEach((r, i) => (r.nr = i + 1));

        return sortedRows;
    };

    // Calculate the rows to display: always the sorted version
    const rowsToDisplay = filteredRows;

    function openFilterPopup(colId, e) {
        if (colId === "nr" || colId === "actions") return; // Don't filter Nr or Action columns
        const rect = e.target.closest('th').getBoundingClientRect(); // Find the <th> to get correct position
        setFilterPopup({
            visible: true,
            column: colId,
            pos: {
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width
            }
        });
    }

    // NEW: Apply the filter
    function applyFilter(value) {
        setFilters(prev => ({
            ...prev,
            [filterPopup.column]: value
        }));
        setFilterPopup({ visible: false, column: null, pos: {} });
    }

    // NEW: Clear the filter
    function clearFilter() {
        setFilters(prev => {
            const next = { ...prev };
            delete next[filterPopup.column];
            return next;
        });
        setFilterPopup({ visible: false, column: null, pos: {} });
    }

    useEffect(() => {
        const popupSelector = '.column-selector-popup';
        const filterSelector = '.jra-filter-popup';

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest(filterSelector) &&
                !e.target.closest('input');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(popupSelector) || e.target.closest(filterSelector);
            if (!isInsidePopup) {
                closeDropdowns();
            }

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };

        const closeDropdowns = () => {
            setShowColumnSelector(null);
            setFilterPopup({ visible: false, column: null, pos: {} });
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showColumnSelector, filterPopup.visible]);

    const startColumnResize = (e, columnId) => {
        e.preventDefault();
        e.stopPropagation();

        isResizingRef.current = true;

        resizingColRef.current = columnId;
        resizeStartXRef.current = e.clientX;

        const th = e.target.closest('th');
        const currentWidth =
            columnWidths[columnId] ??
            (th ? th.getBoundingClientRect().width : 150);

        resizeStartWidthRef.current = currentWidth;

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
            const oldWidth = prev[colId] ?? newWidth;
            const updated = { ...prev, [colId]: newWidth };

            // Table width grows/shrinks only by the change of this column
            setTableWidth(current => {
                if (current == null && ceaTableWrapperRef.current) {
                    return ceaTableWrapperRef.current.clientWidth + (newWidth - oldWidth);
                }
                return (current ?? 0) + (newWidth - oldWidth);
            });

            return updated;
        });
    };

    const stopColumnResize = () => {
        document.removeEventListener('mousemove', handleColumnResizeMove);
        document.removeEventListener('mouseup', stopColumnResize);

        setTimeout(() => {
            isResizingRef.current = false;
        }, 0);

        resizingColRef.current = null;
    };

    const fitTableToWidth = () => {
        const wrapper = ceaTableWrapperRef.current;
        if (!wrapper) return;

        const wWidth = wrapper.getBoundingClientRect().width;
        if (!wWidth) return;

        const visibleCols = getDisplayColumns().filter(
            id => typeof columnWidths[id] === "number"
        );
        if (!visibleCols.length) return;

        const prevWidths = visibleCols.map(id => columnWidths[id]);
        const totalWidth = prevWidths.reduce((a, b) => a + b, 0);
        if (!totalWidth) return;

        // Only grow when table is narrower than the wrapper
        if (totalWidth >= wWidth) {
            setTableWidth(totalWidth);
            setWrapperWidth(wWidth);
            setHasFittedOnce(true);
            return;
        }

        const scale = wWidth / totalWidth;
        let newWidths = prevWidths.map(w => w * scale);

        newWidths = newWidths.map(w => Math.round(w));

        let diff = wWidth - newWidths.reduce((s, w) => s + w, 0);
        let i = 0;
        while (diff !== 0 && i < newWidths.length * 2) {
            newWidths[i % newWidths.length] += diff > 0 ? 1 : -1;
            diff = wWidth - newWidths.reduce((s, w) => s + w, 0);
            i++;
        }

        setColumnWidths(prev => {
            const updated = { ...prev };
            visibleCols.forEach((id, index) => {
                updated[id] = newWidths[index];
            });
            return updated;
        });

        setWrapperWidth(wWidth);
        setTableWidth(wWidth);
        setHasFittedOnce(true);
    };

    const getDefaultShowColumns = () => [
        "nr",
        "control",
        "critical",
        "act",
        "activation",
        "hierarchy",
        "cons",
        "quality",
        "cer",
        "notes",
        ...(readOnly ? [] : ["actions"]),
    ];

    const resetTable = (visibleColumnIds) => {
        const wrapper = ceaTableWrapperRef.current;
        if (!wrapper) return;

        const wWidth = wrapper.getBoundingClientRect().width;
        if (!wWidth) return;

        const visibleCols = (visibleColumnIds || getDisplayColumns()).filter(
            id => typeof initialColumnWidths[id] === "number"
        );
        if (!visibleCols.length) return;

        const prevWidths = visibleCols.map(id => initialColumnWidths[id]);
        const totalWidth = prevWidths.reduce((a, b) => a + b, 0);
        if (!totalWidth) return;

        const scale = wWidth / totalWidth;
        let newWidths = prevWidths.map(w => w * scale);
        newWidths = newWidths.map(w => Math.round(w));

        let diff = wWidth - newWidths.reduce((s, w) => s + w, 0);
        let i = 0;
        while (diff !== 0 && i < newWidths.length * 2) {
            newWidths[i % newWidths.length] += diff > 0 ? 1 : -1;
            diff = wWidth - newWidths.reduce((s, w) => s + w, 0);
            i++;
        }

        setColumnWidths(prev => {
            const updated = { ...prev };
            visibleCols.forEach((id, index) => {
                updated[id] = newWidths[index];
            });
            return updated;
        });

        setWrapperWidth(wWidth);
        setTableWidth(wWidth);
        setHasFittedOnce(true);
    };

    const resetToDefaultColumnsAndFit = () => {
        const defaults = getDefaultShowColumns();
        setShowColumns(defaults);
        setShowColumnSelector(false);
        resetTable(defaults);
    };

    const isUsingDefaultColumns = useMemo(() => {
        const defaults = getDefaultShowColumns();
        if (showColumns.length !== defaults.length) return false;
        return defaults.every((id, idx) => showColumns[idx] === id);
    }, [showColumns, readOnly]);

    const isTableFitted =
        hasFittedOnce &&
        wrapperWidth > 0 &&
        tableWidth != null &&
        Math.abs(tableWidth - wrapperWidth) <= 1;

    // Show "Fit" when table is narrower than the wrapper
    const showFitButton =
        hasFittedOnce &&
        wrapperWidth > 0 &&
        tableWidth != null &&
        tableWidth < wrapperWidth - 1;

    // Show "Reset" when:
    //  - columns != default OR
    //  - width no longer matches wrapper (e.g. user dragged a column)
    const showResetButton =
        hasFittedOnce &&
        (!isUsingDefaultColumns || !isTableFitted);

    return (
        <div className="input-row-risk-create">
            <div className={`input-box-attendance ${error ? "error-create" : ""}`} ref={caeBoxRef}>
                <h3 className="font-fam-labels">
                    Control Effectiveness Analysis (CEA)
                </h3>

                <div className="control-analysis-labels">
                    <label className="control-analysis-label">Only the controls identified in the Risk Assessment are included in the table below.</label>
                    <label className="control-analysis-label">The Facilitator and Risk Assessment Team may update control attributes where deemed necessary.</label>
                    <label className="control-analysis-label">Open the popup  {<FontAwesomeIcon icon={faArrowUpRightFromSquare} />}  to edit or view more information regarding a control and its attributes.
                    </label>
                </div>

                <button
                    className="top-right-button-ar"
                    title="Show / Hide Columns"
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                >
                    <FontAwesomeIcon icon={faTableColumns} className="icon-um-search" />
                </button>

                {showColumnSelector && (
                    <div className="column-selector-popup" ref={ceaPopupRef}>
                        <div className="column-selector-header">
                            <h4>Select Columns</h4>
                            <button
                                className="close-popup-btn"
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

                            <div className="column-checkbox-container">
                                {availableColumns.map(column => (
                                    <div className="column-checkbox-item" key={column.id}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={showColumns.includes(column.id)}
                                                disabled={column.id === 'actions' || column.id === 'nr'}
                                                onChange={() => toggleColumn(column.id)}
                                            />
                                            <span>{column.title}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div className="column-selector-footer">
                                <p>{showColumns.length - 1} columns selected</p>
                                <button
                                    className="apply-columns-btn"
                                    onClick={() => setShowColumnSelector(false)}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    className="top-right-button-ar-2"
                    title="Download CEA Table"
                >
                    <FontAwesomeIcon icon={faDownload} className="icon-um-search" onClick={handleDownload} />
                </button>

                {showFitButton && (
                    <button
                        className="top-right-button-ibra3"
                        title="Fit To Width"
                        onClick={fitTableToWidth}
                    >
                        <FontAwesomeIcon icon={faArrowsLeftRight} className="icon-um-search" />
                    </button>
                )}

                {showResetButton && (
                    <button
                        className={showFitButton ? "top-right-button-ibra4" : "top-right-button-ibra3"}
                        title="Reset to Default"
                        onClick={resetToDefaultColumnsAndFit}
                    >
                        <FontAwesomeIcon icon={faArrowsRotate} className="icon-um-search" />
                    </button>
                )}
                <div className="table-wrapper-cea" ref={ceaTableWrapperRef}>
                    <table className="table-borders-ibra-table" >
                        <thead className="control-analysis-head">
                            <tr>
                                {displayColumns.map((columnId, idx) => {
                                    const col = availableColumns.find(c => c.id === columnId);
                                    if (col) {
                                        const isFilterable = columnId !== "nr" && columnId !== "actions";
                                        const width = columnWidths[columnId];

                                        return (
                                            <th
                                                key={idx}
                                                className={`${col.className} ${isFilterable && filters[columnId] ? 'jra-filter-active' : ''}`}
                                                rowSpan={1}
                                                onClick={
                                                    isFilterable && !isResizingRef.current
                                                        ? (e) => openFilterPopup(columnId, e)
                                                        : undefined
                                                }
                                                style={{
                                                    cursor: isFilterable ? "pointer" : "default",
                                                    width: width ? `${width}px` : undefined,
                                                    position: "relative"
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "10px"
                                                    }}
                                                >
                                                    {col.icon ? <FontAwesomeIcon icon={col.icon} /> : col.title}
                                                    {isFilterable && filters[columnId] && (
                                                        <FontAwesomeIcon
                                                            icon={faFilter}
                                                            className="active-filter-icon"
                                                        />
                                                    )}
                                                </div>

                                                {/* resize handle – skip for blanks */}
                                                {columnId !== "nr" && columnId !== "actions" && (
                                                    <div
                                                        className="ibra-col-resizer"
                                                        onMouseDown={(e) => startColumnResize(e, columnId)}
                                                    />
                                                )}
                                            </th>
                                        );
                                    }
                                    return (
                                        <th key={idx} className="ibraCent ibraBlank" rowSpan={2} />
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {rowsToDisplay.map((row, rowIndex) => (
                                <tr
                                    key={row.id}
                                    className={`${row.nr % 2 === 0 ? 'evenTRColour' : ''} ${dragOverRowIndex === rowIndex ? 'drag-over' : ''}`}
                                    draggable={armedDragRow === rowIndex}
                                    onDragStart={armedDragRow === rowIndex ? (e) => handleDragStart(e, rowIndex) : undefined}
                                    onDragOver={(e) => handleDragOver(e, rowIndex)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, rowIndex)}
                                    onDragEnd={armedDragRow === rowIndex ? handleDragEnd : undefined}
                                >
                                    {displayColumns.map((columnId, colIndex) => {
                                        // Find the column meta
                                        const colMeta = availableColumns.find(c => c.id === columnId);

                                        // Blank filler columns
                                        if (!colMeta) {
                                            return <td key={colIndex} className="ibraCent ibraBlank" />;
                                        }

                                        // Pull the raw cell value
                                        const value = row[columnId] ?? '';

                                        // Special‐case the "nr" column (number + popup icon)
                                        if (columnId === 'nr') {
                                            return (
                                                <td key={colIndex} className={colMeta.className} style={{ alignItems: 'center', gap: '0px' }}>
                                                    <span style={{ fontSize: '14px', fontWeight: "normal" }}>{rowIndex + 1}</span>
                                                    {!readOnly && (<FontAwesomeIcon
                                                        icon={faArrowsUpDown}
                                                        className="drag-handle"
                                                        title="Drag to reorder"
                                                        onMouseDown={() => setArmedDragRow(rowIndex)}
                                                        onMouseUp={() => setArmedDragRow(null)}
                                                        style={{ cursor: 'grab', marginRight: "2px", marginLeft: "4px" }}
                                                    />)}
                                                    <FontAwesomeIcon
                                                        icon={faArrowUpRightFromSquare}
                                                        style={{ fontSize: "14px", marginLeft: "2px", color: "black" }}
                                                        className="ue-popup-icon"
                                                        title="Evaluate Control"
                                                        onClick={() => {
                                                            setSelectedRowData(row);
                                                            setInsertPopup(true);
                                                        }}
                                                    />
                                                </td>
                                            );
                                        }

                                        // Special‐case the "action" column (remove button)
                                        if (columnId === 'actions') {
                                            return (
                                                <td key={colIndex} className={`${colMeta.className} action-cell`} style={{
                                                    width: columnWidths[columnId]
                                                        ? `${columnWidths[columnId]}px`
                                                        : undefined
                                                }}>
                                                    <button
                                                        className="remove-row-button font-fam"
                                                        title="Remove Row"
                                                        type="button"
                                                        onClick={() => openDeletePopup(row.id, row.control)}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </td>
                                            );
                                        }

                                        // For all other columns, apply any styling you need
                                        // e.g. 'critical' → highlight if "Yes", 'cer' → use getClass(...)
                                        let cellClass = '';
                                        if (columnId === 'critical' && value === 'Yes') {
                                            cellClass = 'cea-table-page-critical';
                                        } else if (columnId === 'cer') {
                                            cellClass = getClass(value);
                                        }

                                        // Center‐align certain columns
                                        const centerColumns = ['critical', 'act', 'quality', 'cer', "activation", "hierarchy", "cons", "responsible", "dueDate"];
                                        const textAlign = centerColumns.includes(columnId) ? 'center' : 'left';

                                        return (
                                            <td
                                                key={colIndex}
                                                className={cellClass}
                                                style={{
                                                    textAlign, fontSize: '14px',
                                                    width: columnWidths[columnId]
                                                        ? `${columnWidths[columnId]}px`
                                                        : undefined
                                                }}
                                            >
                                                {value}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filterPopup.visible && (
                    <div
                        className="jra-filter-popup" // Reuse the IBRA class
                        style={{
                            position: 'fixed',
                            top: filterPopup.pos.top,
                            left: filterPopup.pos.left - 10,
                            width: filterPopup.pos.width,
                            zIndex: 10000
                        }}
                    >
                        <input
                            className="jra-filter-input"
                            type="text"
                            placeholder="Filter..."
                            defaultValue={filters[filterPopup.column] || ''}
                            onKeyDown={e => {
                                if (e.key === 'Enter') applyFilter(e.target.value);
                            }}
                        />
                        <div className="jra-filter-buttons">
                            <button
                                type="button"
                                className="jra-filter-apply"
                                onClick={() => {
                                    // Note: This grabs the input value from the document, which is fine for a one-off popup.
                                    const val = document
                                        .querySelector('.jra-filter-input')
                                        .value;
                                    applyFilter(val);
                                }}
                            >
                                Apply
                            </button>
                            <button
                                type="button"
                                className="jra-filter-clear"
                                onClick={clearFilter}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {deletePopupVisible && (<DeleteControlPopup controlName={controlToDelete.controlName} deleteControl={confirmDeleteControl} closeModal={closeDeletePopup} />)}
            {insertPopup && (<ControlEAPopup data={selectedRowData} onClose={closeInsertPopup} onSave={updateRows} onControlRename={onControlRename} readOnly={readOnly} />)}
        </div>
    );
};

export default ControlAnalysisTable;