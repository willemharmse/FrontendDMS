const BASE_URL = `${process.env.REACT_APP_URL}/api/openai/`;

export async function aiRewrite(prompt, path) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`AI rewrite failed: ${res.status} ${text}`);
    }
    const { response: newText } = await res.json();
    return newText;
}

export async function aiRewriteWED(prompt, responsible, path) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt, responsible }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`AI rewrite failed: ${res.status} ${text}`);
    }
    const { response: newText } = await res.json();
    return newText;
}