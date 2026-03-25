import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Bed, Trash2, Edit, Users, Maximize, DoorOpen, Link2 } from "lucide-react";

// Translations
const translations = {
  en: {
    manageRooms: "Manage Rooms",
    addRoom: "Add Room",
    noRooms: "No rooms yet",
    addFirstRoom: "Add your first room to start accepting bookings",
    addYourFirstRoom: "Add Your First Room",
    editRoom: "Edit Room",
    addNewRoom: "Add New Room",
    roomNameEn: "Room Name (English)",
    roomNameTr: "Room Name (Turkish)",
    roomType: "Room Type",
    bedType: "Bed Type",
    numberOfBeds: "Number of Beds",
    maxAdults: "Max Adults",
    maxChildren: "Max Children",
    roomSize: "Room Size",
    totalUnits: "Total Units",
    isConnecting: "Connecting Room",
    connectsTo: "Connects to",
    roomDescription: "Room Description",
    roomAmenities: "Room Amenities",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    deleteConfirm: "Are you sure you want to delete this room?",
    adults: "adults",
    children: "children",
    sqm: "m²",
    units: "units",
  },
  tr: {
    manageRooms: "Odaları Yönet",
    addRoom: "Oda Ekle",
    noRooms: "Henüz oda yok",
    addFirstRoom: "Rezervasyon almaya başlamak için ilk odanızı ekleyin",
    addYourFirstRoom: "İlk Odanızı Ekleyin",
    editRoom: "Oda Düzenle",
    addNewRoom: "Yeni Oda Ekle",
    roomNameEn: "Oda Adı (İngilizce)",
    roomNameTr: "Oda Adı (Türkçe)",
    roomType: "Oda Tipi",
    bedType: "Yatak Tipi",
    numberOfBeds: "Yatak Sayısı",
    maxAdults: "Maks Yetişkin",
    maxChildren: "Maks Çocuk",
    roomSize: "Oda Boyutu",
    totalUnits: "Toplam Birim",
    isConnecting: "Bağlantılı Oda",
    connectsTo: "Bağlantılı Oda",
    roomDescription: "Oda Açıklaması",
    roomAmenities: "Oda Olanakları",
    save: "Kaydet",
    cancel: "İptal",
    saving: "Kaydediliyor...",
    deleteConfirm: "Bu odayı silmek istediğinizden emin misiniz?",
    adults: "yetişkin",
    children: "çocuk",
    sqm: "m²",
    units: "birim",
  },
  de: {
    manageRooms: "Zimmer verwalten",
    addRoom: "Zimmer hinzufügen",
    noRooms: "Noch keine Zimmer",
    addFirstRoom: "Fügen Sie Ihr erstes Zimmer hinzu",
    addYourFirstRoom: "Erstes Zimmer hinzufügen",
    editRoom: "Zimmer bearbeiten",
    addNewRoom: "Neues Zimmer hinzufügen",
    roomNameEn: "Zimmername (Englisch)",
    roomNameTr: "Zimmername (Türkisch)",
    roomType: "Zimmertyp",
    bedType: "Betttyp",
    numberOfBeds: "Anzahl der Betten",
    maxAdults: "Max Erwachsene",
    maxChildren: "Max Kinder",
    roomSize: "Zimmergröße",
    totalUnits: "Gesamteinheiten",
    isConnecting: "Verbindungszimmer",
    connectsTo: "Verbunden mit",
    roomDescription: "Zimmerbeschreibung",
    roomAmenities: "Zimmerausstattung",
    save: "Speichern",
    cancel: "Abbrechen",
    saving: "Speichern...",
    deleteConfirm: "Möchten Sie dieses Zimmer wirklich löschen?",
    adults: "Erwachsene",
    children: "Kinder",
    sqm: "m²",
    units: "Einheiten",
  }
};

