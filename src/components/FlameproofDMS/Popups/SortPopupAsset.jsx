const SortPopupAsset = ({ setSortField, setSortOrder, closeSortModal, sortField, sortOrder, handleSort, site = false, assetType = true }) => {
    return (
        <div className="sort-popup-overlay">
            <div className="sort-popup-content">
                <div className="sort-file-header">
                    <h2 className="sort-file-title">Sort Assets</h2>
                    <button className="sort-file-close" onClick={closeSortModal} title="Close Popup">×</button>
                </div>

                <div className="sort-file-group">
                    <div className="sort-file-text">Field</div>
                    <div className="sort-files-select-container">
                        <select
                            id="sort-field"
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value)}
                            className="sort-files-select"
                            style={{ color: sortField === "" ? "gray" : "black" }}
                        >
                            <option value="" style={{ color: "gray" }}>Select Field</option>
                            <option value="operationalArea" style={{ color: "black" }}>Area</option>
                            <option value="assetNr" style={{ color: "black" }}>Asset Nr</option>
                            <option value="assetOwner" style={{ color: "black" }}>Asset Owner</option>
                            {assetType && (<option value="assetType" style={{ color: "black" }}>Asset Type</option>)}
                            <option value="complianceStatus" style={{ color: "black" }}>Compliance Status</option>
                            <option value="departmentHead" style={{ color: "black" }}>Department Head</option>
                            {site && (<option value="siteName" style={{ color: "black" }}>Site</option>)}
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

export default SortPopupAsset;