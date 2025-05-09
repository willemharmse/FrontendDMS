import React, { useEffect, useState, useRef } from "react";
import './IBRATable.css';
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faPlus, faPlusCircle, faMagicWandSparkles, faTableColumns, faTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import IBRAPopup from "./IBRAPopup";

const IBRATable = ({ rows, updateRows, addRow, removeRow }) => {
    const ibraBoxRef = useRef(null);
    const tableWrapperRef = useRef(null);
    const [ibraPopup, setIbraPopup] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState(null);

    const closePopup = () => {
        setIbraPopup(false);
    }

    const availableColumns = [
        { id: "nr", title: "Ref Nr.", className: "ibraCent ibraNr", icon: null },
        { id: "main", title: "Main Area", className: "ibraCent ibraMain", icon: null },
        { id: "sub", title: "Sub Area", className: "ibraCent ibraSub", icon: null },
        { id: "hazards", title: "Hazard", className: "ibraCent ibraPrev", icon: null },
        { id: "source", title: "Risk Source", className: "ibraCent ibraAR", icon: null },
        { id: "UE", title: "Unwanted Event", className: "ibraCent ibraStatus", icon: null },
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
        { id: "majorRisk", title: "Major Risk", className: "ibraCent ibraOther", icon: null },
        { id: "priority", title: "Priority Unwanted Event", className: "ibraCent ibraDeadline", icon: null },
        { id: "possible", title: "Possible Improvements or Additional Controls", className: "ibraCent ibraDeadline", icon: null },
        { id: "maxConsequence", title: "Max Reasonable Consequence", className: "ibraCent ibraDeadline", icon: null },
        { id: "additional", title: "Additional Comments", className: "ibraCent ibraDeadline", icon: null },
        { id: "action", title: "Action", className: "ibraCent ibraAct", icon: null },
    ];

    const handleRowClick = (row, rowIndex) => {
        if (!row.UE || row.UE === "") {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("Please select an Unwanted Event", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }
        setSelectedRowData(row);
        setIbraPopup(true);
    };

    useEffect(() => {
        const adjustTableWrapperWidth = () => {
            if (ibraBoxRef.current && tableWrapperRef.current) {
                const boxWidth = ibraBoxRef.current.offsetWidth;
                const tableWrapperWidth = boxWidth - 30;
                tableWrapperRef.current.style.width = `${tableWrapperWidth}px`;
            }
        };

        adjustTableWrapperWidth();
        window.addEventListener('resize', adjustTableWrapperWidth);

        return () => {
            window.removeEventListener('resize', adjustTableWrapperWidth);
        };
    }, [tableWrapperRef.current]);

    const [showColumns, setShowColumns] = useState([
        "nr", "main", "sub", "hazards", "source", "UE", "action",
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
                if (columnId === 'action') return prev;
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

    const displayColumns = getDisplayColumns();

    return (
        <div className="input-row-risk-ibra">
            <div className="ibra-box" ref={ibraBoxRef}>
                <button
                    className="top-left-button-refs"
                    title="Information"
                >
                    <FontAwesomeIcon icon={faInfoCircle} className="icon-um-search" />
                </button>
                <h3 className="font-fam-labels">Issue Based Risk Assessment (IBRA) <span className="required-field">*</span></h3>
                <button
                    className="top-right-button-ibra"
                    title="Configure Columns"
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
                                <p>{showColumns.length} columns selected</p>
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
                                {displayColumns.map((columnId, index) => {
                                    const column = availableColumns.find(col => col.id === columnId);
                                    if (column) {
                                        return (
                                            <th key={index} className={column.className}>
                                                {column.icon ? <FontAwesomeIcon icon={column.icon} /> : column.title}
                                            </th>
                                        );
                                    }
                                    return <th key={index} className="ibraCent ibraBlank"></th>;
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rowIndex) => (
                                <tr key={row.id}>
                                    {displayColumns.map((colId, idx) => {
                                        if (colId.startsWith('blank-')) {
                                            return <td key={idx}></td>;
                                        }
                                        const columnMeta = availableColumns.find(col => col.id === colId);
                                        const colClass = columnMeta?.className || '';
                                        const cellData = row[colId];

                                        if (colId === 'action') {
                                            return (
                                                <td key={idx} className={colClass}>
                                                    <button
                                                        className="remove-row-button font-fam"
                                                        title="Delete Row"
                                                        onClick={(e) => {
                                                            console.log('Deleting row:', row.id);
                                                            removeRow(row.id);
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </td>
                                            );
                                        }

                                        // Handle UE column: render dropdown
                                        if (colId === 'UE') {
                                            return (
                                                <td key={idx} className={colClass}>
                                                    <select
                                                        className="table-control font-fam"
                                                        value={cellData}
                                                        onClick={(e) => e.stopPropagation()} // prevent popup open
                                                        onChange={(e) => {
                                                            const updatedRows = [...rows];
                                                            updatedRows[rowIndex][colId] = e.target.value;
                                                            updateRows(updatedRows);
                                                        }}
                                                    >
                                                        <option value="">Select Event</option>
                                                        <option value="Fire">Fire</option>
                                                        <option value="Explosion">Explosion</option>
                                                        <option value="Leak">Leak</option>
                                                        <option value="Equipment Failure">Equipment Failure</option>
                                                    </select>
                                                </td>
                                            );
                                        }

                                        // Default cell render (click to open popup)
                                        return (
                                            <td
                                                key={idx}
                                                className={colClass}
                                                onClick={() => handleRowClick(row, rowIndex)}
                                            >
                                                {Array.isArray(cellData)
                                                    ? (
                                                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                                            {cellData.map((item, i) => (
                                                                <li key={i}>{item}</li>
                                                            ))}
                                                        </ul>
                                                    )
                                                    : cellData}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>

                    </table>

                </div>
                <button className="add-row-button-ds-risk font-fam" onClick={addRow}>
                    <FontAwesomeIcon icon={faPlusCircle} title="Add Row" />
                </button>
            </div>
            {ibraPopup && (<IBRAPopup onClose={closePopup} data={selectedRowData} onSave={updateRows} />)}
        </div>
    );
};

export default IBRATable;