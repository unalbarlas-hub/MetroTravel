import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth, useLanguage, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ArrowLeft, Save, Hotel, MapPin, Clock, Star, Image, 
  Globe, Phone, Mail, FileText, Shield, Users, Wifi,
  Car, Utensils, Dumbbell, Waves, Sparkles, Baby, PawPrint,
  Plane, Coffee, Briefcase, Shirt, Building2, AlertCircle
} from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

// Translations for Extranet
const extranetTranslations = {
  en: {
    editProperty: "Edit Property",
    addNewProperty: "Add New Property",
    basicInfo: "Basic Information",
    propertyNameEn: "Property Name (English)",
    propertyNameTr: "Property Name (Turkish)",
    propertyNameDe: "Property Name (German)",
    propertyType: "Property Type",
    starRating: "Star Rating",
    descriptionEn: "Description (English)",
    descriptionTr: "Description (Turkish)",
    descriptionDe: "Description (German)",
    location: "Location",
    city: "City",
    district: "District",
    streetAddress: "Street Address",
    postalCode: "Postal Code",
    latitude: "Latitude",
    longitude: "Longitude",
    checkInOut: "Check-in / Check-out Times",
    checkInTime: "Check-in Time",
    checkOutTime: "Check-out Time",
    earlyCheckIn: "Early Check-in Available",
    lateCheckOut: "Late Check-out Available",
    contactInfo: "Contact Information",
    contactEmail: "Contact Email",
    contactPhone: "Contact Phone",
    website: "Website",
    amenities: "Property Amenities",
    photos: "Property Photos",
    policies: "Policies",
    cancellationPolicy: "Cancellation Policy",
    childrenPolicy: "Children Policy",
    petPolicy: "Pet Policy",
    smokingPolicy: "Smoking Policy",
    paymentMethods: "Payment Methods",
    additionalInfo: "Additional Information",
    totalRooms: "Total Rooms",
    yearBuilt: "Year Built",
    lastRenovation: "Last Renovation",
    languages: "Languages Spoken",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    createProperty: "Create Property",
    saving: "Saving...",
    required: "Required",
    optional: "Optional",
    selectCity: "Select city",
    describeProperty: "Describe your property, its features and what makes it special...",
    uploadPhotos: "Upload photos to showcase your property",
    freeCancellation: "Free cancellation up to",
    hours: "hours before check-in",
    days: "days before check-in",
    noRefund: "Non-refundable",
    general: "General",
    translations: "Translations",
    propertyDetails: "Property Details",
  },
  tr: {
    editProperty: "Tesis Düzenle",
    addNewProperty: "Yeni Tesis Ekle",
    basicInfo: "Temel Bilgiler",
    propertyNameEn: "Tesis Adı (İngilizce)",
    propertyNameTr: "Tesis Adı (Türkçe)",
    propertyNameDe: "Tesis Adı (Almanca)",
    propertyType: "Tesis Türü",
    starRating: "Yıldız Derecesi",
    descriptionEn: "Açıklama (İngilizce)",
    descriptionTr: "Açıklama (Türkçe)",
    descriptionDe: "Açıklama (Almanca)",
    location: "Konum",
    city: "Şehir",
    district: "İlçe",
    streetAddress: "Sokak Adresi",
    postalCode: "Posta Kodu",
    latitude: "Enlem",
    longitude: "Boylam",
    checkInOut: "Giriş / Çıkış Saatleri",
    checkInTime: "Giriş Saati",
    checkOutTime: "Çıkış Saati",
    earlyCheckIn: "Erken Giriş Mümkün",
    lateCheckOut: "Geç Çıkış Mümkün",
    contactInfo: "İletişim Bilgileri",
    contactEmail: "İletişim E-postası",
    contactPhone: "İletişim Telefonu",
    website: "Web Sitesi",
    amenities: "Tesis Olanakları",
    photos: "Tesis Fotoğrafları",
    policies: "Politikalar",
    cancellationPolicy: "İptal Politikası",
    childrenPolicy: "Çocuk Politikası",
    petPolicy: "Evcil Hayvan Politikası",
    smokingPolicy: "Sigara Politikası",
    paymentMethods: "Ödeme Yöntemleri",
    additionalInfo: "Ek Bilgiler",
    totalRooms: "Toplam Oda Sayısı",
    yearBuilt: "Yapım Yılı",
    lastRenovation: "Son Renovasyon",
    languages: "Konuşulan Diller",
    cancel: "İptal",
    saveChanges: "Değişiklikleri Kaydet",
    createProperty: "Tesis Oluştur",
    saving: "Kaydediliyor...",
    required: "Zorunlu",
    optional: "İsteğe Bağlı",
    selectCity: "Şehir seçin",
    describeProperty: "Tesisinizi, özelliklerini ve onu özel kılan unsurları açıklayın...",
    uploadPhotos: "Tesisinizi tanıtmak için fotoğraf yükleyin",
    freeCancellation: "Girişten önce ücretsiz iptal",
    hours: "saat",
    days: "gün",
    noRefund: "İade yok",
    general: "Genel",
    translations: "Çeviriler",
    propertyDetails: "Tesis Detayları",
  },
  de: {
    editProperty: "Unterkunft bearbeiten",
    addNewProperty: "Neue Unterkunft hinzufügen",
    basicInfo: "Grundinformationen",
    propertyNameEn: "Unterkunftsname (Englisch)",
    propertyNameTr: "Unterkunftsname (Türkisch)",
    propertyNameDe: "Unterkunftsname (Deutsch)",
    propertyType: "Unterkunftstyp",
    starRating: "Sternebewertung",
    descriptionEn: "Beschreibung (Englisch)",
    descriptionTr: "Beschreibung (Türkisch)",
    descriptionDe: "Beschreibung (Deutsch)",
    location: "Standort",
    city: "Stadt",
    district: "Bezirk",
    streetAddress: "Straßenadresse",
    postalCode: "Postleitzahl",
    latitude: "Breitengrad",
    longitude: "Längengrad",
    checkInOut: "Check-in / Check-out Zeiten",
    checkInTime: "Check-in Zeit",
    checkOutTime: "Check-out Zeit",
    earlyCheckIn: "Früher Check-in möglich",
    lateCheckOut: "Später Check-out möglich",
    contactInfo: "Kontaktinformationen",
    contactEmail: "Kontakt E-Mail",
    contactPhone: "Kontakttelefon",
    website: "Webseite",
    amenities: "Ausstattung",
    photos: "Fotos",
    policies: "Richtlinien",
    cancellationPolicy: "Stornierungsrichtlinie",
    childrenPolicy: "Kinderrichtlinie",
    petPolicy: "Haustierrichtlinie",
    smokingPolicy: "Raucherrichtlinie",
    paymentMethods: "Zahlungsmethoden",
    additionalInfo: "Zusätzliche Informationen",
    totalRooms: "Gesamtzahl der Zimmer",
    yearBuilt: "Baujahr",
    lastRenovation: "Letzte Renovierung",
    languages: "Gesprochene Sprachen",
    cancel: "Abbrechen",
    saveChanges: "Änderungen speichern",
    createProperty: "Unterkunft erstellen",
    saving: "Speichern...",
    required: "Erforderlich",
    optional: "Optional",
    selectCity: "Stadt auswählen",
    describeProperty: "Beschreiben Sie Ihre Unterkunft, ihre Merkmale und was sie besonders macht...",
    uploadPhotos: "Laden Sie Fotos hoch, um Ihre Unterkunft zu präsentieren",
    freeCancellation: "Kostenlose Stornierung bis",
    hours: "Stunden vor Check-in",
    days: "Tage vor Check-in",
    noRefund: "Nicht erstattungsfähig",
    general: "Allgemein",
    translations: "Übersetzungen",
    propertyDetails: "Unterkunftsdetails",
  }
};

