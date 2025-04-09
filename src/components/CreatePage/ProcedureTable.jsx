import React, { useEffect, useState } from "react";
import './ProcedureTable.css';
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faPlus, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import FlowchartRenderer from "./FlowchartRenderer";
import RewriteButton from "./RewriteButton";

const ProcedureTable = ({ procedureRows, addRow, removeRow, updateRow, error, title, documentType, updateProcRows }) => {
    const accountableOptions = [
        "Engineering Manager", "Section Engineer", "Engineering Superintendent",
        "Engineering Foreman (Mechanical/Electrical)", "Control and Instrumentation (C&I) Technician",
        "Mechanical Technician", "Electrical Technician", "Maintenance Planner", "Fitter",
        "Electrician", "Boilermaker", "Diesel Mechanic", "Instrumentation Mechanic",
        "Millwright", "Engineering Assistant"
    ];

    const responsibleOptions = [
        "Engineering Manager", "Section Engineer", "Engineering Superintendent",
        "Engineering Foreman (Mechanical/Electrical)", "Control and Instrumentation (C&I) Technician",
        "Mechanical Technician", "Electrical Technician", "Maintenance Planner", "Fitter",
        "Electrician", "Boilermaker", "Diesel Mechanic", "Instrumentation Mechanic",
        "Millwright", "Engineering Assistant"
    ];

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log(procedureRows);
    }, [procedureRows]);

    const handleImageGen = async () => {
        try {
            // Ensure procedureRows is not empty
            if (procedureRows.length === 0 || procedureRows.length === 0) {
                toast.dismiss();
                toast.clearWaitingQueue();
                toast.warn("There should be at least two procedure steps or more.", {
                    closeButton: false,
                    autoClose: 800,
                    style: {
                        textAlign: 'center'
                    }
                })
                return;
            }

            // Ensure all mainStep values are filled
            if (procedureRows.some(row => !row.mainStep.trim())) {
                toast.dismiss();
                toast.clearWaitingQueue();
                toast.warn("All procedure main steps must have a value.", {
                    closeButton: false,
                    autoClose: 800,
                    style: {
                        textAlign: 'center'
                    }
                })
                return;
            }

            setLoading(true);

            //setLoading(false);
            /*
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flowIMG/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ procedureRows }),
            });

            if (!response.ok) {
                toast.dismiss();
                toast.clearWaitingQueue();
                toast.error("Failed to generate the flowchart.", {
                    closeButton: false,
                    style: {
                        textAlign: 'center'
                    }
                })
                setLoading(false);
            } else {
                console.log(response.data)
            }
            */
        } catch {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Unable to generate flowchart.", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })
            setLoading(false);
        }
    };

    const handleInputChange = (index, field, value) => {
        const updatedRow = { ...procedureRows[index], [field]: value };

        // Prevent selecting the same value for both Responsible and Accountable
        if (field === "responsible" && value === updatedRow.accountable) {
            updatedRow.accountable = ""; // Reset accountable if it conflicts
        } else if (field === "accountable" && value === updatedRow.responsible) {
            updatedRow.responsible = ""; // Reset responsible if it conflicts
        }

        updateRow(index, field, value);
    };


    return (
        <div className="input-row">
            <div className={`proc-box ${error ? "error-proc" : ""}`}>
                <h3 className="font-fam-labels">Procedure <span className="required-field">*</span></h3>
                <RewriteButton procedureData={procedureRows} updateRows={updateProcRows} />
                <FlowchartRenderer procedureRows={procedureRows} title={title} documentType={documentType} />

                {procedureRows.length > 0 && (
                    <table className="vcr-table table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="procCent procNr">Nr</th>
                                <th className="procCent procMain">Procedure Main Steps</th>
                                <th className="procCent procSub">Procedure Sub Steps</th>
                                <th className="procCent procPrev">Predecessor<div className="procFineText">(Immediate Prior Steps)</div></th>
                                <th className="procCent procAR">Responsible and Accountable</th>
                                <th className="procCent procAct">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {procedureRows.map((row, index) => (
                                <tr key={index}>
                                    <td className="procCent">
                                        {row.nr}
                                    </td>
                                    <td>
                                        <textarea
                                            name="mainStep"
                                            className="aim-textarea-pt font-fam"
                                            value={row.mainStep}
                                            onChange={(e) => handleInputChange(index, "mainStep", e.target.value)}
                                            rows="4"   // Adjust the number of rows for initial height
                                            placeholder="Enter the main step of the procedure here..." // Optional placeholder text
                                        />
                                    </td>
                                    <td>
                                        <textarea
                                            name="SubStep"
                                            className="aim-textarea-pt font-fam"
                                            value={row.SubStep}
                                            onChange={(e) => handleInputChange(index, "SubStep", e.target.value)}
                                            rows="4"   // Adjust the number of rows for initial height
                                            placeholder="Enter the sub steps of the procedure here..." // Optional placeholder text
                                        />
                                    </td>
                                    <td>
                                        <div className="prev-step-container-ref">
                                            {(row.prevStep ? row.prevStep.split(";") : []).map((step, stepIndex) => (
                                                <div key={stepIndex} className="prev-step-input-ref">
                                                    <input
                                                        type="text"
                                                        className="aim-input-pt font-fam"
                                                        value={step}
                                                        onChange={(e) => {
                                                            let updatedSteps = row.prevStep ? row.prevStep.split(";") : [];

                                                            if (stepIndex < updatedSteps.length) {
                                                                updatedSteps[stepIndex] = e.target.value;
                                                            } else {
                                                                updatedSteps.push(e.target.value);
                                                            }

                                                            updateRow(index, "prevStep", updatedSteps.join(";"));
                                                        }}
                                                        placeholder="Enter step"
                                                    />
                                                    <button
                                                        className="remove-step-button-ref"
                                                        onClick={() => {
                                                            const updatedSteps = row.prevStep ? row.prevStep.split(";") : [];
                                                            if (updatedSteps.length > 1) {
                                                                updateRow(index, "prevStep", updatedSteps.filter((_, i) => i !== stepIndex).join(";"));
                                                            } else {
                                                                toast.warn("At least one predecessor is required.", { autoClose: 800, closeButton: false });
                                                            }
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                className="add-step-button-ref"
                                                onClick={() => {
                                                    const updatedSteps = row.prevStep ? row.prevStep.split(";") : [];
                                                    updatedSteps.push("");
                                                    updateRow(index, "prevStep", updatedSteps.join(";"));
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faPlus} />
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="select-container-proc">
                                            <div className="select-wrapper">
                                                <label className="select-label-proc">R:</label>
                                                <select
                                                    className="table-control-proc"
                                                    value={row.responsible}
                                                    onChange={(e) => handleInputChange(index, "responsible", e.target.value)}
                                                >
                                                    <option value="">Select an option</option>
                                                    {responsibleOptions
                                                        .filter((option) => option !== row.accountable) // Exclude selected Accountable value
                                                        .sort()
                                                        .map((option, i) => (
                                                            <option key={i} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>

                                            <div className="select-wrapper">
                                                <label className="select-label-proc">A:</label>
                                                <select
                                                    className="table-control-proc"
                                                    value={row.accountable}
                                                    onChange={(e) => handleInputChange(index, "accountable", e.target.value)}
                                                >
                                                    <option value="">Select an option</option>
                                                    {accountableOptions
                                                        .filter((option) => option !== row.responsible) // Exclude selected Responsible value
                                                        .sort()
                                                        .map((option, i) => (
                                                            <option key={i} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="procCent">
                                        <button
                                            className="remove-row-button"
                                            onClick={() => removeRow(index)}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <button className="add-row-button-ds font-fam" onClick={addRow} disabled={procedureRows.some(row => !row.responsible || !row.accountable)}>
                    <FontAwesomeIcon icon={faPlusCircle} />
                </button>
            </div>
        </div>
    );
};

export default ProcedureTable;
