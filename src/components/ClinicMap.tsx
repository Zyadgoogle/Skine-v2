import React, { useState } from 'react';
import { MapPin, Navigation, Activity } from 'lucide-react';

export function ClinicMap() {
  const [mapQuery, setMapQuery] = useState("Skin+Clinic");
  const [mapZoom, setMapZoom] = useState(3);
  const [activeClinicId, setActiveClinicId] = useState<string | null>(null);
  const [isFindingLocation, setIsFindingLocation] = useState(false);

  const resetView = () => {
    setMapQuery("Skin+Clinic");
    setMapZoom(3);
    setActiveClinicId(null);
  };

  const findNearestClinic = () => {
    setIsFindingLocation(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsFindingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapQuery(`${latitude},${longitude}`);
        setMapZoom(12);
        setActiveClinicId('current');
        setIsFindingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please ensure location permissions are granted.");
        setIsFindingLocation(false);
      }
    );
  };

  // Google Maps Iframe URL
  const iframeUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=${mapZoom}&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] w-full rounded-[3rem] md:rounded-[4rem] overflow-hidden border-[8px] md:border-[12px] border-white dark:border-stone-900 shadow-2xl bg-stone-100 dark:bg-stone-800 group z-10 flex flex-col">

      <div className="flex-1 w-full relative">
        <iframe 
          title="Google Maps"
          src={iframeUrl}
          width="100%" 
          height="100%" 
          style={{ border: 0, position: 'absolute', inset: 0 }} 
          allowFullScreen={false} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      {/* Map Overlays */}
      <div className="absolute bottom-6 left-6 z-[1000] pointer-events-none">
        <div className="bg-white/90 dark:bg-[#0F0D0C]/90 backdrop-blur-md p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl max-w-xs pointer-events-auto">
          <div className="flex items-center gap-3 text-emerald-500 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Google Maps Interactive
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 font-medium leading-relaxed">
            {activeClinicId 
              ? "Viewing selected location. Explore nearby places above." 
              : "Showing global clinical nodes. Pan, zoom, or find the nearest one."}
          </p>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-[1000] flex flex-col sm:flex-row gap-3 pointer-events-none">
        <button 
          onClick={resetView}
          className="pointer-events-auto px-5 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs font-bold text-[#3B302B] dark:text-stone-200 shadow-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-all flex items-center gap-2"
        >
           <Activity className="w-4 h-4" /> Reset View
        </button>
        <a 
          href="https://www.google.com/maps/search/?api=1&query=pharmacy"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto px-5 py-3 bg-emerald-600 dark:bg-emerald-700 border border-emerald-600 dark:border-emerald-700 rounded-2xl text-xs font-bold text-white shadow-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          Nearby Pharmacies
        </a>
        <button 
          onClick={findNearestClinic}
          disabled={isFindingLocation}
          className="pointer-events-auto px-5 py-3 bg-[#4A3C31] dark:bg-stone-800 border border-[#4A3C31] dark:border-stone-700 rounded-2xl text-xs font-bold text-white shadow-lg hover:bg-[#3B302B] dark:hover:bg-stone-700 transition-all flex items-center gap-2 disabled:opacity-70"
        >
          {isFindingLocation ? (
             <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          Find Nearest Clinic
        </button>
      </div>
    </div>
  );
}
