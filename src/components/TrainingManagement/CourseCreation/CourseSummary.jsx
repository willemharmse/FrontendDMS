import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlusCircle } from '@fortawesome/free-solid-svg-icons';

const CourseSummary = () => {
    return (
        <div className="input-row">
            <div className={`input-box-ref`}>
                <h3 className="font-fam-labels">Course Summary</h3>

                <button className="add-row-button-ref">
                    Generate Using AI
                </button>
            </div>
        </div>
    );
};

export default CourseSummary;