const roomTypes = {
  en: [
    { value: "standard", label: "Standard Room" },
    { value: "superior", label: "Superior Room" },
    { value: "deluxe", label: "Deluxe Room" },
    { value: "premium", label: "Premium Room" },
    { value: "junior_suite", label: "Junior Suite" },
    { value: "suite", label: "Suite" },
    { value: "executive_suite", label: "Executive Suite" },
    { value: "presidential_suite", label: "Presidential Suite" },
    { value: "family", label: "Family Room" },
    { value: "connecting", label: "Connecting Rooms" },
    { value: "duplex", label: "Duplex" },
    { value: "studio", label: "Studio" },
    { value: "apartment", label: "Apartment" },
    { value: "villa", label: "Villa" },
    { value: "bungalow", label: "Bungalow" },
    { value: "penthouse", label: "Penthouse" },
  ],
  tr: [
    { value: "standard", label: "Standart Oda" },
    { value: "superior", label: "Superior Oda" },
    { value: "deluxe", label: "Deluxe Oda" },
    { value: "premium", label: "Premium Oda" },
    { value: "junior_suite", label: "Junior Süit" },
    { value: "suite", label: "Süit" },
    { value: "executive_suite", label: "Executive Süit" },
    { value: "presidential_suite", label: "Başkanlık Süiti" },
    { value: "family", label: "Aile Odası" },
    { value: "connecting", label: "Bağlantılı Oda" },
    { value: "duplex", label: "Dubleks" },
    { value: "studio", label: "Stüdyo" },
    { value: "apartment", label: "Apart" },
    { value: "villa", label: "Villa" },
    { value: "bungalow", label: "Bungalov" },
    { value: "penthouse", label: "Penthouse" },
  ],
  de: [
    { value: "standard", label: "Standardzimmer" },
    { value: "superior", label: "Superior Zimmer" },
    { value: "deluxe", label: "Deluxe Zimmer" },
    { value: "premium", label: "Premium Zimmer" },
    { value: "junior_suite", label: "Junior Suite" },
    { value: "suite", label: "Suite" },
    { value: "executive_suite", label: "Executive Suite" },
    { value: "presidential_suite", label: "Präsidentensuite" },
    { value: "family", label: "Familienzimmer" },
    { value: "connecting", label: "Verbindungszimmer" },
    { value: "duplex", label: "Duplex" },
    { value: "studio", label: "Studio" },
    { value: "apartment", label: "Apartment" },
    { value: "villa", label: "Villa" },
    { value: "bungalow", label: "Bungalow" },
    { value: "penthouse", label: "Penthouse" },
  ]
};

const bedTypes = {
  en: [
    { value: "single", label: "Single Bed (90cm)" },
    { value: "double", label: "Double Bed (140cm)" },
    { value: "queen", label: "Queen Bed (160cm)" },
    { value: "king", label: "King Bed (180cm)" },
    { value: "super_king", label: "Super King (200cm)" },
    { value: "twin", label: "Twin Beds" },
    { value: "sofa_bed", label: "Sofa Bed" },
    { value: "bunk_bed", label: "Bunk Bed" },
    { value: "murphy_bed", label: "Murphy Bed" },
  ],
  tr: [
    { value: "single", label: "Tek Kişilik (90cm)" },
    { value: "double", label: "Çift Kişilik (140cm)" },
    { value: "queen", label: "Queen Yatak (160cm)" },
    { value: "king", label: "King Yatak (180cm)" },
    { value: "super_king", label: "Super King (200cm)" },
    { value: "twin", label: "İki Tek Yatak" },
    { value: "sofa_bed", label: "Çekyat" },
    { value: "bunk_bed", label: "Ranza" },
    { value: "murphy_bed", label: "Katlanır Yatak" },
  ],
  de: [
    { value: "single", label: "Einzelbett (90cm)" },
    { value: "double", label: "Doppelbett (140cm)" },
    { value: "queen", label: "Queen-Bett (160cm)" },
    { value: "king", label: "King-Bett (180cm)" },
    { value: "super_king", label: "Super King (200cm)" },
    { value: "twin", label: "Zwei Einzelbetten" },
    { value: "sofa_bed", label: "Schlafsofa" },
    { value: "bunk_bed", label: "Etagenbett" },
    { value: "murphy_bed", label: "Schrankbett" },
  ]
};

