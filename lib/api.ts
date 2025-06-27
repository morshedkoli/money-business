// Utility function for making authenticated API requests with cookies
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    credentials: 'include', // Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  return fetch(url, defaultOptions)
}

// Helper function for GET requests
export const apiGet = (url: string, options: RequestInit = {}) => {
  return apiRequest(url, { method: 'GET', ...options })
}

// Helper function for POST requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiPost = (url: string, data?: any, options: RequestInit = {}) => {
  return apiRequest(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  })
}

// Helper function for PUT requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiPut = (url: string, data?: any, options: RequestInit = {}) => {
  return apiRequest(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  })
}

// Helper function for DELETE requests
export const apiDelete = (url: string, options: RequestInit = {}) => {
  return apiRequest(url, { method: 'DELETE', ...options })
}