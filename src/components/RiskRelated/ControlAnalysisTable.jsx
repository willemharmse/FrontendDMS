import React, { useState, useEffect, useRef, useMemo } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsUpDown, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faSearch, faTrash, faArrowUpRightFromSquare, faPlusCircle, faDatabase, faDownload, faTableColumns, faTimes, faFilter, faArrowsLeftRight, faArrowRotateBack, faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import "./ControlAnalysisTable.css";
import { v4 as uuidv4 } from "uuid";
import ControlEAPopup from "./ControlEAPopup";
import { saveAs } from "file-saver";
import DeleteControlPopup from "./RiskComponents/DeleteControlPopup";
import {
    faChevronDown,
    faChevronUp
} from "@fortawesome/free-solid-svg-icons";

const ControlAnalysisTable = ({ collapsible = false, rows, updateRows, ibra, addRow, removeRow, updateRow, error, title, onControlRename, isSidebarVisible, readOnly = false, relevantControls, highlightedRows = [] }) => {
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;
    const [insertPopup, setInsertPopup] = useState();
    const [selectedRowData, setSelectedRowData] = useState();
    const ceaSavedWidthRef = useRef(null);
    const caeBoxRef = useRef(null);
    const excelPopupRef = useRef(null);
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
    const [showBlankFilterPopup, setShowBlankFilterPopup] = useState(false);
    const [blankFilterColumns, setBlankFilterColumns] = useState([]); // array of column ids

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
    };

    const BLANK = "(Blanks)";

    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        pos: { top: 0, left: 0, width: 0 }
    });

    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set()); // values checked in popup
    const [sortConfig, setSortConfig] = useState({ colId: null, direction: null });

    const availableColumns = [
        { id: "nr", title: "Nr", className: "control-analysis-nr", icon: null },
        { id: "category", title: "Category", className: "control-analysis-control", icon: null },
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

    const DEFAULT_SORT = { colId: null, direction: null };

    const initialColumnWidths = {
        nr: 55,
        category: 75,
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
        category: { min: 60, max: 150 },
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
    }, [isCollapsed]);

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
        const adjust = () => {
            const wrapper = ceaTableWrapperRef.current;
            const box = caeBoxRef.current;
            if (!wrapper || !box) return;

            // Reset width to allow container to shrink if needed
            wrapper.style.width = '10px';

            // Read parent width
            const boxW = box.clientWidth;

            // Set new width
            const newWidth = boxW - 30;
            wrapper.style.width = `${newWidth}px`;

            setWrapperWidth(newWidth);
        };

        // Adjust immediately
        adjust();

        // Adjust again after a short delay for sidebar transitions
        const timer = setTimeout(adjust, 350);
        return () => clearTimeout(timer);
    }, [isSidebarVisible, isCollapsed]);

    const [showColumns, setShowColumns] = useState([
        "nr", "category", "control", "critical", "act", "activation", "hierarchy", "cons", "quality", "cer", "notes", ...(readOnly ? [] : ["actions"])
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


    const getQualityClass = (value) => {
        if (value === null || value === undefined || value === '') return '';

        const text = String(value).trim();

        // Handle ranges such as "30-59%", "30 - 59%", or "60–90%"
        const rangeMatch = text.match(
            /^(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)\s*%?$/
        );

        if (rangeMatch) {
            const minimum = Number(rangeMatch[1]);
            const maximum = Number(rangeMatch[2]);

            if (maximum < 30) {
                return 'cea-table-page-quality-poor';
            }

            if (minimum >= 30 && maximum < 60) {
                return 'cea-table-page-quality-fair';
            }

            if (minimum >= 60 && maximum <= 90) {
                return 'cea-table-page-quality-good';
            }

            if (minimum > 90) {
                return 'cea-table-page-quality-excellent';
            }

            return '';
        }

        // Handle values such as "<30%", "> 30%", "75%", and ">90%"
        const valueMatch = text.match(
            /^(>=|<=|>|<)?\s*(-?\d+(?:\.\d+)?)\s*%?$/
        );

        if (!valueMatch) return '';

        const operator = valueMatch[1] || '';
        const numeric = Number(valueMatch[2]);

        if (operator === '<' || operator === '<=') {
            if (numeric <= 30) {
                return 'cea-table-page-quality-poor';
            }
        }

        if (operator === '>' || operator === '>=') {
            if (numeric >= 90) {
                return 'cea-table-page-quality-excellent';
            }

            if (numeric >= 60) {
                return 'cea-table-page-quality-good';
            }

            if (numeric >= 30) {
                return 'cea-table-page-quality-fair';
            }
        }

        if (numeric < 30) {
            return 'cea-table-page-quality-poor';
        }

        if (numeric < 60) {
            return 'cea-table-page-quality-fair';
        }

        if (numeric <= 90) {
            return 'cea-table-page-quality-good';
        }

        return 'cea-table-page-quality-excellent';
    };

    const filteredRows = useMemo(() => {
        // Start with a copy of the base rows
        let currentRows = [...rows];

        // 1. Apply Filtering
        currentRows = currentRows.filter(row => {
            for (const [col, filterVal] of Object.entries(filters)) {
                const selected = Array.isArray(filterVal) ? filterVal : filterVal?.selected;


                // if no filter, allow all
                if (!selected || !Array.isArray(selected)) continue;

                const raw = row?.[col];
                const s = raw == null ? "" : String(raw).trim();
                const v = s === "" ? BLANK : s;

                if (!selected.includes(v)) return false;
            }
            return true;
        });

        // 1b. Apply BLANK filters (OR logic across selected columns)
        if (blankFilterColumns.length > 0) {
            currentRows = currentRows.filter(row => {
                return blankFilterColumns.some(colId => {
                    const v = row?.[colId];

                    // treat null/undefined/""/"   " as blank
                    if (v == null) return true;
                    if (typeof v === "string") return v.trim() === "";
                    return String(v).trim() === "";
                });
            });
        }

        // 2. Apply Sorting (from existing getSortedRows logic)
        // 2. Apply Sorting (Excel-like A→Z / Z→A from the popup)
        const colId = sortConfig?.colId || "control";
        const dir = sortConfig?.direction === "desc" ? -1 : 1;

        const normalize = (raw) => {
            const s = raw == null ? "" : String(raw).trim();
            return s === "" ? BLANK : s;
        };

        const tryNumber = (v) => {
            const s = String(v).replace(/,/g, "").trim();
            if (!/^[-+]?\d*(?:\.\d+)?$/.test(s) || s === "" || s === "." || s === "+" || s === "-") return null;
            const n = Number(s);
            return Number.isFinite(n) ? n : null;
        };

        const tryDate = (v) => {
            if (colId !== "dueDate") return null;
            const t = Date.parse(String(v));
            return Number.isFinite(t) ? t : null;
        };

        currentRows.sort((a, b) => {
            // No column chosen via the Excel-style header popup yet ->
            // fall back to the original default order (General category
            // first, then category A-Z, then control name A-Z).
            if (!sortConfig?.colId) {
                const normalizeSimple = (v) => (v == null ? "" : String(v).trim());
                const normCat = (v) => normalizeSimple(v).toLowerCase();

                const aCat = normCat(a.category);
                const bCat = normCat(b.category);

                const aIsGeneral = aCat === "general";
                const bIsGeneral = bCat === "general";

                if (aIsGeneral && !bIsGeneral) return -1;
                if (!aIsGeneral && bIsGeneral) return 1;

                if (aCat !== bCat) {
                    return aCat.localeCompare(bCat);
                }

                const aControl = normalizeSimple(a.control).toLowerCase();
                const bControl = normalizeSimple(b.control).toLowerCase();

                return aControl.localeCompare(bControl);
            }

            // A column sort is active - compare that column's values,
            // trying date, then numeric, then falling back to
            // case-insensitive string comparison, and apply direction.
            const aRaw = a?.[colId];
            const bRaw = b?.[colId];

            const aDate = tryDate(aRaw);
            const bDate = tryDate(bRaw);
            if (aDate !== null && bDate !== null) {
                return (aDate - bDate) * dir;
            }

            const aNum = tryNumber(aRaw);
            const bNum = tryNumber(bRaw);
            if (aNum !== null && bNum !== null) {
                return (aNum - bNum) * dir;
            }

            const aStr = normalize(aRaw).toLowerCase();
            const bStr = normalize(bRaw).toLowerCase();
            return aStr.localeCompare(bStr) * dir;
        });

        // 3. Renumber
        currentRows.forEach((r, i) => (r.nr = i + 1));

        return currentRows;
    }, [rows, filters, blankFilterColumns, sortConfig]);

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

    const getFilterValuesForCell = (row, colId) => {
        const raw = row?.[colId];
        const s = raw == null ? "" : String(raw).trim();
        return s === "" ? [BLANK] : [s];
    };

    // --- NEW: Helper to get options filtered by OTHER columns ---
    const getAvailableOptions = (colId) => {
        let filtered = rows;

        for (const [filterColId, selectedValues] of Object.entries(filters)) {
            const selected = Array.isArray(selectedValues) ? selectedValues : selectedValues?.selected;
            if (!Array.isArray(selected)) continue;

            filtered = filtered.filter(row => {
                const cellValues = getFilterValuesForCell(row, filterColId);
                return cellValues.some(v => selected.includes(v));
            });
        }

        return Array.from(
            new Set(filtered.flatMap(r => getFilterValuesForCell(r, colId)))
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
    };

    function openExcelFilterPopup(colId, e) {
        if (colId === "nr" || colId === "actions") return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        // Build unique values from CURRENT rows (or filteredRows if you prefer Excel-like behavior)
        const values = Array.from(
            new Set((rows || []).map(r => {
                const raw = r?.[colId];
                const s = raw == null ? "" : String(raw).trim();
                return s === "" ? BLANK : s;
            }))
        ).sort((a, b) => a.localeCompare(b));

        // Preselect: if filter exists use it, else select all
        const existing = filters[colId];
        const initialSelected = new Set(existing && Array.isArray(existing) ? existing : values);

        setExcelSelected(initialSelected);
        setExcelSearch("");

        setExcelFilter({
            open: true,
            colId,
            anchorRect: rect, // ✅ add this
            pos: {
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: Math.max(220, rect.width),
            },
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
        const excelSelector = '.excel-filter-popup';

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest(filterSelector) &&
                !e.target.closest(excelSelector) &&
                !e.target.closest('input');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(popupSelector) || e.target.closest(filterSelector) || e.target.closest(excelSelector);
            if (!isInsidePopup) {
                closeDropdowns();
            }

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };

        const closeDropdowns = () => {
            setShowBlankFilterPopup(null);
            setShowColumnSelector(null);
            setExcelFilter({ open: false, colId: null, pos: { top: 0, left: 0, width: 0 } });
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
    }, [showColumnSelector, filterPopup.visible, excelFilter.open]);

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
        "category",
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

    const blankFilterableColumns = useMemo(() => {
        // show all “real” columns except nr/actions
        return availableColumns
            .map(c => c.id)
            .filter(id => id !== "nr" && id !== "actions");
    }, [availableColumns]);

    const toggleBlankFilterColumn = (colId) => {
        setBlankFilterColumns(prev =>
            prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
        );
    };

    const setAllBlankFilterColumns = (selectAll) => {
        setBlankFilterColumns(selectAll ? blankFilterableColumns : []);
    };

    const areAllBlankFiltersSelected = () =>
        blankFilterColumns.length > 0 &&
        blankFilterableColumns.every(id => blankFilterColumns.includes(id));

    const clearBlankFilters = () => setBlankFilterColumns([]);

    useEffect(() => {
        if (!excelFilter.open) return;
        if (!excelPopupRef.current) return;

        const popupEl = excelPopupRef.current;
        const popupRect = popupEl.getBoundingClientRect();

        const margin = 8;
        const viewportH = window.innerHeight;
        const viewportW = window.innerWidth;

        // Current fixed position (relative to viewport) is popupRect
        let newTop = excelFilter.pos.top;
        let newLeft = excelFilter.pos.left;

        // If bottom goes off-screen -> flip upwards using the anchor
        if (popupRect.bottom > viewportH - margin) {
            const anchor = excelFilter.anchorRect;
            if (anchor) {
                const popupHeight = popupRect.height;
                const desiredTop = anchor.top + window.scrollY - popupHeight - 4; // above header
                newTop = Math.max(window.scrollY + margin, desiredTop);
            }
        }

        // If right goes off-screen -> shift left
        if (popupRect.right > viewportW - margin) {
            const overflow = popupRect.right - (viewportW - margin);
            newLeft = Math.max(margin, newLeft - overflow);
        }

        // If left goes off-screen -> shift right
        if (popupRect.left < margin) {
            newLeft = margin;
        }

        // Only update if changed
        if (newTop !== excelFilter.pos.top || newLeft !== excelFilter.pos.left) {
            setExcelFilter(prev => ({
                ...prev,
                pos: { ...prev.pos, top: newTop, left: newLeft },
            }));
        }
    }, [excelFilter.open, excelFilter.pos.top, excelFilter.pos.left, excelFilter.anchorRect, excelSearch]);

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            // If clicking the SAME active sort → reset to default
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT;
            }

            // Otherwise apply the requested sort
            return { colId, direction };
        });
    };

    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const filterMenuTimerRef = useRef(null);

    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(filters).length > 0;
        // Assuming default sort is nr/asc. Change if your default differs.
        const hasSort = sortConfig.colId !== null || sortConfig.direction !== null;
        return hasColumnFilters || hasSort;
    }, [filters, sortConfig]);

    const openFilterMenu = (e) => {
        if (!hasActiveFilters) return;
        if (filterMenuTimerRef.current) clearTimeout(filterMenuTimerRef.current);
        const rect = e.currentTarget.getBoundingClientRect();
        setFilterMenu({ isOpen: true, anchorRect: rect });
    };

    const closeFilterMenuWithDelay = () => {
        filterMenuTimerRef.current = setTimeout(() => {
            setFilterMenu(prev => ({ ...prev, isOpen: false }));
        }, 200);
    };

    const cancelCloseFilterMenu = () => {
        if (filterMenuTimerRef.current) clearTimeout(filterMenuTimerRef.current);
    };

    const handleClearFilters = () => {
        setFilters({});
        setSortConfig({ colId: null, direction: null });
        setFilterMenu({ isOpen: false, anchorRect: null });
    };

    const getTopRightButtonClass = (slot) => {
        return slot === 1
            ? "top-right-button-ibra"
            : `top-right-button-ibra${slot}`;
    };

    let rightButtonSlot = 1;

    const collapseBtnClass = collapsible
        ? getTopRightButtonClass(rightButtonSlot++)
        : null;

    const columnBtnClass = getTopRightButtonClass(rightButtonSlot++);
    const downloadBtnClass = getTopRightButtonClass(rightButtonSlot++);

    const fitBtnClass = showFitButton
        ? getTopRightButtonClass(rightButtonSlot++)
        : null;

    const resetBtnClass = showResetButton
        ? getTopRightButtonClass(rightButtonSlot++)
        : null;

    const filterBtnClass = getTopRightButtonClass(rightButtonSlot++);

    return (
        <div className="input-row-risk-create">
            <div className={`input-box-attendance ${error ? "error-create" : ""}`} ref={caeBoxRef}>
                <h3 className="font-fam-labels">
                    Control Effectiveness Analysis (CEA)
                </h3>

                <button
                    className={columnBtnClass}
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
                    className={downloadBtnClass}
                    title="Download CEA Table"
                >
                    <FontAwesomeIcon icon={faDownload} className="icon-um-search" onClick={handleDownload} />
                </button>

                {showFitButton && (
                    <button
                        className={fitBtnClass}
                        title="Fit To Width"
                        onClick={fitTableToWidth}
                    >
                        <FontAwesomeIcon icon={faArrowsLeftRight} className="icon-um-search" />
                    </button>
                )}

                {showResetButton && (
                    <button
                        className={resetBtnClass}
                        title="Reset to Default"
                        onClick={resetToDefaultColumnsAndFit}
                    >
                        <FontAwesomeIcon icon={faArrowsRotate} className="icon-um-search" />
                    </button>
                )}

                <button
                    className={filterBtnClass}
                    title={hasActiveFilters ? "Filters Active (Double Click to Clear)" : "Table is filter enabled."}
                    style={{
                        cursor: hasActiveFilters ? "pointer" : "default",
                        color: hasActiveFilters ? "#002060" : "gray"
                    }}
                    onMouseEnter={(e) => {
                        if (hasActiveFilters) openFilterMenu(e);
                    }}
                    onMouseLeave={closeFilterMenuWithDelay}
                    onDoubleClick={handleClearFilters}
                >
                    <FontAwesomeIcon
                        icon={faFilter}
                        className="icon-um-search"
                        style={{ color: hasActiveFilters ? "#002060" : "inherit" }}
                    />
                </button>

                {collapsible && (<button
                    className={collapseBtnClass}
                    title={collapsed ? "Expand Section" : "Collapse Section"}
                    onClick={toggleCollapse}
                    style={{ color: "gray" }}
                    type="button"
                >
                    <FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} />
                </button>)}

                {(!isCollapsed) && (
                    <>
                        <div className="control-analysis-labels">
                            <label className="control-analysis-label">Only the controls identified in the Risk Assessment are included in the table below.</label>
                            <label className="control-analysis-label">The Facilitator and Risk Assessment Team may update control attributes where deemed necessary.</label>
                            <label className="control-analysis-label">Open the popup  {<FontAwesomeIcon icon={faArrowUpRightFromSquare} />}  to edit or view more information regarding a control and its attributes.
                            </label>
                        </div>

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
                                                        className={`${col.className} ${isFilterable && (filters[columnId] || sortConfig.colId === columnId) ? '' : ''}`}
                                                        rowSpan={1}
                                                        onClick={
                                                            isFilterable && !isResizingRef.current
                                                                ? (e) => openExcelFilterPopup(columnId, e)
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
                                                            {isFilterable && (filters[columnId] || sortConfig.colId === columnId) && (
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
                                            style={{
                                                backgroundColor: highlightedRows.includes(row.id) ? '#fff9c4' : undefined // Apply yellow if ID is in list
                                            }}
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
                                                    cellClass = '';
                                                } else if (columnId === 'cer') {
                                                    cellClass = getClass(value);
                                                } else if (columnId === 'quality') {
                                                    cellClass = getQualityClass(value);
                                                }

                                                // Center‐align certain columns
                                                const centerColumns = ['critical', 'act', 'quality', 'cer', "activation", "hierarchy", "cons", "responsible", "dueDate", "category"];
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
                    </>
                )}

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

                            const allValues = getAvailableOptions(colId);

                            const visibleValues = allValues.filter(v =>
                                String(v).toLowerCase().includes(excelSearch.toLowerCase())
                            );

                            const isAllVisibleSelected =
                                visibleValues.length > 0 && visibleValues.every(v => excelSelected.has(v));

                            const toggleAll = (checked) => {
                                setExcelSelected(prev => {
                                    const next = new Set(prev);
                                    if (checked) {
                                        visibleValues.forEach(v => next.add(v));
                                    } else {
                                        visibleValues.forEach(v => next.delete(v));
                                    }
                                    return next;
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
                                let finalSelection = new Set(excelSelected);
                                if (excelSearch.trim() !== "") {
                                    const visibleSet = new Set(visibleValues);
                                    finalSelection = new Set(
                                        Array.from(excelSelected).filter(v => visibleSet.has(v))
                                    );
                                }

                                const selectedArr = Array.from(finalSelection);
                                const isTotalReset = allValues.length > 0 &&
                                    allValues.length === selectedArr.length &&
                                    selectedArr.every(v => finalSelection.has(v));

                                setFilters(prev => {
                                    const next = { ...prev };
                                    if (isTotalReset) {
                                        delete next[colId];
                                    } else {
                                        next[colId] = selectedArr;
                                    }
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
                                                    checked={isAllVisibleSelected}
                                                    onChange={(e) => toggleAll(e.target.checked)}
                                                />
                                            </span>
                                            <span className="excel-filter-text">
                                                {excelSearch === "" ? "(Select All)" : "(Select All Search Results)"}
                                            </span>
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

                                        {visibleValues.length === 0 && (
                                            <div style={{ padding: "8px", color: "#888", fontStyle: "italic", fontSize: "12px" }}>
                                                No matches found
                                            </div>
                                        )}
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
            </div>
            {deletePopupVisible && (<DeleteControlPopup controlName={controlToDelete.controlName} deleteControl={confirmDeleteControl} closeModal={closeDeletePopup} />)}
            {insertPopup && (<ControlEAPopup data={selectedRowData} onClose={closeInsertPopup} onSave={updateRows} onControlRename={onControlRename} readOnly={readOnly} relevantControls={relevantControls}
                existingControlNames={(rows || [])
                    .map(r => String(r.control ?? "").trim())
                    .filter(Boolean)}
            />)}
        </div>
    );
};

export default ControlAnalysisTable;