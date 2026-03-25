import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Hotel, ArrowLeft, Check, Loader2, MapPin, Globe, Star,
  Image, Shield, Clock, Award, ChevronRight, ChevronLeft, Upload,
  Wifi, Car, Utensils, Waves, Dumbbell, Coffee, PawPrint, Sparkles,
  Plane, Baby, Users, X
} from "lucide-react";

const propertyTypes = [
  { value: "hotel", label: "Otel" },
  { value: "resort", label: "Resort" },
  { value: "boutique_hotel", label: "Butik Otel" },
  { value: "apart_hotel", label: "Apart Otel" },
  { value: "villa", label: "Villa" },
  { value: "hostel", label: "Hostel" },
  { value: "pension", label: "Pansiyon" },
  { value: "guest_house", label: "Misafirhane" },
];

const cities = [
  "İstanbul", "Antalya", "İzmir", "Ankara", "Muğla", "Bursa", "Aydın",
  "Trabzon", "Nevşehir", "Denizli", "Mersin", "Adana", "Konya", "Eskişehir",
  "Kayseri", "Gaziantep", "Şanlıurfa", "Diyarbakır", "Samsun", "Çanakkale"
];

const amenityOptions = [
  { id: "wifi", icon: Wifi, label: "Ücretsiz Wi-Fi" },
  { id: "parking", icon: Car, label: "Ücretsiz Otopark" },
  { id: "restaurant", icon: Utensils, label: "Restoran" },
  { id: "pool", icon: Waves, label: "Yüzme Havuzu" },
  { id: "gym", icon: Dumbbell, label: "Fitness Merkezi" },
  { id: "spa", icon: Sparkles, label: "SPA & Wellness" },
  { id: "breakfast", icon: Coffee, label: "Kahvaltı Dahil" },
  { id: "airport_transfer", icon: Plane, label: "Havalimanı Transferi" },
  { id: "pet_friendly", icon: PawPrint, label: "Evcil Hayvan Kabul" },
  { id: "family_rooms", icon: Baby, label: "Aile Odaları" },
  { id: "meeting_rooms", icon: Users, label: "Toplantı Salonları" },
  { id: "room_service", icon: Clock, label: "24 Saat Oda Servisi" },
];

const stepLabels = [
  "Temel Bilgiler",
  "Konum & Açıklama", 
  "Özellikler",
  "Fotoğraflar"
];

