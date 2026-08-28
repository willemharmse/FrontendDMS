import React from "react";

const WorkOrderBasesSelection = ({
    value,
    onChange,
    onFocus,
    readOnly = false,
    error = false,
    required = true,
}) => {
    return (
        <div className={`input-box-type-risk-create ${error ? "error-create" : ""}`}>
            <h3 className="font-fam-labels">
                Work Order Basis {required && <span className="required-field">*</span>}
            </h3>

            <div className="jra-info-popup-page-select-container">
                <select
                    className="table-control font-fam remove-default-styling"
                    type="text"
                    name="workOrderBases"
                    value={value || ""}
                    placeholder="Select Work Order Basis"
                    onChange={onChange}
                    onFocus={onFocus}
                    readOnly={readOnly}
                    disabled={readOnly}
                >
                    <option value="" >
                        {"Select Work Order Basis"}
                    </option>
                    <option value="siteArea" >
                        {"Area Based"}
                    </option>
                    <option value="assetBased" >
                        {"Asset Based"}
                    </option>
                    <option value="department" >
                        {"Department Based"}
                    </option>
                </select>
            </div>
        </div>
    );
};

export default WorkOrderBasesSelection;