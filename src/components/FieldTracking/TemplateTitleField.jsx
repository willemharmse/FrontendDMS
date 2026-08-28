import React, { useEffect } from "react";

// Auto-generates the "templateTitle" value once every field it depends on
// has been filled in: Frequency, the field driven by Work Order Basis
// (Asset Type / Main Area / Department), and Work Order Type. Format:
// "Perform [Frequency] [Asset Type, Area, etc] [Work Order Type] Work Order Template"
//
// "Perform" is a fixed prefix, standard for every WO template (a dropdown
// may replace it here in future). "Work Order Template" is a fixed suffix.
// The middle segment depends on workOrderBasis:
//   - Asset Based WO Basis      -> assetType
//   - Area Based WO Basis       -> mainArea
//   - Department Based WO Basis -> department
//
// Nothing happens (templateTitle is left alone) until Frequency, the
// relevant basis-driven value, and Work Order Type are all present. This
// logic used to live directly in FTSCreatePageTemplate and wrote straight
// into formData.title - it now lives here and writes into
// formData.templateTitle instead. FTSCreatePageTemplate then keeps
// formData.title in sync with formData.templateTitle, so the draft name
// and the template title are always the same value.
//
// When showUI is false (the default usage on the main page), this component
// renders nothing - it only runs the effect that keeps templateTitle in
// sync. Set showUI to true if you ever want to display the computed value.
const PERFORM_PREFIX = "Perform";
const TEMPLATE_SUFFIX = "Work Order Template";

// NOTE: matches on the WO Basis value case-insensitively by substring
// ("asset" / "area" / "department") rather than an exact string, so this
// keeps working regardless of whether WorkOrderBasesSelection's option
// values are e.g. "Asset Based", "Asset", or similar. If those option
// values change to something that no longer contains these words (e.g. a
// short code), update the matching below to match.
const getBasisDrivenValue = (workOrderBasis, assetType, mainArea, department) => {
    const normalizedBasis = (workOrderBasis || "").toLowerCase();

    if (normalizedBasis.includes("asset")) return assetType || "";
    if (normalizedBasis.includes("area")) return mainArea || "";
    if (normalizedBasis.includes("department")) return department || "";

    return "";
};

const TemplateTitleField = ({
    value,
    frequency = "",
    workOrderBasis = "",
    assetType = "",
    mainArea = "",
    department = "",
    workOrderType = "",
    onChange,
    readOnly = false,
    error = false,
    required = true,
    showUI = true,
}) => {
    useEffect(() => {
        const basisValue = getBasisDrivenValue(workOrderBasis, assetType, mainArea, department);
        const requiredValues = [frequency, basisValue, workOrderType];
        const allFilled = requiredValues.every((val) => (val || "").trim() !== "");

        if (!allFilled) return;

        const generatedTitle = `${PERFORM_PREFIX} ${frequency} ${basisValue} ${workOrderType} ${TEMPLATE_SUFFIX}`;

        if (generatedTitle !== value) {
            onChange && onChange(generatedTitle);
        }
    }, [frequency, workOrderBasis, assetType, mainArea, department, workOrderType]);

    if (!showUI) {
        return null;
    }

    return (
        <div className="input-row">
            <div className={`input-box-title ${error ? "error-create" : ""}`}>
                <h3 className="font-fam-labels">
                    Work Order Title
                </h3>
                <textarea
                    spellCheck="true"
                    type="text"
                    name="templateTitle"
                    className="aim-textarea-risk-create-textarea-nopads font-fam aim-textarea-text"
                    value={value || ""}
                    placeholder="Auto-generated work order title field"
                    readOnly={true}
                    style={{ minHeight: 0, color: "grey" }}
                />
            </div>
        </div>
    );
};

export default TemplateTitleField;