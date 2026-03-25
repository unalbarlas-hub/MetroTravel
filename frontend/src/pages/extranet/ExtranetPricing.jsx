import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format, addDays, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, getDay, isSameDay, isWeekend } from "date-fns";
import { tr, de, enUS } from "date-fns/locale";
import { 
  ArrowLeft, Plus, DollarSign, Calendar, ChevronLeft, ChevronRight, 
  Bed, Users, Save, Copy, AlertCircle, Check, X, Building2,
  TrendingUp, Briefcase, Package, Globe
} from "lucide-react";

// Translations
const translations = {
  en: {
    pricingAvailability: "Pricing & Availability",
    selectRoom: "Select Room",
    roomTypes: "Room Types",
    ratePlans: "Rate Plans",
    priceTypes: "Price Types",
    marketPrice: "Market Price",
    localPrice: "Local (TR)",
    corporatePrice: "Corporate",
    dynamicPackage: "Dynamic Package",
    inventory: "Inventory",
    availability: "Availability",
    price: "Price",
    quota: "Quota",
    available: "Available",
    soldOut: "Sold Out",
    closed: "Closed",
    bulkUpdate: "Bulk Update",
    applyToWeekends: "Apply to weekends only",
    applyToWeekdays: "Apply to weekdays only",
    applyToAll: "Apply to all days",
    startDate: "Start Date",
    endDate: "End Date",
    basePrice: "Base Price",
    availableRooms: "Available Rooms",
    createRatePlan: "Create Rate Plan",
    editRatePlan: "Edit Rate Plan",
    ratePlanName: "Rate Plan Name",
    rateType: "Rate Type",
    mealPlan: "Meal Plan",
    refundable: "Refundable",
    nonRefundable: "Non-Refundable",
    roomOnly: "Room Only",
    breakfast: "Breakfast",
    halfBoard: "Half Board",
    fullBoard: "Full Board",
    allInclusive: "All Inclusive",
    noRooms: "No rooms available",
    addRoomsFirst: "Add rooms first to set up pricing",
    manageRooms: "Manage Rooms",
    selectRatePlan: "Select a rate plan to view pricing",
    save: "Save",
    cancel: "Cancel",
    create: "Create",
    update: "Update",
    copyFromPrevious: "Copy from previous month",
    weekday: "Weekday",
    weekend: "Weekend",
    minStay: "Min Stay",
    maxStay: "Max Stay",
    stopSale: "Stop Sale",
    openSale: "Open Sale",
    nights: "nights",
  },
  tr: {
    pricingAvailability: "Fiyat & Müsaitlik",
    selectRoom: "Oda Seçin",
    roomTypes: "Oda Tipleri",
    ratePlans: "Tarife Planları",
    priceTypes: "Fiyat Tipleri",
    marketPrice: "Pazar Fiyatı",
    localPrice: "Yurtiçi (TR)",
    corporatePrice: "Kurumsal",
    dynamicPackage: "Dinamik Paket",
    inventory: "Envanter",
    availability: "Müsaitlik",
    price: "Fiyat",
    quota: "Kontenjan",
    available: "Müsait",
    soldOut: "Tükendi",
    closed: "Kapalı",
    bulkUpdate: "Toplu Güncelleme",
    applyToWeekends: "Sadece hafta sonları",
    applyToWeekdays: "Sadece hafta içi",
    applyToAll: "Tüm günler",
    startDate: "Başlangıç Tarihi",
    endDate: "Bitiş Tarihi",
    basePrice: "Baz Fiyat",
    availableRooms: "Müsait Oda",
    createRatePlan: "Tarife Planı Oluştur",
    editRatePlan: "Tarife Planı Düzenle",
    ratePlanName: "Tarife Planı Adı",
    rateType: "Tarife Tipi",
    mealPlan: "Yemek Planı",
    refundable: "İade Edilebilir",
    nonRefundable: "İade Edilemez",
    roomOnly: "Sadece Oda",
    breakfast: "Kahvaltı Dahil",
    halfBoard: "Yarım Pansiyon",
    fullBoard: "Tam Pansiyon",
    allInclusive: "Her Şey Dahil",
    noRooms: "Oda bulunamadı",
    addRoomsFirst: "Fiyatlandırma için önce oda ekleyin",
    manageRooms: "Odaları Yönet",
    selectRatePlan: "Fiyatları görüntülemek için tarife planı seçin",
    save: "Kaydet",
    cancel: "İptal",
    create: "Oluştur",
    update: "Güncelle",
    copyFromPrevious: "Önceki aydan kopyala",
    weekday: "Hafta içi",
    weekend: "Hafta sonu",
    minStay: "Min Konaklama",
    maxStay: "Max Konaklama",
    stopSale: "Satışı Durdur",
    openSale: "Satışa Aç",
    nights: "gece",
  },
  de: {
    pricingAvailability: "Preise & Verfügbarkeit",
    selectRoom: "Zimmer auswählen",
    roomTypes: "Zimmertypen",
    ratePlans: "Tarifpläne",
    priceTypes: "Preistypen",
    marketPrice: "Marktpreis",
    localPrice: "Lokal (TR)",
    corporatePrice: "Firmenpreis",
    dynamicPackage: "Dynamisches Paket",
    inventory: "Inventar",
    availability: "Verfügbarkeit",
    price: "Preis",
    quota: "Kontingent",
    available: "Verfügbar",
    soldOut: "Ausverkauft",
    closed: "Geschlossen",
    bulkUpdate: "Massenaktualisierung",
    applyToWeekends: "Nur Wochenenden",
    applyToWeekdays: "Nur Wochentage",
    applyToAll: "Alle Tage",
    startDate: "Startdatum",
    endDate: "Enddatum",
    basePrice: "Grundpreis",
    availableRooms: "Verfügbare Zimmer",
    createRatePlan: "Tarifplan erstellen",
    editRatePlan: "Tarifplan bearbeiten",
    ratePlanName: "Tarifplanname",
    rateType: "Tariftyp",
    mealPlan: "Verpflegung",
    refundable: "Erstattungsfähig",
    nonRefundable: "Nicht erstattungsfähig",
    roomOnly: "Nur Zimmer",
    breakfast: "Frühstück",
    halfBoard: "Halbpension",
    fullBoard: "Vollpension",
    allInclusive: "All Inclusive",
    noRooms: "Keine Zimmer verfügbar",
    addRoomsFirst: "Fügen Sie zuerst Zimmer hinzu",
    manageRooms: "Zimmer verwalten",
    selectRatePlan: "Wählen Sie einen Tarifplan",
    save: "Speichern",
    cancel: "Abbrechen",
    create: "Erstellen",
    update: "Aktualisieren",
    copyFromPrevious: "Vom Vormonat kopieren",
    weekday: "Wochentag",
    weekend: "Wochenende",
    minStay: "Min Aufenthalt",
    maxStay: "Max Aufenthalt",
    stopSale: "Verkauf stoppen",
    openSale: "Verkauf öffnen",
    nights: "Nächte",
  }
};

