// Dynamic API Configuration
// Automatically detects environment and sets correct API base URL

function getApiBaseUrl() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // If running on localhost, use localhost:5000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    
    // If running on Render or any other domain, use Render backend
    if (hostname.includes('onrender.com') || hostname.includes('vercel.app')) {
        return 'https://urban-school-backend.onrender.com';
    }
    
    // Default fallback
    return `${protocol}//${hostname}`;
}

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API Base URL:', API_BASE_URL);
