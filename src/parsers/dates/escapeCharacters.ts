export function escapeCharacters(value: string) {
    return value.replace(/[\-]/g, '\\$&');
}