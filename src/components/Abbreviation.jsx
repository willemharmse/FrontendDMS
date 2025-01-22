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

    const handleAbbrRowChange = (e, index, field) => {
        const newAbbrRows = [...formData.abbrRows];
    
        if (field === "abbr") {
          const selectedMean = e.target.value;
          newAbbrRows[index].meaning = AbbrToMeaningMap[selectedMean] || "";
        }
    
        newAbbrRows[index][field] = e.target.value;
        setUsedAbbrCodes(newAbbrRows.map((row) => row.abbr));
        setFormData({ ...formData, abbrRows: newAbbrRows });
    };
    
    const addAbbrRow = () => {
        // Find the first available term that is not used
        const availableAbbr = Object.keys(AbbrToMeaningMap).find((abbr) => !usedAbbrCodes.includes(abbr)) || "VCR";
        
        const newAbbrRows = [
          ...formData.abbrRows,
          { abbr: availableAbbr, meaning: AbbrToMeaningMap[availableAbbr] }
        ];
  
        // Add the term to usedTermCodes immediately
        const newUsedAbbrCodes = [...usedAbbrCodes, availableAbbr];
        
        setFormData({ ...formData, abbrRows: newAbbrRows });
        setUsedAbbrCodes(newUsedAbbrCodes);
    };

    const removeAbbrRow = (index) => {
        const newAbbrRows = [...formData.abbrRows];
        const removedAbbr = newAbbrRows[index].abbr;
        newAbbrRows.splice(index, 1);
        
        // Remove the term from usedTermCodes
        const updatedUsedAbbrCodes = usedAbbrCodes.filter((abbr) => abbr !== removedAbbr);
        setUsedAbbrCodes(updatedUsedAbbrCodes);
  
        setFormData({ ...formData, abbrRows: newAbbrRows });
    };

    const isAddButtonDisabled = usedAbbrCodes.length === Object.keys(AbbrToMeaningMap).length;

    
    return (
        <div className="input-box-2">
        <h3>Abbreviations</h3>
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
                <td>
                  <select
                    className="table-control"
                    value={row.abbr}
                    onChange={(e) => handleAbbrRowChange(e, index, "abbr")}
                  >
                    {Object.keys(AbbrToMeaningMap).map((code) => (
                      <option
                        key={code}
                        value={code}
                        disabled={usedAbbrCodes.includes(code)} // Disable already selected codes
                      >
                        {code}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="table-control"
                    value={row.meaning}
                    readOnly
                  />
                </td>
                <td>
                  <button
                    className="remove-row-button"
                    onClick={() => removeAbbrRow(index)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="add-row-button" onClick={addAbbrRow}
        disabled={isAddButtonDisabled}>+ Add Abbreviations Row</button>
      </div>
    );
  };
  
  export default AbbreviationTable;  