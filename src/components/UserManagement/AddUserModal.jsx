import React, { useEffect, useState } from "react";
import "./CreateUserModal.css";

const AddUserModal = ({ isModalOpen, closeModal, createUser, formError, newUser, setNewUser, isAdmin, current }) => {
    const closeModalAdd = () => {
        setNewUser({ username: "", email: "", role: "", reportingTo: "", department: "", designation: "" });
        closeModal();
    };

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


    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`, {
                headers: {

                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();

            const sortedUsers = data.users.sort((a, b) => {
                return a.username.localeCompare(b.username);
            });

            setUsers(sortedUsers);
        } catch (error) {
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetchUsers();
    }, []);

    if (!isModalOpen) return null;

    return (
        <div className="create-user-overlay">
            <div className="create-user-modal">
                <div className="create-user-header">
                    <h2 className="create-user-title">Add New User</h2>
                    <button className="create-user-close" onClick={closeModalAdd} title="Close Popup">×</button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); createUser(); }}>
                    <div className="create-user-content">
                        <div className="create-user-group">
                            <label className="create-user-label" htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                className="create-user-input"
                                placeholder="Insert Username (e.g., Jane Doe)"
                                value={newUser.username}
                                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            />
                        </div>

                        <div className="create-user-group">
                            <label className="create-user-label" htmlFor="email">User Email</label>
                            <input
                                type="email"
                                id="email"
                                className="create-user-input"
                                placeholder="Insert User Email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            />
                        </div>

                        <div className="create-user-group">
                            <label className="create-user-label" htmlFor="role">Role</label>

                            <div className="uc-info-popup-page-select-container">
                                <select
                                    id="role"
                                    className={newUser.role === "" ? `create-user-select def-colour` : `create-user-select`}
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="" className="def-colour">Select Role</option>
                                    {isAdmin(current) && <option value="admin" className="norm-colour">Admin</option>}
                                    <option value="standarduser" className="norm-colour">Standard User</option>
                                </select>
                            </div>
                        </div>

                        <div className="create-user-group">
                            <label className="create-user-label" htmlFor="department">Department</label>

                            <div className="uc-info-popup-page-select-container">
                                <select
                                    id="department"
                                    className={newUser.department === "" ? `create-user-select def-colour` : `create-user-select`}
                                    value={newUser.department || ""}
                                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
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
                                    className={newUser.reportingTo === "" ? `create-user-select def-colour` : `create-user-select`}
                                    value={newUser.reportingTo}
                                    onChange={(e) => setNewUser({ ...newUser, reportingTo: e.target.value })}
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
                                    className={newUser.designation === "" ? `create-user-select def-colour` : `create-user-select`}
                                    value={newUser.designation}
                                    onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
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
                        <button type="submit" className="create-user-button">Add User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
