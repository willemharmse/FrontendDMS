import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTrash, faX } from '@fortawesome/free-solid-svg-icons';
import DatePicker from 'react-multi-date-picker';

const AdminApprovalHeader = ({ filters, onFilterChange }) => {
    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (menu) => {
        setOpenMenu((prev) => (prev === menu ? null : menu));
    };

    // Helpers to know whether a column is “active” (to show icon + highlight)
    const isActiveText = (key) => Boolean(filters?.[key]);
    const isActiveDate = (fromKey, toKey) => Boolean(filters?.[fromKey] || filters?.[toKey]);

    return (
        <tr>
            {/* Nr — no filter */}
            <th style={{ textAlign: "left" }} className="risk-admin-approve-th-index doc-num-filter col">Nr</th>

            {/* Type (text) */}
            <th style={{ textAlign: "left" }} className={`risk-admin-approve-th-type col-name-filter col ${isActiveText('type') ? 'active-filter' : ''}`}>
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('Type')}>
                        {isActiveText('type') ? <>Type <FontAwesomeIcon icon={faFilter} style={{ marginLeft: 5 }} /></> : 'Type'}
                    </span>
                    {openMenu === 'Type' && (
                        <div className="fileinfo-menu-filter" onMouseLeave={() => setOpenMenu(null)}>
                            <input
                                type="text"
                                placeholder="Filter by type"
                                className="filter-input-file"
                                value={filters.type || ''}
                                onChange={(e) => onFilterChange('type', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </th>

            {/* Item (text) */}
            <th style={{ textAlign: "left" }} className={`risk-admin-approve-th-item col-stat-filter col ${isActiveText('item') ? 'active-filter' : ''}`}>
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('Item')}>
                        {isActiveText('item') ? <>Item <FontAwesomeIcon icon={faFilter} style={{ marginLeft: 5 }} /></> : 'Item'}
                    </span>
                    {openMenu === 'Item' && (
                        <div className="fileinfo-menu-filter" onMouseLeave={() => setOpenMenu(null)}>
                            <input
                                type="text"
                                placeholder="Filter by item"
                                className="filter-input-file"
                                value={filters.item || ''}
                                onChange={(e) => onFilterChange('item', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </th>

            {/* Description (text) */}
            <th style={{ textAlign: "left" }} className={`col risk-admin-approve-th-desc col-stat-filter col ${isActiveText('description') ? 'active-filter' : ''}`}>
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('Description')}>
                        {isActiveText('description') ? <>Description <FontAwesomeIcon icon={faFilter} style={{ marginLeft: 5 }} /></> : 'Description'}
                    </span>
                    {openMenu === 'Description' && (
                        <div className="fileinfo-menu-filter" onMouseLeave={() => setOpenMenu(null)}>
                            <input
                                type="text"
                                placeholder="Filter by description"
                                className="filter-input-file"
                                value={filters.description || ''}
                                onChange={(e) => onFilterChange('description', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </th>

            {/* Suggested By (text) */}
            <th style={{ textAlign: "left" }} className={`risk-admin-approve-th-user col-own-filter col ${isActiveText('suggestedBy') ? 'active-filter' : ''}`}>
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('SuggestedBy')}>
                        {isActiveText('suggestedBy') ? <>Suggested By <FontAwesomeIcon icon={faFilter} style={{ marginLeft: 5 }} /></> : 'Suggested By'}
                    </span>
                    {openMenu === 'SuggestedBy' && (
                        <div className="fileinfo-menu-filter" onMouseLeave={() => setOpenMenu(null)}>
                            <input
                                type="text"
                                placeholder="Filter by user"
                                className="filter-input-file"
                                value={filters.suggestedBy || ''}
                                onChange={(e) => onFilterChange('suggestedBy', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </th>

            {/* Suggested Date (date range) */}
            <th style={{ textAlign: "center" }} className={`risk-admin-approve-th-date col-date-filter col ${isActiveDate('suggestedFrom', 'suggestedTo') ? 'active-filter-review' : ''}`}>
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('SuggestedDate')}>
                        {isActiveDate('suggestedFrom', 'suggestedTo') ? <>Suggested Date <FontAwesomeIcon icon={faFilter} style={{ marginLeft: 0 }} /></> : 'Suggested Date'}
                    </span>
                    {openMenu === 'SuggestedDate' && (
                        <div className="date-menu-filter">
                            <div className="date-filter-row" style={{ gap: "0px" }}>
                                <label className="date-label">From</label>

                                <DatePicker
                                    value={filters.suggestedFrom || ""}
                                    format="YYYY-MM-DD"
                                    onChange={(val) =>
                                        onFilterChange("suggestedFrom", val?.format("YYYY-MM-DD"))
                                    }
                                    rangeHover={false}
                                    highlightToday={false}
                                    editable={false}
                                    inputClass="filter-input-date"
                                    placeholder="YYYY-MM-DD"
                                    hideIcon={false}
                                />

                                {/* 👇 Clear button resets the filter */}
                                {filters.suggestedFrom && (
                                    <button
                                        type="button"
                                        onClick={() => onFilterChange("suggestedFrom", "")}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#666",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            padding: "2px 6px",
                                        }}
                                        title="Clear date"
                                    >
                                        <FontAwesomeIcon icon={faTrash} title='Clear Filter' />
                                    </button>
                                )}
                            </div>

                            <div className="date-filter-row" style={{ gap: "0px" }}>
                                <label className="date-label">To:</label>
                                <DatePicker
                                    value={filters.suggestedTo || ""}
                                    format="YYYY-MM-DD"
                                    onChange={(val) => onFilterChange('suggestedTo', val?.format("YYYY-MM-DD"))}
                                    highlightToday={false}       // 👈 disables automatic highlight
                                    editable={false}
                                    inputClass="filter-input-date"
                                    placeholder="YYYY-MM-DD"
                                    hideIcon={false}
                                    rangeHover={false}
                                />

                                {filters.suggestedTo && (
                                    <button
                                        type="button"
                                        onClick={() => onFilterChange("suggestedTo", "")}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#666",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            padding: "2px 6px",
                                        }}
                                        title="Clear date"
                                    >
                                        <FontAwesomeIcon icon={faTrash} title='Clear Filter' />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </th>

            {/* Status (text) */}
            <th style={{ textAlign: "center" }} className={`risk-admin-approve-th-status col-stat-filter col ${isActiveText('status') ? 'active-filter' : ''}`}>
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('Status')}>
                        {isActiveText('status') ? <>Status <FontAwesomeIcon icon={faFilter} style={{ marginLeft: 5 }} /></> : 'Status'}
                    </span>
                    {openMenu === 'Status' && (
                        <div className="fileinfo-menu-filter" onMouseLeave={() => setOpenMenu(null)}>
                            <input
                                type="text"
                                placeholder="Filter by status"
                                className="filter-input-file"
                                value={filters.status || ''}
                                onChange={(e) => onFilterChange('status', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </th>

            {/* Review Date (date range) */}
            <th style={{ textAlign: "center" }} className={`risk-admin-approve-th-date col-date-filter col ${isActiveDate('reviewFrom', 'reviewTo') ? 'active-filter-review' : ''} col`}>
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('ReviewDate')}>
                        {isActiveDate('reviewFrom', 'reviewTo') ? <>Review Date <FontAwesomeIcon icon={faFilter} style={{ marginLeft: 0 }} /></> : 'Review Date'}
                    </span>
                    {openMenu === 'ReviewDate' && (
                        <div className="date-menu-filter" style={{ left: "-150px" }}>
                            <div className="date-filter-row" style={{ gap: "0px" }}>
                                <label className="date-label">From</label>
                                <DatePicker
                                    value={filters.reviewFrom || ""}
                                    format="YYYY-MM-DD"
                                    onChange={(val) => onFilterChange('reviewFrom', val?.format("YYYY-MM-DD"))}
                                    highlightToday={false}       // 👈 disables automatic highlight
                                    editable={false}
                                    inputClass="filter-input-date"
                                    placeholder="YYYY-MM-DD"
                                    hideIcon={false}
                                />

                                {filters.reviewFrom && (
                                    <button
                                        type="button"
                                        onClick={() => onFilterChange("reviewFrom", "")}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#666",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            padding: "2px 6px",
                                        }}
                                        title="Clear date"
                                    >
                                        <FontAwesomeIcon icon={faTrash} title='Clear Filter' />
                                    </button>
                                )}
                            </div>
                            <div className="date-filter-row" style={{ gap: "0px" }}>
                                <label className="date-label">To:</label>
                                <DatePicker
                                    value={filters.reviewTo || ""}
                                    format="YYYY-MM-DD"
                                    onChange={(val) => onFilterChange('reviewTo', val?.format("YYYY-MM-DD"))}
                                    highlightToday={false}       // 👈 disables automatic highlight
                                    editable={false}
                                    inputClass="filter-input-date"
                                    placeholder="YYYY-MM-DD"
                                    hideIcon={false}
                                />
                                {filters.reviewTo && (
                                    <button
                                        type="button"
                                        onClick={() => onFilterChange("reviewTo", "")}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#666",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            padding: "2px 6px",
                                        }}
                                        title="Clear date"
                                    >
                                        <FontAwesomeIcon icon={faTrash} title='Clear Filter' />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </th>
        </tr>
    );
};

export default AdminApprovalHeader;
