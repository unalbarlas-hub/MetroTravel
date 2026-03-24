import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage, useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowLeft, Phone } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { register, googleLogin } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        password: formData.password,
        role: formData.role,
      });
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img 
          src="https://images.pexels.com/photos/236296/pexels-photo-236296.jpeg?w=1200"
          alt="Travel"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-metro-navy/70 flex items-center justify-center">
          <div className="text-white text-center px-12">
            <h1 className="font-outfit font-bold text-4xl mb-4">Metro Travel'a Katılın</h1>
            <p className="text-white/80 text-lg">Türkiye genelinde harika oteller rezerve etmeye başlamak için bir hesap oluşturun</p>
          </div>
        </div>
      </div>
      
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <div className="w-10 h-10 rounded-lg bg-metro-orange flex items-center justify-center">
              <span className="font-outfit font-bold text-xl text-white">M</span>
            </div>
            <span className="font-outfit font-bold text-xl text-foreground">Metro Travel</span>
          </Link>
          
          <h2 className="font-outfit font-bold text-2xl mb-2">{t("register")}</h2>
          <p className="text-muted-foreground mb-6">Create your account to get started</p>
          
          {/* Google Login */}
          <Button 
            variant="outline" 
            className="w-full h-12 mb-6"
            onClick={googleLogin}
            data-testid="google-register-btn"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
          
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">or register with email</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
            {/* Account Type */}
            <div>
              <Label>Account Type</Label>
              <RadioGroup 
                value={formData.role} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="customer" id="customer" />
                  <Label htmlFor="customer" className="cursor-pointer">Traveler</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hotel_owner" id="hotel_owner" />
                  <Label htmlFor="hotel_owner" className="cursor-pointer">Hotel Owner</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="name">Full Name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  required
                  data-testid="input-name"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  required
                  data-testid="input-email"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="phone">{t("phone")} (optional)</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+90 555 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  data-testid="input-phone"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  required
                  data-testid="input-password"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  required
                  data-testid="input-confirm-password"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full btn-primary h-12"
              disabled={loading}
              data-testid="submit-register-btn"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-metro-navy hover:underline font-medium">
              {t("login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
