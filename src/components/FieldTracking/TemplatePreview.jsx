import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import TemplateNumberField from "./TemplateNumberField";
import RevisionNumberField from "./RevisionNumberField";
import ActivityNamesField from "./ActivityNamesField";
import SubInformationField from "./SubInformationField";
import ManagementInformationField from "./ManagementInformationField";
import AssetInfoBox from "./AssetInfoBox";
import SiteAreaInfoBox from "./SiteAreaInfoBox";
import DepartmentInfoBox from "./DepartmentInfoBox";
import ManagementInfoBox from "./ManagementInfoBox";
import SupportingDocumentTableFTS from "./SupportingDocumentTableFTS";
import ActionFieldsInfoBox from "./ActionFieldsInfoBox";
import "./WorkOrderActionFields.css";
import "./TemplatePreview.css";

// NOTE: these must match the exact values that WorkOrderBasesSelection
// writes into formData.workOrderBases. Adjust the strings below if that
// dropdown/component uses different casing or wording.
const WORK_ORDER_BASES = {
    ASSET: "assetBased",
    SITE: "siteArea",
    DEPARTMENT: "department",
    MANAGEMENT: "management",
};

const noop = () => { };

// Full-screen popup shown from the "Template Preview" button. It is a
// deliberately cut-down version of the create page: it reuses the exact
// same field components/props so behaviour stays in sync, but only renders
// the subset of fields called out below. Everything else from the create
// page is left out entirely.
const TemplatePreview = ({
    formData,
    setFormData,
    errors = {},
    setErrors = () => { },
    readOnly = false,
    onClose,
}) => {
    const handleWorkOrderSubInformationChange = (value) => {
        setFormData((prev) => ({ ...prev, workOrderSubInformation: value }));
    };

    const handleWorkOrderRACIInformationChange = (value) => {
        setFormData((prev) => ({ ...prev, workOrderRACIInformation: value }));
    };

    // Only the info box matching the selected Work Order Basis stays
    // editable - the other three are locked regardless of the page's
    // overall readOnly state.
    const isAssetEditable = formData.workOrderBases === WORK_ORDER_BASES.ASSET;
    const isSiteEditable = formData.workOrderBases === WORK_ORDER_BASES.SITE;
    const isDepartmentEditable = formData.workOrderBases === WORK_ORDER_BASES.DEPARTMENT;
    const isManagementEditable = formData.workOrderBases === WORK_ORDER_BASES.MANAGEMENT;

    return (
        <div className="template-preview-overlay">
            <div className="template-preview-panel">
                <div className="template-preview-header">
                    <h2 className="font-fam-labels">Template Preview</h2>
                    <FontAwesomeIcon
                        icon={faTimes}
                        className="template-preview-close"
                        onClick={onClose}
                        title="Close"
                    />
                </div>

                <div className="scrollable-box-preview template-preview-body">
                    {/* 1. Template Title */}
                    <div className="input-row">
                        <div className="input-box-title">
                            <h3 className="font-fam-labels">Template Title</h3>
                            <textarea
                                spellCheck="false"
                                className="aim-textarea-risk-create-textarea-nopads font-fam aim-textarea-text"
                                value={formData.templateTitle || ""}
                                readOnly
                                placeholder="Auto-generated template title"
                                style={{ minHeight: 0 }}
                            />
                        </div>
                    </div>

                    {/* 2. Template Number, Revision Number */}
                    <div className="input-row-risk-create">
                        <TemplateNumberField
                            value={formData.templateNumber}
                            workOrderType={formData.workOrderType}
                            department={formData.department}
                            mainArea={formData.mainArea}
                            onChange={noop}
                            readOnly={true}
                            showUI={true}
                        />
                        <RevisionNumberField
                            onChange={noop}
                            value={formData.revisionNumber}
                            readOnly={true}
                            showUI={true}
                        />
                    </div>

                    {/* 3. Activity Name */}
                    <ActivityNamesField
                        value={formData.activityName}
                        activityVerb={formData.activityVerb}
                        taskName={formData.taskName}
                        onChange={noop}
                        readOnly={true}
                        showUI={true}
                    />

                    {/* 4. Sub Information */}
                    <SubInformationField
                        value={formData.workOrderSubInformation}
                        site={formData.site}
                        mainArea={formData.mainArea}
                        subArea={formData.subArea}
                        department={formData.department}
                        onChange={handleWorkOrderSubInformationChange}
                        readOnly={readOnly}
                    />

                    {/* 5. Work Order (RACI) Management Information */}
                    <ManagementInformationField
                        value={formData.workOrderRACIInformation}
                        accountableLevel={formData.accountableLevel}
                        personInCharge={formData.personInCharge}
                        minTeamExecutors={formData.minTeamExecutors}
                        onChange={handleWorkOrderRACIInformationChange}
                        readOnly={readOnly}
                    />

                    {/* 6. Asset, Site, Department and Management info -
                        only the one matching the selected Work Order Basis
                        is editable, the rest are locked. */}
                    <AssetInfoBox
                        collapsible={true}
                        formData={formData}
                        setFormData={setFormData}
                        error={errors.assetDetails}
                        setErrors={setErrors}
                        readOnly={readOnly || !isAssetEditable}
                        noOptions={false}
                    />

                    <SiteAreaInfoBox
                        collapsible={true}
                        formData={formData}
                        setFormData={setFormData}
                        error={errors.siteAreaDetails}
                        setErrors={setErrors}
                        readOnly={readOnly || !isSiteEditable}
                        noOptions={false}
                    />

                    <DepartmentInfoBox
                        collapsible={true}
                        formData={formData}
                        setFormData={setFormData}
                        error={errors.departmentDetails}
                        setErrors={setErrors}
                        readOnly={readOnly || !isDepartmentEditable}
                        noOptions={false}
                    />

                    <ManagementInfoBox
                        collapsible={true}
                        formData={formData}
                        setFormData={setFormData}
                        error={errors.managementDetails}
                        setErrors={setErrors}
                        readOnly={readOnly || !isManagementEditable}
                        noOptions={false}
                    />

                    {/* 7. Supporting Info - view/download only, never editable here */}
                    <SupportingDocumentTableFTS
                        collapsible={true}
                        formData={formData}
                        setFormData={setFormData}
                        readOnly={true}
                    />

                    {/* 8. Info Gathering (Work Order Action Fields) - shown the
                        same way the site/area info is: the title the creator
                        gave each field, paired with the control that matches
                        its type. */}
                    <ActionFieldsInfoBox
                        collapsible={true}
                        formData={formData}
                        setFormData={setFormData}
                        readOnly={readOnly}
                    />
                </div>
            </div>
        </div>
    );
};

export default TemplatePreview;