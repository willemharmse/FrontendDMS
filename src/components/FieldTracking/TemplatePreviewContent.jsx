import React from "react";
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
import PPETable from "../CreatePage/PPETable";
import HandToolTable from "../CreatePage/HandToolsTable";
import MaterialsTable from "../CreatePage/MaterialsTable";
import HazardsControlsTableFTS from "./HazardsControlsTableFTS";
import "./WorkOrderActionFields.css";
import "./TemplatePreview.css";
import TemplateTitleField from "./TemplateTitleField";

const noop = () => { };

// Shared body content, reused by both TemplatePreview and
// WorkOrderAssignment. Those two only provide the shell (header +
// close button / footer buttons) - everything field-related lives here
// in one place so content changes only need to be made once.
const TemplatePreviewContent = ({
    formData,
    setFormData,
    errors = {},
    setErrors = () => { },
    readOnly = false,
    // "template" when rendered from TemplatePreview, "assignment" when
    // rendered from WorkOrderAssignment (the allocator view). Drives the
    // per-field enabled/commit behaviour of AssetInfoBox, DepartmentInfoBox,
    // and ManagementInfoBox.
    viewMode = "template",
    // Names of fields that must stay non-interactive regardless of what
    // viewMode/basis would otherwise allow, in the same "field name" or
    // "actionFieldValues.<id>" form each box's own lockedFields prop
    // expects. Set by WorkOrderAssignment to lock down whatever already
    // had a value when the assignment popup opened; empty (the default)
    // everywhere else, so nothing here changes for TemplatePreview.
    lockedFields = [],
}) => {
    const isAssignmentView = viewMode === "assignment";
    const handleTemplateNumberChange = (value) => {
        setFormData((prev) => ({ ...prev, templateNumber: value }));
    };

    const handleWorkOrderSubInformationChange = (value) => {
        setFormData((prev) => ({ ...prev, workOrderSubInformation: value }));
    };

    const handleWorkOrderRACIInformationChange = (value) => {
        setFormData((prev) => ({ ...prev, workOrderRACIInformation: value }));
    };

    // PPE / Hand Tools / Materials / Hazards & Controls are shown here as
    // read-only reference tables (view/download-style, same as
    // SupportingDocumentTableFTS above) - they're always forced readOnly
    // regardless of the readOnly prop, since this preview never edits
    // these lists directly. The setters below exist only because the
    // table components expect them; they're inert here.
    const handleAddHazardControlRow = () => {
        setFormData((prev) => ({
            ...prev,
            hazardsControls: [
                ...(Array.isArray(prev.hazardsControls) ? prev.hazardsControls : []),
                { hazard: "", unwantedEvent: "", control: "" },
            ],
        }));
    };

    const handleRemoveHazardControlRow = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            hazardsControls: (Array.isArray(prev.hazardsControls) ? prev.hazardsControls : []).filter(
                (_, index) => index !== indexToRemove
            ),
        }));
    };

    const handleUpdateHazardControlRow = (index, field, value) => {
        setFormData((prev) => {
            const updatedRows = [...(Array.isArray(prev.hazardsControls) ? prev.hazardsControls : [])];
            updatedRows[index] = {
                ...updatedRows[index],
                [field]: value,
            };
            return { ...prev, hazardsControls: updatedRows };
        });
    };

    const handleUpdateHazardControlRows = (newRows) => {
        setFormData((prev) => ({ ...prev, hazardsControls: newRows }));
    };

    return (
        <>

            <TemplateTitleField
                value={formData.templateTitle}
                frequency={formData.frequency}
                workOrderBasis={formData.workOrderBases}
                assetType={formData.assetType}
                mainArea={formData.mainArea}
                department={formData.department}
                workOrderType={formData.workOrderType}
                readOnly={readOnly}
                showUI={true}
            />

            {/* 2. Template Number, Revision Number */}
            <div className="input-row-risk-create">
                <TemplateNumberField
                    value={formData.templateNumber}
                    workOrderType={formData.workOrderType}
                    department={formData.department}
                    mainArea={formData.mainArea}
                    onChange={handleTemplateNumberChange}
                    readOnly={true}
                    showUI={true}
                />
                <RevisionNumberField
                    onChange={noop}
                    value={formData.version}
                    readOnly={true}
                    showUI={true}
                />
            </div>

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

            {/* 6. Asset, Site, Department and Management info */}
            {(formData.workOrderBases === "assetBased" || formData.workOrderBases === "") && (<AssetInfoBox
                collapsible={true}
                formData={formData}
                setFormData={setFormData}
                error={errors.assetDetails}
                setErrors={setErrors}
                readOnly={readOnly}
                workOrderBasis={formData.workOrderBases}
                viewMode={viewMode}
                noOptions={false}
                lockedFields={lockedFields}
            />)}

            <SiteAreaInfoBox
                collapsible={true}
                formData={formData}
                setFormData={setFormData}
                error={errors.siteAreaDetails}
                setErrors={setErrors}
                readOnly={readOnly}
                noOptions={false}
                viewMode={viewMode}
                lockedFields={lockedFields}
            />

            <DepartmentInfoBox
                collapsible={true}
                formData={formData}
                setFormData={setFormData}
                error={errors.departmentDetails}
                setErrors={setErrors}
                readOnly={readOnly}
                noOptions={false}
                viewMode={viewMode}
                lockedFields={lockedFields}
            />

            <ManagementInfoBox
                collapsible={true}
                formData={formData}
                setFormData={setFormData}
                error={errors.managementDetails}
                setErrors={setErrors}
                readOnly={readOnly}
                noOptions={false}
                isAssignmentView={isAssignmentView}
                viewMode={viewMode}
                lockedFields={lockedFields}
                required={true}
            />

            {/* 7. Supporting Info - view/download only, never editable here */}
            <SupportingDocumentTableFTS
                collapsible={true}
                formData={formData}
                setFormData={setFormData}
                readOnly={true}
            />

            {/* PPE, Hand Tools, Materials and Hazards & Controls - same
                view/download-only treatment as Supporting Info above,
                always forced readOnly regardless of the readOnly prop. */}
            <PPETable
                collapsible={true}
                formData={formData}
                setFormData={setFormData}
                usedPPEOptions={(formData.PPEItems || []).map((item) => item.ppe)}
                setUsedPPEOptions={noop}
                readOnly={true}
            />

            <HandToolTable
                collapsible={true}
                formData={formData}
                setFormData={setFormData}
                usedHandTools={(formData.HandTools || []).map((item) => item.handTool)}
                setUsedHandTools={noop}
                readOnly={true}
            />

            <MaterialsTable
                collapsible={true}
                formData={formData}
                setFormData={setFormData}
                usedMaterials={(formData.Materials || []).map((item) => item.material)}
                setUsedMaterials={noop}
                readOnly={true}
            />

            <HazardsControlsTableFTS
                collapsible={true}
                defaultCollapsed={true}
                hazardControlRows={formData.hazardsControls || []}
                addHazardControlRow={handleAddHazardControlRow}
                removeHazardControlRow={handleRemoveHazardControlRow}
                updateHazardControlRow={handleUpdateHazardControlRow}
                updateHazardControlRows={handleUpdateHazardControlRows}
                readOnly={true}
                required={false}
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
                viewMode={viewMode}
                lockedFields={lockedFields}
            />
        </>
    );
};

export default TemplatePreviewContent;