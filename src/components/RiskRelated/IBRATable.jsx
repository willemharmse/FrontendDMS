import React, { useEffect, useState, useRef, useMemo, useLayoutEffect } from "react";
import './IBRATable.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlusCircle, faTableColumns, faTimes, faGripVertical, faInfoCircle, faArrowUpRightFromSquare, faCheck, faDownload, faArrowsUpDown, faCopy, faFilter, faCalendar, faCalendarDays, faArrowsLeftRight, faWindowRestore, faBorderNone, faRotateLeft, faArrowsRotate, faFlag, faFax, faX } from '@fortawesome/free-solid-svg-icons';
import IBRAPopup from "./IBRAPopup";
import IbraNote from "./RiskInfo/IbraNote";
import UnwantedEvent from "./RiskInfo/UnwantedEvent";
import { v4 as uuidv4 } from 'uuid';
import axios from "axios";
import DatePicker from "react-multi-date-picker";
import FilterRemovePopup from "../Popups/FilterRemovePopup";
import {
    faChevronDown,
    faChevronUp
} from "@fortawesome/free-solid-svg-icons";

const IBRATable = ({ collapsible = false, rows, updateRows, addRow, removeRow, generate, updateRow, isSidebarVisible, error, setErrors, readOnly = false, relevantControls = [] }) => {
    const [collapsed, setCollapsed] = useState(false);
    const syncGroups = useRef({});
    const isCollapsed = collapsible ? collapsed : false;
    const ibraBoxRef = useRef(null);
    const tableWrapperRef = useRef(null);
    const [ibraPopup, setIbraPopup] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState(null);
    const [noteText, setNoteText] = useState("");
    const [showNote, setShowNote] = useState(false);
    const savedWidthRef = useRef(null);
    const [filters, setFilters] = useState({});
    const [armedDragRow, setArmedDragRow] = useState(null);
    const [draggedRowId, setDraggedRowId] = useState(null);
    const [dragOverRowId, setDragOverRowId] = useState(null);
    const [filteredExe, setFilteredExe] = useState([]);
    const [showExeDropdown, setShowExeDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [posLists, setPosLists] = useState([]);
    const [activeSubCell, setActiveSubCell] = useState(null);
    const responsibleInputRefs = useRef({});
    const isResizingRef = useRef(false);
    const [wrapperWidth, setWrapperWidth] = useState(0);
    const [hasFittedOnce, setHasFittedOnce] = useState(false);
    const [showFlagged, setShowFlagged] = useState(false);

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
    };

    const excludedColumns = ["UE", "S", "H", "E", "C", "LR", "M", "R", "actions", "responsible", "dueDate"];

    // REMOVED: initialOrderRef and its useEffect. We rely on the array order now.

    const BLANK = "(Blanks)";

    const getSelectedValuesForColumn = (colId) => {
        const raw = filters[colId];
        const selected = Array.isArray(raw) ? raw : raw?.selected;
        return Array.isArray(selected) ? selected : null;
    };

    const isSelectedOrNoFilter = (colId, value) => {
        const selected = getSelectedValuesForColumn(colId);
        if (!selected) return true;

        const v = value == null || String(value).trim() === ""
            ? BLANK
            : String(value).trim();

        return selected.includes(v);
    };

    // Return an array of "filter values" for a cell.
    const getFilterValuesForCell = (row, colId) => {
        const raw = row?.[colId];

        if (colId === "hazards") {
            const vals = (raw || [])
                .map(h => (typeof h === "string" ? h : h?.hazard))
                .map(v => (v == null ? "" : String(v).trim()))
                .filter(Boolean);
            return vals.length ? vals : [BLANK];
        }

        if (colId === "controls") {
            const vals = (raw || [])
                .map(c => (typeof c === "string" ? c : c?.control))
                .map(v => (v == null ? "" : String(v).trim()))
                .filter(Boolean);
            return vals.length ? vals : [BLANK];
        }

        if (colId === "actions") {
            const vals = (row?.possible || [])
                .flatMap(p => (p?.actions || []).map(a => a?.action))
                .map(v => (v == null ? "" : String(v).trim()))
                .filter(Boolean);
            return vals.length ? vals : [BLANK];
        }

        if (colId === "responsible") {
            const vals = (row?.possible || [])
                .flatMap(p => (p?.responsible || []).map(r => r?.person))
                .map(v => (v == null ? "" : String(v).trim()))
                .filter(Boolean);
            return vals.length ? vals : [BLANK];
        }

        if (colId === "dueDate") {
            const vals = (row?.possible || [])
                .flatMap(p => (p?.dueDate || []).map(d => d?.date))
                .map(v => (v == null ? "" : String(v).trim()))
                .filter(Boolean);
            return vals.length ? vals : [BLANK];
        }

        const s = raw == null ? "" : String(raw).trim();
        return s === "" ? [BLANK] : [s];
    };

    const excelPopupRef = useRef(null);

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

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT; // click same sort again -> reset
            }
            return { colId, direction };
        });
    };

    const findRowAndPossibleById = (rowId, possibleId) => {
        const rowIndex = rows.findIndex(r => r.id === rowId);
        if (rowIndex === -1) return {};
        const row = rows[rowIndex];
        const possibleIndex = row.possible?.findIndex(p => p.id === possibleId);
        return { rowIndex, possibleIndex };
    };

    const [filterPopup, setFilterPopup] = useState({
        visible: false,
        column: null,
        pos: { top: 0, left: 0, width: 0 }
    });

    const [columnWidths, setColumnWidths] = useState({
        nr: 50,
        main: 60,
        sub: 115,
        source: 90,
        hazards: 110,
        UE: 120,
        maxConsequence: 300,
        owner: 200,
        controls: 170,
        odds: 95,
        riskRank: 90,
        priority: 70,
        material: 70,
        actions: 500,
        responsible: 370,
        dueDate: 130,
        additional: 150,
        S: 60,
        H: 60,
        E: 60,
        C: 60,
        LR: 60,
        M: 60,
        R: 60,
        action: 50
    });

    const [initialColumnWidths, setInitialColumnWidths] = useState({
        nr: 50,
        main: 60,
        sub: 115,
        source: 90,
        hazards: 110,
        UE: 120,
        maxConsequence: 300,
        owner: 200,
        controls: 170,
        odds: 95,
        riskRank: 90,
        priority: 70,
        material: 70,
        actions: 500,
        responsible: 370,
        dueDate: 130,
        additional: 150,
        S: 60,
        H: 60,
        E: 60,
        C: 60,
        LR: 60,
        M: 60,
        R: 60,
        action: 50
    });

    const columnSizeLimits = {
        nr: { min: 50, max: 50 },
        main: { min: 80, max: 300 },
        sub: { min: 80, max: 300 },
        source: { min: 120, max: 400 },
        hazards: { min: 150, max: 500 },
        UE: { min: 150, max: 400 },
        maxConsequence: { min: 200, max: 600 },
        owner: { min: 150, max: 400 },
        controls: { min: 200, max: 600 },
        odds: { min: 80, max: 150 },
        riskRank: { min: 80, max: 150 },
        priority: { min: 70, max: 150 },
        material: { min: 70, max: 150 },
        actions: { min: 300, max: 1000 },
        responsible: { min: 200, max: 600 },
        dueDate: { min: 120, max: 300 },
        additional: { min: 150, max: 400 },
        S: { min: 50, max: 100 },
        H: { min: 50, max: 100 },
        E: { min: 50, max: 100 },
        C: { min: 50, max: 100 },
        LR: { min: 50, max: 100 },
        M: { min: 50, max: 100 },
        R: { min: 50, max: 100 },
        action: { min: 50, max: 50 },
    };

    const getVisibleLinkedItems = (p) => {
        const actions = p?.actions || [];
        const responsible = p?.responsible || [];
        const dueDate = p?.dueDate || [];

        const maxLen = Math.max(actions.length, responsible.length, dueDate.length);

        const linked = Array.from({ length: maxLen }, (_, i) => ({
            action: actions[i] || { id: `a-${i}`, action: "" },
            responsible: responsible[i] || { id: `r-${i}`, person: "" },
            dueDate: dueDate[i] || { id: `d-${i}`, date: "" },
            index: i
        }));

        return linked.filter(item => {
            const actionOk = isSelectedOrNoFilter("actions", item.action?.action);
            const responsibleOk = isSelectedOrNoFilter("responsible", item.responsible?.person);
            const dueDateOk = isSelectedOrNoFilter("dueDate", item.dueDate?.date);
            return actionOk && responsibleOk && dueDateOk;
        });
    };

    const filteredRows = useMemo(() => {
        let current = [...rows];

        // These columns filter items *within* the cell (hide non-matching list items),
        // but they must ALSO exclude rows that have zero matching items.
        const CELL_ITEM_FILTERS = new Set([
            "hazards",
            "controls",
            "actions",
            "responsible",
            "dueDate"
        ]);

        // 1) Apply filtering
        current = current.filter(row => {
            for (const [colId, filterObj] of Object.entries(filters)) {
                const selected = Array.isArray(filterObj)
                    ? filterObj
                    : filterObj?.selected;
                if (!Array.isArray(selected) || selected.length === 0) continue;

                const cellValues = getFilterValuesForCell(row, colId);
                const match = cellValues.some(v => selected.includes(v));
                if (!match) return false;
            }

            if (showFlagged) {
                const isFlagged =
                    !!row.mainFlag ||
                    !!row.subFlag ||
                    !!row.ownerFlag ||
                    !!row.oddsFlag ||
                    !!row.riskRankFlag ||
                    !!row.maxConsequenceFlag ||
                    !!row.controlFlag ||
                    !!row.hazardFlag ||
                    !!row.sourceFlag ||
                    !!row.ueFlag ||
                    !!row.additionalFlag;

                if (!isFlagged) return false;
            }

            return true;
        });

        // 2) Sorting
        const colId = sortConfig?.colId || "nr";

        // FIX: If sorting by 'nr' (default), rely on the array order provided by parent.
        // Do NOT use an artificial map.
        if (colId === "nr") {
            // Re-number visible rows sequentially
            return current.map((r, i) => ({ ...r, nr: i + 1 }));
        }

        // Otherwise, apply active sort direction for other columns
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

        const tryDate = (v) => {
            if (colId !== "dueDate") return null;
            const t = Date.parse(String(v));
            return Number.isFinite(t) ? t : null;
        };

        current.sort((a, b) => {
            const av = normalize(a?.[colId]);
            const bv = normalize(b?.[colId]);

            const aBlank = av === BLANK;
            const bBlank = bv === BLANK;
            if (aBlank && !bBlank) return 1;
            if (!aBlank && bBlank) return -1;

            const an = tryNumber(av);
            const bn = tryNumber(bv);
            if (an != null && bn != null) return (an - bn) * dir;

            const ad = tryDate(av);
            const bd = tryDate(bv);
            if (ad != null && bd != null) return (ad - bd) * dir;

            return String(av).localeCompare(String(bv), undefined, {
                sensitivity: "base",
                numeric: true,
            }) * dir;
        });

        return current.map((r, i) => ({ ...r, nr: i + 1 }));
    }, [rows, filters, showFlagged, sortConfig]);

    function openFilterPopup(colId, e) {
        if (colId === "nr" || colId === "action") return;

        const target = e.currentTarget || e.target;
        const rect = target.getBoundingClientRect();

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

    function applyFilter(value) {
        setFilters(prev => ({
            ...prev,
            [filterPopup.column]: value
        }));
        setFilterPopup({ visible: false, column: null, pos: {} });
    }

    function clearFilter() {
        setFilters(prev => {
            const next = { ...prev };
            delete next[filterPopup.column];
            return next;
        });
        setFilterPopup({ visible: false, column: null, pos: {} });
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_URL}/api/riskInfo/desgntions`);
                const data = res.data.designations;

                const positions = Array.from(new Set(data.map(d => d.person))).sort();

                setPosLists(positions);

                console.log(positions);
            } catch (error) {
                console.log(error)
            }
        };
        fetchData();
    }, []);

    const closeAllDropdowns = () => {
        setShowExeDropdown(null);
    };

    const handleDragStart = (e, rowId) => {
        setDraggedRowId(rowId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', '');
        setTimeout(() => {
            const tr = e.target.closest('tr');
            if (tr) tr.style.opacity = '0.5';
        }, 0);
    };

    const handleDuplicateRow = (rowId) => {
        const rowIndex = rows.findIndex(r => r.id === rowId);
        if (rowIndex === -1) return;

        const newRows = [...rows];
        const rowCopy = JSON.parse(JSON.stringify(newRows[rowIndex]));
        rowCopy.id = uuidv4();

        // Also regenerate IDs for nested possible/actions/etc
        rowCopy.possible = rowCopy.possible.map(block => ({
            ...block,
            id: uuidv4(),
            actions: block.actions.map(a => ({ ...a, id: uuidv4() })),
            responsible: block.responsible.map(r => ({ ...r, id: uuidv4() })),
            dueDate: block.dueDate.map(d => ({ ...d, id: uuidv4() }))
        }));

        newRows.splice(rowIndex + 1, 0, rowCopy);
        newRows.forEach((r, idx) => { r.nr = idx + 1 });
        updateRow(newRows);
    };

    const handleDragOver = (e, rowId) => {
        e.preventDefault();
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
                // This snaps the row into view instantly and stops scrolling because 
                // on the next frame, (trRect.top < stickyCeiling) will be false.
                container.scrollTop -= (hiddenAmount + 2);
            }
        }
    };

    const handleDragLeave = (e) => {
        const tr = e.target.closest('tr');
        if (tr) tr.style.opacity = '';
        setDragOverRowId(null);
        setArmedDragRow(null);
    };

    const handleDrop = (e, dropRowId) => {
        e.preventDefault();

        if (!draggedRowId || draggedRowId === dropRowId) {
            setDraggedRowId(null);
            setDragOverRowId(null);
            return;
        }

        const newRows = [...rows];

        const fromIndex = newRows.findIndex(r => r.id === draggedRowId);
        const toIndex = newRows.findIndex(r => r.id === dropRowId);

        if (fromIndex === -1 || toIndex === -1) return;

        const [moved] = newRows.splice(fromIndex, 1);
        newRows.splice(toIndex, 0, moved);

        newRows.forEach((r, idx) => r.nr = idx + 1);

        updateRow(newRows);

        setDraggedRowId(null);
        setDragOverRowId(null);
    };

    const handleDragEnd = (e) => {
        const tr = e.target.closest('tr');
        if (tr) tr.style.opacity = '';
        setDraggedRowId(null);
        setDragOverRowId(null);
    };

    const openNote = (text) => {
        setShowNote(true);
        setNoteText(text);
    }

    const closeNote = () => {
        setShowNote(false);
    }

    const closePopup = () => {
        setIbraPopup(false);
    }

    const availableColumns = [
        { id: "nr", title: "Nr", className: "ibraCent ibraNr", icon: null },
        { id: "main", title: "Main Area", className: "ibraCent ibraMain", icon: null },
        { id: "sub", title: "Sub Area", className: "ibraCent ibraSub", icon: null },
        { id: "source", title: "Hazard Classification / Energy Release", className: "ibraCent ibraAR", icon: null },
        { id: "hazards", title: "Hazard", className: "ibraCent ibraPrev", icon: null },
        { id: "UE", title: "Unwanted Event", className: "ibraCent ibraStatus", icon: null },
        { id: "maxConsequence", title: "Max Reasonable Consequence Description", className: "ibraCent ibraDeadline", icon: null },
        { id: "owner", title: "Functional Ownership", className: "ibraCent ibraNotes-IBRA", icon: null },
        { id: "controls", title: "Current Controls", className: "ibraCent ibraDate", icon: null },
        { id: "odds", title: "Likelihood of the Event", className: "ibraCent ibraRisk", icon: null },
        { id: "S", title: "(S)", className: "ibraCent ibraCon", icon: null },
        { id: "H", title: "(H)", className: "ibraCent ibraCon", icon: null },
        { id: "E", title: "(E)", className: "ibraCent ibraCon", icon: null },
        { id: "C", title: "(C)", className: "ibraCent ibraCon", icon: null },
        { id: "LR", title: "(L&R)", className: "ibraCent ibraCon", icon: null },
        { id: "M", title: "(M)", className: "ibraCent ibraCon", icon: null },
        { id: "R", title: "(R)", className: "ibraCent ibraCon", icon: null },
        { id: "riskRank", title: "Max Risk Rank", className: "ibraCent ibraOther", icon: null },
        { id: "priority", title: "PUE", className: "ibraCent ibraOther", icon: null },
        { id: "material", title: "MUE", className: "ibraCent ibraOther", icon: null },
        {
            id: "possible",
            title: "Risk Treatment",
            className: "ibraCent ibraRM",
            children: ["actions", "responsible", "dueDate"]
        },
        { id: "actions", title: "Required Action", className: "ibraCent ibraPI" },
        { id: "responsible", title: "Responsible Person", className: "ibraCent ibraRA" },
        { id: "dueDate", title: "Due Date", className: "ibraCent ibraDD" },
        { id: "additional", title: "Notes Regarding the UE", className: "ibraCent ibraAdditional", icon: null },
        ...(readOnly ? [] : [{ id: "action", title: "Action", className: "ibraCent ibraAct", icon: null }]),
    ];

    const updatePossibleBlock = (rowId, possibleId, updater) => {
        const newRows = rows.map(row => {
            if (row.id !== rowId) return row;

            return {
                ...row,
                possible: (row.possible || []).map(p => {
                    if (p.id !== possibleId) return p;
                    return updater(p);
                })
            };
        });

        updateRow(newRows);
    };

    // 1) A helper that wraps updateRows but also ensures "possible" is visible
    const handleSaveWithRiskTreatment = (rowId, updatedData) => {
        // 1) Push the new data up to the parent
        updateRows(rowId, updatedData);
    };

    // Remove one action & its matching dueDate, but leave at least one
    const handleRemoveAction = (rowId, possibleId, actionId) => {
        const { rowIndex, possibleIndex } = findRowAndPossibleById(rowId, possibleId);
        if (rowIndex === -1 || possibleIndex === -1) return;

        const newRows = [...rows];
        const block = newRows[rowIndex].possible[possibleIndex];

        const idx = block.actions.findIndex(a => a.id === actionId);

        if (idx !== -1 && block.actions.length > 1) {
            block.actions.splice(idx, 1);
            block.responsible.splice(idx, 1);
            block.dueDate.splice(idx, 1);
            updateRow(newRows);
        }
    };

    const handleAddAction = (rowId, possibleId, afterActionId) => {
        const { rowIndex, possibleIndex } = findRowAndPossibleById(rowId, possibleId);
        if (rowIndex === -1 || possibleIndex === -1) return;

        const newRows = [...rows];
        const block = newRows[rowIndex].possible[possibleIndex];

        const insertIndex = block.actions.findIndex(a => a.id === afterActionId);
        if (insertIndex === -1) return;

        const newAction = { id: uuidv4(), action: "" };
        const newResponsible = { id: uuidv4(), person: "" };
        const newDueDate = { id: uuidv4(), date: "" };

        block.actions.splice(insertIndex + 1, 0, newAction);
        block.responsible.splice(insertIndex + 1, 0, newResponsible);
        block.dueDate.splice(insertIndex + 1, 0, newDueDate);

        updateRow(newRows);
    };

    const handleResponsibleInput = (rowId, possibleId, responsibleId, value) => {
        const { rowIndex, possibleIndex } = findRowAndPossibleById(rowId, possibleId);
        if (rowIndex === -1 || possibleIndex === -1) return;

        closeAllDropdowns();
        handleResponsibleChange(rowId, possibleId, responsibleId, value);

        const matches = posLists
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));

        setFilteredExe(matches);
        setShowExeDropdown(true);
        setActiveSubCell({ rowId, possibleId, responsibleId });

        const key = `${rowId}-${possibleId}-${responsibleId}`;

        const el = responsibleInputRefs.current[key];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleResponsibleFocus = (rowId, possibleId, responsibleId, value) => {
        if (readOnly) return;
        setActiveSubCell({ rowId, possibleId, responsibleId });

        const matches = posLists
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));

        setFilteredExe(matches);
        setShowExeDropdown(true);

        const key = `${rowId}-${possibleId}-${responsibleId}`;

        const el = responsibleInputRefs.current[key];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const selectResponsibleSuggestion = (suggestion) => {
        const { rowId, possibleId, responsibleId } = activeSubCell;
        if (!rowId || !possibleId || !responsibleId) return;

        handleResponsibleChange(rowId, possibleId, responsibleId, suggestion);
        setShowExeDropdown(false);
    };

    const handleResponsibleChange = (rowId, possibleId, responsibleId, value) => {
        updatePossibleBlock(rowId, possibleId, (p) => ({
            ...p,
            responsible: (p.responsible || []).map(r =>
                r.id === responsibleId ? { ...r, person: value } : r
            )
        }));
    };

    const handleActionChange = (rowId, possibleId, actionId, value) => {
        updatePossibleBlock(rowId, possibleId, (p) => ({
            ...p,
            actions: (p.actions || []).map(a =>
                a.id === actionId ? { ...a, action: value } : a
            )
        }));
    };


    const handleDueDateChange = (rowId, possibleId, dueDateId, value) => {
        updatePossibleBlock(rowId, possibleId, (p) => ({
            ...p,
            dueDate: (p.dueDate || []).map(d =>
                d.id === dueDateId ? { ...d, date: value } : d
            )
        }));
    };

    useEffect(() => {
        const wrapper = tableWrapperRef.current;
        if (!wrapper) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        const mouseDownHandler = (e) => {
            if (e.target.closest('input, textarea, select, button') || e.target.closest('.drag-handle') ||
                e.target.closest('.ibra-col-resizer')) {
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

            wrapperEl.style.width = `${boxW - 30}px`;
            // capture actual rendered width
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
        "nr", "main", "hazards", "source", "UE", "controls", "riskRank", ...(readOnly ? [] : ["action"]),
    ]);

    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const getDisplayColumns = () => {
        const raw = availableColumns
            .map(c => c.id)
            .filter(id => showColumns.includes(id));
        const expanded = [];
        raw.forEach(id => {
            if (id === "possible") {
                // insert its children instead of the group id
                expanded.push("actions", "responsible", "dueDate");
            } else if (!["actions", "responsible", "dueDate"].includes(id)) {
                // everything else (but not the children by themselves)
                expanded.push(id);
            }
        });
        while (expanded.length < 5) expanded.push(`blank-${expanded.length}`);
        if (!readOnly && !expanded.includes("action")) {
            expanded.push("action");
        }
        return expanded;
    };

    const popupRef = useRef(null);

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

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };

        const closeDropdowns = () => {
            setShowColumnSelector(null);
            setShowExeDropdown(null);
            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showColumnSelector, showExeDropdown, excelFilter]);

    useEffect(() => {
        if (!filterPopup.visible) return;

        const handleClickOutside = (e) => {
            // If click is inside the filter popup, do nothing
            if (e.target.closest('.jra-filter-popup')) return;

            // Otherwise close it
            setFilterPopup({ visible: false, column: null, pos: {} });
        };

        const handleAnyScroll = () => {
            setFilterPopup(prev =>
                prev.visible ? { visible: false, column: null, pos: {} } : prev
            );
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleAnyScroll, true);

        const wrapper = tableWrapperRef.current;
        if (wrapper) {
            wrapper.addEventListener('scroll', handleAnyScroll);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleAnyScroll, true);
            if (wrapper) {
                wrapper.removeEventListener('scroll', handleAnyScroll);
            }
        };
    }, [filterPopup.visible]);

    const insertRowAt = (afterRowId) => {
        const insertIndex = rows.findIndex(r => r.id === afterRowId);
        if (insertIndex === -1) return;

        const newRows = [...rows];
        const newRow = {
            id: uuidv4(),
            nr: 0,
            main: "", sub: "", owner: "", odds: "", riskRank: "",
            hazards: [], controls: [], S: "-", H: "-", E: "-", C: "-", LR: "-", M: "-",
            R: "-", source: "", material: "", priority: "",
            possible: [{
                id: uuidv4(),
                actions: [{ id: uuidv4(), action: "" }],
                responsible: [{ id: uuidv4(), person: "" }],
                dueDate: [{ id: uuidv4(), date: "" }]
            }],
            UE: "", additional: "", maxConsequence: ""
        };
        newRows.splice(insertIndex + 1, 0, newRow);
        newRows.forEach((row, idx) => {
            row.nr = idx + 1;
        });
        updateRow(newRows);
    };

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

    const handleInnerScrollWheel = (e) => {
        const el = e.currentTarget;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const delta = e.deltaY;
        const goingDown = delta > 0;

        const atTop = scrollTop <= 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1; // -1 for float rounding

        // block scroll chaining
        if ((goingDown && atBottom) || (!goingDown && atTop)) {
            e.preventDefault();
            e.stopPropagation();

            // tiny nudge to keep focus inside
            if (goingDown && atBottom) {
                el.scrollTop = scrollHeight - clientHeight;
            } else if (!goingDown && atTop) {
                el.scrollTop = 0;
            }
            return;
        }
        // else: let it scroll normally
    };

    const resizingColRef = useRef(null);
    const resizeStartXRef = useRef(0);
    const resizeStartWidthRef = useRef(0);

    const startColumnResize = (e, columnId) => {
        e.preventDefault();
        e.stopPropagation();

        isResizingRef.current = true;   // ← NEW

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
            // 1️⃣ update ONLY the dragged column
            const updated = { ...prev, [colId]: newWidth };

            // 2️⃣ recompute the overall table width as the sum of visible columns
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

        // Delay resetting so click event from same cycle is ignored
        setTimeout(() => {
            isResizingRef.current = false;
        }, 0);

        resizingColRef.current = null;
    };

    const [tableWidth, setTableWidth] = useState(null);
    const widthsInitializedRef = useRef(false);

    useEffect(() => {
        if (widthsInitializedRef.current) return;
        if (!tableWrapperRef.current) return;

        const wrapperEl = tableWrapperRef.current;
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

    const fitTableToWidth = () => {
        const wrapper = tableWrapperRef.current;
        if (!wrapper) return;

        // Get actual usable width (inside padding)
        const wrapperWidth = wrapper.getBoundingClientRect().width;
        if (!wrapperWidth) return;

        const visibleCols = getDisplayColumns().filter(
            id => typeof columnWidths[id] === "number"
        );
        if (!visibleCols.length) return;

        const prevWidths = visibleCols.map(id => columnWidths[id]);
        const totalWidth = prevWidths.reduce((a, b) => a + b, 0);

        // Only grow when too small
        if (totalWidth >= wrapperWidth) {
            setTableWidth(totalWidth);
            return;
        }

        const scale = wrapperWidth / totalWidth;

        // First pass: proportional scaling (floats)
        let newWidths = prevWidths.map(w => w * scale);

        // Convert to integers
        newWidths = newWidths.map(w => Math.round(w));

        // Fix rounding drift (sum might be off by a few px)
        let diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);

        // Distribute leftover pixels
        let i = 0;
        while (diff !== 0 && i < newWidths.length * 2) {
            newWidths[i % newWidths.length] += diff > 0 ? 1 : -1;
            diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);
            i++;
        }

        // Now sum is EXACTLY wrapperWidth

        setColumnWidths(prev => {
            const updated = { ...prev };
            visibleCols.forEach((id, index) => {
                updated[id] = newWidths[index];
            });
            return updated;
        });

        setTableWidth(wrapperWidth);
    };

    const getDefaultShowColumns = () => [
        "nr",
        "main",
        "hazards",
        "source",
        "UE",
        "controls",
        "riskRank",
        ...(readOnly ? [] : ["action"]),
    ];

    const resetTable = (visibleColumnIds) => {
        const wrapper = tableWrapperRef.current;
        if (!wrapper) return;

        const wrapperWidth = wrapper.getBoundingClientRect().width;
        if (!wrapperWidth) return;

        const visibleCols = (visibleColumnIds || getDisplayColumns()).filter(
            (id) => typeof initialColumnWidths[id] === "number"
        );
        if (!visibleCols.length) return;

        const prevWidths = visibleCols.map((id) => initialColumnWidths[id]);
        const totalWidth = prevWidths.reduce((a, b) => a + b, 0);
        if (!totalWidth) return;

        // Always scale to wrapper width (can grow OR shrink)
        const scale = wrapperWidth / totalWidth;

        // First pass: proportional scaling
        let newWidths = prevWidths.map((w) => w * scale);

        // Round to integers
        newWidths = newWidths.map((w) => Math.round(w));

        // Fix rounding drift so sum === wrapperWidth exactly
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

        setTableWidth(wrapperWidth);
    };

    const resetToDefaultColumnsAndFit = () => {
        const defaults = getDefaultShowColumns();

        // Reset which columns are shown
        setShowColumns(defaults);

        // Optionally close the column selector popup
        setShowColumnSelector(false);

        // Re-fit based on default columns
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

    // 1) Show fit button only when table is narrower
    const showFitButton =
        hasFittedOnce &&
        wrapperWidth > 0 &&
        tableWidth != null &&
        tableWidth < wrapperWidth - 1; // small tolerance

    // 2) Show reset when:
    //    - columns differ from default OR
    //    - widths no longer match wrapper
    const showResetButton =
        hasFittedOnce &&
        (!isUsingDefaultColumns || !isTableFitted);

    useEffect(() => {
        if (!hasFittedOnce) return;
        fitTableToWidth(getDisplayColumns(), true);
    }, [isSidebarVisible]);

    const toggleMainFlag = (rowId) => {
        if (readOnly) return;

        const newRows = rows.map(r =>
            r.id === rowId
                ? { ...r, mainFlag: !r.mainFlag }
                : r
        );

        // updateRow is the callback that replaces the full IBRA rows array
        updateRow(newRows);
    };

    const toggleFlagFilter = () => {
        setShowFlagged(prev => !prev);
    };

    function openExcelFilterPopup(colId, e) {
        if (colId === "nr" || colId === "action") return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        // CHANGE: Use the helper to get context-aware values
        const values = getAvailableOptions(colId);

        const existing = filters[colId];
        // Handle both array format (new) and object format (old)
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

        // if bottom off-screen -> place above header if possible
        if (popupRect.bottom > viewportH - margin) {
            const anchor = excelFilter.anchorRect;
            if (anchor) {
                const desiredTop = anchor.top - popupRect.height - 4;
                newTop = Math.max(margin, desiredTop);
            }
        }

        // keep within left/right bounds
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
    }, [excelFilter.open, excelFilter.pos.top, excelFilter.pos.left, excelFilter.anchorRect, excelSearch]);

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

    const flagBtnClass = getTopRightButtonClass(rightButtonSlot++);
    const filterBtnClass = getTopRightButtonClass(rightButtonSlot++);

    const getAvailableOptions = (colId) => {
        let filtered = rows;

        const COLUMN_ONLY_FILTERS = new Set([
            "hazards",
            "controls",
            "actions",
            "responsible",
            "dueDate"
        ]);

        for (const [filterColId, selectedValues] of Object.entries(filters)) {
            // Skip the current column to show all potential options for this column
            if (filterColId === colId) continue;

            // These filters only hide items within cells, they never exclude whole rows
            if (COLUMN_ONLY_FILTERS.has(filterColId)) continue;

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

    useLayoutEffect(() => {
        const rafId = window.requestAnimationFrame(() => {
            Object.keys(syncGroups.current).forEach(key => {
                syncHeight(key);
            });
        });

        return () => window.cancelAnimationFrame(rafId);
    }, [rows, collapsed, sortConfig, showColumns]);

    return (
        <div className="input-row-risk-ibra">
            <div className={`ibra-box ${error ? "error-create" : ""}`} ref={ibraBoxRef}>
                <h3 className="font-fam-labels">Issue Based Risk Assessment (IBRA) <span className="required-field">*</span></h3>
                <button
                    className={columnBtnClass}
                    title="Show / Hide Columns"
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                >
                    <FontAwesomeIcon icon={faTableColumns} className="icon-um-search" />
                </button>

                <button
                    className={downloadBtnClass}
                    title="Download IBRA Table"
                    onClick={generate}
                >
                    <FontAwesomeIcon icon={faDownload} className="icon-um-search" />
                </button>

                {showFitButton && (<button
                    className={fitBtnClass}
                    title="Fit To Width"
                    onClick={fitTableToWidth}
                >
                    <FontAwesomeIcon icon={faArrowsLeftRight} className="icon-um-search" />
                </button>)}

                {showResetButton && (<button
                    className={resetBtnClass}
                    title="Reset to Default"
                    onClick={resetToDefaultColumnsAndFit}
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

                {/*{filterMenu && (<FilterRemovePopup
                    isOpen={filterMenu.isOpen}
                    anchorRect={filterMenu.anchorRect}
                    onClose={() => setFilterMenu(prev => ({ ...prev, isOpen: false }))}
                    onClear={handleClearFilters}
                    onMouseEnter={cancelCloseFilterMenu}
                    onMouseLeave={closeFilterMenuWithDelay}
                />)}*/}

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

                            <div className="column-checkbox-container"
                                onWheel={handleInnerScrollWheel}>
                                {availableColumns.filter(column => !["actions", "responsible", "dueDate"].includes(column.id)).map(column => (
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
                    <>
                        <div className="table-wrapper-ibra" ref={tableWrapperRef}>
                            <table className="table-borders-ibra-table hide-tds"
                                style={{
                                    width: tableWidth ? `${tableWidth}px` : '100%', // first paint fallback
                                    tableLayout: 'fixed',
                                }}
                            >
                                <thead className="ibra-table-header">
                                    <tr>
                                        {displayColumns.map((columnId, idx) => {
                                            // — “Risk Treatment” group header — 
                                            if (columnId === 'actions') {
                                                return (
                                                    <th key={idx} className="ibraCent ibraRM" colSpan={3}>
                                                        Risk Treatment
                                                    </th>
                                                );
                                            }
                                            // — skip the two other children here —
                                            if (columnId === 'responsible' || columnId === 'dueDate') {
                                                return null;
                                            }
                                            // — everything else spans both rows —
                                            const col = availableColumns.find(c => c.id === columnId);
                                            if (col) {
                                                const limits = columnSizeLimits[columnId] || {};
                                                const width = columnWidths[columnId];

                                                return (
                                                    <th
                                                        key={idx}
                                                        className={`${col.className} ${!excludedColumns.includes(columnId) && filters[columnId] ? '' : ''}`}
                                                        rowSpan={2}
                                                        onClick={e => {
                                                            if (isResizingRef.current) return;
                                                            // Prevent opening if the user specifically clicked the resize handle
                                                            if (e.target.closest('.ibra-col-resizer')) return;

                                                            openExcelFilterPopup(columnId, e);
                                                        }}
                                                        style={{
                                                            position: 'relative',
                                                            width: width ? `${width}px` : undefined,
                                                            minWidth: limits.min ? `${limits.min}px` : undefined,
                                                            maxWidth: limits.max ? `${limits.max}px` : undefined,
                                                        }}
                                                    >
                                                        <span style={{ width: "100%" }}>{col.title}</span>
                                                        {columnId !== "nr" &&
                                                            (filters[columnId] || sortConfig.colId === columnId) && (
                                                                <FontAwesomeIcon
                                                                    icon={faFilter}
                                                                    className="active-filter-icon"
                                                                    style={{ marginLeft: "10px" }}
                                                                />
                                                            )}

                                                        {/* Resize handle */}
                                                        {!readOnly && (
                                                            <div
                                                                className="ibra-col-resizer"
                                                                onMouseDown={e => startColumnResize(e, columnId)}
                                                            />
                                                        )}
                                                    </th>
                                                );
                                            }
                                            // — blanks —
                                            return (
                                                <th key={idx} className="ibraCent ibraBlank" rowSpan={2} />
                                            );
                                        })}
                                    </tr>
                                    <tr>
                                        {displayColumns.map((columnId, idx) => {
                                            if (['actions', "responsible", 'dueDate'].includes(columnId)) {
                                                const col = availableColumns.find(c => c.id === columnId);
                                                const limits = columnSizeLimits[columnId] || {};
                                                const width = columnWidths[columnId];

                                                return (
                                                    <th
                                                        key={idx}
                                                        className={`${col.className} ${!excludedColumns.includes(columnId) && filters[columnId] ? '' : ''}`}
                                                        onClick={e => {
                                                            if (isResizingRef.current) return;
                                                            if (e.target.closest('.ibra-col-resizer')) return;

                                                            openExcelFilterPopup(columnId, e);
                                                        }}
                                                        style={{
                                                            position: 'relative',
                                                            width: width ? `${width}px` : undefined,
                                                            minWidth: limits.min ? `${limits.min}px` : undefined,
                                                            maxWidth: limits.max ? `${limits.max}px` : undefined,
                                                        }}
                                                    >
                                                        {col.icon ? <FontAwesomeIcon icon={col.icon} /> : col.title}
                                                        {(filters[columnId] || (sortConfig.colId === col.id && col.id !== "nr")) && (
                                                            <FontAwesomeIcon icon={faFilter} className="active-filter-icon" style={{ marginLeft: "10px" }} />
                                                        )}

                                                        {!readOnly && (
                                                            <div
                                                                className="ibra-col-resizer"
                                                                onMouseDown={e => startColumnResize(e, columnId)}
                                                            />
                                                        )}
                                                    </th>
                                                );
                                            }
                                            return null;
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRows.map((row, rowIndex) => {
                                        // 1. fallback to a single empty possibility if none exist
                                        const possibilities = Array.isArray(row.possible) && row.possible.length > 0
                                            ? row.possible
                                            : [{ possible: "", actions: [], dueDate: [] }]

                                        return possibilities.map((p, pi) => {
                                            const isFirst = pi === 0
                                            const isDragOver = dragOverRowId === row.id && isFirst;

                                            return (
                                                <tr
                                                    key={`${row.id}-${pi}`}
                                                    className={`${row.nr % 2 === 0 ? 'evenTRColour' : ''} ${isDragOver ? 'drag-over' : ''} ${dragOverRowId === row.id ? "drag-over-top" : ""}`}
                                                    draggable={isFirst && armedDragRow === row.id}
                                                    onDragStart={isFirst && armedDragRow === row.id
                                                        ? (e) => handleDragStart(e, row.id)
                                                        : undefined}
                                                    onDragOver={isFirst ? (e) => handleDragOver(e, row.id) : undefined}
                                                    onDragLeave={isFirst ? (e) => handleDragLeave(e) : undefined}
                                                    onDrop={isFirst ? (e) => handleDrop(e, row.id) : undefined}
                                                    onDragEnd={isFirst && armedDragRow === row.id ? handleDragEnd : undefined}
                                                >
                                                    {displayColumns.map((colId, idx) => {
                                                        const columnMeta = availableColumns.find(c => c.id === colId)
                                                        const colClass = columnMeta?.className || ""
                                                        const limits = columnSizeLimits[colId] || {};
                                                        const width = columnWidths[colId];
                                                        const commonCellStyle = {
                                                            width: width ? `${width}px` : undefined,
                                                            minWidth: limits.min ? `${limits.min}px` : undefined,
                                                            maxWidth: limits.max ? `${limits.max}px` : undefined,
                                                        };

                                                        if (colId === "additional") {
                                                            // only on the first “possible” row
                                                            if (!isFirst) return null;

                                                            const additionalText = row.additional;
                                                            return (
                                                                <td key={idx} className={`${colClass}  ibra-main-cell`} rowSpan={possibilities.length} style={commonCellStyle}>

                                                                    {additionalText
                                                                        ? <button
                                                                            className="ibra-view-additional-button"
                                                                            onClick={() => openNote(additionalText)}
                                                                        >
                                                                            View
                                                                        </button>
                                                                        : null
                                                                    }
                                                                </td>
                                                            );
                                                        }

                                                        {/*
                                                        if (colId === "actions") {
                                                            return (
                                                                <td key={idx} className={colClass} style={commonCellStyle}>
                                                                    {p.actions.map((a, ai) => (
                                                                        <div key={ai} style={{ marginBottom: '4px' }}>
                                                                            <div className="control-with-icons" key={ai}>
                                                                                <textarea
                                                                                    key={ai}
                                                                                    value={a.action}
                                                                                    placeholder="Insert Required Action"
                                                                                    onChange={e => handleActionChange(row.id, p.id, a.id, e.target.value)}
                                                                                    className="ibra-textarea-PI"
                                                                                    style={{ fontSize: "14px", resize: "none" }}
                                                                                    readOnly={readOnly}
                                                                                />
                                                                                {!readOnly && (<>
                                                                                    <FontAwesomeIcon
                                                                                        icon={faPlusCircle}
                                                                                        onClick={() => handleAddAction(row.id, p.id, a.id)}
                                                                                        className="control-icon-add-ibra magic-icon"
                                                                                        title="Add action required"
                                                                                        style={{ zIndex: 0 }}
                                                                                    />
                                                                                    {p.actions.length > 1 && (
                                                                                        <FontAwesomeIcon
                                                                                            icon={faTrash}
                                                                                            className="control-icon-remove-ibra magic-icon"
                                                                                            onClick={() => handleRemoveAction(row.id, p.id, a.id)}
                                                                                            title="Remove this action"
                                                                                            style={{ zIndex: 0 }}
                                                                                        />
                                                                                    )}
                                                                                </>)}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </td>
                                                            );
                                                        }

                                                        // ─── Risk-Treatment children ───
                                                        if (colId === "responsible") {
                                                            return (
                                                                <td key={idx} className={colClass} style={commonCellStyle}>
                                                                    {p.responsible.map((d, di) => (
                                                                        <div key={di} style={{ marginBottom: '3px', marginTop: "1px" }}>
                                                                            <input
                                                                                type="text"
                                                                                value={d.person}
                                                                                ref={el => {
                                                                                    const key = `${row.id}-${p.id}-${d.id}`;
                                                                                    if (el) {
                                                                                        responsibleInputRefs.current[key] = el;
                                                                                    } else {
                                                                                        delete responsibleInputRefs.current[key];
                                                                                    }
                                                                                }}
                                                                                onChange={e => handleResponsibleInput(row.id, p.id, d.id, e.target.value)}
                                                                                onFocus={e => handleResponsibleFocus(row.id, p.id, d.id, e.target.value)}
                                                                                className="ibra-textarea-PI"
                                                                                style={{ fontSize: "14px" }}
                                                                                placeholder="Insert or Select Responsible Person"
                                                                                readOnly={readOnly}
                                                                            />
                                                                        </div>
                                                                    ))}

                                                                </td>
                                                            );
                                                        }
                                                        if (colId === "dueDate") {
                                                            return (
                                                                <td key={idx} className={colClass} style={commonCellStyle}>
                                                                    {p.dueDate.map((d, di) => (
                                                                        <div key={di} style={{ marginBottom: '3px', marginTop: "1px", position: "relative" }}>
                                                                            <DatePicker
                                                                                value={d.date || null}
                                                                                format="YYYY-MM-DD"
                                                                                onChange={(val) => handleDueDateChange(row.id, p.id, d.id, val?.format("YYYY-MM-DD"))}
                                                                                highlightToday={false}       // 👈 disables automatic highlight
                                                                                editable={false}
                                                                                disabled={readOnly}
                                                                                inputClass="ibra-input-date"
                                                                                containerStyle={{ width: "100%" }}
                                                                                placeholder="YYYY-MM-DD"
                                                                                hideIcon={false}
                                                                                style={{
                                                                                    backgroundColor: "#fff",
                                                                                    borderColor: "#BFBFBF",
                                                                                    color: "black",         // text color
                                                                                    "--rmdp-primary-color": "#002060",  // ← highlight color (selected day, header accent)
                                                                                    "--rmdp-secondary-color": "#E6ECFF", // ← hover background color
                                                                                    pointerEvents: "auto",
                                                                                    zIndex: "5"
                                                                                }}
                                                                                onOpenPickNewDate={false}
                                                                            />
                                                                            {!!d.date ? (
                                                                                <button
                                                                                    type="button"
                                                                                    className="due-date-icon-btn"
                                                                                    title="Clear date"
                                                                                    disabled={readOnly}
                                                                                    onMouseDown={(e) => {
                                                                                        // prevent the datepicker opening and prevent wrapper drag
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                    }}
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        if (readOnly) return;
                                                                                        handleDueDateChange(row.id, p.id, d.id, "");
                                                                                    }}
                                                                                >
                                                                                    <FontAwesomeIcon icon={faX} />
                                                                                </button>
                                                                            ) : (
                                                                                <span className="due-date-icon-span" aria-hidden="true">
                                                                                    <FontAwesomeIcon icon={faCalendarDays} />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </td>
                                                            );
                                                        }
                                                        */}

                                                        if (colId === "actions") {
                                                            const visibleLinkedItems = getVisibleLinkedItems(p);

                                                            return (
                                                                <td key={idx} className={colClass} style={commonCellStyle}>
                                                                    {visibleLinkedItems.map((item, ai, arr) => {
                                                                        const a = item.action;
                                                                        const syncKey = `${row.id}-${p.id}-${ai}`;
                                                                        const showDivider = arr.length > 1 && ai < arr.length - 1;

                                                                        return (
                                                                            <div
                                                                                key={a.id || ai}
                                                                                className={`ibra-linked-item ${showDivider ? "has-divider" : ""}`}
                                                                                ref={el => {
                                                                                    let group = syncGroups.current[syncKey] || [];

                                                                                    if (el) {
                                                                                        if (!group.includes(el)) group.push(el);
                                                                                    } else {
                                                                                        group = group.filter(node => node?.isConnected);
                                                                                    }

                                                                                    syncGroups.current[syncKey] = group;
                                                                                }}
                                                                            >
                                                                                <div className="ibra-linked-item-content">
                                                                                    <div className="ibra-linked-display" style={{ fontSize: "14px" }}>
                                                                                        {a.action || ""}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </td>
                                                            );
                                                        }

                                                        if (colId === "responsible") {
                                                            const visibleLinkedItems = getVisibleLinkedItems(p);

                                                            return (
                                                                <td key={idx} className={colClass} style={commonCellStyle}>
                                                                    {visibleLinkedItems.map((item, ri, arr) => {
                                                                        const r = item.responsible;
                                                                        const syncKey = `${row.id}-${p.id}-${ri}`;
                                                                        const showDivider = arr.length > 1 && ri < arr.length - 1;

                                                                        return (
                                                                            <div
                                                                                key={r.id || ri}
                                                                                className={`ibra-linked-item ${showDivider ? "has-divider" : ""}`}
                                                                                ref={el => {
                                                                                    let group = syncGroups.current[syncKey] || [];

                                                                                    if (el) {
                                                                                        if (!group.includes(el)) group.push(el);
                                                                                    } else {
                                                                                        group = group.filter(node => node?.isConnected);
                                                                                    }

                                                                                    syncGroups.current[syncKey] = group;
                                                                                }}
                                                                            >
                                                                                <div className="ibra-linked-item-content">
                                                                                    <div className="ibra-linked-display" style={{ fontSize: "14px" }}>
                                                                                        {r.person || ""}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </td>
                                                            );
                                                        }

                                                        if (colId === "dueDate") {
                                                            const visibleLinkedItems = getVisibleLinkedItems(p);

                                                            return (
                                                                <td key={idx} className={colClass} style={commonCellStyle}>
                                                                    {visibleLinkedItems.map((item, di, arr) => {
                                                                        const d = item.dueDate;
                                                                        const syncKey = `${row.id}-${p.id}-${di}`;
                                                                        const showDivider = arr.length > 1 && di < arr.length - 1;

                                                                        return (
                                                                            <div
                                                                                key={d.id || di}
                                                                                className={`ibra-linked-item ${showDivider ? "has-divider" : ""}`}
                                                                                ref={el => {
                                                                                    let group = syncGroups.current[syncKey] || [];

                                                                                    if (el) {
                                                                                        if (!group.includes(el)) group.push(el);
                                                                                    } else {
                                                                                        group = group.filter(node => node?.isConnected);
                                                                                    }

                                                                                    syncGroups.current[syncKey] = group;
                                                                                }}
                                                                            >
                                                                                <div className="ibra-linked-item-content">
                                                                                    <div className="ibra-linked-display" style={{ fontSize: "14px" }}>
                                                                                        {d.date || ""}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </td>
                                                            );
                                                        }

                                                        // ─── everything else only on the first nested row ───
                                                        if (!isFirst) return null

                                                        const cellData = row[colId]

                                                        if (colId === "main") {
                                                            if (!isFirst) return null;
                                                            return (
                                                                <td
                                                                    key={idx}
                                                                    rowSpan={possibilities.length}
                                                                    className={`${colClass} ibra-main-cell correct-wrap-ibra`}
                                                                    style={{ ...commonCellStyle, whiteSpace: "pre-wrap" }}
                                                                >
                                                                    {/* Main text */}
                                                                    {cellData}
                                                                </td>
                                                            );
                                                        }

                                                        if (colId === "sub") {
                                                            if (!isFirst) return null;

                                                            return (
                                                                <td
                                                                    key={idx}
                                                                    rowSpan={possibilities.length}
                                                                    className={`${colClass} ibra-main-cell correct-wrap-ibra`}
                                                                    style={{ ...commonCellStyle, whiteSpace: "pre-wrap" }}
                                                                >
                                                                    {cellData}
                                                                </td>
                                                            );
                                                        }

                                                        if (colId === "owner") {
                                                            if (!isFirst) return null;

                                                            return (
                                                                <td
                                                                    key={idx}
                                                                    rowSpan={possibilities.length}
                                                                    className={`${colClass} ibra-main-cell correct-wrap-ibra`}
                                                                    style={{ ...commonCellStyle, whiteSpace: "pre-wrap" }}
                                                                >
                                                                    {cellData}
                                                                </td>
                                                            );
                                                        }

                                                        if (colId === "odds") {
                                                            if (!isFirst) return null;

                                                            return (
                                                                <td
                                                                    key={idx}
                                                                    rowSpan={possibilities.length}
                                                                    className={`${colClass} ibra-main-cell correct-wrap-ibra`}
                                                                    style={{ ...commonCellStyle, whiteSpace: "pre-wrap" }}
                                                                >
                                                                    {cellData}
                                                                </td>
                                                            );
                                                        }

                                                        // blank fillers
                                                        if (colId.startsWith("blank-")) {
                                                            return <td key={idx} rowSpan={possibilities.length}></td>
                                                        }

                                                        // Colour‐coded Max Risk Rank
                                                        if (colId === "riskRank") {
                                                            if (!isFirst) return null;
                                                            // parse the leading number (fall back to 0)
                                                            const num = parseInt(String(row.riskRank).split(" ")[0], 10) || 0;
                                                            // pick the CSS class
                                                            let colourClass = "";
                                                            if (num >= 1 && num <= 5) colourClass = "ibra-popup-page-input-green";
                                                            else if (num >= 6 && num <= 12) colourClass = "ibra-popup-page-input-yellow";
                                                            else if (num >= 13 && num <= 20) colourClass = "ibra-popup-page-input-orange";
                                                            else if (num >= 21) colourClass = "ibra-popup-page-input-red";

                                                            return (
                                                                <td
                                                                    key={idx}
                                                                    className={`${colClass} ${colourClass} ibra-main-cell correct-wrap-ibra`}
                                                                    rowSpan={possibilities.length}
                                                                    style={{ ...commonCellStyle, whiteSpace: "pre-wrap" }}
                                                                >
                                                                    {row.riskRank}
                                                                </td>
                                                            )
                                                        }

                                                        if (colId === "priority") {
                                                            if (!isFirst) return null;
                                                            let colourClass = "";
                                                            if (row.priority === "Yes") colourClass = "ibra-popup-page-input-orange";
                                                            return (
                                                                <td
                                                                    key={idx}
                                                                    className={`${colClass} ${colourClass} correct-wrap-ibra`}
                                                                    rowSpan={possibilities.length}
                                                                    style={{ ...commonCellStyle, whiteSpace: "pre-wrap" }}
                                                                >
                                                                    {row.priority}
                                                                </td>
                                                            )
                                                        }

                                                        if (colId === "material") {
                                                            if (!isFirst) return null;
                                                            let colourClass = "";
                                                            if (row.material === "Yes") colourClass = "ibra-popup-page-input-red";
                                                            return (
                                                                <td
                                                                    key={idx}
                                                                    className={`${colClass} ${colourClass} correct-wrap-ibra`}
                                                                    rowSpan={possibilities.length}
                                                                    style={{ ...commonCellStyle, whiteSpace: "pre-wrap" }}
                                                                >
                                                                    {row.material}
                                                                </td>
                                                            )
                                                        }

                                                        if (colId === "maxConsequence") {
                                                            if (!isFirst) return null;

                                                            return (
                                                                <td
                                                                    key={idx}
                                                                    rowSpan={possibilities.length}
                                                                    style={{ ...commonCellStyle, textAlign: "left", whiteSpace: "pre-wrap" }}
                                                                    className="correct-wrap-ibra ibra-main-cell"
                                                                >
                                                                    {row.maxConsequence}
                                                                </td>
                                                            )
                                                        }

                                                        if (colId === "UE") {
                                                            if (!isFirst) return null;

                                                            return (
                                                                <td
                                                                    key={idx}
                                                                    rowSpan={possibilities.length}
                                                                    style={{ ...commonCellStyle, textAlign: "left", whiteSpace: "pre-wrap" }}
                                                                    className={`${colId === "UE" ? "unwanted-event-borders" : ""} correct-wrap-ibra  ibra-main-cell`}
                                                                >
                                                                    {row.UE}
                                                                </td>
                                                            )
                                                        }

                                                        if (colId === "source") {
                                                            if (!isFirst) return null;

                                                            return (
                                                                <td
                                                                    key={idx}
                                                                    rowSpan={possibilities.length}
                                                                    style={{ ...commonCellStyle, textAlign: "left", whiteSpace: "pre-wrap" }}
                                                                    className="correct-wrap-ibra  ibra-main-cell"
                                                                >
                                                                    {row.source}
                                                                </td>
                                                            )
                                                        }

                                                        // Nr column (with your arrow-icon logic)
                                                        if (colId === "nr") {
                                                            const isFlagged = !!row.mainFlag || !!row.subFlag || !!row.ownerFlag || !!row.oddsFlag || !!row.riskRankFlag || !!row.maxConsequenceFlag || !!row.controlFlag || !!row.hazardFlag || !!row.sourceFlag || !!row.ueFlag || !!row.additionalFlag;

                                                            return (
                                                                <td
                                                                    key={idx}
                                                                    className={`${colClass} correct-wrap-ibra`}
                                                                    rowSpan={possibilities.length}
                                                                    style={{ ...commonCellStyle, alignItems: 'center', gap: '0px', whiteSpace: "pre-wrap", position: "relative" }}
                                                                >
                                                                    {isFlagged && (<span
                                                                        className={
                                                                            "ibra-main-flag-icon" +
                                                                            (isFlagged ? " active" : "")
                                                                        }
                                                                        title={isFlagged ? "Unflag main area" : "Flag main area"}
                                                                    >
                                                                        <FontAwesomeIcon icon={faFlag} />
                                                                    </span>)}
                                                                    <span>{cellData}</span>
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
                                                                            setSelectedRowData(row)
                                                                            setIbraPopup(true)
                                                                            if (error) {
                                                                                setErrors(prev => ({ ...prev, ibra: false })); // Clear IBRA error on click
                                                                            }
                                                                        }}
                                                                    />

                                                                </td>
                                                            )
                                                        }

                                                        // Action buttons
                                                        if (colId === "action") {
                                                            return (
                                                                <td key={idx} className={colClass} rowSpan={possibilities.length} style={commonCellStyle}>
                                                                    <div className="ibra-action-buttons">
                                                                        <button
                                                                            className="ibra-remove-row-button"
                                                                            title="Delete row"
                                                                            onClick={() => removeRow(row.id)}
                                                                        >
                                                                            <FontAwesomeIcon icon={faTrash} />
                                                                        </button>
                                                                        <button
                                                                            className="ibra-add-row-button"
                                                                            title="Insert row below"
                                                                            onClick={() => insertRowAt(row.id)}
                                                                        >
                                                                            <FontAwesomeIcon icon={faPlusCircle} />
                                                                        </button>
                                                                        <button
                                                                            className="ibra-add-row-button"
                                                                            title="Duplicate row"
                                                                            onClick={() => handleDuplicateRow(row.id)}
                                                                            style={{ display: 'block', marginTop: '4px' }}
                                                                        >
                                                                            <FontAwesomeIcon icon={faCopy} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            )
                                                        }

                                                        if (colId === "hazards") {
                                                            if (!isFirst) return null;

                                                            return (
                                                                <td
                                                                    key={idx}
                                                                    className={`${colClass}  ibra-main-cell`}
                                                                    rowSpan={possibilities.length}
                                                                    style={commonCellStyle}
                                                                >
                                                                    {/* Existing hazards list rendering */}
                                                                    {Array.isArray(row.hazards) ? (
                                                                        <ul
                                                                            style={{
                                                                                paddingLeft: "20px",
                                                                                margin: 0,
                                                                                marginRight: "10px",
                                                                                textAlign: "left",
                                                                            }}
                                                                        >
                                                                            {row.hazards
                                                                                .filter(item => {
                                                                                    const value = typeof item === "string" ? item : item?.hazard;
                                                                                    return isSelectedOrNoFilter("hazards", value);
                                                                                })
                                                                                .map((item, i) => (
                                                                                    <li key={i} style={{ paddingLeft: "5px" }}>
                                                                                        {typeof item === "string" ? item : item.hazard || ""}
                                                                                    </li>
                                                                                ))}
                                                                        </ul>
                                                                    ) : (
                                                                        row.hazards
                                                                    )}
                                                                </td>
                                                            );
                                                        }

                                                        if (colId === "controls") {
                                                            if (!isFirst) return null;

                                                            return (
                                                                <td
                                                                    key={idx}
                                                                    className={`${colClass}  ibra-main-cell`}
                                                                    rowSpan={possibilities.length}
                                                                    style={commonCellStyle}
                                                                >
                                                                    {/* Existing controls list rendering */}
                                                                    {Array.isArray(row.controls) ? (
                                                                        <ul
                                                                            style={{
                                                                                paddingLeft: "20px",
                                                                                margin: 0,
                                                                                marginRight: "10px",
                                                                                textAlign: "left",
                                                                            }}
                                                                        >
                                                                            {row.controls
                                                                                .filter(item => {
                                                                                    const value = typeof item === "string" ? item : item?.control;
                                                                                    return isSelectedOrNoFilter("controls", value);
                                                                                })
                                                                                .map((item, i) => (
                                                                                    <li key={i} style={{ paddingLeft: "5px" }}>
                                                                                        {typeof item === "string" ? item : item.control || ""}
                                                                                    </li>
                                                                                ))}
                                                                        </ul>
                                                                    ) : (
                                                                        row.controls
                                                                    )}
                                                                </td>
                                                            );
                                                        }

                                                        // Default: strings or arrays
                                                        return (
                                                            <td key={idx} className={colClass} rowSpan={possibilities.length}>
                                                                {Array.isArray(cellData)
                                                                    ? (
                                                                        <ul style={{ paddingLeft: '20px', margin: 0, marginRight: '10px', textAlign: "left" }}>
                                                                            {cellData.map((item, i) => (
                                                                                <li key={i} style={{ paddingLeft: '5px' }}>{item}</li>
                                                                            ))}
                                                                        </ul>
                                                                    )
                                                                    : cellData
                                                                }
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            )
                                        })
                                    })}
                                </tbody>


                            </table>

                        </div>
                        {!readOnly && (<button className="add-row-button-ds-risk font-fam" onClick={addRow}>
                            <FontAwesomeIcon icon={faPlusCircle} title="Add Row" />
                        </button>)}
                    </>
                )}
            </div>
            {showNote && (<IbraNote setClose={closeNote} text={noteText} />)}
            {ibraPopup && (<IBRAPopup onClose={closePopup} data={selectedRowData} onSave={handleSaveWithRiskTreatment} rowsData={rows} readOnly={readOnly} availableControls={relevantControls} />)}

            {showExeDropdown && filteredExe.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: 'fixed',
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        zIndex: 1000
                    }}
                >
                    {filteredExe.sort().filter(term => term && term.trim() !== "").map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectResponsibleSuggestion(term)}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
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

                        // Use the helper to get values that respect other active filters
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
                            // i.e., if the selected items match the available items exactly
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
    );
};

export default IBRATable;