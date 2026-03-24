import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { 
  Hotel, Users, Calendar, DollarSign, TrendingUp, 
  ArrowRight, Home, Shield, Clock, CheckCircle, AlertCircle
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = async () => {
    try {
      const response = await fetch(`${API}/admin/stats`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                  <Shield className="w-6 h-6 text-slate-900" />
                </div>
                <span className="font-outfit font-bold text-xl">Admin Panel</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <Home className="w-4 h-4 mr-2" />
                  Main Site
                </Button>
              </Link>
              <span className="text-white/80 hidden sm:inline">{user?.name}</span>
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            <Link to="/admin" className="py-4 border-b-2 border-slate-900 font-medium">
              Dashboard
            </Link>
            <Link to="/admin/hotels" className="py-4 text-muted-foreground hover:text-foreground">
              Hotels
            </Link>
            <Link to="/admin/users" className="py-4 text-muted-foreground hover:text-foreground">
              Users
            </Link>
            <Link to="/admin/bookings" className="py-4 text-muted-foreground hover:text-foreground">
              Bookings
            </Link>
          </div>
        </div>
      </nav>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-outfit font-bold text-2xl mb-6">Dashboard Overview</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card-dashboard p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Hotel className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{stats?.hotels?.total || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Hotels</div>
                  </div>
                </div>
              </div>
              
              <div className="card-dashboard p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{stats?.hotels?.pending || 0}</div>
                    <div className="text-sm text-muted-foreground">Pending Approval</div>
                  </div>
                </div>
              </div>
              
              <div className="card-dashboard p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{stats?.users?.total || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Users</div>
                  </div>
                </div>
              </div>
              
              <div className="card-dashboard p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">₺{(stats?.revenue?.total || 0).toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pending Hotels */}
              <div className="card-dashboard p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-outfit font-bold text-lg">Pending Hotels</h2>
                  <Link to="/admin/hotels">
                    <Button variant="ghost" size="sm">
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                
                {stats?.hotels?.pending > 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-amber-600" />
                    <div>
                      <div className="font-semibold">{stats.hotels.pending} hotels awaiting approval</div>
                      <div className="text-sm text-muted-foreground">Review and approve new properties</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                    <div>
                      <div className="font-semibold">All caught up!</div>
                      <div className="text-sm text-muted-foreground">No pending approvals</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Bookings Overview */}
              <div className="card-dashboard p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-outfit font-bold text-lg">Bookings</h2>
                  <Link to="/admin/bookings">
                    <Button variant="ghost" size="sm">
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold">{stats?.bookings?.total || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Bookings</div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">{stats?.bookings?.confirmed || 0}</div>
                    <div className="text-sm text-muted-foreground">Confirmed</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Link to="/admin/hotels" className="card-dashboard p-4 hover:shadow-md transition-shadow text-center">
                <Hotel className="w-8 h-8 text-[#003580] mx-auto mb-2" />
                <div className="font-medium">Manage Hotels</div>
              </Link>
              <Link to="/admin/users" className="card-dashboard p-4 hover:shadow-md transition-shadow text-center">
                <Users className="w-8 h-8 text-[#003580] mx-auto mb-2" />
                <div className="font-medium">Manage Users</div>
              </Link>
              <Link to="/admin/bookings" className="card-dashboard p-4 hover:shadow-md transition-shadow text-center">
                <Calendar className="w-8 h-8 text-[#003580] mx-auto mb-2" />
                <div className="font-medium">All Bookings</div>
              </Link>
              <div className="card-dashboard p-4 text-center opacity-50">
                <TrendingUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="font-medium text-muted-foreground">Analytics (Coming Soon)</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
