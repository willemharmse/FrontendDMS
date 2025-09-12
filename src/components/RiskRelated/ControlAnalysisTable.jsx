import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsUpDown, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faSearch, faTrash, faArrowUpRightFromSquare, faPlusCircle, faDatabase, faDownload, faTableColumns, faTimes } from "@fortawesome/free-solid-svg-icons";
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

    const availableColumns = [
        { id: "nr", title: "Nr", className: "control-analysis-nr", icon: null },
        { id: "control", title: "Control", className: "control-analysis-control", icon: null },
        { id: "critical", title: "Critical Control", className: "control-analysis-critcal", icon: null },
        { id: "act", title: "Act, Object or System", className: "control-analysis-act", icon: null },
        { id: "activation", title: "Control Activation (Pre or Post Unwanted Event)", className: "control-analysis-activation", icon: null },
        { id: "hierarchy", title: "Hierarchy of Controls", className: "control-analysis-hiearchy", icon: null },
        { id: "cons", title: "Main Consequence Addressed", className: "control-analysis-cons", icon: null },
        { id: "quality", title: "Quality (%)", className: "control-analysis-quality", icon: null },
        { id: "cer", title: "Control Effectiveness Rating (CER)", className: "control-analysis-cer", icon: null },
        { id: "action", title: "Required Action", className: "control-analysis-action", icon: null },
        { id: "responsible", title: "Responsible Person", className: "control-analysis-responsible", icon: null },
        { id: "dueDate", title: "Due Date", className: "control-analysis-date", icon: null },
        { id: "notes", title: "Notes Regarding the Control", className: "control-analysis-notes", icon: null },
        ...(!readOnly
            ? [{ id: "actions", title: "Action", className: "control-analysis-nr", icon: null }] : []),
    ];

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
            if (!caeBoxRef.current || !ceaTableWrapperRef.current) return;
            const boxW = caeBoxRef.current.offsetWidth;
            ceaTableWrapperRef.current.style.width = `${boxW - 60}px`;
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
            return;
        }
        const boxW = caeBoxRef.current.offsetWidth;
        wrapper.style.width = `${boxW - 30}px`;
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
                <div className="table-wrapper-cea" ref={ceaTableWrapperRef}>
                    <table className="table-borders-cea" >
                        <thead className="control-analysis-head">
                            <tr>
                                {displayColumns.map((columnId, idx) => {
                                    const col = availableColumns.find(c => c.id === columnId);
                                    if (col) {
                                        return (
                                            <th key={idx} className={col.className} rowSpan={1}>
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
                        </thead>
                        <tbody>
                            {rows.map((row, rowIndex) => (
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
                                                    <span style={{ fontSize: '14px', fontWeight: "normal" }}>{row.nr}</span>
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
                                                <td key={colIndex} className={`${colMeta.className} action-cell`}>
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
                                        const centerColumns = ['critical', 'act', 'quality', 'cer'];
                                        const textAlign = centerColumns.includes(columnId) ? 'center' : 'left';

                                        return (
                                            <td
                                                key={colIndex}
                                                className={cellClass}
                                                style={{ textAlign, fontSize: '14px' }}
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
            </div>
            {deletePopupVisible && (<DeleteControlPopup controlName={controlToDelete.controlName} deleteControl={confirmDeleteControl} closeModal={closeDeletePopup} />)}
            {insertPopup && (<ControlEAPopup data={selectedRowData} onClose={closeInsertPopup} onSave={updateRows} onControlRename={onControlRename} readOnly={readOnly} />)}
        </div>
    );
};

export default ControlAnalysisTable;