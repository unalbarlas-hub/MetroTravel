import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useLanguage, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Star, Filter, SlidersHorizontal, ArrowLeft, Wifi, Car, Coffee, Waves, Dumbbell, Utensils } from "lucide-react";

const amenityIcons = {
  wifi: Wifi,
  parking: Car,
  free_parking: Car,
  restaurant: Utensils,
  pool: Waves,
  gym: Dumbbell,
  breakfast: Coffee,
};

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("popularity");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedStars, setSelectedStars] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  
  const city = searchParams.get("city") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  
  useEffect(() => {
    searchHotels();
  }, [searchParams, sortBy, selectedStars, selectedAmenities, priceRange]);
  
  const searchHotels = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          check_in: checkIn,
          check_out: checkOut,
          adults,
          children,
          min_price: priceRange[0] > 0 ? priceRange[0] : null,
          max_price: priceRange[1] < 10000 ? priceRange[1] : null,
          star_ratings: selectedStars.length > 0 ? selectedStars : null,
          amenities: selectedAmenities.length > 0 ? selectedAmenities : null,
          sort_by: sortBy,
          page: 1,
          limit: 50,
        }),
      });
      
      const data = await response.json();
      setResults(data.results || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleStar = (star) => {
    setSelectedStars(prev => 
      prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]
    );
  };
  
  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };
  
  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-4">Price Range (TRY)</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={10000}
          step={100}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>₺{priceRange[0]}</span>
          <span>₺{priceRange[1]}+</span>
        </div>
      </div>
      
      {/* Star Rating */}
      <div>
        <h3 className="font-semibold mb-4">Star Rating</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(star => (
            <label key={star} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedStars.includes(star)}
                onCheckedChange={() => toggleStar(star)}
              />
              <div className="flex items-center">
                {Array.from({ length: star }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* Amenities */}
      <div>
        <h3 className="font-semibold mb-4">Amenities</h3>
        <div className="space-y-2">
          {[
            { code: "wifi", label: "Wi-Fi" },
            { code: "pool", label: "Pool" },
            { code: "gym", label: "Gym" },
            { code: "parking", label: "Parking" },
            { code: "restaurant", label: "Restaurant" },
            { code: "spa", label: "Spa" },
          ].map(amenity => (
            <label key={amenity.code} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedAmenities.includes(amenity.code)}
                onCheckedChange={() => toggleAmenity(amenity.code)}
              />
              <span>{amenity.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-metro-navy text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              <div className="w-10 h-10 rounded-lg bg-metro-orange flex items-center justify-center">
                <span className="font-outfit font-bold text-xl text-white">M</span>
              </div>
              <span className="font-outfit font-bold text-xl hidden sm:block">Metro Travel</span>
            </Link>
          </div>
        </div>
        
        {/* Search Summary */}
        <div className="container mx-auto px-4 pb-4">
          <div className="bg-white/10 rounded-lg p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{city || "All destinations"}</span>
            </div>
            <div className="text-white/80">
              {checkIn} → {checkOut}
            </div>
            <div className="text-white/80">
              {adults} adults{children > 0 ? `, ${children} children` : ""}
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0" data-testid="filters-sidebar">
            <div className="card-dashboard p-4 sticky top-4">
              <h2 className="font-outfit font-bold text-lg mb-4">Filters</h2>
              <FilterPanel />
            </div>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-outfit font-bold text-xl" data-testid="search-results-title">
                  {city || "All destinations"}: {total} properties found
                </h1>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden" data-testid="mobile-filter-btn">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterPanel />
                    </div>
                  </SheetContent>
                </Sheet>
                
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]" data-testid="sort-select">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">Popularity</SelectItem>
                    <SelectItem value="price">Price (Low to High)</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Results List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card-dashboard p-4 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-48 h-36 bg-slate-200 rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-slate-200 rounded w-1/3" />
                        <div className="h-4 bg-slate-200 rounded w-1/4" />
                        <div className="h-4 bg-slate-200 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12" data-testid="no-results">
                <h3 className="font-outfit font-semibold text-xl mb-2">No hotels found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your filters or search criteria</p>
                <Button onClick={() => navigate("/")} data-testid="back-home-btn">
                  Back to Home
                </Button>
              </div>
            ) : (
              <div className="space-y-4" data-testid="results-list">
                {results.map(hotel => (
                  <div 
                    key={hotel.hotel_id}
                    className="card-dashboard overflow-hidden hotel-card cursor-pointer"
                    onClick={() => navigate(`/hotel/${hotel.hotel_id}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`)}
                    data-testid={`hotel-card-${hotel.hotel_id}`}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="md:w-64 h-48 md:h-auto flex-shrink-0">
                        <img
                          src={hotel.photo || "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=400"}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 p-4 flex flex-col">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-outfit font-bold text-lg">{hotel.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex">
                                  {Array.from({ length: hotel.star_rating }).map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground capitalize">
                                  {hotel.property_type?.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                            {hotel.rating_average > 0 && (
                              <div className="bg-metro-navy text-white px-2 py-1 rounded-lg text-sm font-bold">
                                {hotel.rating_average.toFixed(1)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                            <MapPin className="w-4 h-4" />
                            <span>{hotel.address?.city}, {hotel.address?.district || "Turkey"}</span>
                          </div>
                          
                          {/* Amenities */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {hotel.property_amenities?.slice(0, 5).map(amenity => {
                              const Icon = amenityIcons[amenity] || Coffee;
                              return (
                                <span key={amenity} className="flex items-center gap-1 text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded">
                                  <Icon className="w-3 h-3" />
                                  {amenity.replace("_", " ")}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-end justify-between pt-3 border-t">
                          <div>
                            <span className="text-xs text-emerald-600 font-medium">{t("freeCancellation")}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">{t("perNight")}</div>
                            <div className="text-price text-2xl">
                              ₺{hotel.min_price?.toLocaleString() || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