const propertyTypes = {
  en: [
    { value: "hotel", label: "Hotel" },
    { value: "boutique", label: "Boutique Hotel" },
    { value: "resort", label: "Resort" },
    { value: "apartment", label: "Apartment" },
    { value: "villa", label: "Villa" },
    { value: "hostel", label: "Hostel" },
    { value: "guesthouse", label: "Guesthouse" },
    { value: "apart_hotel", label: "Apart Hotel" },
    { value: "pension", label: "Pension" },
  ],
  tr: [
    { value: "hotel", label: "Otel" },
    { value: "boutique", label: "Butik Otel" },
    { value: "resort", label: "Tatil Köyü" },
    { value: "apartment", label: "Apart" },
    { value: "villa", label: "Villa" },
    { value: "hostel", label: "Hostel" },
    { value: "guesthouse", label: "Pansiyon" },
    { value: "apart_hotel", label: "Apart Otel" },
    { value: "pension", label: "Pansiyon" },
  ],
  de: [
    { value: "hotel", label: "Hotel" },
    { value: "boutique", label: "Boutique-Hotel" },
    { value: "resort", label: "Resort" },
    { value: "apartment", label: "Apartment" },
    { value: "villa", label: "Villa" },
    { value: "hostel", label: "Hostel" },
    { value: "guesthouse", label: "Pension" },
    { value: "apart_hotel", label: "Aparthotel" },
    { value: "pension", label: "Pension" },
  ]
};

