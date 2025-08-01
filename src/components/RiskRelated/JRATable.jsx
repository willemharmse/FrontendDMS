import React, { useEffect, useState, useRef, useMemo, useLayoutEffect, startTransition } from "react";
import './JRATable.css';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faArrowsUpDown, faCopy, faMagicWandSparkles, faTableColumns, faTimes, faInfoCircle, faCirclePlus, faDownload, faSpinner, faPlusCircle, faArrowUpRightFromSquare, faFilter } from '@fortawesome/free-solid-svg-icons';
import Hazard from "./RiskInfo/Hazard";
import UnwantedEvent from "./RiskInfo/UnwantedEvent";
import TaskExecution from "./RiskInfo/TaskExecution";
import ControlExecution from "./RiskInfo/ControlExecution";
import CurrentControls from "./RiskInfo/CurrentControls";
import { saveAs } from 'file-saver';
import axios from "axios";
import HazardJRA from "./RiskInfo/HazardJRA";
import Go_Nogo from "./RiskInfo/Go_Nogo";
import CurrentControlsJRA from "./RiskInfo/CurrentControlsJRA";
import JRAPopup from "./JRAPopup";

const JRATable = ({ formData, setFormData, isSidebarVisible }) => {
    const [rowData, setRowData] = useState([]);
    const [showJRAPopup, setShowJRAPopup] = useState(false);
    const ibraBoxRef = useRef(null);
    const [filters, setFilters] = useState({});
    const tableWrapperRef = useRef(null);
    const [hoveredBody, setHoveredBody] = useState({ rowId: null, bodyIdx: null });
    const savedWidthRef = useRef(null);
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
    }, [formData.jra]);

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

    const handleDuplicateRow = (rowIndex) => {
        setFormData(prev => {
            const newJra = [...prev.jra];
            const rowCopy = JSON.parse(JSON.stringify(newJra[rowIndex]));
            rowCopy.id = uuidv4();
            rowCopy.jraBody = rowCopy.jraBody.map(body => ({
                ...body,
                idBody: uuidv4()
            }));
            newJra.splice(rowIndex + 1, 0, rowCopy);
            newJra.forEach((r, idx) => { r.nr = idx + 1; });
            return { ...prev, jra: newJra };
        });
    };

    const openHazardsHelp = () => {
        setHelpHazards(true);
    };

    const openUnwantedEventsHelp = () => {
        setHelpUnwantedEvents(true);
    };

    const openResponsibleHelp = () => {
        setHelpResponsible(true);
    };

    const openSubHelp = () => {
        setHelpSub(true);
    };

    const openTaskExecutionHelp = () => {
        setHelpTaskExecution(true);
    };

    const openGo_noGo = () => {
        setGo_noGO(true)
    }

    const closeGo_noGo = () => {
        setGo_noGO(false)
    }

    const closeHazardsHelp = () => {
        setHelpHazards(false);
    };

    const closeUnwantedEventsHelp = () => {
        setHelpUnwantedEvents(false);
    };

    const closeResponsibleHelp = () => {
        setHelpResponsible(false);
    };

    const closeSubHelp = () => {
        setHelpSub(false);
    };

    const closeTaskExecutionHelp = () => {
        setHelpTaskExecution(false);
    };

    const [filterPopup, setFilterPopup] = useState({
        visible: false,
        column: null,
        pos: { top: 0, left: 0, width: 0 }
    });

    function extractBodyValues(body, colId) {
        switch (colId) {
            case "hazards": return body.hazards.map(h => h.hazard);
            case "UE": return body.UE.map(u => u.ue);
            case "sub": return body.sub.map(s => s.task);
            case "taskExecution": return body.taskExecution.map(te => te.R);
            case "controls": return body.controls.map(c => c.control);
            default: return [];
        }
    }

    function applyFilter(value) {
        setFilters(prev => ({
            ...prev,
            [filterPopup.column]: value
        }));
        setFilterPopup(prev => ({ ...prev, visible: false }));
    }

    function clearFilter() {
        setFilters(prev => {
            const next = { ...prev };
            delete next[filterPopup.column];
            return next;
        });
        setFilterPopup(prev => ({ ...prev, visible: false }));
    }

    function openFilterPopup(colId, e) {
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

    const filteredRows = formData.jra.reduce((acc, row) => {
        let keepRow = true;
        let survivingBodies = row.jraBody;

        for (const [colId, text] of Object.entries(filters)) {
            const lcText = text.toLowerCase();

            if (colId === "nr") {
                if (!String(row.nr).toLowerCase().includes(lcText)) {
                    keepRow = false;
                    break;
                }
            } else if (colId === "main") {
                if (!row.main.toLowerCase().includes(lcText)) {
                    keepRow = false;
                    break;
                }
            } else {
                survivingBodies = survivingBodies.filter(body =>
                    extractBodyValues(body, colId)
                        .some(val => val.toLowerCase().includes(lcText))
                );
                if (survivingBodies.length === 0) {
                    keepRow = false;
                    break;
                }
            }
        }

        if (keepRow) {
            acc.push({ ...row, jraBody: survivingBodies });
        }
        return acc;

    }, []);

    const insertBodyRow = (rowId, insertAtIndex) => {
        setFormData(prev => {
            const newJra = prev.jra.map(item => {
                if (item.id !== rowId) return item;

                const newEntry = {
                    idBody: uuidv4(),
                    hazards: [{ hazard: "" }],
                    UE: [{ ue: "" }],
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

    const insertMainRow = (afterIndex) => {
        setFormData(prev => {
            const newEntry = {
                id: uuidv4(),
                nr: null,
                main: "",
                jraBody: [{
                    idBody: uuidv4(),
                    hazards: [{ hazard: "Work Execution" }],
                    UE: [{ ue: "Non-adherence to task step requirements / specifications" }],
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
        { id: "action", title: "Action", className: "ibraCent ibraAct", icon: null },
    ];

    const openInfo = (type) => {
        switch (type) {
            case "hazards": {
                openHazardsHelp();
                break;
            }
            case "UE": {
                openUnwantedEventsHelp();
                break;
            }
            case "sub": {
                openSubHelp();
                break;
            }
            case "taskExecution": {
                openTaskExecutionHelp();
                break;
            }
            case "controls": {
                openResponsibleHelp();
                break;
            }
            case "go": {
                openGo_noGo();
                break;
            }
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
                            autoClose: 800,
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
                    autoClose: 800,
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
            tableWrapperRef.current.style.width = `${boxW - 60}px`;
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
        "nr", "main", "hazards", "sub", "UE", "taskExecution", "controls", "go", "action",
    ]);

    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const getDisplayColumns = () => {
        let result = availableColumns
            .map(col => col.id)
            .filter(id => showColumns.includes(id) && id !== 'action');
        while (result.length < 5) {
            result.push(`blank-${result.length}`);
        }
        result.push('action');
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

    useEffect(() => {
        const popupSelector = '.floating-dropdown';
        const columnSelector = '.column-selector-popup';
        const filterSelector = ".jra-filter-popup";

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest(columnSelector) &&
                !e.target.closest(filterSelector) &&
                !e.target.closest('input');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(popupSelector) || e.target.closest(columnSelector) || e.target.closest(filterSelector);

            if (
                e.target.closest(popupSelector) ||
                e.target.closest(columnSelector) ||
                e.target.closest(filterSelector)
            ) {
                return;
            }
            else {
                console.log("Scroll detected outside of dropdowns or popups");
            }

            if (!isInsidePopup) {
                closeDropdowns();
            }
        };

        const closeDropdowns = () => {
            setShowColumnSelector(null);
            setFilterPopup(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showColumnSelector, filterPopup]);

    return (
        <div className="input-row-risk-ibra">
            <div className="ibra-box" ref={ibraBoxRef}>
                <h3 className="font-fam-labels">Job Risk Assessment (JRA)</h3>
                <button
                    className="top-right-button-ibra"
                    title="Show / Hide Columns"
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                >
                    <FontAwesomeIcon icon={faTableColumns} className="icon-um-search" />
                </button>

                {showColumnSelector && (
                    <div className="column-selector-popup" ref={popupRef}>
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

                <div className="table-wrapper-jra" ref={tableWrapperRef}>
                    <table className="table-borders-ibra">
                        <thead className="ibra-table-header">
                            <tr>
                                {displayColumns.map((columnId, index) => {
                                    const column = availableColumns.find(col => col.id === columnId);
                                    if (!column) {
                                        return <th key={index} className="ibraCent ibraBlank"></th>;
                                    }
                                    return (
                                        <th
                                            key={index}
                                            className={`${column.className} jra-header-cell ${filters[columnId] ? 'jra-filter-active' : ''}`}
                                            onClick={e => openFilterPopup(columnId, e)}
                                        >
                                            {column.icon && (
                                                <FontAwesomeIcon icon={column.icon} className="header-icon" onClick={e => {
                                                    e.stopPropagation();
                                                    openInfo(column.id);
                                                }} />
                                            )}
                                            <div>{column.title.split('(')[0].trim()}{filters[columnId] && (
                                                <FontAwesomeIcon icon={faFilter} className="active-filter-icon" style={{ marginLeft: "10px" }} />
                                            )}</div>
                                            {column.title.includes('(') && (
                                                <div className="column-subtitle">
                                                    ({column.title.split('(')[1].split(')')[0]})
                                                </div>
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
                                                className={`jra-body-row ${row.nr % 2 === 0 ? 'weRow' : ''}`}
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

                                                    if (colId === "nr" && bodyIdx === 0) {
                                                        return (
                                                            <td key={colIdx} rowSpan={rowCount} className={cls}>
                                                                <span>{row.nr}</span>
                                                                <FontAwesomeIcon
                                                                    icon={faArrowsUpDown}
                                                                    className="drag-handle"
                                                                    onMouseDown={() => setArmedDragRow(row.id)}
                                                                    onMouseUp={() => setArmedDragRow(null)}
                                                                    style={{ cursor: 'grab', marginRight: "2px", marginLeft: "4px" }}
                                                                />
                                                                <FontAwesomeIcon
                                                                    icon={faArrowUpRightFromSquare}
                                                                    style={{ fontSize: "14px", marginLeft: "2px", color: "black" }}
                                                                    className="ue-popup-icon"
                                                                    title="Evaluate Unwanted Event"
                                                                    onClick={() => {
                                                                        openJRAPopup(row.id);
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
                                                                className={[cls, 'main-cell'].join(' ')}
                                                            >
                                                                <div className="main-cell-content">
                                                                    <div style={{ display: "block", textAlign: "left" }}>{row.main}</div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="insert-mainrow-button"
                                                                    title="Add Main Step Here"
                                                                    onClick={() => insertMainRow(rowIndex)}
                                                                >
                                                                    <FontAwesomeIcon icon={faPlus} />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="delete-mainrow-button"
                                                                    title="Delete Main Step"
                                                                    onClick={() => removeRow(row.id)}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} className="delete-mainrow-icon" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="duplicate-mainrow-button"
                                                                    title="Duplicate Main Step"
                                                                    onClick={() => handleDuplicateRow(rowIndex)}
                                                                >
                                                                    <FontAwesomeIcon icon={faCopy} />
                                                                </button>
                                                            </td>
                                                        );
                                                    }

                                                    if (colId === "action") {
                                                        return (
                                                            <td key={colIdx} className={`${cls}`} >
                                                                <FontAwesomeIcon
                                                                    icon={faPlusCircle}
                                                                    style={{ marginBottom: "0px", fontSize: "15px" }}
                                                                    className="insert-row-button-sig-risk font-fam"
                                                                    title="Add sub & control here"
                                                                    onClick={() => insertMainRow(rowIndex)}
                                                                />

                                                                {bodyIdx !== 0 && (
                                                                    <FontAwesomeIcon icon={faTrash} style={{ marginBottom: "0px", marginTop: "10px" }} className="control-icon-action font-fam"
                                                                        title={
                                                                            row.jraBody.length > 1
                                                                                ? "Delete Sub-step"
                                                                                : "Delete Row"
                                                                        }
                                                                        onClick={() =>
                                                                            removeBodyRow(row.id, body.idBody)
                                                                        } />
                                                                )}

                                                            </td>
                                                        );
                                                    }

                                                    if (colId === "hazards") {
                                                        return (
                                                            <td key={colIdx} className={`hazard-cell`}>
                                                                {body.hazards.map((hObj, hIdx) => {
                                                                    const isFirst = bodyIdx === 0;
                                                                    return (
                                                                        <div key={hIdx} className="static-cell hazard-static jra-normal-text">
                                                                            {hObj.hazard}
                                                                        </div>
                                                                    );
                                                                })}
                                                                <button
                                                                    type="button"
                                                                    className="insert-subrow-button"
                                                                    onClick={() => insertBodyRow(row.id, bodyIdx + 1)}
                                                                    title="Add sub-step here"
                                                                >
                                                                    <FontAwesomeIcon icon={faPlus} />
                                                                </button>
                                                            </td>
                                                        );
                                                    }

                                                    if (colId === "UE") {
                                                        return (
                                                            <td key={colIdx} className={`${cls}`} >
                                                                {body.UE.map((uObj, uIdx) => {
                                                                    const isFirst = bodyIdx === 0;
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
                                                            <td key={colIdx} className={`${cls}`} >
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
                                                                            <div style={{ display: "block", textAlign: "left" }}>{sObj.task}</div>
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                            </td>
                                                        );
                                                    }

                                                    if (colId === "taskExecution") {
                                                        return (
                                                            <td key={colIdx} className={`${cls}`} >
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
                                                            <td key={colIdx} className={`${cls}`} >
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
                                                                        <div style={{ display: "block", textAlign: "left" }}>{cObj.control}</div>
                                                                    </div>
                                                                ))}
                                                            </td>
                                                        );
                                                    }

                                                    if (colId === "go") {
                                                        return (
                                                            <td key={colIdx} className={`${cls}`} >
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
            </div>

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

            {helpHazards && (<HazardJRA setClose={closeHazardsHelp} />)}
            {helpResponsible && (<ControlExecution setClose={closeResponsibleHelp} />)}
            {helpSub && (<CurrentControlsJRA setClose={closeSubHelp} />)}
            {helpTaskExecution && (<TaskExecution setClose={closeTaskExecutionHelp} />)}
            {helpUnwantedEvents && (<UnwantedEvent setClose={closeUnwantedEventsHelp} />)}
            {go_noGO && (<Go_Nogo setClose={closeGo_noGo} />)}
            {showJRAPopup && (<JRAPopup onClose={closeJRAPopup} data={rowData} onSubmit={handleUpdateJraRow} nr={rowData.nr} formData={formData} />)}
        </div>
    );
};

export default JRATable;