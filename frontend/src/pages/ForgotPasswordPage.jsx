import { useState } from "react";
import { Link } from "react-router-dom";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Lütfen e-posta adresinizi girin.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmitted(true);
        toast.success(data.message);
      } else {
        toast.error(data.detail || "Bir hata oluştu.");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Sunucu hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-metro-navy via-slate-900 to-metro-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-metro-orange flex items-center justify-center">
            <span className="font-outfit font-bold text-2xl text-white">M</span>
          </div>
          <span className="font-outfit font-bold text-2xl text-white">Metro Travel</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl p-8" data-testid="forgot-password-form">
          {!submitted ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-metro-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-metro-orange" />
                </div>
                <h1 className="font-outfit font-bold text-2xl text-metro-navy">Şifremi Unuttum</h1>
                <p className="text-muted-foreground mt-2">
                  E-posta adresinizi girin, şifre sıfırlama linki gönderelim.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-posta Adresi</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="mt-1"
                    data-testid="input-email"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-accent h-12"
                  disabled={loading}
                  data-testid="submit-btn"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Gönderiliyor...
                    </div>
                  ) : (
                    "Şifre Sıfırlama Linki Gönder"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-metro-orange hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Giriş sayfasına dön
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="font-outfit font-bold text-xl text-metro-navy mb-2">E-posta Gönderildi!</h2>
              <p className="text-muted-foreground mb-6">
                <strong>{email}</strong> adresine şifre sıfırlama linki gönderdik. 
                Lütfen gelen kutunuzu kontrol edin.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                E-posta gelmedi mi? Spam klasörünüzü kontrol edin veya tekrar deneyin.
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setSubmitted(false)}
                  className="w-full"
                >
                  Tekrar Gönder
                </Button>
                <Link to="/login">
                  <Button className="w-full btn-accent">
                    Giriş Sayfasına Dön
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-white/60 text-sm mt-6">
          © 2024 Metro Travel. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