const roomAmenities = {
  en: [
    { code: "wifi", label: "Wi-Fi" },
    { code: "tv", label: "Smart TV" },
    { code: "air_conditioning", label: "Air Conditioning" },
    { code: "heating", label: "Heating" },
    { code: "minibar", label: "Minibar" },
    { code: "safe_box", label: "Safe Box" },
    { code: "hair_dryer", label: "Hair Dryer" },
    { code: "iron", label: "Iron" },
    { code: "kettle", label: "Kettle" },
    { code: "coffee_machine", label: "Coffee Machine" },
    { code: "balcony", label: "Balcony" },
    { code: "terrace", label: "Terrace" },
    { code: "sea_view", label: "Sea View" },
    { code: "city_view", label: "City View" },
    { code: "garden_view", label: "Garden View" },
    { code: "pool_view", label: "Pool View" },
    { code: "bathtub", label: "Bathtub" },
    { code: "shower", label: "Shower" },
    { code: "jacuzzi", label: "Jacuzzi" },
    { code: "bidet", label: "Bidet" },
    { code: "desk", label: "Work Desk" },
    { code: "sofa", label: "Sofa/Seating Area" },
    { code: "closet", label: "Closet" },
    { code: "blackout_curtains", label: "Blackout Curtains" },
    { code: "soundproof", label: "Soundproof" },
  ],
  tr: [
    { code: "wifi", label: "Wi-Fi" },
    { code: "tv", label: "Akıllı TV" },
    { code: "air_conditioning", label: "Klima" },
    { code: "heating", label: "Isıtma" },
    { code: "minibar", label: "Minibar" },
    { code: "safe_box", label: "Kasa" },
    { code: "hair_dryer", label: "Saç Kurutma" },
    { code: "iron", label: "Ütü" },
    { code: "kettle", label: "Su Isıtıcı" },
    { code: "coffee_machine", label: "Kahve Makinesi" },
    { code: "balcony", label: "Balkon" },
    { code: "terrace", label: "Teras" },
    { code: "sea_view", label: "Deniz Manzarası" },
    { code: "city_view", label: "Şehir Manzarası" },
    { code: "garden_view", label: "Bahçe Manzarası" },
    { code: "pool_view", label: "Havuz Manzarası" },
    { code: "bathtub", label: "Küvet" },
    { code: "shower", label: "Duş" },
    { code: "jacuzzi", label: "Jakuzi" },
    { code: "bidet", label: "Bide" },
    { code: "desk", label: "Çalışma Masası" },
    { code: "sofa", label: "Koltuk/Oturma Alanı" },
    { code: "closet", label: "Dolap" },
    { code: "blackout_curtains", label: "Karartma Perdesi" },
    { code: "soundproof", label: "Ses Yalıtımı" },
  ],
  de: [
    { code: "wifi", label: "WLAN" },
    { code: "tv", label: "Smart-TV" },
    { code: "air_conditioning", label: "Klimaanlage" },
    { code: "heating", label: "Heizung" },
    { code: "minibar", label: "Minibar" },
    { code: "safe_box", label: "Safe" },
    { code: "hair_dryer", label: "Haartrockner" },
    { code: "iron", label: "Bügeleisen" },
    { code: "kettle", label: "Wasserkocher" },
    { code: "coffee_machine", label: "Kaffeemaschine" },
    { code: "balcony", label: "Balkon" },
    { code: "terrace", label: "Terrasse" },
    { code: "sea_view", label: "Meerblick" },
    { code: "city_view", label: "Stadtblick" },
    { code: "garden_view", label: "Gartenblick" },
    { code: "pool_view", label: "Poolblick" },
    { code: "bathtub", label: "Badewanne" },
    { code: "shower", label: "Dusche" },
    { code: "jacuzzi", label: "Whirlpool" },
    { code: "bidet", label: "Bidet" },
    { code: "desk", label: "Schreibtisch" },
    { code: "sofa", label: "Sofa/Sitzbereich" },
    { code: "closet", label: "Kleiderschrank" },
    { code: "blackout_curtains", label: "Verdunkelungsvorhänge" },
    { code: "soundproof", label: "Schallisoliert" },
  ]
};

const initialRoomForm = {
  name_en: "",
  name_tr: "",
  description_en: "",
  description_tr: "",
  room_type: "standard",
  bed_type: "double",
  bed_count: "1",
  max_adults: "2",
  max_children: "1",
  size_sqm: "",
  total_units: "5",
  is_smoking: false,
  is_connecting: false,
  connects_to: "",
  amenities: [],
};

