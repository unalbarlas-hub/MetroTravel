import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Settings, Home, ArrowLeft, Building2, Mail, Phone,
  MapPin, Globe, FileText, Loader2, Save, Shield
} from "lucide-react";

export default function AgencySettings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agency, setAgency] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Turkey",
    tax_number: "",
    website: ""
  });

  const agencyId = user?.agency_id;

  useEffect(() => {
    if (agencyId) {
      loadAgency();
    }
  }, [agencyId]);

  const loadAgency = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API}/agencies/${agencyId}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        const data = await res.json();
        setAgency(data);
        setFormData({
          name: data.name || "",
          contact_person: data.contact_person || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          country: data.country || "Turkey",
          tax_number: data.tax_number || "",
          website: data.website || ""
        });
      }
    } catch (err) {
      console.error("Error loading agency:", err);
      toast.error("Acenta bilgileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API}/agencies/${agencyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Bilgiler güncellendi");
        loadAgency();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Güncelleme başarısız");
      }
    } catch (err) {
      toast.error("Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  };

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

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
            <h1 className="font-outfit font-bold text-2xl">Acenta Ayarları</h1>
            <p className="text-muted-foreground">Şirket bilgilerini yönetin</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-metro-orange" />
          </div>
        ) : (
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
              <TabsTrigger value="financial">Finansal</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Şirket Bilgileri</CardTitle>
                      <CardDescription>Acenta profil bilgilerinizi güncelleyin</CardDescription>
                    </div>
                    <Badge className={statusColors[agency?.status]}>
                      {statusLabels[agency?.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="name">Acenta / Şirket Adı</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="contact_person">Yetkili Kişi</Label>
                      <Input
                        id="contact_person"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">E-posta</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Telefon</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="city">Şehir</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <Label htmlFor="address">Adres</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="tax_number">Vergi No</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="tax_number"
                          value={formData.tax_number}
                          onChange={(e) => setFormData({...formData, tax_number: e.target.value})}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({...formData, website: e.target.value})}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Kaydet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Komisyon Ayarları</CardTitle>
                    <CardDescription>Admin tarafından belirlenir</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                      <span className="text-emerald-700">Komisyon Oranı</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        %{agency?.commission_rate || 10}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <span className="text-blue-700">Markup Oranı</span>
                      <span className="text-2xl font-bold text-blue-600">
                        %{agency?.markup_rate || 0}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Komisyon ve markup oranları admin tarafından belirlenir. Değişiklik talebi için destek ekibiyle iletişime geçin.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Kredi Durumu</CardTitle>
                    <CardDescription>Mevcut kredi bilgileri</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <span>Kredi Limiti</span>
                      <span className="text-xl font-bold">
                        {formatCurrency(agency?.credit_limit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <span>Kullanılabilir</span>
                      <span className="text-xl font-bold text-emerald-600">
                        {formatCurrency(agency?.credit_balance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <span>Kullanılan</span>
                      <span className="text-xl font-bold text-amber-600">
                        {formatCurrency(agency?.credit_used)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Hesap Güvenliği
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Şifre Değiştir</p>
                        <p className="text-sm text-muted-foreground">
                          Hesap güvenliğiniz için şifrenizi düzenli olarak güncelleyin
                        </p>
                      </div>
                      <Button variant="outline">Şifre Değiştir</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
