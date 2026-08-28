import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

// Single-call endpoint (see router.get('/asset-table-options', ...) in
// getUploadValues.mjs, mounted the same way as WorkOrderTable.jsx's
// /api/valuesUpload/workOrderTypes) that returns the whole
// assetType -> assetModel -> assetNumber (-> mainArea/subArea) tree in one
// response:
//   {
//     assetTypes: [
//       { value: "Motor", models: [ { value: "ABC-123", numbers: [ { value: "MTR-001", mainArea, subArea }, ... ] }, ... ] },
//       ...
//     ]
//   }
// Fetched once on mount and kept in state - no more round trips per level.
const GET_ASSET_TABLE_URL = `${process.env.REACT_APP_URL}/api/valuesUpload/asset-table-options`;

// ---------------------------------------------------------------------------
// Field behaviour matrix
//
// Which of Asset Type / Asset Model / Asset Number are enabled, and whether
// changes to an enabled field are actually written back to formData, depends
// on:
//   1) the Work Order Basis - specifically whether it's Asset Based,
//      Area Based, or something else (including nothing selected yet)
//   2) which of the three places this box is being rendered in:
//        "create"     - FTSCreatePageTemplate (the template creator)
//        "template"   - TemplatePreview / TemplatePreviewContent (preview)
//        "assignment" - WorkOrderAssignment (the allocator, via
//                        TemplatePreviewContent)
//
// Asset Based:
//   create      -> Type/Model editable + commit, Number disabled
//   template    -> Type/Model disabled,           Number enabled, no commit
//   assignment  -> Type/Model disabled,            Number enabled + commit
//
// Area Based:
//   create      -> all three disabled
//   template    -> all three enabled, no commit
//   assignment  -> all three enabled, no commit
//
// Anything else (Department Based, Management Based, or no basis chosen
// yet) - Asset Information isn't tied to that basis at all, so it behaves
// like a normal field: editable + commits on create/assignment, and (as
// with every other box) never commits on the preview page.
// ---------------------------------------------------------------------------
const getFieldControl = (fieldKey, workOrderBasisNormalized, viewMode) => {
    const isAssetBased = workOrderBasisNormalized === "assetbased";
    const isAreaBased = workOrderBasisNormalized === "sitearea";

    if (isAssetBased) {
        if (fieldKey === "assetNumber") {
            if (viewMode === "create") return { disabled: true, commit: true };
            if (viewMode === "template") return { disabled: false, commit: false };
            return { disabled: false, commit: true }; // assignment
        }
        // assetType / assetModel
        if (viewMode === "create") return { disabled: false, commit: true };
        return { disabled: true, commit: true }; // template or assignment
    }

    if (isAreaBased) {
        if (viewMode === "create") return { disabled: true, commit: true };
        return { disabled: false, commit: false }; // template or assignment
    }

    // No basis selected yet, or a basis unrelated to Asset Information
    // (e.g. Department/Management Based) - treat it as a normal field.
    if (viewMode === "template") return { disabled: false, commit: false };
    return { disabled: false, commit: true }; // create or assignment
};

