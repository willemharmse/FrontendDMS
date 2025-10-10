import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlusCircle, faMagicWandSparkles, faSpinner, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

const InductionSummary = ({ formData, setFormData }) => {
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [rewriteHistory, setRewriteHistory] = useState({
        summary: []
    });

    const pushAiRewriteHistory = (field) => {
        setRewriteHistory(prev => ({
            ...prev,
            [field]: [...prev[field], formData[field]]
        }));
    };

    const undoAiRewrite = (field) => {
        setRewriteHistory(prev => {
            const hist = [...prev[field]];
            if (hist.length === 0) return prev;         // nothing to undo
            const lastValue = hist.pop();
            setFormData(fd => ({ ...fd, [field]: lastValue }));
            return { ...prev, [field]: hist };
        });
    };


    const AiRewriteSummary = async () => {
        try {
            const prompt = formData.summary;

            pushAiRewriteHistory('summary');
            setLoadingSummary(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatInduction/summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ prompt }),
            });

            const { response: newText } = await response.json();
            setLoadingSummary(false);
            setFormData(fd => ({ ...fd, summary: newText }));
        } catch (error) {
            setLoadingSummary(false);
            console.error('Error saving data:', error);
        }
    }

    return (
        <div className="input-row">
            <div className={`input-box-ref`}>
                <h3 className="font-fam-labels">Course Summary</h3>

                <textarea
                    style={{ fontSize: "14px" }}
                    spellcheck="true"
                    name="summary"
                    className="aim-textarea font-fam expanding-textarea"
                    rows="5"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Insert visitor induction summary."
                />

                {loadingSummary ? (<FontAwesomeIcon icon={faSpinner} className="aim-textarea-icon-ibra spin-animation" />) : (
                    <FontAwesomeIcon
                        icon={faMagicWandSparkles}
                        className="aim-textarea-icon-ibra"
                        title="AI Rewrite"
                        style={{ fontSize: "15px" }}
                        onClick={() => AiRewriteSummary()}
                    />
                )}

                <FontAwesomeIcon
                    icon={faRotateLeft}
                    className="aim-textarea-icon-ibra-undo"
                    title="Undo AI Rewrite"
                    onClick={() => undoAiRewrite('summary')}
                    style={{
                        marginLeft: '8px',
                        opacity: rewriteHistory.summary.length ? 1 : 0.3,
                        cursor: rewriteHistory.summary.length ? 'pointer' : 'not-allowed',
                        fontSize: "15px"
                    }}
                />
            </div>
        </div>
    );
};

export default InductionSummary;
