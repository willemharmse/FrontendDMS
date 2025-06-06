import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faMagicWandSparkles, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import ExecutiveSummaryInfo from './RiskInfo/ExecutiveSummaryInfo';
import { toast } from 'react-toastify';
import "../RiskAssessmentPages/RiskManagementPage.css"

const ExecutiveSummary = ({ formData, setFormData, errors, handleInputChange }) => {
    const [priorityEvents, setPriorityEvents] = useState([]);
    const [materialEvents, setMaterialEvents] = useState([]);
    const [helpES, setHelpES] = useState(false);
    const [lastAiRewrites, setLastAiRewrites] = useState({});

    const openHelpES = () => {
        setHelpES(true);
    }

    const closeHelpES = () => {
        setHelpES(false);
    }

    const AiRewriteExec = async () => {
        try {
            const prompt = formData.execSummary;

            setLastAiRewrites(prev => ({ ...prev, execSummary: prompt }));

            const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/execSummary/ibra`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            setFormData({
                ...formData,
                execSummary: data.response,
            });
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    const undoAiRewrite = (field) => {
        if (lastAiRewrites[field] !== undefined) {
            setFormData(prev => ({
                ...prev,
                [field]: lastAiRewrites[field],
            }));

            // Clear stored undo
            setLastAiRewrites(prev => {
                const updated = { ...prev };
                delete updated[field];
                return updated;
            });

            toast.success(`AI Rewrite reverted.`);
        }
    };

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
            {(["IBRA", "JRA"].includes(formData.documentType)) && (
                <div className="input-row-risk-create">
                    <div className={`input-box-aim-risk-scope ${errors.aim ? "error-create" : ""}`}>
                        <button
                            className="top-left-button-refs"
                            title="Information"
                        >
                            <FontAwesomeIcon icon={faInfoCircle} onClick={openHelpES} style={{ cursor: 'pointer' }} className="icon-um-search" />
                        </button>
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
                                            style={{ fontSize: "14px" }}
                                            rows="5"   // Adjust the number of rows for initial height
                                            placeholder="The automatically generated summary below serves as a starting point to help you draft the introduction of the executive summary. Please insert any other important information or additional notes here." // Optional placeholder text
                                        />
                                        {lastAiRewrites.execSummary ? (
                                            <FontAwesomeIcon
                                                icon={faRotateLeft}
                                                className="aim-textarea-icon-exec"
                                                title="Undo AI Rewrite"
                                                style={{ fontSize: "15px" }}
                                                onClick={() => undoAiRewrite('execSummary')}
                                            />
                                        ) : (
                                            <FontAwesomeIcon
                                                icon={faMagicWandSparkles}
                                                className="aim-textarea-icon-exec"
                                                title="AI Rewrite"
                                                style={{ fontSize: "15px" }}
                                                onClick={() => AiRewriteExec()}
                                            />
                                        )}
                                        <p style={{ fontSize: "14px" }}><strong>The following notes will be displyed in the report:</strong><br /></p>
                                        <p style={{ fontSize: "14px" }}>The <strong>Priority Unwanted Events (PUEs)</strong> identified in this risk assesment are (from the highest to the lowest rating):</p>
                                        <p style={{ fontSize: "14px" }}>
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
                                        <p style={{ fontSize: "14px" }}>The <strong>Material Unwanted Events (MUEs)</strong> identified in this risk assesment are (from the highest to the lowest rating):</p>
                                        <p style={{ fontSize: "14px" }}>
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
            {helpES && (<ExecutiveSummaryInfo setClose={closeHelpES} />)}
        </>
    );
};

export default ExecutiveSummary;
