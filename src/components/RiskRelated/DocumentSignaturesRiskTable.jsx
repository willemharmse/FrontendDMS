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
        const res = await axios.get(`${process.env.REACT_APP_URL}/api/riskInfo/stk`);
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
    closeDropdowns();
    // show all except other selected
    const opts = nameLists;
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
      .filter(n => n.toLowerCase().includes(value.toLowerCase()));
    setFilteredNameOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(nameInputRefs.current[index]);
    setShowNameDropdown(index);
  };

  const handleSelectName = (index, name) => {
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
    closeDropdowns();
    const base = posLists
      .filter(p => p?.trim() !== "");
    const opts = base;
    setFilteredPosOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(posInputRefs.current[index]);
    setShowPosDropdown(index);
  };

  const handlePosInputChange = (index, value) => {
    handleRowChange({ target: { value } }, index, "pos");
    const opts = posLists
      .filter(p => p.toLowerCase().includes(value.toLowerCase()));
    setFilteredPosOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(posInputRefs.current[index]);
    setShowPosDropdown(index);
  };

  const handleSelectPos = (index, pos) => {
    handleRowChange({ target: { value: pos } }, index, "pos");
    setShowPosDropdown(null);
  };

  const closeDropdowns = () => {
    setShowNameDropdown(null);
    setShowPosDropdown(false);
  };

  useEffect(() => {
    const popupSelector = '.floating-dropdown';

    const handleClickOutside = e => {
      const outside =
        !e.target.closest(popupSelector) &&
        !e.target.closest('input');
      if (outside) {
        closeDropdowns();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };

    const handleScroll = e => {
      const isInsidePopup = e.target.closest(popupSelector);
      if (!isInsidePopup) {
        closeDropdowns();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };

    const closeDropdowns = () => {
      setShowNameDropdown(null);
      setShowPosDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showNameDropdown, showPosDropdown]);

  return (
    <div className="input-row">
      <div className={`input-box-sig-risk ${error ? "error-sign" : ""}`}>
        <h3 className="font-fam-labels">
          Authorisations
        </h3>
        <table className="vcr-table-2 font-fam table-borders">
          <thead className="cp-table-header">
            <tr>
              <th className="font-fam cent col-sig-auth-risk">Authorisation</th>
              <th className="font-fam cent col-sig-name-risk">Name</th>
              <th className="font-fam cent col-sig-pos-risk">Position</th>
              <th className="font-fam cent col-sig-act-risk">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td>

                  <div className="jra-info-popup-page-select-container">
                    <select
                      className="table-control font-fam remove-default-styling"
                      value={row.auth}
                      onChange={e => handleRowChange(e, idx, "auth")}
                      style={{ fontSize: "14px" }}
                    >
                      <option value="Approver">Approver</option>
                      <option value="Facilitator">Facilitator</option>
                      <option value="Owner">Owner</option>
                      <option value="Reviewer">Reviewer</option>
                    </select>
                  </div>
                </td>
                <td>
                  <input
                    type="text"
                    className="table-control font-fam"
                    style={{ fontSize: "14px" }}
                    value={row.name}
                    onFocus={() => openNameDropdown(idx)}
                    onChange={e => handleNameInputChange(idx, e.target.value)}
                    ref={el => (nameInputRefs.current[idx] = el)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="table-control font-fam"
                    value={row.pos}
                    style={{ fontSize: "14px" }}
                    onFocus={() => openPosDropdown(idx)}
                    onChange={e => handlePosInputChange(idx, e.target.value)}
                    ref={el => (posInputRefs.current[idx] = el)}
                  />
                </td>
                <td className="procCent action-cell-auth-risk ">
                  <button
                    className="remove-row-button font-fam"
                    onClick={() => {
                      removeRow(idx);
                    }}

                    style={{ fontSize: "14px" }}
                    title="Remove Row"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <button
                    className="insert-row-button-sig-risk font-fam"
                    onClick={() => insertRowAt(idx + 1)}
                    title="Add Row"
                    style={{ fontSize: "15px" }}
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
              width: dropdownPosition.width,
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
