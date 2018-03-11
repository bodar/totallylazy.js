export function runningInNode() {
    return (typeof process !== 'undefined') && (typeof process.versions.node !== 'undefined');
}