const propertyAmenities = {
  en: [
    { code: "wifi", label: "Free Wi-Fi", icon: Wifi, category: "general" },
    { code: "pool", label: "Outdoor Pool", icon: Waves, category: "recreation" },
    { code: "indoor_pool", label: "Indoor Pool", icon: Waves, category: "recreation" },
    { code: "spa", label: "Spa & Wellness", icon: Sparkles, category: "recreation" },
    { code: "gym", label: "Fitness Center", icon: Dumbbell, category: "recreation" },
    { code: "parking", label: "Parking", icon: Car, category: "services" },
    { code: "free_parking", label: "Free Parking", icon: Car, category: "services" },
    { code: "valet_parking", label: "Valet Parking", icon: Car, category: "services" },
    { code: "restaurant", label: "Restaurant", icon: Utensils, category: "dining" },
    { code: "bar", label: "Bar/Lounge", icon: Coffee, category: "dining" },
    { code: "room_service", label: "24h Room Service", icon: Utensils, category: "dining" },
    { code: "breakfast", label: "Breakfast Available", icon: Coffee, category: "dining" },
    { code: "concierge", label: "Concierge", icon: Users, category: "services" },
    { code: "laundry", label: "Laundry Service", icon: Shirt, category: "services" },
    { code: "dry_cleaning", label: "Dry Cleaning", icon: Shirt, category: "services" },
    { code: "business_center", label: "Business Center", icon: Briefcase, category: "business" },
    { code: "meeting_rooms", label: "Meeting Rooms", icon: Building2, category: "business" },
    { code: "beach_access", label: "Private Beach", icon: Waves, category: "recreation" },
    { code: "kids_club", label: "Kids Club", icon: Baby, category: "family" },
    { code: "playground", label: "Playground", icon: Baby, category: "family" },
    { code: "babysitting", label: "Babysitting Service", icon: Baby, category: "family" },
    { code: "pet_friendly", label: "Pet Friendly", icon: PawPrint, category: "general" },
    { code: "airport_shuttle", label: "Airport Shuttle", icon: Plane, category: "services" },
    { code: "free_shuttle", label: "Free Shuttle Service", icon: Car, category: "services" },
    { code: "ev_charging", label: "EV Charging Station", icon: Car, category: "services" },
    { code: "wheelchair", label: "Wheelchair Accessible", icon: Users, category: "accessibility" },
    { code: "elevator", label: "Elevator", icon: Building2, category: "accessibility" },
  ],
  tr: [
    { code: "wifi", label: "Ücretsiz Wi-Fi", icon: Wifi, category: "general" },
    { code: "pool", label: "Açık Havuz", icon: Waves, category: "recreation" },
    { code: "indoor_pool", label: "Kapalı Havuz", icon: Waves, category: "recreation" },
    { code: "spa", label: "Spa & Wellness", icon: Sparkles, category: "recreation" },
    { code: "gym", label: "Fitness Merkezi", icon: Dumbbell, category: "recreation" },
    { code: "parking", label: "Otopark", icon: Car, category: "services" },
    { code: "free_parking", label: "Ücretsiz Otopark", icon: Car, category: "services" },
    { code: "valet_parking", label: "Vale Parking", icon: Car, category: "services" },
    { code: "restaurant", label: "Restoran", icon: Utensils, category: "dining" },
    { code: "bar", label: "Bar/Lounge", icon: Coffee, category: "dining" },
    { code: "room_service", label: "24 Saat Oda Servisi", icon: Utensils, category: "dining" },
    { code: "breakfast", label: "Kahvaltı Mevcut", icon: Coffee, category: "dining" },
    { code: "concierge", label: "Concierge", icon: Users, category: "services" },
    { code: "laundry", label: "Çamaşırhane", icon: Shirt, category: "services" },
    { code: "dry_cleaning", label: "Kuru Temizleme", icon: Shirt, category: "services" },
    { code: "business_center", label: "İş Merkezi", icon: Briefcase, category: "business" },
    { code: "meeting_rooms", label: "Toplantı Odaları", icon: Building2, category: "business" },
    { code: "beach_access", label: "Özel Plaj", icon: Waves, category: "recreation" },
    { code: "kids_club", label: "Çocuk Kulübü", icon: Baby, category: "family" },
    { code: "playground", label: "Oyun Alanı", icon: Baby, category: "family" },
    { code: "babysitting", label: "Bebek Bakıcısı", icon: Baby, category: "family" },
    { code: "pet_friendly", label: "Evcil Hayvan Dostu", icon: PawPrint, category: "general" },
    { code: "airport_shuttle", label: "Havalimanı Servisi", icon: Plane, category: "services" },
    { code: "free_shuttle", label: "Ücretsiz Servis", icon: Car, category: "services" },
    { code: "ev_charging", label: "Elektrikli Araç Şarjı", icon: Car, category: "services" },
    { code: "wheelchair", label: "Tekerlekli Sandalye Erişimi", icon: Users, category: "accessibility" },
    { code: "elevator", label: "Asansör", icon: Building2, category: "accessibility" },
  ],
  de: [
    { code: "wifi", label: "Kostenloses WLAN", icon: Wifi, category: "general" },
    { code: "pool", label: "Außenpool", icon: Waves, category: "recreation" },
    { code: "indoor_pool", label: "Innenpool", icon: Waves, category: "recreation" },
    { code: "spa", label: "Spa & Wellness", icon: Sparkles, category: "recreation" },
    { code: "gym", label: "Fitnesscenter", icon: Dumbbell, category: "recreation" },
    { code: "parking", label: "Parkplatz", icon: Car, category: "services" },
    { code: "free_parking", label: "Kostenloser Parkplatz", icon: Car, category: "services" },
    { code: "valet_parking", label: "Parkservice", icon: Car, category: "services" },
    { code: "restaurant", label: "Restaurant", icon: Utensils, category: "dining" },
    { code: "bar", label: "Bar/Lounge", icon: Coffee, category: "dining" },
    { code: "room_service", label: "24h Zimmerservice", icon: Utensils, category: "dining" },
    { code: "breakfast", label: "Frühstück verfügbar", icon: Coffee, category: "dining" },
    { code: "concierge", label: "Concierge", icon: Users, category: "services" },
    { code: "laundry", label: "Wäscheservice", icon: Shirt, category: "services" },
    { code: "dry_cleaning", label: "Chemische Reinigung", icon: Shirt, category: "services" },
    { code: "business_center", label: "Business Center", icon: Briefcase, category: "business" },
    { code: "meeting_rooms", label: "Tagungsräume", icon: Building2, category: "business" },
    { code: "beach_access", label: "Privatstrand", icon: Waves, category: "recreation" },
    { code: "kids_club", label: "Kinderclub", icon: Baby, category: "family" },
    { code: "playground", label: "Spielplatz", icon: Baby, category: "family" },
    { code: "babysitting", label: "Babysitter-Service", icon: Baby, category: "family" },
    { code: "pet_friendly", label: "Haustierfreundlich", icon: PawPrint, category: "general" },
    { code: "airport_shuttle", label: "Flughafentransfer", icon: Plane, category: "services" },
    { code: "free_shuttle", label: "Kostenloser Shuttleservice", icon: Car, category: "services" },
    { code: "ev_charging", label: "Ladestation für E-Autos", icon: Car, category: "services" },
    { code: "wheelchair", label: "Rollstuhlgerecht", icon: Users, category: "accessibility" },
    { code: "elevator", label: "Aufzug", icon: Building2, category: "accessibility" },
  ]
};

