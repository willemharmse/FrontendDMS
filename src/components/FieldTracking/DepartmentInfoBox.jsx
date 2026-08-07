import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

// Always shown last in the Coded Area dropdown, after the fetched options.
const CODED_AREA_NA_OPTION = "N/A";

const DepartmentInfoBox = ({
    collapsible = false,
    formData,
    setFormData,
    error,
    setErrors,
    readOnly = false,
    noOptions = false
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;
    const [departmentOptions, setDepartmentOptions] = useState([]);
    const [loadingDepartments, setLoadingDepartments] = useState(true);
    const [codedAreaOptions, setCodedAreaOptions] = useState([]);
    const [loadingCodedAreas, setLoadingCodedAreas] = useState(true);

    // Pull the live list of departments from GET /api/department/
    // (same route UploadPopup.jsx uses to build its discipline options),
    // then sort alphabetically same as AssetInfoBox's asset types.
    useEffect(() => {
        let isMounted = true;

        const fetchDepartments = async () => {
            try {
                setLoadingDepartments(true);
                const response = await fetch(`${process.env.REACT_APP_URL}/api/department/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch departments");
                }
                const data = await response.json();

                if (isMounted) {
                    const allDepartments = (data.departments || [])
                        .map(dept => dept.department)
                        .filter(Boolean);

                    // Keep "Other" out of the alphabetical sort and always
                    // place it last, same pattern used for Coded Area's N/A below.
                    const otherDepartments = allDepartments.filter(d => d.toLowerCase() === "other");
                    const sortedDepartments = allDepartments
                        .filter(d => d.toLowerCase() !== "other")
                        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
                    setDepartmentOptions([...sortedDepartments, ...otherDepartments]);
                }
            } catch (err) {
                console.error("Error fetching departments:", err);
            } finally {
                if (isMounted) setLoadingDepartments(false);
            }
        };

        fetchDepartments();

        return () => {
            isMounted = false;
        };
    }, []);

    // Pull Coded Area options from the same values-upload route family as
    // Frequency (GET /api/valuesUpload/<name>), just for "codedAreas" this time.
    // N/A is always appended last, regardless of what the backend returns.
    useEffect(() => {
        let isMounted = true;

        const fetchCodedAreas = async () => {
            try {
                setLoadingCodedAreas(true);
                const response = await fetch(`${process.env.REACT_APP_URL}/api/valuesUpload/codedAreas`);
                if (!response.ok) {
                    throw new Error("Failed to fetch coded areas");
                }
                const data = await response.json();

                if (isMounted) {
                    const areaList = Array.isArray(data.codedAreas) ? data.codedAreas : [];
                    const sortedAreas = areaList
                        .map(area => area.value ?? area.area ?? area)
                        .filter(Boolean)
                        .filter(area => area !== CODED_AREA_NA_OPTION)
                        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
                    setCodedAreaOptions([...sortedAreas, CODED_AREA_NA_OPTION]);
                }
            } catch (err) {
                console.error("Error fetching coded areas:", err);
                if (isMounted) setCodedAreaOptions([CODED_AREA_NA_OPTION]);
            } finally {
                if (isMounted) setLoadingCodedAreas(false);
            }
        };

        fetchCodedAreas();

        return () => {
            isMounted = false;
        };
    }, []);

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    const clearErrorOnFocus = () => {
        if (error) {
            setErrors(prev => ({ ...prev, departmentDetails: false }));
        }
    };

    const handleDepartmentChange = (value) => {
        setFormData(prev => ({ ...prev, department: value }));
    };

    const handleCodedAreaChange = (value) => {
        setFormData(prev => ({ ...prev, codedArea: value }));
    };

    return (
        <div className="input-row">
            <div className={`input-box-ref ${error ? 'error-create' : ''}`}>
                <h3 className="font-fam-labels">Department Information <span className="required-field">*</span></h3>

                {collapsible && (<button
                    className="top-right-button-ibra"
                    title={collapsed ? "Expand Section" : "Collapse Section"}
                    onClick={toggleCollapse}
                    style={{ color: "gray" }}
                    type="button"
                >
                    <FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} />
                </button>)}

                {(!isCollapsed) && (
                    <table className="table-borders-jra-info" style={{ tableLayout: "fixed", width: "100%" }}>
                        <colgroup>
                            <col style={{ width: "25%" }} />
                            <col />
                        </colgroup>
                        <tbody>
                            <tr>
                                <th scope="row" className="jra-info-table-header">
                                    Department
                                    <span className="required-field" title="Required"> *</span>
                                </th>
                                <td>
                                    <div className="jra-info-popup-page-select-container">
                                        <select
                                            className="table-control font-fam remove-default-styling"
                                            value={formData.department || ""}
                                            onChange={e => handleDepartmentChange(e.target.value)}
                                            onFocus={clearErrorOnFocus}
                                            disabled={readOnly || loadingDepartments}
                                            style={{ fontSize: "14px" }}
                                        >
                                            <option value="">
                                                {loadingDepartments ? "Loading..." : "Select Department"}
                                            </option>
                                            {!noOptions && departmentOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" className="jra-info-table-header">
                                    Coded Area
                                    <span className="required-field" title="Required"> *</span>
                                </th>
                                <td>
                                    <div className="jra-info-popup-page-select-container">
                                        <select
                                            className="table-control font-fam remove-default-styling"
                                            value={formData.codedArea || ""}
                                            onChange={e => handleCodedAreaChange(e.target.value)}
                                            onFocus={clearErrorOnFocus}
                                            disabled={readOnly || loadingCodedAreas}
                                            style={{ fontSize: "14px" }}
                                        >
                                            <option value="">
                                                {loadingCodedAreas ? "Loading..." : "Select Coded Area"}
                                            </option>
                                            {!noOptions && codedAreaOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DepartmentInfoBox;