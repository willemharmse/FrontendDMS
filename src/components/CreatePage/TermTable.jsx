import React, { useState, useEffect } from "react";
import "./TermTable.css"; // Add styling here
import TermPopup from "../ValueChanges/TermPopup";
import ManageDefinitions from "../ValueChanges/ManageDefinitions";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faX, faSearch, faHistory, faPlus, faPenToSquare, faPlusCircle, faEdit } from '@fortawesome/free-solid-svg-icons';
import ModifySuggestedDefinitions from "../ValueChanges/ModifySuggestedDefinitions";

const TermTable = ({ risk, formData, setFormData, usedTermCodes, setUsedTermCodes, role, error, userID, setErrors, si = false }) => {
  const [termData, setTermData] = useState([]);
  const [originalData, setOriginalData] = useState([])
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedTerms, setSelectedTerms] = useState(new Set(usedTermCodes));
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [showNewPopup, setShowNewPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [termUpdate, setTermUpdate] = useState("");
  const [defUpdate, setDefUpdate] = useState("");
  const [updatePopup, setUpdatePopup] = useState(false);

  useEffect(() => {
    setSelectedTerms(new Set(usedTermCodes));
  }, [usedTermCodes]);

  useEffect(() => {
    if (!popupVisible) return;

    setErrors(prev => ({
      ...prev,
      terms: false
    }));
  }, [popupVisible])

  const fetchValues = async () => {
    const route = risk ? `/api/riskInfo/def` : "/api/docCreateVals/def";
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`);
      if (!response.ok) {
        throw new Error("Failed to fetch values");
      }

      const data = await response.json();

      setTermData(data.defs);
      setOriginalData(data.defs);
      localStorage.setItem('cachedTermOptions', JSON.stringify(data.defs));
    } catch (error) {
      console.log(error);
      const cached = localStorage.getItem('cachedTermOptions');
      if (cached) {
        setTermData(JSON.parse(cached));
      }
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  useEffect(() => {
    fetchValues();
  }, []);

  const handleNewTerm = (newTerm) => {
    const code = newTerm.term;
    // add to the “used” codes array
    setUsedTermCodes((prev) => [...prev, code]);
    setSelectedTerms((prev) => new Set(prev).add(code));
    setFormData((prev) => ({
      ...prev,
      termRows: [...prev.termRows, newTerm],
    }));
  };


  const handleUpdateTerm = (newTermObj, oldTerm, oldDef) => {
    const updatedCode = newTermObj.term;

    // 1. Remove the old abbreviation from usedAbbrCodes
    setUsedTermCodes(prev =>
      prev.filter(code => code !== oldTerm)
    );

    // 2. Remove from selectedAbbrs and add the new one
    setSelectedTerms(prev => {
      const updated = new Set(prev);
      updated.delete(oldTerm);
      updated.add(updatedCode);
      return updated;
    });

    // 3. Replace the old row in abbrRows with the updated one
    setFormData(prev => ({
      ...prev,
      termRows: prev.termRows.map(row =>
        row.term === oldTerm && row.definition === oldDef
          ? newTermObj
          : row
      ),
    }));

    // 4. Optionally add to usedAbbrCodes again if needed (if not already added)
    setUsedTermCodes(prev => [...prev, updatedCode]);
  };

  const openUpdate = (term, definition) => {
    setTermUpdate(term);
    setDefUpdate(definition);

    setUpdatePopup(true);
  }

  const closeUpdate = () => {
    setTermUpdate("");
    setDefUpdate("");

    setUpdatePopup(false);
  }

  const handleTermUpdate = (updatedTerm, oldTerm) => {
    // 1) Swap out the code in usedAbbrCodes
    setUsedTermCodes(prev =>
      prev.map(code => (code === oldTerm ? updatedTerm.term : code))
    );

    // 2) Update the selectedAbbrs Set
    setSelectedTerms(prev => {
      const next = new Set(prev);
      if (next.has(oldTerm)) {
        next.delete(oldTerm);
        next.add(updatedTerm.term);
      }
      return next;
    });

    // 3) Remap the rows in formData.abbrRows
    setFormData(prev => ({
      ...prev,
      termRows: prev.termRows.map(row =>
        row.term === oldTerm
          ? { term: updatedTerm.term + " *", definition: updatedTerm.definition }
          : row
      ),
    }));
  };

  const handlePopupToggle = () => {
    setSearchTerm("")
    setPopupVisible(!popupVisible);
  };

  const handleCheckboxChange = (term) => {
    const newSelectedTerm = new Set(selectedTerms);
    if (newSelectedTerm.has(term)) {
      newSelectedTerm.delete(term);
    } else {
      newSelectedTerm.add(term);
    }
    setSelectedTerms(newSelectedTerm);
  };

  const handleSaveSelection = () => {
    const selectedTermsArray = [...selectedTerms];
    setUsedTermCodes(selectedTermsArray);

    const selectedRows = selectedTermsArray.map((term) => {
      const found = termData.find((item) => item.term === term);
      return found || { term, definition: "" }; // Fallback if not found
    });

    setFormData({
      ...formData,
      termRows: selectedRows,
    });
    setPopupVisible(false);
  };

  const openManagePopup = () => setIsManageOpen(true);
  const closeManagePopup = () => setIsManageOpen(false);

  return (
    <div className="input-row">
      <div className={`term-input-box ${error ? "error-term" : ""}`}>
        <h3 className="font-fam-labels">Terms & Definitions <span className="required-field">{si ? "" : "*"}</span></h3>
        {role === "admin" && (
          <button className="top-right-button-term-2" onClick={openManagePopup}><FontAwesomeIcon icon={faPenToSquare} onClick={clearSearch} className="icon-um-search" title="Edit Terms" /></button>
        )}
        <button className="top-right-button-term" onClick={() => setShowNewPopup(true)}><FontAwesomeIcon icon={faPlusCircle} onClick={clearSearch} className="icon-um-search" title="Suggest Term" /></button>
        <TermPopup
          isOpen={showNewPopup}
          onClose={() => { setShowNewPopup(false); }}
          role={role}
          userID={userID}
          setTermData={setTermData}
          onAdd={handleNewTerm}
        />

        {isManageOpen && <ManageDefinitions closePopup={closeManagePopup} onClose={closeManagePopup} onUpdate={handleTermUpdate}
          userID={userID}
          setTermData={setTermData}
          onAdd={handleNewTerm} />}

        {popupVisible && (
          <div className="popup-overlay-terms">
            <div className="popup-content-terms">
              <div className="review-date-header">
                <h2 className="review-date-title">Select Terms</h2>
                <button className="review-date-close" onClick={handlePopupToggle} title="Close Popup">×</button>
              </div>

              <div className="review-date-group">
                <div className="term-input-container">
                  <input
                    className="search-input-term"
                    type="text"
                    placeholder="Search Term"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                  {searchTerm === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                </div>
              </div>

              <div className="term-table-group">
                <div className="popup-table-wrapper">
                  <table className="popup-table font-fam">
                    <thead className="terms-headers">
                      <tr>
                        <th className="inp-size">Select</th>
                        <th>Term</th>
                        <th className="def-size">Definition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Check if abbrData is loaded */}
                      {termData.length > 0 ? (
                        termData
                          .filter((item) =>
                            item.term.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .sort((a, b) => a.term.localeCompare(b.term))
                          .map((item) => (
                            <tr key={item.term}
                              onClick={() => handleCheckboxChange(item.term)}
                              style={{ cursor: "pointer" }}
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  className="checkbox-inp-term"
                                  checked={selectedTerms.has(item.term)}
                                  onChange={() => handleCheckboxChange(item.term)}
                                />
                              </td>
                              <td style={{ whiteSpace: "pre-wrap" }}>{item.term}</td>
                              <td style={{ whiteSpace: "pre-wrap" }}>{item.definition}</td>
                            </tr>
                          ))) : (
                        <tr>
                          <td colSpan="3">Loading abbreviations...</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="term-buttons">
                <button onClick={handleSaveSelection} className="term-button">Save Selection</button>
              </div>
            </div>
          </div>
        )}

        {selectedTerms.size > 0 && (
          <table className="vcr-table table-borders">
            <thead className="cp-table-header">
              <tr>
                <th className="col-term-term" style={{ textAlign: "center" }}>Term</th>
                <th className="col-term-desc" style={{ textAlign: "center" }}>Definition</th>
                <th className="col-term-act" style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.termRows.map((row, index) => (
                <tr key={index}>
                  <td style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{row.term}</td>
                  <td style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{row.definition}</td>
                  <td className="procCent " style={{ paddingBottom: "10px" }}>
                    <div className="term-action-buttons">
                      <button
                        className="remove-row-button"
                        style={{ paddingRight: "6px" }}
                        onClick={() => {
                          // Remove abbreviation from table and the selected abbreviations set
                          setFormData({
                            ...formData,
                            termRows: formData.termRows.filter((_, i) => i !== index),
                          });
                          setUsedTermCodes(
                            usedTermCodes.filter((term) => term !== row.term)
                          );

                          // Update the selectedAbbrs state to reflect the removal
                          const newSelectedTerms = new Set(selectedTerms);
                          newSelectedTerms.delete(row.term);
                          setSelectedTerms(newSelectedTerms);
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} title="Remove Row" />
                      </button>
                      <button
                        className="edit-terms-row-button"
                        disabled={
                          originalData.some(item => item.term === row.term && item.definition === row.definition)
                        }
                        style={{ color: originalData.some(item => item.term === row.term && item.definition === row.definition) ? "lightgray" : "", paddingLeft: "6px" }}
                        onClick={() => {
                          openUpdate(row.term, row.definition)
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} title="Modify Term" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selectedTerms.size === 0 && (
          <button className="add-row-button-terms" onClick={handlePopupToggle}>
            Select
          </button>
        )}

        {selectedTerms.size > 0 && (
          <button className="add-row-button-terms-plus" onClick={handlePopupToggle}>
            <FontAwesomeIcon icon={faPlusCircle} title="Add Row" />
          </button>
        )}

      </div>

      {updatePopup && (<ModifySuggestedDefinitions term={termUpdate} definition={defUpdate} closePopup={closeUpdate} onAdd={handleUpdateTerm} setTermData={setTermData} />)}
    </div>
  );
};

export default TermTable;
