import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./DocumentSignaturesRiskTable.css";
// reuse the floating-dropdown styles
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faTrash, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const DocumentSignaturesRiskTable = ({
  rows,
  handleRowChange,
  addRow,
  removeRow,
  error,
  updateRows
}) => {
  const [nameLists, setNameLists] = useState([]);
  const [posLists, setPosLists] = useState([]);
  const [nameToPositionMap, setNameToPositionMap] = useState({});
  const [selectedNames, setSelectedNames] = useState(new Set());

  // floating dropdown state
  const [showNameDropdown, setShowNameDropdown] = useState(null);
  const [filteredNameOptions, setFilteredNameOptions] = useState({});
  const [showPosDropdown, setShowPosDropdown] = useState(null);
  const [filteredPosOptions, setFilteredPosOptions] = useState({});
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // refs to compute dropdown position
  const nameInputRefs = useRef([]);
  const posInputRefs = useRef([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/stk`);
        const data = res.data.stakeholders; // [{ name, position }, …]

        // build name → position map
        const positionMap = {};
        data.forEach(({ name, pos }) => {
          positionMap[name] = pos;
        });

        // unique sorted lists
        const names = data.map(d => d.name).sort();
        const positions = Array.from(new Set(data.map(d => d.pos))).sort();

        // cache in localStorage
        localStorage.setItem(
          "cachedStakeholders",
          JSON.stringify({ names, positions, positionMap })
        );

        setNameLists(names);
        setPosLists(positions);
        setNameToPositionMap(positionMap);
      } catch {
        const cached = localStorage.getItem("cachedStakeholders");
        if (cached) {
          const { names, positions, positionMap } = JSON.parse(cached);
          setNameLists(names);
          setPosLists(positions);
          setNameToPositionMap(positionMap);
        }
      }
    };
    fetchData();
  }, []);

  const insertRowAt = (insertIndex) => {
    const newSignatures = [...rows];
    const authType = newSignatures[insertIndex - 1].auth;
    newSignatures.splice(insertIndex, 0, {
      auth: authType,
      name: "",
      pos: "",
      num: 1,
    });
    updateRows(newSignatures);
  };

  // position the floating dropdown under a given input ref
  const positionDropdown = (inputEl) => {
    if (!inputEl) return;
    const rect = inputEl.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width
    });
  };

  // —— Name dropdown handlers —— //

  const openNameDropdown = (index) => {
    // show all except other selected
    const opts = nameLists
      .filter(n => !selectedNames.has(n) || n === rows[index].name)
      .slice(0, 15);
    setFilteredNameOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(nameInputRefs.current[index]);
    setShowNameDropdown(index);
  };

  const handleNameInputChange = (index, value) => {
    // update the name field
    handleRowChange({ target: { value } }, index, "name");
    // auto-fill pos
    handleRowChange(
      { target: { value: nameToPositionMap[value] || "" } },
      index,
      "pos"
    );

    const opts = nameLists
      .filter(n =>
        n.toLowerCase().includes(value.toLowerCase()) &&
        (!selectedNames.has(n) || n === rows[index].name)
      )
      .slice(0, 15);
    setFilteredNameOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(nameInputRefs.current[index]);
    setShowNameDropdown(index);
  };

  const handleSelectName = (index, name) => {
    // update selectedNames set
    setSelectedNames(prev => {
      const copy = new Set(prev);
      if (rows[index].name) copy.delete(rows[index].name);
      copy.add(name);
      return copy;
    });
    // finalize name & auto-fill pos
    handleRowChange({ target: { value: name } }, index, "name");
    handleRowChange(
      { target: { value: nameToPositionMap[name] || "" } },
      index,
      "pos"
    );
    setShowNameDropdown(null);
  };

  // —— Position dropdown handlers —— //

  const openPosDropdown = (index) => {
    const opts = posLists.slice(0, 15);
    setFilteredPosOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(posInputRefs.current[index]);
    setShowPosDropdown(index);
  };

  const handlePosInputChange = (index, value) => {
    handleRowChange({ target: { value } }, index, "pos");
    const opts = posLists
      .filter(p => p.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 15);
    setFilteredPosOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(posInputRefs.current[index]);
    setShowPosDropdown(index);
  };

  const handleSelectPos = (index, pos) => {
    handleRowChange({ target: { value: pos } }, index, "pos");
    setShowPosDropdown(null);
  };

  return (
    <div className="input-row">
      <div className={`input-box-sig-risk ${error ? "error-sign" : ""}`}>
        <h3 className="font-fam-labels">
          Document Signatures <span className="required-field">*</span>
        </h3>
        <table className="vcr-table-2 font-fam table-borders">
          <thead className="cp-table-header">
            <tr>
              <th className="font-fam cent col-sig-auth-risk">Authorizations</th>
              <th className="font-fam cent col-sig-name-risk">Name</th>
              <th className="font-fam cent col-sig-pos-risk">Position</th>
              <th className="font-fam cent col-sig-act-risk">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <select
                    className="table-control font-fam"
                    value={row.auth}
                    onChange={e => handleRowChange(e, idx, "auth")}
                  >
                    <option value="Approver">Approver</option>
                    <option value="Facilitator">Facilitator</option>
                    <option value="Owner">Owner</option>
                    <option value="Reviewer">Reviewer</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="table-control font-fam"
                    value={row.name}
                    onFocus={() => openNameDropdown(idx)}
                    onChange={e => handleNameInputChange(idx, e.target.value)}
                    onBlur={() => setTimeout(() => setShowNameDropdown(null), 200)}
                    ref={el => (nameInputRefs.current[idx] = el)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="table-control font-fam"
                    value={row.pos}
                    onFocus={() => openPosDropdown(idx)}
                    onChange={e => handlePosInputChange(idx, e.target.value)}
                    onBlur={() => setTimeout(() => setShowPosDropdown(null), 200)}
                    ref={el => (posInputRefs.current[idx] = el)}
                  />
                </td>
                <td className="procCent action-cell">
                  <button
                    className="remove-row-button font-fam"
                    onClick={() => {
                      setSelectedNames(prev => {
                        const c = new Set(prev);
                        c.delete(row.name);
                        return c;
                      });
                      removeRow(idx);
                    }}
                    title="Remove Row"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <button
                    className="insert-row-button-sig-risk font-fam"
                    onClick={() => insertRowAt(idx + 1)}
                    title="Add Row"
                  >
                    <FontAwesomeIcon icon={faPlusCircle} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Name dropdown */}
        {showNameDropdown !== null && filteredNameOptions[showNameDropdown]?.length > 0 && (
          <ul
            className="floating-dropdown"
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width
            }}
          >
            {filteredNameOptions[showNameDropdown].map((n, i) => (
              <li key={i} onMouseDown={() => handleSelectName(showNameDropdown, n)}>
                {n}
              </li>
            ))}
          </ul>
        )}

        {/* Position dropdown */}
        {showPosDropdown !== null && filteredPosOptions[showPosDropdown]?.length > 0 && (
          <ul
            className="floating-dropdown"
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width
            }}
          >
            {filteredPosOptions[showPosDropdown].map((p, i) => (
              <li key={i} onMouseDown={() => handleSelectPos(showPosDropdown, p)}>
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DocumentSignaturesRiskTable;
