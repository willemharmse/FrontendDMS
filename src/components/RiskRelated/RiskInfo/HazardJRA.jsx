

import React, { useState, useEffect } from "react";
import "./HazardJRA.css"; // Add styling here

const HazardJRA = ({ setClose }) => {
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
        <div className="popup-overlay-haz-jra">
            <div className="popup-content-haz-jra">
                <div className="review-date-header">
                    <h2 className="review-date-title">Hazard</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="haz-jra-table-group-2">
                    <div className="popup-table-wrapper-haz-jra-2">
                        <p>
                            For each main step in the Job Risk Assessment (JRA), the first listed hazard must be <strong>Work Execution</strong>, and the corresponding unwanted event must be <strong>Nonadherence to task step requirements/specifications</strong>. These entries are fixed for each main step and cannot be modified by the user, as they are intended to capture the specific sub steps of the main task.
                        </p>
                        <p>
                            <br />Additional hazards and corresponding unwanted events must be added by the user as they are identified for each main step. The column following the unwanted event is used to record the associated controls.
                        </p>
                    </div>
                </div>

                <div className="haz-jra-table-group">
                    <div className="popup-table-wrapper-haz-jra">
                        <table className="popup-table haznt-fam">
                            <thead className="haz-jra-headers">
                                <tr>
                                    <th className="inp-size-haz-jra">Term</th>
                                    <th className="desc-size-haz-jra">Description</th>
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

export default HazardJRA;