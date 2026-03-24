import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Bed, Trash2, Edit, Users } from "lucide-react";

const roomTypes = [
  { value: "standard", label: "Standard Room" },
  { value: "deluxe", label: "Deluxe Room" },
  { value: "suite", label: "Suite" },
  { value: "family", label: "Family Room" },
  { value: "executive", label: "Executive Room" },
  { value: "penthouse", label: "Penthouse" },
];

const bedTypes = [
  { value: "single", label: "Single Bed" },
  { value: "double", label: "Double Bed" },
  { value: "queen", label: "Queen Bed" },
  { value: "king", label: "King Bed" },
  { value: "twin", label: "Twin Beds" },
  { value: "sofa_bed", label: "Sofa Bed" },
];

const roomAmenities = [
  { code: "wifi", label: "Wi-Fi" },
  { code: "tv", label: "TV" },
  { code: "air_conditioning", label: "Air Conditioning" },
  { code: "minibar", label: "Minibar" },
  { code: "safe_box", label: "Safe Box" },
  { code: "hair_dryer", label: "Hair Dryer" },
  { code: "iron", label: "Iron" },
  { code: "kettle", label: "Kettle" },
  { code: "balcony", label: "Balcony" },
  { code: "sea_view", label: "Sea View" },
  { code: "city_view", label: "City View" },
  { code: "bathtub", label: "Bathtub" },
  { code: "shower", label: "Shower" },
  { code: "desk", label: "Work Desk" },
];

const initialRoomForm = {
  name_en: "",
  name_tr: "",
  room_type: "standard",
  bed_type: "double",
  bed_count: "1",
  max_adults: "2",
  max_children: "1",
  size_sqm: "",
  is_smoking: false,
  amenities: [],
};

export default function ExtranetRooms() {
  const { hotelId } = useParams();
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
      room_type: room.room_type || "standard",
      bed_type: room.beds?.[0]?.bed_type || "double",
      bed_count: room.beds?.[0]?.count?.toString() || "1",
      max_adults: room.max_adults?.toString() || "2",
      max_children: room.max_children?.toString() || "1",
      size_sqm: room.size_sqm?.toString() || "",
      is_smoking: room.is_smoking || false,
      amenities: room.amenities || [],
    });
    setDialogOpen(true);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name_en) {
      toast.error("Room name is required");
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        hotel_id: hotelId,
        name: { en: formData.name_en, tr: formData.name_tr || formData.name_en },
        room_type: formData.room_type,
        beds: [{ bed_type: formData.bed_type, count: parseInt(formData.bed_count) }],
        max_adults: parseInt(formData.max_adults),
        max_children: parseInt(formData.max_children),
        size_sqm: formData.size_sqm ? parseFloat(formData.size_sqm) : null,
        is_smoking: formData.is_smoking,
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
      
      toast.success(editingRoom ? "Room updated!" : "Room created!");
      setDialogOpen(false);
      loadRooms();
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error("Failed to save room");
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async (roomId) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    
    try {
      const response = await fetch(`${API}/rooms/${roomId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to delete room");
      
      toast.success("Room deleted");
      loadRooms();
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
    }
  };
  
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
              <span className="font-outfit font-bold text-xl">Manage Rooms</span>
            </div>
            
            <Button onClick={openAddDialog} className="bg-white text-[#003580] hover:bg-white/90" data-testid="add-room-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 card-dashboard" data-testid="no-rooms">
            <Bed className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-outfit font-semibold text-xl mb-2">No rooms yet</h3>
            <p className="text-muted-foreground mb-4">Add your first room to start accepting bookings</p>
            <Button onClick={openAddDialog} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Room
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {rooms.map(room => (
              <div key={room.room_id} className="card-dashboard p-6" data-testid={`room-card-${room.room_id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Bed className="w-10 h-10 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-outfit font-semibold text-lg">
                        {room.name?.en || room.name?.tr}
                      </h3>
                      <div className="text-sm text-muted-foreground capitalize mb-2">
                        {room.room_type?.replace("_", " ")}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {room.max_adults} adults, {room.max_children} children
                        </span>
                        {room.size_sqm && <span>{room.size_sqm} m²</span>}
                        <span>
                          {room.beds?.map(b => `${b.count}x ${b.bed_type}`).join(", ")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {room.amenities?.slice(0, 5).map(a => (
                          <span key={a} className="text-xs bg-slate-100 px-2 py-1 rounded capitalize">
                            {a.replace("_", " ")}
                          </span>
                        ))}
                        {room.amenities?.length > 5 && (
                          <span className="text-xs text-muted-foreground">+{room.amenities.length - 5} more</span>
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
              <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="room-form">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name_en">Room Name (English) *</Label>
                  <Input
                    id="name_en"
                    name="name_en"
                    value={formData.name_en}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="name_tr">Room Name (Turkish)</Label>
                  <Input
                    id="name_tr"
                    name="name_tr"
                    value={formData.name_tr}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Room Type</Label>
                  <Select value={formData.room_type} onValueChange={(v) => setFormData(prev => ({ ...prev, room_type: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bed Type</Label>
                  <Select value={formData.bed_type} onValueChange={(v) => setFormData(prev => ({ ...prev, bed_type: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bedTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="bed_count">Beds</Label>
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
                  <Label htmlFor="max_adults">Max Adults</Label>
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
                  <Label htmlFor="max_children">Max Children</Label>
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
                  <Label htmlFor="size_sqm">Size (m²)</Label>
                  <Input
                    id="size_sqm"
                    name="size_sqm"
                    type="number"
                    value={formData.size_sqm}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">Room Amenities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {roomAmenities.map(amenity => (
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
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingRoom ? "Save Changes" : "Add Room"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
