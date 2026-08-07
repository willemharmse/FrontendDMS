import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

// NOTE: base path assumed from flameproofLogic.mjs's route file naming
// (same convention as WorkOrderTable.jsx's /api/valuesUpload/workOrderTypes).
// Confirm/adjust this if flameproofLogic.mjs is mounted under a different
// prefix in your server file.
const GET_ASSET_TYPES_URL = `${process.env.REACT_APP_URL}/api/flameproof/getUploadTypes`;

const AssetInfoBox = ({
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
    const [assetTypeOptions, setAssetTypeOptions] = useState([]);
    const [loadingAssetTypes, setLoadingAssetTypes] = useState(true);

    // Pull the live list of Asset Types from FlameproofAssetTypes via
    // GET /getUploadTypes (router.get('/getUploadTypes', ...) in
    // flameproofLogic.mjs), same fetch-on-mount pattern WorkOrderTable.jsx
    // uses for its Work Order Type options.
    useEffect(() => {
        let isMounted = true;

        const fetchAssetTypes = async () => {
            try {
                setLoadingAssetTypes(true);
                const res = await fetch(GET_ASSET_TYPES_URL);
                const data = await res.json();

                if (isMounted) {
                    const types = Array.isArray(data.assetTypes) ? data.assetTypes : [];
                    // Each doc looks like { _id, type, components }; the
                    // stored assetType on an asset is the `type` string itself.
                    const allTypes = types.map(t => t.type).filter(Boolean);

                    // Keep "Other" out of the alphabetical sort and always
                    // place it last, wherever it happened to be in the source data.
                    const otherTypes = allTypes.filter(t => t.toLowerCase() === "other");
                    const sortedTypes = allTypes
                        .filter(t => t.toLowerCase() !== "other")
                        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
                    setAssetTypeOptions([...sortedTypes, ...otherTypes]);
                }
            } catch (err) {
                console.error("Error fetching asset types:", err);
            } finally {
                if (isMounted) setLoadingAssetTypes(false);
            }
        };

        fetchAssetTypes();

        return () => {
            isMounted = false;
        };
    }, []);

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    const clearErrorOnFocus = () => {
        if (error) {
            setErrors(prev => ({ ...prev, assetDetails: false }));
        }
    };

    const handleAssetTypeChange = (value) => {
        setFormData(prev => ({ ...prev, assetType: value }));
    };

    const handleAssetModelChange = (value) => {
        setFormData(prev => ({ ...prev, assetModel: value }));
    };

    const handleComponentChange = (value) => {
        setFormData(prev => ({ ...prev, component: value }));
    };

    return (
        <div className="input-row">
            <div className={`input-box-ref ${error ? 'error-create' : ''}`}>
                <h3 className="font-fam-labels">Asset Information <span className="required-field">*</span></h3>

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
                                    Asset Type
                                    <span className="required-field" title="Required"> *</span>
                                </th>
                                <td>
                                    <div className="jra-info-popup-page-select-container">
                                        <select
                                            className="table-control font-fam remove-default-styling"
                                            value={formData.assetType || ""}
                                            onChange={e => handleAssetTypeChange(e.target.value)}
                                            onFocus={clearErrorOnFocus}
                                            disabled={readOnly || loadingAssetTypes}
                                            style={{ fontSize: "14px" }}
                                        >
                                            <option value="">
                                                {loadingAssetTypes ? "Loading..." : "Select Asset Type"}
                                            </option>
                                            {!noOptions && assetTypeOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" className="jra-info-table-header">
                                    Asset Model
                                    <span className="required-field" title="Required"> *</span>
                                </th>
                                <td>
                                    <textarea
                                        className="jra-info-popup-page-textarea"
                                        value={formData.assetModel || ""}
                                        placeholder="Insert Asset Model"
                                        onChange={e => handleAssetModelChange(e.target.value)}
                                        onFocus={clearErrorOnFocus}
                                        readOnly={readOnly}
                                        style={{ resize: "none" }}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" className="jra-info-table-header">
                                    Component
                                    <span className="required-field" title="Required"> *</span>
                                </th>
                                <td>
                                    <textarea
                                        className="jra-info-popup-page-textarea"
                                        value={formData.component || ""}
                                        placeholder="Manufacturer - Component Name - Component Model"
                                        onChange={e => handleComponentChange(e.target.value)}
                                        onFocus={clearErrorOnFocus}
                                        readOnly={readOnly}
                                        style={{ resize: "none" }}
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AssetInfoBox;