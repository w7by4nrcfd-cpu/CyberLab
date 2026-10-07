export function caesar(text: string, shift: number) { return text.replace(/[a-z]/gi, c => { const base = c <= 'Z' ? 65 : 97; return String.fromCharCode(base + ((c.charCodeAt(0) - base + shift) % 26 + 26) % 26); }); }
export function levelFor(xp: number) { return Math.floor(xp / 200) + 1; }
