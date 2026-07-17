import React, { useState, useEffect } from "react";
import "./PicturesTable.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import {
    faChevronDown,
    faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import RiskAssessmentItemsDelete from "../RiskRelated/RiskAssessmentItemsDelete";

const PicturesTable = ({ collapsible = false, picturesRows, addPicRow, removePicRow, updatePicRow, readOnly = false }) => {
    const [collapsed, setCollapsed] = useState(true);
    const isCollapsed = collapsible ? collapsed : false;
    const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);

    const requestRemovePicRow = (index) => {
        setConfirmDeleteIndex(index);
    };

    const confirmRemovePicRow = () => {
        if (confirmDeleteIndex != null) {
            removePicRow(confirmDeleteIndex);
        }
        setConfirmDeleteIndex(null);
    };

    const cancelRemovePicRow = () => {
        setConfirmDeleteIndex(null);
    };

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
    };

    const handleInputChange = (index, field, value) => {
        // 1) Compute a per‐cell figure number:
        const cellNumber = field === "pic1"
            ? index * 2 + 1
            : index * 2 + 2;
        const prefix = `Figure 1.${cellNumber}: `;

        // 2) Strip any existing "Figure 1.<digits>: " prefix (case‐insensitive).
        const stripped = value.replace(/^Figure\s*1\.\d+:\s*/i, "");

        let updatedValue;

        // 3) If the user has only typed the prefix so far, keep it.
        if (
            stripped.trim() === "" &&
            value.trim().toLowerCase() === prefix.trim().toLowerCase()
        ) {
            updatedValue = prefix;

            // 4) If stripping removed everything and they didn't type exactly our prefix, clear.
        } else if (stripped.trim() === "") {
            updatedValue = "";

            // 5) Otherwise, re‐prepend the correct prefix + the “real” text.
        } else {
            updatedValue = prefix + stripped;
        }

        updatePicRow(index, field, updatedValue);
    };


    return (
        <div className="input-row" style={{ position: "relative" }}>
            <div className="pic-box" style={{ position: "relative" }}>
                <h3 className="font-fam-labels">Figures and Graphs</h3>

                {collapsible && (<button
                    className="top-right-button-ibra"
                    title={collapsed ? "Expand Section" : "Collapse Section"}
                    onClick={toggleCollapse}
                    style={{ color: "gray" }}
                    type="button"
                >
                    <FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} />
                </button>)}

                {(!isCollapsed) && (
                    <>
                        {picturesRows.length > 0 && (
                            <table className="vcr-table table-borders">
                                <thead className="cp-table-header">
                                    <tr>
                                        <th className="picColCen picOne">Picture Name</th>
                                        <th className="picColCen picTwo">Picture Name</th>
                                        {!readOnly && (<th className="picColCen picBut">Action</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {picturesRows.map((row, index) => (
                                        <tr key={index}>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="table-control"
                                                    style={{ fontSize: "14px" }}
                                                    value={row.pic1}
                                                    readOnly={readOnly}
                                                    onChange={(e) => handleInputChange(index, "pic1", e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="table-control"
                                                    style={{ fontSize: "14px" }}
                                                    value={row.pic2}
                                                    readOnly={readOnly}
                                                    onChange={(e) => handleInputChange(index, "pic2", e.target.value)}
                                                />
                                            </td>
                                            {!readOnly && (<td className="ref-but-row procCent">
                                                <button className="remove-row-button" onClick={() => requestRemovePicRow(index)}>
                                                    <FontAwesomeIcon icon={faTrash} title="Remove Row" />
                                                </button>
                                            </td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {(picturesRows.length === 0 && !readOnly) && (
                            <button className="add-row-button-pic" onClick={addPicRow}>
                                Add
                            </button>
                        )}

                        {(picturesRows.length > 0 && !readOnly) && (
                            <button className="add-row-button-pic-plus" onClick={addPicRow}>
                                <FontAwesomeIcon icon={faPlusCircle} title="Add Row" />
                            </button>
                        )}
                    </>
                )}
            </div>

            {confirmDeleteIndex != null && (
                <RiskAssessmentItemsDelete
                    closeModal={cancelRemovePicRow}
                    type="Figure and Graph Row"
                    removeRow={confirmRemovePicRow}
                />
            )}
        </div>
    );
};

export default PicturesTable;