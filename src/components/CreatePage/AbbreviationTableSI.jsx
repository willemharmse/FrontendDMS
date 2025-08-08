import React, { useState, useEffect } from "react";
import "./AbbreviationTable.css"; // Add styling here
import AbbreviationPopup from "../ValueChanges/AbbreviationPopup";
import ManageAbbreviations from "../ValueChanges/ManageAbbreviations";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faX, faSearch, faHistory, faPlus, faPenToSquare, faPlusCircle, faEdit } from '@fortawesome/free-solid-svg-icons';
import ModifySuggestedAbbreviations from "../ValueChanges/ModifySuggestedAbbreviations";

const AbbreviationTableSI = ({ risk, formData, setFormData, usedAbbrCodes, setUsedAbbrCodes, role, error, userID, setErrors, si = false }) => {
  const [abbrData, setAbbrData] = useState([]);
  const [originalData, setOriginalData] = useState([])
  // State to control the popup and selected abbreviations
  const [popupVisible, setPopupVisible] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedAbbrs, setSelectedAbbrs] = useState(new Set(usedAbbrCodes));
  const [showNewPopup, setShowNewPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNA, setIsNA] = useState(false);
  const [abbrUpdate, setAbbrUpdate] = useState("");
  const [meanUpdate, setMeanUpdate] = useState("");
  const [updatePopup, setUpdatePopup] = useState(false);

  useEffect(() => {
    if (!popupVisible) return;

    setErrors(prev => ({
      ...prev,
      abbrs: false
    }));
  }, [popupVisible])

  const handleNAToggle = () => {
    const newValue = !isNA;
    setIsNA(newValue);
    if (!newValue) {
      setSelectedAbbrs(new Set());
      setUsedAbbrCodes([]);
      setFormData({ ...formData, abbrRows: [] });
    }
  };

  useEffect(() => {
    setSelectedAbbrs(new Set(usedAbbrCodes));
  }, [usedAbbrCodes]);

  const handleNewAbbreviation = (newAbbr) => {
    const code = newAbbr.abbr;
    // add to the “used” codes array
    setUsedAbbrCodes((prev) => [...prev, code]);
    setSelectedAbbrs((prev) => new Set(prev).add(code));
    setFormData((prev) => ({
      ...prev,
      abbrRows: [...prev.abbrRows, newAbbr],
    }));
  };

  const fetchValues = async () => {
    const route = risk ? `/api/riskInfo/abbr/` : "/api/docCreateVals/abbr";
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`);
      if (!response.ok) {
        throw new Error("Failed to fetch values");
      }

      const data = await response.json();

      setAbbrData(data.abbrs);
      setOriginalData(data.abbrs)
      localStorage.setItem('cachedAbbrOptions', JSON.stringify(data.abbrs));
    } catch (error) {
      console.log(error);
      const cached = localStorage.getItem('cachedAbbrOptions');
      if (cached) {
        setAbbrData(JSON.parse(cached));
      }
    }
  };

  const handleUpdateAbbreviation = (newAbbrObj, oldAbbr, oldMeaning) => {
    const updatedCode = newAbbrObj.abbr;

    // 1. Remove the old abbreviation from usedAbbrCodes
    setUsedAbbrCodes(prev =>
      prev.filter(code => code !== oldAbbr)
    );

    // 2. Remove from selectedAbbrs and add the new one
    setSelectedAbbrs(prev => {
      const updated = new Set(prev);
      updated.delete(oldAbbr);
      updated.add(updatedCode);
      return updated;
    });

    // 3. Replace the old row in abbrRows with the updated one
    setFormData(prev => ({
      ...prev,
      abbrRows: prev.abbrRows.map(row =>
        row.abbr === oldAbbr && row.meaning === oldMeaning
          ? newAbbrObj
          : row
      ),
    }));

    // 4. Optionally add to usedAbbrCodes again if needed (if not already added)
    setUsedAbbrCodes(prev => [...prev, updatedCode]);
  };

  const openUpdate = (abbr, meaning) => {
    setAbbrUpdate(abbr);
    setMeanUpdate(meaning);

    setUpdatePopup(true);
  }

  const closeUpdate = () => {
    setAbbrUpdate("");
    setMeanUpdate("");

    setUpdatePopup(false);
  }

  const clearSearch = () => {
    setSearchTerm("");
  };

  useEffect(() => {
    setSelectedAbbrs(new Set(usedAbbrCodes));
    if (usedAbbrCodes.length > 0) {
      setIsNA(true); // Automatically check the box if equipment data exists
    }
  }, [usedAbbrCodes]);

  useEffect(() => {
    fetchValues();
  }, []);

  const handlePopupToggle = () => {
    setSearchTerm("")
    setPopupVisible(!popupVisible);
  };

  const handleAbbreviationUpdate = (updatedAbbr, oldAbbr) => {
    // 1) Swap out the code in usedAbbrCodes
    setUsedAbbrCodes(prev =>
      prev.map(code => (code === oldAbbr ? updatedAbbr.abbr : code))
    );

    // 2) Update the selectedAbbrs Set
    setSelectedAbbrs(prev => {
      const next = new Set(prev);
      if (next.has(oldAbbr)) {
        next.delete(oldAbbr);
        next.add(updatedAbbr.abbr);
      }
      return next;
    });

    // 3) Remap the rows in formData.abbrRows
    setFormData(prev => ({
      ...prev,
      abbrRows: prev.abbrRows.map(row =>
        row.abbr === oldAbbr
          ? { abbr: updatedAbbr.abbr + " *", meaning: updatedAbbr.meaning }
          : row
      ),
    }));
  };

  const handleCheckboxChange = (abbr) => {
    const newSelectedAbbrs = new Set(selectedAbbrs);
    if (newSelectedAbbrs.has(abbr)) {
      newSelectedAbbrs.delete(abbr);
    } else {
      newSelectedAbbrs.add(abbr);
    }
    setSelectedAbbrs(newSelectedAbbrs);
  };

  const handleSaveSelection = () => {
    const selectedAbbrArray = [...selectedAbbrs];
    setUsedAbbrCodes(selectedAbbrArray);

    const selectedRows = selectedAbbrArray.map((abbr) => {
      const found = abbrData.find((item) => item.abbr === abbr);
      return found || { abbr, meaning: "" }; // Fallback if not found
    });

    setFormData({
      ...formData,
      abbrRows: selectedRows,
    });
    setPopupVisible(false);
  };

  const openManagePopup = (abbr) => {
    setAbbrUpdate(abbr);
    setIsManageOpen(true);
  }

  const closeManagePopup = () => {
    setAbbrUpdate("");
    setIsManageOpen(false);
  }

  const openAddPopup = () => {
    handleSaveSelection();
    setShowNewPopup(true)
  }

  return (
    <div className="input-row">
      <div className={`abbr-input-box ${error ? "error-abbr" : ""}`}>
        <div className="ppe-header">
          <input
            type="checkbox"
            className="na-checkbox-ppe"
            checked={isNA}
            onChange={handleNAToggle}
          />
          <h3 className="font-fam-labels">Abbreviations</h3>
        </div>
        <AbbreviationPopup
          isOpen={showNewPopup}
          onClose={() => { setShowNewPopup(false); }}
          role={role}
          userID={userID}
          setAbbrData={setAbbrData}
          onAdd={handleNewAbbreviation}
        />

        {isManageOpen && <ManageAbbreviations closePopup={closeManagePopup} onClose={closeManagePopup} onUpdate={handleAbbreviationUpdate} userID={userID}
          setAbbrData={setAbbrData}
          onAdd={handleNewAbbreviation}
          abbreviation={abbrUpdate}
        />}
        {/* Popup */}
        {popupVisible && (
          <div className="popup-overlay-abbr">
            <div className="popup-content-abbr">
              <div className="review-date-header">
                <h2 className="review-date-title">Select Abbreviations</h2>
                <button className="review-date-close" onClick={handlePopupToggle} title="Close Popup">×</button>
              </div>

              <div className="review-date-group">
                <div className="abbr-input-container">
                  <input
                    className="search-input-abbr"
                    type="text"
                    placeholder="Search Abbreviation"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                  {searchTerm === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                </div>
              </div>

              <div className="abbr-table-group">
                <div className="popup-table-wrapper-abbr">
                  <table className="popup-table font-fam">
                    <thead className="abbr-headers">
                      <tr>
                        <th className="inp-size-abbr">Select</th>
                        <th>Abbreviation</th>
                        <th className="def-size-abbr">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abbrData.length > 0 ? (
                        abbrData
                          .filter((item) =>
                            item.abbr.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .sort((a, b) => a.abbr.localeCompare(b.abbr))
                          .map((item) => (
                            <tr key={item.abbr} onClick={() => handleCheckboxChange(item.abbr)} style={{ cursor: "pointer" }}>
                              <td>
                                <input
                                  type="checkbox"
                                  className="checkbox-inp-abbr"
                                  checked={selectedAbbrs.has(item.abbr)}
                                  onChange={() => handleCheckboxChange(item.abbr)}
                                />
                              </td>
                              <td>{item.abbr}</td>
                              <td style={{ whiteSpace: "pre-wrap" }}>{item.meaning}</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="3">Loading abbreviations...</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="abbr-buttons-dual">
                <button onClick={handleSaveSelection} className="abbr-button-1">Save Selection</button>

                <button onClick={openAddPopup} className="abbr-button-2">Suggest New</button>
              </div>
            </div>
          </div>
        )}

        {/* Display selected abbreviations in a table */}
        {selectedAbbrs.size > 0 && (
          <table className="font-fam table-borders">
            <thead className="cp-table-header">
              <tr>
                <th className="col-abbr-abbr" style={{ textAlign: "center" }}>Abbreviations</th>
                <th className="col-abbr-desc" style={{ textAlign: "center" }}>Description</th>
                <th className="col-abbr-act" style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.abbrRows.map((row, index) => (
                <tr key={index}>
                  <td style={{ fontSize: "14px" }}>{row.abbr}</td>
                  <td style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{row.meaning}</td>
                  <td className="procCent">
                    <div className="term-action-buttons">
                      <button
                        className="remove-row-button"
                        style={{ paddingRight: "6px" }}
                        onClick={() => {
                          // Remove abbreviation from table and the selected abbreviations set
                          setFormData({
                            ...formData,
                            abbrRows: formData.abbrRows.filter((_, i) => i !== index),
                          });
                          setUsedAbbrCodes(
                            usedAbbrCodes.filter((abbr) => abbr !== row.abbr)
                          );

                          // Update the selectedAbbrs state to reflect the removal
                          const newSelectedAbbrs = new Set(selectedAbbrs);
                          newSelectedAbbrs.delete(row.abbr);
                          setSelectedAbbrs(newSelectedAbbrs);
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} title="Remove Row" />
                      </button>
                      <button
                        className="edit-terms-row-button"
                        style={{ paddingLeft: "6px" }}
                        onClick={() => {
                          if (originalData.some(item => item.abbr === row.abbr && item.meaning === row.meaning)) { openManagePopup(row.abbr) }
                          else {
                            openUpdate(row.abbr, row.meaning)

                          }
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} title="Modify Abbreviation" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(selectedAbbrs.size === 0 && isNA) && (
          <button className="add-row-button-abbrs" onClick={handlePopupToggle}>
            Select
          </button>
        )}

        {selectedAbbrs.size > 0 && (
          <button className="add-row-button-abbrs-plus" onClick={handlePopupToggle} title="Add Row">
            <FontAwesomeIcon icon={faPlusCircle} />
          </button>
        )}
      </div>

      {updatePopup && (<ModifySuggestedAbbreviations abbr={abbrUpdate} meaning={meanUpdate} closePopup={closeUpdate} onAdd={handleUpdateAbbreviation} setAbbrData={setAbbrData} />)}
    </div>
  );
};

export default AbbreviationTableSI;
