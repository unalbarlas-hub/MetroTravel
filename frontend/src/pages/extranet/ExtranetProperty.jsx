import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Hotel, MapPin, Clock, Star, Image } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

const propertyTypes = [
  { value: "hotel", label: "Hotel" },
  { value: "boutique", label: "Boutique Hotel" },
  { value: "resort", label: "Resort" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "hostel", label: "Hostel" },
  { value: "guesthouse", label: "Guesthouse" },
];

const propertyAmenities = [
  { code: "wifi", label: "Wi-Fi" },
  { code: "pool", label: "Swimming Pool" },
  { code: "indoor_pool", label: "Indoor Pool" },
  { code: "spa", label: "Spa" },
  { code: "gym", label: "Fitness Center" },
  { code: "parking", label: "Parking" },
  { code: "free_parking", label: "Free Parking" },
  { code: "restaurant", label: "Restaurant" },
  { code: "bar", label: "Bar" },
  { code: "room_service", label: "Room Service" },
  { code: "concierge", label: "Concierge" },
  { code: "laundry", label: "Laundry Service" },
  { code: "business_center", label: "Business Center" },
  { code: "beach_access", label: "Beach Access" },
  { code: "kids_club", label: "Kids Club" },
  { code: "pet_friendly", label: "Pet Friendly" },
  { code: "airport_shuttle", label: "Airport Shuttle" },
];

const cities = [
  "Istanbul", "Antalya", "Bodrum", "Dalaman", "Izmir", "Ankara", "Fethiye", "Cappadocia", "Marmaris", "Cesme"
];

export default function ExtranetProperty() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(!!hotelId);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name_en: "",
    name_tr: "",
    property_type: "hotel",
    star_rating: "4",
    description_en: "",
    description_tr: "",
    city: "",
    district: "",
    street: "",
    postal_code: "",
    check_in: "14:00",
    check_out: "11:00",
    contact_email: "",
    contact_phone: "",
    amenities: [],
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
          property_type: hotel.property_type || "hotel",
          star_rating: hotel.star_rating?.toString() || "4",
          description_en: hotel.description?.en || "",
          description_tr: hotel.description?.tr || "",
          city: hotel.address?.city || "",
          district: hotel.address?.district || "",
          street: hotel.address?.street || "",
          postal_code: hotel.address?.postal_code || "",
          check_in: hotel.times?.check_in || "14:00",
          check_out: hotel.times?.check_out || "11:00",
          contact_email: hotel.contact_email || "",
          contact_phone: hotel.contact_phone || "",
          amenities: hotel.property_amenities || [],
          photos: hotel.photos || [],
        });
      }
    } catch (error) {
      console.error("Error loading hotel:", error);
      toast.error("Failed to load hotel details");
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      toast.error("Please fill in required fields");
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        name: { en: formData.name_en, tr: formData.name_tr || formData.name_en },
        property_type: formData.property_type,
        star_rating: parseInt(formData.star_rating),
        description: { en: formData.description_en, tr: formData.description_tr || formData.description_en },
        address: {
          city: formData.city,
          district: formData.district || null,
          street: formData.street || null,
          postal_code: formData.postal_code || null,
          country: "Turkey",
        },
        times: {
          check_in: formData.check_in,
          check_out: formData.check_out,
        },
        property_amenities: formData.amenities,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
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
      toast.success(hotelId ? "Property updated!" : "Property created!");
      navigate(hotelId ? `/extranet/property/${hotelId}` : `/extranet/rooms/${result.hotel_id}`);
    } catch (error) {
      console.error("Error saving property:", error);
      toast.error("Failed to save property");
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
              <Link to="/extranet" className="hover:bg-white/10 p-2 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <span className="font-outfit font-bold text-xl">
                {hotelId ? "Edit Property" : "Add New Property"}
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6" data-testid="property-form">
          {/* Basic Info */}
          <div className="card-dashboard p-6">
            <h2 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
              <Hotel className="w-5 h-5 text-metro-navy" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name_en">Property Name (English) *</Label>
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
                <Label htmlFor="name_tr">Property Name (Turkish)</Label>
                <Input
                  id="name_tr"
                  name="name_tr"
                  value={formData.name_tr}
                  onChange={handleChange}
                  className="mt-1"
                  data-testid="input-name-tr"
                />
              </div>
              
              <div>
                <Label htmlFor="property_type">Property Type *</Label>
                <Select value={formData.property_type} onValueChange={(v) => setFormData(prev => ({ ...prev, property_type: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-property-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="star_rating">Star Rating *</Label>
                <Select value={formData.star_rating} onValueChange={(v) => setFormData(prev => ({ ...prev, star_rating: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-star-rating">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(star => (
                      <SelectItem key={star} value={star.toString()}>
                        {star} {star === 1 ? "Star" : "Stars"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="description_en">Description (English) *</Label>
              <Textarea
                id="description_en"
                name="description_en"
                value={formData.description_en}
                onChange={handleChange}
                rows={4}
                className="mt-1"
                placeholder="Describe your property..."
                data-testid="input-description-en"
              />
            </div>
            
            <div className="mt-4">
              <Label htmlFor="description_tr">Description (Turkish)</Label>
              <Textarea
                id="description_tr"
                name="description_tr"
                value={formData.description_tr}
                onChange={handleChange}
                rows={4}
                className="mt-1"
                data-testid="input-description-tr"
              />
            </div>
          </div>
          
          {/* Location */}
          <div className="card-dashboard p-6">
            <h2 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-metro-navy" />
              Location
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Select value={formData.city} onValueChange={(v) => setFormData(prev => ({ ...prev, city: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-city">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="mt-1"
                  data-testid="input-district"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  className="mt-1"
                  data-testid="input-street"
                />
              </div>
            </div>
          </div>
          
          {/* Check-in/out Times */}
          <div className="card-dashboard p-6">
            <h2 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-metro-navy" />
              Check-in / Check-out Times
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="check_in">Check-in Time</Label>
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
                <Label htmlFor="check_out">Check-out Time</Label>
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
            </div>
          </div>
          
          {/* Contact */}
          <div className="card-dashboard p-6">
            <h2 className="font-outfit font-bold text-lg mb-4">Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  className="mt-1"
                  data-testid="input-contact-email"
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  className="mt-1"
                  data-testid="input-contact-phone"
                />
              </div>
            </div>
          </div>
          
          {/* Amenities */}
          <div className="card-dashboard p-6">
            <h2 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-metro-navy" />
              Property Amenities
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {propertyAmenities.map(amenity => (
                <label key={amenity.code} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.amenities.includes(amenity.code)}
                    onCheckedChange={() => toggleAmenity(amenity.code)}
                    data-testid={`amenity-${amenity.code}`}
                  />
                  <span className="text-sm">{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Photos - Only show for existing hotels */}
          {hotelId && (
            <div className="card-dashboard p-6">
              <h2 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-metro-navy" />
                Property Photos
              </h2>
              
              <ImageUpload
                entityType="hotel"
                entityId={hotelId}
                existingImages={formData.photos}
                onUploadComplete={(newPhotos) => setFormData(prev => ({ ...prev, photos: newPhotos }))}
              />
            </div>
          )}
          
          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link to="/extranet">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" className="btn-primary" disabled={saving} data-testid="save-property-btn">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {hotelId ? "Save Changes" : "Create Property"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