export default function HotelRegister() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: "",
    name_tr: "",
    property_type: "",
    star_rating: "",
    
    // Step 2: Location & Description
    city: "",
    district: "",
    street_address: "",
    postal_code: "",
    description: "",
    description_tr: "",
    
    // Step 3: Amenities & Policies
    amenities: [],
    check_in_time: "14:00",
    check_out_time: "12:00",
    
    // Step 4: Photos
    images: [],
    
    // Contact
    contact_email: user?.email || "",
    contact_phone: "",
    website: ""
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenityId) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImages(true);
    const newImages = [];

    for (const file of files.slice(0, 10 - formData.images.length)) {
      try {
        const token = localStorage.getItem("auth_token");
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const res = await fetch(`${API}/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
          body: uploadFormData
        });

        if (res.ok) {
          const data = await res.json();
          newImages.push(data.url);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
    setUploadingImages(false);

    if (newImages.length > 0) {
      toast.success(`${newImages.length} fotoğraf yüklendi`);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.property_type || !formData.city) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      
      const hotelData = {
        name: formData.name,
        name_translations: {
          en: formData.name,
          tr: formData.name_tr || formData.name,
          de: formData.name
        },
        property_type: formData.property_type,
        star_rating: parseInt(formData.star_rating) || 3,
        description: formData.description,
        description_translations: {
          en: formData.description,
          tr: formData.description_tr || formData.description,
          de: formData.description
        },
        city: formData.city,
        district: formData.district,
        street_address: formData.street_address,
        postal_code: formData.postal_code,
        country: "Turkey",
        amenities: formData.amenities,
        check_in_time: formData.check_in_time,
        check_out_time: formData.check_out_time,
        images: formData.images,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website: formData.website
      };

      const res = await fetch(`${API}/hotels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify(hotelData)
      });

      if (res.ok) {
        toast.success("Tesisiniz başarıyla kaydedildi! Onay sürecine alındı.");
        navigate("/extranet");
      } else {
        const error = await res.json();
        toast.error(error.detail || "Kayıt başarısız");
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = formData.name && formData.property_type && formData.star_rating;
  const isStep2Valid = formData.city && formData.description;
  const isStep3Valid = formData.amenities.length >= 3;

  const canProceed = () => {
    if (step === 1) return isStep1Valid;
    if (step === 2) return isStep2Valid;
    if (step === 3) return isStep3Valid;
    return true;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      {/* Left Pane - Hero Section */}
      <div 
        className="relative hidden lg:flex flex-col justify-between overflow-hidden text-white"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(13, 26, 48, 0.80), rgba(13, 26, 48, 0.92)), url('https://images.pexels.com/photos/14442396/pexels-photo-14442396.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920')`,
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
                Tesisinizi Milyonlarca<br />Gezgine Açın
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed max-w-lg">
                Metro Travel güvencesiyle doluluk oranlarınızı artırın. 
                100'den fazla ülkeden gelen misafirlerle tanışın.
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                <p className="font-outfit text-3xl font-bold text-metro-orange">+50%</p>
                <p className="text-sm text-slate-400 mt-1">Doluluk Artışı</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                <p className="font-outfit text-3xl font-bold text-metro-orange">100+</p>
                <p className="text-sm text-slate-400 mt-1">Ülke Erişimi</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                <p className="font-outfit text-3xl font-bold text-metro-orange">%0</p>
                <p className="text-sm text-slate-400 mt-1">Kayıt Ücreti</p>
              </div>
            </div>

            {/* Step Progress */}
            <div className="mt-12 space-y-4">
              <p className="text-sm text-slate-400 uppercase tracking-wider">Kayıt Adımları</p>
              <div className="space-y-3">
                {stepLabels.map((label, idx) => (
                  <div key={idx} className={`flex items-center gap-3 transition-opacity ${step > idx + 1 ? 'opacity-50' : step === idx + 1 ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step > idx + 1 ? 'bg-emerald-500 text-white' : 
                      step === idx + 1 ? 'bg-metro-orange text-white' : 
                      'bg-white/10 text-white/50'
                    }`}>
                      {step > idx + 1 ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={step === idx + 1 ? 'font-medium' : ''}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-12 lg:p-16 border-t border-white/10">
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Güvenli Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>24 Saat Onay</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>TÜRSAB Üyesi</span>
            </div>
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
            <Link to="/extranet">
              <Button variant="ghost" className="text-white hover:bg-white/10" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Geri
              </Button>
            </Link>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-start justify-center p-6 md:p-12 lg:p-16 overflow-y-auto">
          <div className="w-full max-w-lg">
            {/* Back Button (Desktop) */}
            <Link to="/extranet" className="hidden lg:inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Extranet'e Dön
            </Link>

            {/* Form Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-sm text-metro-orange font-medium mb-2">
                <Hotel className="w-4 h-4" />
                <span>Adım {step} / 4</span>
              </div>
              <h2 className="font-outfit text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
                {stepLabels[step - 1]}
              </h2>
              <p className="text-slate-500">
                {step === 1 && "Tesisinizin temel bilgilerini girin."}
                {step === 2 && "Konumunuzu ve tesisinizi tanımlayın."}
                {step === 3 && "Sunduğunuz olanakları seçin."}
                {step === 4 && "Tesisinizin fotoğraflarını yükleyin."}
              </p>
            </div>

            {/* Mobile Progress Bar */}
            <div className="lg:hidden mb-6">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-metro-orange transition-all duration-500"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300" data-testid="hotel-step-1">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">
                      Tesis Adı (İngilizce) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Hotel className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        data-testid="hotel-name-input"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Grand Sultan Hotel"
                        className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-metro-orange/20 focus:border-metro-orange"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">
                      Tesis Adı (Türkçe) <span className="text-slate-400 text-xs">(Opsiyonel)</span>
                    </Label>
                    <Input
                      data-testid="hotel-name-tr-input"
                      value={formData.name_tr}
                      onChange={(e) => updateField('name_tr', e.target.value)}
                      placeholder="Grand Sultan Otel"
                      className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-metro-orange/20 focus:border-metro-orange"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">
                        Tesis Türü <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.property_type} onValueChange={(v) => updateField('property_type', v)}>
                        <SelectTrigger data-testid="hotel-type-select" className="h-12 bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {propertyTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">
                        Yıldız <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.star_rating} onValueChange={(v) => updateField('star_rating', v)}>
                        <SelectTrigger data-testid="hotel-star-select" className="h-12 bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map(star => (
                            <SelectItem key={star} value={star.toString()}>
                              <span className="flex items-center gap-1">
                                {Array(star).fill(0).map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    type="button"
                    data-testid="hotel-step-1-next"
                    onClick={() => setStep(2)}
                    disabled={!isStep1Valid}
                    className="w-full h-12 bg-metro-orange hover:bg-metro-orange/90 text-white font-medium mt-4"
                  >
                    Devam Et
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Step 2: Location & Description */}
              {step === 2 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300" data-testid="hotel-step-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">
                        Şehir <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.city} onValueChange={(v) => updateField('city', v)}>
                        <SelectTrigger data-testid="hotel-city-select" className="h-12 bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">İlçe</Label>
                      <Input
                        data-testid="hotel-district-input"
                        value={formData.district}
                        onChange={(e) => updateField('district', e.target.value)}
                        placeholder="Beyoğlu"
                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-metro-orange/20 focus:border-metro-orange"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Adres</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                      <Input
                        data-testid="hotel-address-input"
                        value={formData.street_address}
                        onChange={(e) => updateField('street_address', e.target.value)}
                        placeholder="Caddesi, Sokak, No"
                        className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-metro-orange/20 focus:border-metro-orange"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">
                      Açıklama (İngilizce) <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      data-testid="hotel-description-input"
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Tesisinizi, sunduğu olanakları ve onu özel kılan özellikleri açıklayın..."
                      rows={4}
                      className="bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-metro-orange/20 focus:border-metro-orange resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">
                      Açıklama (Türkçe) <span className="text-slate-400 text-xs">(Opsiyonel)</span>
                    </Label>
                    <Textarea
                      data-testid="hotel-description-tr-input"
                      value={formData.description_tr}
                      onChange={(e) => updateField('description_tr', e.target.value)}
                      placeholder="Tesisinizin Türkçe açıklamasını yazın..."
                      rows={3}
                      className="bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-metro-orange/20 focus:border-metro-orange resize-none"
                    />
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Geri
                    </Button>
                    <Button 
                      type="button"
                      data-testid="hotel-step-2-next"
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

              {/* Step 3: Amenities */}
              {step === 3 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300" data-testid="hotel-step-3">
                  <div>
                    <p className="text-sm text-slate-500 mb-4">En az 3 özellik seçin</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {amenityOptions.map(amenity => (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => toggleAmenity(amenity.id)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            formData.amenities.includes(amenity.id)
                              ? 'border-metro-orange bg-metro-orange/5 text-metro-orange'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          <amenity.icon className="w-6 h-6" />
                          <span className="text-xs font-medium text-center leading-tight">{amenity.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-slate-400 mt-3">
                      {formData.amenities.length} / 12 seçildi
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">Giriş Saati</Label>
                      <Select value={formData.check_in_time} onValueChange={(v) => updateField('check_in_time', v)}>
                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["12:00", "13:00", "14:00", "15:00", "16:00"].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">Çıkış Saati</Label>
                      <Select value={formData.check_out_time} onValueChange={(v) => updateField('check_out_time', v)}>
                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["10:00", "11:00", "12:00", "13:00", "14:00"].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Geri
                    </Button>
                    <Button 
                      type="button"
                      data-testid="hotel-step-3-next"
                      onClick={() => setStep(4)}
                      disabled={!isStep3Valid}
                      className="flex-1 h-12 bg-metro-orange hover:bg-metro-orange/90 text-white font-medium"
                    >
                      Devam Et
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Photos */}
              {step === 4 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300" data-testid="hotel-step-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-4">
                      Tesisinizin en iyi fotoğraflarını yükleyin (max. 10 adet)
                    </p>
                    
                    {/* Upload Area */}
                    <label className="block border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-metro-orange/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImages || formData.images.length >= 10}
                      />
                      {uploadingImages ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-metro-orange" />
                          <p className="text-sm text-slate-500">Yükleniyor...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                          <p className="text-sm font-medium text-slate-700">Fotoğraf yüklemek için tıklayın</p>
                          <p className="text-xs text-slate-400 mt-1">veya sürükleyip bırakın (JPG, PNG)</p>
                        </>
                      )}
                    </label>

                    {/* Image Preview Grid */}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                        {formData.images.map((url, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                            {idx === 0 && (
                              <span className="absolute bottom-1 left-1 text-xs bg-metro-orange text-white px-2 py-0.5 rounded">
                                Kapak
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-slate-400 mt-3">
                      {formData.images.length} / 10 fotoğraf yüklendi
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div className="pt-4 border-t space-y-4">
                    <p className="text-sm font-medium text-slate-700">İletişim Bilgileri</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => updateField('contact_email', e.target.value)}
                        placeholder="E-posta"
                        className="h-12 bg-slate-50"
                      />
                      <Input
                        type="tel"
                        value={formData.contact_phone}
                        onChange={(e) => updateField('contact_phone', e.target.value)}
                        placeholder="Telefon"
                        className="h-12 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(3)} className="flex-1 h-12">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Geri
                    </Button>
                    <Button 
                      type="submit"
                      data-testid="hotel-submit-btn"
                      disabled={loading}
                      className="flex-1 h-12 bg-metro-orange hover:bg-metro-orange/90 text-white font-medium"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Kaydediliyor...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Tesisi Kaydet
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>

            {/* Trust Badge */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Kaydınız tamamlandıktan sonra ekibimiz tesisinizi inceleyecek ve 24 saat içinde onaylayacaktır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
