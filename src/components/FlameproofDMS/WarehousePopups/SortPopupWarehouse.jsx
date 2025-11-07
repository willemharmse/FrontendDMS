const SortPopupWarehouse = ({ setSortField, setSortOrder, closeSortModal, sortField, sortOrder, handleSort }) => {
    return (
        <div className="sort-popup-overlay">
            <div className="sort-popup-content">
                <div className="sort-file-header">
                    <h2 className="sort-file-title">Sort Digital Warehouse</h2>
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
                            <option value="assetType" style={{ color: "black" }}>Asset Type</option>
                            <option value="component" style={{ color: "black" }}>Component</option>
                            <option value="serialNumber" style={{ color: "black" }}>Component Serial Number</option>
                            <option value="issueDate" style={{ color: "black" }}>Certificate Issue Date</option>
                            <option value="certAuth" style={{ color: "black" }}>Certification Body</option>
                            <option value="certNr" style={{ color: "black" }}>Certificate Number</option>
                            <option value="status" style={{ color: "black" }}>Certification Status</option>
                            <option value="site.site" style={{ color: "black" }}>Site</option>
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

export default SortPopupWarehouse;