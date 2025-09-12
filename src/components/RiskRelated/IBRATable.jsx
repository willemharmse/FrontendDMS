import React, { useEffect, useState, useRef, useMemo } from "react";
import './IBRATable.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlusCircle, faTableColumns, faTimes, faGripVertical, faInfoCircle, faArrowUpRightFromSquare, faCheck, faDownload, faArrowsUpDown, faCopy, faFilter } from '@fortawesome/free-solid-svg-icons';
import IBRAPopup from "./IBRAPopup";
import IbraNote from "./RiskInfo/IbraNote";
import UnwantedEvent from "./RiskInfo/UnwantedEvent";
import { v4 as uuidv4 } from 'uuid';
import axios from "axios";

const IBRATable = ({ rows, updateRows, addRow, removeRow, generate, updateRow, isSidebarVisible, error, setErrors, readOnly = false }) => {
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

    const excludedColumns = ["UE", "S", "H", "E", "C", "LR", "M", "R", "actions", "responsible", "dueDate"];

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

    const filteredRows = useMemo(() => {
        return rows.filter(row => {
            for (const [col, value] of Object.entries(filters)) {
                const text = value.toLowerCase();
                if (col === 'main') {
                    if (!row.main.toLowerCase().includes(text)) return false;
                } else if (col === 'sub') {
                    if (!row.sub.toLowerCase().includes(text)) return false;
                } else if (col === 'owner') {
                    if (!row.owner.toLowerCase().includes(text)) return false;
                } else if (col === 'odds') {
                    if (!row.odds.toLowerCase().includes(text)) return false;
                } else if (col === 'riskRank') {
                    if (!row.riskRank.toLowerCase().includes(text)) return false;
                } else if (col === 'hazards') {
                    if (!row.hazards?.some(h => {
                        if (typeof h === 'string') return h.toLowerCase().includes(text);
                        if (typeof h === 'object' && h.hazard) return h.hazard.toLowerCase().includes(text);
                        return false;
                    })) return false;
                } else if (col === 'controls') {
                    if (!row.controls?.some(c => {
                        if (typeof c === 'string') return c.toLowerCase().includes(text);
                        if (typeof c === 'object' && c.control) return c.control.toLowerCase().includes(text);
                        return false;
                    })) return false;
                } else if (['S', 'H', 'E', 'C', 'LR', 'M', 'R'].includes(col)) {
                    if (!String(row[col]).toLowerCase().includes(text)) return false;
                } else if (col === 'source') {
                    if (!row.source.toLowerCase().includes(text)) return false;
                } else if (col === 'material') {
                    if (!row.material.toLowerCase().includes(text)) return false;
                } else if (col === 'priority') {
                    if (!row.priority.toLowerCase().includes(text)) return false;
                } else if (col === 'UE') {
                    if (!row.UE.toLowerCase().includes(text)) return false;
                } else if (col === 'additional') {
                    if (!row.additional.toLowerCase().includes(text)) return false;
                } else if (col === 'maxConsequence') {
                    if (!row.maxConsequence.toLowerCase().includes(text)) return false;
                } else if (col === 'possibleActions') {
                    if (!row.possible?.some(p =>
                        p.actions?.some(a => a.action?.toLowerCase().includes(text))
                    )) return false;
                } else if (col === 'possibleResponsible') {
                    if (!row.possible?.some(p =>
                        p.responsible?.some(r => r.person?.toLowerCase().includes(text))
                    )) return false;
                } else if (col === 'possibleDueDate') {
                    if (!row.possible?.some(p =>
                        p.dueDate?.some(d => d.date?.toLowerCase().includes(text))
                    )) return false;
                }
            }
            return true;
        });
    }, [rows, filters]);

    function openFilterPopup(colId, e) {
        if (colId === "nr" || colId === "action") return;
        const rect = e.target.getBoundingClientRect();
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
        { id: "owner", title: "Functional Ownership", className: "ibraCent ibraNotes", icon: null },
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
        const { rowIndex, possibleIndex } = findRowAndPossibleById(rowId, possibleId);
        if (rowIndex === -1 || possibleIndex === -1) return;

        const newRows = [...rows];
        const block = newRows[rowIndex].possible[possibleIndex];
        const responsible = block.responsible.find(r => r.id === responsibleId);
        if (responsible) {
            responsible.person = value;
            updateRow(newRows);
        }
    };

    const handleActionChange = (rowId, possibleId, actionId, value) => {
        const { rowIndex, possibleIndex } = findRowAndPossibleById(rowId, possibleId);
        if (rowIndex === -1 || possibleIndex === -1) return;

        const newRows = [...rows];
        const block = newRows[rowIndex].possible[possibleIndex];
        const action = block.actions.find(a => a.id === actionId);
        if (action) action.action = value;

        updateRow(newRows);
    };

    const handleDueDateChange = (rowId, possibleId, dueDateId, value) => {
        const { rowIndex, possibleIndex } = findRowAndPossibleById(rowId, possibleId);
        if (rowIndex === -1 || possibleIndex === -1) return;

        const newRows = [...rows];
        const block = newRows[rowIndex].possible[possibleIndex];
        const due = block.dueDate.find(d => d.id === dueDateId);
        if (due) due.date = value;

        updateRow(newRows);
    };

    useEffect(() => {
        const wrapper = tableWrapperRef.current;
        if (!wrapper) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        const mouseDownHandler = (e) => {
            if (e.target.closest('input, textarea, select, button') || e.target.closest('.drag-handle')) {
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
            if (!ibraBoxRef.current || !tableWrapperRef.current) return;
            const boxW = ibraBoxRef.current.offsetWidth;
            tableWrapperRef.current.style.width = `${boxW - 30}px`;
        };
        window.addEventListener('resize', adjust);
        adjust();
        return () => window.removeEventListener('resize', adjust);
    }, []);

    useEffect(() => {
        const wrapper = tableWrapperRef.current;
        if (!wrapper) return;

        if (!isSidebarVisible) {
            savedWidthRef.current = wrapper.offsetWidth;
        } else if (savedWidthRef.current != null) {
            wrapper.style.width = `${savedWidthRef.current}px`;
            return;
        }
        const boxW = ibraBoxRef.current.offsetWidth;
        wrapper.style.width = `${boxW - 30}px`;
    }, [isSidebarVisible]);

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

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest(columnSelector) &&
                !e.target.closest('input');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(popupSelector) || e.target.closest(columnSelector);
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
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showColumnSelector, showExeDropdown]);

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

    return (
        <div className="input-row-risk-ibra">
            <div className={`ibra-box ${error ? "error-create" : ""}`} ref={ibraBoxRef}>
                <h3 className="font-fam-labels">Issue Based Risk Assessment (IBRA) <span className="required-field">*</span></h3>
                <button
                    className="top-right-button-ibra"
                    title="Show / Hide Columns"
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                >
                    <FontAwesomeIcon icon={faTableColumns} className="icon-um-search" />
                </button>

                <button
                    className="top-right-button-ibra2"
                    title="Download IBRA"
                    onClick={generate}
                >
                    <FontAwesomeIcon icon={faDownload} className="icon-um-search" />
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

                <div className="table-wrapper-ibra" ref={tableWrapperRef}>
                    <table className="table-borders-ibra-table">
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
                                        return (
                                            <th key={idx} className={`${col.className} ${!excludedColumns.includes(columnId) && filters[columnId] ? 'jra-filter-active' : ''}`} rowSpan={2}
                                                onClick={e => openFilterPopup(columnId, e)}>
                                                {col.icon ? <FontAwesomeIcon icon={col.icon} /> : col.title}{filters[columnId] && (
                                                    <FontAwesomeIcon icon={faFilter} className="active-filter-icon" style={{ marginLeft: "10px" }} />
                                                )}
                                            </th>
                                        );
                                    }
                                    // — blanks —
                                    return (
                                        <th key={idx} className="ibraCent ibraBlank" rowSpan={2}
                                            onClick={e => openFilterPopup(columnId, e)} />
                                    );
                                })}
                            </tr>
                            <tr>
                                {displayColumns.map((columnId, idx) => {
                                    if (['actions', "responsible", 'dueDate'].includes(columnId)) {
                                        const col = availableColumns.find(c => c.id === columnId);
                                        return (
                                            <th key={idx} className={`${col.className} ${!excludedColumns.includes(columnId) && filters[columnId] ? 'jra-filter-active' : ''}`}
                                                onClick={e => openFilterPopup(columnId, e)}>
                                                {col.icon ? <FontAwesomeIcon icon={col.icon} /> : col.title}{filters[columnId] && (
                                                    <FontAwesomeIcon icon={faFilter} className="active-filter-icon" style={{ marginLeft: "10px" }} />
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

                                                if (colId === "additional") {
                                                    // only on the first “possible” row
                                                    if (!isFirst) return null;

                                                    const additionalText = row.additional;
                                                    return (
                                                        <td key={idx} className={colClass} rowSpan={possibilities.length}>
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

                                                if (colId === "actions") {
                                                    return (
                                                        <td key={idx} className={colClass}>
                                                            {p.actions.map((a, ai) => (
                                                                <div key={ai} style={{ marginBottom: '4px' }}>
                                                                    <div className="control-with-icons" key={ai}>
                                                                        <textarea
                                                                            key={ai}
                                                                            value={a.action}
                                                                            placeholder="Insert Required Action"
                                                                            onChange={e => handleActionChange(row.id, p.id, a.id, e.target.value)}
                                                                            className="ibra-textarea-PI"
                                                                            style={{ fontSize: "14px" }}
                                                                            readOnly={readOnly}
                                                                        />
                                                                        {!readOnly && (<>
                                                                            <FontAwesomeIcon
                                                                                icon={faPlusCircle}
                                                                                onClick={() => handleAddAction(row.id, p.id, a.id)}
                                                                                className="control-icon-add-ibra magic-icon"
                                                                                title="Add action required" />
                                                                            {p.actions.length > 1 && (
                                                                                <FontAwesomeIcon
                                                                                    icon={faTrash}
                                                                                    className="control-icon-remove-ibra magic-icon"
                                                                                    onClick={() => handleRemoveAction(row.id, p.id, a.id)}
                                                                                    title="Remove this action"
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
                                                        <td key={idx} className={colClass}>
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
                                                        <td key={idx} className={colClass}>
                                                            {p.dueDate.map((d, di) => (
                                                                <div key={di} style={{ marginBottom: '3px', marginTop: "1px" }}>
                                                                    <input
                                                                        type="date"
                                                                        style={{ fontFamily: "Arial", fontSize: "14px" }}
                                                                        value={d.date}
                                                                        onChange={e => handleDueDateChange(row.id, p.id, d.id, e.target.value)}
                                                                        className="ibra-input-date"
                                                                        readOnly={readOnly}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </td>
                                                    );
                                                }

                                                // ─── everything else only on the first nested row ───
                                                if (!isFirst) return null

                                                const cellData = row[colId]

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
                                                            className={`${colClass} ${colourClass} correct-wrap-ibra`}
                                                            rowSpan={possibilities.length}
                                                            style={{ whiteSpace: "pre-wrap" }}
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
                                                            style={{ whiteSpace: "pre-wrap" }}
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
                                                            style={{ whiteSpace: "pre-wrap" }}
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
                                                            style={{ textAlign: "left", whiteSpace: "pre-wrap" }}
                                                            className="correct-wrap-ibra"
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
                                                            style={{ textAlign: "left", whiteSpace: "pre-wrap" }}
                                                            className={`${colId === "UE" ? "unwanted-event-borders" : ""} correct-wrap-ibra`}
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
                                                            style={{ textAlign: "left", whiteSpace: "pre-wrap" }}
                                                            className="correct-wrap-ibra"
                                                        >
                                                            {row.source}
                                                        </td>
                                                    )
                                                }

                                                // Nr column (with your arrow-icon logic)
                                                if (colId === "nr") {
                                                    return (
                                                        <td
                                                            key={idx}
                                                            className={`${colClass} correct-wrap-ibra`}
                                                            rowSpan={possibilities.length}
                                                            style={{ alignItems: 'center', gap: '0px', whiteSpace: "pre-wrap" }}
                                                        >
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
                                                        <td key={idx} className={colClass} rowSpan={possibilities.length}>
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

                                                // Default: strings or arrays
                                                return (
                                                    <td key={idx} className={colClass} rowSpan={possibilities.length}>
                                                        {Array.isArray(cellData)
                                                            ? (
                                                                <ul style={{ paddingLeft: '20px', margin: 0, marginRight: '50px', textAlign: "left" }}>
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
            </div>
            {showNote && (<IbraNote setClose={closeNote} text={noteText} />)}
            {ibraPopup && (<IBRAPopup onClose={closePopup} data={selectedRowData} onSave={handleSaveWithRiskTreatment} rowsData={rows} readOnly={readOnly} />)}

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

            {filterPopup.visible && (
                <div
                    className="jra-filter-popup"
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
    );
};

export default IBRATable;