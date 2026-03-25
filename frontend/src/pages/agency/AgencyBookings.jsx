import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, Home, ArrowLeft, Search, Calendar, 
  Building2, Users, Loader2, ChevronLeft, ChevronRight, Eye
} from "lucide-react";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
  no_show: "bg-slate-100 text-slate-700",
};

const statusLabels = {
  pending: "Beklemede",
  confirmed: "Onaylı",
  cancelled: "İptal",
  completed: "Tamamlandı",
  no_show: "Gelmedi",
};

export default function AgencyBookings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 20;

  const agencyId = user?.agency_id;

  useEffect(() => {
    if (agencyId) {
      loadBookings();
    }
  }, [agencyId, page, statusFilter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const res = await fetch(`${API}/agencies/${agencyId}/bookings?${params}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredBookings = bookings.filter(booking => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.booking_ref?.toLowerCase().includes(query) ||
      booking.hotel_name?.toLowerCase().includes(query) ||
      booking.guest_info?.first_name?.toLowerCase().includes(query) ||
      booking.guest_info?.last_name?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(total / limit);

  if (!agencyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p>Acenta bilgisi bulunamadı</p>
      </div>
    );
  }

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
              <Badge className="bg-white/20 text-white">B2B Panel</Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <Home className="w-4 h-4 mr-2" />
                  Ana Site
                </Button>
              </Link>
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={logout}>
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Back & Title */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/agency")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-outfit font-bold text-2xl">Rezervasyonlar</h1>
            <p className="text-muted-foreground">Toplam {total} rezervasyon</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Referans, otel veya misafir ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tüm Durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="confirmed">Onaylı</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="cancelled">İptal</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-metro-orange" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Rezervasyon bulunamadı</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.booking_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Main Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-lg">{booking.booking_ref}</span>
                        <Badge className={statusColors[booking.status]}>
                          {statusLabels[booking.status]}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        <span>{booking.hotel_name}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {booking.adults} Yetişkin{booking.children > 0 && `, ${booking.children} Çocuk`}
                        </span>
                      </div>

                      {booking.guest_info && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Misafir:</span>{" "}
                          {booking.guest_info.first_name} {booking.guest_info.last_name}
                        </p>
                      )}
                    </div>

                    {/* Price & Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-metro-orange">
                          {formatCurrency(booking.total_price)}
                        </p>
                        {booking.commission_amount > 0 && (
                          <p className="text-sm text-emerald-600">
                            +{formatCurrency(booking.commission_amount)} komisyon
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Detay
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Sayfa {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
