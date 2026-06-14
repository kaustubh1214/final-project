// Turns any axios/FastAPI error into a single human-readable string.
// FastAPI returns `detail` as a string for HTTPException, but as an ARRAY of
// {loc, msg, type} objects for 422 validation errors — rendering that array
// directly in JSX would crash React, so we normalize everything here.
export function getApiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
    const detail = err?.response?.data?.detail;

    if (typeof detail === 'string' && detail.trim()) {
        return detail;
    }

    if (Array.isArray(detail)) {
        const msgs = detail
            .map((d) => (typeof d === 'string' ? d : d?.msg))
            .filter(Boolean);
        if (msgs.length) return msgs.join('. ');
    }

    // No response object usually means the request never reached the server.
    if (err && err.response === undefined) {
        return 'Cannot reach the server. Please check your connection and try again.';
    }

    return fallback;
}
