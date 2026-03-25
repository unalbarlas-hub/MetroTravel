import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage, useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  User, Calendar, MapPin, LogOut, Settings, Hotel, 
  Clock, CheckCircle, XCircle, AlertCircle, Star, Loader2, Ban
} from "lucide-react";
import { WriteReviewDialog } from "@/components/Reviews";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-slate-100 text-slate-700",
};

const statusIcons = {
  pending: AlertCircle,
  confirmed: CheckCircle,
  cancelled: XCircle,
  completed: CheckCircle,
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellationInfo, setCancellationInfo] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  
  useEffect(() => {
    loadBookings();
  }, []);
  
  const loadBookings = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API}/bookings`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
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
  
  const handleOpenCancelDialog = async (booking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API}/bookings/${booking.booking_id}/cancellation-info`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const info = await response.json();
        setCancellationInfo(info);
      }
    } catch (error) {
      console.error("Error loading cancellation info:", error);
    }
  };
  
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    setCancelling(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API}/bookings/${selectedBooking.booking_id}/cancel`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(
          result.refund_status === "full_refund" 
            ? "Rezervasyon iptal edildi. Tam iade yapılacak." 
            : result.refund_status === "partial_refund"
            ? `Rezervasyon iptal edildi. ₺${result.refund_amount.toLocaleString()} iade edilecek.`
            : "Rezervasyon iptal edildi."
        );
        setCancelDialogOpen(false);
        loadBookings();
      } else {
        const error = await response.json();
        toast.error(error.detail || "İptal işlemi başarısız");
      }
    } catch (error) {
      toast.error("Bağlantı hatası");
    } finally {
      setCancelling(false);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  
  const upcomingBookings = bookings.filter(b => 
    b.status === "confirmed" && new Date(b.check_in) >= new Date()
  );
  const pastBookings = bookings.filter(b => 
    b.status === "completed" || new Date(b.check_out) < new Date()
  );
  const cancelledBookings = bookings.filter(b => b.status === "cancelled");
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-metro-navy text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-metro-orange flex items-center justify-center">
                <span className="font-outfit font-bold text-xl text-white">M</span>
              </div>
              <span className="font-outfit font-bold text-xl hidden sm:block">Metro Travel</span>
            </Link>
            
            <div className="flex items-center gap-4">
              {user?.role === "hotel_owner" && (
                <Link to="/extranet">
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    <Hotel className="w-4 h-4 mr-2" />
                    Extranet
                  </Button>
                </Link>
              )}
              {user?.role === "admin" && (
                <Link to="/admin">
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                {t("logout")}
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="card-dashboard p-6 sticky top-4" data-testid="user-profile">
              <div className="text-center mb-6">
                {user?.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-metro-navy flex items-center justify-center mx-auto mb-3">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                <h2 className="font-outfit font-bold text-lg">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge className="mt-2 capitalize">{user?.role?.replace("_", " ")}</Badge>
              </div>
              
              <nav className="space-y-1">
                <Link 
                  to="/dashboard"
                  className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-100 text-foreground"
                >
                  <Calendar className="w-5 h-5" />
                  {t("myBookings")}
                </Link>
                <button 
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-50 text-muted-foreground w-full text-left"
                >
                  <Settings className="w-5 h-5" />
                  {t("profile")}
                </button>
              </nav>
            </div>
          </aside>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <h1 className="font-outfit font-bold text-2xl mb-6">{t("myBookings")}</h1>
            
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="upcoming" data-testid="tab-upcoming">
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="past" data-testid="tab-past">
                  Past ({pastBookings.length})
                </TabsTrigger>
                <TabsTrigger value="cancelled" data-testid="tab-cancelled">
                  Cancelled ({cancelledBookings.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="text-center py-12 card-dashboard" data-testid="no-bookings">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No upcoming bookings</h3>
                    <p className="text-muted-foreground mb-4">Start planning your next trip!</p>
                    <Link to="/">
                      <Button className="btn-primary">Search Hotels</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map(booking => (
                      <BookingCard 
                        key={booking.booking_id} 
                        booking={booking}
                        onCancel={() => handleOpenCancelDialog(booking)}
                        showCancelButton={true}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="past">
                {pastBookings.length === 0 ? (
                  <div className="text-center py-12 card-dashboard">
                    <p className="text-muted-foreground">No past bookings</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastBookings.map(booking => (
                      <BookingCard key={booking.booking_id} booking={booking} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="cancelled">
                {cancelledBookings.length === 0 ? (
                  <div className="text-center py-12 card-dashboard">
                    <p className="text-muted-foreground">No cancelled bookings</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cancelledBookings.map(booking => (
                      <BookingCard key={booking.booking_id} booking={booking} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" />
              Rezervasyon İptali
            </DialogTitle>
            <DialogDescription>
              {selectedBooking?.booking_ref} numaralı rezervasyonunuzu iptal etmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          
          {cancellationInfo && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Giriş Tarihi:</span>
                  <span className="font-medium">{cancellationInfo.check_in}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Toplam Tutar:</span>
                  <span className="font-medium">₺{cancellationInfo.total_price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Girişe Kalan:</span>
                  <span className="font-medium">{cancellationInfo.days_until_checkin} gün</span>
                </div>
              </div>
              
              {cancellationInfo.refund_preview && (
                <div className={`rounded-lg p-4 ${
                  cancellationInfo.refund_preview.type === 'full' 
                    ? 'bg-emerald-50 border border-emerald-200' 
                    : cancellationInfo.refund_preview.type === 'partial'
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    cancellationInfo.refund_preview.type === 'full' 
                      ? 'text-emerald-700' 
                      : cancellationInfo.refund_preview.type === 'partial'
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }`}>
                    {cancellationInfo.refund_preview.message}
                  </p>
                  <div className="mt-2 space-y-1">
                    {cancellationInfo.refund_preview.refund_amount > 0 && (
                      <p className="text-sm text-emerald-600">
                        İade: ₺{cancellationInfo.refund_preview.refund_amount.toLocaleString()}
                      </p>
                    )}
                    {cancellationInfo.refund_preview.penalty_amount > 0 && (
                      <p className="text-sm text-red-600">
                        Ceza: ₺{cancellationInfo.refund_preview.penalty_amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Vazgeç
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelBooking}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  İptal Ediliyor...
                </>
              ) : (
                "Rezervasyonu İptal Et"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookingCard({ booking, onReviewSubmitted, onCancel, showCancelButton = false }) {
  const { t } = useLanguage();
  const StatusIcon = statusIcons[booking.status] || AlertCircle;
  const [hasReview, setHasReview] = useState(booking.hasReview || false);
  
  // Check if booking is reviewable (past checkout date, not cancelled)
  const isPastCheckout = new Date(booking.check_out) < new Date();
  const canReview = isPastCheckout && booking.status !== "cancelled" && !hasReview;
  
  const handleReviewSubmitted = () => {
    setHasReview(true);
    if (onReviewSubmitted) onReviewSubmitted();
  };
  
  return (
    <div className="card-dashboard overflow-hidden" data-testid={`booking-card-${booking.booking_id}`}>
      <div className="flex flex-col md:flex-row">
        <div className="p-6 flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-outfit font-semibold text-lg">{booking.hotel_name}</h3>
              <div className="text-sm text-muted-foreground">
                Booking ref: <span className="font-medium">{booking.booking_ref}</span>
              </div>
            </div>
            <Badge className={statusColors[booking.status]}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {booking.status}
            </Badge>
          </div>
          
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
              <div className="text-muted-foreground">Guests</div>
              <div className="font-medium">{booking.adults} adults</div>
            </div>
            <div>
              <div className="text-muted-foreground">Total</div>
              <div className="font-bold text-price">₺{booking.total_price?.toLocaleString()}</div>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 flex flex-col justify-center items-center gap-2 md:w-48">
          <Link to={`/confirmation/${booking.booking_id}`}>
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
          {showCancelButton && booking.status === "confirmed" && !isPastCheckout && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive hover:bg-red-50"
              onClick={onCancel}
            >
              <Ban className="w-4 h-4 mr-1" />
              İptal Et
            </Button>
          )}
          {canReview && (
            <WriteReviewDialog booking={booking} onReviewSubmitted={handleReviewSubmitted} />
          )}
          {hasReview && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <Star className="w-3 h-3 fill-emerald-600" /> Reviewed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
