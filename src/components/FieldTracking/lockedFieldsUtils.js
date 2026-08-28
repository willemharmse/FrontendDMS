// Shared between TemplatePreview and WorkOrderAssignment: both popups snapshot
// formData into their own local state on open, lock whatever fields already
// held a value at snapshot time, and never write back to the parent's
// formData/setFormData. Keeping the logic here means the two stay in sync.

// A value counts as "already populated" if it holds real data. Used to
// decide which fields get locked. Empty string/array/object, null, and
// undefined are all treated as "not yet filled in" and remain editable;
// everything else is locked.
export const isPopulated = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
};

// Walks a formData snapshot and returns the list of field names (or, for
// actionFieldValues, "actionFieldValues.<id>" paths) that already held a
// value - i.e. everything that should get locked. Every box expects its
// lockedFields prop in this same flat "name" / "actionFieldValues.<id>" form.
export const computeLockedFields = (source) => {
    const locked = [];

    Object.entries(source || {}).forEach(([key, value]) => {
        if (key === "actionFieldValues") {
            Object.entries(value || {}).forEach(([fieldId, fieldValue]) => {
                if (isPopulated(fieldValue)) {
                    locked.push(`actionFieldValues.${fieldId}`);
                }
            });
            return;
        }

        if (isPopulated(value)) {
            locked.push(key);
        }
    });

    return locked;
};

// Belt-and-suspenders backstop for a local formData setter: if an update
// still tries to change a field that was already populated in the original
// snapshot, that one field is reverted back to its original value while
// every other (previously-empty) field the same update touched still goes
// through normally.
export const guardLockedFields = (next, original) => {
    const guarded = { ...next };

    Object.keys(next).forEach((key) => {
        if (isPopulated(original[key]) && next[key] !== original[key]) {
            guarded[key] = original[key];
        }
    });

    return guarded;
};