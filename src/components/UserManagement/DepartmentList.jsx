import React, { useState, useEffect, useRef } from "react";
import "./AddMembersDept.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast, ToastContainer } from 'react-toastify';
import { faSpinner, faTrash, faTrashCan, faX, faSearch } from '@fortawesome/free-solid-svg-icons';
import DeletePopupDM from "./DeletePopupDM";

const DeparmentList = ({ closePopup }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [departments, setDepartments] = useState([]);
    const [deleteID, setDeleteID] = useState("");
    const [deleteName, setDeleteName] = useState("");
    const [confirm, setConfirm] = useState(false);

    const closeConfirm = () => {
        setConfirm(!confirm);
    };

    const openConfirm = () => {
        setConfirm(true);
    };

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/`, {
                headers: {
                    //'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch count');
            }
            const data = await response.json();

            const sortedUsers = data.departments.sort((a, b) => {
                // Replace 'name' with the property you want to sort by
                return a.department.localeCompare(b.department);
            });

            setDepartments(sortedUsers);
        } catch (error) {
            console.log(error.message);
        }
    };

    const handleDelete = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/delete/${deleteID}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete department');
            }

            setConfirm(false);
            fetchValues();

            toast.success("Department deleted successfully.", {
                autoClose: 800,
                closeButton: false,
                style: { textAlign: 'center' }
            });
        } catch (error) {
            console.log(error.message);
        }
    };

    const clearSearch = () => {
        setSearchTerm("");
    };

    useEffect(() => {
        fetchValues();
    }, []);

    return (
        <div className="popup-overlay-dept">
            {confirm && (<DeletePopupDM setIsDeleteModalOpen={setConfirm} handleDelete={handleDelete} departmentName={deleteName} />)}
            <div className="popup-content-dept">
                <div className="review-date-header">
                    <h2 className="review-date-title">Remove Department</h2>
                    <button className="review-date-close" onClick={closePopup}>×</button>
                </div>

                <div className="review-date-group">
                    <div className="dept-input-container">
                        <input
                            className="search-input-dept"
                            type="text"
                            placeholder="Search department"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" /></i>)}
                        {searchTerm === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>
                </div>

                <div className="dept-table-group-2">
                    <div className="popup-table-wrapper-dept-2">
                        <table className="popup-table font-fam">
                            <thead className="dept-headers">
                                <tr>
                                    <th className="dept-Name-delete">Department</th>
                                    <th className="dept-Act-delete">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departments.length > 0 ? (
                                    departments
                                        .filter(department => department.department.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .sort((a, b) => a.department.localeCompare(b.department))
                                        .map(department => (
                                            <tr key={department._id} style={{ cursor: "pointer" }}>
                                                <td className="">{department.department}</td>
                                                <td className="dept-Act-icon-delete"><FontAwesomeIcon icon={faTrash} onClick={() => {
                                                    setDeleteID(department._id);
                                                    setDeleteName(department.department);
                                                    openConfirm(); // Fix: Call function with ()
                                                }}
                                                />
                                                </td>
                                            </tr>
                                        ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">Loading users...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeparmentList;
