import React, { useState, useEffect } from "react";
import "./PicturesTable.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan } from '@fortawesome/free-solid-svg-icons';

const PicturesTable = ({ picturesRows, addPicRow, removePicRow, updatePicRow }) => {
    const handleInputChange = (index, field, value) => {
        const prefix = `Figure 1.${index + 1}: `; // Auto-numbering format
        let updatedValue = value.startsWith(prefix) ? value : prefix + value;

        // Remove if only the prefix exists (no actual value after it)
        if (updatedValue === prefix) {
            updatedValue = "";
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
                                            value={row.pic1}
                                            onChange={(e) => handleInputChange(index, "pic1", e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className="table-control"
                                            value={row.pic2}
                                            onChange={(e) => handleInputChange(index, "pic2", e.target.value)}
                                        />
                                    </td>
                                    <td className="ref-but-row procCent">
                                        <button className="remove-row-button" onClick={() => removePicRow(index)}>
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <button className="add-row-button" onClick={addPicRow}>
                    Add
                </button>
            </div>
        </div>
    );
};

export default PicturesTable;
