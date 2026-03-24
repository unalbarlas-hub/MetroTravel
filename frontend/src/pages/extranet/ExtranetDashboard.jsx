import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Hotel, Plus, Settings, Calendar, BarChart, 
  Bed, DollarSign, Users, TrendingUp, ArrowRight, Home
} from "lucide-react";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-slate-100 text-slate-700",
};

export default function ExtranetDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const [hotelsRes, bookingsRes] = await Promise.all([
        fetch(`${API}/hotels/owner/my-hotels`, { credentials: "include" }),
        fetch(`${API}/extranet/bookings`, { credentials: "include" }),
      ]);
      
      if (hotelsRes.ok) {
        const hotelsData = await hotelsRes.json();
        setHotels(hotelsData.hotels || []);
      }
      
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData.bookings || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const stats = {
    totalHotels: hotels.length,
    approvedHotels: hotels.filter(h => h.status === "approved").length,
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter(b => b.status === "confirmed").length,
    totalRevenue: bookings.filter(b => b.payment_status === "paid").reduce((sum, b) => sum + (b.total_price || 0), 0),
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-metro-navy text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-metro-orange flex items-center justify-center">
                  <span className="font-outfit font-bold text-xl text-white">M</span>
                </div>
                <span className="font-outfit font-bold text-xl hidden sm:block">Metro Travel</span>
              </Link>
              <Badge className="bg-white/20 text-white">Extranet</Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <Home className="w-4 h-4 mr-2" />
                  Main Site
                </Button>
              </Link>
              <span className="text-white/80 hidden sm:inline">{user?.name}</span>
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-outfit font-bold text-2xl text-foreground">
            Welcome back, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">Manage your properties and reservations</p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-dashboard p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Hotel className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalHotels}</div>
                <div className="text-sm text-muted-foreground">Properties</div>
              </div>
            </div>
          </div>
          
          <div className="card-dashboard p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalBookings}</div>
                <div className="text-sm text-muted-foreground">Bookings</div>
              </div>
            </div>
          </div>
          
          <div className="card-dashboard p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.confirmedBookings}</div>
                <div className="text-sm text-muted-foreground">Confirmed</div>
              </div>
            </div>
          </div>
          
          <div className="card-dashboard p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">₺{stats.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Revenue</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* My Properties */}
          <div className="card-dashboard p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-outfit font-bold text-lg">My Properties</h2>
              <Link to="/extranet/property">
                <Button size="sm" className="btn-primary" data-testid="add-property-btn">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Property
                </Button>
              </Link>
            </div>
            
            {loading ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : hotels.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground" data-testid="no-properties">
                <Hotel className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No properties yet. Add your first hotel!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {hotels.slice(0, 5).map(hotel => (
                  <div 
                    key={hotel.hotel_id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                    onClick={() => navigate(`/extranet/property/${hotel.hotel_id}`)}
                    data-testid={`property-${hotel.hotel_id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden">
                        {hotel.photos?.[0] ? (
                          <img src={hotel.photos[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Hotel className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{hotel.name?.en || hotel.name?.tr}</div>
                        <div className="text-sm text-muted-foreground">{hotel.address?.city}</div>
                      </div>
                    </div>
                    <Badge className={statusColors[hotel.status]}>
                      {hotel.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Recent Bookings */}
          <div className="card-dashboard p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-outfit font-bold text-lg">Recent Bookings</h2>
              <Link to="/extranet/reservations">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            {bookings.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map(booking => (
                  <div 
                    key={booking.booking_id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    data-testid={`booking-${booking.booking_id}`}
                  >
                    <div>
                      <div className="font-medium">{booking.guest_info?.first_name} {booking.guest_info?.last_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.check_in} - {booking.check_out}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-price">₺{booking.total_price?.toLocaleString()}</div>
                      <Badge variant="outline" className="text-xs capitalize">{booking.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {hotels.length > 0 && (
            <>
              <Link to={`/extranet/rooms/${hotels[0].hotel_id}`} className="card-dashboard p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <Bed className="w-8 h-8 text-metro-navy" />
                  <div>
                    <div className="font-medium">Manage Rooms</div>
                    <div className="text-sm text-muted-foreground">Add & edit rooms</div>
                  </div>
                </div>
              </Link>
              
              <Link to={`/extranet/pricing/${hotels[0].hotel_id}`} className="card-dashboard p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-metro-navy" />
                  <div>
                    <div className="font-medium">Pricing</div>
                    <div className="text-sm text-muted-foreground">Rates & availability</div>
                  </div>
                </div>
              </Link>
              
              <Link to="/extranet/reservations" className="card-dashboard p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-metro-navy" />
                  <div>
                    <div className="font-medium">Reservations</div>
                    <div className="text-sm text-muted-foreground">Manage bookings</div>
                  </div>
                </div>
              </Link>
              
              <Link to={`/extranet/property/${hotels[0].hotel_id}`} className="card-dashboard p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <Settings className="w-8 h-8 text-metro-navy" />
                  <div>
                    <div className="font-medium">Settings</div>
                    <div className="text-sm text-muted-foreground">Property details</div>
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
