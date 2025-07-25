import React, { useEffect, useState, useRef } from "react";
import './ProcedureTable.css';
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faPlus, faPlusCircle, faMagicWandSparkles } from '@fortawesome/free-solid-svg-icons';
import FlowchartRenderer from "./FlowchartRenderer";

const ProcedureTable = ({ procedureRows, addRow, removeRow, updateRow, error, title, documentType, updateProcRows, setErrors }) => {
    const [designationOptions, setDesignationOptions] = useState([]);
    const [showARDropdown, setShowARDropdown] = useState({ index: null, field: "" });
    const [dropdownOptions, setDropdownOptions] = useState([]);
    const [activeRewriteIndex, setActiveRewriteIndex] = useState(null);

    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const inputRefs = useRef([]);

    useEffect(() => {
        const fetchDesignations = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/des`);
                const data = await response.json();

                if (response.ok && data.designations) {
                    const names = data.designations.map(d => d.designation).sort(); // Assuming each has a `name`
                    setDesignationOptions(names);
                } else {
                    console.error("Failed to load designations");
                }
            } catch (error) {
                console.error("Error fetching designations:", error);
            }
        };

        fetchDesignations();
    }, []);

    const accountableOptions = designationOptions;

    const responsibleOptions = designationOptions;

    const [invalidRows, setInvalidRows] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log(procedureRows);
    }, [procedureRows]);

    const rewriteAI = async (indexToChange, procedureRows, updateRows, setLoading) => {
        try {
            setLoading(true);

            const prompt = JSON.stringify(procedureRows[indexToChange]);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatSingle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ prompt })
            });

            const data = await response.json();

            if (response.ok && data.response) {
                const cleaned = {
                    ...data.response,
                    SubStep: data.response.SubStep.includes('\\n')
                        ? data.response.SubStep.replace(/\\n/g, '\n')
                        : data.response.SubStep
                };

                // Replace the specific row
                const updatedRows = [...procedureRows];
                updatedRows[indexToChange] = cleaned;

                updateRows(updatedRows);

                toast.success(`Step ${indexToChange + 1} rewritten by AI`, {
                    autoClose: 1000,
                    closeButton: true,
                    style: { textAlign: 'center' }
                });
            } else {
                toast.error("Failed to rewrite this step.", {
                    autoClose: 1000,
                    closeButton: true,
                    style: { textAlign: 'center' }
                });
            }
        } catch (err) {
            console.error("Single row rewrite error:", err);
            toast.error("An error occurred while rewriting this step.", {
                autoClose: 1000,
                closeButton: true,
                style: { textAlign: 'center' }
            });
        } finally {
            setLoading(false);
            setActiveRewriteIndex(null);
        }
    };

    const insertRowAt = (insertIndex) => {
        const newProcedureRows = [...procedureRows];

        const newNr = insertIndex + 1;

        const newRow = {
            nr: newNr,
            mainStep: "",
            SubStep: "",
            discipline: "Engineering",
            accountable: "",
            responsible: "",
            prevStep: "-",
        };

        newProcedureRows.splice(insertIndex, 0, newRow);

        // Re-number all rows
        const renumbered = newProcedureRows.map((row, idx) => ({
            ...row,
            nr: idx + 1,
        }));

        updateProcRows(renumbered); // use your passed-in updateProcRows function
    };

    const add = () => {
        const incompleteIndices = procedureRows
            .map((row, index) => (!row.responsible || !row.accountable ? index : null))
            .filter(index => index !== null);

        if (incompleteIndices.length > 0) {
            setInvalidRows(incompleteIndices); // mark invalid rows to highlight labels
            toast.warn("Please fill in both 'Responsible' and 'Accountable' before adding a new row.", {
                autoClose: 800,
                closeButton: true,
                style: { textAlign: 'center' }
            });
            return;
        }

        setInvalidRows([]); // clear any previous flags
        addRow();
    };

    useEffect(() => {
        // Automatically resize all loaded textareas (mainStep and SubStep)
        const textareas = document.querySelectorAll(".aim-textarea-pt");
        textareas.forEach(textarea => {
            textarea.style.height = 'auto'; // Reset first
            textarea.style.height = `${textarea.scrollHeight}px`; // Then expand
        });
    }, [procedureRows]);

    const handleInputChange = (index, field, value) => {
        const updatedRow = { ...procedureRows[index], [field]: value };

        // Prevent selecting the same value for both Responsible and Accountable
        if (field === "responsible" && value === updatedRow.accountable) {
            updatedRow.accountable = ""; // Reset accountable if it conflicts
        } else if (field === "accountable" && value === updatedRow.responsible) {
            updatedRow.responsible = ""; // Reset responsible if it conflicts
        }

        updateRow(index, field, value);
        setErrors(prev => ({
            ...prev,
            procedureRows: false
        }));
    };

    useEffect(() => {
        const popupSelector = '.floating-dropdown-proc';

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest('input');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(popupSelector);
            if (!isInsidePopup) {
                closeDropdowns();
            }

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };

        const closeDropdowns = () => {
            setShowARDropdown({ index: null, field: "" });
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showARDropdown]);

    return (
        <div className="input-row">
            <div className={`proc-box ${error ? "error-proc" : ""}`}>
                <h3 className="font-fam-labels">Procedure <span className="required-field">*</span></h3>
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
                                <React.Fragment key={index}>
                                    {/* Insert button above each row except the first */}
                                    <tr key={index}>
                                        <td className="procCent" style={{ fontSize: "14px" }}>
                                            {row.nr}
                                        </td>
                                        <td>
                                            <textarea
                                                name="mainStep"
                                                className="aim-textarea-pt font-fam"
                                                value={row.mainStep}
                                                style={{ fontSize: "14px" }}
                                                onChange={(e) => handleInputChange(index, "mainStep", e.target.value)}
                                                onInput={(e) => {
                                                    e.target.style.height = 'auto'; // Reset
                                                    e.target.style.height = e.target.scrollHeight + 'px'; // Expand dynamically
                                                }}
                                                placeholder="Insert the main step of the procedure here..." // Optional placeholder text
                                            />
                                        </td>
                                        <td>
                                            <textarea
                                                name="SubStep"
                                                className="aim-textarea-pt font-fam"
                                                value={row.SubStep}
                                                onChange={(e) => handleInputChange(index, "SubStep", e.target.value)}
                                                style={{ fontSize: "14px" }}
                                                onInput={(e) => {
                                                    e.target.style.height = 'auto'; // Reset
                                                    e.target.style.height = e.target.scrollHeight + 'px'; // Expand dynamically
                                                }}
                                                placeholder="Insert the sub steps of the procedure here..." // Optional placeholder text
                                            />
                                        </td>
                                        <td>
                                            <div className="prev-step-container-ref">
                                                {(row.prevStep && row.prevStep.trim() !== "" ? row.prevStep.split(";") : [""]).map((step, stepIndex, arr) => (
                                                    <div key={stepIndex} className="prev-step-input-ref">
                                                        <input
                                                            type="text"
                                                            style={{ fontSize: "14px" }}
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
                                                            placeholder="Insert step"
                                                        />
                                                        <button
                                                            className="remove-step-button-ref"
                                                            onClick={() => {
                                                                const updatedSteps = row.prevStep ? row.prevStep.split(";") : [];
                                                                if (updatedSteps.length > 1) {
                                                                    updateRow(index, "prevStep", updatedSteps.filter((_, i) => i !== stepIndex).join(";"));
                                                                } else {
                                                                    toast.warn("At least one predecessor is required.", { autoClose: 800, closeButton: true });
                                                                }
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} title="Remove Predecessor" />
                                                        </button>
                                                        {stepIndex === arr.length - 1 && (
                                                            <button
                                                                className="add-row-button-pred"
                                                                onClick={() => {
                                                                    const updatedSteps = row.prevStep ? row.prevStep.split(";") : [""];
                                                                    updatedSteps.push("");
                                                                    updateRow(index, "prevStep", updatedSteps.join(";"));
                                                                }}
                                                            >
                                                                <FontAwesomeIcon icon={faPlusCircle} title="Add Step" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="select-container-proc">
                                                <div className="select-wrapper">
                                                    <label className={`select-label-proc ${invalidRows.includes(index) && !row.responsible ? "label-error-pt" : ""}`}>R:</label>
                                                    <input
                                                        type="text"
                                                        className="table-control-proc"
                                                        value={row.responsible}
                                                        style={{ fontSize: "14px" }}
                                                        placeholder="Select Responsible"
                                                        ref={(el) => (inputRefs.current[`responsible-${index}`] = el)}
                                                        onChange={(e) => {
                                                            handleInputChange(index, "responsible", e.target.value);
                                                            const filtered = designationOptions.filter(opt =>
                                                                opt.toLowerCase().includes(e.target.value.toLowerCase()) &&
                                                                opt !== row.accountable
                                                            );
                                                            setDropdownOptions(filtered);
                                                        }}
                                                        onFocus={() => {
                                                            const rect = inputRefs.current[`responsible-${index}`].getBoundingClientRect();
                                                            setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
                                                            setDropdownOptions(designationOptions.filter(opt => opt !== row.accountable));
                                                            setShowARDropdown({ index, field: "responsible" });
                                                        }}
                                                    />
                                                </div>

                                                <div className="select-wrapper">
                                                    <label className={`select-label-proc ${invalidRows.includes(index) && !row.accountable ? "label-error-pt" : ""}`}>A:</label>
                                                    <input
                                                        type="text"
                                                        className="table-control-proc"
                                                        value={row.accountable}
                                                        style={{ fontSize: "14px" }}
                                                        placeholder="Select Accountable"
                                                        ref={(el) => (inputRefs.current[`accountable-${index}`] = el)}
                                                        onChange={(e) => {
                                                            handleInputChange(index, "accountable", e.target.value);
                                                            const filtered = designationOptions.filter(opt =>
                                                                opt.toLowerCase().includes(e.target.value.toLowerCase()) &&
                                                                opt !== row.responsible
                                                            );
                                                            setDropdownOptions(filtered);
                                                        }}
                                                        onFocus={() => {
                                                            const rect = inputRefs.current[`accountable-${index}`].getBoundingClientRect();
                                                            setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
                                                            setDropdownOptions(designationOptions.filter(opt => opt !== row.responsible));
                                                            setShowARDropdown({ index, field: "accountable" });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="procCent">
                                            <button
                                                className="ai-rewrite-button"
                                                onClick={() => {
                                                    setActiveRewriteIndex(index);
                                                    rewriteAI(index, procedureRows, updateProcRows, setLoading);
                                                }}
                                                title="AI Rewrite Step"
                                            >
                                                {activeRewriteIndex === index
                                                    ? <FontAwesomeIcon icon={faSpinner} spin />
                                                    : <FontAwesomeIcon icon={faMagicWandSparkles} />
                                                }
                                            </button>
                                            <button
                                                className="remove-row-button"
                                                onClick={() => removeRow(index)}
                                                title="Delete step"
                                            >
                                                <FontAwesomeIcon icon={faTrash} title="Remove Row" />
                                            </button>
                                            {index < procedureRows.length - 1 && (
                                                <button
                                                    className="insert-row-button-sig"
                                                    onClick={() => insertRowAt(index + 1)} // Insert below
                                                    title="Insert step"
                                                >
                                                    <FontAwesomeIcon icon={faPlusCircle} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}

                <button className="add-row-button-ds font-fam" onClick={add}>
                    <FontAwesomeIcon icon={faPlusCircle} title="Add Row" />
                </button>
            </div>

            {showARDropdown.index !== null && dropdownOptions.length > 0 && (
                <ul
                    className="floating-dropdown-proc"
                    style={{
                        position: "fixed",
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                        width: dropdownPos.width,
                        zIndex: 10,
                    }}
                >
                    {dropdownOptions.map((opt, i) => (
                        <li
                            key={i}
                            onMouseDown={() => {
                                handleInputChange(showARDropdown.index, showARDropdown.field, opt);
                                setShowARDropdown({ index: null, field: "" });
                            }}
                        >
                            {opt}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ProcedureTable;
