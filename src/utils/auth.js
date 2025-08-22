// auth.js
// Put this in src/auth.js (or anywhere you like)

export const ROLE_ORDER = {
    none: 0,
    viewer: 1,
    contributor: 2,
    systemAdmin: 3,
};

// Decode JWT payload (no signature check, backend must validate!)
function b64urlToString(b64url) {
    const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
    const base64 = (b64url + pad).replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(base64);
    let out = "";
    for (let i = 0; i < bin.length; i++) {
        out += "%" + ("00" + bin.charCodeAt(i).toString(16)).slice(-2);
    }
    return decodeURIComponent(out);
}

export function decodeJwt(token) {
    const parts = token.split(".");
    if (parts.length < 2) throw new Error("Invalid JWT");
    return JSON.parse(b64urlToString(parts[1]));
}

// Access check
export function can(user, category, neededRole) {
    if (!user) return false;
    if (user.isAdmin) return true;
    const current = (user.permissions && user.permissions[category]) || "none";
    return (ROLE_ORDER[current] || 0) >= (ROLE_ORDER[neededRole] || 0);
}

export function canIn(user, category, allowedRoles) {
    if (!user) return false;
    if (user.isAdmin) return true;
    const current = (user.permissions && user.permissions[category]) || "none";
    return allowedRoles.includes(current);
}

export function isAdmin(user) {
    return !!(user && user.isAdmin);
}

export function hasRole(user, category) {
    if (!user) return false;
    if (user.isAdmin) return true; // admins always qualify
    const role = user.permissions?.[category] || "none";
    return role !== "none";
}

// Convenience to load user from localStorage
export function getCurrentUser() {
    try {
        const token = localStorage.getItem("token");
        if (!token) return null;
        const payload = decodeJwt(token);
        if (payload.exp && Date.now() >= payload.exp * 1000) return null;
        return { isAdmin: !!payload.isAdmin, permissions: payload.permissions || {} };
    } catch {
        return null;
    }
}