const AssetInfoBox = ({
    collapsible = false,
    formData,
    setFormData,
    error,
    setErrors,
    readOnly = false,
    noOptions = false,
    // "create" | "template" | "assignment" - see matrix above.
    // templateView is kept for backwards compatibility: if viewMode isn't
    // explicitly passed, templateView=true maps to "template".
    viewMode,
    templateView = false,
    templateEditable = true,
    workOrderBasis
}) => {
    const isViewable = viewMode === "template" || viewMode === "assignment";
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;
    // Full tree, fetched once and kept in state for the life of the page -
    // see the trade-off note above GET_ASSET_TABLE_URL / on the backend
    // route: this trades a bit of client memory for not re-hitting the
    // server every time the user touches a dropdown.
    const [assetTree, setAssetTree] = useState([]);
    const [loadingAssetTree, setLoadingAssetTree] = useState(true);

    const resolvedViewMode = viewMode || (templateView ? "template" : "create");
    const normalizedBasis = String(workOrderBasis || "").toLowerCase();

    // Fetch the whole asset table tree once on mount, same fetch-on-mount
    // pattern WorkOrderTable.jsx uses for its Work Order Type options.
    // /asset-table-options sits behind verifyToken, so this needs a Bearer
    // token - re-runs if `token` shows up after this box first mounts
    // (e.g. auth finishes loading a tick after the component does).
    useEffect(() => {
        let isMounted = true;
        const authToken = localStorage.getItem("token");

        if (!authToken) {
            // Nothing to auth with yet - don't fire the request (it'll just
            // 401), leave the dropdowns showing "Loading..." until a token
            // becomes available and this effect re-runs.
            return () => {
                isMounted = false;
            };
        }

        const fetchAssetTree = async () => {
            try {
                setLoadingAssetTree(true);
                const res = await fetch(GET_ASSET_TABLE_URL, {
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                });

                if (!res.ok) {
                    throw new Error(`Request failed with status ${res.status}`);
                }

                const data = await res.json();

                if (isMounted) {
                    setAssetTree(Array.isArray(data.assetTypes) ? data.assetTypes : []);
                }
            } catch (err) {
                console.error("Error fetching asset table options:", err);
            } finally {
                if (isMounted) setLoadingAssetTree(false);
            }
        };

        fetchAssetTree();

        return () => {
            isMounted = false;
        };
    }, []);

    // Case-insensitive lookups into the tree for the currently selected
    // type/model, so Asset Model only populates once a type is chosen, and
    // Asset Number only populates once both type and model are chosen.
    const selectedTypeNode = assetTree.find(
        t => t.value.toLowerCase() === String(formData.assetType || "").toLowerCase()
    );
    const selectedModelNode = selectedTypeNode?.models.find(
        m => m.value.toLowerCase() === String(formData.assetModel || "").toLowerCase()
    );

    const assetTypeOptions = assetTree.map(t => t.value);
    const assetModelOptions = selectedTypeNode ? selectedTypeNode.models.map(m => m.value) : [];
    const assetNumberOptions = selectedModelNode ? selectedModelNode.numbers : []; // [{ value, mainArea, subArea }]

    const hasAssetType = Boolean(formData.assetType);
    const hasAssetModel = Boolean(formData.assetModel);

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    const clearErrorOnFocus = () => {
        if (error) {
            setErrors(prev => ({ ...prev, assetDetails: false }));
        }
    };

    const assetTypeControl = getFieldControl("assetType", normalizedBasis, resolvedViewMode);
    const assetModelControl = getFieldControl("assetModel", normalizedBasis, resolvedViewMode);
    const assetNumberControl = getFieldControl("assetNumber", normalizedBasis, resolvedViewMode);

    // Changing a field invalidates whatever was picked below it in the
    // Type -> Model -> Number -> Area chain, so those get cleared out too.
    const handleAssetTypeChange = (value) => {
        if (!assetTypeControl.commit) return;
        setFormData(prev => ({
            ...prev,
            assetType: value,
            assetModel: "",
            assetNumber: "",
            mainArea: "",
            subArea: ""
        }));
    };

    const handleAssetModelChange = (value) => {
        if (!assetModelControl.commit) return;
        setFormData(prev => ({
            ...prev,
            assetModel: value,
            assetNumber: "",
            mainArea: "",
            subArea: ""
        }));
    };

    // Asset Number is the leaf of the chain - selecting one also pulls its
    // linked Main/Sub Area straight into formData (same "derive on select"
    // pattern WorkOrderTable.jsx uses for its type -> description lookup).
    const handleAssetNumberChange = (value) => {
        if (!assetNumberControl.commit) return;
        const match = assetNumberOptions.find(n => n.value === value);
        setFormData(prev => ({
            ...prev,
            assetNumber: value,
            mainArea: match ? match.mainArea : "",
            subArea: match ? match.subArea : ""
        }));
    };

    return (
        <div className="input-row">
            <div className={`input-box-ref ${error ? 'error-create' : ''}`} style={{ marginTop: "10px" }}>
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
                                    {viewMode === "create" && (<span className="required-field" title="Required"> *</span>)}
                                </th>
                                <td>
                                    <div className="jra-info-popup-page-select-container">
                                        <select
                                            className="table-control font-fam remove-default-styling"
                                            value={formData.assetType || ""}
                                            onChange={e => handleAssetTypeChange(e.target.value)}
                                            onFocus={clearErrorOnFocus}
                                            disabled={readOnly || loadingAssetTree || assetTypeControl.disabled}
                                            style={{ fontSize: "14px", height: "40px", padding: "10px" }}
                                        >
                                            <option value="">
                                                {loadingAssetTree ? "Loading..." : "Select Asset Type"}
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
                                    {viewMode === "create" && (<span className="required-field" title="Required"> *</span>)}
                                </th>
                                <td>
                                    <div className="jra-info-popup-page-select-container">
                                        <select
                                            className="table-control font-fam remove-default-styling"
                                            value={formData.assetModel || ""}
                                            onChange={e => handleAssetModelChange(e.target.value)}
                                            onFocus={clearErrorOnFocus}
                                            disabled={readOnly || loadingAssetTree || assetModelControl.disabled || !hasAssetType}
                                            style={{ fontSize: "14px", height: "40px", padding: "10px" }}
                                        >
                                            <option value="">
                                                {loadingAssetTree
                                                    ? "Loading..."
                                                    : !hasAssetType
                                                        ? "Select Asset Type first"
                                                        : "Select Asset Model"}
                                            </option>
                                            {!noOptions && assetModelOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" className="jra-info-table-header">
                                    Asset Number
                                    {isViewable && (<span className="required-field" title="Required"> *</span>)}
                                </th>
                                <td>
                                    <div className="jra-info-popup-page-select-container">
                                        <select
                                            className="table-control font-fam remove-default-styling"
                                            value={formData.assetNumber || ""}
                                            onChange={e => handleAssetNumberChange(e.target.value)}
                                            onFocus={clearErrorOnFocus}
                                            disabled={readOnly || loadingAssetTree || assetNumberControl.disabled || !hasAssetType || !hasAssetModel}
                                            style={{ fontSize: "14px", height: "40px", padding: "10px" }}
                                        >
                                            <option value="">
                                                {loadingAssetTree
                                                    ? "Loading..."
                                                    : !hasAssetType || !hasAssetModel
                                                        ? "Select Asset Type and Model first"
                                                        : "Select Asset Number"}
                                            </option>
                                            {!noOptions && assetNumberOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.value}</option>
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

export default AssetInfoBox;