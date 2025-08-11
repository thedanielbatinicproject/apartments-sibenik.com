// solar-dashboard-utilities.js
// Utility functions for solar dashboard error/warning parsing and formatting

/**
 * Parse a string of error/warning codes (e.g. "1, 3;5") into an array of numbers as strings.
 * @param {string|Array} value
 * @returns {string[]}
 */
function parseCodes(value) {
    if (typeof value === 'string') {
        return value.split(/[,;\s]+/).filter(Boolean);
    }
    if (Array.isArray(value)) {
        return value.map(String);
    }
    return [];
}

/**
 * Format a value string, coloring numbers according to type (error/warning).
 * @param {string} value
 * @param {string} type - 'error' or 'warning'
 * @returns {string}
 */
function colorizeCodes(value, type) {
    if (!value) return '';
    const cls = type === 'error' ? 'error-code' : 'warning-code';
    return value.replace(/\d+/g, m => `<span class="${cls}">${m}</span>`);
}

/**
 * Prepare alert objects for display below cards.
 * @param {string[]} codes
 * @param {Object} dict - code-to-message mapping
 * @param {string} type - 'error' or 'warning'
 * @returns {Array<{type:string,code:string,text:string}>}
 */
function buildAlerts(codes, dict, type) {
    if (!Array.isArray(codes)) return [];
    return codes
        .filter(code => dict && dict[String(code)] !== undefined)
        .map(code => ({ type, code: String(code), text: dict[String(code)] }));
}

if (typeof module !== 'undefined') {
    module.exports = { parseCodes, colorizeCodes, buildAlerts };
}

// Expose to browser global for EJS usage
if (typeof window !== 'undefined') {
    window.solarDashboardUtils = { parseCodes, colorizeCodes, buildAlerts };
}
