export function isProctorRole(pathname?: string, search?: string): boolean {
    const currentPath = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');
    const currentSearch = search ?? (typeof window !== 'undefined' ? window.location.search : '');

    return currentPath === '/proctor' || new URLSearchParams(currentSearch).get('role') === 'proctor';
}