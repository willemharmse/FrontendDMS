import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import './FilterName.css';

const FilterFileName = ({ access, canIn, filters, onFilterChange, trashed }) => {
    const [openMenu, setOpenMenu] = useState(null); // Track the currently open menu

    const toggleMenu = (menu) => {
        setOpenMenu((prevState) => (prevState === menu ? null : menu));
    };

    return (
        <tr className={trashed ? 'trashed' : ""}>
            <th className="doc-num-filter col">Nr</th>
            <th className="col-dis-filter col">
                <div className="fileinfo-container-filter-1">
                    <span className="fileinfo-title-filter-1">Discipline</span>
                </div>
            </th>
            <th className="col-name-filter col">
                <div className="fileinfo-container-filter-1">
                    <span className="fileinfo-title-filter-1">Document Name</span>
                </div>
            </th>
            <th className="col-type-filter col">
                <div className="fileinfo-container-filter-1">
                    <span className="fileinfo-title-filter-1">Document Type</span>
                </div>
            </th>
            {canIn(access, "DMS", ["systemAdmin", "contributor"]) && (
                <th className="col-stat-filter col">
                    <div className="fileinfo-container-filter-1">
                        <span className="fileinfo-title-filter-1">Status</span>
                    </div>
                </th>
            )}
            <th className={`col-own-filter ${filters.author ? "active-filter" : ""}`}>
                <div className="fileinfo-container-filter col">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('Author')}>
                        {filters.author ? (
                            <>
                                <span>Owner</span> <FontAwesomeIcon icon={faFilter} style={{ marginLeft: "5px" }} />
                            </>
                        ) : (
                            "Owner"
                        )}
                    </span>
                    {openMenu === 'Author' && (
                        <div
                            className="fileinfo-menu-filter col"
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
            <th className={`col-dept-head-filter ${filters.deptHead ? "active-filter-dept" : ""} col`}>
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('DeptHead')}>
                        {filters.deptHead ? (
                            <>
                                <span>Department Head</span> <FontAwesomeIcon icon={faFilter} style={{ marginLeft: "0px" }} />
                            </>
                        ) : (
                            "Department Head"
                        )}
                    </span>
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
            <th className={`col-docID-filter ${filters.docID ? "active-filter" : ""} col`}>
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('DocID')}>
                        {filters.docID ? (
                            <>
                                <span>Doc ID</span> <FontAwesomeIcon icon={faFilter} style={{ marginLeft: "5px" }} />
                            </>
                        ) : (
                            "Document ID"
                        )}
                    </span>
                    {openMenu === 'DocID' && (
                        <div
                            className="fileinfo-menu-filter"
                            onMouseLeave={() => setOpenMenu(null)}
                        >
                            <input
                                type="text"
                                placeholder="Filter by document ID"
                                className="filter-input-file"
                                value={filters.docID}
                                onChange={(e) => onFilterChange('docID', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </th>
            <th className={`col-date-filter ${filters.startDate || filters.endDate ? " active-filter-review" : ""} col`}>
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('Date')}>
                        {filters.startDate || filters.endDate ? (
                            <>
                                <span>Review Date</span> <FontAwesomeIcon icon={faFilter} style={{ marginLeft: "0px" }} />
                            </>
                        ) : (
                            "Review Date"
                        )}
                    </span>
                    {openMenu === 'Date' && (
                        <div className="date-menu-filter">
                            <div className="date-filter-row">
                                <label className="date-label">From:</label>
                                <input
                                    type="date"
                                    className="filter-input-date"
                                    value={filters.startDate}
                                    onChange={(e) => onFilterChange('startDate', e.target.value)}
                                />
                            </div>
                            <div className="date-filter-row">
                                <label className="date-label">To:</label>
                                <input
                                    type="date"
                                    className="filter-input-date"
                                    value={filters.endDate}
                                    onChange={(e) => onFilterChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </th>
            <th className={`col-own-filter ${filters.uploader ? "active-filter" : ""}`}>
                <div className="fileinfo-container-filter col">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('Uploader')}>
                        {filters.uploader ? (
                            <>
                                <span>Uploaded By</span> <FontAwesomeIcon icon={faFilter} style={{ marginLeft: "5px" }} />
                            </>
                        ) : (
                            "Uploaded By"
                        )}
                    </span>
                    {openMenu === 'Uploader' && (
                        <div
                            className="fileinfo-menu-filter col"
                            onMouseLeave={() => setOpenMenu(null)}
                        >
                            <input
                                type="text"
                                placeholder="Filter by author"
                                className="filter-input-file"
                                value={filters.uploader}
                                onChange={(e) => onFilterChange('uploader', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </th>
            <th className={`col-date-filter ${filters.startDate || filters.endDate ? " active-filter-review" : ""} col`}>
                <div className="fileinfo-container-filter">
                    <span className="fileinfo-title-filter" onClick={() => toggleMenu('UploadDate')}>
                        {filters.startDate || filters.endDate ? (
                            <>
                                <span>Upload Date</span> <FontAwesomeIcon icon={faFilter} style={{ marginLeft: "0px" }} />
                            </>
                        ) : (
                            "Upload Date"
                        )}
                    </span>
                    {openMenu === 'UploadDate' && (
                        <div className="date-menu-filter">
                            <div className="date-filter-row">
                                <label className="date-label">From:</label>
                                <input
                                    type="date"
                                    className="filter-input-date"
                                    value={filters.UploadDate}
                                    onChange={(e) => onFilterChange('UploadDate', e.target.value)}
                                />
                            </div>
                            <div className="date-filter-row">
                                <label className="date-label">To:</label>
                                <input
                                    type="date"
                                    className="filter-input-date"
                                    value={filters.UploadDate}
                                    onChange={(e) => onFilterChange('UploadDate', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </th>
            {canIn(access, "DMS", ["systemAdmin", "contributor"]) && (
                <th className="col-act-filter col">Action</th>
            )}
        </tr>
    );
};

export default FilterFileName;
