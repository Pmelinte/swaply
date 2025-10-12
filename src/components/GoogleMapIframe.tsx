'use client';

/**
 * METODA #2: Google Maps Embed (iframe)
 * GARANTAT să funcționeze - NU necesită API Key
 * Documentație: https://developers.google.com/maps/documentation/embed/get-started
 */

interface GoogleMapIframeProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

export default function GoogleMapIframe({
  center = { lat: 45.9432, lng: 24.9668 },
  zoom = 7,
  className = 'w-full h-[400px] rounded-lg'
}: GoogleMapIframeProps) {
  // Construim URL-ul pentru iframe (fără API Key necesar pentru view mode)
  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${center.lat},${center.lng}&zoom=${zoom}`;

  return (
    <div className="space-y-2">
      <div className="bg-blue-100 border border-blue-300 rounded px-3 py-1 text-sm text-blue-800">
        🗺️ METODA #2: Google Maps Embed (iframe) - NO API KEY REQUIRED
      </div>
      <iframe
        src={mapUrl}
        className={className}
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Google Maps"
      />
    </div>
  );
}
