const SortPopupVisitorDevices = ({ setSortField, setSortOrder, closeSortModal, sortField, sortOrder, handleSort, site = false, assetType = true }) => {
    return (
        <div className="sort-popup-overlay">
            <div className="sort-popup-content">
                <div className="sort-file-header">
                    <h2 className="sort-file-title">Sort Visitor Devices</h2>
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
                            <option value="arrivalDate" style={{ color: "black" }}>Arrival Date</option>
                            <option value="deviceName" style={{ color: "black" }}>Device Name</option>
                            <option value="deviceType" style={{ color: "black" }}>Device Type</option>
                            <option value="exitDate" style={{ color: "black" }}>Exit Date</option>
                            <option value="serialNumber" style={{ color: "black" }}>Serial Number</option>
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

export default SortPopupVisitorDevices;