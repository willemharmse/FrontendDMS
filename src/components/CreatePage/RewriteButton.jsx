import React, { useState, useEffect } from 'react';
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft, faSpinner, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

const RewriteButton = ({ procedureData, updateRows }) => {
    const [loading, setLoading] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [changed, setChanged] = useState(false);

    const handleRevert = async () => {
        if (originalData) {
            updateRows(originalData); // Restore original data
            setChanged(false);
        }
    }

    const handleOpenAIChat = async (e) => {
        if (loading) return; // Prevent further requests if one is already in progress

        try {
            if (procedureData.length < 2) {
                toast.dismiss();
                toast.clearWaitingQueue();
                toast.warn("There should be at least two procedure steps or more.", {
                    closeButton: false,
                    autoClose: 800, // 1.5 seconds
                    style: {
                        textAlign: 'center'
                    }
                });
                return;
            }

            if (procedureData.some(row => !row.mainStep.trim())) {
                toast.dismiss();
                toast.clearWaitingQueue();
                toast.warn("All procedure main steps must have a value.", {
                    closeButton: false,
                    autoClose: 800, // 1.5 seconds
                    style: {
                        textAlign: 'center'
                    }
                });
                return;
            }

            if (procedureData.some(row => !row.SubStep.trim())) {
                toast.dismiss();
                toast.clearWaitingQueue();
                toast.warn("All procedure sub steps must have a value.", {
                    closeButton: false,
                    autoClose: 800, // 1.5 seconds
                    style: {
                        textAlign: 'center'
                    }
                });
                return;
            }

            setLoading(true); // Set loading state to true when request starts

            if (!originalData) {
                setOriginalData([...procedureData]); // Copy to prevent mutation
            }

            const prompt = JSON.stringify(procedureData);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ prompt: prompt }),
            });

            if (!response.ok) {
                throw new Error(response.error || 'Failed to upload file');
            }

            const data = await response.json();
            const cleanedResponse = data.response.map(item => ({
                ...item,
                SubStep: item.SubStep.includes('\\n') ? item.SubStep.replace(/\\n/g, '\n') : item.SubStep // Convert escaped \n to actual new lines
            }));

            updateRows(cleanedResponse);
            setChanged(true);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false); // Reset loading state once request is complete
            console.log("Success");
        }
    };

    return (
        <div className="flowchart-container">
            <div className="flowchart-buttons">
                <button onClick={changed ? handleRevert : handleOpenAIChat}
                    disabled={loading} className="top-right-button-proc-2" title='AI Rewrite'>
                    {changed ? <FontAwesomeIcon icon={faRotateLeft} className="icon-um-search" /> : (loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faWandMagicSparkles} className="icon-um-search" />)}
                </button>
            </div>
        </div>
    );
};

export default RewriteButton;