import React, { useEffect, useState } from "react";
import "./AddDepartmentModal.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from 'react-toastify';
import {
    faBuilding,
    faBriefcase,
    faUserMd,
    faGraduationCap,
    faGavel,
    faMicrochip,
    faChartLine,
    faFlask,
    faCog,
    faPencilRuler,
    faUsers,
    faBalanceScale,
    faPalette,
    faGlobe,
    faBook,
    faHeadset,
    faHandsHelping,
    faDollarSign,
    faServer,
    faUniversity
} from "@fortawesome/free-solid-svg-icons";

const AddDepartmentModal = ({ show, onClose }) => {
    const [departmentName, setDepartmentName] = useState("");
    const [members, setMembers] = useState([]);
    const [newMember, setNewMember] = useState("");
    const [departmentHead, setDepartmentHead] = useState("");
    const [users, setUsers] = useState([]);
    const [icon, setIcon] = useState("");

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`, {
                headers: {
                    //'Authorization': `Bearer ${token}`
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
            console.error("Error fetching depteviations:", error)
        }
    };

    const addMember = () => {
        if (newMember && !members.includes(newMember)) {
            setMembers([...members, newMember]);
            setNewMember("");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    if (!show) return null;

    const iconMap = {
        faSearch: faSearch, // General Office / Administration
        faBriefcase: faBriefcase, // Business / HR
        faUserMd: faUserMd, // Medical / Healthcare
        faGraduationCap: faGraduationCap, // Education / Training
        faGavel: faGavel, // Legal
        faMicrochip: faMicrochip, // Technology / IT
        faChartLine: faChartLine, // Marketing / Sales
        faFlask: faFlask, // Research / Science
        faCog: faCog, // Engineering / Manufacturing
        faPencilRuler: faPencilRuler, // Design / Architecture
        faUsers: faUsers, // Human Resources
        faBalanceScale: faBalanceScale, // Law / Compliance
        faPalette: faPalette, // Arts / Creative
        faGlobe: faGlobe, // International / Public Relations
        faBook: faBook, // Library / Documentation
        faHeadset: faHeadset, // Customer Support
        faHandsHelping: faHandsHelping, // Social Services / NGO
        faDollarSign: faDollarSign, // Finance / Accounting
        faServer: faServer, // Data / Network Management
        faUniversity: faUniversity // Academic Institution
    };

    const AddDept = async () => {
        if (!departmentName || !icon) {
            toast.error("Ensure all fields are entered.", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })
            return;
        }

        const dataToStore = {
            icon: icon,
            department: departmentName,
            departmentHead: departmentHead
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore)
            });
            if (!response.ok) throw new Error('Failed to create department');

            toast.success("Department Created.", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })

            setDepartmentName("");
            setIcon("");
            setDepartmentHead("");
            onClose();
        } catch (error) {
            toast.error("Department could not be created.", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })
        }
    };

    return (
        <div className="create-dept-overlay">
            <div className="create-dept-modal">
                <div className="create-dept-header">
                    <h2 className="create-dept-title">Create Department</h2>
                    <button className="create-dept-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <form className="create-dept-form" onSubmit={(e) => { e.preventDefault(); }}>
                    <div className="create-dept-body">
                        <div className="create-dept-group">
                            <label className="create-dept-label" htmlFor="username">Department Name</label>
                            <input
                                type="text"
                                id="username"
                                className="create-dept-input"
                                placeholder="Insert Department Name (e.g., Marketing)"
                                value={departmentName}
                                onChange={(e) => setDepartmentName(e.target.value)}
                            />
                        </div>
                        <div className="create-dept-group">
                            <label className="create-dept-label" htmlFor="username">Department Head</label>

                            <div className="dept-info-popup-page-select-container">
                                <select
                                    className={departmentHead === "" ? `create-dept-select def-colour` : `create-dept-select`}
                                    id="deptHead"
                                    value={departmentHead}
                                    onChange={(e) => setDepartmentHead(e.target.value)}
                                >
                                    <option value="" className="def-colour">Select Department Head</option>
                                    {users
                                        .map((user, index) => (
                                            <option key={index} value={user._id}>
                                                {user.username}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        <div className="create-dept-group" style={{ marginBottom: "5px" }}>
                            <label className="create-dept-label" htmlFor="role">Department Icon</label>

                            <div className="dept-info-popup-page-select-container">
                                <select
                                    className={icon === "" ? `create-dept-select def-colour` : `create-dept-select`}
                                    id="role"
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                >
                                    <option value="" className="def-colour">Select Icon</option>
                                    {Object.keys(iconMap).map((key) => (
                                        <option key={key} value={key}>
                                            {key.replace("fa", "").replace(/([A-Z])/g, " $1").trim()} {/* Format icon name */}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="dept-icon">
                                <div className="dept-icon-style">
                                    <FontAwesomeIcon icon={iconMap[icon] || faBuilding} alt="Logo" className="fa-icon" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="create-dept-buttons">
                        <button onClick={AddDept} className="create-dept-button">Create Department</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDepartmentModal;