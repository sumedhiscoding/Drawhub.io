/**
 * API Configuration
 * Centralized configuration for API endpoints and URLs
 * All URLs are loaded from environment variables for deployment flexibility
 */

const config = {
  // API Base URL - used for REST API calls
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  
  // Socket URL - used for WebSocket connections
  // Falls back to API URL if not specified (useful when API and Socket are on same domain)
  socketUrl: import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000',
  
  // Environment
  env: import.meta.env.MODE || 'development',
  
  // Check if running in production
  isProduction: import.meta.env.PROD || false,
};

// Validate required environment variables in production
if (config.isProduction && !import.meta.env.VITE_API_URL) {
  console.error('VITE_API_URL is required in production environment');
}

export default config;
