import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

// Pages
import HomePage from "@/pages/HomePage";
import SearchResultsPage from "@/pages/SearchResultsPage";
import HotelDetailPage from "@/pages/HotelDetailPage";
import BookingPage from "@/pages/BookingPage";
import PaymentPage from "@/pages/PaymentPage";
import ConfirmationPage from "@/pages/ConfirmationPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import UserDashboard from "@/pages/UserDashboard";
import ExtranetDashboard from "@/pages/extranet/ExtranetDashboard";
import ExtranetProperty from "@/pages/extranet/ExtranetProperty";
import ExtranetRooms from "@/pages/extranet/ExtranetRooms";
import ExtranetPricing from "@/pages/extranet/ExtranetPricing";
import ExtranetReservations from "@/pages/extranet/ExtranetReservations";
import HotelRegister from "@/pages/extranet/HotelRegister";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminHotels from "@/pages/admin/AdminHotels";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminAgencies from "@/pages/admin/AdminAgencies";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AgencyDashboard from "@/pages/agency/AgencyDashboard";
import AgencyRegister from "@/pages/agency/AgencyRegister";
import AgencyUsers from "@/pages/agency/AgencyUsers";
import AgencyBookings from "@/pages/agency/AgencyBookings";
import AgencyTransactions from "@/pages/agency/AgencyTransactions";
import AgencySettings from "@/pages/agency/AgencySettings";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// Language Context
const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};

// Currency Context
const CurrencyContext = createContext(null);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider");
  return context;
};

