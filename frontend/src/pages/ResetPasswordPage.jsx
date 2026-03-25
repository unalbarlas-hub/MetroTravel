import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenEmail, setTokenEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setErrorMessage("Geçersiz şifre sıfırlama linki.");
      return;
    }

    // Verify token
    const verifyToken = async () => {
      try {
        const response = await fetch(`${API}/auth/verify-reset-token?token=${token}`);
        const data = await response.json();
        
        setTokenValid(data.valid);
        if (data.valid) {
          setTokenEmail(data.email);
        } else {
          setErrorMessage(data.message || "Geçersiz veya süresi dolmuş link.");
        }
      } catch (error) {
        console.error("Token verification error:", error);
        setTokenValid(false);
        setErrorMessage("Link doğrulanamadı.");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast.success(data.message);
      } else {
        toast.error(data.detail || "Şifre sıfırlama başarısız.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Sunucu hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-metro-navy via-slate-900 to-metro-navy flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-metro-orange mx-auto mb-4"></div>
          <p className="text-white">Link doğrulanıyor...</p>
        </div>
      </div>
    );
  }

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

        <div className="bg-white rounded-2xl shadow-2xl p-8" data-testid="reset-password-form">
          {/* Invalid Token */}
          {!tokenValid && !success && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="font-outfit font-bold text-xl text-metro-navy mb-2">Geçersiz Link</h2>
              <p className="text-muted-foreground mb-6">{errorMessage}</p>
              <Link to="/forgot-password">
                <Button className="w-full btn-accent">
                  Yeni Link Talep Et
                </Button>
              </Link>
            </div>
          )}

          {/* Success State */}
          {success && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="font-outfit font-bold text-xl text-metro-navy mb-2">Şifre Güncellendi!</h2>
              <p className="text-muted-foreground mb-6">
                Şifreniz başarıyla değiştirildi. Artık yeni şifrenizle giriş yapabilirsiniz.
              </p>
              <Button 
                className="w-full btn-accent"
                onClick={() => navigate("/login")}
              >
                Giriş Yap
              </Button>
            </div>
          )}

          {/* Reset Form */}
          {tokenValid && !success && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-metro-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-metro-orange" />
                </div>
                <h1 className="font-outfit font-bold text-2xl text-metro-navy">Yeni Şifre Belirle</h1>
                <p className="text-muted-foreground mt-2">
                  <strong>{tokenEmail}</strong> hesabı için yeni şifre oluşturun.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">Yeni Şifre</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="En az 6 karakter"
                      className="pr-10"
                      data-testid="input-password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Şifrenizi tekrar girin"
                    className="mt-1"
                    data-testid="input-confirm-password"
                    required
                  />
                </div>

                {/* Password requirements */}
                <div className="text-sm text-muted-foreground bg-slate-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Şifre gereksinimleri:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li className={password.length >= 6 ? "text-emerald-600" : ""}>
                      En az 6 karakter
                    </li>
                    <li className={password === confirmPassword && password.length > 0 ? "text-emerald-600" : ""}>
                      Şifreler eşleşmeli
                    </li>
                  </ul>
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-accent h-12"
                  disabled={loading || password.length < 6 || password !== confirmPassword}
                  data-testid="submit-btn"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Güncelleniyor...
                    </div>
                  ) : (
                    "Şifremi Güncelle"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-white/60 text-sm mt-6">
          © 2024 Metro Travel. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
