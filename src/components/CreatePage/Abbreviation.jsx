import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AbbreviationTable.css"; // Add styling here
import AbbreviationPopup from "../ValueChanges/AbbreviationPopup";
import ManageAbbreviations from "../ValueChanges/ManageAbbreviations";

const AbbreviationTable = ({ formData, setFormData, usedAbbrCodes, setUsedAbbrCodes, role }) => {
  const [abbrData, setAbbrData] = useState([]);
  // State to control the popup and selected abbreviations
  const [popupVisible, setPopupVisible] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedAbbrs, setSelectedAbbrs] = useState(new Set(usedAbbrCodes));
  const navigate = useNavigate();
  const [showNewPopup, setShowNewPopup] = useState(false);

  useEffect(() => {
    setSelectedAbbrs(new Set(usedAbbrCodes));
  }, [usedAbbrCodes]);

  const fetchValues = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/abbr`);
      if (!response.ok) {
        throw new Error("Failed to fetch values");
      }

      const data = await response.json();

      setAbbrData(data.abbrs);
    } catch (error) {
      console.error("Error fetching abbreviations:", error)
    }
  };

  useEffect(() => {
    fetchValues();
  }, []);

  const handlePopupToggle = () => {
    setPopupVisible(!popupVisible);
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
    <div className="abbr-input-box">
      <h3 className="font-fam-labels">Abbreviations  <span className="required-field">*</span></h3>
      {role === "admin" && (
        <button className="top-right-button-abbr" onClick={openManagePopup}>Update Abbreviations</button>
      )}
      {role === "admin" && (
        <button className="top-right-button-abbr-2" onClick={() => setShowNewPopup(true)}>Add Abbreviations</button>
      )}
      <AbbreviationPopup
        isOpen={showNewPopup}
        onClose={() => { setShowNewPopup(false); fetchValues(); }}
      />

      {isManageOpen && <ManageAbbreviations closePopup={closeManagePopup} onClose={fetchValues} />}
      {/* Popup */}
      {popupVisible && (
        <div className="popup-overlay-abbr">
          <div className="popup-content-terms">
            <h4 className="center-abbrs">Select Abbreviations</h4>
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
                  {/* Check if abbrData is loaded */}
                  {abbrData.length > 0 ? (
                    abbrData
                      .sort((a, b) => a.abbr.localeCompare(b.abbr))
                      .map((item) => (
                        <tr key={item.abbr}>
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
            <button className="save-selection-button" onClick={handleSaveSelection}>
              Save Selection
            </button>
            <button className="close-popup-button" onClick={handlePopupToggle}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Display selected abbreviations in a table */}
      <table className="font-fam table-borders">
        <thead className="cp-table-header">
          <tr>
            <th className="col-abbr-abbr">Abbreviations</th>
            <th className="col-abbr-desc">Description</th>
            <th className="col-abbr-act"></th>
          </tr>
        </thead>
        <tbody>
          {formData.abbrRows.map((row, index) => (
            <tr key={index}>
              <td>{row.abbr}</td>
              <td>{row.meaning}</td>
              <td>
                <button
                  className="remove-row-button"
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
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="add-row-button" onClick={handlePopupToggle}>
        Select Abbreviations
      </button>
    </div>
  );
};

export default AbbreviationTable;
