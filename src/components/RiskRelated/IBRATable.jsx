import React, { useEffect, useState, useRef } from "react";
import './IBRATable.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlusCircle, faTableColumns, faTimes, faInfoCircle, faArrowUpRightFromSquare, faCheck, faDownload } from '@fortawesome/free-solid-svg-icons';
import IBRAPopup from "./IBRAPopup";
import IbraNote from "./RiskInfo/IbraNote";
import UnwantedEvent from "./RiskInfo/UnwantedEvent";
import { v4 as uuidv4 } from 'uuid';

const IBRATable = ({ rows, updateRows, addRow, removeRow, generate, updateRow, isSidebarVisible, error }) => {
    const ibraBoxRef = useRef(null);
    const tableWrapperRef = useRef(null);
    const [ibraPopup, setIbraPopup] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState(null);
    const [noteText, setNoteText] = useState("");
    const [showNote, setShowNote] = useState(false);
    const savedWidthRef = useRef(null);

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
            children: ["possibleI", "actions", "dueDate"]
        },
        { id: "possibleI", title: "Possible Improvements / Future Control", className: "ibraCent ibraPI" },
        { id: "actions", title: "Required Action", className: "ibraCent ibraRA" },
        { id: "dueDate", title: "Due Date", className: "ibraCent ibraDD" },
        { id: "additional", title: "Notes Regarding the UE", className: "ibraCent ibraAdditional", icon: null },
        { id: "action", title: "Action", className: "ibraCent ibraAct", icon: null },
    ];

    const handleRemovePossible = (rowIndex, possIndex) => {
        const newRows = [...rows];
        const possibilities = newRows[rowIndex].possible;
        if (possibilities.length > 1) {
            possibilities.splice(possIndex, 1);
            updateRow(newRows);
        }
    };

    // 1) A helper that wraps updateRows but also ensures "possible" is visible
    const handleSaveWithRiskTreatment = (rowNR, updatedData) => {
        // 1) Push the new data up to the parent
        updateRows(rowNR, updatedData);

        // 2) Immediately show only: Nr, Hazard, Hazard Description, Risk Treatment, Action
        setShowColumns([
            "nr",        // Nr
            "source",    // Hazard / Energy Release
            "hazards",   // Hazard Description
            "possible",  // Risk Treatment (will expand to possibleI/actions/dueDate)
            "action"     // Action buttons
        ]);
    };

    // Remove one action & its matching dueDate, but leave at least one
    const handleRemoveAction = (rowIndex, possIndex, actionIndex) => {
        const newRows = [...rows];
        const block = newRows[rowIndex].possible[possIndex];
        if (block.actions.length > 1) {
            block.actions.splice(actionIndex, 1);
            // also remove the corresponding dueDate
            if (Array.isArray(block.dueDate) && block.dueDate.length > actionIndex) {
                block.dueDate.splice(actionIndex, 1);
            }
            updateRow(newRows);
        }
    };

    const handleAddPossible = (rowIndex, possIndex) => {
        const newRows = [...rows];
        const targetRow = newRows[rowIndex];

        if (!Array.isArray(targetRow.possible)) {
            targetRow.possible = [];
        }

        targetRow.possible.splice(
            possIndex + 1,
            0,
            { possibleI: "", actions: [{ action: "" }], dueDate: [{ date: "" }] }
        );

        updateRow(newRows);
    };

    const handleAddAction = (rowIndex, possIndex) => {
        const newRows = [...rows];
        const block = newRows[rowIndex].possible[possIndex];

        if (!Array.isArray(block.actions)) {
            block.actions = [];
        }
        block.actions.push({ action: "" });

        if (!Array.isArray(block.dueDate)) {
            block.dueDate = [];
        }
        block.dueDate.push({ date: "" });

        updateRow(newRows);
    };

    const handlePossibleIChange = (rowIndex, possIndex, value) => {
        const newRows = [...rows];
        newRows[rowIndex].possible[possIndex].possibleI = value;
        updateRow(newRows);
    };

    const handleActionChange = (rowIndex, possIndex, actionIndex, value) => {
        const newRows = [...rows];
        newRows[rowIndex].possible[possIndex].actions[actionIndex].action = value;
        updateRow(newRows);
    };

    const handleDueDateChange = (rowIndex, possIndex, dateIndex, value) => {
        const newRows = [...rows];
        newRows[rowIndex].possible[possIndex].dueDate[dateIndex].date = value;
        updateRow(newRows);
    };

    useEffect(() => {
        const wrapper = tableWrapperRef.current;
        if (!wrapper) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        const mouseDownHandler = (e) => {
            if (e.target.closest('input, textarea, select, button')) {
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
        "nr", "main", "sub", "hazards", "source", "UE", "action",
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
                expanded.push("possibleI", "actions", "dueDate");
            } else if (!["possibleI", "actions", "dueDate"].includes(id)) {
                // everything else (but not the children by themselves)
                expanded.push(id);
            }
        });
        while (expanded.length < 5) expanded.push(`blank-${expanded.length}`);
        if (!expanded.includes("action")) {
            expanded.push("action");
        }
        return expanded;
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

    const insertRowAt = (insertIndex) => {
        // copy existing rows
        const newRows = [...rows];

        // create a fresh new row (nr doesn’t really matter here)
        const newRow = {
            id: uuidv4(),
            nr: 0,
            main: "", sub: "", owner: "", odds: "", riskRank: "",
            hazards: [], controls: [], S: "-", H: "-", E: "-", C: "-", LR: "-", M: "-",
            R: "-", source: "", material: "", priority: "",
            possible: [{ possibleI: "", actions: [{ action: "" }], dueDate: [{ date: "" }] }],
            UE: "", additional: "", maxConsequence: ""
        };

        // insert it at the desired index
        newRows.splice(insertIndex, 0, newRow);

        // now renumber *all* rows
        newRows.forEach((row, idx) => {
            row.nr = idx + 1;
        });

        // push it back up to your parent
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
                    title="Generate IBRA"
                    onClick={generate}
                >
                    <FontAwesomeIcon icon={faDownload} className="icon-um-search" />
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

                <div className="table-wrapper-ibra" ref={tableWrapperRef}>
                    <table className="table-borders-ibra">
                        <thead className="ibra-table-header">
                            <tr>
                                {displayColumns.map((columnId, idx) => {
                                    // — “Risk Treatment” group header — 
                                    if (columnId === 'possibleI') {
                                        return (
                                            <th key={idx} className="ibraCent ibraRM" colSpan={3}>
                                                Risk Treatment
                                            </th>
                                        );
                                    }
                                    // — skip the two other children here —
                                    if (columnId === 'actions' || columnId === 'dueDate') {
                                        return null;
                                    }
                                    // — everything else spans both rows —
                                    const col = availableColumns.find(c => c.id === columnId);
                                    if (col) {
                                        return (
                                            <th key={idx} className={col.className} rowSpan={2}>
                                                {col.icon ? <FontAwesomeIcon icon={col.icon} /> : col.title}
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
                                    if (['possibleI', 'actions', 'dueDate'].includes(columnId)) {
                                        const col = availableColumns.find(c => c.id === columnId);
                                        return (
                                            <th key={idx} className={col.className}>
                                                {col.icon ? <FontAwesomeIcon icon={col.icon} /> : col.title}
                                            </th>
                                        );
                                    }
                                    return null;
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rowIndex) => {
                                // 1. fallback to a single empty possibility if none exist
                                const possibilities = Array.isArray(row.possible) && row.possible.length > 0
                                    ? row.possible
                                    : [{ possible: "", actions: [], dueDate: [] }]

                                return possibilities.map((p, pi) => {
                                    const isFirst = pi === 0
                                    return (
                                        <tr key={`${row.id}-${pi}`} className={row.nr % 2 === 0 ? `evenTRColour` : ``}>
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

                                                // ─── Risk-Treatment children ───
                                                if (colId === "possibleI") {
                                                    return (
                                                        <td key={idx} className={colClass}>
                                                            <div className="control-with-icons">
                                                                <textarea
                                                                    value={p.possibleI}
                                                                    onChange={e => handlePossibleIChange(rowIndex, pi, e.target.value)}
                                                                    className="ibra-textarea-PI"
                                                                    style={{ fontSize: "14px" }}
                                                                    placeholder="Insert Improvement to Control"
                                                                />
                                                                <FontAwesomeIcon
                                                                    icon={faPlusCircle}
                                                                    className="control-icon-add-ibra magic-icon"
                                                                    onClick={() => handleAddPossible(rowIndex, pi)}
                                                                    title="Add Possible Improvement" />
                                                                {possibilities.length > 1 && (
                                                                    <FontAwesomeIcon
                                                                        icon={faTrash}
                                                                        className="control-icon-remove-ibra magic-icon"
                                                                        onClick={() => handleRemovePossible(rowIndex, pi)}
                                                                        title="Remove this possible improvement"
                                                                    />
                                                                )}
                                                            </div>
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
                                                                            onChange={e => handleActionChange(rowIndex, pi, ai, e.target.value)}
                                                                            className="ibra-textarea-PI"
                                                                            style={{ fontSize: "14px" }}
                                                                        />
                                                                        <FontAwesomeIcon
                                                                            icon={faPlusCircle}
                                                                            onClick={() => handleAddAction(rowIndex, pi)}
                                                                            className="control-icon-add-ibra magic-icon"
                                                                            title="Add action required" />
                                                                        {p.actions.length > 1 && (
                                                                            <FontAwesomeIcon
                                                                                icon={faTrash}
                                                                                className="control-icon-remove-ibra magic-icon"
                                                                                onClick={() => handleRemoveAction(rowIndex, pi, ai)}
                                                                                title="Remove this action"
                                                                            />
                                                                        )}
                                                                    </div>
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
                                                                        onChange={e => handleDueDateChange(rowIndex, pi, di, e.target.value)}
                                                                        className="ibra-input-date"
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
                                                            className={`${colClass} ${colourClass}`}
                                                            rowSpan={possibilities.length}
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
                                                            className={`${colClass} ${colourClass}`}
                                                            rowSpan={possibilities.length}
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
                                                            className={`${colClass} ${colourClass}`}
                                                            rowSpan={possibilities.length}
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
                                                            style={{ textAlign: "left" }}
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
                                                            style={{ textAlign: "left" }}
                                                            className={colId === "UE" ? "unwanted-event-borders" : ""}
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
                                                            style={{ textAlign: "left" }}
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
                                                            className={colClass}
                                                            rowSpan={possibilities.length}
                                                            style={{ alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <span>{cellData}</span>
                                                            <FontAwesomeIcon
                                                                icon={faArrowUpRightFromSquare}
                                                                style={{ fontSize: "14px" }}
                                                                className="ue-popup-icon"
                                                                title="Evaluate Unwanted Event"
                                                                onClick={() => {
                                                                    setSelectedRowData(row)
                                                                    setIbraPopup(true)
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
                                                                    onClick={() => insertRowAt(rowIndex + 1)}
                                                                >
                                                                    <FontAwesomeIcon icon={faPlusCircle} />
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
                <button className="add-row-button-ds-risk font-fam" onClick={addRow}>
                    <FontAwesomeIcon icon={faPlusCircle} title="Add Row" />
                </button>
            </div>
            {showNote && (<IbraNote setClose={closeNote} text={noteText} />)}
            {ibraPopup && (<IBRAPopup onClose={closePopup} data={selectedRowData} onSave={handleSaveWithRiskTreatment} />)}
        </div>
    );
};

export default IBRATable;