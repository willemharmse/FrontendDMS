import React, { useState, useEffect } from "react";
import "./TermTable.css"; // Add styling here
import TermPopup from "../ValueChanges/TermPopup";
import ManageDefinitions from "../ValueChanges/ManageDefinitions";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faX, faSearch } from '@fortawesome/free-solid-svg-icons';

const TermTable = ({ formData, setFormData, usedTermCodes, setUsedTermCodes, role, error, userID }) => {
  const [termData, setTermData] = useState([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedTerms, setSelectedTerms] = useState(new Set(usedTermCodes));
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [showNewPopup, setShowNewPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setSelectedTerms(new Set(usedTermCodes));
  }, [usedTermCodes]);

  const fetchValues = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/def`);
      if (!response.ok) {
        throw new Error("Failed to fetch values");
      }

      const data = await response.json();

      setTermData(data.defs);
    } catch (error) {
      console.error("Error fetching abbreviations:", error)
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  useEffect(() => {
    fetchValues();
  }, []);

  const handlePopupToggle = () => {
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
        <h3 className="font-fam-labels">Terms <span className="required-field">*</span></h3>
        {role === "admin" && (
          <button className="top-right-button-term-2" onClick={openManagePopup}>Update</button>
        )}
        <button className="top-right-button-term" onClick={() => setShowNewPopup(true)}>Add</button>
        <TermPopup
          isOpen={showNewPopup}
          onClose={() => { setShowNewPopup(false); if (role === "admin") fetchValues(); }}
          role={role}
          userID={userID}
          setTermData={setTermData}
        />

        {isManageOpen && <ManageDefinitions closePopup={closeManagePopup} onClose={fetchValues} />}

        {popupVisible && (
          <div className="popup-overlay-terms">
            <div className="popup-content-terms">
              <div className="review-date-header">
                <h2 className="review-date-title">Select Terms</h2>
                <button className="review-date-close" onClick={handlePopupToggle}>×</button>
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
                  {searchTerm !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" /></i>)}
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
                        <th className="def-size">Meaning</th>
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
                              <td>{item.term}</td>
                              <td>{item.definition}</td>
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
                <th className="col-term-term">Term</th>
                <th className="col-term-desc">Definition</th>
                <th className="col-term-act">Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.termRows.map((row, index) => (
                <tr key={index}>
                  <td>{row.term}</td>
                  <td>{row.definition}</td>
                  <td>
                    <button
                      className="remove-row-button"
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
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button className="add-row-button" onClick={handlePopupToggle}>
          Select Terms
        </button>
      </div>
    </div>
  );
};

export default TermTable;
