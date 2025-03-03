import React, { useState, useEffect } from "react";
import "./PicturesTable.css";

const PicturesTable = ({ picturesRows, addPicRow, removePicRow, updatePicRow }) => {
    const handleInputChange = (index, field, value) => {
        updatePicRow(index, field, value);
    };

    return (
        <div className="pic-box">
            <h3 className="font-fam-labels">Pictures</h3>
            {picturesRows.length > 0 && (
                <table className="vcr-table table-borders">
                    <thead className="cp-table-header">
                        <tr>
                            <th className="picColCen picOne">Picture Name</th>
                            <th className="picColCen picTwo">Picture Name</th>
                            <th className="picColCen picBut"></th>
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
                                <td className="ref-but-row">
                                    <button className="remove-row-button" onClick={() => removePicRow(index)}>
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <button className="add-row-button" onClick={addPicRow}>
                + Add Row
            </button>
        </div>
    );
};

export default PicturesTable;
