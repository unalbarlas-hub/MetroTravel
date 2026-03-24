import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useLanguage, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, Star, ArrowLeft, Wifi, Car, Coffee, Waves, Dumbbell, Utensils, 
  Wind, Tv, Bath, Mountain, Clock, Users, Check, ChevronRight, Sparkles, MessageSquare
} from "lucide-react";
import { ReviewCard } from "@/components/Reviews";

const amenityIcons = {
  wifi: Wifi, tv: Tv, air_conditioning: Wind, minibar: Coffee, pool: Waves,
  gym: Dumbbell, parking: Car, free_parking: Car, restaurant: Utensils,
  spa: Sparkles, sea_view: Mountain, city_view: Mountain, bathtub: Bath,
};

const mealPlanLabels = {
  room_only: "Room Only",
  breakfast: "Breakfast Included",
  half_board: "Half Board",
  full_board: "Full Board",
  all_inclusive: "All Inclusive",
};

export default function HotelDetailPage() {
  const { hotelId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRatePlan, setSelectedRatePlan] = useState(null);
  
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  
  useEffect(() => {
    loadHotelDetails();
  }, [hotelId, checkIn, checkOut, adults]);
  
  const loadHotelDetails = async () => {
    setLoading(true);
    try {
      // Load hotel details
      const hotelRes = await fetch(`${API}/hotels/${hotelId}`);
      const hotelData = await hotelRes.json();
      setHotel(hotelData);
      
      // Load availability
      if (checkIn && checkOut) {
        const availRes = await fetch(`${API}/search/availability?hotel_id=${hotelId}&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}&children=${children}`);
        const availData = await availRes.json();
        setRooms(availData.rooms || []);
      } else {
        setRooms(hotelData.rooms || []);
      }
      
      // Load reviews
      const reviewsRes = await fetch(`${API}/reviews/hotel/${hotelId}?limit=5`);
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.reviews || []);
      }
    } catch (error) {
      console.error("Error loading hotel:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBookNow = () => {
    if (!selectedRoom || !selectedRatePlan) return;
    
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults: adults.toString(),
      children: children.toString(),
      roomId: selectedRoom.room_id,
      ratePlanId: selectedRatePlan.rate_plan_id,
    });
    navigate(`/booking/${hotelId}?${params.toString()}`);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!hotel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-outfit font-bold text-xl mb-4">Hotel not found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }
  
  const hotelName = hotel.name?.[language] || hotel.name?.en || "Hotel";
  const description = hotel.description?.[language] || hotel.description?.en || "";
  
  // Get hotel images or use defaults
  const images = hotel.photos?.length > 0 ? hotel.photos : [
    "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=800",
    "https://images.unsplash.com/photo-1754294681773-25c7a42e503b?w=400",
    "https://images.pexels.com/photos/6466490/pexels-photo-6466490.jpeg?w=400",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
  ];
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#003580] text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <span className="font-outfit font-bold text-xl text-[#003580]">H</span>
              </div>
              <span className="font-outfit font-bold text-xl hidden sm:block">HotelConnect</span>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {/* Image Gallery - Bento Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6 rounded-2xl overflow-hidden h-[400px]" data-testid="hotel-gallery">
          <div className="col-span-2 row-span-2">
            <img src={images[0]} alt={hotelName} className="w-full h-full object-cover" />
          </div>
          {images.slice(1, 5).map((img, i) => (
            <div key={i} className="col-span-1">
              <img src={img} alt={`${hotelName} ${i + 2}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Info */}
            <div className="card-dashboard p-6" data-testid="hotel-info">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="font-outfit font-bold text-2xl md:text-3xl mb-2">{hotelName}</h1>
                  <div className="flex items-center gap-3">
                    <div className="flex">
                      {Array.from({ length: hotel.star_rating || 0 }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {hotel.property_type?.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                {hotel.rating_average > 0 && (
                  <div className="text-right">
                    <div className="bg-[#003580] text-white px-3 py-2 rounded-lg font-bold text-xl">
                      {hotel.rating_average.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {hotel.rating_count} reviews
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                <span>
                  {hotel.address?.street && `${hotel.address.street}, `}
                  {hotel.address?.district && `${hotel.address.district}, `}
                  {hotel.address?.city}, {hotel.address?.country}
                </span>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">{description}</p>
            </div>
            
            {/* Amenities */}
            <div className="card-dashboard p-6" data-testid="hotel-amenities">
              <h2 className="font-outfit font-bold text-xl mb-4">Property Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hotel.property_amenities?.map(amenity => {
                  const Icon = amenityIcons[amenity] || Check;
                  return (
                    <div key={amenity} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#003580]" />
                      </div>
                      <span className="capitalize">{amenity.replace(/_/g, " ")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Check-in/out Times */}
            <div className="card-dashboard p-6">
              <h2 className="font-outfit font-bold text-xl mb-4">House Rules</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#003580]" />
                  <div>
                    <div className="text-sm text-muted-foreground">Check-in</div>
                    <div className="font-semibold">{hotel.times?.check_in || "14:00"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#003580]" />
                  <div>
                    <div className="text-sm text-muted-foreground">Check-out</div>
                    <div className="font-semibold">{hotel.times?.check_out || "11:00"}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Reviews Section */}
            {(hotel.rating_count > 0 || reviews.length > 0) && (
              <div className="card-dashboard p-6" data-testid="reviews-section">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-outfit font-bold text-xl flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#003580]" />
                    Guest Reviews
                  </h2>
                  {hotel.rating_average > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="bg-[#003580] text-white px-3 py-1 rounded-lg font-bold text-lg">
                        {hotel.rating_average.toFixed(1)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Based on {hotel.rating_count} reviews
                      </span>
                    </div>
                  )}
                </div>
                
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <ReviewCard key={review.review_id} review={review} />
                    ))}
                    {hotel.rating_count > 5 && (
                      <Button variant="outline" className="w-full">
                        See all {hotel.rating_count} reviews
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No reviews yet.</p>
                )}
              </div>
            )}
            
            {/* Rooms Section */}
            <div className="card-dashboard p-6" data-testid="rooms-section">
              <h2 className="font-outfit font-bold text-xl mb-4">{t("selectRoom")}</h2>
              
              {rooms.length === 0 ? (
                <p className="text-muted-foreground">No rooms available for selected dates</p>
              ) : (
                <div className="space-y-4">
                  {rooms.map(room => {
                    const roomName = room.name?.[language] || room.name?.en || room.room_type;
                    const isSelected = selectedRoom?.room_id === room.room_id;
                    
                    return (
                      <div 
                        key={room.room_id}
                        className={`border rounded-xl p-4 transition-all ${
                          isSelected ? "border-[#003580] bg-blue-50/50" : "border-slate-200 hover:border-slate-300"
                        }`}
                        data-testid={`room-card-${room.room_id}`}
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Room Image */}
                          <div className="md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={room.photos?.[0] || "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=300"} 
                              alt={roomName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Room Info */}
                          <div className="flex-1">
                            <h3 className="font-outfit font-semibold text-lg">{roomName}</h3>
                            
                            <div className="flex flex-wrap gap-4 my-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{room.max_adults} adults, {room.max_children} children</span>
                              </div>
                              {room.size_sqm && (
                                <div className="flex items-center gap-1">
                                  <span>{room.size_sqm} m²</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                {room.beds?.map((bed, i) => (
                                  <span key={i}>{bed.count}x {bed.bed_type}</span>
                                ))}
                              </div>
                            </div>
                            
                            {/* Room Amenities */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {room.amenities?.slice(0, 6).map(amenity => (
                                <Badge key={amenity} variant="secondary" className="text-xs capitalize">
                                  {amenity.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                            
                            {/* Rate Plans */}
                            {room.rate_plans?.length > 0 && (
                              <div className="space-y-2 pt-3 border-t">
                                {room.rate_plans.map(rp => {
                                  const rpSelected = isSelected && selectedRatePlan?.rate_plan_id === rp.rate_plan_id;
                                  return (
                                    <div 
                                      key={rp.rate_plan_id}
                                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                                        rpSelected ? "bg-[#003580] text-white" : "bg-slate-50 hover:bg-slate-100"
                                      }`}
                                      onClick={() => {
                                        setSelectedRoom(room);
                                        setSelectedRatePlan(rp);
                                      }}
                                      data-testid={`rate-plan-${rp.rate_plan_id}`}
                                    >
                                      <div>
                                        <div className="font-medium text-sm">
                                          {rp.name?.[language] || rp.name?.en || "Rate Plan"}
                                        </div>
                                        <div className={`text-xs ${rpSelected ? "text-white/80" : "text-muted-foreground"}`}>
                                          {mealPlanLabels[rp.meal_plan] || rp.meal_plan}
                                          {rp.rate_type === "refundable" && (
                                            <span className={`ml-2 ${rpSelected ? "text-emerald-300" : "text-emerald-600"}`}>
                                              • {t("freeCancellation")}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className={`text-right ${rpSelected ? "text-white" : ""}`}>
                                        <div className={`font-bold text-lg ${rpSelected ? "" : "text-price"}`}>
                                          ₺{rp.total_price?.toLocaleString() || rp.base_price?.toLocaleString()}
                                        </div>
                                        <div className={`text-xs ${rpSelected ? "text-white/80" : "text-muted-foreground"}`}>
                                          total
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Sticky Booking Widget */}
          <div className="lg:col-span-1">
            <div className="card-dashboard p-6 sticky top-4" data-testid="booking-widget">
              <h3 className="font-outfit font-bold text-lg mb-4">Your Selection</h3>
              
              {/* Dates */}
              <div className="space-y-3 mb-4 pb-4 border-b">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="font-medium">{checkIn || "Select date"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="font-medium">{checkOut || "Select date"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guests</span>
                  <span className="font-medium">{adults} adults, {children} children</span>
                </div>
              </div>
              
              {/* Selected Room */}
              {selectedRoom && selectedRatePlan ? (
                <>
                  <div className="space-y-3 mb-4 pb-4 border-b">
                    <h4 className="font-semibold">
                      {selectedRoom.name?.[language] || selectedRoom.name?.en}
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      {mealPlanLabels[selectedRatePlan.meal_plan]}
                    </div>
                    {selectedRatePlan.rate_type === "refundable" && (
                      <div className="text-sm text-emerald-600">
                        <Check className="w-4 h-4 inline mr-1" />
                        {t("freeCancellation")}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">{t("totalPrice")}</span>
                      <span className="text-price font-bold text-xl">
                        ₺{(selectedRatePlan.total_price || selectedRatePlan.base_price)?.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      Includes taxes and fees
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full btn-primary"
                    onClick={handleBookNow}
                    data-testid="book-now-btn"
                  >
                    {t("bookNow")}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Select a room and rate plan to continue
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
