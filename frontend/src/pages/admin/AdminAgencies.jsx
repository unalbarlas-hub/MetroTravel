import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Building2, Home, Search, CheckCircle, XCircle, 
  CreditCard, Percent, Loader2, Eye, Mail, Phone,
  MapPin, Calendar, Users, DollarSign, ChevronLeft, ChevronRight
} from "lucide-react";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-slate-100 text-slate-700",
};

const statusLabels = {
  pending: "Beklemede",
  approved: "Onaylı",
  rejected: "Reddedildi",
  suspended: "Askıda",
};

export default function AdminAgencies() {
  const { user, logout } = useAuth();
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showCommissionDialog, setShowCommissionDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creditForm, setCreditForm] = useState({ amount: "", type: "credit", description: "" });
  const [commissionForm, setCommissionForm] = useState({ commission_rate: "", markup_rate: "" });
  const limit = 20;

  useEffect(() => {
    loadAgencies();
  }, [page, statusFilter]);

  const loadAgencies = async () => {
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

      const res = await fetch(`${API}/agencies?${params}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        const data = await res.json();
        setAgencies(data.agencies || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Error loading agencies:", err);
      toast.error("Acentalar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (agencyId) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API}/admin/agencies/${agencyId}/approve`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include"
      });

      if (res.ok) {
        toast.success("Acenta onaylandı");
        loadAgencies();
      } else {
        toast.error("Onaylama başarısız");
      }
    } catch (err) {
      toast.error("Bağlantı hatası");
    }
  };

  const handleUpdateCredit = async () => {
    if (!creditForm.amount || isNaN(parseFloat(creditForm.amount))) {
      toast.error("Geçerli bir tutar girin");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const params = new URLSearchParams({
        amount: creditForm.amount,
        transaction_type: creditForm.type,
        description: creditForm.description || "Admin kredi işlemi"
      });

      const res = await fetch(`${API}/admin/agencies/${selectedAgency.agency_id}/credit?${params}`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include"
      });

      if (res.ok) {
        toast.success("Kredi güncellendi");
        setShowCreditDialog(false);
        setCreditForm({ amount: "", type: "credit", description: "" });
        loadAgencies();
      } else {
        const error = await res.json();
        toast.error(error.detail || "İşlem başarısız");
      }
    } catch (err) {
      toast.error("Bağlantı hatası");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCommission = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const params = new URLSearchParams({
        commission_rate: commissionForm.commission_rate || selectedAgency.commission_rate,
        markup_rate: commissionForm.markup_rate || selectedAgency.markup_rate || 0
      });

      const res = await fetch(`${API}/admin/agencies/${selectedAgency.agency_id}/commission?${params}`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include"
      });

      if (res.ok) {
        toast.success("Komisyon ayarları güncellendi");
        setShowCommissionDialog(false);
        loadAgencies();
      } else {
        const error = await res.json();
        toast.error(error.detail || "İşlem başarısız");
      }
    } catch (err) {
      toast.error("Bağlantı hatası");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  const filteredAgencies = agencies.filter(agency => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      agency.name?.toLowerCase().includes(query) ||
      agency.email?.toLowerCase().includes(query) ||
      agency.city?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(total / limit);

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
              <Badge className="bg-white/20 text-white">Admin Panel</Badge>
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

      {/* Sidebar & Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-64px)] bg-white border-r hidden lg:block">
          <nav className="p-4 space-y-1">
            <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-slate-50">
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            <Link to="/admin/hotels" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-slate-50">
              <Building2 className="w-5 h-5" />
              Oteller
            </Link>
            <Link to="/admin/users" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-slate-50">
              <Users className="w-5 h-5" />
              Kullanıcılar
            </Link>
            <Link to="/admin/bookings" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-slate-50">
              <Calendar className="w-5 h-5" />
              Rezervasyonlar
            </Link>
            <Link to="/admin/agencies" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-metro-navy/5 text-metro-navy font-medium">
              <Building2 className="w-5 h-5" />
              Acentalar
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="font-outfit font-bold text-2xl">Acenta Yönetimi</h1>
            <p className="text-muted-foreground">B2B acentaları yönetin</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Acenta ara..."
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
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="approved">Onaylı</SelectItem>
                <SelectItem value="suspended">Askıda</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agencies List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-metro-orange" />
            </div>
          ) : filteredAgencies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Acenta bulunamadı</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAgencies.map((agency) => (
                <Card key={agency.agency_id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Agency Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-metro-navy/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-metro-navy" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{agency.name}</span>
                              <Badge className={statusColors[agency.status]}>
                                {statusLabels[agency.status]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{agency.contact_person}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {agency.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {agency.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {agency.city}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span>
                            <strong>Kredi:</strong> {formatCurrency(agency.credit_balance)} / {formatCurrency(agency.credit_limit)}
                          </span>
                          <span>
                            <strong>Komisyon:</strong> %{agency.commission_rate}
                          </span>
                          <span>
                            <strong>Rezervasyon:</strong> {agency.total_bookings}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {agency.status === "pending" && (
                          <Button 
                            size="sm"
                            onClick={() => handleApprove(agency.agency_id)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Onayla
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedAgency(agency);
                            setCreditForm({ amount: "", type: "credit", description: "" });
                            setShowCreditDialog(true);
                          }}
                        >
                          <CreditCard className="w-4 h-4 mr-1" />
                          Kredi
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedAgency(agency);
                            setCommissionForm({ 
                              commission_rate: agency.commission_rate?.toString() || "10",
                              markup_rate: agency.markup_rate?.toString() || "0"
                            });
                            setShowCommissionDialog(true);
                          }}
                        >
                          <Percent className="w-4 h-4 mr-1" />
                          Komisyon
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedAgency(agency);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
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
            <div className="flex items-center justify-center gap-2 mt-6">
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
        </main>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedAgency?.name}</DialogTitle>
            <DialogDescription>Acenta detayları</DialogDescription>
          </DialogHeader>
          {selectedAgency && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Yetkili</p>
                  <p className="font-medium">{selectedAgency.contact_person}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">E-posta</p>
                  <p className="font-medium">{selectedAgency.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefon</p>
                  <p className="font-medium">{selectedAgency.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Şehir</p>
                  <p className="font-medium">{selectedAgency.city}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vergi No</p>
                  <p className="font-medium">{selectedAgency.tax_number || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Website</p>
                  <p className="font-medium">{selectedAgency.website || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kayıt Tarihi</p>
                  <p className="font-medium">{formatDate(selectedAgency.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Onay Tarihi</p>
                  <p className="font-medium">{formatDate(selectedAgency.approved_at)}</p>
                </div>
              </div>
              <hr />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Toplam Ciro</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedAgency.total_revenue)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Toplam Rezervasyon</p>
                  <p className="font-bold text-lg">{selectedAgency.total_bookings}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Credit Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kredi İşlemi</DialogTitle>
            <DialogDescription>{selectedAgency?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Mevcut Bakiye</p>
              <p className="text-2xl font-bold">{formatCurrency(selectedAgency?.credit_balance)}</p>
            </div>
            <div>
              <Label>İşlem Tipi</Label>
              <Select value={creditForm.type} onValueChange={(v) => setCreditForm({...creditForm, type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Kredi Yükle</SelectItem>
                  <SelectItem value="debit">Kredi Düş</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tutar (TRY)</Label>
              <Input
                type="number"
                value={creditForm.amount}
                onChange={(e) => setCreditForm({...creditForm, amount: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input
                value={creditForm.description}
                onChange={(e) => setCreditForm({...creditForm, description: e.target.value})}
                placeholder="İşlem açıklaması"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreditDialog(false)}>İptal</Button>
              <Button onClick={handleUpdateCredit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Uygula"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Commission Dialog */}
      <Dialog open={showCommissionDialog} onOpenChange={setShowCommissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Komisyon Ayarları</DialogTitle>
            <DialogDescription>{selectedAgency?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Komisyon Oranı (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={commissionForm.commission_rate}
                onChange={(e) => setCommissionForm({...commissionForm, commission_rate: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">Acentanın her rezervasyondan alacağı komisyon</p>
            </div>
            <div>
              <Label>Markup Oranı (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={commissionForm.markup_rate}
                onChange={(e) => setCommissionForm({...commissionForm, markup_rate: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">Acentanın fiyatlara ekleyebileceği markup</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCommissionDialog(false)}>İptal</Button>
              <Button onClick={handleUpdateCommission} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kaydet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
