import React, { useEffect, useState } from 'react';

const EditUserModal = ({ isEditModalOpen, setIsEditModalOpen, updateUser, formError, userToEdit, setUserToEdit, current, isAdmin }) => {
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);

    const DESIGNATIONS = [
        "Automation & Systems Manager",
        "Boilermaker",
        "Business Development Manager",
        "Construction Manager",
        "Control and Instrumentation (C&I) Technician",
        "Diesel Mechanic",
        "Electrician",
        "Electrical Technician",
        "Engineer",
        "Engineering Assistant",
        "Engineering Foreman (Mechanical/Electrical)",
        "Engineering Manager",
        "Engineering Superintendent",
        "Fitter",
        "Full Stack Developer",
        "Health and Safety Manager",
        "HR Manager",
        "HR Manager – Technical Training",
        "Instrumentation Mechanic",
        "LFI Specialist",
        "Maintenance Planner",
        "Mechanical Technician",
        "Millwright",
        "ORM Support",
        "Pit Superintendent",
        "Plant Manager",
        "Principal Network Engineer",
        "Project Coordinator",
        "Project Engineer",
        "Project Management Lead",
        "Project Manager",
        "Section Engineer",
        "Section Engineering Manager",
        "Senior C&I Technician/ Superintendent",
        "Senior Engineering Manager",
        "Senior Product Manager",
        "Senior Supervisor MineProtect",
        "Site Area Supervisor",
        "Solution Analyst",
        "Surface Chief Safety Officer",
        "Surface TMM Engineer",
        "Technician",
        "Underground TMM Engineer",
        "Utilities Engineer",
        "Vehicle Operator",
        "Workspace Manager"
    ];

    const [designations, setDesignations] = useState(DESIGNATIONS);

    const fetchDepartments = async () => {
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
                return a.department.localeCompare(b.department);
            });

            setDepartments(sortedUsers);
        } catch (error) {
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`);
            if (!response.ok) throw new Error('Failed to fetch users');

            const data = await response.json();

            const sorted = (data?.users ?? []).slice()
                .sort((a, b) => a.username.localeCompare(b.username));

            const currentId = userToEdit?._id ? String(userToEdit._id) : "";
            const filtered = currentId
                ? sorted.filter(u => String(u?._id) !== currentId) // filter out self
                : sorted;

            setUsers(filtered);
        } catch (error) {
            console.error("fetchUsers error:", error);
        }
    };

    useEffect(() => {
        if (!isEditModalOpen) return;
        fetchDepartments();
        fetchUsers();
    }, [isEditModalOpen, userToEdit?._id]);

    if (!isEditModalOpen) return null;

    return (
        <div className="create-user-overlay">
            <div className="create-user-modal">
                <div className="create-user-header">
                    <h2 className="create-user-title">Edit User</h2>
                    <button className="create-user-close" onClick={() => setIsEditModalOpen(false)} title="Close Popup">×</button>
                </div>
                {formError && <p className="form-error">{formError}</p>}
                <form onSubmit={(e) => { e.preventDefault(); updateUser(); }}>
                    <div className="create-user-content">
                        <div className="create-user-group">
                            <label className="create-user-label" htmlFor="edit-username">Username:</label>
                            <input
                                type="text"
                                id="edit-username"
                                className='create-user-input'
                                value={userToEdit?.username || ''}
                                onChange={(e) =>
                                    setUserToEdit({ ...userToEdit, username: e.target.value })
                                }
                            />
                        </div>

                        <div className="create-user-group">
                            <label className="create-user-label" htmlFor="edit-role">Role:</label>
                            <select
                                id="edit-role"
                                className={userToEdit?.role === "" ? `create-user-select def-colour` : `create-user-select`}
                                value={userToEdit?.role || ''}
                                onChange={(e) =>
                                    setUserToEdit({ ...userToEdit, role: e.target.value })
                                }
                            >
                                <option value="" className="def-colour">Select Role</option>
                                {isAdmin(current) && <option value="admin" className="norm-colour">Admin</option>}
                                {isAdmin(current) && <option value="standarduser" className="norm-colour">Standard User</option>}
                            </select>
                        </div>

                        <div className="create-user-group">
                            <label className="create-user-label" htmlFor="edit-password">Password:</label>
                            <input
                                type="password"
                                id="edit-password"
                                className='create-user-input'
                                placeholder="Leave blank to keep current password"
                                onChange={(e) =>
                                    setUserToEdit({
                                        ...userToEdit,
                                        password: e.target.value === "" ? "" : e.target.value
                                    })
                                }
                            />
                        </div>

                        <div className="create-user-group">
                            <label className="create-user-label" htmlFor="department">Department</label>

                            <div className="uc-info-popup-page-select-container">
                                <select
                                    id="department"
                                    className={userToEdit.department === "" ? `create-user-select def-colour` : `create-user-select`}
                                    value={userToEdit.department}
                                    onChange={(e) => setUserToEdit({ ...userToEdit, department: e.target.value })}
                                >
                                    <option value="" className="def-colour">Select Department</option>
                                    {departments.map((department) => (
                                        <option key={department._id} value={department.department} className="norm-colour">
                                            {department.department}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="create-user-group">
                            <label className="create-user-label" htmlFor="reportingTo">Reporting To</label>

                            <div className="uc-info-popup-page-select-container">
                                <select
                                    id="reportingTo"
                                    className={userToEdit.reportingTo === null ? `create-user-select def-colour` : `create-user-select`}
                                    value={userToEdit.reportingTo}
                                    onChange={(e) => setUserToEdit({ ...userToEdit, reportingTo: e.target.value })}
                                >
                                    <option value="" className="def-colour">Select Reporting To</option>
                                    {users.map((user) => (
                                        <option key={user._id} value={user._id} className="norm-colour">
                                            {user.username}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="create-user-group">
                            <label className="create-user-label" htmlFor="designation">Designation</label>

                            <div className="uc-info-popup-page-select-container">
                                <select
                                    id="designation"
                                    className={userToEdit.designation === "" ? `create-user-select def-colour` : `create-user-select`}
                                    value={userToEdit.designation}
                                    onChange={(e) => setUserToEdit({ ...userToEdit, designation: e.target.value })}
                                >
                                    <option value="" className="def-colour">Select Designation</option>
                                    {DESIGNATIONS.map((designation, index) => (
                                        <option key={index} value={designation} className="norm-colour">
                                            {designation}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="create-user-buttons">
                        <button type="submit" className="create-user-button">Update User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
