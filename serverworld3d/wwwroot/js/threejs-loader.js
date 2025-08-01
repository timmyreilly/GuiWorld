// Three.js loader with CSP-compliant fallback mechanism
// This file replaces inline scripts to comply with Content Security Policy

(function() {
    'use strict';
    
    function checkThreeJSAndLoadFallback() {
        if (typeof THREE === 'undefined') {
            console.error('Three.js failed to load from unpkg, trying jsdelivr...');
            
            var fallbackScript = document.createElement('script');
            fallbackScript.src = 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js';
            fallbackScript.onload = function() {
                console.log('Three.js loaded successfully from fallback CDN, version:', THREE.REVISION);
            };
            fallbackScript.onerror = function() {
                console.error('All Three.js CDNs failed to load!');
                // Try one more fallback
                var lastResortScript = document.createElement('script');
                lastResortScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r158/three.min.js';
                lastResortScript.onload = function() {
                    console.log('Three.js loaded from last resort CDN, version:', THREE.REVISION);
                };
                lastResortScript.onerror = function() {
                    console.error('Critical: All Three.js CDNs failed. 3D functionality will not work.');
                };
                document.head.appendChild(lastResortScript);
            };
            document.head.appendChild(fallbackScript);
        } else {
            console.log('Three.js loaded successfully, version:', THREE.REVISION);
        }
    }
    
    // Check when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkThreeJSAndLoadFallback);
    } else {
        // DOM already loaded
        checkThreeJSAndLoadFallback();
    }
})();
