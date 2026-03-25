import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Wallet, Home, ArrowLeft, ArrowUpCircle, ArrowDownCircle,
  Loader2, ChevronLeft, ChevronRight, Calendar, RefreshCw
} from "lucide-react";

export default function AgencyTransactions() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const agencyId = user?.agency_id;

  useEffect(() => {
    if (agencyId) {
      loadData();
    }
  }, [agencyId, page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [txnRes, agencyRes] = await Promise.all([
        fetch(`${API}/agencies/${agencyId}/transactions?page=${page}&limit=${limit}`, {
          credentials: "include",
          headers
        }),
        fetch(`${API}/agencies/${agencyId}`, {
          credentials: "include",
          headers
        })
      ]);
      
      if (txnRes.ok) {
        const data = await txnRes.json();
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
      }
      
      if (agencyRes.ok) {
        const data = await agencyRes.json();
        setAgency(data);
      }
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(total / limit);

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
            <h1 className="font-outfit font-bold text-2xl">Kredi İşlemleri</h1>
            <p className="text-muted-foreground">Bakiye ve işlem geçmişi</p>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kredi Limiti</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(agency?.credit_limit)}
                  </p>
                </div>
                <Wallet className="w-10 h-10 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kullanılabilir</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(agency?.credit_balance)}
                  </p>
                </div>
                <ArrowDownCircle className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kullanılan</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {formatCurrency(agency?.credit_used)}
                  </p>
                </div>
                <ArrowUpCircle className="w-10 h-10 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">İşlem Geçmişi</CardTitle>
            <Button variant="ghost" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Yenile
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-metro-orange" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Henüz işlem bulunmuyor</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b">
                      <th className="pb-3">Tarih</th>
                      <th className="pb-3">İşlem</th>
                      <th className="pb-3">Açıklama</th>
                      <th className="pb-3 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.transaction_id} className="border-b last:border-0">
                        <td className="py-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDateTime(txn.created_at)}
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge className={
                            txn.transaction_type === "credit" 
                              ? "bg-emerald-100 text-emerald-700"
                              : txn.transaction_type === "refund"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }>
                            {txn.transaction_type === "credit" ? "Yükleme" :
                             txn.transaction_type === "refund" ? "İade" : "Kullanım"}
                          </Badge>
                        </td>
                        <td className="py-4 text-sm">{txn.description}</td>
                        <td className="py-4 text-right">
                          <span className={`font-bold ${
                            txn.transaction_type === "credit" || txn.transaction_type === "refund"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}>
                            {txn.transaction_type === "debit" ? "-" : "+"}
                            {formatCurrency(txn.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Sayfa {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
          <p className="font-medium mb-1">Kredi Sistemi Hakkında</p>
          <p>Kredi limitiniz admin tarafından belirlenir. Rezervasyonlarınızda kredi kullanarak anında onay alabilirsiniz. Kredi yüklemesi için destek ekibiyle iletişime geçin.</p>
        </div>
      </div>
    </div>
  );
}
