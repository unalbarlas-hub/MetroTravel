import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useLanguage, useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Lock, Check, User, Mail, Phone, Calendar, Users, MapPin } from "lucide-react";

export default function BookingPage() {
  const { hotelId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);
  const [ratePlan, setRatePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const roomId = searchParams.get("roomId") || "";
  const ratePlanId = searchParams.get("ratePlanId") || "";
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone: "",
    specialRequests: "",
  });
  
  useEffect(() => {
    loadBookingDetails();
  }, [hotelId, roomId, ratePlanId]);
  
  const loadBookingDetails = async () => {
    setLoading(true);
    try {
      // Load hotel
      const hotelRes = await fetch(`${API}/hotels/${hotelId}`);
      const hotelData = await hotelRes.json();
      setHotel(hotelData);
      
      // Load availability to get room and rate plan details
      const availRes = await fetch(`${API}/search/availability?hotel_id=${hotelId}&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}&children=${children}`);
      const availData = await availRes.json();
      
      const foundRoom = availData.rooms?.find(r => r.room_id === roomId);
      if (foundRoom) {
        setRoom(foundRoom);
        const foundRatePlan = foundRoom.rate_plans?.find(rp => rp.rate_plan_id === ratePlanId);
        setRatePlan(foundRatePlan);
      }
    } catch (error) {
      console.error("Error loading booking details:", error);
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          hotel_id: hotelId,
          check_in: checkIn,
          check_out: checkOut,
          rooms: [{
            room_id: roomId,
            rate_plan_id: ratePlanId,
            quantity: 1,
            guest_names: [`${formData.firstName} ${formData.lastName}`],
          }],
          guest_info: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            special_requests: formData.specialRequests || null,
          },
          adults,
          children,
          children_ages: [],
        }),
      });
      
      if (!response.ok) {
        throw new Error("Booking failed");
      }
      
      const booking = await response.json();
      
      // Check if iyzico is enabled (payment pending)
      if (booking.iyzico_enabled && booking.payment_status === "pending") {
        // Redirect to payment page
        navigate(`/payment/${booking.booking_id}`);
      } else {
        // Mock mode - booking is already confirmed
        toast.success("Booking confirmed!");
        navigate(`/confirmation/${booking.booking_id}`);
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to complete booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!hotel || !room || !ratePlan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-outfit font-bold text-xl mb-4">Booking details not found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }
  
  const hotelName = hotel.name?.[language] || hotel.name?.en || "Hotel";
  const roomName = room.name?.[language] || room.name?.en || "Room";
  const totalPrice = ratePlan.total_price || ratePlan.base_price || 0;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-metro-navy text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-metro-orange flex items-center justify-center">
                <span className="font-outfit font-bold text-xl text-white">M</span>
              </div>
              <span className="font-outfit font-bold text-xl hidden sm:block">Metro Travel</span>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-metro-navy">
              <div className="w-6 h-6 rounded-full bg-metro-navy text-white flex items-center justify-center text-xs">1</div>
              <span className="font-medium hidden sm:inline">Your selection</span>
            </div>
            <div className="w-8 h-px bg-slate-300"></div>
            <div className="flex items-center gap-2 text-metro-navy">
              <div className="w-6 h-6 rounded-full bg-metro-navy text-white flex items-center justify-center text-xs">2</div>
              <span className="font-medium hidden sm:inline">Your details</span>
            </div>
            <div className="w-8 h-px bg-slate-300"></div>
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">3</div>
              <span className="hidden sm:inline">Confirmation</span>
            </div>
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="booking-form">
              {/* Guest Details */}
              <div className="card-dashboard p-6">
                <h2 className="font-outfit font-bold text-xl mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-metro-navy" />
                  {t("guestDetails")}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t("firstName")} *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                      data-testid="input-firstname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t("lastName")} *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                      data-testid="input-lastname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t("email")} *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{t("phone")} *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="specialRequests">{t("specialRequests")}</Label>
                  <Textarea
                    id="specialRequests"
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    placeholder="Any special requests? (optional)"
                    className="mt-1"
                    rows={3}
                    data-testid="input-requests"
                  />
                </div>
              </div>
              
              {/* Payment Section (Mock) */}
              <div className="card-dashboard p-6">
                <h2 className="font-outfit font-bold text-xl mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-metro-navy" />
                  Payment
                </h2>
                
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">No payment required now</span>
                  </div>
                  <p className="text-sm text-emerald-600 mt-1">
                    You'll pay at the property during your stay
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span>Your booking is secure and protected</span>
                </div>
              </div>
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full btn-accent h-14 text-lg"
                disabled={submitting}
                data-testid="confirm-booking-btn"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    {t("confirmBooking")}
                  </>
                )}
              </Button>
            </form>
          </div>
          
          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card-dashboard p-6 sticky top-4" data-testid="booking-summary">
              <h3 className="font-outfit font-bold text-lg mb-4">Booking Summary</h3>
              
              {/* Hotel Info */}
              <div className="flex gap-3 pb-4 border-b">
                <img 
                  src={hotel.photos?.[0] || "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=100"}
                  alt={hotelName}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-semibold">{hotelName}</h4>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {hotel.address?.city}
                  </div>
                </div>
              </div>
              
              {/* Stay Details */}
              <div className="py-4 border-b space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Check-in
                  </span>
                  <span className="font-medium">{checkIn}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Check-out
                  </span>
                  <span className="font-medium">{checkOut}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" /> Guests
                  </span>
                  <span className="font-medium">{adults} adults{children > 0 ? `, ${children} children` : ""}</span>
                </div>
              </div>
              
              {/* Room Details */}
              <div className="py-4 border-b">
                <h4 className="font-medium mb-2">{roomName}</h4>
                <div className="text-sm text-muted-foreground">
                  {ratePlan.meal_plan?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                {ratePlan.rate_type === "refundable" && (
                  <div className="text-sm text-emerald-600 mt-1">
                    <Check className="w-4 h-4 inline mr-1" />
                    {t("freeCancellation")}
                  </div>
                )}
              </div>
              
              {/* Price */}
              <div className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">{t("totalPrice")}</span>
                  <span className="text-price font-bold text-2xl">
                    ₺{totalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground text-right mt-1">
                  Includes taxes and fees
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
