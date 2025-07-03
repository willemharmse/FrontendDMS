import React, { useState, useEffect } from "react";
import "./AbbreviationTableRisk.css"; // Add styling here
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faX, faSearch, faHistory, faPlus, faPenToSquare, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import RiskAbbreviationPopup from "../RiskValueChanges/RiskAbbreviationPopup";
import ManageRiskAbbreviations from "../RiskValueChanges/ManageRiskAbbreviations";

const AbbreviationTableRisk = ({ risk, formData, setFormData, usedAbbrCodes, setUsedAbbrCodes, role, error, userID }) => {
  const [abbrData, setAbbrData] = useState([]);
  // State to control the popup and selected abbreviations
  const [popupVisible, setPopupVisible] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedAbbrs, setSelectedAbbrs] = useState(new Set(usedAbbrCodes));
  const [showNewPopup, setShowNewPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
    const route = `/api/riskInfo/abbr/`;
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`);
      if (!response.ok) {
        throw new Error("Failed to fetch values");
      }

      const data = await response.json();

      setAbbrData(data.abbrs);
      localStorage.setItem('cachedAbbrOptions', JSON.stringify(data.abbrs));
    } catch (error) {
      console.log(error);
      const cached = localStorage.getItem('cachedAbbrOptions');
      if (cached) {
        setAbbrData(JSON.parse(cached));
      }
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

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

  const openManagePopup = () => setIsManageOpen(true);
  const closeManagePopup = () => setIsManageOpen(false);

  return (
    <div className="input-row">
      <div className={`abbr-input-box ${error ? "error-abbr" : ""}`}>
        <h3 className="font-fam-labels">Abbreviations</h3>
        {role === "admin" && (
          <button className="top-right-button-abbr-2" onClick={openManagePopup}><FontAwesomeIcon icon={faPenToSquare} onClick={clearSearch} className="icon-um-search" title="Edit Abbreviations" /></button>
        )}
        <button className="top-right-button-abbr" onClick={() => setShowNewPopup(true)}><FontAwesomeIcon icon={faPlusCircle} onClick={clearSearch} className="icon-um-search" title="Suggest Abbreviation" /></button>
        <RiskAbbreviationPopup
          isOpen={showNewPopup}
          onClose={() => { setShowNewPopup(false); }}
          role={role}
          userID={userID}
          setAbbrData={setAbbrData}
          onAdd={handleNewAbbreviation}
        />

        {isManageOpen && <ManageRiskAbbreviations closePopup={closeManagePopup} onClose={closeManagePopup} onUpdate={handleAbbreviationUpdate} userID={userID}
          setAbbrData={setAbbrData}
          onAdd={handleNewAbbreviation}
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
                              <td>{item.meaning}</td>
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
              <div className="abbr-buttons">
                <button onClick={handleSaveSelection} className="abbr-button">Save Selection</button>
              </div>
            </div>
          </div>
        )}

        {/* Display selected abbreviations in a table */}
        {selectedAbbrs.size > 0 && (
          <table className="font-fam table-borders">
            <thead className="cp-table-header">
              <tr>
                <th className="col-abbr-abbr">Abbreviations</th>
                <th className="col-abbr-desc">Description</th>
                <th className="col-abbr-act">Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.abbrRows.map((row, index) => (
                <tr style={{ paddingTop: "1px", paddingBottom: "1px", height: "13px" }} key={index}>
                  <td style={{ fontSize: "14px", paddingTop: "1px", paddingBottom: "1px", height: "13px" }} className="abbr-slim">{row.abbr}</td>
                  <td style={{ fontSize: "14px", paddingTop: "1px", paddingBottom: "1px", height: "13px" }} className="abbr-slim">{row.meaning}</td>
                  <td className="procCent"
                    style={{ paddingTop: "1px", paddingBottom: "1px", height: "13px" }}>
                    <button
                      className="remove-row-button"
                      onClick={() => {
                        // Remove abbreviation from table and the selected abbreviations set
                        const cleanAbbr = row.abbr.replace(/\s*\*$/, "");

                        setFormData({
                          ...formData,
                          abbrRows: formData.abbrRows.filter((_, i) => i !== index),
                        });
                        setUsedAbbrCodes(
                          usedAbbrCodes.filter((abbr) => abbr !== cleanAbbr)
                        );

                        // Update the selectedAbbrs state to reflect the removal
                        const newSelectedAbbrs = new Set(selectedAbbrs);
                        newSelectedAbbrs.delete(cleanAbbr);
                        setSelectedAbbrs(newSelectedAbbrs);
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} title="Remove Row" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selectedAbbrs.size === 0 && (
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
    </div>
  );
};

export default AbbreviationTableRisk;