const cities = [
  "Istanbul", "Antalya", "Bodrum", "Dalaman", "Izmir", "Ankara", "Fethiye", 
  "Cappadocia", "Marmaris", "Cesme", "Kusadasi", "Alanya", "Side", "Belek",
  "Kas", "Didim", "Trabzon", "Bursa", "Konya", "Pamukkale"
];

const amenityCategories = {
  en: {
    general: "General",
    recreation: "Recreation & Wellness",
    dining: "Dining & Drinks",
    services: "Services",
    business: "Business",
    family: "Family",
    accessibility: "Accessibility"
  },
  tr: {
    general: "Genel",
    recreation: "Rekreasyon & Wellness",
    dining: "Yeme & İçme",
    services: "Hizmetler",
    business: "İş",
    family: "Aile",
    accessibility: "Erişilebilirlik"
  },
  de: {
    general: "Allgemein",
    recreation: "Freizeit & Wellness",
    dining: "Essen & Trinken",
    services: "Dienstleistungen",
    business: "Geschäftlich",
    family: "Familie",
    accessibility: "Barrierefreiheit"
  }
};

const cancellationOptions = {
  en: [
    { value: "free_24h", label: "Free cancellation up to 24 hours" },
    { value: "free_48h", label: "Free cancellation up to 48 hours" },
    { value: "free_72h", label: "Free cancellation up to 72 hours" },
    { value: "free_7d", label: "Free cancellation up to 7 days" },
    { value: "non_refundable", label: "Non-refundable" },
  ],
  tr: [
    { value: "free_24h", label: "24 saat öncesine kadar ücretsiz iptal" },
    { value: "free_48h", label: "48 saat öncesine kadar ücretsiz iptal" },
    { value: "free_72h", label: "72 saat öncesine kadar ücretsiz iptal" },
    { value: "free_7d", label: "7 gün öncesine kadar ücretsiz iptal" },
    { value: "non_refundable", label: "İade yapılmaz" },
  ],
  de: [
    { value: "free_24h", label: "Kostenlose Stornierung bis 24 Stunden" },
    { value: "free_48h", label: "Kostenlose Stornierung bis 48 Stunden" },
    { value: "free_72h", label: "Kostenlose Stornierung bis 72 Stunden" },
    { value: "free_7d", label: "Kostenlose Stornierung bis 7 Tage" },
    { value: "non_refundable", label: "Nicht erstattungsfähig" },
  ]
};

