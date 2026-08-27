#!/bin/sh
set -e

# Create env-config.js from environment variables
# This allows runtime configuration of the application
cat <<ENVCONFIG > /usr/share/nginx/html/env-config.js
window.ENV = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-http://localhost:3000}",
  VITE_API_TIMEOUT: "${VITE_API_TIMEOUT:-30000}",
  // Add more environment variables as needed
};
ENVCONFIG