export default function ExtranetRooms() {
  const { hotelId } = useParams();
  const { language } = useLanguage();
  
  const t = (key) => translations[language]?.[key] || translations.en[key] || key;
  const getRoomTypes = () => roomTypes[language] || roomTypes.en;
  const getBedTypes = () => bedTypes[language] || bedTypes.en;
  const getAmenities = () => roomAmenities[language] || roomAmenities.en;
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState(initialRoomForm);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    loadRooms();
  }, [hotelId]);
  
  const loadRooms = async () => {
    try {
      const response = await fetch(`${API}/hotels/${hotelId}/rooms`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (error) {
      console.error("Error loading rooms:", error);
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
  
  const openAddDialog = () => {
    setEditingRoom(null);
    setFormData(initialRoomForm);
    setDialogOpen(true);
  };
  
  const openEditDialog = (room) => {
    setEditingRoom(room);
    setFormData({
      name_en: room.name?.en || "",
      name_tr: room.name?.tr || "",
      description_en: room.description?.en || "",
      description_tr: room.description?.tr || "",
      room_type: room.room_type || "standard",
      bed_type: room.beds?.[0]?.bed_type || "double",
      bed_count: room.beds?.[0]?.count?.toString() || "1",
      max_adults: room.max_adults?.toString() || "2",
      max_children: room.max_children?.toString() || "1",
      size_sqm: room.size_sqm?.toString() || "",
      total_units: room.total_units?.toString() || "5",
      is_smoking: room.is_smoking || false,
      is_connecting: room.is_connecting || false,
      connects_to: room.connects_to || "",
      amenities: room.amenities || [],
    });
    setDialogOpen(true);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name_en) {
      toast.error(language === "tr" ? "Oda adı gerekli" : "Room name is required");
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        hotel_id: hotelId,
        name: { en: formData.name_en, tr: formData.name_tr || formData.name_en },
        description: { en: formData.description_en, tr: formData.description_tr || formData.description_en },
        room_type: formData.room_type,
        beds: [{ bed_type: formData.bed_type, count: parseInt(formData.bed_count) }],
        max_adults: parseInt(formData.max_adults),
        max_children: parseInt(formData.max_children),
        size_sqm: formData.size_sqm ? parseFloat(formData.size_sqm) : null,
        total_units: parseInt(formData.total_units) || 5,
        is_smoking: formData.is_smoking,
        is_connecting: formData.is_connecting,
        connects_to: formData.connects_to || null,
        amenities: formData.amenities,
      };
      
      const url = editingRoom ? `${API}/rooms/${editingRoom.room_id}` : `${API}/rooms`;
      const method = editingRoom ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error("Failed to save room");
      
      toast.success(editingRoom 
        ? (language === "tr" ? "Oda güncellendi!" : "Room updated!")
        : (language === "tr" ? "Oda oluşturuldu!" : "Room created!")
      );
      setDialogOpen(false);
      loadRooms();
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error(language === "tr" ? "Oda kaydedilemedi" : "Failed to save room");
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async (roomId) => {
    if (!confirm(t("deleteConfirm"))) return;
    
    try {
      const response = await fetch(`${API}/rooms/${roomId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to delete room");
      
      toast.success(language === "tr" ? "Oda silindi" : "Room deleted");
      loadRooms();
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error(language === "tr" ? "Oda silinemedi" : "Failed to delete room");
    }
  };
  
  const getRoomTypeLabel = (typeValue) => {
    const types = getRoomTypes();
    return types.find(t => t.value === typeValue)?.label || typeValue;
  };
  
  const getBedTypeLabel = (typeValue) => {
    const types = getBedTypes();
    return types.find(t => t.value === typeValue)?.label || typeValue;
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-metro-navy text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/extranet" className="hover:bg-white/10 p-2 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <span className="font-outfit font-bold text-xl">{t("manageRooms")}</span>
            </div>
            
            <Button onClick={openAddDialog} className="bg-white text-metro-navy hover:bg-white/90" data-testid="add-room-btn">
              <Plus className="w-4 h-4 mr-2" />
              {t("addRoom")}
            </Button>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 card-dashboard" data-testid="no-rooms">
            <Bed className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-outfit font-semibold text-xl mb-2">{t("noRooms")}</h3>
            <p className="text-muted-foreground mb-4">{t("addFirstRoom")}</p>
            <Button onClick={openAddDialog} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              {t("addYourFirstRoom")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {rooms.map(room => (
              <div key={room.room_id} className="card-dashboard p-6" data-testid={`room-card-${room.room_id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg bg-metro-navy/10 flex items-center justify-center">
                      {room.is_connecting ? (
                        <Link2 className="w-10 h-10 text-metro-navy" />
                      ) : room.room_type?.includes("suite") ? (
                        <DoorOpen className="w-10 h-10 text-metro-navy" />
                      ) : (
                        <Bed className="w-10 h-10 text-metro-navy" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-outfit font-semibold text-lg">
                        {room.name?.tr || room.name?.en}
                      </h3>
                      <div className="text-sm text-muted-foreground mb-2">
                        {getRoomTypeLabel(room.room_type)}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {room.max_adults} {t("adults")}, {room.max_children} {t("children")}
                        </span>
                        {room.size_sqm && (
                          <span className="flex items-center gap-1">
                            <Maximize className="w-4 h-4" />
                            {room.size_sqm} {t("sqm")}
                          </span>
                        )}
                        <span>
                          {room.beds?.map(b => `${b.count}x ${getBedTypeLabel(b.bed_type)}`).join(", ")}
                        </span>
                        {room.total_units && (
                          <span className="text-metro-navy font-medium">
                            {room.total_units} {t("units")}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {room.amenities?.slice(0, 6).map(a => (
                          <span key={a} className="text-xs bg-slate-100 px-2 py-1 rounded capitalize">
                            {getAmenities().find(am => am.code === a)?.label || a.replace("_", " ")}
                          </span>
                        ))}
                        {room.amenities?.length > 6 && (
                          <span className="text-xs text-muted-foreground">+{room.amenities.length - 6}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(room)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(room.room_id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRoom ? t("editRoom") : t("addNewRoom")}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="room-form">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name_tr">{t("roomNameTr")} *</Label>
                  <Input
                    id="name_tr"
                    name="name_tr"
                    value={formData.name_tr}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder={language === "tr" ? "Örn: Deluxe Deniz Manzaralı" : "e.g., Deluxe Sea View"}
                  />
                </div>
                <div>
                  <Label htmlFor="name_en">{t("roomNameEn")}</Label>
                  <Input
                    id="name_en"
                    name="name_en"
                    value={formData.name_en}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="e.g., Deluxe Sea View"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("roomType")}</Label>
                  <Select value={formData.room_type} onValueChange={(v) => setFormData(prev => ({ ...prev, room_type: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getRoomTypes().map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("bedType")}</Label>
                  <Select value={formData.bed_type} onValueChange={(v) => setFormData(prev => ({ ...prev, bed_type: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getBedTypes().map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="bed_count">{t("numberOfBeds")}</Label>
                  <Input
                    id="bed_count"
                    name="bed_count"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.bed_count}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="max_adults">{t("maxAdults")}</Label>
                  <Input
                    id="max_adults"
                    name="max_adults"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.max_adults}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="max_children">{t("maxChildren")}</Label>
                  <Input
                    id="max_children"
                    name="max_children"
                    type="number"
                    min="0"
                    max="6"
                    value={formData.max_children}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="size_sqm">{t("roomSize")}</Label>
                  <Input
                    id="size_sqm"
                    name="size_sqm"
                    type="number"
                    value={formData.size_sqm}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="m²"
                  />
                </div>
                <div>
                  <Label htmlFor="total_units">{t("totalUnits")}</Label>
                  <Input
                    id="total_units"
                    name="total_units"
                    type="number"
                    min="1"
                    value={formData.total_units}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
              
              {/* Connecting Room Option */}
              <div className="border rounded-lg p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.is_connecting}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_connecting: checked }))}
                  />
                  <Link2 className="w-4 h-4 text-metro-navy" />
                  <span className="font-medium">{t("isConnecting")}</span>
                </label>
                {formData.is_connecting && (
                  <div>
                    <Label htmlFor="connects_to">{t("connectsTo")}</Label>
                    <Select value={formData.connects_to} onValueChange={(v) => setFormData(prev => ({ ...prev, connects_to: v }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={language === "tr" ? "Bağlantılı odayı seçin" : "Select connected room"} />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.filter(r => r.room_id !== editingRoom?.room_id).map(room => (
                          <SelectItem key={room.room_id} value={room.room_id}>
                            {room.name?.tr || room.name?.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {/* Description */}
              <div>
                <Label htmlFor="description_tr">{t("roomDescription")} (TR)</Label>
                <Textarea
                  id="description_tr"
                  name="description_tr"
                  value={formData.description_tr}
                  onChange={handleChange}
                  rows={2}
                  className="mt-1"
                  placeholder={language === "tr" ? "Oda açıklaması..." : "Room description..."}
                />
              </div>
              
              <div>
                <Label className="mb-2 block">{t("roomAmenities")}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                  {getAmenities().map(amenity => (
                    <label key={amenity.code} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.amenities.includes(amenity.code)}
                        onCheckedChange={() => toggleAmenity(amenity.code)}
                      />
                      <span className="text-sm">{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t("cancel")}</Button>
                <Button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? t("saving") : editingRoom ? t("save") : t("addRoom")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
