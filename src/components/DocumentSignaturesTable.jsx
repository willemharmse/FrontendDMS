import React from "react";

const DocumentSignaturesTable = ({ rows, handleRowChange, addRow, removeRow }) => {
  return (
    <div className="input-box-2">
      <h3>Document Signatures</h3>
      <table className="signature-table">
        <thead>
          <tr>
            <th>Authorizations</th>
            <th>Name</th>
            <th>Position</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>
                <select
                  className="table-control"
                  value={row.auth}
                  onChange={(e) => handleRowChange(e, index, "auth")}
                >
                  <option value="Author">Author</option>
                  <option value="Reviewer">Reviewer</option>
                  <option value="Approved By">Approved By</option>
                </select>
              </td>
              <td>
                <select
                  className="table-control"
                  value={row.name}
                  onChange={(e) => handleRowChange(e, index, "name")}
                >
                  <option value="Willem Harmse">Willem Harmse</option>
                  <option value="Abel Moetji">Abel Moetji</option>
                  <option value="Rossouw Snyders">Rossouw Snyders</option>
                  <option value="Anzel Swanepoel">Anzel Swanepoel</option>
                  <option value="Quintin Coetzee">Quintin Coetzee</option>
                  <option value="Andre Coetzee">Andre Coetzee</option>
                </select>
              </td>
              <td>
                <input
                  type="text"
                  className="table-control"
                  value={row.pos}
                  readOnly
                />
              </td>
              <td>
                <button
                  className="remove-row-button"
                  onClick={() => removeRow(index)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row-button" onClick={addRow}>
        + Add Row
      </button>
    </div>
  );
};

export default DocumentSignaturesTable;
