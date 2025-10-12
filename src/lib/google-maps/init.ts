/**
 * Google Maps API Initialization
 * 
 * Based on @googlemaps/js-api-loader v2.0.1 documentation:
 * https://www.npmjs.com/package/@googlemaps/js-api-loader
 * 
 * setOptions() must be called ONCE at application level, not in components.
 * This file handles the global initialization.
 */

import { setOptions } from '@googlemaps/js-api-loader';

let isInitialized = false;

export function initializeGoogleMaps() {
  if (isInitialized) {
    console.warn('Google Maps already initialized');
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing');
    return;
  }

  // Set options for Google Maps API (v2.0.1 pattern)
  setOptions({
    key: apiKey,
    v: 'weekly', // Use latest features
    // Note: Do not specify libraries here - importLibrary() will load them on demand
  });

  isInitialized = true;
  console.log('✅ Google Maps API initialized');
}

export function isGoogleMapsInitialized() {
  return isInitialized;
}
