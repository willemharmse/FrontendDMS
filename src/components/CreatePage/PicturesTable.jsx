import React, { useState, useEffect } from "react";
import "./PicturesTable.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faPlusCircle } from '@fortawesome/free-solid-svg-icons';

const PicturesTable = ({ picturesRows, addPicRow, removePicRow, updatePicRow }) => {
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
        <div className="input-row">
            <div className="pic-box">
                <h3 className="font-fam-labels">Figures and Graphs</h3>
                {picturesRows.length > 0 && (
                    <table className="vcr-table table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="picColCen picOne">Picture Name</th>
                                <th className="picColCen picTwo">Picture Name</th>
                                <th className="picColCen picBut">Action</th>
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
                                            onChange={(e) => handleInputChange(index, "pic1", e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className="table-control"
                                            style={{ fontSize: "14px" }}
                                            value={row.pic2}
                                            onChange={(e) => handleInputChange(index, "pic2", e.target.value)}
                                        />
                                    </td>
                                    <td className="ref-but-row procCent">
                                        <button className="remove-row-button" onClick={() => removePicRow(index)}>
                                            <FontAwesomeIcon icon={faTrash} title="Remove Row" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {picturesRows.length === 0 && (
                    <button className="add-row-button-pic" onClick={addPicRow}>
                        Add
                    </button>
                )}

                {picturesRows.length > 0 && (
                    <button className="add-row-button-pic-plus" onClick={addPicRow}>
                        <FontAwesomeIcon icon={faPlusCircle} title="Add Row" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default PicturesTable;