// Supported currencies with symbols
const CURRENCIES = {
  TRY: { code: "TRY", symbol: "₺", name: "Türk Lirası" },
  EUR: { code: "EUR", symbol: "€", name: "Euro" },
  USD: { code: "USD", symbol: "$", name: "US Dollar" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound" },
  RUB: { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  SAR: { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
};

// Exchange rates (TRY based - will be fetched from API in production)
const DEFAULT_EXCHANGE_RATES = {
  TRY: 1.0,
  EUR: 0.027,
  USD: 0.029,
  GBP: 0.023,
  RUB: 2.65,
  SAR: 0.11,
};

function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    const saved = localStorage.getItem("currency");
    return saved || "TRY";
  });
  const [exchangeRates, setExchangeRates] = useState(DEFAULT_EXCHANGE_RATES);

  useEffect(() => {
    // Fetch exchange rates from API
    const fetchRates = async () => {
      try {
        const response = await fetch(`${API}/exchange-rates`);
        if (response.ok) {
          const data = await response.json();
          setExchangeRates(data.rates || DEFAULT_EXCHANGE_RATES);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
      }
    };
    fetchRates();
  }, []);

  const setCurrency = (code) => {
    setCurrencyState(code);
    localStorage.setItem("currency", code);
  };

  const convertPrice = useCallback((amount, fromCurrency = "TRY") => {
    if (fromCurrency === currency) return amount;
    // Convert to TRY first, then to target currency
    const tryAmount = amount / (exchangeRates[fromCurrency] || 1);
    return Math.round(tryAmount * (exchangeRates[currency] || 1) * 100) / 100;
  }, [currency, exchangeRates]);

  const formatPrice = useCallback((amount, fromCurrency = "TRY") => {
    const converted = convertPrice(amount, fromCurrency);
    const currencyInfo = CURRENCIES[currency] || CURRENCIES.TRY;
    return `${currencyInfo.symbol}${converted.toLocaleString()}`;
  }, [currency, convertPrice]);

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      currencies: CURRENCIES, 
      convertPrice, 
      formatPrice,
      exchangeRates 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

const translations = {
  en: {
    search: "Search",
    destination: "Destination",
    whereTo: "Where to?",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Guests",
    adults: "Adults",
    children: "Children",
    rooms: "Rooms",
    searchHotels: "Search Hotels",
    login: "Login",
    register: "Register",
    logout: "Logout",
    myBookings: "My Bookings",
    savedHotels: "Saved Hotels",
    profile: "Profile",
    perNight: "per night",
    freeCancellation: "Free cancellation",
    bookNow: "Book Now",
    selectRoom: "Select Room",
    totalPrice: "Total Price",
    continue: "Continue",
    guestDetails: "Guest Details",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    specialRequests: "Special Requests",
    confirmBooking: "Confirm Booking",
    bookingConfirmed: "Booking Confirmed!",
    bookingRef: "Booking Reference",
    heroTitle: "Find your perfect stay in Turkey",
    heroSubtitle: "Discover amazing hotels, resorts, and apartments across Turkey's most beautiful destinations",
    popularDestinations: "Popular Destinations",
    whyChooseUs: "Why Choose Us",
    bestPrice: "Best Price Guarantee",
    support: "24/7 Support",
    securePayment: "Secure Payment",
    verified: "Verified Properties",
  },
  tr: {
    search: "Ara",
    destination: "Varış Noktası",
    whereTo: "Nereye?",
    checkIn: "Giriş",
    checkOut: "Çıkış",
    guests: "Misafirler",
    adults: "Yetişkin",
    children: "Çocuk",
    rooms: "Oda",
    searchHotels: "Otel Ara",
    login: "Giriş Yap",
    register: "Kayıt Ol",
    logout: "Çıkış Yap",
    myBookings: "Rezervasyonlarım",
    savedHotels: "Kaydedilen Oteller",
    profile: "Profil",
    perNight: "gecelik",
    freeCancellation: "Ücretsiz iptal",
    bookNow: "Şimdi Rezervasyon Yap",
    selectRoom: "Oda Seç",
    totalPrice: "Toplam Fiyat",
    continue: "Devam Et",
    guestDetails: "Misafir Bilgileri",
    firstName: "Ad",
    lastName: "Soyad",
    email: "E-posta",
    phone: "Telefon",
    specialRequests: "Özel İstekler",
    confirmBooking: "Rezervasyonu Onayla",
    bookingConfirmed: "Rezervasyon Onaylandı!",
    bookingRef: "Rezervasyon Referansı",
    heroTitle: "Türkiye'de mükemmel konaklama yeri bulun",
    heroSubtitle: "Türkiye'nin en güzel destinasyonlarında harika oteller, tatil köyleri ve apartlar keşfedin",
    popularDestinations: "Popüler Destinasyonlar",
    whyChooseUs: "Neden Bizi Seçmelisiniz",
    bestPrice: "En İyi Fiyat Garantisi",
    support: "7/24 Destek",
    securePayment: "Güvenli Ödeme",
    verified: "Onaylı Tesisler",
  },
  de: {
    search: "Suchen",
    destination: "Reiseziel",
    whereTo: "Wohin?",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Gäste",
    adults: "Erwachsene",
    children: "Kinder",
    rooms: "Zimmer",
    searchHotels: "Hotels suchen",
    login: "Anmelden",
    register: "Registrieren",
    logout: "Abmelden",
    myBookings: "Meine Buchungen",
    savedHotels: "Gespeicherte Hotels",
    profile: "Profil",
    perNight: "pro Nacht",
    freeCancellation: "Kostenlose Stornierung",
    bookNow: "Jetzt buchen",
    selectRoom: "Zimmer wählen",
    totalPrice: "Gesamtpreis",
    continue: "Weiter",
    guestDetails: "Gästedaten",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    phone: "Telefon",
    specialRequests: "Besondere Wünsche",
    confirmBooking: "Buchung bestätigen",
    bookingConfirmed: "Buchung bestätigt!",
    bookingRef: "Buchungsreferenz",
    heroTitle: "Finden Sie Ihre perfekte Unterkunft in der Türkei",
    heroSubtitle: "Entdecken Sie erstaunliche Hotels, Resorts und Apartments in den schönsten Reisezielen der Türkei",
    popularDestinations: "Beliebte Reiseziele",
    whyChooseUs: "Warum uns wählen",
    bestPrice: "Bestpreisgarantie",
    support: "24/7 Support",
    securePayment: "Sichere Zahlung",
    verified: "Verifizierte Unterkünfte",
  }
};

function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("language");
    return saved || "en";
  });
  
  const t = useCallback((key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  }, [language]);
  
  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };
  
  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const checkAuth = useCallback(async () => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    
    try {
      // Check if we have a stored token
      const storedToken = localStorage.getItem("auth_token");
      const headers = storedToken ? { 'Authorization': `Bearer ${storedToken}` } : {};
      
      const response = await fetch(`${API}/auth/me`, {
        credentials: 'include',
        headers
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Clear invalid token
        localStorage.removeItem("auth_token");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  const login = async (email, password) => {
    const response = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }
    
    const data = await response.json();
    // Store token for persistence
    if (data.token) {
      localStorage.setItem("auth_token", data.token);
    }
    setUser(data);
    return data;
  };
  
  const register = async (userData) => {
    const response = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Registration failed");
    }
    
    const data = await response.json();
    // Store token for persistence
    if (data.token) {
      localStorage.setItem("auth_token", data.token);
    }
    setUser(data);
    return data;
  };
  
  const logout = async () => {
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    localStorage.removeItem("auth_token");
    setUser(null);
  };
  
  const googleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  
  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, googleLogin, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// Auth Callback Component
function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);
  
  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    const processSession = async () => {
      const hash = window.location.hash;
      const sessionId = new URLSearchParams(hash.substring(1)).get('session_id');
      
      if (!sessionId) {
        navigate('/login');
        return;
      }
      
      try {
        const response = await fetch(`${API}/auth/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId })
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          navigate('/dashboard', { state: { user: userData } });
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error("Session exchange failed:", error);
        navigate('/login');
      }
    };
    
    processSession();
  }, [navigate, setUser]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// App Router Component
function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id (OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/hotel/:hotelId" element={<HotelDetailPage />} />
      <Route path="/booking/:hotelId" element={<BookingPage />} />
      <Route path="/payment/:bookingId" element={<PaymentPage />} />
      <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* Protected User Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <UserDashboard />
        </ProtectedRoute>
      } />
      
      {/* Hotel Owner (Extranet) Routes */}
      <Route path="/extranet" element={
        <ProtectedRoute allowedRoles={['hotel_owner', 'admin']}>
          <ExtranetDashboard />
        </ProtectedRoute>
      } />
      <Route path="/extranet/property/:hotelId?" element={
        <ProtectedRoute allowedRoles={['hotel_owner', 'admin']}>
          <ExtranetProperty />
        </ProtectedRoute>
      } />
      <Route path="/extranet/rooms/:hotelId" element={
        <ProtectedRoute allowedRoles={['hotel_owner', 'admin']}>
          <ExtranetRooms />
        </ProtectedRoute>
      } />
      <Route path="/extranet/pricing/:hotelId" element={
        <ProtectedRoute allowedRoles={['hotel_owner', 'admin']}>
          <ExtranetPricing />
        </ProtectedRoute>
      } />
      <Route path="/extranet/reservations/:hotelId?" element={
        <ProtectedRoute allowedRoles={['hotel_owner', 'admin']}>
          <ExtranetReservations />
        </ProtectedRoute>
      } />
      <Route path="/extranet/register" element={
        <ProtectedRoute allowedRoles={['hotel_owner', 'admin', 'customer']}>
          <HotelRegister />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/hotels" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminHotels />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminUsers />
        </ProtectedRoute>
      } />
      <Route path="/admin/bookings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminBookings />
        </ProtectedRoute>
      } />
      <Route path="/admin/agencies" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminAgencies />
        </ProtectedRoute>
      } />
      <Route path="/admin/coupons" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminCoupons />
        </ProtectedRoute>
      } />
      
      {/* Agency (B2B) Routes */}
      <Route path="/agency" element={
        <ProtectedRoute>
          <AgencyDashboard />
        </ProtectedRoute>
      } />
      <Route path="/agency/register" element={
        <ProtectedRoute>
          <AgencyRegister />
        </ProtectedRoute>
      } />
      <Route path="/agency/users" element={
        <ProtectedRoute allowedRoles={['agency_owner', 'admin']}>
          <AgencyUsers />
        </ProtectedRoute>
      } />
      <Route path="/agency/bookings" element={
        <ProtectedRoute allowedRoles={['agency_owner', 'agency_user', 'admin']}>
          <AgencyBookings />
        </ProtectedRoute>
      } />
      <Route path="/agency/transactions" element={
        <ProtectedRoute allowedRoles={['agency_owner', 'agency_user', 'admin']}>
          <AgencyTransactions />
        </ProtectedRoute>
      } />
      <Route path="/agency/settings" element={
        <ProtectedRoute allowedRoles={['agency_owner', 'admin']}>
          <AgencySettings />
        </ProtectedRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <CurrencyProvider>
          <AuthProvider>
            <AppRouter />
            <Toaster position="top-right" />
          </AuthProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
