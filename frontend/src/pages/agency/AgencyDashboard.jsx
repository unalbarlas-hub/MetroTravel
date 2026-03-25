import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, Plus, Users, CreditCard, TrendingUp, 
  Calendar, DollarSign, ArrowRight, Home, Settings,
  Wallet, FileText, UserPlus, Clock
} from "lucide-react";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-slate-100 text-slate-700",
};

const statusLabels = {
  pending: "Onay Bekliyor",
  approved: "Onaylı",
  rejected: "Reddedildi",
  suspended: "Askıya Alındı",
};

export default function AgencyDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      
      // If user is not agency_owner, show registration prompt
      if (user?.role !== "agency_owner" && user?.role !== "admin") {
        setLoading(false);
        return;
      }
      
      const agencyId = user?.agency_id;
      if (!agencyId) {
        setLoading(false);
        return;
      }
      
      const res = await fetch(`${API}/agencies/${agencyId}/dashboard`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      } else {
        setError("Dashboard verileri yüklenemedi");
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  // Show registration prompt for non-agency users
  if (!loading && (!user?.agency_id || (user?.role !== "agency_owner" && user?.role !== "admin"))) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AgencyHeader user={user} logout={logout} />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <Building2 className="w-16 h-16 mx-auto text-metro-orange mb-4" />
              <CardTitle className="text-2xl">B2B Acenta Paneline Hoş Geldiniz</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-muted-foreground">
                Metro Travel B2B platformuna katılarak otellerimize özel fiyatlarla erişin, 
                kredi sistemiyle rezervasyon yapın ve komisyon kazanın.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <DollarSign className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                  <span className="font-medium text-emerald-700">%10+ Komisyon</span>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <CreditCard className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <span className="font-medium text-blue-700">Kredi Sistemi</span>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <Users className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                  <span className="font-medium text-purple-700">Alt Kullanıcı</span>
                </div>
              </div>
              <Button 
                onClick={() => navigate("/agency/register")} 
                className="bg-metro-orange hover:bg-metro-orange/90"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Acenta Başvurusu Yap
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-metro-orange"></div>
      </div>
    );
  }

  const { agency, stats, recent_bookings } = dashboardData || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <AgencyHeader user={user} logout={logout} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Agency Status Banner */}
        {agency?.status === "pending" && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Başvurunuz İnceleniyor</p>
              <p className="text-sm text-amber-600">Acenta başvurunuz admin tarafından incelenmektedir. Onay sonrası tüm özelliklere erişebileceksiniz.</p>
            </div>
          </div>
        )}

        {agency?.status === "suspended" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-medium text-red-800">Hesabınız askıya alındı</p>
            <p className="text-sm text-red-600">Detaylar için lütfen destek ekibiyle iletişime geçin.</p>
          </div>
        )}

        {/* Welcome & Agency Info */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-outfit font-bold text-2xl text-foreground">
              Hoş geldiniz, {user?.name?.split(" ")[0]}!
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground">{agency?.name}</span>
              <Badge className={statusColors[agency?.status]}>
                {statusLabels[agency?.status]}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/agency/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Ayarlar
            </Button>
            <Button 
              onClick={() => navigate("/agency/bookings/new")} 
              className="bg-metro-orange hover:bg-metro-orange/90"
              disabled={agency?.status !== "approved"}
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Rezervasyon
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kredi Limiti</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats?.credit_limit)}</p>
                </div>
                <Wallet className="w-10 h-10 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kullanılabilir</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats?.credit_balance)}</p>
                </div>
                <CreditCard className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Rezervasyon</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.total_bookings || 0}</p>
                </div>
                <Calendar className="w-10 h-10 text-slate-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Ciro</p>
                  <p className="text-2xl font-bold text-metro-orange">{formatCurrency(stats?.total_revenue)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Commission Info */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link 
                  to="/agency/bookings"
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Rezervasyonlar</p>
                    <p className="text-sm text-muted-foreground">{stats?.confirmed_bookings} aktif</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground" />
                </Link>

                <Link 
                  to="/agency/users"
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Kullanıcılar</p>
                    <p className="text-sm text-muted-foreground">{stats?.user_count} kişi</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground" />
                </Link>

                <Link 
                  to="/agency/transactions"
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">Kredi İşlemleri</p>
                    <p className="text-sm text-muted-foreground">Bakiye: {formatCurrency(stats?.credit_balance)}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground" />
                </Link>

                <Link 
                  to="/search"
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Otel Ara</p>
                    <p className="text-sm text-muted-foreground">Yeni rezervasyon oluştur</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Commission Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Komisyon Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <span className="text-sm text-emerald-700">Komisyon Oranı</span>
                <span className="font-bold text-emerald-600">%{agency?.commission_rate || 10}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">Markup Oranı</span>
                <span className="font-bold text-blue-600">%{agency?.markup_rate || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-700">Toplam Komisyon</span>
                <span className="font-bold text-purple-600">{formatCurrency(stats?.total_commission)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Son Rezervasyonlar</CardTitle>
            <Link to="/agency/bookings">
              <Button variant="ghost" size="sm">
                Tümünü Gör <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recent_bookings?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b">
                      <th className="pb-3">Referans</th>
                      <th className="pb-3">Otel</th>
                      <th className="pb-3">Tarih</th>
                      <th className="pb-3">Tutar</th>
                      <th className="pb-3">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent_bookings.map((booking) => (
                      <tr key={booking.booking_id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{booking.booking_ref}</td>
                        <td className="py-3">{booking.hotel_name}</td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {booking.check_in} - {booking.check_out}
                        </td>
                        <td className="py-3">{formatCurrency(booking.total_price)}</td>
                        <td className="py-3">
                          <Badge className={
                            booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                            booking.status === "cancelled" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }>
                            {booking.status === "confirmed" ? "Onaylı" :
                             booking.status === "cancelled" ? "İptal" : "Beklemede"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Henüz rezervasyon bulunmuyor</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AgencyHeader({ user, logout }) {
  return (
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
            <span className="text-white/80 hidden sm:inline">{user?.name}</span>
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={logout}>
              Çıkış
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
