import React, { useEffect } from "react";

const ManagementInformationField = ({
    value,
    accountableLevel = "",
    personInCharge = "",
    minTeamExecutors = [],
    onChange,
    readOnly = false,
    error = false,
    required = true,
}) => {
    // Whenever Accountable Level, Person in Charge, or the Minimum Team /
    // Task Executors list changes, recompute the combined RACI Information
    // string and push it up to the parent's formData. This field is
    // view-only, so the user never edits it directly - it's purely derived
    // from the three source fields (the same ones populated in
    // ManagementInfoBox).
    useEffect(() => {
        const team = Array.isArray(minTeamExecutors) ? minTeamExecutors.join(", ") : "";

        const combined =
            `Accountable: ${(accountableLevel || "").trim()}, ` +
            `Person in Charge: ${(personInCharge || "").trim()}, ` +
            `Team: ${team}`;

        if (combined !== value) {
            onChange && onChange(combined);
        }
    }, [accountableLevel, personInCharge, minTeamExecutors]);

    return (
        <div className="input-row">
            <div className={`input-box-title ${error ? "error-create" : ""}`} style={{ marginBottom: "0px" }}>
                <h3 className="font-fam-labels">
                    Work Order RACI Information {required && <span className="required-field">*</span>}
                </h3>
                <textarea
                    spellCheck="true"
                    type="text"
                    name="workOrderRACIInformation"
                    className="aim-textarea-risk-create-textarea-nopads font-fam aim-textarea-text"
                    value={value}
                    placeholder="Accountable / Person in Charge / Team of Work Order"
                    readOnly={true}
                    style={{ minHeight: 0 }}
                />
            </div>
        </div>
    );
};

export default ManagementInformationField;