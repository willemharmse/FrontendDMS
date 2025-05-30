import React, { useState, useEffect } from 'react';

const ExecutiveSummaryJRA = ({ formData, setFormData, errors, handleInputChange }) => {
    const handleGenerateSummary = async () => {
        setFormData({
            ...formData,
            execSummaryGen: "Executive Summary generated successfully."
        });
    };

    return (
        <>
            {(["IBRA", "JRA"].includes(formData.documentType)) && (
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
                                            placeholder="The automatically generated summary below serves as a starting point to help you draft the introduction of the executive summary. Please insert any other important information or additional notes here." // Optional placeholder text
                                        />
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

export default ExecutiveSummaryJRA;
