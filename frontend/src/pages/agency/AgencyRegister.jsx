import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Building2, ArrowLeft, Check, Loader2, Mail, Phone, MapPin, 
  Globe, FileText, Shield, Users, Zap, Clock, Headphones,
  TrendingUp, Award, ChevronRight
} from "lucide-react";

const benefits = [
  { icon: Zap, text: "Anında Onaylı Rezervasyonlar", desc: "Beklemeden onay alın" },
  { icon: TrendingUp, text: "Özel B2B Komisyon Oranları", desc: "%10 - %20 arası" },
  { icon: Headphones, text: "7/24 VIP Acenta Desteği", desc: "Öncelikli destek hattı" },
  { icon: Shield, text: "Güvenli Ödeme Sistemi", desc: "Kredi limiti ile çalışın" },
];

const stats = [
  { value: "2,500+", label: "Otel & Tesis" },
  { value: "500+", label: "Aktif Acenta" },
  { value: "₺50M+", label: "Aylık İşlem" },
];

export default function AgencyRegister() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
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
        toast.success("Başvurunuz alındı! En kısa sürede sizinle iletişime geçeceğiz.");
        navigate("/agency");
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

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStep1Valid = formData.name && formData.tax_number;
  const isStep2Valid = formData.contact_person && formData.email && formData.phone;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      {/* Left Pane - Hero Section */}
      <div 
        className="relative hidden lg:flex flex-col justify-between overflow-hidden text-white"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(13, 26, 48, 0.85), rgba(13, 26, 48, 0.95)), url('https://images.pexels.com/photos/7413999/pexels-photo-7413999.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="p-12 lg:p-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-xl bg-metro-orange flex items-center justify-center">
              <span className="font-outfit font-bold text-2xl text-white">M</span>
            </div>
            <span className="font-outfit font-bold text-2xl">Metro Travel</span>
          </Link>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h1 className="font-outfit text-4xl lg:text-5xl font-bold leading-tight mb-4">
                Türkiye'nin Lider B2B<br />Turizm Ağına Katılın
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed max-w-lg">
                Binlerce otel, transfer ve tur seçeneğiyle acentanızın gücüne güç katın. 
                Özel B2B fiyatları ve kredi sistemiyle daha fazla kazanın.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4 mt-12">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-metro-orange/20 transition-colors">
                    <benefit.icon className="w-5 h-5 text-metro-orange" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{benefit.text}</p>
                    <p className="text-sm text-slate-400">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="p-12 lg:p-16 border-t border-white/10">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="font-outfit text-3xl font-bold text-metro-orange">{stat.value}</p>
                <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Pane - Form Section */}
      <div className="bg-white flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-metro-navy text-white p-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-metro-orange flex items-center justify-center">
                <span className="font-outfit font-bold text-xl text-white">M</span>
              </div>
              <span className="font-outfit font-bold text-xl">Metro Travel</span>
            </Link>
            <Link to="/agency">
              <Button variant="ghost" className="text-white hover:bg-white/10" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Geri
              </Button>
            </Link>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-16 overflow-y-auto">
          <div className="w-full max-w-md">
            {/* Back Button (Desktop) */}
            <Link to="/agency" className="hidden lg:inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              B2B Panele Dön
            </Link>

            {/* Form Header */}
            <div className="mb-8">
              <h2 className="font-outfit text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
                Acenta Başvurusu
              </h2>
              <p className="text-slate-500">
                Formu doldurun, 24 saat içinde sizinle iletişime geçelim.
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step > s ? 'bg-emerald-500 text-white' : 
                    step === s ? 'bg-metro-orange text-white' : 
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`flex-1 h-1 rounded ${step > s ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Company Info */}
              {step === 1 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300" data-testid="agency-step-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                      Acenta / Şirket Adı <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="name"
                        data-testid="agency-name-input"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Örn: ABC Turizm Ltd. Şti."
                        className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-metro-orange/20 focus:border-metro-orange"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tax_number" className="text-sm font-medium text-slate-700">
                      Vergi No <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="tax_number"
                        data-testid="agency-tax-input"
                        value={formData.tax_number}
                        onChange={(e) => updateField('tax_number', e.target.value)}
                        placeholder="1234567890"
                        className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-metro-orange/20 focus:border-metro-orange"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="website" className="text-sm font-medium text-slate-700">
                      Website <span className="text-slate-400 text-xs">(Opsiyonel)</span>
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="website"
                        data-testid="agency-website-input"
                        type="url"
                        value={formData.website}
                        onChange={(e) => updateField('website', e.target.value)}
                        placeholder="https://example.com"
                        className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-metro-orange/20 focus:border-metro-orange"
                      />
                    </div>
                  </div>

                  <Button 
                    type="button"
                    data-testid="agency-step-1-next"
                    onClick={() => setStep(2)}
                    disabled={!isStep1Valid}
                    className="w-full h-12 bg-metro-orange hover:bg-metro-orange/90 text-white font-medium mt-4"
                  >
                    Devam Et
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Step 2: Contact Info */}
              {step === 2 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300" data-testid="agency-step-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact_person" className="text-sm font-medium text-slate-700">
                      Yetkili Kişi <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="contact_person"
                        data-testid="agency-contact-input"
                        value={formData.contact_person}
                        onChange={(e) => updateField('contact_person', e.target.value)}
                        placeholder="Ad Soyad"
                        className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-metro-orange/20 focus:border-metro-orange"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                      E-posta <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="email"
                        data-testid="agency-email-input"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="ornek@firma.com"
                        className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-metro-orange/20 focus:border-metro-orange"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                      Telefon <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="phone"
                        data-testid="agency-phone-input"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="+90 5XX XXX XXXX"
                        className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-metro-orange/20 focus:border-metro-orange"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-12"
                    >
                      Geri
                    </Button>
                    <Button 
                      type="button"
                      data-testid="agency-step-2-next"
                      onClick={() => setStep(3)}
                      disabled={!isStep2Valid}
                      className="flex-1 h-12 bg-metro-orange hover:bg-metro-orange/90 text-white font-medium"
                    >
                      Devam Et
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Location Info */}
              {step === 3 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300" data-testid="agency-step-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                      Şehir <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="city"
                        data-testid="agency-city-input"
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="İstanbul"
                        className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-metro-orange/20 focus:border-metro-orange"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                      Adres <span className="text-slate-400 text-xs">(Opsiyonel)</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                      <textarea
                        id="address"
                        data-testid="agency-address-input"
                        value={formData.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        placeholder="Mahalle, Sokak, No, İlçe"
                        rows={3}
                        className="w-full pl-12 pt-3 pr-4 pb-3 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-2 focus:ring-metro-orange/20 focus:border-metro-orange resize-none"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-slate-700">Başvuru Özeti</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-400">Şirket</p>
                        <p className="font-medium text-slate-700">{formData.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Yetkili</p>
                        <p className="font-medium text-slate-700">{formData.contact_person || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">E-posta</p>
                        <p className="font-medium text-slate-700">{formData.email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Şehir</p>
                        <p className="font-medium text-slate-700">{formData.city || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="flex-1 h-12"
                    >
                      Geri
                    </Button>
                    <Button 
                      type="submit"
                      data-testid="agency-submit-btn"
                      disabled={loading || !formData.city}
                      className="flex-1 h-12 bg-metro-orange hover:bg-metro-orange/90 text-white font-medium"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Başvuruyu Gönder
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>

            {/* Trust Badges */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-center gap-6 text-slate-400">
                <div className="flex items-center gap-2 text-xs">
                  <Shield className="w-4 h-4" />
                  <span>256-bit SSL</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Award className="w-4 h-4" />
                  <span>TÜRSAB Üyesi</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-4 h-4" />
                  <span>24 Saat Onay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
