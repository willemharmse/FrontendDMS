
import React, { useState, useEffect } from "react";
import "./RiskSource.css"; // Add styling here

const RiskSource = ({ setClose }) => {
    const [sourceData, setSourceData] = useState([]);

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/source`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }

            const data = await response.json();

            setSourceData(data.risks);
        } catch (error) {
            console.error("Error fetching equipment:", error);
        }
    };

    useEffect(() => {
        fetchValues();
    }, []);

    return (
        <div className="popup-overlay-rs">
            <div className="popup-content-rs">
                <div className="review-date-header">
                    <h2 className="review-date-title">Hazard / Energy Release</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="rs-table-group">
                    <div className="popup-table-wrapper-rs">
                        <table className="popup-table font-fam">
                            <thead className="rs-headers">
                                <tr>
                                    <th className="inp-size-rs">Term</th>
                                    <th className="desc-size-rs">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sourceData.length > 0 ? (
                                    sourceData
                                        .sort((a, b) => a.term.localeCompare(b.term))
                                        .map((item) => (
                                            <tr key={item.term}>
                                                <td style={{ fontWeight: "bold" }}>
                                                    {item.term}
                                                </td>
                                                <td>
                                                    {item.definition}
                                                </td>
                                            </tr>
                                        ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">Loading sources...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default RiskSource;