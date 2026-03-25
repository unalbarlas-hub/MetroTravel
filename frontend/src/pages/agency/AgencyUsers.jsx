import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Users, Plus, Home, ArrowLeft, UserPlus, Edit2, 
  Trash2, Mail, Phone, Calendar, Shield, Loader2
} from "lucide-react";

const roleLabels = {
  owner: "Sahip",
  admin: "Yönetici",
  agent: "Acenta",
  finance: "Finans"
};

const roleColors = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  agent: "bg-emerald-100 text-emerald-700",
  finance: "bg-amber-100 text-amber-700"
};

export default function AgencyUsers() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "agent"
  });

  const agencyId = user?.agency_id;

  useEffect(() => {
    if (agencyId) {
      loadUsers();
    }
  }, [agencyId]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API}/agencies/${agencyId}/users`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Error loading users:", err);
      toast.error("Kullanıcılar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API}/agencies/${agencyId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Kullanıcı eklendi");
        setShowAddDialog(false);
        setFormData({ name: "", email: "", password: "", phone: "", role: "agent" });
        loadUsers();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Kullanıcı eklenemedi");
      }
    } catch (err) {
      toast.error("Bağlantı hatası");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API}/agencies/${agencyId}/users/${selectedUser.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          is_active: formData.is_active
        })
      });

      if (res.ok) {
        toast.success("Kullanıcı güncellendi");
        setShowEditDialog(false);
        loadUsers();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Güncelleme başarısız");
      }
    } catch (err) {
      toast.error("Bağlantı hatası");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!confirm("Bu kullanıcıyı devre dışı bırakmak istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API}/agencies/${agencyId}/users/${userId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include"
      });

      if (res.ok) {
        toast.success("Kullanıcı devre dışı bırakıldı");
        loadUsers();
      } else {
        toast.error("İşlem başarısız");
      }
    } catch (err) {
      toast.error("Bağlantı hatası");
    }
  };

  const openEditDialog = (userItem) => {
    setSelectedUser(userItem);
    setFormData({
      name: userItem.name,
      email: userItem.email,
      phone: userItem.phone || "",
      role: userItem.agency_role || "agent",
      is_active: userItem.is_active
    });
    setShowEditDialog(true);
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
            <h1 className="font-outfit font-bold text-2xl">Kullanıcı Yönetimi</h1>
            <p className="text-muted-foreground">Acenta kullanıcılarını yönetin</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end mb-6">
          <Button 
            onClick={() => {
              setFormData({ name: "", email: "", password: "", phone: "", role: "agent" });
              setShowAddDialog(true);
            }}
            className="bg-metro-orange hover:bg-metro-orange/90"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Yeni Kullanıcı
          </Button>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-metro-orange" />
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Henüz kullanıcı bulunmuyor</p>
              <Button 
                className="mt-4"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                İlk Kullanıcıyı Ekle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {users.map((userItem) => (
              <Card key={userItem.user_id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-metro-navy/10 flex items-center justify-center">
                        <span className="font-bold text-metro-navy">
                          {userItem.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{userItem.name}</p>
                          <Badge className={roleColors[userItem.agency_role] || roleColors.agent}>
                            {roleLabels[userItem.agency_role] || "Acenta"}
                          </Badge>
                          {!userItem.is_active && (
                            <Badge variant="outline" className="text-red-500 border-red-200">
                              Devre Dışı
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {userItem.email}
                          </span>
                          {userItem.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {userItem.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(userItem)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Düzenle
                      </Button>
                      {userItem.agency_role !== "owner" && userItem.is_active && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeactivateUser(userItem.user_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add User Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
              <DialogDescription>
                Acenta için yeni bir alt kullanıcı oluşturun
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <Label htmlFor="add-name">Ad Soyad *</Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="add-email">E-posta *</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="add-password">Şifre *</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="add-phone">Telefon</Label>
                <Input
                  id="add-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="add-role">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({...formData, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Yönetici</SelectItem>
                    <SelectItem value="agent">Acenta</SelectItem>
                    <SelectItem value="finance">Finans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ekle"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
              <DialogDescription>
                {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Ad Soyad</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              {selectedUser?.agency_role !== "owner" && (
                <div>
                  <Label htmlFor="edit-role">Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({...formData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Yönetici</SelectItem>
                      <SelectItem value="agent">Acenta</SelectItem>
                      <SelectItem value="finance">Finans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kaydet"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
