import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage, API } from "@/App";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, MapPin, Users, Download, Mail, Home } from "lucide-react";

export default function ConfirmationPage() {
  const { bookingId } = useParams();
  const { t, language } = useLanguage();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadBooking();
  }, [bookingId]);
  
  const loadBooking = async () => {
    try {
      const response = await fetch(`${API}/bookings/${bookingId}`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      }
    } catch (error) {
      console.error("Error loading booking:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-outfit font-bold text-xl mb-4">Booking not found</h2>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-metro-navy text-white">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-metro-orange flex items-center justify-center">
              <span className="font-outfit font-bold text-xl text-white">M</span>
            </div>
            <span className="font-outfit font-bold text-xl hidden sm:block">Metro Travel</span>
          </Link>
        </div>
      </header>
      
      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-emerald-600">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</div>
              <span className="font-medium hidden sm:inline">Your selection</span>
            </div>
            <div className="w-8 h-px bg-emerald-300"></div>
            <div className="flex items-center gap-2 text-emerald-600">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</div>
              <span className="font-medium hidden sm:inline">Your details</span>
            </div>
            <div className="w-8 h-px bg-emerald-300"></div>
            <div className="flex items-center gap-2 text-emerald-600">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</div>
              <span className="font-medium hidden sm:inline">Confirmation</span>
            </div>
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Banner */}
          <div className="text-center mb-8 animate-fade-in" data-testid="confirmation-success">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="font-outfit font-bold text-3xl text-foreground mb-2">
              {t("bookingConfirmed")}
            </h1>
            <p className="text-muted-foreground">
              A confirmation email has been sent to {booking.guest_info?.email}
            </p>
          </div>
          
          {/* Booking Reference */}
          <div className="card-dashboard p-6 mb-6 text-center" data-testid="booking-reference">
            <div className="text-sm text-muted-foreground mb-1">{t("bookingRef")}</div>
            <div className="font-outfit font-bold text-3xl text-metro-navy tracking-wider">
              {booking.booking_ref}
            </div>
          </div>
          
          {/* Booking Details */}
          <div className="card-dashboard p-6 mb-6" data-testid="booking-details">
            <h2 className="font-outfit font-bold text-xl mb-4">Booking Details</h2>
            
            {/* Hotel */}
            <div className="pb-4 mb-4 border-b">
              <h3 className="font-semibold text-lg">{booking.hotel_name}</h3>
            </div>
            
            {/* Stay Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-metro-navy mt-0.5" />
                <div>
                  <div className="font-medium">Check-in</div>
                  <div className="text-muted-foreground">{booking.check_in}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-metro-navy mt-0.5" />
                <div>
                  <div className="font-medium">Check-out</div>
                  <div className="text-muted-foreground">{booking.check_out}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-metro-navy mt-0.5" />
                <div>
                  <div className="font-medium">Guests</div>
                  <div className="text-muted-foreground">
                    {booking.adults} adults{booking.children > 0 ? `, ${booking.children} children` : ""}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-metro-navy mt-0.5" />
                <div>
                  <div className="font-medium">Guest</div>
                  <div className="text-muted-foreground">
                    {booking.guest_info?.first_name} {booking.guest_info?.last_name}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {booking.guest_info?.email}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Price */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">{t("totalPrice")}</span>
                <span className="text-price font-bold text-2xl">
                  ₺{booking.total_price?.toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-muted-foreground text-right">
                Payment status: <span className="capitalize text-emerald-600">{booking.payment_status}</span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex-1" data-testid="download-btn">
              <Download className="w-4 h-4 mr-2" />
              Download Confirmation
            </Button>
            <Button variant="outline" className="flex-1" data-testid="email-btn">
              <Mail className="w-4 h-4 mr-2" />
              Email Confirmation
            </Button>
          </div>
          
          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link to="/">
              <Button className="btn-primary" data-testid="back-home-btn">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
