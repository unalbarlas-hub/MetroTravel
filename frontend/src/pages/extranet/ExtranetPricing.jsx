import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, addDays, eachDayOfInterval, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { ArrowLeft, Plus, DollarSign, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const mealPlans = [
  { value: "room_only", label: "Room Only" },
  { value: "breakfast", label: "Breakfast Included" },
  { value: "half_board", label: "Half Board" },
  { value: "full_board", label: "Full Board" },
  { value: "all_inclusive", label: "All Inclusive" },
];

const rateTypes = [
  { value: "refundable", label: "Refundable" },
  { value: "non_refundable", label: "Non-Refundable" },
];

export default function ExtranetPricing() {
  const { hotelId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [ratePlans, setRatePlans] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRatePlan, setSelectedRatePlan] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Rate Plan Dialog
  const [ratePlanDialogOpen, setRatePlanDialogOpen] = useState(false);
  const [ratePlanForm, setRatePlanForm] = useState({
    name_en: "",
    name_tr: "",
    rate_type: "refundable",
    meal_plan: "breakfast",
    base_price: "",
  });
  
  // Bulk Pricing Dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    price: "",
    available_units: "5",
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
  
  const handleCreateRatePlan = async (e) => {
    e.preventDefault();
    
    if (!selectedRoom || !ratePlanForm.name_en || !ratePlanForm.base_price) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      const response = await fetch(`${API}/rate-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          room_id: selectedRoom.room_id,
          name: { en: ratePlanForm.name_en, tr: ratePlanForm.name_tr || ratePlanForm.name_en },
          rate_type: ratePlanForm.rate_type,
          meal_plan: ratePlanForm.meal_plan,
          base_price: parseFloat(ratePlanForm.base_price),
          currency: "TRY",
        }),
      });
      
      if (!response.ok) throw new Error("Failed to create rate plan");
      
      toast.success("Rate plan created!");
      setRatePlanDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error("Failed to create rate plan");
    }
  };
  
  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedRoom || !selectedRatePlan || !bulkForm.price) {
      toast.error("Please fill in all fields");
      return;
    }
    
    const dates = eachDayOfInterval({
      start: new Date(bulkForm.start_date),
      end: new Date(bulkForm.end_date),
    }).map(date => ({
      date: format(date, "yyyy-MM-dd"),
      price: parseFloat(bulkForm.price),
      available_units: parseInt(bulkForm.available_units),
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
      
      toast.success(`Updated ${dates.length} dates!`);
      setBulkDialogOpen(false);
      loadInventory();
    } catch (error) {
      toast.error("Failed to update inventory");
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
  
  // Filter rate plans for selected room
  const roomRatePlans = ratePlans.filter(rp => rp.room_id === selectedRoom?.room_id);
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#003580] text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/extranet" className="hover:bg-white/10 p-2 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <span className="font-outfit font-bold text-xl">Pricing & Availability</span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 card-dashboard" data-testid="no-rooms">
            <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-outfit font-semibold text-xl mb-2">No rooms available</h3>
            <p className="text-muted-foreground mb-4">Add rooms first to set up pricing</p>
            <Link to={`/extranet/rooms/${hotelId}`}>
              <Button className="btn-primary">Manage Rooms</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Room Selection */}
              <div className="card-dashboard p-4">
                <Label className="mb-2 block">Select Room</Label>
                <Select 
                  value={selectedRoom?.room_id || ""} 
                  onValueChange={(v) => {
                    setSelectedRoom(rooms.find(r => r.room_id === v));
                    setSelectedRatePlan(null);
                  }}
                >
                  <SelectTrigger data-testid="select-room">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(room => (
                      <SelectItem key={room.room_id} value={room.room_id}>
                        {room.name?.en || room.name?.tr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Rate Plans */}
              {selectedRoom && (
                <div className="card-dashboard p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label>Rate Plans</Label>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setRatePlanDialogOpen(true)}
                      data-testid="add-rate-plan-btn"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {roomRatePlans.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No rate plans. Create one to set prices.</p>
                  ) : (
                    <div className="space-y-2">
                      {roomRatePlans.map(rp => (
                        <button
                          key={rp.rate_plan_id}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedRatePlan?.rate_plan_id === rp.rate_plan_id
                              ? "bg-[#003580] text-white"
                              : "bg-slate-100 hover:bg-slate-200"
                          }`}
                          onClick={() => setSelectedRatePlan(rp)}
                          data-testid={`rate-plan-${rp.rate_plan_id}`}
                        >
                          <div className="font-medium text-sm">{rp.name?.en}</div>
                          <div className={`text-xs ${selectedRatePlan?.rate_plan_id === rp.rate_plan_id ? "text-white/70" : "text-muted-foreground"}`}>
                            {rp.meal_plan?.replace("_", " ")} • ₺{rp.base_price}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Bulk Update */}
              {selectedRoom && selectedRatePlan && (
                <div className="card-dashboard p-4">
                  <Button 
                    className="w-full btn-primary"
                    onClick={() => setBulkDialogOpen(true)}
                    data-testid="bulk-update-btn"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Bulk Update
                  </Button>
                </div>
              )}
            </div>
            
            {/* Calendar */}
            <div className="lg:col-span-3">
              <div className="card-dashboard p-6">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <Button variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="font-outfit font-bold text-lg">
                    {format(currentMonth, "MMMM yyyy")}
                  </h2>
                  <Button variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
                
                {!selectedRatePlan ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Select a rate plan to view and edit pricing
                  </div>
                ) : (
                  <>
                    {/* Calendar Header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells for first day of month */}
                      {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-20" />
                      ))}
                      
                      {/* Days */}
                      {getDaysInMonth().map(date => {
                        const inv = getInventoryForDate(date);
                        const isPast = date < new Date();
                        
                        return (
                          <div
                            key={date.toISOString()}
                            className={`h-20 p-2 rounded-lg border transition-colors ${
                              isPast 
                                ? "bg-slate-50 opacity-50" 
                                : inv 
                                  ? "bg-emerald-50 border-emerald-200" 
                                  : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="text-sm font-medium">{format(date, "d")}</div>
                            {inv && (
                              <div className="mt-1">
                                <div className="text-xs font-bold text-emerald-600">₺{inv.price}</div>
                                <div className="text-xs text-muted-foreground">{inv.available_units} avail</div>
                              </div>
                            )}
                            {!inv && !isPast && (
                              <div className="text-xs text-muted-foreground mt-1">
                                ₺{selectedRatePlan.base_price}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Rate Plan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRatePlan} className="space-y-4">
              <div>
                <Label htmlFor="rp_name_en">Name (English) *</Label>
                <Input
                  id="rp_name_en"
                  value={ratePlanForm.name_en}
                  onChange={(e) => setRatePlanForm(prev => ({ ...prev, name_en: e.target.value }))}
                  placeholder="e.g., Best Available Rate"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rate Type</Label>
                  <Select value={ratePlanForm.rate_type} onValueChange={(v) => setRatePlanForm(prev => ({ ...prev, rate_type: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rateTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Meal Plan</Label>
                  <Select value={ratePlanForm.meal_plan} onValueChange={(v) => setRatePlanForm(prev => ({ ...prev, meal_plan: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mealPlans.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="base_price">Base Price (TRY) *</Label>
                <Input
                  id="base_price"
                  type="number"
                  value={ratePlanForm.base_price}
                  onChange={(e) => setRatePlanForm(prev => ({ ...prev, base_price: e.target.value }))}
                  placeholder="1500"
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRatePlanDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="btn-primary">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Bulk Update Dialog */}
        <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Update Pricing</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBulkUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={bulkForm.start_date}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={bulkForm.end_date}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bulk_price">Price (TRY)</Label>
                  <Input
                    id="bulk_price"
                    type="number"
                    value={bulkForm.price}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="1500"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="available_units">Available Rooms</Label>
                  <Input
                    id="available_units"
                    type="number"
                    value={bulkForm.available_units}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, available_units: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="btn-primary">Update</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
