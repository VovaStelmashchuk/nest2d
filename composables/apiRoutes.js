export const API_ROUTES = {
    PROJECTS: '/api/project/me',
    LOGOUT: '/api/auth/logout',
    USER: '/api/user',
    RESULTS: (slug) => slug ? `/api/project/${slug}/queue` : '/api/queue/all',
    DXFFILE: (slug) => `/api/queue/${slug}/dxf`,
    AUTH: (slug) => `/api/auth/${slug}/redirect`,
    PROJECT: (slug) => slug ? `/api/project/${slug}` : '/api/project',
    NEST: (slug) => `/api/project/${slug}/nest`,
    ADDFILES: (slug) => `/api/project/${slug}/addfiles`,
    LOGIN: (slug) => `/api/auth/${slug}/login`,
};