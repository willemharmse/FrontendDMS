import {
    faFont,
    faHashtag,
    faCaretSquareDown,
    faToggleOn,
    faClipboardCheck,
    faSquareCheck,
    faClock,
    faCamera,
    faSignature,
    faBarcode,
    faLocationDot,
    faPaperclip,
} from "@fortawesome/free-solid-svg-icons";

// ---------------------------------------------------------------------------
// Single source of truth for every Work Order Action Field type.
//
// Anything that needs to know "what field types exist" (the builder's type
// picker, validation, the live capture form the technician eventually fills
// in) should import FIELD_TYPES / FIELD_TYPE_MAP from here instead of
// hard-coding the list again.
//
//   value          - stored on the field definition, used everywhere as the key
//   label          - shown in the type picker
//   icon           - FontAwesome icon for the picker + table
//   example        - the "example usage" text from the spec, shown as a hint
//   hasOptions     - true if the template creator must supply a custom list
//                    of options (Dropdown, Buttons)
//   fixedOptions   - options that are baked into the type itself (Yes/No,
//                    Pass/Fail) and can't be edited
//   defaultOptions - starting options pre-filled for convenience when
//                    hasOptions is true (creator can still edit/replace them)
//   hasExpectedValue - true if the creator must pick, from the field's own
//                    option list (fixedOptions or the custom options they
//                    entered), which value counts as the "expected"/correct
//                    one. Stored on the field as `expectedValue`.
//   hasExpectedRange - true if the creator must supply a min/max expected
//                    value instead of a single expected value (Number only).
//                    Stored on the field as `expectedMin` / `expectedMax`.
// ---------------------------------------------------------------------------
export const FIELD_TYPES = [
    {
        value: "text",
        label: "Text",
        icon: faFont,
        example: "Comments, observations, defect descriptions",
        hasOptions: false,
    },
    {
        value: "number",
        label: "Number",
        icon: faHashtag,
        example: "Readings, measurements, temperatures, pressures, vibration levels",
        hasOptions: false,
        hasExpectedRange: true,
    },
    {
        value: "dropdown",
        label: "Dropdown",
        icon: faCaretSquareDown,
        example: "Normal / Elevated / Abnormal",
        hasOptions: true,
        defaultOptions: ["Normal", "Elevated", "Abnormal"],
        hasExpectedValue: true,
    },
    {
        value: "yesno",
        label: "Yes / No",
        icon: faToggleOn,
        example: "Isolation completed? Guard installed? Test passed?",
        hasOptions: false,
        fixedOptions: ["Yes", "No"],
        hasExpectedValue: true,
    },
    {
        value: "passfail",
        label: "Pass / Fail",
        icon: faClipboardCheck,
        example: "CPS warning test passed? Slowdown test passed? Stop test passed?",
        hasOptions: false,
        fixedOptions: ["Pass", "Fail"],
        hasExpectedValue: true,
    },
    {
        value: "buttons",
        label: "Buttons",
        icon: faSquareCheck,
        example: "Compliant / Non-Compliant / Not Applicable",
        hasOptions: true,
        defaultOptions: ["Compliant", "Non-Compliant", "Not Applicable"],
        hasExpectedValue: true,
    },
    {
        value: "datetime",
        label: "Date / Time",
        icon: faClock,
        example: "Time test completed, calibration due date",
        hasOptions: false,
    },
    {
        value: "photo",
        label: "Photo Capture",
        example: "Evidence of test, defect, completed work, condition",
        hasOptions: false,
    },/*
    {
        value: "signature",
        label: "Signature",
        icon: faSignature,
        example: "Technician, operator, supervisor, witness",
        hasOptions: false,
    },*/
    {
        value: "barcode",
        label: "Barcode / QR Scan",
        example: "Asset confirmation, device confirmation, tool confirmation",
        hasOptions: false,
    },
    {
        value: "gps",
        label: "GPS / Location Stamp",
        example: "Optional for surface or mobile use cases",
        hasOptions: false,
    },
    {
        value: "file",
        label: "File Attachment",
        example: "Additional evidence, report, certificate",
        hasOptions: false,
    },
];

export const FIELD_TYPE_MAP = FIELD_TYPES.reduce((acc, t) => {
    acc[t.value] = t;
    return acc;
}, {});

// Builds a brand-new, empty field definition row for the builder table.
export const createEmptyActionField = (overrides = {}) => ({
    id: overrides.id,
    title: "",
    type: "text",
    required: false,
    options: [],
    expectedValue: null,
    expectedMin: null,
    expectedMax: null,
    ...overrides,
});