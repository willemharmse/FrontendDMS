import React from "react";
import "./DocumentSignaturesTable.css"

const DocumentSignaturesTable = ({ rows, handleRowChange, addRow, removeRow }) => {
  return (
    <div className="input-box-2">
      <h3 className="font-fam-labels">Document Signatures</h3>
      <table className="vcr-table-2 font-fam table-borders">
        <thead className="cp-table-header">
          <tr>
            <th className="font-fam cent">AUTHORIZATIONS</th>
            <th className="font-fam cent">NAME</th>
            <th className="font-fam cent">POSITION</th>
            <th className="font-fam cent col-sig-act"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>
                <select
                  className="table-control font-fam"
                  value={row.auth}
                  onChange={(e) => handleRowChange(e, index, "auth")}
                >
                  <option value="Author">Author</option>
                  <option value="Approved By">Approved By</option>
                  <option value="Reviewer">Reviewer</option>
                </select>
              </td>
              <td>
                <select
                  className="table-control font-fam"
                  value={row.name}
                  onChange={(e) => handleRowChange(e, index, "name")}
                >
                  <option value="Abel Moetji">Abel Moetji</option>
                  <option value="Andre Coetzee">Andre Coetzee</option>
                  <option value="Anzel Swanepoel">Anzel Swanepoel</option>
                  <option value="Quintin Coetzee">Quintin Coetzee</option>
                  <option value="Rossouw Snyders">Rossouw Snyders</option>
                  <option value="Willem Harmse">Willem Harmse</option>
                </select>
              </td>
              <td>
                <input
                  type="text"
                  className="table-control font-fam"
                  value={row.pos}
                  readOnly
                />
              </td>
              <td>
                <button
                  className="remove-row-button font-fam"
                  onClick={() => removeRow(index)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row-button font-fam" onClick={addRow}>
        + Add Row
      </button>
    </div>
  );
};

export default DocumentSignaturesTable;
