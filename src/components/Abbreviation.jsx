import React, { useState } from "react";
import "./AbbreviationTable.css"; // Add styling here

const AbbreviationTable = ({ formData, setFormData, usedAbbrCodes, setUsedAbbrCodes }) => {
  const AbbrToMeaningMap = {
    "ASME": "American Society of Mechanical Engineers.",
    "ASTM": "American Society for Testing and Materials.",
    "ANSI": "American National Standards Institute.",
    "OEM": "Original Equipment Manufacturer.",
    "QAP": "Quality Assurance Procedure.",
    "QAR": "Quality Assurance Representative: An independent inspection agency appointed by the Engineer.",
    "ENP": "Electroless Nickel Plating.",
    "EPDM": "Ethylene Propylene Diene Monomer.",
    "SANS": "South African National Standards.",
    "BS": "British Standard.",
    "DIN": "Deutsche Institut Für Normung (German Standards Institute).",
    "MSHA": "Mines safety and health authority (USA).",
    "NDE": "Non-destructive examination (Magnetic particle NDE or dye penetrant).",
    "SABS": "South African Bureau of Standards.",
    "WLL": "Working Load Limit: The maximum mass that an air hoist is designed to raise, lower or suspend. It is equal to or greater than the safe working load.",
  };

  // State to control the popup and selected abbreviations
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedAbbrs, setSelectedAbbrs] = useState(new Set(usedAbbrCodes));

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
    setUsedAbbrCodes([...selectedAbbrs]);
    setFormData({
      ...formData,
      abbrRows: [...selectedAbbrs].map((abbr) => ({
        abbr,
        meaning: AbbrToMeaningMap[abbr],
      })),
    });
    setPopupVisible(false);
  };

  return (
    <div className="input-box-2">
      <h3>Abbreviations</h3>
      {/* Popup */}
      {popupVisible && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h4>Select Abbreviations</h4>
            <div className="checkbox-list">
              {Object.keys(AbbrToMeaningMap).map((abbr) => (
                <div key={abbr} className="checkbox-item">
                  <label className="item-abbr">
                    <input
                      type="checkbox"
                      className="checkbox-inp"
                      checked={selectedAbbrs.has(abbr)}
                      onChange={() => handleCheckboxChange(abbr)}
                    />
                    {abbr} - {AbbrToMeaningMap[abbr]}
                  </label>
                </div>
              ))}
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
      <table className="vcr-table">
        <thead>
          <tr>
            <th>Abbreviations</th>
            <th>Description</th>
            <th>Actions</th>
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
