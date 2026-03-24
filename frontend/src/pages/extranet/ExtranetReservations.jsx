import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Calendar, User, Mail, Phone, Check, X, Clock, AlertCircle } from "lucide-react";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-slate-100 text-slate-700",
  no_show: "bg-purple-100 text-purple-700",
};

export default function ExtranetReservations() {
  const { hotelId } = useParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  
  useEffect(() => {
    loadBookings();
  }, [hotelId, filter]);
  
  const loadBookings = async () => {
    try {
      let url = `${API}/extranet/bookings`;
      const params = new URLSearchParams();
      if (hotelId) params.append("hotel_id", hotelId);
      if (filter !== "all") params.append("status", filter);
      
      const response = await fetch(`${url}?${params.toString()}`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleConfirm = async (bookingId) => {
    try {
      const response = await fetch(`${API}/extranet/bookings/${bookingId}/confirm`, {
        method: "PUT",
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to confirm booking");
      
      toast.success("Booking confirmed!");
      loadBookings();
    } catch (error) {
      toast.error("Failed to confirm booking");
    }
  };
  
  const handleCancel = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      const response = await fetch(`${API}/bookings/${bookingId}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to cancel booking");
      
      toast.success("Booking cancelled");
      loadBookings();
    } catch (error) {
      toast.error("Failed to cancel booking");
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-metro-navy text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/extranet" className="hover:bg-white/10 p-2 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <span className="font-outfit font-bold text-xl">Reservations</span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-outfit font-bold text-lg">
            {bookings.length} Reservations
          </h2>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]" data-testid="filter-status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 card-dashboard" data-testid="no-bookings">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-outfit font-semibold text-xl mb-2">No reservations yet</h3>
            <p className="text-muted-foreground">Bookings will appear here once customers make reservations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking.booking_id} className="card-dashboard p-6" data-testid={`booking-${booking.booking_id}`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={statusColors[booking.status]}>
                        {booking.status}
                      </Badge>
                      <span className="font-mono text-sm text-muted-foreground">
                        {booking.booking_ref}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{booking.hotel_name}</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> Check-in
                        </div>
                        <div className="font-medium">{booking.check_in}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> Check-out
                        </div>
                        <div className="font-medium">{booking.check_out}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <User className="w-4 h-4" /> Guest
                        </div>
                        <div className="font-medium">
                          {booking.guest_info?.first_name} {booking.guest_info?.last_name}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total</div>
                        <div className="font-bold text-price">₺{booking.total_price?.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                      <a href={`mailto:${booking.guest_info?.email}`} className="flex items-center gap-1 hover:text-foreground">
                        <Mail className="w-4 h-4" />
                        {booking.guest_info?.email}
                      </a>
                      <a href={`tel:${booking.guest_info?.phone}`} className="flex items-center gap-1 hover:text-foreground">
                        <Phone className="w-4 h-4" />
                        {booking.guest_info?.phone}
                      </a>
                    </div>
                    
                    {/* Special Requests */}
                    {booking.guest_info?.special_requests && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-lg text-sm">
                        <div className="flex items-center gap-1 text-amber-700 font-medium mb-1">
                          <AlertCircle className="w-4 h-4" />
                          Special Requests
                        </div>
                        <p className="text-amber-900">{booking.guest_info.special_requests}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 lg:w-32">
                    {booking.status === "pending" && (
                      <>
                        <Button 
                          className="flex-1 lg:w-full bg-emerald-500 hover:bg-emerald-600"
                          onClick={() => handleConfirm(booking.booking_id)}
                          data-testid={`confirm-${booking.booking_id}`}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 lg:w-full text-destructive"
                          onClick={() => handleCancel(booking.booking_id)}
                          data-testid={`cancel-${booking.booking_id}`}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <Button 
                        variant="outline"
                        className="flex-1 lg:w-full text-destructive"
                        onClick={() => handleCancel(booking.booking_id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                    {(booking.status === "cancelled" || booking.status === "completed") && (
                      <div className="text-center text-sm text-muted-foreground py-2">
                        <Clock className="w-4 h-4 mx-auto mb-1" />
                        No actions
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
