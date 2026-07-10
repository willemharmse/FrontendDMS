import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faX, faSearch, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import {
  faChevronDown,
  faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import { toast } from 'react-toastify';

export const STATIC_TEMPLATE_FIELDS = [
  { field: "Equipment number / asset ID", definition: "Identifies the specific machine, component, or asset where the work must be performed.", mandatory: false },
  { field: "Fault description", definition: "Describes the defect, breakdown, abnormal condition, or reason for the repair.", mandatory: false },
  { field: "Isolation requirements", definition: "Confirms what must be isolated before work starts, such as electrical, hydraulic, pneumatic, mechanical, or stored energy sources.", mandatory: false },
  { field: "Lockout / tagout details", definition: "Records the lockout points, responsible persons, and verification steps before work begins.", mandatory: false },
  { field: "Spares required", definition: "Lists replacement parts, consumables, or components needed to complete the task.", mandatory: false },
  { field: "Tools required", definition: "Identifies special tools, standard tools, diagnostic tools, or equipment required.", mandatory: false },
  { field: "Maintenance procedure", definition: "Links the approved procedure or work instruction that must be followed.", mandatory: false },
  { field: "Post-maintenance testing", definition: "Defines the checks required after repair, such as functional tests, pressure tests, movement tests, or trial runs.", mandatory: false },
  { field: "Return-to-service confirmation", definition: "Confirms that the equipment is safe, functional, and approved to return to operation.", mandatory: false },

  { field: "Inspection checklist", definition: "Provides the specific points to be inspected so the inspection is consistent and complete.", mandatory: false },
  { field: "Inspection frequency", definition: "Indicates whether the inspection is daily, weekly, monthly, annual, or event-based.", mandatory: false },
  { field: "Acceptance criteria", definition: "Defines what condition is acceptable, defective, critical, or requiring action.", mandatory: false },
  { field: "Defect rating", definition: "Classifies findings by severity, for example critical, major, minor, monitor, or no defect.", mandatory: false },
  { field: "Photos required", definition: "Confirms where photographic evidence must be captured to support findings.", mandatory: false },
  { field: "Findings / observations", definition: "Records what was found during the inspection.", mandatory: false },
  { field: "Corrective actions required", definition: "Captures follow-up tasks needed to correct identified defects or gaps.", mandatory: false },
  { field: "Next inspection date", definition: "Records when the next inspection must be performed.", mandatory: false },

  { field: "Installation drawing", definition: "Provides the approved drawing, layout, or technical reference for installation.", mandatory: false },
  { field: "Design specification", definition: "Defines the technical requirements the installation must comply with.", mandatory: false },
  { field: "Approved scope", definition: "Confirms exactly what is included in the installation work.", mandatory: false },
  { field: "Material list", definition: "Lists materials, parts, cables, brackets, equipment, or consumables required.", mandatory: false },
  { field: "Quality checks", definition: "Defines inspections or checks required during and after installation.", mandatory: false },
  { field: "Installation acceptance criteria", definition: "Confirms the conditions that must be met before the installation is accepted.", mandatory: false },
  { field: "Commissioning requirement", definition: "Identifies whether the installed item must be tested, configured, calibrated, or commissioned.", mandatory: false },
  { field: "Handover requirement", definition: "Defines what evidence, documents, or sign-off is required before handover.", mandatory: false },

  { field: "Test plan", definition: "Defines what will be tested, how it will be tested, and who must be involved.", mandatory: false },
  { field: "Test criteria", definition: "States the required result or performance standard for the test to pass.", mandatory: false },
  { field: "Test equipment", definition: "Lists the devices, instruments, simulators, or tools needed to perform testing.", mandatory: false },
  { field: "Calibration certificates", definition: "Confirms that measuring or test equipment is valid and calibrated.", mandatory: false },
  { field: "Test results", definition: "Records actual results, readings, observations, pass/fail outcomes, and deviations.", mandatory: false },
  { field: "Witness requirement", definition: "Identifies whether the client, supervisor, engineer, or responsible person must witness the test.", mandatory: false },
  { field: "Punch list / defects", definition: "Captures issues identified during testing that must be corrected.", mandatory: false },
  { field: "Commissioning sign-off", definition: "Confirms that the system, equipment, or component is accepted for operational use.", mandatory: false },

  { field: "Electrical permit", definition: "Confirms formal authorisation to perform electrical work.", mandatory: false },
  { field: "Voltage level", definition: "Identifies the voltage involved so that the correct controls and competent persons are used.", mandatory: false },
  { field: "Electrical isolation points", definition: "Identifies breakers, switches, panels, or circuits that must be isolated.", mandatory: false },
  { field: "Test-before-touch requirement", definition: "Confirms that the circuit must be proven dead before work starts.", mandatory: false },
  { field: "Earthing requirements", definition: "Defines temporary or permanent earthing needed for safe work.", mandatory: false },
  { field: "Authorised electrician details", definition: "Records the competent person responsible for the electrical work.", mandatory: false },
  { field: "Electrical drawings", definition: "Provides circuit diagrams, wiring diagrams, or panel layouts required for the task.", mandatory: false },
  { field: "Re-energisation approval", definition: "Confirms who may authorise power restoration after work is complete.", mandatory: false },

  { field: "Stored energy controls", definition: "Identifies controls for springs, pressure, gravity, rotating parts, hydraulic pressure, or suspended loads.", mandatory: false },
  { field: "Mechanical isolation points", definition: "Identifies valves, pins, chocks, blocks, guards, or mechanical locks required.", mandatory: false },
  { field: "Lifting requirements", definition: "Confirms whether components must be lifted, supported, or mechanically handled.", mandatory: false },
  { field: "Torque settings", definition: "Defines required tightening specifications for bolts, fasteners, or fittings.", mandatory: false },
  { field: "Lubrication requirements", definition: "Specifies oils, grease, lubrication points, and quantities where applicable.", mandatory: false },
  { field: "Alignment checks", definition: "Confirms checks for shafts, belts, pulleys, couplings, or moving components.", mandatory: false },
  { field: "Guarding checks", definition: "Confirms that guards are installed and secured before returning equipment to service.", mandatory: false },
  { field: "Mechanical completion sign-off", definition: "Confirms the work is complete, safe, and ready for testing or use.", mandatory: false },

  { field: "Working-at-heights permit", definition: "Confirms formal approval for work where a fall risk exists.", mandatory: false },
  { field: "Fall protection plan", definition: "Defines how falls will be prevented or arrested.", mandatory: false },
  { field: "Harness inspection", definition: "Confirms that harnesses, lanyards, and fall arrest equipment are inspected and fit for use.", mandatory: false },
  { field: "Anchor point verification", definition: "Confirms that approved and suitable anchor points are available.", mandatory: false },
  { field: "Ladder / scaffold inspection", definition: "Confirms that access equipment is inspected and safe before use.", mandatory: false },
  { field: "Drop-zone control", definition: "Defines barricading and controls to prevent falling objects from harming others.", mandatory: false },
  { field: "Rescue plan", definition: "Explains how a person will be rescued if suspended or injured at height.", mandatory: false },

  { field: "Confined space permit", definition: "Confirms formal approval to enter the confined space.", mandatory: false },
  { field: "Gas test results", definition: "Records oxygen, flammable gas, and toxic gas readings before and during entry.", mandatory: false },
  { field: "Ventilation requirements", definition: "Defines natural or forced ventilation needed to make the space safe.", mandatory: false },
  { field: "Standby person", definition: "Identifies the person stationed outside the confined space to monitor entrants.", mandatory: false },
  { field: "Entry and exit register", definition: "Records who entered, when they entered, and when they exited.", mandatory: false },
  { field: "Communication method", definition: "Defines how entrants and standby persons will communicate.", mandatory: false },
  { field: "Rescue plan", definition: "Defines the rescue method, equipment, and emergency response actions.", mandatory: false },

  { field: "Hot work permit", definition: "Confirms authorisation for grinding, welding, cutting, or other heat-producing work.", mandatory: false },
  { field: "Fire watch", definition: "Identifies the person responsible for monitoring fire risk during and after the task.", mandatory: false },
  { field: "Fire extinguisher availability", definition: "Confirms that suitable firefighting equipment is available at the work area.", mandatory: false },
  { field: "Combustible material control", definition: "Confirms that flammable or combustible materials are removed, covered, or controlled.", mandatory: false },
  { field: "Gas testing", definition: "Required where flammable gases, vapours, or confined environments may be present.", mandatory: false },
  { field: "Spark containment", definition: "Defines screens, blankets, or barriers used to control sparks and slag.", mandatory: false },
  { field: "Post-work monitoring", definition: "Confirms that the area is checked after work to ensure no smouldering or fire risk remains.", mandatory: false },

  { field: "Lifting plan", definition: "Defines how the load will be lifted, moved, controlled, and placed.", mandatory: false },
  { field: "Load weight", definition: "Confirms the weight of the item being lifted.", mandatory: false },
  { field: "Crane / lifting equipment details", definition: "Identifies the crane, forklift, hoist, chain block, or lifting device to be used.", mandatory: false },
  { field: "Lifting gear certificates", definition: "Confirms that slings, shackles, chains, hooks, and lifting gear are inspected and certified.", mandatory: false },
  { field: "Rigging method", definition: "Defines how the load will be slung, balanced, and secured.", mandatory: false },
  { field: "Appointed rigger / crane operator", definition: "Identifies competent persons responsible for the lift.", mandatory: false },
  { field: "Exclusion zone", definition: "Defines the barricaded area to keep people clear of suspended loads.", mandatory: false },
  { field: "Communication method", definition: "Confirms hand signals, radios, or spotters used during the lift.", mandatory: false },

  { field: "Excavation permit", definition: "Confirms approval to excavate or disturb ground.", mandatory: false },
  { field: "Service detection", definition: "Confirms that underground services such as cables, pipelines, water lines, or fibre have been identified.", mandatory: false },
  { field: "Excavation depth", definition: "Records the planned depth to determine required controls.", mandatory: false },
  { field: "Ground stability controls", definition: "Defines benching, shoring, battering, or support requirements.", mandatory: false },
  { field: "Barricading", definition: "Confirms controls to prevent people or vehicles entering the excavation area.", mandatory: false },
  { field: "Spoil placement", definition: "Defines where excavated material may be placed safely.", mandatory: false },
  { field: "Access and egress", definition: "Confirms safe entry and exit arrangements, such as ladders or ramps.", mandatory: false },
  { field: "Excavation inspection", definition: "Records inspections before, during, and after work, especially after rain or ground movement.", mandatory: false },

  { field: "Area access approval", definition: "Confirms that the team is authorised to enter the specific mining area.", mandatory: false },
  { field: "Traffic management controls", definition: "Defines how interaction with TMM, LDV, pedestrians, and mobile equipment will be controlled.", mandatory: false },
  { field: "Geotechnical conditions", definition: "Records ground stability, highwall, bench, stockpile, or underground support conditions.", mandatory: false },
  { field: "Communication with control room", definition: "Confirms required radio contact, call-in points, or permission to enter.", mandatory: false },
  { field: "Barricading / demarcation", definition: "Defines how the task area will be separated from active operations.", mandatory: false },
  { field: "Emergency response requirements", definition: "Confirms escape routes, refuge areas, emergency contacts, and rescue arrangements.", mandatory: false },
  { field: "Interaction controls", definition: "Defines controls to prevent interaction between people, vehicles, equipment, and energy sources.", mandatory: false },

  { field: "Training material", definition: "Links the approved training content, procedure, presentation, or module.", mandatory: false },
  { field: "Attendance register", definition: "Records who attended the training.", mandatory: false },
  { field: "Competency assessment", definition: "Confirms whether learners were assessed as competent or not yet competent.", mandatory: false },
  { field: "Trainer / assessor details", definition: "Identifies the person responsible for delivering and assessing the training.", mandatory: false },
  { field: "Trainee list", definition: "Identifies the persons required to attend or complete the task.", mandatory: false },
  { field: "Assessment evidence", definition: "Includes completed tests, practical assessments, sign-off sheets, or observation records.", mandatory: false },
  { field: "Retraining requirement", definition: "Identifies whether refresher training or re-assessment is needed.", mandatory: false },

  { field: "Document reference", definition: "Identifies the procedure, standard, checklist, risk assessment, or legal document involved.", mandatory: false },
  { field: "Review requirement", definition: "Defines what must be reviewed, checked, or verified.", mandatory: false },
  { field: "Approval workflow", definition: "Identifies who must review, approve, or sign off the task.", mandatory: false },
  { field: "Compliance obligation", definition: "Links the task to a legal, regulatory, internal, or client requirement.", mandatory: false },
  { field: "Evidence required", definition: "Confirms what proof must be uploaded, such as signed documents, photos, reports, or certificates.", mandatory: false },
  { field: "Due date for submission", definition: "Defines when the compliance evidence or document must be submitted.", mandatory: false },
  { field: "Revision / version control", definition: "Confirms the correct document version being worked on.", mandatory: false },
  { field: "Close-out verification", definition: "Confirms that the final output was checked and accepted.", mandatory: false }
];

// Derived from the `mandatory` flags above — single source of truth, other
// components (e.g. TemplateFieldsInfo, form validation) can import this.
export const MANDATORY_TEMPLATE_FIELDS = STATIC_TEMPLATE_FIELDS
  .filter(item => item.mandatory)
  .map(item => item.field);

const TemplateFieldsTable = ({ collapsible = false, formData, setFormData, usedTemplateFields, setUsedTemplateFields, error, setErrors, readOnly = false }) => {
  const [collapsed, setCollapsed] = useState(true);
  const isCollapsed = collapsible ? collapsed : false;
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedFields, setSelectedFields] = useState(
    new Set([...MANDATORY_TEMPLATE_FIELDS, ...usedTemplateFields])
  );
  const [searchTerm, setSearchTerm] = useState("");

  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
  };

  useEffect(() => {
    if (!popupVisible) return;

    setErrors(prev => ({
      ...prev,
      templateFields: false
    }));
  }, [popupVisible]);

  useEffect(() => {
    setSelectedFields(new Set([...MANDATORY_TEMPLATE_FIELDS, ...usedTemplateFields]));
  }, [usedTemplateFields]);

  // Defensive sync: if usedTemplateFields ever arrives without a mandatory
  // field (e.g. loading an older draft, an undo action, or any other path
  // that bypasses handleSaveSelection below), push it back into both
  // usedTemplateFields and formData.templateFieldRows so the mandatory
  // field can never silently disappear from the record.
  useEffect(() => {
    const missing = MANDATORY_TEMPLATE_FIELDS.filter(
      (field) => !usedTemplateFields.includes(field)
    );
    if (missing.length === 0) return;

    setUsedTemplateFields([...usedTemplateFields, ...missing]);

    const missingRows = missing.map((field) => {
      const fromStatic = STATIC_TEMPLATE_FIELDS.find((item) => item.field === field);
      return fromStatic
        ? { field: fromStatic.field, definition: fromStatic.definition }
        : { field, definition: "" };
    });
    setFormData((prev) => ({
      ...prev,
      templateFieldRows: [...(prev.templateFieldRows || []), ...missingRows],
    }));
  }, [usedTemplateFields]);

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handlePopupToggle = () => {
    setSearchTerm("");
    setPopupVisible(!popupVisible);
  };

  const handleCheckboxChange = (field) => {
    if (MANDATORY_TEMPLATE_FIELDS.includes(field)) return; // locked in, cannot be toggled

    const newSelectedFields = new Set(selectedFields);
    if (newSelectedFields.has(field)) {
      newSelectedFields.delete(field);
    } else {
      newSelectedFields.add(field);
    }
    setSelectedFields(newSelectedFields);
  };

  const handleSaveSelection = () => {
    const selectedFieldArray = [...new Set([...MANDATORY_TEMPLATE_FIELDS, ...selectedFields])];

    const selectedRows = selectedFieldArray.map((field) => {
      const fromStatic = STATIC_TEMPLATE_FIELDS.find(item => item.field === field);
      return fromStatic
        ? { field: fromStatic.field, definition: fromStatic.definition }
        : { field: field, definition: "" };
    });

    setUsedTemplateFields(selectedFieldArray);
    setFormData({ ...formData, templateFieldRows: selectedRows });
    setPopupVisible(false);
  };

  return (
    <div className="input-row">
      <div className={`abbr-input-box ${error ? "error-abbr" : ""}`}>
        <h3 className="font-fam-labels">Template Fields <span className="required-field">*</span></h3>

        {popupVisible && (
          <div className="popup-overlay-abbr">
            <div className="popup-content-abbr">
              <div className="review-date-header">
                <h2 className="review-date-title">Select Template Fields</h2>
                <button className="review-date-close" onClick={handlePopupToggle} title="Close Popup">×</button>
              </div>

              <div className="review-date-group">
                <div className="abbr-input-container">
                  <input
                    className="search-input-abbr"
                    type="text"
                    placeholder="Search Template Field"
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
                        <th style={{ textAlign: "center" }}>Field</th>
                        <th className="def-size-abbr" style={{ textAlign: "center" }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STATIC_TEMPLATE_FIELDS.length > 0 ? (
                        STATIC_TEMPLATE_FIELDS
                          .filter((item) =>
                            item.field.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .sort((a, b) => a.field.localeCompare(b.field))
                          .map((item) => {
                            const isMandatory = MANDATORY_TEMPLATE_FIELDS.includes(item.field);
                            return (
                              <tr
                                key={item.field}
                                onClick={isMandatory ? undefined : () => handleCheckboxChange(item.field)}
                                style={{ cursor: isMandatory ? "default" : "pointer" }}
                              >
                                <td>
                                  <input
                                    type="checkbox"
                                    className="checkbox-inp-abbr"
                                    checked={selectedFields.has(item.field)}
                                    disabled={isMandatory}
                                    title={isMandatory ? "This field is required and cannot be deselected" : undefined}
                                    onChange={() => handleCheckboxChange(item.field)}
                                  />
                                </td>
                                <td>
                                  {item.field}
                                  {isMandatory && <span className="required-field" title="Required"> *</span>}
                                </td>
                                <td style={{ whiteSpace: "pre-wrap" }}>{item.definition}</td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td colSpan="3">Loading template fields...</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="abbr-buttons-dual">
                <button onClick={handleSaveSelection} className="abbr--butt-cent-1">Save Selection</button>
              </div>
            </div>
          </div>
        )}

        {collapsible && (<button
          className="top-right-button-ibra"
          title={collapsed ? "Expand Section" : "Collapse Section"}
          onClick={toggleCollapse}
          style={{ color: "gray" }}
          type="button"
        >
          <FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} />
        </button>)}

        {(!isCollapsed) && (
          <>
            {selectedFields.size > 0 && (
              <table className="font-fam table-borders">
                <thead className="cp-table-header">
                  <tr>
                    <th className="col-abbr-abbr" style={{ textAlign: "center" }}>Field</th>
                    <th className="col-abbr-desc" style={{ textAlign: "center" }}>Description</th>
                    {!readOnly && (<th className="col-abbr-act" style={{ textAlign: "center" }}>Action</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[...formData.templateFieldRows]
                    .sort((a, b) => a.field.localeCompare(b.field))
                    .map((row) => {
                      const isMandatory = MANDATORY_TEMPLATE_FIELDS.includes(row.field);
                      return (
                        <tr key={row.field}>
                          <td style={{ fontSize: "14px" }}>
                            {row.field}
                            {isMandatory && <span className="required-field" title="Required"> *</span>}
                          </td>
                          <td style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{row.definition}</td>
                          {!readOnly && (
                            <td className="procCent">
                              <div className="term-action-buttons">
                                <button
                                  className="remove-row-button"
                                  style={{ paddingRight: "0px", marginRight: "auto", marginLeft: "auto", paddingLeft: "0px" }}
                                  onClick={() => {
                                    if (isMandatory) {
                                      toast.error(`"${row.field}" is a required field and cannot be removed.`);
                                      return;
                                    }
                                    setFormData({
                                      ...formData,
                                      templateFieldRows: formData.templateFieldRows.filter((r) => r.field !== row.field),
                                    });
                                    setUsedTemplateFields(
                                      usedTemplateFields.filter((field) => field !== row.field)
                                    );

                                    const newSelectedFields = new Set(selectedFields);
                                    newSelectedFields.delete(row.field);
                                    setSelectedFields(newSelectedFields);
                                  }}
                                >
                                  <FontAwesomeIcon icon={faTrash} title="Remove Row" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}

            {(selectedFields.size === 0 && !readOnly) && (
              <button className="add-row-button-abbrs" onClick={handlePopupToggle}>
                Select
              </button>
            )}

            {(selectedFields.size > 0 && !readOnly) && (
              <button className="add-row-button-abbrs-plus" onClick={handlePopupToggle} title="Add Template Field">
                <FontAwesomeIcon icon={faPlusCircle} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateFieldsTable;