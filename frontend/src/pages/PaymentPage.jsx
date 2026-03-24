import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLanguage, API } from "@/App";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Lock, CheckCircle, XCircle, Loader2, ShieldCheck, Clock } from "lucide-react";

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const formContainerRef = useRef(null);
  
  const [booking, setBooking] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, processing, success, failed
  const [checkoutContent, setCheckoutContent] = useState(null);
  
  useEffect(() => {
    loadBookingAndPayment();
  }, [bookingId]);
  
  // Inject iyzico checkout form when content is available
  useEffect(() => {
    if (checkoutContent && formContainerRef.current) {
      // Clear previous content
      formContainerRef.current.innerHTML = '';
      
      // Create a div for the form
      const formDiv = document.createElement('div');
      formDiv.id = 'iyzipay-checkout-form';
      formDiv.className = 'responsive';
      formContainerRef.current.appendChild(formDiv);
      
      // Execute the script
      const script = document.createElement('script');
      script.innerHTML = checkoutContent;
      document.body.appendChild(script);
      
      return () => {
        // Cleanup
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [checkoutContent]);
  
  const loadBookingAndPayment = async () => {
    setLoading(true);
    try {
      // Load booking details
      const bookingRes = await fetch(`${API}/bookings/${bookingId}`, {
        credentials: "include"
      });
      
      if (!bookingRes.ok) {
        throw new Error("Booking not found");
      }
      
      const bookingData = await bookingRes.json();
      setBooking(bookingData);
      
      // Check payment status
      if (bookingData.payment_status === "paid") {
        setPaymentStatus("success");
        toast.success("Bu rezervasyon zaten ödenmiş");
        setTimeout(() => navigate(`/confirmation/${bookingId}`), 2000);
        return;
      }
      
      // Initialize payment
      initializePayment();
      
    } catch (error) {
      console.error("Error loading booking:", error);
      toast.error("Rezervasyon yüklenemedi");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };
  
  const initializePayment = async () => {
    setInitializing(true);
    try {
      const response = await fetch(`${API}/payment/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ booking_id: bookingId }),
      });
      
      const data = await response.json();
      setPaymentInfo(data);
      
      if (data.status === "success" && data.checkout_form_content) {
        // iyzico is enabled - show checkout form
        setCheckoutContent(data.checkout_form_content);
        setPaymentStatus("processing");
      } else if (data.status === "mock_mode") {
        // Mock mode - show mock payment UI
        setPaymentStatus("mock");
      } else {
        toast.error(data.message || "Ödeme başlatılamadı");
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast.error("Ödeme sistemi hatası");
    } finally {
      setInitializing(false);
    }
  };
  
  const handleMockPayment = async () => {
    setPaymentStatus("processing");
    try {
      const response = await fetch(`${API}/payment/mock-complete/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Payment failed");
      }
      
      setPaymentStatus("success");
      toast.success("Ödeme başarılı!");
      setTimeout(() => navigate(`/confirmation/${bookingId}`), 2000);
    } catch (error) {
      console.error("Mock payment error:", error);
      setPaymentStatus("failed");
      toast.error("Ödeme başarısız");
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-metro-navy mx-auto mb-4" />
          <p className="text-muted-foreground">Ödeme bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="font-outfit font-bold text-2xl text-foreground mb-2">Ödeme Başarılı!</h1>
          <p className="text-muted-foreground mb-6">Rezervasyonunuz onaylandı. Onay sayfasına yönlendiriliyorsunuz...</p>
          <Loader2 className="w-6 h-6 animate-spin text-metro-navy mx-auto" />
        </div>
      </div>
    );
  }
  
  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="font-outfit font-bold text-2xl text-foreground mb-2">Ödeme Başarısız</h1>
          <p className="text-muted-foreground mb-6">Ödemeniz işlenemedi. Lütfen tekrar deneyin.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(`/dashboard`)}>
              Panele Dön
            </Button>
            <Button className="btn-primary" onClick={initializePayment}>
              Tekrar Dene
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-metro-navy text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-metro-orange flex items-center justify-center">
                <span className="font-outfit font-bold text-xl text-white">M</span>
              </div>
              <span className="font-outfit font-bold text-xl hidden sm:block">Metro Travel</span>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-emerald-600">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</div>
              <span className="font-medium hidden sm:inline">Seçiminiz</span>
            </div>
            <div className="w-8 h-px bg-emerald-600"></div>
            <div className="flex items-center gap-2 text-emerald-600">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</div>
              <span className="font-medium hidden sm:inline">Bilgileriniz</span>
            </div>
            <div className="w-8 h-px bg-metro-navy"></div>
            <div className="flex items-center gap-2 text-metro-navy">
              <div className="w-6 h-6 rounded-full bg-metro-navy text-white flex items-center justify-center text-xs">3</div>
              <span className="font-medium hidden sm:inline">Ödeme</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-metro-navy/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-metro-navy" />
                  </div>
                  <div>
                    <h2 className="font-outfit font-bold text-xl">Ödeme</h2>
                    <p className="text-sm text-muted-foreground">Güvenli ödeme ile rezervasyonunuzu tamamlayın</p>
                  </div>
                </div>
                
                {initializing ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin text-metro-navy mx-auto mb-4" />
                    <p className="text-muted-foreground">Ödeme formu hazırlanıyor...</p>
                  </div>
                ) : paymentStatus === "mock" ? (
                  /* Mock Payment UI */
                  <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-amber-800">Test Modu</h3>
                          <p className="text-sm text-amber-700">
                            iyzico API anahtarları yapılandırılmamış. Bu bir test ödemesidir.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Rezervasyon Tutarı:</span>
                        <span className="font-outfit font-bold text-xl text-metro-orange">
                          ₺{booking?.total_price?.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Gerçek ödeme için iyzico entegrasyonu gereklidir. Test modunda ödeme simüle edilecektir.
                        </p>
                        <Button 
                          className="w-full btn-primary h-12"
                          onClick={handleMockPayment}
                          data-testid="mock-payment-btn"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Test Ödemesi Yap (₺{booking?.total_price?.toLocaleString()})
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* iyzico Checkout Form */
                  <div ref={formContainerRef} className="min-h-[400px]">
                    {/* iyzico form will be injected here */}
                  </div>
                )}
                
                {/* Security Notice */}
                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>256-bit SSL şifreleme ile güvenli ödeme</span>
                </div>
              </div>
            </div>
            
            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border p-6 sticky top-4">
                <h3 className="font-outfit font-bold text-lg mb-4">Rezervasyon Özeti</h3>
                
                {booking && (
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">{booking.hotel_name}</p>
                      <p className="text-sm text-muted-foreground">Ref: {booking.booking_ref}</p>
                    </div>
                    
                    <div className="border-t pt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Giriş:</span>
                        <span className="font-medium">{booking.check_in}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Çıkış:</span>
                        <span className="font-medium">{booking.check_out}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Misafirler:</span>
                        <span className="font-medium">{booking.adults} Yetişkin</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Toplam Tutar:</span>
                        <span className="font-outfit font-bold text-xl text-metro-orange">
                          ₺{booking.total_price?.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">KDV dahil</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
