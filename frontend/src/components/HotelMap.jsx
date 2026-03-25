import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, Star, Bed } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Turkey city coordinates
const CITY_COORDS = {
  "Istanbul": [41.0082, 28.9784],
  "İstanbul": [41.0082, 28.9784],
  "Antalya": [36.8969, 30.7133],
  "İzmir": [38.4237, 27.1428],
  "Ankara": [39.9334, 32.8597],
  "Muğla": [37.2153, 28.3636],
  "Bodrum": [37.0344, 27.4305],
  "Bursa": [40.1885, 29.0610],
  "Trabzon": [41.0027, 39.7168],
  "Nevşehir": [38.6244, 34.7239],
  "Kapadokya": [38.6431, 34.8289],
  "Fethiye": [36.6220, 29.1157],
};

const getRandomOffset = () => (Math.random() - 0.5) * 0.02;

export default function HotelMap({ hotels, selectedHotel, onSelectHotel, onClose, city }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [hoveredHotel, setHoveredHotel] = useState(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Get center coordinates based on city or default to Istanbul
    const centerCoords = CITY_COORDS[city] || CITY_COORDS["Istanbul"];

    // Initialize map
    const map = L.map(mapRef.current, {
      center: centerCoords,
      zoom: 12,
      zoomControl: true,
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [city]);

  useEffect(() => {
    if (!mapInstanceRef.current || !hotels.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Get base coordinates for city
    const baseCoords = CITY_COORDS[city] || CITY_COORDS["Istanbul"];

    // Add markers for each hotel
    hotels.forEach((hotel, index) => {
      // Use hotel coordinates if available, otherwise generate random offset from city center
      const lat = hotel.address?.coordinates?.lat || (baseCoords[0] + getRandomOffset());
      const lng = hotel.address?.coordinates?.lng || (baseCoords[1] + getRandomOffset());

      // Create custom price marker
      const priceIcon = L.divIcon({
        className: 'custom-price-marker',
        html: `
          <div class="price-marker ${selectedHotel?.hotel_id === hotel.hotel_id ? 'selected' : ''}" 
               style="
                 background: ${selectedHotel?.hotel_id === hotel.hotel_id ? '#f97316' : '#0d1a30'};
                 color: white;
                 padding: 6px 10px;
                 border-radius: 8px;
                 font-weight: 600;
                 font-size: 12px;
                 white-space: nowrap;
                 box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                 cursor: pointer;
                 transition: all 0.2s;
               ">
            ₺${hotel.min_price?.toLocaleString() || '---'}
          </div>
        `,
        iconSize: [80, 32],
        iconAnchor: [40, 32],
      });

      const marker = L.marker([lat, lng], { icon: priceIcon })
        .addTo(mapInstanceRef.current)
        .on('click', () => onSelectHotel(hotel))
        .on('mouseover', () => setHoveredHotel(hotel))
        .on('mouseout', () => setHoveredHotel(null));

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [hotels, selectedHotel, city, onSelectHotel]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price || 0);
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Close Button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 z-[1000] bg-white shadow-lg"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </Button>

      {/* Hotel Info Card (on hover/select) */}
      {(hoveredHotel || selectedHotel) && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1000]">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="relative h-32">
              <img
                src={
                  (hoveredHotel || selectedHotel)?.photos?.[0] ||
                  'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=400'
                }
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-lg flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-sm">
                  {(hoveredHotel || selectedHotel)?.rating_average?.toFixed(1) || 'N/A'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg truncate">
                {(hoveredHotel || selectedHotel)?.name?.tr || 
                 (hoveredHotel || selectedHotel)?.name?.en || 
                 (hoveredHotel || selectedHotel)?.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="w-4 h-4" />
                <span>{(hoveredHotel || selectedHotel)?.address?.city}</span>
                <span className="mx-1">•</span>
                <span className="flex items-center">
                  {Array((hoveredHotel || selectedHotel)?.star_rating || 0).fill(0).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <span className="text-2xl font-bold text-metro-orange">
                    {formatPrice((hoveredHotel || selectedHotel)?.min_price)}
                  </span>
                  <span className="text-sm text-muted-foreground"> / gece</span>
                </div>
                <Button
                  size="sm"
                  className="bg-metro-orange hover:bg-metro-orange/90"
                  onClick={() => window.location.href = `/hotel/${(hoveredHotel || selectedHotel)?.hotel_id}`}
                >
                  Detaylar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-metro-navy"></div>
          <span>{hotels.length} otel bulundu</span>
        </div>
      </div>

      {/* CSS for custom markers */}
      <style>{`
        .custom-price-marker {
          background: transparent;
          border: none;
        }
        .price-marker:hover {
          transform: scale(1.1);
          z-index: 1000 !important;
        }
        .price-marker.selected {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
}
