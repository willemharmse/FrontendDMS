const DEVICE_ID_KEY = "app_device_id";

export function getOrCreateDeviceId() {
    if (typeof window === "undefined") return null;

    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (id) return id;

    // Use crypto.randomUUID if available, else fallback
    if (window.crypto && window.crypto.randomUUID) {
        id = window.crypto.randomUUID();
    } else {
        id = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
}
