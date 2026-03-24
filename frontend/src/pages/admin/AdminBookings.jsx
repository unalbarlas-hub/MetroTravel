import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Home, Calendar, User, Hotel, DollarSign } from "lucide-react";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-slate-100 text-slate-700",
};

export default function AdminBookings() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [total, setTotal] = useState(0);
  
  useEffect(() => {
    loadBookings();
  }, [filter]);
  
  const loadBookings = async () => {
    try {
      let url = `${API}/admin/bookings?limit=50`;
      if (filter !== "all") url += `&status=${filter}`;
      
      const response = await fetch(url, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                  <Shield className="w-6 h-6 text-slate-900" />
                </div>
                <span className="font-outfit font-bold text-xl">Admin Panel</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <Home className="w-4 h-4 mr-2" />
                  Main Site
                </Button>
              </Link>
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            <Link to="/admin" className="py-4 text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link to="/admin/hotels" className="py-4 text-muted-foreground hover:text-foreground">
              Hotels
            </Link>
            <Link to="/admin/users" className="py-4 text-muted-foreground hover:text-foreground">
              Users
            </Link>
            <Link to="/admin/bookings" className="py-4 border-b-2 border-slate-900 font-medium">
              Bookings
            </Link>
          </div>
        </div>
      </nav>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-outfit font-bold text-2xl">Bookings ({total})</h1>
          
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
          <div className="text-center py-12 card-dashboard">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-outfit font-semibold text-xl mb-2">No bookings found</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking.booking_id} className="card-dashboard p-6" data-testid={`booking-${booking.booking_id}`}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={statusColors[booking.status]}>{booking.status}</Badge>
                      <span className="font-mono text-sm text-muted-foreground">{booking.booking_ref}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Hotel className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{booking.hotel_name}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Guest</div>
                        <div className="font-medium">{booking.guest_info?.first_name} {booking.guest_info?.last_name}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Check-in</div>
                        <div className="font-medium">{booking.check_in}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Check-out</div>
                        <div className="font-medium">{booking.check_out}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total</div>
                        <div className="font-bold text-price">₺{booking.total_price?.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-muted-foreground">
                    <div>Created</div>
                    <div>{booking.created_at ? new Date(booking.created_at).toLocaleDateString() : "N/A"}</div>
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
