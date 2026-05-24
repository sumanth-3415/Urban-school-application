// Dynamic API Configuration
// Automatically detects environment and sets correct API base URL

function getApiBaseUrl() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // If running on localhost, use localhost:5000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    
    // If running on Vercel or any other domain, use the current domain
    // This assumes your backend is deployed at the same domain
    return `${protocol}//${hostname}`;
}

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API Base URL:', API_BASE_URL);
