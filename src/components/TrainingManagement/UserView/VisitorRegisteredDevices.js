import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faCaretLeft,
    faCaretRight,
    faTrash,
    faEdit,
    faCirclePlus,
    faSort,
    faDownload
} from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import "./UserHomePageTMS.css";
import TopBar from "../../Notifications/TopBar";
import { getCurrentUser } from "../../../utils/auth";
import ModifyVisitorDevicePopup from "../../VisitorManagement/ModifyVisitorDevicePopup";
import { ToastContainer, toast } from "react-toastify";
import AddVisitorDevicePopup from "../../VisitorManagement/AddVisitorDevicePopup";
import DeleteDeviceVisitorView from "./DeleteDeviceVisitorView";

const VisitorRegisteredDevices = () => {
    const access = getCurrentUser();
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const [modifyDevice, setModifyDevice] = useState(null);
    const [addDeviceContext, setAddDeviceContext] = useState(null);
    const [deleteContext, setDeleteContext] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const downloadTemplateForm = () => {
        const link = document.createElement('a');
        link.href = `${process.env.PUBLIC_URL}/TAU5 CH - Visitor Entry Form V0.1 (11.12.2025).pdf`; // Adjust path as needed
        link.setAttribute('download', 'Visitor Entry Form V0.1 (11.12.2025).pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [token, setToken] = useState('');
    const [userID, setUserID] = useState('');

    const [devices, setDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(false);

    const navigate = useNavigate();

    const fetchUser = async () => {
        const route = `/api/visitors/visitorInfo/`;
        try {
            const visitorToken = sessionStorage.getItem("visitorToken");
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    'Authorization': `Bearer ${visitorToken}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch visitor info');
            }
            const data = await response.json();
            setUser(data.user);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        const storedToken = sessionStorage.getItem('visitorToken');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, [navigate]);

    const fetchDevices = async (visitorId) => {
        if (!visitorId) return;
        setLoadingDevices(true);
        try {
            const route = `/api/visitorDevices/getDevices/${visitorId}/devices`;
            const visitorToken = sessionStorage.getItem("visitorToken");

            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    'Authorization': `Bearer ${visitorToken}`
                }
            });
            if (!response.ok) {
                console.error('Failed to fetch devices, status:', response.status);
                throw new Error('Failed to fetch devices');
            }
            const data = await response.json();
            setDevices(data.devices || []);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error fetching devices');
        } finally {
            setLoadingDevices(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        if (userID) {
            fetchDevices(userID);
        }
    }, [userID]);

    const getVisitorName = () => {
        return user?.name;
    };

    const getVisitorInitials = () => {
        const f = user?.name?.[0]?.toUpperCase() ?? "";
        const l = user?.surname?.[0]?.toUpperCase() ?? "";
        return (f + l) || "??";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const displayDevices = devices.length > 0
        ? devices
        : [{
            _id: "placeholder",
            deviceType: "",
            deviceName: "",
            serialNumber: "",
            arrivalDate: null,
            exitDate: null
        }];

    const handleEditDevice = (device, index) => {
        const isPlaceholder = device._id === "placeholder";

        const baseDevice = isPlaceholder
            ? {
                _id: null,
                deviceType: "",
                deviceName: "",
                serialNumber: "",
                arrivalDate: null,
                exitDate: null,
            }
            : device;

        setModifyDevice({
            mode: isPlaceholder ? "create" : "edit",
            visitorId: userID,
            deviceIndex: index,
            device: baseDevice,
        });
    };

    const handleAddNewDeviceAfter = (device, index) => {
        setAddDeviceContext({
            visitorId: userID,
            insertAfterIndex: index
        });
    };

    const handleDeleteDevice = (device, index) => {
        const isPlaceholder = device._id === "placeholder";
        if (isPlaceholder || !device._id) return; // nothing to delete

        setDeleteContext({
            deviceId: device._id,
            name: device.deviceName || device.deviceType || device.serialNumber || "Device"
        });
    };

    const confirmDeleteDevice = async () => {
        if (!deleteContext || !deleteContext.deviceId || !userID) return;

        setDeleting(true);
        try {
            const token = sessionStorage.getItem("visitorToken");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/visitorDevices/deleteDevicePermanently/${userID}/${deleteContext.deviceId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            const result = await response.json();

            if (response.ok && result.ok) {
                toast.success("Device deleted successfully", {
                    autoClose: 2000,
                    closeButton: false
                });

                // refresh list from backend so table matches DB
                await fetchDevices(userID);
                setDeleteContext(null);
            } else {
                toast.error(result.message || "Failed to delete device", {
                    autoClose: 2000,
                    closeButton: false
                });
            }
        } catch (err) {
            console.error("Error deleting device:", err);
            toast.error("An error occurred while deleting the device", {
                autoClose: 2000,
                closeButton: false
            });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="course-home-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div
                        className="sidebar-toggle-icon"
                        title="Hide Sidebar"
                        onClick={() => setIsSidebarVisible(false)}
                    >
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>

                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" title="Home" />
                        <p className="logo-text-um">Training Management</p>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img
                            src={`${process.env.PUBLIC_URL}/visitorInductionMainIcon2.svg`}
                            alt="Control Attributes"
                            className="icon-risk-rm"
                        />
                        <p className="logo-text-dm-fi">Visitor Induction</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div
                        className="sidebar-toggle-icon"
                        title="Show Sidebar"
                        onClick={() => setIsSidebarVisible(true)}
                    >
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}

            <div className="main-box-course-home-info">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon
                            onClick={() => navigate(-1)}
                            icon={faArrowLeft}
                            title="Back"
                            style={{ cursor: "pointer" }}
                        />
                    </div>

                    <div className="spacer"></div>

                    <TopBar visitor={true} />
                </div>

                <div className="course-home-info-wrapper">
                    {/* Welcome header (avatar + name) */}
                    <div className="course-home-info-topbar">
                        <div className="course-home-info-avatar">{getVisitorInitials()}</div>
                        <div className="course-home-info-welcome">
                            Welcome Back, {getVisitorName()}!
                        </div>
                    </div>

                    <div className="course-home-info-card-new">
                        <div className="flameproof-table-header-label-wrapper">
                            <label className="risk-control-label empty-placeholder">&nbsp;</label>
                            <FontAwesomeIcon
                                icon={faDownload}
                                onClick={downloadTemplateForm}
                                title="Download Visitor Form"
                                className={"top-right-button-control-att"}
                            />
                        </div>
                        <div className="table-container-file-flameproof-all-assets">
                            <table className="course-home-info-table">
                                <thead className="course-home-info-head">
                                    <tr className="course-home-info-tr">
                                        <th className="course-home-info-num" style={{ width: "5%" }}>Nr</th>
                                        <th className="course-home-info-code" style={{ width: "20%" }}>Device Type</th>
                                        <th className="course-home-info-name" style={{ width: "15%" }}>Device Name</th>
                                        <th className="course-home-info-progress" style={{ width: "20%" }}>Serial Number</th>
                                        <th className="course-home-info-name" style={{ width: "15%" }}>Arrival Date</th>
                                        <th className="course-home-info-access" style={{ width: "15%" }}>Exit Date</th>
                                        <th className="course-home-info-access" style={{ width: "10%" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayDevices.map((device, index) => {
                                        const isPlaceholder = device._id === "placeholder";
                                        const hasData =
                                            !!(device.deviceType ||
                                                device.deviceName ||
                                                device.serialNumber ||
                                                device.arrivalDate ||
                                                device.exitDate);

                                        return (
                                            <tr
                                                key={device._id || index}
                                                className="course-home-info-tr"
                                                style={{ cursor: "default" }}
                                            >
                                                <td
                                                    style={{
                                                        fontSize: "14px",
                                                        textAlign: "center",
                                                        fontFamily: "Arial"
                                                    }}
                                                >
                                                    {index + 1}
                                                </td>
                                                <td
                                                    style={{
                                                        fontSize: "14px",
                                                        textAlign: "left",
                                                        fontFamily: "Arial",
                                                        position: "relative"
                                                    }}
                                                >
                                                    {device.deviceType}
                                                </td>
                                                <td
                                                    style={{
                                                        fontSize: "14px",
                                                        textAlign: "center",
                                                        fontFamily: "Arial"
                                                    }}
                                                >
                                                    {device.deviceName}
                                                </td>
                                                <td
                                                    style={{
                                                        fontSize: "14px",
                                                        textAlign: "center",
                                                        fontFamily: "Arial"
                                                    }}
                                                >
                                                    {device.serialNumber}
                                                </td>
                                                <td
                                                    style={{
                                                        fontSize: "14px",
                                                        textAlign: "center",
                                                        fontFamily: "Arial"
                                                    }}
                                                >
                                                    {device.arrivalDate ? formatDate(device.arrivalDate) : "N/A"}
                                                </td>
                                                <td
                                                    style={{
                                                        fontSize: "14px",
                                                        textAlign: "center",
                                                        fontFamily: "Arial"
                                                    }}
                                                >
                                                    {device.exitDate ? formatDate(device.exitDate) : "N/A"}
                                                </td>
                                                <td
                                                    style={{
                                                        fontSize: "14px",
                                                        textAlign: "center",
                                                        fontFamily: "Arial"
                                                    }}
                                                >
                                                    <button
                                                        className={"flame-delete-button-fi col-but-res"}
                                                        style={{ width: "33%" }}
                                                        onClick={() => handleEditDevice(device, index)}
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} title="Edit Device" />
                                                    </button>

                                                    {(!isPlaceholder || hasData) && (
                                                        <button
                                                            className={"flame-delete-button-fi col-but"}
                                                            style={{ width: "33%" }}
                                                            onClick={() => handleDeleteDevice(device, index)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} title="Delete Device" />
                                                        </button>
                                                    )}

                                                    {(!isPlaceholder || hasData) && (
                                                        <button
                                                            className={"flame-delete-button-fi col-but-res"}
                                                            style={{ width: "33%" }}
                                                            onClick={() => handleAddNewDeviceAfter(device, index)}
                                                        >
                                                            <FontAwesomeIcon icon={faCirclePlus} title="Add Another Device" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>

            {modifyDevice && (<ModifyVisitorDevicePopup data={modifyDevice} onClose={() => setModifyDevice(null)} refresh={() => fetchDevices(userID)} />)}
            {addDeviceContext && (
                <AddVisitorDevicePopup
                    visitorId={addDeviceContext.visitorId}
                    insertAfterIndex={addDeviceContext.insertAfterIndex}
                    onClose={() => setAddDeviceContext(null)}
                    refresh={() => fetchDevices(userID)}
                />
            )}
            {deleteContext && (
                <DeleteDeviceVisitorView
                    closeModal={() => setDeleteContext(null)}
                    deleteVisitor={confirmDeleteDevice}
                    name={deleteContext.name}
                    loading={deleting}
                />
            )}

            <ToastContainer />
        </div>
    );
};

export default VisitorRegisteredDevices;
