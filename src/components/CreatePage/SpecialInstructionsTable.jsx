import React, { useEffect, useState, useRef } from "react";
import './SpecialInstructionsTable.css';
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faPlus, faPlusCircle, faMagicWandSparkles, faCopy, faArrowsUpDown } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';

const SpecialInstructionsTable = ({ formData, setFormData, error, title, documentType, setErrors, readOnly = false }) => {
    const [armedDragRow, setArmedDragRow] = useState(null);
    const [draggedRowId, setDraggedRowId] = useState(null);
    const [dragOverRowId, setDragOverRowId] = useState(null);
    const draggedElRef = useRef(null);

    // ---- DRAG & DROP HANDLERS ----
    const handleDragStart = (e, id) => {
        setDraggedRowId(id);
        draggedElRef.current = e.currentTarget;
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragOver = (e, id) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverRowId(id);
    };
    const handleDragLeave = () => setDragOverRowId(null);

    const handleDrop = (e, dropId) => {
        e.preventDefault();
        if (!draggedRowId || draggedRowId === dropId) {
            return handleDragEnd();
        }

        setFormData(prev => {
            const items = Array.from(prev.special);
            const fromIdx = items.findIndex(r => r.id === draggedRowId);
            const toIdx = items.findIndex(r => r.id === dropId);
            const [moved] = items.splice(fromIdx, 1);
            items.splice(toIdx, 0, moved);
            const renum = items.map((r, i) => ({
                ...r,
                nr: (i + 1).toString()
            }));
            return { ...prev, special: renum };
        });

        handleDragEnd();
    };

    const handleDragEnd = () => {
        if (draggedElRef.current) {
            draggedElRef.current.style.opacity = '';
            draggedElRef.current = null;
        }
        setDraggedRowId(null);
        setDragOverRowId(null);
        setArmedDragRow(null);
    };

    const updateRows = () => {
        setFormData((prev) => ({
            ...prev,
        }));
    };

    const handleAddMain = (id) => {
        setFormData(prev => {
            const idx = prev.special.findIndex(r => r.id === id);
            const newRow = { id: uuidv4(), nr: "", instruction: "" };
            const list = [
                ...prev.special.slice(0, idx + 1),
                newRow,
                ...prev.special.slice(idx + 1)
            ];
            const renum = list.map((r, i) => ({ ...r, nr: (i + 1).toString() }));
            return { ...prev, special: renum };
        });
    };

    const handleDeleteMain = (id) => {
        if (formData.special.length <= 1) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Cannot remove all special‑instruction rows.", {
                closeButton: false,
                autoClose: 800,
                style: { textAlign: 'center' }
            });
            return;
        }
        setFormData(prev => {
            const filtered = prev.special.filter(r => r.id !== id);
            const renum = filtered.map((r, i) => ({
                ...r,
                nr: (i + 1).toString()
            }));
            return { ...prev, special: renum };
        });
    };

    const handleMainSectionChange = (id, value) => {
        setFormData(prev => {
            const updated = prev.special
                .map(r =>
                    r.id === id
                        ? { ...r, instruction: value }
                        : r
                )
                .map((r, i) => ({ ...r, nr: (i + 1).toString() }));
            return { ...prev, special: updated };
        });
    };

    return (
        <div className="input-row">
            <div className={`proc-box ${error ? "error-proc" : ""}`}>
                <h3 className="font-fam-labels">Special Instructions <span className="required-field">*</span></h3>


                <div className="si-chapter-card">
                    <span style={{ color: "black" }}><strong>Note:</strong> The following special instructions are effective immediately.</span>
                    <table className="vcr-table table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="procCent siNr">Nr</th>
                                <th className="procCent siMain">Special Instruction</th>
                                {!readOnly && (<th className="procCent siSub">Action</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {formData.special.map((row, index) => {
                                return (
                                    <tr key={index}
                                        draggable={armedDragRow === row.id}
                                        onDragStart={armedDragRow === row.id ? e => handleDragStart(e, row.id) : undefined}
                                        onDragOver={e => handleDragOver(e, row.id)}
                                        onDragLeave={e => {
                                            const rt = e.relatedTarget || e.nativeEvent?.relatedTarget;
                                            if (rt && e.currentTarget.contains(rt)) return;
                                            handleDragLeave();
                                        }}

                                        onDrop={e => handleDrop(e, row.id)}
                                        onDragEnd={handleDragEnd}
                                        className={dragOverRowId === row.id ? "drag-over-top" : ""}
                                    >
                                        <td className="procCent" style={{ fontSize: "14px", color: "black" }}>
                                            {row.nr}
                                            {!readOnly && (<FontAwesomeIcon
                                                icon={faArrowsUpDown}
                                                className="drag-handle-standards"
                                                onMouseDown={() => setArmedDragRow(row.id)}
                                                onMouseUp={() => setArmedDragRow(null)}
                                            />)}
                                        </td>
                                        <td className="main-cell-standards" style={{}}>
                                            <textarea
                                                name="special"
                                                className="aim-textarea-st font-fam"
                                                value={row.instruction}
                                                style={{ fontSize: "14px" }}
                                                placeholder="Insert Special Instruction" // Optional placeholder text
                                                onChange={(e) => handleMainSectionChange(row.id, e.target.value)}
                                                onFocus={() => setErrors(prev => ({
                                                    ...prev,
                                                    special: false
                                                }))}
                                                readOnly={readOnly}
                                            />
                                        </td>
                                        {!readOnly && (<td className="action-cell-si procCent">
                                            <div className="action-buttons-si">
                                                <button
                                                    className="remove-row-button font-fam"
                                                    style={{ fontSize: "14px" }}
                                                    title="Remove Row"
                                                    onClick={() => handleDeleteMain(row.id)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                                <button
                                                    className="insert-row-button-sig-risk font-fam"
                                                    title="Add Row"
                                                    style={{ fontSize: "15px" }}
                                                    onClick={() => handleAddMain(row.id)}
                                                >
                                                    <FontAwesomeIcon icon={faPlusCircle} />
                                                </button>
                                            </div>
                                        </td>)}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SpecialInstructionsTable;