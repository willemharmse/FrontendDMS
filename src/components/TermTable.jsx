const TermTable = ({ formData, setFormData, usedTermCodes, setUsedTermCodes }) => {
    const TermToDescriptionMap = {
        "Accessories": "Units other than roof bolts and nuts.",
        "Approved": "Approved by the Engineer in writing.",
        "Bar": "A steel product of plain round or deformed cross-section, as rolled using a rod, a coil and a portion cut from a coil.",
        "Bond Strength": "In a roof bolt/resin system, the load at which the system stiffness falls below 20kN/mm.",
        "Breakout Facility": "Facility whereby the nut is held in position on the thread of the roof bolt enabling the mixing of the resin to take place during roof bolt installation, but when a predetermined torque is reached allows the nut to be spun up the thread to tighten on the washer plate.",
        "Bundle": "Roof bolt assemblies of the same type, nominal size and cast number, bound together for delivery purposes.",
        "Washer Plate": "Accessory which, when used in conjunction with a roof bolt, nut and conical seat, facilitates load distribution, ensures correct alignment and reduces weathering around the mouth of the roof bolt hole.",
        "Longitudinal Rib": "A uniform continuous rib that is parallel to the axis of the bar.",
        "Nominal Size (Roof bolt)": "The nominal major diameter of the non-threaded section of the roof bolt.",
        "Nominal Size (Nut)": "The nominal major diameter of the thread of the roof bolt for which a nut is intended, e.g. for a 20 mm bolt with 22mm threads, a RD22 by ⅛\" of tolerance class 7h/6h nut in accordance to DIN405 shall be used.",
        "Nut Eccentricity": "The displacement of the centre of the bore in relation to the centre of the nut. (Off-centredness).",
        "Purchaser": "The company or store designated as the recipient of finished products or services.",
        "Roof Bolt": "Ribbed bar used in conjunction with a resin or shell to provide reinforcement of the mine roadway roof or side.",
        "Roof-Bolt Assembly": "Roof bolt with either a forged head or a plain threaded end fitted with a nut, washer plate, and optional spherical seat.",
        "Roof Bolt Support System": "Roof bolt assemblies installed systematically to provide principle roof and/or side support to mine roadways.",
        "Routine Test": "Test conducted at a predetermined frequency to ensure continued conformance to specification of the item concerned.",
        "Setting Time": "Period, in addition to gel time, that is required for the resin to attain enough strength to resist the pull exerted on the roof bolt when the nut is tightened.",
        "Spherical Seat": "Accessory which, when in conjunction with a roof bolt, nut and washer plate, accommodates a degree of misalignment between the roof bolt and the strata surface.",
        "System Stiffness": "Slope of the load/extension curve obtained from a pull test.  This test may be conducted in the laboratory or in the field.  The unit of system stiffness is the kiloNewton per millimeter (KN/mm).",
        "Transverse Rib": "Any rib other than the longitudinal rib, on the surface of the steel bar.",
        "Type Test": "Test on a component or assembly before regular production commences so as to ensure the relevant mechanical and physical properties are achievable and which is conducted whenever any significant change in the process parameters occurs.",
        "Led Fuel": "Low emission diesel fuel.",
        "Standard Fuel": "Fuel with a specific gravity of 0,835 kg/Dm³ and a calorific value of 43 000 kj/kg.",
        "Nett Blocked (kW)": "The power output of an engine to suit specified conditions, de-rating or duties.",
        "Nett Flywheel (kW)": "The power available for machine performance after the power for charge pumps and oil coolers has deducted from the net blocked output power.",
        "Rated Output": "The power output of an engine in accordance with DIN 6271 B1, B2 or B3 rating."
    };

    const handleTermRowChange = (e, index, field) => {
        const newTermRows = [...formData.termRows];
    
        if (field === "term") {
          const selectedDef = e.target.value;
          newTermRows[index].definition = TermToDescriptionMap[selectedDef] || "";
        }
    
        newTermRows[index][field] = e.target.value;
        setUsedTermCodes(newTermRows.map((row) => row.term));
        setFormData({ ...formData, termRows: newTermRows });
      };
    
      const addTermRow = () => {
        // Find the first available term that is not used
        const availableTerm = Object.keys(TermToDescriptionMap).find((term) => !usedTermCodes.includes(term)) || "Ore";
        
        const newTermRows = [
          ...formData.termRows,
          { term: availableTerm, definition: TermToDescriptionMap[availableTerm] }
        ];
  
        // Add the term to usedTermCodes immediately
        const newUsedTermCodes = [...usedTermCodes, availableTerm];
        
        setFormData({ ...formData, termRows: newTermRows });
        setUsedTermCodes(newUsedTermCodes);
      };

    const removeTermRow = (index) => {
        const newTermRows = [...formData.termRows];
        const removedTerm = newTermRows[index].term;
        newTermRows.splice(index, 1);
        
        // Remove the term from usedTermCodes
        const updatedUsedTermCodes = usedTermCodes.filter((term) => term !== removedTerm);
        setUsedTermCodes(updatedUsedTermCodes);
  
        setFormData({ ...formData, termRows: newTermRows });
    };

      const isAddButtonDisabled = usedTermCodes.length === Object.keys(TermToDescriptionMap).length;

    return (
      <div className="input-box-2">
        <h3>Terms</h3>
        <table className="vcr-table">
          <thead>
            <tr>
              <th>Term</th>
              <th>Definition</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {formData.termRows.map((row, index) => (
              <tr key={index}>
                <td>
                  <select
                    className="table-control"
                    value={row.term}
                    onChange={(e) => handleTermRowChange(e, index, "term")}
                  >
                    {Object.keys(TermToDescriptionMap).map((code) => (
                      <option
                        key={code}
                        value={code}
                        disabled={usedTermCodes.includes(code)}
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
                    value={row.definition}
                    readOnly
                  />
                </td>
                <td>
                  <button
                    className="remove-row-button"
                    onClick={() => removeTermRow(index)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="add-row-button" onClick={addTermRow}
        disabled={isAddButtonDisabled}>+ Add Term Row</button>
      </div>
    );
  };
  
  export default TermTable;  