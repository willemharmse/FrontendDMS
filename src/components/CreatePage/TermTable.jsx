import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./TermTable.css"; // Add styling here
import TermPopup from "../ValueChanges/TermPopup";

const TermTable = ({ formData, setFormData, usedTermCodes, setUsedTermCodes, role }) => {
  const [termData, setTermData] = useState([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedTerms, setSelectedTerms] = useState(new Set(usedTermCodes));
  const navigate = useNavigate();
  const [showNewPopup, setShowNewPopup] = useState(false);

  useEffect(() => {
    setSelectedTerms(new Set(usedTermCodes));
  }, [usedTermCodes]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/def`)
      .then((response) => response.json())
      .then((data) => {
        setTermData(data.defs);
      })
      .catch((error) => console.error("Error fetching terms:", error));
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

  return (
    <div className="term-input-box">
      <h3 className="font-fam-labels">Terms <span className="required-field">*</span></h3>
      {role === "admin" && (
        <button className="top-right-button-term" onClick={() => navigate("/FrontendDMS/manageTerms")}>Update Terms</button>
      )}
      {role === "admin" && (
        <button className="top-right-button-term-2" onClick={() => setShowNewPopup(true)}>Add Terms</button>
      )}
      <TermPopup
        isOpen={showNewPopup}
        onClose={() => setShowNewPopup(false)}
      />
      {popupVisible && (
        <div className="popup-overlay-terms">
          <div className="popup-content-terms">
            <h4 className="center-tems">Select Terms</h4>
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
                      .sort((a, b) => a.term.localeCompare(b.term))
                      .map((item) => (
                        <tr key={item.term}>
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
            <button className="save-selection-button" onClick={handleSaveSelection}>
              Save Selection
            </button>
            <button className="close-popup-button" onClick={handlePopupToggle}>
              Close
            </button>
          </div>
        </div>
      )}

      <table className="vcr-table table-borders">
        <thead className="cp-table-header">
          <tr>
            <th className="col-term-term">Term</th>
            <th className="col-term-desc">Definition</th>
            <th className="col-term-act"></th>
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
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="add-row-button" onClick={handlePopupToggle}>
        Select Terms
      </button>
    </div>
  );
};

export default TermTable;
