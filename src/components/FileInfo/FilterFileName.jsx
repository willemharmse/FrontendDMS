import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import './FilterName.css';

const FilterFileName = ({ role, adminRoles, filters, onFilterChange }) => {
    const [openMenu, setOpenMenu] = useState(null); // Track the currently open menu

    const toggleMenu = (menu) => {
        setOpenMenu((prevState) => (prevState === menu ? null : menu));
    };

    return (
        <tr>
            <th className="doc-num-filter">Nr</th>
            <th className="col-dis-filter">
                <div className="fileinfo-container-filter-1">
                    <span className="fileinfo-title-filter-1">Discipline</span>
                </div>
            </th>
            <th className="col-name-filter">
                <div className="fileinfo-container-filter-1">
                    <span className="fileinfo-title-filter-1">File Name</span>
                </div>
            </th>
            <th className="col-type-filter">
                <div className="fileinfo-container-filter-1">
                    <span className="fileinfo-title-filter-1">Document Type</span>
                </div>
            </th>
            {(adminRoles.includes(role) || role === 'auditor') && (
                <th className="col-stat-filter">
                    <div className="fileinfo-container-filter-1">
                        <span className="fileinfo-title-filter-1">Status</span>
                    </div>
                </th>
            )}
            <th className="col-own-filter">
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('Author')}>Author</span>
                    {openMenu === 'Author' && (
                        <div
                            className="fileinfo-menu-filter"
                            onMouseLeave={() => setOpenMenu(null)}
                        >
                            <input
                                type="text"
                                placeholder="Filter by author"
                                className="filter-input-file"
                                value={filters.author}
                                onChange={(e) => onFilterChange('author', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </th>
            <th className="col-dept-head-filter">
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('DeptHead')}>Department Head</span>
                    {openMenu === 'DeptHead' && (
                        <div
                            className="dept-menu-filter"
                            onMouseLeave={() => setOpenMenu(null)}
                        >
                            <input
                                type="text"
                                placeholder="Filter by department head"
                                className="filter-input-file"
                                value={filters.deptHead}
                                onChange={(e) => onFilterChange('deptHead', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </th>
            <th className="col-docID-filter">
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('DocID')}>Doc ID</span>
                    {openMenu === 'DocID' && (
                        <div
                            className="fileinfo-menu-filter"
                            onMouseLeave={() => setOpenMenu(null)}
                        >
                            <input
                                type="text"
                                placeholder="Filter by doc ID"
                                className="filter-input-file"
                                value={filters.docID}
                                onChange={(e) => onFilterChange('docID', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </th>
            <th className="col-date-filter">
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('Date')}>Review Date</span>
                    {openMenu === 'Date' && (
                        <div className="date-menu-filter">
                            <div className="date-filter-container">
                                <label className="date-label">From:</label>
                                <input
                                    type="date"
                                    placeholder="Start Date"
                                    className="filter-input-file"
                                    value={filters.startDate}
                                    onChange={(e) => onFilterChange('startDate', e.target.value)}
                                />
                                <label className="date-label">To:</label>
                                <input
                                    type="date"
                                    placeholder="End Date"
                                    className="filter-input-file"
                                    value={filters.endDate}
                                    onChange={(e) => onFilterChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </th>
            {adminRoles.includes(role) && (
                <th className="col-act-filter">Actions</th>
            )}
        </tr>
    );
};

export default FilterFileName;
