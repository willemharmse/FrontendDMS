import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlusCircle } from '@fortawesome/free-solid-svg-icons';

const InductionSummary = ({ formData, setFormData }) => {
    return (
        <div className="input-row">
            <div className={`input-box-ref`}>
                <h3 className="font-fam-labels">Course Summary</h3>

                <textarea
                    style={{ fontSize: "14px" }}
                    spellcheck="true"
                    name="intorduction"
                    className="aim-textarea font-fam expanding-textarea"
                    rows="5"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Insert Course Summary"
                />
            </div>
        </div>
    );
};

export default InductionSummary;
