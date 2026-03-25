import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Shield, Home, Plus, Ticket, Search, Trash2, Edit, 
  Check, X, Calendar, Percent, DollarSign, Tag
} from "lucide-react";

export default function AdminCoupons() {
  const { user, logout } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    description_tr: "",
    description_en: "",
    coupon_type: "percentage",
    value: "",
    min_order_amount: "0",
    max_discount: "",
    usage_limit: "",
    per_user_limit: "1",
    valid_from: "",
    valid_until: "",
    first_booking_only: false
  });

  useEffect(() => {
    loadCoupons();
  }, [statusFilter]);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      let url = `${API}/coupons?limit=100`;
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error("Error loading coupons:", error);
      toast.error("Kuponlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.value || !formData.valid_from || !formData.valid_until) {
      toast.error("Lütfen zorunlu alanları doldurun.");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const payload = {
        code: formData.code.toUpperCase(),
        description: {
          tr: formData.description_tr || formData.code,
          en: formData.description_en || formData.code
        },
        coupon_type: formData.coupon_type,
        value: parseFloat(formData.value),
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        per_user_limit: parseInt(formData.per_user_limit) || 1,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        first_booking_only: formData.first_booking_only
      };

      const response = await fetch(`${API}/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success("Kupon oluşturuldu!");
        setShowCreateDialog(false);
        resetForm();
        loadCoupons();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Kupon oluşturulamadı.");
      }
    } catch (error) {
      console.error("Create coupon error:", error);
      toast.error("Sunucu hatası.");
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm("Bu kuponu devre dışı bırakmak istediğinize emin misiniz?")) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API}/coupons/${couponId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });

      if (response.ok) {
        toast.success("Kupon devre dışı bırakıldı.");
        loadCoupons();
      } else {
        toast.error("İşlem başarısız.");
      }
    } catch (error) {
      console.error("Delete coupon error:", error);
      toast.error("Sunucu hatası.");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description_tr: "",
      description_en: "",
      coupon_type: "percentage",
      value: "",
      min_order_amount: "0",
      max_discount: "",
      usage_limit: "",
      per_user_limit: "1",
      valid_from: "",
      valid_until: "",
      first_booking_only: false
    });
    setEditingCoupon(null);
  };

  const filteredCoupons = coupons.filter(coupon => 
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">Aktif</span>;
      case "expired":
        return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">Süresi Dolmuş</span>;
      case "disabled":
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Devre Dışı</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-metro-orange flex items-center justify-center">
                  <Shield className="w-6 h-6 text-slate-900" />
                </div>
                <span className="font-outfit font-bold text-xl">Admin Panel</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <Home className="w-4 h-4 mr-2" />
                  Ana Sayfa
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

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-6 overflow-x-auto">
            <Link to="/admin" className="py-4 text-muted-foreground hover:text-foreground whitespace-nowrap">
              Dashboard
            </Link>
            <Link to="/admin/hotels" className="py-4 text-muted-foreground hover:text-foreground whitespace-nowrap">
              Oteller
            </Link>
            <Link to="/admin/users" className="py-4 text-muted-foreground hover:text-foreground whitespace-nowrap">
              Kullanıcılar
            </Link>
            <Link to="/admin/bookings" className="py-4 text-muted-foreground hover:text-foreground whitespace-nowrap">
              Rezervasyonlar
            </Link>
            <Link to="/admin/agencies" className="py-4 text-muted-foreground hover:text-foreground whitespace-nowrap">
              Acentalar
            </Link>
            <Link to="/admin/coupons" className="py-4 border-b-2 border-slate-900 font-medium whitespace-nowrap">
              Kuponlar
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-outfit font-bold text-2xl flex items-center gap-2">
              <Ticket className="w-6 h-6 text-metro-orange" />
              Kupon Yönetimi
            </h1>
            <p className="text-muted-foreground mt-1">İndirim kuponlarını oluşturun ve yönetin.</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="btn-accent" data-testid="create-coupon-btn">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Kupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Kupon Oluştur</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCoupon} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="code">Kupon Kodu *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="YILBASI20"
                      className="mt-1 uppercase"
                      required
                      data-testid="input-code"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description_tr">Açıklama (TR)</Label>
                    <Input
                      id="description_tr"
                      value={formData.description_tr}
                      onChange={(e) => setFormData({...formData, description_tr: e.target.value})}
                      placeholder="Yılbaşı indirimi"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description_en">Açıklama (EN)</Label>
                    <Input
                      id="description_en"
                      value={formData.description_en}
                      onChange={(e) => setFormData({...formData, description_en: e.target.value})}
                      placeholder="New Year discount"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="coupon_type">İndirim Tipi *</Label>
                    <Select 
                      value={formData.coupon_type} 
                      onValueChange={(v) => setFormData({...formData, coupon_type: v})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Yüzde (%)</SelectItem>
                        <SelectItem value="fixed_amount">Sabit Tutar (₺)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="value">
                      İndirim Değeri * {formData.coupon_type === "percentage" ? "(%)" : "(₺)"}
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                      placeholder={formData.coupon_type === "percentage" ? "20" : "100"}
                      className="mt-1"
                      required
                      min="0"
                      data-testid="input-value"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="min_order_amount">Min. Sipariş Tutarı (₺)</Label>
                    <Input
                      id="min_order_amount"
                      type="number"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData({...formData, min_order_amount: e.target.value})}
                      placeholder="500"
                      className="mt-1"
                      min="0"
                    />
                  </div>
                  
                  {formData.coupon_type === "percentage" && (
                    <div>
                      <Label htmlFor="max_discount">Maks. İndirim (₺)</Label>
                      <Input
                        id="max_discount"
                        type="number"
                        value={formData.max_discount}
                        onChange={(e) => setFormData({...formData, max_discount: e.target.value})}
                        placeholder="200"
                        className="mt-1"
                        min="0"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="usage_limit">Toplam Kullanım Limiti</Label>
                    <Input
                      id="usage_limit"
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                      placeholder="Sınırsız"
                      className="mt-1"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="per_user_limit">Kullanıcı Başı Limit</Label>
                    <Input
                      id="per_user_limit"
                      type="number"
                      value={formData.per_user_limit}
                      onChange={(e) => setFormData({...formData, per_user_limit: e.target.value})}
                      placeholder="1"
                      className="mt-1"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="valid_from">Başlangıç Tarihi *</Label>
                    <Input
                      id="valid_from"
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                      className="mt-1"
                      required
                      data-testid="input-valid-from"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="valid_until">Bitiş Tarihi *</Label>
                    <Input
                      id="valid_until"
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                      className="mt-1"
                      required
                      data-testid="input-valid-until"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.first_booking_only}
                        onChange={(e) => setFormData({...formData, first_booking_only: e.target.checked})}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm">Sadece ilk rezervasyonlarda geçerli</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    İptal
                  </Button>
                  <Button type="submit" className="btn-accent" data-testid="submit-coupon-btn">
                    Kupon Oluştur
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Kupon kodu ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="expired">Süresi Dolmuş</SelectItem>
              <SelectItem value="disabled">Devre Dışı</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Coupons List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Henüz kupon oluşturulmamış.</p>
            <Button className="mt-4 btn-accent" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              İlk Kuponu Oluştur
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="coupons-table">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Kod</th>
                    <th className="text-left px-4 py-3 font-medium">İndirim</th>
                    <th className="text-left px-4 py-3 font-medium">Geçerlilik</th>
                    <th className="text-left px-4 py-3 font-medium">Kullanım</th>
                    <th className="text-left px-4 py-3 font-medium">Durum</th>
                    <th className="text-right px-4 py-3 font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon.coupon_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-metro-orange" />
                          <span className="font-mono font-semibold">{coupon.code}</span>
                        </div>
                        {coupon.description?.tr && (
                          <p className="text-sm text-muted-foreground">{coupon.description.tr}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {coupon.coupon_type === "percentage" ? (
                            <>
                              <Percent className="w-4 h-4 text-emerald-600" />
                              <span className="font-semibold text-emerald-600">%{coupon.value}</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 text-emerald-600" />
                              <span className="font-semibold text-emerald-600">₺{coupon.value}</span>
                            </>
                          )}
                        </div>
                        {coupon.min_order_amount > 0 && (
                          <p className="text-xs text-muted-foreground">Min: ₺{coupon.min_order_amount}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {coupon.valid_from}
                          </div>
                          <div className="text-muted-foreground">→ {coupon.valid_until}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{coupon.usage_count}</span>
                        <span className="text-muted-foreground">
                          {coupon.usage_limit ? ` / ${coupon.usage_limit}` : " (sınırsız)"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(coupon.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteCoupon(coupon.coupon_id)}
                          disabled={coupon.status === "disabled"}
                          data-testid={`delete-coupon-${coupon.coupon_id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
