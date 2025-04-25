import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DocumentSignaturesTable.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faSpinner, faTrash, faTrashCan, faPlus } from '@fortawesome/free-solid-svg-icons';

const DocumentSignaturesTable = ({ rows, handleRowChange, addRow, removeRow, error, updateRows }) => {
  const [nameLists, setNameLists] = useState({
    Approver: [],
    Author: [],
    Reviewer: [],
  });

  const insertRowAt = (insertIndex) => {
    const newSignatures = [...rows];

    const newRow = {
      auth: "Author",
      name: "",
      pos: "",
      num: 1,
    };

    newSignatures.splice(insertIndex, 0, newRow);

    updateRows(newSignatures); // use your passed-in updateProcRows function
  };

  const [selectedNames, setSelectedNames] = useState(new Set());

  const [nameToPositionMap, setNameToPositionMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [authorsRes, approversRes, reviewersRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/auth`),
          axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/app`),
          axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/rev`),
        ]);

        const authors = authorsRes.data.authors.map((author) => ({
          name: author.author,
          position: author.pos,
        }));

        const approvers = approversRes.data.approvers.map((approver) => ({
          name: approver.approver,
          position: approver.pos,
        }));

        const reviewers = reviewersRes.data.reviewers.map((reviewer) => ({
          name: reviewer.reviewer,
          position: reviewer.pos,
        }));

        // Create a mapping of names to positions
        const positionMap = {};
        [...authors, ...approvers, ...reviewers].forEach(({ name, position }) => {
          positionMap[name] = position;
        });

        localStorage.setItem('cachedNameLists', JSON.stringify({
          authors,
          approvers,
          reviewers,
          positionMap
        }));

        setNameLists({
          Approver: approvers.map((a) => a.name),
          Author: authors.map((a) => a.name),
          Reviewer: reviewers.map((a) => a.name),
        });

        setNameToPositionMap(positionMap);
      } catch (error) {
        console.error("Error fetching names:", error);

        const cached = localStorage.getItem('cachedNameLists');
        if (cached) {
          const parsed = JSON.parse(cached);

          setNameLists({
            Approver: parsed.approvers.map((a) => a.name),
            Author: parsed.authors.map((a) => a.name),
            Reviewer: parsed.reviewers.map((a) => a.name),
          });

          setNameToPositionMap(parsed.positionMap || {});
        }
      }
    };

    fetchData();
  }, []);

  const [selectedNamesByAuth, setSelectedNamesByAuth] = useState({
    Author: [],
    Approver: [],
    Reviewer: [],
  });

  const handleNameChange = (e, index) => {
    const selectedName = e.target.value;
    const prevName = rows[index].name;

    setSelectedNames((prev) => {
      const updatedNames = new Set(prev);
      if (prevName) updatedNames.delete(prevName);
      if (selectedName) updatedNames.add(selectedName);
      return updatedNames;
    });

    handleRowChange(e, index, "name");

    // Update position based on the selected name
    handleRowChange({ target: { value: nameToPositionMap[selectedName] || "" } }, index, "pos");
  };

  return (
    <div className="input-row">
      <div className={`input-box-2 ${error ? "error-sign" : ""}`}>
        <h3 className="font-fam-labels">
          Document Signatures <span className="required-field">*</span>
        </h3>
        <table className="vcr-table-2 font-fam table-borders">
          <thead className="cp-table-header">
            <tr>
              <th className="font-fam cent">Authorizations</th>
              <th className="font-fam cent">Name</th>
              <th className="font-fam cent">Position</th>
              <th className="font-fam cent col-sig-act">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <tr className="insert-row-container-sig">
                    <td colSpan="4" className="insert-row-cell-sig">
                      <button
                        className="insert-row-button-sig"
                        onClick={() => insertRowAt(index)}
                        title="Insert signature here"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </td>
                  </tr>
                )}


                <tr key={index}>
                  <td>
                    <select
                      className="table-control font-fam"
                      value={row.auth}
                      onChange={(e) => handleRowChange(e, index, "auth")}
                    >
                      <option value="Author">Author</option>
                      <option value="Approver">Approver</option>
                      <option value="Reviewer">Reviewer</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className="table-control font-fam"
                      value={row.name}
                      onChange={(e) => handleNameChange(e, index)}
                    >
                      <option value="">Select Name</option>
                      {nameLists[row.auth]
                        .filter((name) => !selectedNames.has(name) || name === row.name)
                        .sort()
                        .map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
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
                  <td className="procCent">
                    <button
                      className="remove-row-button font-fam"
                      onClick={() => {
                        setSelectedNames((prev) => {
                          const updatedNames = new Set(prev);
                          updatedNames.delete(row.name);
                          return updatedNames;
                        });
                        removeRow(index);
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} title="Remove Row" />
                    </button>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <button className="add-row-button-ds font-fam" onClick={addRow}>
          <FontAwesomeIcon icon={faPlusCircle} title="Add Row" />
        </button>
      </div>
    </div>
  );
};

export default DocumentSignaturesTable;