const roomTypeLabels = {
  en: {
    standard: "Standard Room",
    deluxe: "Deluxe Room",
    suite: "Suite",
    junior_suite: "Junior Suite",
    family: "Family Room",
    connecting: "Connecting Rooms",
    executive: "Executive Room",
    penthouse: "Penthouse",
    studio: "Studio",
    apartment: "Apartment",
  },
  tr: {
    standard: "Standart Oda",
    deluxe: "Deluxe Oda",
    suite: "Süit",
    junior_suite: "Junior Süit",
    family: "Aile Odası",
    connecting: "Bağlantılı Oda",
    executive: "Executive Oda",
    penthouse: "Penthouse",
    studio: "Stüdyo",
    apartment: "Apart",
  },
  de: {
    standard: "Standardzimmer",
    deluxe: "Deluxe-Zimmer",
    suite: "Suite",
    junior_suite: "Junior Suite",
    family: "Familienzimmer",
    connecting: "Verbindungszimmer",
    executive: "Executive-Zimmer",
    penthouse: "Penthouse",
    studio: "Studio",
    apartment: "Apartment",
  }
};

const priceTypeConfig = [
  { key: "market", icon: TrendingUp, color: "text-blue-600", bgColor: "bg-blue-50" },
  { key: "local_tr", icon: Globe, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  { key: "corporate", icon: Briefcase, color: "text-purple-600", bgColor: "bg-purple-50" },
  { key: "dynamic_package", icon: Package, color: "text-orange-600", bgColor: "bg-orange-50" },
];

const mealPlans = [
  { value: "room_only", labelKey: "roomOnly" },
  { value: "breakfast", labelKey: "breakfast" },
  { value: "half_board", labelKey: "halfBoard" },
  { value: "full_board", labelKey: "fullBoard" },
  { value: "all_inclusive", labelKey: "allInclusive" },
];

const rateTypes = [
  { value: "refundable", labelKey: "refundable" },
  { value: "non_refundable", labelKey: "nonRefundable" },
];

export default function ExtranetPricing() {
  const { hotelId } = useParams();
  const { language } = useLanguage();
  
  const t = (key) => translations[language]?.[key] || translations.en[key] || key;
  const getRoomTypeLabel = (type) => roomTypeLabels[language]?.[type] || roomTypeLabels.en[type] || type;
  const getDateLocale = () => language === "tr" ? tr : language === "de" ? de : enUS;
  
  const [rooms, setRooms] = useState([]);
  const [ratePlans, setRatePlans] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRatePlan, setSelectedRatePlan] = useState(null);
  const [selectedPriceType, setSelectedPriceType] = useState("market");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Edited cells tracking
  const [editedCells, setEditedCells] = useState({});
  
  // Rate Plan Dialog
  const [ratePlanDialogOpen, setRatePlanDialogOpen] = useState(false);
  const [editingRatePlan, setEditingRatePlan] = useState(null);
  const [ratePlanForm, setRatePlanForm] = useState({
    name_en: "",
    name_tr: "",
    rate_type: "refundable",
    meal_plan: "breakfast",
    base_price: "",
    base_price_local: "",
    base_price_corporate: "",
    base_price_package: "",
  });
  
  // Bulk Update Dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    price_market: "",
    price_local: "",
    price_corporate: "",
    price_package: "",
    available_units: "10",
    apply_to: "all", // all, weekdays, weekends
    min_stay: "1",
    stop_sale: false,
  });
  
  useEffect(() => {
    loadData();
  }, [hotelId]);
  
  useEffect(() => {
    if (selectedRoom && selectedRatePlan) {
      loadInventory();
    }
  }, [selectedRoom, selectedRatePlan, currentMonth]);
  
  const loadData = async () => {
    try {
      const [roomsRes, ratePlansRes] = await Promise.all([
        fetch(`${API}/hotels/${hotelId}/rooms`, { credentials: "include" }),
        fetch(`${API}/hotels/${hotelId}/rate-plans`, { credentials: "include" }),
      ]);
      
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData.rooms || []);
        if (roomsData.rooms?.length > 0) {
          setSelectedRoom(roomsData.rooms[0]);
        }
      }
      
      if (ratePlansRes.ok) {
        const rpData = await ratePlansRes.json();
        setRatePlans(rpData.rate_plans || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadInventory = async () => {
    if (!selectedRoom || !selectedRatePlan) return;
    
    const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const endDate = format(endOfMonth(addMonths(currentMonth, 1)), "yyyy-MM-dd");
    
    try {
      const response = await fetch(
        `${API}/inventory/${selectedRoom.room_id}?rate_plan_id=${selectedRatePlan.rate_plan_id}&start_date=${startDate}&end_date=${endDate}`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setInventory(data.inventory || []);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    }
  };
  
  const openRatePlanDialog = (ratePlan = null) => {
    setEditingRatePlan(ratePlan);
    if (ratePlan) {
      setRatePlanForm({
        name_en: ratePlan.name?.en || "",
        name_tr: ratePlan.name?.tr || "",
        rate_type: ratePlan.rate_type || "refundable",
        meal_plan: ratePlan.meal_plan || "breakfast",
        base_price: ratePlan.base_price?.toString() || "",
        base_price_local: ratePlan.prices?.local_tr?.toString() || "",
        base_price_corporate: ratePlan.prices?.corporate?.toString() || "",
        base_price_package: ratePlan.prices?.dynamic_package?.toString() || "",
      });
    } else {
      setRatePlanForm({
        name_en: "",
        name_tr: "",
        rate_type: "refundable",
        meal_plan: "breakfast",
        base_price: "",
        base_price_local: "",
        base_price_corporate: "",
        base_price_package: "",
      });
    }
    setRatePlanDialogOpen(true);
  };
  
  const handleCreateRatePlan = async (e) => {
    e.preventDefault();
    
    if (!selectedRoom || !ratePlanForm.name_en || !ratePlanForm.base_price) {
      toast.error(language === "tr" ? "Lütfen zorunlu alanları doldurun" : "Please fill in all required fields");
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        room_id: selectedRoom.room_id,
        name: { en: ratePlanForm.name_en, tr: ratePlanForm.name_tr || ratePlanForm.name_en },
        rate_type: ratePlanForm.rate_type,
        meal_plan: ratePlanForm.meal_plan,
        base_price: parseFloat(ratePlanForm.base_price),
        currency: "TRY",
        prices: {
          market: parseFloat(ratePlanForm.base_price),
          local_tr: ratePlanForm.base_price_local ? parseFloat(ratePlanForm.base_price_local) : null,
          corporate: ratePlanForm.base_price_corporate ? parseFloat(ratePlanForm.base_price_corporate) : null,
          dynamic_package: ratePlanForm.base_price_package ? parseFloat(ratePlanForm.base_price_package) : null,
        }
      };
      
      const url = editingRatePlan ? `${API}/rate-plans/${editingRatePlan.rate_plan_id}` : `${API}/rate-plans`;
      const method = editingRatePlan ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error("Failed to save rate plan");
      
      toast.success(editingRatePlan 
        ? (language === "tr" ? "Tarife planı güncellendi!" : "Rate plan updated!")
        : (language === "tr" ? "Tarife planı oluşturuldu!" : "Rate plan created!")
      );
      setRatePlanDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(language === "tr" ? "Tarife planı kaydedilemedi" : "Failed to save rate plan");
    } finally {
      setSaving(false);
    }
  };
  
  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedRoom || !selectedRatePlan) {
      toast.error(language === "tr" ? "Lütfen oda ve tarife planı seçin" : "Please select room and rate plan");
      return;
    }
    
    setSaving(true);
    
    const allDates = eachDayOfInterval({
      start: new Date(bulkForm.start_date),
      end: new Date(bulkForm.end_date),
    });
    
    // Filter based on apply_to
    const filteredDates = allDates.filter(date => {
      if (bulkForm.apply_to === "weekends") return isWeekend(date);
      if (bulkForm.apply_to === "weekdays") return !isWeekend(date);
      return true;
    });
    
    const dates = filteredDates.map(date => ({
      date: format(date, "yyyy-MM-dd"),
      price: bulkForm.price_market ? parseFloat(bulkForm.price_market) : null,
      price_local: bulkForm.price_local ? parseFloat(bulkForm.price_local) : null,
      price_corporate: bulkForm.price_corporate ? parseFloat(bulkForm.price_corporate) : null,
      price_package: bulkForm.price_package ? parseFloat(bulkForm.price_package) : null,
      available_units: parseInt(bulkForm.available_units),
      min_stay: parseInt(bulkForm.min_stay) || 1,
      stop_sale: bulkForm.stop_sale,
    }));
    
    try {
      const response = await fetch(`${API}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          room_id: selectedRoom.room_id,
          rate_plan_id: selectedRatePlan.rate_plan_id,
          dates,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to update inventory");
      
      toast.success(language === "tr" 
        ? `${dates.length} gün güncellendi!` 
        : `Updated ${dates.length} dates!`
      );
      setBulkDialogOpen(false);
      loadInventory();
    } catch (error) {
      toast.error(language === "tr" ? "Güncelleme başarısız" : "Failed to update inventory");
    } finally {
      setSaving(false);
    }
  };
  
  const handleCellEdit = (dateStr, field, value) => {
    setEditedCells(prev => ({
      ...prev,
      [`${dateStr}_${field}`]: value
    }));
  };
  
  const saveEditedCells = async () => {
    if (Object.keys(editedCells).length === 0) return;
    
    setSaving(true);
    
    // Group edits by date
    const dateUpdates = {};
    Object.entries(editedCells).forEach(([key, value]) => {
      const [dateStr, field] = key.split("_");
      if (!dateUpdates[dateStr]) {
        dateUpdates[dateStr] = { date: dateStr };
      }
      dateUpdates[dateStr][field] = value;
    });
    
    const dates = Object.values(dateUpdates).map(update => ({
      date: update.date,
      price: update.price ? parseFloat(update.price) : undefined,
      available_units: update.quota ? parseInt(update.quota) : undefined,
    }));
    
    try {
      const response = await fetch(`${API}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          room_id: selectedRoom.room_id,
          rate_plan_id: selectedRatePlan.rate_plan_id,
          dates,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to save");
      
      toast.success(language === "tr" ? "Kaydedildi!" : "Saved!");
      setEditedCells({});
      loadInventory();
    } catch (error) {
      toast.error(language === "tr" ? "Kaydetme başarısız" : "Failed to save");
    } finally {
      setSaving(false);
    }
  };
  
  // Generate calendar days
  const getDaysInMonth = () => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  };
  
  const getInventoryForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return inventory.find(inv => inv.date === dateStr);
  };
  
  const getPriceForType = (inv, priceType) => {
    if (!inv) return null;
    switch (priceType) {
      case "local_tr": return inv.price_local || inv.price;
      case "corporate": return inv.price_corporate || inv.price;
      case "dynamic_package": return inv.price_package || inv.price;
      default: return inv.price;
    }
  };
  
  // Filter rate plans for selected room
  const roomRatePlans = ratePlans.filter(rp => rp.room_id === selectedRoom?.room_id);
  
  // Day labels
  const dayLabels = language === "tr" 
    ? ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]
    : language === "de"
    ? ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
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
                <h1 className="font-outfit font-bold text-xl">{t("pricingAvailability")}</h1>
                {selectedRoom && (
                  <p className="text-white/70 text-sm">{selectedRoom.name?.tr || selectedRoom.name?.en}</p>
                )}
              </div>
            </div>
            
            {Object.keys(editedCells).length > 0 && (
              <Button 
                onClick={saveEditedCells}
                className="bg-metro-orange hover:bg-metro-orange/90"
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? (language === "tr" ? "Kaydediliyor..." : "Saving...") : t("save")}
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-metro-navy mx-auto"></div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 card-dashboard" data-testid="no-rooms">
            <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-outfit font-semibold text-xl mb-2">{t("noRooms")}</h3>
            <p className="text-muted-foreground mb-4">{t("addRoomsFirst")}</p>
            <Link to={`/extranet/rooms/${hotelId}`}>
              <Button className="btn-primary">{t("manageRooms")}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Sidebar */}
            <div className="xl:col-span-1 space-y-4">
              {/* Room Selection */}
              <div className="card-dashboard p-4">
                <Label className="mb-2 block font-medium">{t("selectRoom")}</Label>
                <div className="space-y-2">
                  {rooms.map(room => (
                    <button
                      key={room.room_id}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedRoom?.room_id === room.room_id
                          ? "border-metro-navy bg-metro-navy/5"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => {
                        setSelectedRoom(room);
                        setSelectedRatePlan(null);
                        setEditedCells({});
                      }}
                      data-testid={`room-${room.room_id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedRoom?.room_id === room.room_id ? "bg-metro-navy text-white" : "bg-slate-100"
                        }`}>
                          <Bed className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {room.name?.tr || room.name?.en}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getRoomTypeLabel(room.room_type)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Rate Plans */}
              {selectedRoom && (
                <div className="card-dashboard p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="font-medium">{t("ratePlans")}</Label>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => openRatePlanDialog()}
                      data-testid="add-rate-plan-btn"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {roomRatePlans.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        {language === "tr" ? "Tarife planı yok" : "No rate plans"}
                      </p>
                      <Button size="sm" variant="outline" onClick={() => openRatePlanDialog()}>
                        <Plus className="w-4 h-4 mr-1" />
                        {t("createRatePlan")}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {roomRatePlans.map(rp => (
                        <button
                          key={rp.rate_plan_id}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedRatePlan?.rate_plan_id === rp.rate_plan_id
                              ? "bg-metro-navy text-white"
                              : "bg-slate-50 hover:bg-slate-100"
                          }`}
                          onClick={() => {
                            setSelectedRatePlan(rp);
                            setEditedCells({});
                          }}
                          data-testid={`rate-plan-${rp.rate_plan_id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{rp.name?.tr || rp.name?.en}</div>
                              <div className={`text-xs ${selectedRatePlan?.rate_plan_id === rp.rate_plan_id ? "text-white/70" : "text-muted-foreground"}`}>
                                {t(rp.meal_plan)} • ₺{rp.base_price?.toLocaleString()}
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              rp.rate_type === "refundable" 
                                ? "bg-emerald-100 text-emerald-700" 
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {rp.rate_type === "refundable" ? "✓" : "✗"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Price Type Selection */}
              {selectedRatePlan && (
                <div className="card-dashboard p-4">
                  <Label className="mb-3 block font-medium">{t("priceTypes")}</Label>
                  <div className="space-y-2">
                    {priceTypeConfig.map(pt => {
                      const Icon = pt.icon;
                      return (
                        <button
                          key={pt.key}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            selectedPriceType === pt.key
                              ? `border-current ${pt.bgColor} ${pt.color}`
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                          onClick={() => setSelectedPriceType(pt.key)}
                        >
                          <Icon className={`w-4 h-4 ${selectedPriceType === pt.key ? pt.color : "text-slate-400"}`} />
                          <span className="text-sm font-medium">
                            {t(pt.key === "market" ? "marketPrice" : 
                               pt.key === "local_tr" ? "localPrice" : 
                               pt.key === "corporate" ? "corporatePrice" : "dynamicPackage")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Bulk Update Button */}
              {selectedRoom && selectedRatePlan && (
                <div className="card-dashboard p-4">
                  <Button 
                    className="w-full btn-primary"
                    onClick={() => setBulkDialogOpen(true)}
                    data-testid="bulk-update-btn"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {t("bulkUpdate")}
                  </Button>
                </div>
              )}
            </div>
            
            {/* Calendar */}
            <div className="xl:col-span-4">
              <div className="card-dashboard p-6">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <Button variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="font-outfit font-bold text-xl">
                    {format(currentMonth, "MMMM yyyy", { locale: getDateLocale() })}
                  </h2>
                  <Button variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
                
                {!selectedRatePlan ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>{t("selectRatePlan")}</p>
                  </div>
                ) : (
                  <>
                    {/* Calendar Legend */}
                    <div className="flex flex-wrap gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300"></div>
                        <span>{t("available")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
                        <span>{t("soldOut")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-slate-100 border border-slate-300"></div>
                        <span>{t("closed")}</span>
                      </div>
                    </div>
                    
                    {/* Calendar Header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayLabels.map((day, i) => (
                        <div key={day} className={`text-center text-xs font-medium py-2 ${
                          i === 0 || i === 6 ? "text-red-500" : "text-muted-foreground"
                        }`}>
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells for first day of month */}
                      {Array.from({ length: getDay(startOfMonth(currentMonth)) }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-24" />
                      ))}
                      
                      {/* Days */}
                      {getDaysInMonth().map(date => {
                        const inv = getInventoryForDate(date);
                        const dateStr = format(date, "yyyy-MM-dd");
                        const isPast = date < new Date();
                        const isWeekendDay = isWeekend(date);
                        const price = getPriceForType(inv, selectedPriceType);
                        const quota = inv?.available_units ?? 0;
                        const isSoldOut = quota === 0;
                        const isClosed = inv?.stop_sale;
                        
                        // Get edited values
                        const editedPrice = editedCells[`${dateStr}_price`];
                        const editedQuota = editedCells[`${dateStr}_quota`];
                        
                        return (
                          <div
                            key={date.toISOString()}
                            className={`h-24 p-2 rounded-lg border transition-colors ${
                              isPast 
                                ? "bg-slate-50 opacity-50 cursor-not-allowed" 
                                : isClosed
                                  ? "bg-slate-100 border-slate-300"
                                  : isSoldOut
                                    ? "bg-red-50 border-red-200"
                                    : inv
                                      ? "bg-emerald-50 border-emerald-200"
                                      : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className={`text-sm font-medium mb-1 ${
                              isWeekendDay ? "text-red-500" : ""
                            }`}>
                              {format(date, "d")}
                            </div>
                            
                            {!isPast && (
                              <div className="space-y-1">
                                {/* Price Input */}
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">₺</span>
                                  <input
                                    type="number"
                                    className="w-full text-xs font-bold bg-transparent border-b border-dashed border-slate-300 focus:border-metro-navy focus:outline-none"
                                    value={editedPrice ?? (price || selectedRatePlan.base_price || "")}
                                    onChange={(e) => handleCellEdit(dateStr, "price", e.target.value)}
                                    placeholder={selectedRatePlan.base_price?.toString()}
                                  />
                                </div>
                                
                                {/* Quota Input */}
                                <div className="flex items-center gap-1">
                                  <Bed className="w-3 h-3 text-muted-foreground" />
                                  <input
                                    type="number"
                                    className={`w-8 text-xs bg-transparent border-b border-dashed focus:outline-none ${
                                      quota === 0 ? "text-red-500 border-red-300" : "border-slate-300 focus:border-metro-navy"
                                    }`}
                                    value={editedQuota ?? quota}
                                    onChange={(e) => handleCellEdit(dateStr, "quota", e.target.value)}
                                    min="0"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Rate Plan Dialog */}
        <Dialog open={ratePlanDialogOpen} onOpenChange={setRatePlanDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingRatePlan ? t("editRatePlan") : t("createRatePlan")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRatePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("ratePlanName")} (EN) *</Label>
                  <Input
                    value={ratePlanForm.name_en}
                    onChange={(e) => setRatePlanForm(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="e.g., Best Available Rate"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{t("ratePlanName")} (TR)</Label>
                  <Input
                    value={ratePlanForm.name_tr}
                    onChange={(e) => setRatePlanForm(prev => ({ ...prev, name_tr: e.target.value }))}
                    placeholder="Örn: En İyi Fiyat"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("rateType")}</Label>
                  <Select value={ratePlanForm.rate_type} onValueChange={(v) => setRatePlanForm(prev => ({ ...prev, rate_type: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rateTypes.map(rt => (
                        <SelectItem key={rt.value} value={rt.value}>{t(rt.labelKey)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("mealPlan")}</Label>
                  <Select value={ratePlanForm.meal_plan} onValueChange={(v) => setRatePlanForm(prev => ({ ...prev, meal_plan: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mealPlans.map(mp => (
                        <SelectItem key={mp.value} value={mp.value}>{t(mp.labelKey)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Price Types */}
              <div className="border rounded-lg p-4 space-y-3">
                <Label className="font-medium">{t("priceTypes")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-blue-600" />
                      {t("marketPrice")} *
                    </Label>
                    <Input
                      type="number"
                      value={ratePlanForm.base_price}
                      onChange={(e) => setRatePlanForm(prev => ({ ...prev, base_price: e.target.value }))}
                      placeholder="₺"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-600" />
                      {t("localPrice")}
                    </Label>
                    <Input
                      type="number"
                      value={ratePlanForm.base_price_local}
                      onChange={(e) => setRatePlanForm(prev => ({ ...prev, base_price_local: e.target.value }))}
                      placeholder="₺"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-purple-600" />
                      {t("corporatePrice")}
                    </Label>
                    <Input
                      type="number"
                      value={ratePlanForm.base_price_corporate}
                      onChange={(e) => setRatePlanForm(prev => ({ ...prev, base_price_corporate: e.target.value }))}
                      placeholder="₺"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Package className="w-3 h-3 text-orange-600" />
                      {t("dynamicPackage")}
                    </Label>
                    <Input
                      type="number"
                      value={ratePlanForm.base_price_package}
                      onChange={(e) => setRatePlanForm(prev => ({ ...prev, base_price_package: e.target.value }))}
                      placeholder="₺"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setRatePlanDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "..." : editingRatePlan ? t("update") : t("create")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Bulk Update Dialog */}
        <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("bulkUpdate")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBulkUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("startDate")}</Label>
                  <Input
                    type="date"
                    value={bulkForm.start_date}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{t("endDate")}</Label>
                  <Input
                    type="date"
                    value={bulkForm.end_date}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              {/* Apply To */}
              <div>
                <Label className="mb-2 block">{language === "tr" ? "Uygula" : "Apply to"}</Label>
                <div className="flex gap-2">
                  {[
                    { value: "all", label: t("applyToAll") },
                    { value: "weekdays", label: t("applyToWeekdays") },
                    { value: "weekends", label: t("applyToWeekends") },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                        bulkForm.apply_to === opt.value
                          ? "bg-metro-navy text-white border-metro-navy"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => setBulkForm(prev => ({ ...prev, apply_to: opt.value }))}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Prices */}
              <div className="border rounded-lg p-4 space-y-3">
                <Label className="font-medium">{t("priceTypes")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{t("marketPrice")}</Label>
                    <Input
                      type="number"
                      value={bulkForm.price_market}
                      onChange={(e) => setBulkForm(prev => ({ ...prev, price_market: e.target.value }))}
                      placeholder="₺"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("localPrice")}</Label>
                    <Input
                      type="number"
                      value={bulkForm.price_local}
                      onChange={(e) => setBulkForm(prev => ({ ...prev, price_local: e.target.value }))}
                      placeholder="₺"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("corporatePrice")}</Label>
                    <Input
                      type="number"
                      value={bulkForm.price_corporate}
                      onChange={(e) => setBulkForm(prev => ({ ...prev, price_corporate: e.target.value }))}
                      placeholder="₺"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("dynamicPackage")}</Label>
                    <Input
                      type="number"
                      value={bulkForm.price_package}
                      onChange={(e) => setBulkForm(prev => ({ ...prev, price_package: e.target.value }))}
                      placeholder="₺"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              {/* Quota & Min Stay */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("availableRooms")}</Label>
                  <Input
                    type="number"
                    value={bulkForm.available_units}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, available_units: e.target.value }))}
                    min="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{t("minStay")}</Label>
                  <Input
                    type="number"
                    value={bulkForm.min_stay}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, min_stay: e.target.value }))}
                    min="1"
                    className="mt-1"
                  />
                </div>
              </div>
              
              {/* Stop Sale */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkForm.stop_sale}
                  onChange={(e) => setBulkForm(prev => ({ ...prev, stop_sale: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-red-600 font-medium">{t("stopSale")}</span>
              </label>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBulkDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "..." : t("update")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
