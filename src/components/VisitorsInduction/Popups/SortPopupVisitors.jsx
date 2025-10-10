const SortPopupVisitors = ({ setSortField, setSortOrder, closeSortModal, sortField, sortOrder, handleSort, site = false, assetType = true }) => {
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
                            <option value="company" style={{ color: "black" }}>Company</option>
                            <option value="contactNr" style={{ color: "black" }}>Contact Number</option>
                            <option value="email" style={{ color: "black" }}>Email</option>
                            <option value="idNumber" style={{ color: "black" }}>ID/Passport</option>
                            <option value="expiryDate" style={{ color: "black" }}>Induction Expiry Date</option>
                            <option value="validity" style={{ color: "black" }}>Induction Validity</option>
                            <option value="indicationVersion" style={{ color: "black" }}>Induction Version Nr</option>
                            <option value="name" style={{ color: "black" }}>Name</option>
                            <option value="surname" style={{ color: "black" }}>Surname</option>
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

export default SortPopupVisitors;