export const API_ORIGIN = 'http://localhost:9090';
export const API_BASE_URL = `${API_ORIGIN}/api/v1`;

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
