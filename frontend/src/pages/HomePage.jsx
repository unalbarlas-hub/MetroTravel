import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage, useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays } from "date-fns";
import { Search, MapPin, CalendarIcon, Users, Star, Shield, Headphones, CreditCard, ChevronDown, Globe, Menu, X } from "lucide-react";

const heroImage = "https://images.unsplash.com/photo-1582875489981-9f26c469e341?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwyfHxpc3RhbmJ1bCUyMHNreWxpbmUlMjB0dXJrZXl8ZW58MHx8fHwxNzc0MzcyNzU0fDA&ixlib=rb-4.1.0&q=85&w=1920";

const destinations = [
  { name: "Istanbul", image: "https://images.unsplash.com/photo-1678398690888-b520db61c24e?w=400", hotels: 2500 },
  { name: "Antalya", image: "https://images.unsplash.com/photo-1593351799227-75df2026356b?w=400", hotels: 1800 },
  { name: "Bodrum", image: "https://images.unsplash.com/photo-1568322503122-d3f3d47c27e4?w=400", hotels: 950 },
  { name: "Cappadocia", image: "https://images.pexels.com/photos/236296/pexels-photo-236296.jpeg?auto=compress&w=400", hotels: 420 },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Search state
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState(addDays(new Date(), 1));
  const [checkOut, setCheckOut] = useState(addDays(new Date(), 3));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [cities, setCities] = useState([]);
  
  useEffect(() => {
    fetch(`${API}/cities`)
      .then(res => res.json())
      .then(data => setCities(data.cities || []))
      .catch(console.error);
  }, []);
  
  const handleSearch = () => {
    const params = new URLSearchParams({
      city: destination,
      checkIn: format(checkIn, "yyyy-MM-dd"),
      checkOut: format(checkOut, "yyyy-MM-dd"),
      adults: adults.toString(),
      children: children.toString(),
    });
    navigate(`/search?${params.toString()}`);
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-metro-orange flex items-center justify-center">
                <span className="font-outfit font-bold text-xl text-white">M</span>
              </div>
              <span className="font-outfit font-bold text-xl text-white hidden sm:block">Metro Travel</span>
            </Link>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {/* Language Selector */}
              <Select value={language} onValueChange={changeLanguage}>
                <SelectTrigger className="w-auto border-0 bg-white/10 text-white hover:bg-white/20" data-testid="language-selector">
                  <Globe className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
              
              {user ? (
                <>
                  {user.role === "hotel_owner" && (
                    <Link to="/extranet" className="text-white/90 hover:text-white font-medium">
                      Extranet
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <Link to="/admin" className="text-white/90 hover:text-white font-medium">
                      Admin
                    </Link>
                  )}
                  <Link to="/dashboard" className="text-white/90 hover:text-white font-medium" data-testid="dashboard-link">
                    {t("myBookings")}
                  </Link>
                  <Button onClick={logout} variant="ghost" className="text-white hover:bg-white/10" data-testid="logout-btn">
                    {t("logout")}
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="login-btn">
                      {t("login")}
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-white text-metro-navy hover:bg-white/90" data-testid="register-btn">
                      {t("register")}
                    </Button>
                  </Link>
                </>
              )}
            </nav>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 p-4 bg-white/10 backdrop-blur-lg rounded-lg animate-fade-in">
              <div className="flex flex-col gap-3">
                <Select value={language} onValueChange={changeLanguage}>
                  <SelectTrigger className="w-full bg-white/10 text-white border-white/20">
                    <Globe className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
                {user ? (
                  <>
                    <Link to="/dashboard" className="text-white py-2">{t("myBookings")}</Link>
                    <Button onClick={logout} variant="ghost" className="text-white justify-start">
                      {t("logout")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-white py-2">{t("login")}</Link>
                    <Link to="/register" className="text-white py-2">{t("register")}</Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative h-[600px] md:h-[700px]" data-testid="hero-section">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 hero-gradient" />
        
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center pt-20">
          <h1 className="font-outfit font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-4 max-w-4xl animate-fade-in">
            {t("heroTitle")}
          </h1>
          <p className="text-white/90 text-base md:text-lg max-w-2xl mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {t("heroSubtitle")}
          </p>
          
          {/* Search Console */}
          <div className="w-full max-w-5xl glass rounded-2xl p-4 md:p-6 shadow-2xl animate-slide-up" style={{ animationDelay: "0.2s" }} data-testid="search-console">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Destination */}
              <div className="md:col-span-1">
                <label className="text-label mb-1 block">{t("destination")}</label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="h-12 bg-white" data-testid="destination-select">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder={t("whereTo")} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city.code} value={city.name.en}>
                        {city.name[language] || city.name.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Check-in */}
              <div>
                <label className="text-label mb-1 block">{t("checkIn")}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-12 justify-start bg-white" data-testid="checkin-btn">
                      <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
                      {format(checkIn, "MMM dd")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkIn}
                      onSelect={(date) => {
                        if (date) {
                          setCheckIn(date);
                          if (date >= checkOut) {
                            setCheckOut(addDays(date, 1));
                          }
                        }
                      }}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Check-out */}
              <div>
                <label className="text-label mb-1 block">{t("checkOut")}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-12 justify-start bg-white" data-testid="checkout-btn">
                      <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
                      {format(checkOut, "MMM dd")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={(date) => date && setCheckOut(date)}
                      disabled={(date) => date <= checkIn}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Guests */}
              <div>
                <label className="text-label mb-1 block">{t("guests")}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-12 justify-start bg-white" data-testid="guests-btn">
                      <Users className="w-4 h-4 mr-2 text-slate-400" />
                      {adults} {t("adults")}, {children} {t("children")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>{t("adults")}</span>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                          >-</Button>
                          <span className="w-8 text-center">{adults}</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setAdults(Math.min(10, adults + 1))}
                          >+</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t("children")}</span>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setChildren(Math.max(0, children - 1))}
                          >-</Button>
                          <span className="w-8 text-center">{children}</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setChildren(Math.min(6, children + 1))}
                          >+</Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Search Button */}
              <div className="flex items-end">
                <Button 
                  className="w-full h-12 btn-primary"
                  onClick={handleSearch}
                  data-testid="search-btn"
                >
                  <Search className="w-5 h-5 mr-2" />
                  {t("search")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Popular Destinations */}
      <section className="py-16 container mx-auto px-4" data-testid="destinations-section">
        <h2 className="font-outfit font-bold text-2xl md:text-3xl text-foreground mb-8">
          {t("popularDestinations")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {destinations.map((dest, index) => (
            <div 
              key={dest.name}
              className="relative rounded-2xl overflow-hidden group cursor-pointer hotel-card"
              onClick={() => {
                setDestination(dest.name);
                handleSearch();
              }}
              style={{ animationDelay: `${index * 0.1}s` }}
              data-testid={`destination-card-${dest.name.toLowerCase()}`}
            >
              <div className="aspect-[4/3]">
                <img 
                  src={dest.image} 
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-outfit font-bold text-xl text-white">{dest.name}</h3>
                <p className="text-white/80 text-sm">{dest.hotels} hotels</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Why Choose Us */}
      <section className="py-16 bg-slate-50" data-testid="features-section">
        <div className="container mx-auto px-4">
          <h2 className="font-outfit font-bold text-2xl md:text-3xl text-foreground mb-8 text-center">
            {t("whyChooseUs")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Star, title: t("bestPrice"), desc: "We guarantee the best rates" },
              { icon: Headphones, title: t("support"), desc: "Always here to help you" },
              { icon: CreditCard, title: t("securePayment"), desc: "Your data is protected" },
              { icon: Shield, title: t("verified"), desc: "Quality assured stays" },
            ].map((feature, index) => (
              <div 
                key={feature.title}
                className="text-center p-6 bg-white rounded-xl shadow-sm"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-full bg-metro-navy/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-metro-navy" />
                </div>
                <h3 className="font-outfit font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-metro-navy text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-metro-orange flex items-center justify-center">
                  <span className="font-outfit font-bold text-xl text-white">M</span>
                </div>
                <span className="font-outfit font-bold text-xl">Metro Travel</span>
              </div>
              <p className="text-white/70 text-sm">
                Türkiye'de mükemmel konaklamanızı bulun
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Safety</a></li>
                <li><a href="#" className="hover:text-white">Cancellation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Partners</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><Link to="/register" className="hover:text-white">List your property</Link></li>
                <li><a href="#" className="hover:text-white">Affiliate program</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60 text-sm">
            © 2024 Metro Travel. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}
