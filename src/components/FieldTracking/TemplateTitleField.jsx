import React, { useEffect } from "react";

// Auto-generates the "templateTitle" value once every field it depends on
// has been filled in: Activity Name, Asset Type/Model/Component, Frequency,
// and Work Order Type. Format:
// "Activity Name [Asset Type: Asset Model: Component] Frequency: Work Order Type WO"
// Nothing happens (templateTitle is left alone) until all six values are
// present. This logic used to live directly in FTSCreatePageTemplate and
// wrote straight into formData.title - it now lives here and writes into
// formData.templateTitle instead, freeing up "title" to be a normal,
// user-editable field (Draft Name).
//
// When showUI is false (the default usage on the main page), this component
// renders nothing - it only runs the effect that keeps templateTitle in
// sync. Set showUI to true if you ever want to display the computed value.
const TemplateTitleField = ({
    value,
    activityName = "",
    assetType = "",
    assetModel = "",
    component = "",
    frequency = "",
    workOrderType = "",
    onChange,
    readOnly = false,
    error = false,
    required = true,
    showUI = true,
}) => {
    useEffect(() => {
        const requiredValues = [activityName, assetType, assetModel, component, frequency, workOrderType];
        const allFilled = requiredValues.every((val) => (val || "").trim() !== "");

        if (!allFilled) return;

        const generatedTitle = `${activityName} [${assetType}: ${assetModel}: ${component}] ${frequency}: ${workOrderType} WO`;

        if (generatedTitle !== value) {
            onChange && onChange(generatedTitle);
        }
    }, [activityName, assetType, assetModel, component, frequency, workOrderType]);

    if (!showUI) {
        return null;
    }

    return (
        <div className="input-row">
            <div className={`input-box-title ${error ? "error-create" : ""}`}>
                <h3 className="font-fam-labels">
                    Template Title {required && <span className="required-field">*</span>}
                </h3>
                <textarea
                    spellCheck="true"
                    type="text"
                    name="templateTitle"
                    className="aim-textarea-risk-create-textarea-nopads font-fam aim-textarea-text"
                    value={value || ""}
                    placeholder="Auto-generated template title"
                    readOnly={true}
                    style={{ minHeight: 0 }}
                />
            </div>
        </div>
    );
};

export default TemplateTitleField;