export default function ExtranetProperty() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  
  const t = (key) => extranetTranslations[language]?.[key] || extranetTranslations.en[key] || key;
  const getPropertyTypes = () => propertyTypes[language] || propertyTypes.en;
  const getAmenities = () => propertyAmenities[language] || propertyAmenities.en;
  const getCategories = () => amenityCategories[language] || amenityCategories.en;
  const getCancellationOptions = () => cancellationOptions[language] || cancellationOptions.en;
  
  const [loading, setLoading] = useState(!!hotelId);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  const [formData, setFormData] = useState({
    // Names
    name_en: "",
    name_tr: "",
    name_de: "",
    // Type & Rating
    property_type: "hotel",
    star_rating: "4",
    // Descriptions
    description_en: "",
    description_tr: "",
    description_de: "",
    // Location
    city: "",
    district: "",
    street: "",
    postal_code: "",
    latitude: "",
    longitude: "",
    // Times
    check_in: "14:00",
    check_out: "11:00",
    early_check_in: false,
    late_check_out: false,
    // Contact
    contact_email: "",
    contact_phone: "",
    website: "",
    // Amenities
    amenities: [],
    // Policies
    cancellation_policy: "free_24h",
    children_policy: "",
    pet_policy: "",
    smoking_policy: "",
    // Payment
    payment_methods: [],
    // Additional
    total_rooms: "",
    year_built: "",
    last_renovation: "",
    languages_spoken: [],
    // Photos
    photos: [],
  });
  
  useEffect(() => {
    if (hotelId) {
      loadHotel();
    }
  }, [hotelId]);
  
  const loadHotel = async () => {
    try {
      const response = await fetch(`${API}/hotels/${hotelId}`, {
        credentials: "include"
      });
      if (response.ok) {
        const hotel = await response.json();
        setFormData({
          name_en: hotel.name?.en || "",
          name_tr: hotel.name?.tr || "",
          name_de: hotel.name?.de || "",
          property_type: hotel.property_type || "hotel",
          star_rating: hotel.star_rating?.toString() || "4",
          description_en: hotel.description?.en || "",
          description_tr: hotel.description?.tr || "",
          description_de: hotel.description?.de || "",
          city: hotel.address?.city || "",
          district: hotel.address?.district || "",
          street: hotel.address?.street || "",
          postal_code: hotel.address?.postal_code || "",
          latitude: hotel.address?.coordinates?.latitude?.toString() || "",
          longitude: hotel.address?.coordinates?.longitude?.toString() || "",
          check_in: hotel.times?.check_in || "14:00",
          check_out: hotel.times?.check_out || "11:00",
          early_check_in: hotel.policies?.early_check_in || false,
          late_check_out: hotel.policies?.late_check_out || false,
          contact_email: hotel.contact_email || "",
          contact_phone: hotel.contact_phone || "",
          website: hotel.website || "",
          amenities: hotel.property_amenities || [],
          cancellation_policy: hotel.cancellation_policy?.type || "free_24h",
          children_policy: hotel.policies?.children || "",
          pet_policy: hotel.policies?.pets || "",
          smoking_policy: hotel.policies?.smoking || "",
          payment_methods: hotel.payment_methods || [],
          total_rooms: hotel.total_rooms?.toString() || "",
          year_built: hotel.year_built?.toString() || "",
          last_renovation: hotel.last_renovation?.toString() || "",
          languages_spoken: hotel.languages_spoken || [],
          photos: hotel.photos || [],
        });
      }
    } catch (error) {
      console.error("Error loading hotel:", error);
      toast.error(language === "tr" ? "Tesis bilgileri yüklenemedi" : "Failed to load hotel details");
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };
  
  const toggleAmenity = (code) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(code)
        ? prev.amenities.filter(a => a !== code)
        : [...prev.amenities, code]
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name_en || !formData.city) {
      toast.error(language === "tr" ? "Lütfen zorunlu alanları doldurun" : "Please fill in required fields");
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        name: { 
          en: formData.name_en, 
          tr: formData.name_tr || formData.name_en,
          de: formData.name_de || null
        },
        property_type: formData.property_type,
        star_rating: parseInt(formData.star_rating),
        description: { 
          en: formData.description_en, 
          tr: formData.description_tr || formData.description_en,
          de: formData.description_de || null
        },
        address: {
          city: formData.city,
          district: formData.district || null,
          street: formData.street || null,
          postal_code: formData.postal_code || null,
          country: "Turkey",
          coordinates: formData.latitude && formData.longitude ? {
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude)
          } : null
        },
        check_in_time: formData.check_in,
        check_out_time: formData.check_out,
        property_amenities: formData.amenities,
        contact: {
          email: formData.contact_email || null,
          phone: formData.contact_phone || null,
          website: formData.website || null
        },
        policies: {
          cancellation: formData.cancellation_policy,
          children: formData.children_policy || null,
          pets: formData.pet_policy || null,
          smoking: formData.smoking_policy || null,
          early_check_in: formData.early_check_in,
          late_check_out: formData.late_check_out
        },
        total_rooms: formData.total_rooms ? parseInt(formData.total_rooms) : null,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        last_renovation: formData.last_renovation ? parseInt(formData.last_renovation) : null,
        languages_spoken: formData.languages_spoken,
      };
      
      const url = hotelId ? `${API}/hotels/${hotelId}` : `${API}/hotels`;
      const method = hotelId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save property");
      }
      
      const result = await response.json();
      toast.success(hotelId 
        ? (language === "tr" ? "Tesis güncellendi!" : "Property updated!")
        : (language === "tr" ? "Tesis oluşturuldu!" : "Property created!")
      );
      navigate(hotelId ? `/extranet/property/${hotelId}` : `/extranet/rooms/${result.hotel_id}`);
    } catch (error) {
      console.error("Error saving property:", error);
      toast.error(language === "tr" ? "Tesis kaydedilemedi" : "Failed to save property");
    } finally {
      setSaving(false);
    }
  };
  
  // Group amenities by category
  const groupedAmenities = getAmenities().reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {});
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-metro-navy mx-auto mb-4"></div>
          <p className="text-muted-foreground">{language === "tr" ? "Yükleniyor..." : "Loading..."}</p>
        </div>
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
              <Link to="/extranet" className="hover:bg-white/10 p-2 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-outfit font-bold text-xl">
                  {hotelId ? t("editProperty") : t("addNewProperty")}
                </h1>
                {hotelId && formData.name_tr && (
                  <p className="text-white/70 text-sm">{formData.name_tr}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/extranet">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  {t("cancel")}
                </Button>
              </Link>
              <Button 
                onClick={handleSubmit} 
                className="bg-metro-orange hover:bg-metro-orange/90"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {hotelId ? t("saveChanges") : t("createProperty")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="general" className="gap-2">
              <Hotel className="w-4 h-4" />
              <span className="hidden sm:inline">{t("general")}</span>
            </TabsTrigger>
            <TabsTrigger value="translations" className="gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{t("translations")}</span>
            </TabsTrigger>
            <TabsTrigger value="amenities" className="gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">{t("amenities")}</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">{t("policies")}</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="gap-2">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">{t("photos")}</span>
            </TabsTrigger>
          </TabsList>
          
          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            {/* Basic Info */}
            <div className="card-dashboard p-6">
              <h2 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
                <Hotel className="w-5 h-5 text-metro-navy" />
                {t("basicInfo")}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name_tr" className="flex items-center gap-2">
                    {t("propertyNameTr")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name_tr"
                    name="name_tr"
                    value={formData.name_tr}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder={language === "tr" ? "Örn: Grand İstanbul Otel" : "e.g., Grand Istanbul Hotel"}
                    data-testid="input-name-tr"
                  />
                </div>
                
                <div>
                  <Label htmlFor="property_type">{t("propertyType")} <span className="text-red-500">*</span></Label>
                  <Select value={formData.property_type} onValueChange={(v) => setFormData(prev => ({ ...prev, property_type: v }))}>
                    <SelectTrigger className="mt-1" data-testid="select-property-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getPropertyTypes().map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="star_rating">{t("starRating")} <span className="text-red-500">*</span></Label>
                  <Select value={formData.star_rating} onValueChange={(v) => setFormData(prev => ({ ...prev, star_rating: v }))}>
                    <SelectTrigger className="mt-1" data-testid="select-star-rating">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(star => (
                        <SelectItem key={star} value={star.toString()}>
                          {"⭐".repeat(star)} {star} {language === "tr" ? "Yıldız" : "Star"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="description_tr">{t("descriptionTr")}</Label>
                  <Textarea
                    id="description_tr"
                    name="description_tr"
                    value={formData.description_tr}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1"
                    placeholder={t("describeProperty")}
                    data-testid="input-description-tr"
                  />
                </div>
              </div>
            </div>
            
            {/* Location */}
            <div className="card-dashboard p-6">
              <h2 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-metro-navy" />
                {t("location")}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">{t("city")} <span className="text-red-500">*</span></Label>
                  <Select value={formData.city} onValueChange={(v) => setFormData(prev => ({ ...prev, city: v }))}>
                    <SelectTrigger className="mt-1" data-testid="select-city">
                      <SelectValue placeholder={t("selectCity")} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="district">{t("district")}</Label>
                  <Input
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder={language === "tr" ? "Örn: Sultanahmet" : "e.g., Sultanahmet"}
                    data-testid="input-district"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="street">{t("streetAddress")}</Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder={language === "tr" ? "Tam adres" : "Full address"}
                    data-testid="input-street"
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">{t("postalCode")}</Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="34000"
                    data-testid="input-postal-code"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="latitude">{t("latitude")}</Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      className="mt-1"
                      placeholder="41.0082"
                      data-testid="input-latitude"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">{t("longitude")}</Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      className="mt-1"
                      placeholder="28.9784"
                      data-testid="input-longitude"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Check-in/out Times */}
            <div className="card-dashboard p-6">
              <h2 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-metro-navy" />
                {t("checkInOut")}
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="check_in">{t("checkInTime")}</Label>
                  <Input
                    id="check_in"
                    name="check_in"
                    type="time"
                    value={formData.check_in}
                    onChange={handleChange}
                    className="mt-1"
                    data-testid="input-check-in"
                  />
                </div>
                <div>
                  <Label htmlFor="check_out">{t("checkOutTime")}</Label>
                  <Input
                    id="check_out"
                    name="check_out"
                    type="time"
                    value={formData.check_out}
                    onChange={handleChange}
                    className="mt-1"
                    data-testid="input-check-out"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox
                    id="early_check_in"
                    checked={formData.early_check_in}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, early_check_in: checked }))}
                  />
                  <Label htmlFor="early_check_in" className="cursor-pointer">{t("earlyCheckIn")}</Label>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox
                    id="late_check_out"
                    checked={formData.late_check_out}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, late_check_out: checked }))}
                  />
                  <Label htmlFor="late_check_out" className="cursor-pointer">{t("lateCheckOut")}</Label>
                </div>
              </div>
            </div>
            
            {/* Contact */}
            <div className="card-dashboard p-6">
              <h2 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-metro-navy" />
                {t("contactInfo")}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contact_email" className="flex items-center gap-1">
                    <Mail className="w-4 h-4" /> {t("contactEmail")}
                  </Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="info@hotel.com"
                    data-testid="input-contact-email"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone" className="flex items-center gap-1">
                    <Phone className="w-4 h-4" /> {t("contactPhone")}
                  </Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="+90 212 555 1234"
                    data-testid="input-contact-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="website" className="flex items-center gap-1">
                    <Globe className="w-4 h-4" /> {t("website")}
                  </Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="https://www.hotel.com"
                    data-testid="input-website"
                  />
                </div>
              </div>
            </div>
            
            {/* Additional Info */}
            <div className="card-dashboard p-6">
              <h2 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-metro-navy" />
                {t("additionalInfo")}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="total_rooms">{t("totalRooms")}</Label>
                  <Input
                    id="total_rooms"
                    name="total_rooms"
                    type="number"
                    value={formData.total_rooms}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="50"
                    data-testid="input-total-rooms"
                  />
                </div>
                <div>
                  <Label htmlFor="year_built">{t("yearBuilt")}</Label>
                  <Input
                    id="year_built"
                    name="year_built"
                    type="number"
                    value={formData.year_built}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="2010"
                    min="1900"
                    max={new Date().getFullYear()}
                    data-testid="input-year-built"
                  />
                </div>
                <div>
                  <Label htmlFor="last_renovation">{t("lastRenovation")}</Label>
                  <Input
                    id="last_renovation"
                    name="last_renovation"
                    type="number"
                    value={formData.last_renovation}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="2023"
                    min="1900"
                    max={new Date().getFullYear()}
                    data-testid="input-last-renovation"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Translations Tab */}
          <TabsContent value="translations" className="space-y-6">
            <div className="card-dashboard p-6">
              <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  {language === "tr" 
                    ? "Çeviriler, misafirlerin kendi dillerinde tesis bilgilerini görmelerini sağlar."
                    : "Translations allow guests to see property information in their preferred language."
                  }
                </p>
              </div>
              
              {/* English */}
              <div className="border-b pb-6 mb-6">
                <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                  <span className="text-xl">🇬🇧</span> English
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name_en">{t("propertyNameEn")} <span className="text-red-500">*</span></Label>
                    <Input
                      id="name_en"
                      name="name_en"
                      value={formData.name_en}
                      onChange={handleChange}
                      required
                      className="mt-1"
                      data-testid="input-name-en"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description_en">{t("descriptionEn")}</Label>
                    <Textarea
                      id="description_en"
                      name="description_en"
                      value={formData.description_en}
                      onChange={handleChange}
                      rows={4}
                      className="mt-1"
                      data-testid="input-description-en"
                    />
                  </div>
                </div>
              </div>
              
              {/* Turkish */}
              <div className="border-b pb-6 mb-6">
                <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                  <span className="text-xl">🇹🇷</span> Türkçe
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name_tr_trans">{t("propertyNameTr")}</Label>
                    <Input
                      id="name_tr_trans"
                      name="name_tr"
                      value={formData.name_tr}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description_tr_trans">{t("descriptionTr")}</Label>
                    <Textarea
                      id="description_tr_trans"
                      name="description_tr"
                      value={formData.description_tr}
                      onChange={handleChange}
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              {/* German */}
              <div>
                <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                  <span className="text-xl">🇩🇪</span> Deutsch
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name_de">{t("propertyNameDe")}</Label>
                    <Input
                      id="name_de"
                      name="name_de"
                      value={formData.name_de}
                      onChange={handleChange}
                      className="mt-1"
                      data-testid="input-name-de"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description_de">{t("descriptionDe")}</Label>
                    <Textarea
                      id="description_de"
                      name="description_de"
                      value={formData.description_de}
                      onChange={handleChange}
                      rows={4}
                      className="mt-1"
                      data-testid="input-description-de"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Amenities Tab */}
          <TabsContent value="amenities" className="space-y-6">
            <div className="card-dashboard p-6">
              <h2 className="font-outfit font-bold text-lg mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-metro-navy" />
                {t("amenities")}
              </h2>
              
              {Object.entries(groupedAmenities).map(([category, amenities]) => (
                <div key={category} className="mb-6">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    {getCategories()[category]}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {amenities.map(amenity => {
                      const Icon = amenity.icon;
                      return (
                        <label 
                          key={amenity.code} 
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            formData.amenities.includes(amenity.code)
                              ? "border-metro-navy bg-metro-navy/5"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <Checkbox
                            checked={formData.amenities.includes(amenity.code)}
                            onCheckedChange={() => toggleAmenity(amenity.code)}
                            data-testid={`amenity-${amenity.code}`}
                          />
                          <Icon className={`w-4 h-4 ${formData.amenities.includes(amenity.code) ? "text-metro-navy" : "text-slate-400"}`} />
                          <span className="text-sm">{amenity.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Policies Tab */}
          <TabsContent value="policies" className="space-y-6">
            <div className="card-dashboard p-6">
              <h2 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-metro-navy" />
                {t("policies")}
              </h2>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="cancellation_policy">{t("cancellationPolicy")}</Label>
                  <Select 
                    value={formData.cancellation_policy} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, cancellation_policy: v }))}
                  >
                    <SelectTrigger className="mt-1 max-w-md" data-testid="select-cancellation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getCancellationOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="children_policy">{t("childrenPolicy")}</Label>
                  <Textarea
                    id="children_policy"
                    name="children_policy"
                    value={formData.children_policy}
                    onChange={handleChange}
                    rows={2}
                    className="mt-1 max-w-2xl"
                    placeholder={language === "tr" 
                      ? "Örn: Her yaştan çocuk kabul edilir. 0-6 yaş ücretsiz konaklama."
                      : "e.g., Children of all ages are welcome. Free stay for ages 0-6."
                    }
                    data-testid="input-children-policy"
                  />
                </div>
                
                <div>
                  <Label htmlFor="pet_policy">{t("petPolicy")}</Label>
                  <Textarea
                    id="pet_policy"
                    name="pet_policy"
                    value={formData.pet_policy}
                    onChange={handleChange}
                    rows={2}
                    className="mt-1 max-w-2xl"
                    placeholder={language === "tr"
                      ? "Örn: Evcil hayvanlar kabul edilir (ek ücret uygulanabilir)."
                      : "e.g., Pets are allowed (additional charges may apply)."
                    }
                    data-testid="input-pet-policy"
                  />
                </div>
                
                <div>
                  <Label htmlFor="smoking_policy">{t("smokingPolicy")}</Label>
                  <Textarea
                    id="smoking_policy"
                    name="smoking_policy"
                    value={formData.smoking_policy}
                    onChange={handleChange}
                    rows={2}
                    className="mt-1 max-w-2xl"
                    placeholder={language === "tr"
                      ? "Örn: Tüm alanlarda sigara içilmez."
                      : "e.g., Smoking is not allowed in any areas."
                    }
                    data-testid="input-smoking-policy"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-6">
            <div className="card-dashboard p-6">
              <h2 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-metro-navy" />
                {t("photos")}
              </h2>
              
              {hotelId ? (
                <ImageUpload
                  entityType="hotel"
                  entityId={hotelId}
                  existingImages={formData.photos}
                  onUploadComplete={(newPhotos) => setFormData(prev => ({ ...prev, photos: newPhotos }))}
                />
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <Image className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {language === "tr"
                      ? "Fotoğraf yüklemek için önce tesisi kaydedin."
                      : "Save the property first to upload photos."
                    }
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
