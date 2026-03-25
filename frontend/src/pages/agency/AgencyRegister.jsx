import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, ArrowLeft, Check, Loader2 } from "lucide-react";

export default function AgencyRegister() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    country: "Turkey",
    tax_number: "",
    website: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.contact_person || !formData.email || !formData.phone || !formData.city) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API}/agencies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Acenta başvurunuz alındı! Onay sonrası bilgilendirileceksiniz.");
        navigate("/agency");
        // Refresh page to update user role
        window.location.reload();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Başvuru gönderilemedi");
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-metro-navy text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-metro-orange flex items-center justify-center">
                <span className="font-outfit font-bold text-xl text-white">M</span>
              </div>
              <span className="font-outfit font-bold text-xl">Metro Travel</span>
            </Link>
            <Link to="/agency">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto bg-metro-orange/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-metro-orange" />
            </div>
            <CardTitle className="text-2xl">Acenta Başvurusu</CardTitle>
            <CardDescription>
              B2B platformumuza katılmak için aşağıdaki formu doldurun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Şirket Bilgileri
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name">Acenta / Şirket Adı *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Örn: ABC Turizm"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tax_number">Vergi No</Label>
                    <Input
                      id="tax_number"
                      value={formData.tax_number}
                      onChange={(e) => setFormData({...formData, tax_number: e.target.value})}
                      placeholder="1234567890"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  İletişim Bilgileri
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_person">Yetkili Kişi *</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                      placeholder="Ad Soyad"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">E-posta *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="ornek@firma.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+90 5XX XXX XXXX"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="city">Şehir *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="İstanbul"
                      required
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <Label htmlFor="address">Adres</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Mahalle, Sokak, No, İlçe"
                    />
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-sm">Acenta Avantajları</h3>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Özel B2B fiyatları</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>%10+ komisyon oranı</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Kredi limiti</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Alt kullanıcı ekleme</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>7/24 destek</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Detaylı raporlama</span>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-metro-orange hover:bg-metro-orange/90"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  "Başvuruyu Gönder"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Başvurunuz onaylandıktan sonra B2B panelinize erişebileceksiniz.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
