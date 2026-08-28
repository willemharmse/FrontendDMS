import React, { useEffect, useState, useRef, useMemo, useLayoutEffect } from "react";
import './JRATable.css';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faArrowsUpDown, faCopy, faTableColumns, faTimes, faInfoCircle, faPlusCircle, faArrowUpRightFromSquare, faFilter, faArrowsLeftRight, faArrowsRotate, faFlag } from '@fortawesome/free-solid-svg-icons';
import HazardJRA from "./RiskInfo/HazardJRA";
import UnwantedEvent from "./RiskInfo/UnwantedEvent";
import TaskExecution from "./RiskInfo/TaskExecution";
import ControlExecution from "./RiskInfo/ControlExecution";
import CurrentControlsJRA from "./RiskInfo/CurrentControlsJRA";
import JRAPopup from "./JRAPopup";
import Go_Nogo from "./RiskInfo/Go_Nogo";

import {
    faChevronDown,
    faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import RiskAssessmentDeletePopup from "./RiskAssessmentDeletePopup";

const JRATable = ({ collapsible = false, formData, setFormData, isSidebarVisible, error, setErrors, readOnly = false }) => {
    const [rowData, setRowData] = useState([]);
    const [showJRAPopup, setShowJRAPopup] = useState(false);
    const ibraBoxRef = useRef(null);
    const tableWrapperRef = useRef(null);
    const [hoveredBody, setHoveredBody] = useState({ rowId: null, bodyIdx: null });
    const savedWidthRef = useRef(null);
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;
    const [rowPendingDelete, setRowPendingDelete] = useState(null);

    // Help Popups
    const [helpHazards, setHelpHazards] = useState(false);
    const [helpUnwantedEvents, setHelpUnwantedEvents] = useState(false);
    const [helpResponsible, setHelpResponsible] = useState(false);
    const [helpSub, setHelpSub] = useState(false);
    const [helpTaskExecution, setHelpTaskExecution] = useState(false);
    const [go_noGO, setGo_noGO] = useState(false);

    const syncGroups = useRef({});
    const [armedDragRow, setArmedDragRow] = useState(null);
    const [draggedRowId, setDraggedRowId] = useState(null);
    const [dragOverRowId, setDragOverRowId] = useState(null);
    const draggedElRef = useRef(null);
    const isResizingRef = useRef(false);
    const resizingColRef = useRef(null);
    const resizeStartXRef = useRef(0);
    const resizeStartWidthRef = useRef(0);
    const [wrapperWidth, setWrapperWidth] = useState(0);
    const [showFlagged, setShowFlagged] = useState(false);

    // --- Excel Filter State ---
    const excelPopupRef = useRef(null);
    const [filters, setFilters] = useState({});
    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const DEFAULT_SORT = { colId: "nr", direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);
    const initialOrderRef = useRef(new Map());
    const BLANK = "(Blanks)";

    const getBodyFilterValuesForCell = (body, colId) => {
        if (!body) return [BLANK];

        let targetArray = [];

        switch (colId) {
            case "hazards":
                targetArray = body.hazards?.map(h => h.hazard);
                break;
            case "UE":
                targetArray = body.UE?.map(u => u.ue);
                break;
            case "sub":
                targetArray = body.sub?.map(s => s.task);
                break;
            case "taskExecution":
                targetArray = body.taskExecution?.map(t => t.R);
                break;
            case "controls":
                targetArray = body.controls?.map(c => c.control);
                break;
            case "go":
                targetArray = body.go_noGo?.map(g => g.go);
                break;
            default:
                targetArray = [];
                break;
        }

        const values = (targetArray || [])
            .map(v => String(v ?? "").trim())
            .filter(Boolean);

        return values.length > 0 ? values : [BLANK];
    };

    const bodyMatchesFilters = (body, filters) => {
        for (const [colId, filterObj] of Object.entries(filters)) {
            const selected = Array.isArray(filterObj) ? filterObj : filterObj?.selected;
            if (!selected || !Array.isArray(selected)) continue;

            // root-level columns should not filter individual bodies
            if (colId === "nr" || colId === "main") continue;

            const cellValues = getBodyFilterValuesForCell(body, colId);
            const match = cellValues.some(v => selected.includes(v));
            if (!match) return false;
        }

        return true;
    };

    const requestRemoveRow = (row) => {
        setRowPendingDelete({
            kind: "row",
            rowId: row.id,
            type: "JRA"
        });
    };

    const requestRemoveBodyRow = (row, body) => {
        const removesWholeRow = row.jraBody.length === 1;

        setRowPendingDelete({
            kind: "body",
            rowId: row.id,
            bodyId: body.idBody,
            type: removesWholeRow ? "JRA" : "JRA Sub-step"
        });
    };

    const closeRemoveRowPopup = () => {
        setRowPendingDelete(null);
    };

    const confirmRemoveRow = () => {
        if (!rowPendingDelete) return;

        if (rowPendingDelete.kind === "body") {
            removeBodyRow(rowPendingDelete.rowId, rowPendingDelete.bodyId);
        } else {
            removeRow(rowPendingDelete.rowId);
        }

        setRowPendingDelete(null);
    };

    const getDefaultShowColumns = () => [
        "nr",
        "main",
        "hazards",
        "sub",
        "UE",
        "taskExecution",
        "controls",
        "go",
        ...(readOnly ? [] : ["action"]),
    ];

    const getDefaultColumnWidths = () => ({
        nr: 50,
        main: 220,
        hazards: 200,
        sub: 550,
        UE: 200,
        taskExecution: 200,
        controls: 550,
        go: 120,
        action: 50,
    });

    const [columnWidths, setColumnWidths] = useState({
        nr: 50,
        main: 220,
        hazards: 200,
        sub: 550,
        UE: 200,
        taskExecution: 200,
        controls: 550,
        go: 120,
        action: 50,
    });

    const columnSizeLimits = {
        nr: { min: 50, max: 50 },
        main: { min: 180, max: 600 },
        hazards: { min: 180, max: 600 },
        sub: { min: 350, max: 1200 },
        UE: { min: 150, max: 400 },
        taskExecution: { min: 180, max: 600 },
        controls: { min: 250, max: 900 },
        go: { min: 100, max: 200 },
        action: { min: 50, max: 50 },
    };

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
    };

    // --- Helper: Get Filter Values for a specific row/col ---
    const getFilterValuesForCell = (row, colId) => {
        if (!row) return [BLANK];

        // 1. Root level columns
        if (colId === "nr") return [String(row.nr)];
        if (colId === "main") return row.main ? [String(row.main).trim()] : [BLANK];

        // 2. Body level columns (Collect unique values across all bodies in this row)
        const values = new Set();
        if (row.jraBody && Array.isArray(row.jraBody)) {
            row.jraBody.forEach(body => {
                let targetArray = [];
                switch (colId) {
                    case "hazards": targetArray = body.hazards?.map(h => h.hazard); break;
                    case "UE": targetArray = body.UE?.map(u => u.ue); break;
                    case "sub": targetArray = body.sub?.map(s => s.task); break;
                    case "taskExecution": targetArray = body.taskExecution?.map(t => t.R); break;
                    case "controls": targetArray = body.controls?.map(c => c.control); break;
                    case "go": targetArray = body.go_noGo?.map(g => g.go); break;
                    default: break;
                }

                if (targetArray) {
                    targetArray.forEach(val => {
                        if (val != null && String(val).trim() !== "") {
                            values.add(String(val).trim());
                        }
                    });
                }
            });
        }

        const clean = Array.from(values);
        return clean.length > 0 ? clean : [BLANK];
    };

    // --- Initial Order for Reset Sort ---
    useEffect(() => {
        if (!formData.jra || formData.jra.length === 0) return;
        const map = initialOrderRef.current;
        const hasAll = formData.jra.every(r => map.has(r.id));
        if (hasAll) return;

        formData.jra.forEach((r, idx) => {
            if (!map.has(r.id)) map.set(r.id, map.size + idx);
        });
    }, [formData.jra]);

    // --- Toggle Sort ---
    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT;
            }
            return { colId, direction };
        });
    };

    // --- NEW: Helper to get options filtered by OTHER columns ---
    const getAvailableOptions = (colId) => {
        let filtered = formData.jra || [];

        for (const [filterColId, selectedValues] of Object.entries(filters)) {
            if (filterColId === colId) continue;

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

    // --- Open Filter Popup ---
    function openExcelFilterPopup(colId, e) {
        if (colId === "action") return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        // CHANGE: Use helper for context-aware values
        const values = getAvailableOptions(colId);

        const existing = filters?.[colId];
        // Handle both array and object formats
        const initialSelected = new Set(existing && Array.isArray(existing) ? existing : (existing?.selected || values));

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
    }

    // --- Handle Inner Scroll to prevent propagation ---
    const handleInnerScrollWheel = (e) => {
        const el = e.currentTarget;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const delta = e.deltaY;
        const goingDown = delta > 0;
        const atTop = scrollTop <= 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

        if ((goingDown && atBottom) || (!goingDown && atTop)) {
            e.preventDefault();
            e.stopPropagation();
            if (goingDown && atBottom) el.scrollTop = scrollHeight - clientHeight;
            else if (!goingDown && atTop) el.scrollTop = 0;
            return;
        }
    };

    // --- Adjust Popup Position ---
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
    }, [excelFilter.open, excelFilter.pos.top, excelFilter.pos.left, excelSearch]);


    const closeJRAPopup = () => {
        setShowJRAPopup(false);
        setRowData([]);
    };

    const openJRAPopup = (rowId) => {
        const fullRow = formData.jra.find(r => r.id === rowId);
        if (!fullRow) return;
        setRowData(fullRow);
        setShowJRAPopup(true);
    };

    function syncHeight(key) {
        const els = (syncGroups.current[key] || []).filter(
            el => el instanceof HTMLElement
        );
        if (!els.length) return;

        els.forEach(el => {
            el.style.height = 'auto';
        });

        const maxH = els.reduce(
            (m, el) => Math.max(m, el.scrollHeight),
            0
        );

        els.forEach(el => {
            el.style.height = `${maxH}px`;
        });
    }

    function handleUpdateJraRow(updatedRow) {
        if (readOnly) {
            closeJRAPopup();
            return;
        }

        setFormData(prev => ({
            ...prev,
            jra: prev.jra.map(r =>
                r.id === updatedRow.id ? updatedRow : r
            )
        }));
        closeJRAPopup();
        const rafId = window.requestAnimationFrame(() => {
            Object.keys(syncGroups.current).forEach(key => {
                syncHeight(key);
            });
        });

        return () => window.cancelAnimationFrame(rafId);
    }

    useLayoutEffect(() => {
        const rafId = window.requestAnimationFrame(() => {
            Object.keys(syncGroups.current).forEach(key => {
                syncHeight(key);
            });
        });

        return () => window.cancelAnimationFrame(rafId);
    }, [formData.jra, collapsed, sortConfig]);

    const handleDragStart = (e, rowId) => {
        const rows = Array.from(
            document.querySelectorAll(`tr[data-row-id="${rowId}"]`)
        );

        const dragTable = document.createElement('table');
        dragTable.style.position = 'absolute';
        dragTable.style.top = '-9999px';
        rows.forEach(r => dragTable.appendChild(r.cloneNode(true)));
        document.body.appendChild(dragTable);

        e.dataTransfer.setDragImage(dragTable, 0, 0);

        setTimeout(() => document.body.removeChild(dragTable), 0);

        setDraggedRowId(rowId);
        draggedElRef.current = e.currentTarget;
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragOver = (e, rowId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverRowId(rowId);

        const container = tableWrapperRef.current;
        const tr = e.target.closest('tr');

        if (container && tr) {
            const containerRect = container.getBoundingClientRect();
            const trRect = tr.getBoundingClientRect();

            // Get the sticky header height so we don't scroll the row underneath it
            const header = container.querySelector('thead');
            const headerHeight = header ? header.offsetHeight : 0;

            // Define the "Ceiling": The visual top of the scrollable area
            const stickyCeiling = containerRect.top + headerHeight;

            // Check if the top of the row is above the ceiling (hidden)
            if (trRect.top < stickyCeiling) {
                // Calculate EXACTLY how much is hidden
                const hiddenAmount = stickyCeiling - trRect.top;

                // Scroll up by that exact amount + a tiny 2px buffer for visibility
                container.scrollTop -= (hiddenAmount + 2);
            }
        }
    };

    const handleDragLeave = () => {
        setDragOverRowId(null);
    };

    const handleDrop = (e, dropRowId) => {
        e.preventDefault();
        if (!draggedRowId || draggedRowId === dropRowId) {
            setDraggedRowId(null);
            setDragOverRowId(null);
            setArmedDragRow(null);
            return;
        }
        setFormData(prev => {
            const newJra = [...prev.jra];
            const from = newJra.findIndex(r => r.id === draggedRowId);
            const to = newJra.findIndex(r => r.id === dropRowId);
            const [moved] = newJra.splice(from, 1);
            newJra.splice(to, 0, moved);
            newJra.forEach((r, i) => r.nr = i + 1);
            return { ...prev, jra: newJra };
        });
        setDraggedRowId(null);
        setDragOverRowId(null);
        setArmedDragRow(null);
    };

    const handleDragEnd = (e) => {
        if (draggedElRef.current) {
            draggedElRef.current.style.opacity = '';
            draggedElRef.current = null;
        }
        setDraggedRowId(null);
        setDragOverRowId(null);
        setArmedDragRow(null);
    };

    const handleDuplicateRow = (targetRowId) => {
        setFormData(prev => {
            // Find the actual index in the source data
            const rowIndex = prev.jra.findIndex(r => r.id === targetRowId);

            if (rowIndex === -1) return prev;

            const newJra = [...prev.jra];
            const rowCopy = JSON.parse(JSON.stringify(newJra[rowIndex]));

            // Assign new IDs
            rowCopy.id = uuidv4();
            rowCopy.jraBody = rowCopy.jraBody.map(body => ({
                ...body,
                idBody: uuidv4()
            }));

            newJra.splice(rowIndex + 1, 0, rowCopy);

            // Renumber
            newJra.forEach((r, idx) => { r.nr = idx + 1; });

            return { ...prev, jra: newJra };
        });
    };

    const openHazardsHelp = () => setHelpHazards(true);
    const openUnwantedEventsHelp = () => setHelpUnwantedEvents(true);
    const openResponsibleHelp = () => setHelpResponsible(true);
    const openSubHelp = () => setHelpSub(true);
    const openTaskExecutionHelp = () => setHelpTaskExecution(true);
    const openGo_noGo = () => setGo_noGO(true);

    const closeHazardsHelp = () => setHelpHazards(false);
    const closeUnwantedEventsHelp = () => setHelpUnwantedEvents(false);
    const closeResponsibleHelp = () => setHelpResponsible(false);
    const closeSubHelp = () => setHelpSub(false);
    const closeTaskExecutionHelp = () => setHelpTaskExecution(false);
    const closeGo_noGo = () => setGo_noGO(false);

    const filteredRows = useMemo(() => {
        let current = [...formData.jra];

        current = current
            .map(row => {
                const selectedBodies = Array.isArray(row.jraBody)
                    ? row.jraBody.filter(body => bodyMatchesFilters(body, filters))
                    : [];

                // apply root-level filters separately
                for (const [colId, filterObj] of Object.entries(filters)) {
                    const selected = Array.isArray(filterObj) ? filterObj : filterObj?.selected;
                    if (!selected || !Array.isArray(selected)) continue;

                    if (colId === "nr" || colId === "main") {
                        const cellValues = getFilterValuesForCell(row, colId);
                        const match = cellValues.some(v => selected.includes(v));
                        if (!match) {
                            return null;
                        }
                    }
                }

                if (showFlagged) {
                    const isRowFlagged = row.rowFlagged;
                    const hasFlaggedVisibleBody = selectedBodies.some(body =>
                        body.subStepFlagged ||
                        body.hazards?.some(h => h.flagged) ||
                        body.UE?.some(u => u.flagged)
                    );

                    if (!isRowFlagged && !hasFlaggedVisibleBody) {
                        return null;
                    }
                }

                if (selectedBodies.length === 0) return null;

                return {
                    ...row,
                    jraBody: selectedBodies
                };
            })
            .filter(Boolean);

        const colId = sortConfig?.colId || "nr";

        if (colId === "nr") {
            // Filtering must not reassign row numbers — each main row keeps
            // the nr it was actually given (see the real renumbering after
            // add/remove/reorder elsewhere in this file).
            return current;
        }

        const dir = sortConfig?.direction === "desc" ? -1 : 1;

        const normalize = (v) => {
            const s = v == null ? "" : String(v).trim();
            return s === "" ? BLANK : s;
        };

        const tryNumber = (v) => {
            const s = String(v).replace(/,/g, "").trim();
            if (!/^[-+]?\d*(?:\.\d+)?$/.test(s) || s === "" || s === "." || s === "+" || s === "-") return null;
            const n = Number(s);
            return Number.isFinite(n) ? n : null;
        };

        current.sort((a, b) => {
            const valsA = getFilterValuesForCell(a, colId);
            const valsB = getFilterValuesForCell(b, colId);

            const av = normalize(valsA[0]);
            const bv = normalize(valsB[0]);

            const aBlank = av === BLANK;
            const bBlank = bv === BLANK;

            if (aBlank && !bBlank) return 1;
            if (!aBlank && bBlank) return -1;

            const an = tryNumber(av);
            const bn = tryNumber(bv);

            if (an != null && bn != null) return (an - bn) * dir;

            return String(av).localeCompare(String(bv), undefined, {
                sensitivity: "base",
                numeric: true
            }) * dir;
        });

        return current;
    }, [formData.jra, filters, showFlagged, sortConfig]);

    const insertBodyRow = (rowId, insertAtIndex) => {
        setFormData(prev => {
            const newJra = prev.jra.map(item => {
                if (item.id !== rowId) return item;

                const newEntry = {
                    idBody: uuidv4(),
                    subStepFlagged: false,
                    hazards: [{ hazard: "", flagged: false }],
                    UE: [{ ue: "", flagged: false }],
                    sub: [{ task: "" }],
                    taskExecution: [{ R: "" }],
                    controls: [{ control: "" }],
                    go_noGo: [{ go: "" }],
                };

                const bodies = [
                    ...item.jraBody.slice(0, insertAtIndex),
                    newEntry,
                    ...item.jraBody.slice(insertAtIndex)
                ];
                return { ...item, jraBody: bodies };
            });
            return { ...prev, jra: newJra };
        });
    };

    const insertMainRow = (targetRowId) => {
        setFormData(prev => {
            // Find the actual index of this row in the source data
            const afterIndex = prev.jra.findIndex(r => r.id === targetRowId);

            // Safety check
            if (afterIndex === -1) return prev;

            const newEntry = {
                id: uuidv4(),
                nr: null, // will be recalculated
                main: "",
                rowFlagged: false,
                jraBody: [{
                    idBody: uuidv4(),
                    subStepFlagged: false,
                    hazards: [{ hazard: "Work Execution", flagged: false }],
                    UE: [{ ue: "Non-adherence to task step requirements / specifications", flagged: false }],
                    sub: [{ task: "" }],
                    taskExecution: [{ R: "" }],
                    controls: [{ control: "" }],
                    go_noGo: [{ go: "" }],
                }]
            };

            const newJra = [
                ...prev.jra.slice(0, afterIndex + 1),
                newEntry,
                ...prev.jra.slice(afterIndex + 1)
            ];

            const renumbered = newJra.map((item, idx) => ({
                ...item,
                nr: idx + 1
            }));

            return { ...prev, jra: renumbered };
        });
    };

    const availableColumns = [
        { id: "nr", title: "Nr", className: "ibraCent ibraNr", icon: null },
        { id: "main", title: "Main Task Step", className: "ibraCent ibraMainJRA", icon: null },
        { id: "hazards", title: "Hazard Classification / Energy Release", className: "ibraCent ibraHazJRA", icon: faInfoCircle },
        { id: "UE", title: "Unwanted Event", className: "ibraCent jraStatus", icon: faInfoCircle },
        { id: "sub", title: "Controls/ Sub Task Steps\n(Procedure to complete the Main Task Step)", className: "ibraCent ibraSubJRA", icon: faInfoCircle },
        { id: "taskExecution", title: "Task Execution", className: "ibraCent ibraTXJRA", icon: faInfoCircle },
        { id: "controls", title: "Control Execution Specification\n(For Work Execution Document [WED])", className: "ibraCent ibraEXEJRA", icon: faInfoCircle },
        { id: "go", title: "Go/ No-Go", className: "ibraCent ibraDeadlineJRA", icon: faInfoCircle },
        ...(!readOnly
            ? [{ id: "action", title: "Action", className: "ibraCent ibraAct", icon: null }] : []),
    ];

    const openInfo = (type) => {
        switch (type) {
            case "hazards": openHazardsHelp(); break;
            case "UE": openUnwantedEventsHelp(); break;
            case "sub": openSubHelp(); break;
            case "taskExecution": openTaskExecutionHelp(); break;
            case "controls": openResponsibleHelp(); break;
            case "go": openGo_noGo(); break;
        }
    }

    const removeBodyRow = (rowId, bodyId) => {
        setFormData(prev => {
            const newJra = prev.jra.flatMap(item => {
                if (item.id !== rowId) return item;

                if (item.jraBody.length === 1) {
                    if (prev.jra.length === 1) {
                        toast.clearWaitingQueue();
                        toast.dismiss();
                        toast.error("You must keep at least one row.", {
                            closeButton: true,
                            autoClose: 1500,
                            style: { textAlign: 'center' }
                        });
                        return item;
                    }
                    return [];
                }

                return {
                    ...item,
                    jraBody: item.jraBody.filter(b => b.idBody !== bodyId)
                };
            });

            const renumbered = newJra.map((j, i) => ({ ...j, nr: i + 1 }));
            return { ...prev, jra: renumbered };
        });
    };

    const removeRow = (rowId) => {
        setFormData(prev => {
            if (prev.jra.length === 1) {
                toast.clearWaitingQueue();
                toast.dismiss();
                toast.error("You must keep at least one row.", {
                    closeButton: true,
                    autoClose: 1500,
                    style: { textAlign: 'center' }
                });
                return prev;
            }

            const filtered = prev.jra.filter(item => item.id !== rowId);
            const renumbered = filtered.map((j, i) => ({ ...j, nr: i + 1 }));
            return { ...prev, jra: renumbered };
        });
    };

    useEffect(() => {
        const wrapper = tableWrapperRef.current;
        if (!wrapper) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        const mouseDownHandler = (e) => {
            if (
                e.target.closest('input, textarea, select, button') ||
                e.target.closest('.drag-handle') ||
                e.target.closest('.ibra-col-resizer')
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
            if (!ibraBoxRef.current || !tableWrapperRef.current) return;
            const boxW = ibraBoxRef.current.offsetWidth;
            const wrapperEl = tableWrapperRef.current;

            wrapperEl.style.width = `${boxW - 60}px`;
            setWrapperWidth(wrapperEl.getBoundingClientRect().width);
        };
        window.addEventListener('resize', adjust);
        adjust();
        return () => window.removeEventListener('resize', adjust);
    }, []);

    useEffect(() => {
        const adjust = () => {
            const wrapper = tableWrapperRef.current;
            const box = ibraBoxRef.current;
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
        "nr", "main", "hazards", "sub", "UE", "taskExecution", "controls", "go", ...(readOnly ? [] : ["action"]),
    ]);

    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const getDisplayColumns = () => {
        let result = availableColumns
            .map(col => col.id)
            .filter(id => showColumns.includes(id) && id !== 'action');
        while (result.length < 5) {
            result.push(`blank-${result.length}`);
        }
        if (!readOnly && !result.includes("action")) {
            result.push("action");
        }
        return result;
    };

    const popupRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowColumnSelector(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleColumn = (columnId) => {
        setShowColumns(prev => {
            if (prev.includes(columnId)) {
                if (columnId === 'action' || columnId === 'nr') return prev;
                return prev.filter(id => id !== columnId);
            } else {
                const actionIndex = prev.indexOf('action');
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
                .filter(id => id !== 'action');
            setShowColumns([...allColumns, 'action']);
        } else {
            setShowColumns(['nr', 'action']);
        }
    };

    const areAllColumnsSelected = () => {
        const selectableColumns = availableColumns
            .filter(col => col.id !== 'action')
            .map(col => col.id);

        return selectableColumns.every(colId =>
            showColumns.includes(colId) || colId === 'nr'
        );
    };

    const displayColumns = getDisplayColumns();
    const defaultColumns = useMemo(() => getDefaultShowColumns(), [readOnly]);
    const defaultWidths = useMemo(() => getDefaultColumnWidths(), []);

    const visibleMeasuredColumns = displayColumns.filter(
        (id) => columnWidths[id] != null && !id.startsWith("blank-")
    );
    const tableWidth = visibleMeasuredColumns.reduce(
        (sum, id) => sum + (columnWidths[id] || 0),
        0
    );

    const showFitButton =
        wrapperWidth > 0 &&
        tableWidth > 0 &&
        tableWidth < wrapperWidth - 1;

    const isUsingDefaultColumns =
        showColumns.length === defaultColumns.length &&
        defaultColumns.every((id, idx) => showColumns[idx] === id);

    const anyColumnWiderThanDefault = Object.keys(defaultWidths).some((id) => {
        const current = columnWidths[id] ?? defaultWidths[id];
        const def = defaultWidths[id];
        return current > def;
    });

    const anyColumnLessWiderThanDefault = Object.keys(defaultWidths).some((id) => {
        const current = columnWidths[id] ?? defaultWidths[id];
        const def = defaultWidths[id];
        return current < def;
    });

    const showResetButton =
        !isUsingDefaultColumns || anyColumnWiderThanDefault || anyColumnLessWiderThanDefault;

    useEffect(() => {
        const popupSelector = '.floating-dropdown';
        const columnSelector = '.column-selector-popup';
        const excelSelector = '.excel-filter-popup';

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest(columnSelector) &&
                !e.target.closest(excelSelector) &&
                !e.target.closest('input');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(popupSelector) || e.target.closest(columnSelector) || e.target.closest(excelSelector);

            if (!isInsidePopup) {
                closeDropdowns();
            }
        };

        const closeDropdowns = () => {
            setShowColumnSelector(null);
            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showColumnSelector, excelFilter]);

    const startColumnResize = (e, colId) => {
        if (readOnly) return;

        e.preventDefault();
        e.stopPropagation();

        const th = e.currentTarget.parentElement;
        const currentWidth =
            columnWidths[colId] || (th ? th.getBoundingClientRect().width : 0) || 0;

        resizingColRef.current = colId;
        resizeStartXRef.current = e.clientX;
        resizeStartWidthRef.current = currentWidth;
        isResizingRef.current = false;

        const handleMove = (ev) => {
            if (!resizingColRef.current) return;
            const col = resizingColRef.current;

            const delta = ev.clientX - resizeStartXRef.current;
            const rawWidth = resizeStartWidthRef.current + delta;

            const limits = columnSizeLimits[col] || {};
            let newWidth = rawWidth;
            if (limits.min) newWidth = Math.max(limits.min, newWidth);
            if (limits.max) newWidth = Math.min(limits.max, newWidth);

            setColumnWidths(prev => ({
                ...prev,
                [col]: Math.round(newWidth),
            }));

            isResizingRef.current = true;
        };

        const handleUp = () => {
            resizingColRef.current = null;
            resizeStartXRef.current = 0;
            resizeStartWidthRef.current = 0;
            setTimeout(() => {
                isResizingRef.current = false;
            }, 0);

            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
    };

    const fitTableToWidth = (overrideVisibleColumns, overrideWidths) => {
        const wrapper = tableWrapperRef.current;
        if (!wrapper) return;

        const wrapperWidth = wrapper.getBoundingClientRect().width;
        if (!wrapperWidth) return;

        const visibleCols = (overrideVisibleColumns || getDisplayColumns()).filter(
            (id) => typeof (overrideWidths?.[id] ?? columnWidths[id]) === "number"
        );
        if (!visibleCols.length) return;

        const getWidth = (id) =>
            (overrideWidths?.[id] ?? columnWidths[id] ?? 0);

        const totalWidth = visibleCols.reduce(
            (sum, id) => sum + getWidth(id),
            0
        );
        if (!totalWidth) return;

        if (totalWidth >= wrapperWidth) {
            return;
        }

        const scale = wrapperWidth / totalWidth;

        let newWidths = visibleCols.map((id) => getWidth(id) * scale);
        newWidths = newWidths.map((w) => Math.round(w));

        let diff =
            wrapperWidth -
            newWidths.reduce((sum, w) => sum + w, 0);

        let i = 0;
        while (diff !== 0 && i < newWidths.length * 2) {
            const idx = i % newWidths.length;
            newWidths[idx] += diff > 0 ? 1 : -1;
            diff =
                wrapperWidth -
                newWidths.reduce((sum, w) => sum + w, 0);
            i++;
        }

        setColumnWidths((prev) => {
            const updated = { ...prev };
            visibleCols.forEach((id, index) => {
                updated[id] = newWidths[index];
            });
            return updated;
        });
    };

    const resetToDefaultColumnsAndWidths = () => {
        const defaultColumns = getDefaultShowColumns();
        const defaultWidths = getDefaultColumnWidths();

        setShowColumns(defaultColumns);
        setColumnWidths(defaultWidths);
        setShowColumnSelector(false);

        fitTableToWidth(defaultColumns, defaultWidths);
    };

    const getRowFlagStatus = (row) => {
        if (row.rowFlagged) return true;
        return row.jraBody.some(body => {
            if (body.subStepFlagged) return true;
            if (body.hazards?.some(h => h.flagged)) return true;
            if (body.UE?.some(u => u.flagged)) return true;
            return false;
        });
    };

    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const filterMenuTimerRef = useRef(null);

    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(filters).length > 0;
        // Assuming default sort is nr/asc. Change if your default differs.
        const hasSort = sortConfig.colId !== "nr" || sortConfig.direction !== "asc";
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
        setSortConfig({ colId: "nr", direction: "asc" });
        setFilterMenu({ isOpen: false, anchorRect: null });
    };

    const getFilterBtnClass = () => {
        if (showFitButton && showResetButton) {
            return "top-right-button-ibra5";
        }

        if (showFitButton || showResetButton) {
            return "top-right-button-ibra4";
        }

        return "top-right-button-ibra3";
    };

    const toggleFlagFilter = () => {
        setShowFlagged(prev => !prev);
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

    const fitBtnClass = showFitButton
        ? getTopRightButtonClass(rightButtonSlot++)
        : null;

    const resetBtnClass = showResetButton
        ? getTopRightButtonClass(rightButtonSlot++)
        : null;

    const flagBtnClass = getTopRightButtonClass(rightButtonSlot++);
    const filterBtnClass = getTopRightButtonClass(rightButtonSlot++);

    return (
        <div className={`input-row-risk-ibra `}>
            <div className={`ibra-box ${error ? 'error-create' : ''}`} ref={ibraBoxRef}>
                <h3 className="font-fam-labels">Job Risk Assessment (JRA)  <span className="required-field">*</span></h3>
                <button
                    className={columnBtnClass}
                    title="Show / Hide Columns"
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                >
                    <FontAwesomeIcon icon={faTableColumns} className="icon-um-search" />
                </button>

                {showFitButton && (<button
                    className={fitBtnClass}
                    title="Fit to Width"
                    onClick={() => fitTableToWidth()}
                >
                    <FontAwesomeIcon icon={faArrowsLeftRight} className="icon-um-search" />
                </button>)}

                {showResetButton && (<button
                    className={resetBtnClass}
                    title="Reset To Default"
                    onClick={resetToDefaultColumnsAndWidths}
                >
                    <FontAwesomeIcon icon={faArrowsRotate} className="icon-um-search" />
                </button>)}

                <button
                    className={flagBtnClass}
                    title={showFlagged ? "Show All Items" : "Show Flagged Items Only"}
                    onClick={toggleFlagFilter}
                >
                    <FontAwesomeIcon icon={faFlag} className={`icon-um-search ${showFlagged ? "flag-filter-active" : ""}`} />
                </button>

                <button
                    className={filterBtnClass}// Calculated class (e.g., ibra4, ibra5, ibra6)
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

                {showColumnSelector && (
                    <div className="column-selector-popup"
                        onMouseDown={(e) => e.stopPropagation()} ref={popupRef}>
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
                                                disabled={column.id === 'action' || column.id === 'nr'}
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
                    <div className="table-wrapper-jra" ref={tableWrapperRef}>
                        <table className="table-borders-ibra-table">
                            <thead className="ibra-table-header">
                                <tr>
                                    {displayColumns.map((columnId, index) => {
                                        const column = availableColumns.find(col => col.id === columnId);
                                        if (!column) {
                                            return <th key={index} className="ibraCent ibraBlank"></th>;
                                        }

                                        const limits = columnSizeLimits[columnId] || {};
                                        const width = columnWidths[columnId];

                                        return (
                                            <th
                                                key={index}
                                                className={`${column.className} jra-header-cell ${filters[columnId] ? '' : ''}`}
                                                style={{
                                                    position: 'relative',
                                                    width: width ? `${width}px` : undefined,
                                                    minWidth: limits.min ? `${limits.min}px` : undefined,
                                                    maxWidth: limits.max ? `${limits.max}px` : undefined,
                                                }}
                                                onClick={e => {
                                                    if (isResizingRef.current) return;
                                                    // Don't open if clicked icon or resize handle
                                                    if (e.target.closest('.header-icon') || e.target.closest('.ibra-col-resizer')) {
                                                        return;
                                                    }
                                                    openExcelFilterPopup(columnId, e);
                                                }}
                                            >
                                                {column.icon && (
                                                    <FontAwesomeIcon
                                                        icon={column.icon}
                                                        className="header-icon"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            openInfo(column.id);
                                                        }}
                                                    />
                                                )}

                                                <div>
                                                    {column.title.split('(')[0].trim()}
                                                    {(filters[columnId] || (sortConfig.colId === columnId && columnId !== "nr")) && (
                                                        <FontAwesomeIcon icon={faFilter} className="active-filter-icon" style={{ marginLeft: "10px" }} />
                                                    )}
                                                </div>

                                                {column.title.includes('(') && (
                                                    <div className="column-subtitle">
                                                        ({column.title.split('(')[1].split(')')[0]})
                                                    </div>
                                                )}

                                                {!readOnly && (
                                                    <div
                                                        className="ibra-col-resizer"
                                                        onMouseDown={e => startColumnResize(e, columnId)}
                                                    />
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((row, rowIndex) => {
                                    const rowCount = row.jraBody.length;
                                    return (
                                        <React.Fragment key={row.id}>
                                            {row.jraBody.map((body, bodyIdx) => (
                                                <tr
                                                    className={`jra-body-row ${row.nr % 2 === 0 ? 'weRow' : ''} ${dragOverRowId === row.id && bodyIdx === 0 ? "drag-over-top" : ""}`}
                                                    data-row-id={row.id}
                                                    key={`${row.id}-${body.idBody}`}
                                                    onMouseEnter={() => setHoveredBody({ rowId: row.id, bodyIdx })}
                                                    onMouseLeave={() => setHoveredBody({ rowId: null, bodyIdx: null })}
                                                    draggable={armedDragRow === row.id}
                                                    onDragStart={armedDragRow === row.id ? e => handleDragStart(e, row.id) : undefined}
                                                    onDragOver={e => handleDragOver(e, row.id)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={e => handleDrop(e, row.id)}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    {displayColumns.map((colId, colIdx) => {
                                                        if ((colId === 'nr' || colId === 'main') && bodyIdx > 0) {
                                                            return null;
                                                        }

                                                        const meta = availableColumns.find(c => c.id === colId);
                                                        const cls = meta?.className || "";
                                                        const limits = columnSizeLimits[colId] || {};
                                                        const width = columnWidths[colId];
                                                        const commonCellStyle = {
                                                            width: width ? `${width}px` : undefined,
                                                            minWidth: limits.min ? `${limits.min}px` : undefined,
                                                            maxWidth: limits.max ? `${limits.max}px` : undefined,
                                                        };

                                                        if (colId === "nr" && bodyIdx === 0) {
                                                            return (
                                                                <td key={colIdx} rowSpan={rowCount} className={cls} style={{ ...commonCellStyle, position: "relative" }}>
                                                                    {getRowFlagStatus(row) && (<span
                                                                        className={
                                                                            "ibra-main-flag-icon" +
                                                                            (getRowFlagStatus(row) ? " active" : "")
                                                                        }
                                                                    >
                                                                        <FontAwesomeIcon icon={faFlag} />
                                                                    </span>)}
                                                                    <span>{row.nr}</span>
                                                                    {!readOnly && (<FontAwesomeIcon
                                                                        icon={faArrowsUpDown}
                                                                        className="drag-handle"
                                                                        onMouseDown={() => setArmedDragRow(row.id)}
                                                                        onMouseUp={() => setArmedDragRow(null)}
                                                                        style={{ cursor: 'grab', marginRight: "2px", marginLeft: "4px" }}
                                                                    />)}
                                                                    <FontAwesomeIcon
                                                                        icon={faArrowUpRightFromSquare}
                                                                        style={{ fontSize: "14px", marginLeft: "2px", color: "black" }}
                                                                        className="ue-popup-icon"
                                                                        title="Evaluate Unwanted Event"
                                                                        onClick={() => {
                                                                            openJRAPopup(row.id);
                                                                            if (error) {
                                                                                setErrors(prev => ({ ...prev, jra: false }));
                                                                            }
                                                                        }}
                                                                    />
                                                                </td>
                                                            );
                                                        }

                                                        if (colId === "main") {
                                                            return (
                                                                <td
                                                                    key={colIdx}
                                                                    rowSpan={rowCount}
                                                                    className={`${[cls, 'main-cell'].join(' ')}  correct-wrap-ibra`}
                                                                    style={commonCellStyle}
                                                                >
                                                                    <div className="main-cell-content">
                                                                        <div style={{ display: "block", textAlign: "left", whiteSpace: "pre-wrap" }}>{row.main}</div>
                                                                    </div>
                                                                    {!readOnly && (<>
                                                                        <button
                                                                            type="button"
                                                                            className="insert-mainrow-button"
                                                                            title="Add Main Step Here"
                                                                            onClick={() => insertMainRow(row.id)}
                                                                        >
                                                                            <FontAwesomeIcon icon={faPlus} />
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            className="delete-mainrow-button"
                                                                            title="Delete Main Step"
                                                                            onClick={() => requestRemoveRow(row)}
                                                                        >
                                                                            <FontAwesomeIcon icon={faTrash} className="delete-mainrow-icon" />
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            className="duplicate-mainrow-button"
                                                                            title="Duplicate Main Step"
                                                                            onClick={() => handleDuplicateRow(row.id)}
                                                                        >
                                                                            <FontAwesomeIcon icon={faCopy} />
                                                                        </button>
                                                                    </>)}
                                                                </td>
                                                            );
                                                        }

                                                        if (colId === "action") {
                                                            return (
                                                                <td key={colIdx} className={`${cls}`} style={commonCellStyle}>
                                                                    <FontAwesomeIcon
                                                                        icon={faPlusCircle}
                                                                        style={{ marginBottom: "0px", fontSize: "15px" }}
                                                                        className="insert-row-button-sig-risk font-fam"
                                                                        title="Add sub & control here"
                                                                        onClick={() => insertMainRow(row.id)}
                                                                    />

                                                                    {bodyIdx !== 0 && (
                                                                        <FontAwesomeIcon icon={faTrash} style={{ marginBottom: "0px", marginTop: "10px" }} className="control-icon-action font-fam"
                                                                            title={
                                                                                row.jraBody.length > 1
                                                                                    ? "Delete Sub-step"
                                                                                    : "Delete Row"
                                                                            }
                                                                            onClick={() => requestRemoveBodyRow(row, body)} />
                                                                    )}

                                                                </td>
                                                            );
                                                        }

                                                        if (colId === "hazards") {
                                                            return (
                                                                <td key={colIdx} className={`hazard-cell`} style={commonCellStyle}>
                                                                    {body.hazards.map((hObj, hIdx) => {
                                                                        return (
                                                                            <div key={hIdx} className="static-cell hazard-static jra-normal-text">
                                                                                {hObj.hazard}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {!readOnly && (<button
                                                                        type="button"
                                                                        className="insert-subrow-button"
                                                                        onClick={() => insertBodyRow(row.id, bodyIdx + 1)}
                                                                        title="Add sub-step here"
                                                                    >
                                                                        <FontAwesomeIcon icon={faPlus} />
                                                                    </button>)}
                                                                </td>
                                                            );
                                                        }

                                                        if (colId === "UE") {
                                                            return (
                                                                <td key={colIdx} className={`${cls}`} style={commonCellStyle}>
                                                                    {body.UE.map((uObj, uIdx) => {
                                                                        return (
                                                                            <div key={uIdx} className="jra-normal-text">
                                                                                {uObj.ue}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </td>
                                                            );
                                                        }

                                                        if (colId === "sub") {
                                                            return (
                                                                <td key={colIdx} className={`${cls}  correct-wrap-ibra`} style={{ ...commonCellStyle, paddingRight: "8px" }}>
                                                                    {body.sub.map((sObj, sIdx) => (
                                                                        <div className="test-jra"
                                                                            key={sObj.id}
                                                                            ref={el => {
                                                                                const key = `${rowIndex}-${bodyIdx}-${sIdx}`;
                                                                                let arr = syncGroups.current[key] || [];

                                                                                if (el) {
                                                                                    if (!arr.includes(el)) arr.push(el);
                                                                                } else {
                                                                                    arr = arr.filter(node => node.isConnected);
                                                                                }

                                                                                syncGroups.current[key] = arr;
                                                                            }}
                                                                        >
                                                                            <div className="control-with-icons" key={colIdx}>
                                                                                <div style={{ display: "block", textAlign: "left", whiteSpace: "pre-wrap" }}>{sObj.task}</div>
                                                                            </div>
                                                                        </div>
                                                                    ))}

                                                                </td>
                                                            );
                                                        }

                                                        if (colId === "taskExecution") {
                                                            return (
                                                                <td key={colIdx} className={`${cls}`} style={commonCellStyle}>
                                                                    {body.taskExecution.map((teObj, teIdx) => (
                                                                        <div className="test-jra"
                                                                            key={teObj.id}
                                                                            ref={el => {
                                                                                const key = `${rowIndex}-${bodyIdx}-${teIdx}`;
                                                                                let arr = syncGroups.current[key] || [];

                                                                                if (el) {
                                                                                    if (!arr.includes(el)) arr.push(el);
                                                                                } else {
                                                                                    arr = arr.filter(node => node.isConnected);
                                                                                }

                                                                                syncGroups.current[key] = arr;
                                                                            }}
                                                                        >
                                                                            <div className="select-wrapper" style={{ marginBottom: "5px" }}>
                                                                                <label className={`select-label-proc`}>R:</label>

                                                                                <div className="jra-te-label">{teObj.R}</div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </td>
                                                            );
                                                        }

                                                        if (colId === "controls") {
                                                            return (
                                                                <td key={colIdx} className={`${cls}`} style={commonCellStyle}>
                                                                    {body.controls.map((cObj, cIdx) => (
                                                                        <div className="test-jra"
                                                                            key={cObj.id}
                                                                            ref={el => {
                                                                                const key = `${rowIndex}-${bodyIdx}-${cIdx}`;
                                                                                let arr = syncGroups.current[key] || [];

                                                                                if (el) {
                                                                                    if (!arr.includes(el)) arr.push(el);
                                                                                } else {
                                                                                    arr = arr.filter(node => node.isConnected);
                                                                                }

                                                                                syncGroups.current[key] = arr;
                                                                            }}
                                                                        >
                                                                            <div style={{ display: "block", textAlign: "left", whiteSpace: "pre-wrap" }}>{cObj.control}</div>
                                                                        </div>
                                                                    ))}
                                                                </td>
                                                            );
                                                        }

                                                        if (colId === "go") {
                                                            return (
                                                                <td key={colIdx} className={`${cls}`} style={commonCellStyle}>
                                                                    {body.go_noGo.map((goObj, goIdx) => (
                                                                        <div className="test-jra"
                                                                            key={goObj.id}
                                                                            ref={el => {
                                                                                const key = `${rowIndex}-${bodyIdx}-${goIdx}`;
                                                                                let arr = syncGroups.current[key] || [];

                                                                                if (el) {
                                                                                    if (!arr.includes(el)) arr.push(el);
                                                                                } else {
                                                                                    arr = arr.filter(node => node.isConnected);
                                                                                }

                                                                                syncGroups.current[key] = arr;
                                                                            }}
                                                                        >

                                                                            <div style={{ display: "block", textAlign: "center" }}>{goObj.go}</div>
                                                                        </div>
                                                                    ))}
                                                                </td>
                                                            );
                                                        }
                                                        return <td key={colIdx} />;
                                                    })}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Excel-style Filter Popup */}
            {/* Excel-style Filter Popup */}
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
                    onWheel={handleInnerScrollWheel}
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

                        // CHANGE: Use helper to get context-aware options
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

                            // If searching, only apply changes to the visible items
                            if (excelSearch.trim() !== "") {
                                const visibleSet = new Set(visibleValues);
                                finalSelection = new Set(
                                    Array.from(excelSelected).filter(v => visibleSet.has(v))
                                );
                            }

                            const selectedArr = Array.from(finalSelection);

                            // Check if this is a "Select All" (Reset) scenario
                            const isTotalReset = allValues.length > 0 &&
                                allValues.length === selectedArr.length &&
                                selectedArr.every(v => finalSelection.has(v));

                            setFilters(prev => {
                                const next = { ...prev };
                                if (isTotalReset) {
                                    delete next[colId];
                                } else {
                                    next[colId] = selectedArr; // Save as simple array
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
            {rowPendingDelete && (
                <RiskAssessmentDeletePopup
                    closeModal={closeRemoveRowPopup}
                    type={rowPendingDelete.type}
                    removeRow={confirmRemoveRow}
                />
            )}

            {helpHazards && (<HazardJRA setClose={closeHazardsHelp} />)}
            {helpResponsible && (<ControlExecution setClose={closeResponsibleHelp} />)}
            {helpSub && (<CurrentControlsJRA setClose={closeSubHelp} />)}
            {helpTaskExecution && (<TaskExecution setClose={closeTaskExecutionHelp} />)}
            {helpUnwantedEvents && (<UnwantedEvent setClose={closeUnwantedEventsHelp} />)}
            {go_noGO && (<Go_Nogo setClose={closeGo_noGo} />)}
            {showJRAPopup && (<JRAPopup readOnly={readOnly} onClose={closeJRAPopup} data={rowData} onSubmit={handleUpdateJraRow} nr={rowData.nr} formData={formData} />)}
        </div>
    );
};

export default JRATable;