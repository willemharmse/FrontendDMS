import React, { useState, useEffect } from 'react';

const ExecutiveSummary = ({ formData, setFormData, errors, handleInputChange }) => {
    const [priorityEvents, setPriorityEvents] = useState([]);
    const [materialEvents, setMaterialEvents] = useState([]);

    useEffect(() => {
        if (formData.execSummaryGen === "") return;
        const sortedIbra = [...formData.ibra].sort((a, b) => {
            const getRankNumber = (r) => {
                const match = r.riskRank?.match(/^(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            };
            return getRankNumber(b) - getRankNumber(a); // Descending order
        });

        setPriorityEvents(
            sortedIbra
                .filter(r => r.priority === "Yes")
                .map(r => r.UE)
        );

        setMaterialEvents(
            sortedIbra
                .filter(r => r.material === "Yes")
                .map(r => r.UE)
        );
    }, [formData.ibra, formData.execSummaryGen]);

    const handleGenerateSummary = async () => {
        setFormData({
            ...formData,
            execSummaryGen: "Executive Summary generated successfully."
        });
    };

    return (
        <>
            {(["IBRA"].includes(formData.documentType)) && (
                <div className="input-row-risk-create">
                    <div className={`input-box-aim-risk-scope ${errors.aim ? "error-create" : ""}`}>
                        <h3 className="font-fam-labels">Executive Summary <span className="required-field">*</span></h3>
                        {formData.execSummaryGen !== "" ? (
                            <div className="risk-scope-group">
                                <div className="risk-execSummary-popup-page-additional-row ">
                                    <div className="risk-popup-page-column-half-scope">
                                        <label className="scope-risk-label">Additional Notes</label>
                                        <textarea
                                            spellcheck="true"
                                            name="execSummary"
                                            className="aim-textarea-risk-scope font-fam"
                                            onChange={handleInputChange}
                                            value={formData.execSummary}
                                            rows="5"   // Adjust the number of rows for initial height
                                            placeholder="Insert additional notes to the executive summary." // Optional placeholder text
                                        />
                                        <p><strong>The following notes will be displyed in the report:</strong><br /></p>
                                        <p>The <strong>Priority Unwanted Events (PUEs)</strong> identified in this risk assesment are (from the highest to the lowest rating):</p>
                                        <p>
                                            <ul style={{ listStyleType: "disc", paddingLeft: "30px", marginTop: "-5px" }}>
                                                {priorityEvents.length > 0 ? (
                                                    priorityEvents.map((event, index) => (
                                                        <li key={index}>{event}</li>
                                                    ))
                                                ) : (
                                                    <li>No priority events identified.</li>
                                                )}
                                            </ul>
                                        </p>
                                        <p>The <strong>Material Unwanted Events (MUEs)</strong> identified in this risk assesment are (from the highest to the lowest rating):</p>
                                        <p>
                                            <ul style={{ listStyleType: "disc", paddingLeft: "30px", marginTop: "-5px" }}>
                                                {materialEvents.length > 0 ? (
                                                    materialEvents.map((event, index) => (
                                                        <li key={index}>{event}</li>
                                                    ))
                                                ) : (
                                                    <li>No material events identified.</li>
                                                )}
                                            </ul>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button className="add-row-button-ref" onClick={handleGenerateSummary}>
                                Generate
                            </button>
                        )}
                    </div>
                </div >
            )}
        </>
    );
};

export default ExecutiveSummary;
