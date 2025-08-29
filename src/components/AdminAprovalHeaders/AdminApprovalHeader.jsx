import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';

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
                            <div className="date-filter-row">
                                <label className="date-label">From:</label>
                                <input
                                    type="date"
                                    className="filter-input-date"
                                    value={filters.suggestedFrom || ''}
                                    onChange={(e) => onFilterChange('suggestedFrom', e.target.value)}
                                />
                            </div>
                            <div className="date-filter-row">
                                <label className="date-label">To:</label>
                                <input
                                    type="date"
                                    className="filter-input-date"
                                    value={filters.suggestedTo || ''}
                                    onChange={(e) => onFilterChange('suggestedTo', e.target.value)}
                                />
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
                        <div className="date-menu-filter">
                            <div className="date-filter-row">
                                <label className="date-label">From:</label>
                                <input
                                    type="date"
                                    className="filter-input-date"
                                    value={filters.reviewFrom || ''}
                                    onChange={(e) => onFilterChange('reviewFrom', e.target.value)}
                                />
                            </div>
                            <div className="date-filter-row">
                                <label className="date-label">To:</label>
                                <input
                                    type="date"
                                    className="filter-input-date"
                                    value={filters.reviewTo || ''}
                                    onChange={(e) => onFilterChange('reviewTo', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </th>
        </tr>
    );
};

export default AdminApprovalHeader;
