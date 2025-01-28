import React from "react";

const ReferenceTable = ({ referenceRows, addRefRow, removeRefRow, updateRefRow }) => {
    const handleInputChange = (index, field, value) => {
        updateRefRow(index, field, value); // Call a prop function to update the row data
    };

    return (
        <div className="input-box-2">
            <h3 className="font-fam-labels">References</h3>
            <table className="vcr-table">
                <thead>
                    <tr>
                        <th>Nr</th>
                        <th>Reference</th>
                        <th>Description</th>
                        <th className="ref-but-row">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {referenceRows.map((row, index) => (
                        <tr key={index}>
                            <td>
                                {row.nr}
                            </td>
                            <td>
                                <input
                                    type="text"
                                    className="table-control"
                                    value={row.ref}
                                    onChange={(e) => handleInputChange(index, "ref", e.target.value)}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    className="table-control"
                                    value={row.refDesc}
                                    onChange={(e) => handleInputChange(index, "refDesc", e.target.value)}
                                />
                            </td>
                            <td className="ref-but-row">
                                <button
                                    className="remove-row-button"
                                    onClick={() => removeRefRow(index)}
                                >
                                    Remove
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button className="add-row-button" onClick={addRefRow}>
                + Add Row
            </button>
        </div>
    );
};

export default ReferenceTable;
