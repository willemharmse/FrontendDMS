import React, { useEffect, useState } from "react";
import "./SortPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const SortPopup = ({ setSortField, setSortOrder, closeSortModal, sortField, sortOrder, handleSort }) => {
    return (
        <div className="sort-popup-overlay">
            <div className="sort-popup-content">
                <div className="sort-file-header">
                    <h2 className="sort-file-title">Sort Files</h2>
                    <button className="sort-file-close" onClick={closeSortModal}>×</button>
                </div>

                <div className="sort-file-group">
                    <div className="sort-file-text">Field</div>
                    <div className="sort-files-select-container">
                        <select
                            id="sort-field"
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value)}
                            className="sort-files-select"
                        >
                            <option value="">Select Field</option>
                            <option value="departmentHead">Department Head</option>
                            <option value="discipline">Discipline</option>
                            <option value="docID">Document ID</option>
                            <option value="documentType">Document Type</option>
                            <option value="fileName">File Name</option>
                            <option value="owner">Owner</option>
                            <option value="reviewDate">Review Date</option>
                            <option value="status">Status</option>
                            <option value="userID.username">Uploaded By</option>
                            <option value="uploadDate">Upload Date</option>
                        </select>
                    </div>
                </div>

                <div className="sort-file-group">
                    <div className="sort-file-text">Order</div>
                    <div className="sort-files-select-container">
                        <select
                            id="sort-order"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="sort-files-select"
                        >
                            <option value="ascending">Ascending</option>
                            <option value="descending">Descending</option>
                        </select>
                    </div>
                </div>

                <div className="sort-file-buttons">
                    <button className="sort-file-button" onClick={handleSort}>
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SortPopup;