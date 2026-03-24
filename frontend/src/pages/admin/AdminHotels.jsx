import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Hotel, Shield, Home, Check, X, Star, MapPin, Eye } from "lucide-react";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-slate-100 text-slate-700",
};

export default function AdminHotels() {
  const { user, logout } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [total, setTotal] = useState(0);
  
  useEffect(() => {
    loadHotels();
  }, [filter]);
  
  const loadHotels = async () => {
    try {
      let url = `${API}/admin/hotels?limit=50`;
      if (filter !== "all") url += `&status=${filter}`;
      
      const response = await fetch(url, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setHotels(data.hotels || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error loading hotels:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApprove = async (hotelId) => {
    try {
      const response = await fetch(`${API}/admin/hotels/${hotelId}/approve`, {
        method: "PUT",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to approve");
      toast.success("Hotel approved!");
      loadHotels();
    } catch (error) {
      toast.error("Failed to approve hotel");
    }
  };
  
  const handleReject = async (hotelId) => {
    if (!confirm("Are you sure you want to reject this hotel?")) return;
    
    try {
      const response = await fetch(`${API}/admin/hotels/${hotelId}/reject`, {
        method: "PUT",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to reject");
      toast.success("Hotel rejected");
      loadHotels();
    } catch (error) {
      toast.error("Failed to reject hotel");
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
            <Link to="/admin/hotels" className="py-4 border-b-2 border-slate-900 font-medium">
              Hotels
            </Link>
            <Link to="/admin/users" className="py-4 text-muted-foreground hover:text-foreground">
              Users
            </Link>
            <Link to="/admin/bookings" className="py-4 text-muted-foreground hover:text-foreground">
              Bookings
            </Link>
          </div>
        </div>
      </nav>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-outfit font-bold text-2xl">Hotels ({total})</h1>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]" data-testid="filter-status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hotels</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-12 card-dashboard">
            <Hotel className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-outfit font-semibold text-xl mb-2">No hotels found</h3>
            <p className="text-muted-foreground">Try changing the filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {hotels.map(hotel => (
              <div key={hotel.hotel_id} className="card-dashboard p-6" data-testid={`hotel-${hotel.hotel_id}`}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Hotel Image */}
                  <div className="w-24 h-24 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                    {hotel.photos?.[0] ? (
                      <img src={hotel.photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Hotel className="w-10 h-10 text-slate-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Hotel Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{hotel.name?.en || hotel.name?.tr}</h3>
                      <Badge className={statusColors[hotel.status]}>{hotel.status}</Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {hotel.address?.city}, {hotel.address?.country}
                      </span>
                      <span className="flex items-center gap-1">
                        {Array.from({ length: hotel.star_rating || 0 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </span>
                      <span className="capitalize">{hotel.property_type?.replace("_", " ")}</span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      Owner ID: {hotel.owner_id}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link to={`/hotel/${hotel.hotel_id}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    
                    {hotel.status === "pending" && (
                      <>
                        <Button 
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600"
                          onClick={() => handleApprove(hotel.hotel_id)}
                          data-testid={`approve-${hotel.hotel_id}`}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleReject(hotel.hotel_id)}
                          data-testid={`reject-${hotel.hotel_id}`}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {hotel.status === "approved" && (
                      <Button 
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleReject(hotel.hotel_id)}
                      >
                        Suspend
                      </Button>
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
