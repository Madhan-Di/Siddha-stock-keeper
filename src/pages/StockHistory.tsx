import { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, Search, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const StockHistory = () => {
  const { transactions, medicines } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (search) {
      result = result.filter((t) =>
        t.medicine_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.remarks?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }
    result.sort((a, b) => {
      if (sortBy === "date") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "quantity") return b.quantity - a.quantity;
      return (a.medicine_name || "").localeCompare(b.medicine_name || "");
    });
    return result;
  }, [transactions, search, typeFilter, sortBy]);

  const exportCSV = () => {
    const header = "Date,Medicine,Type,Quantity,User,Remarks\n";
    const rows = filtered
      .map((t) => {
        const medicine = medicines.find(m => m._id === t.medicine_id);
        const quantityWithUnit = `${t.quantity} ${medicine?.unit || ''}`;
        return `${t.date},${t.medicine_name},${t.type},${quantityWithUnit},${t.username || ""},${t.remarks || ""}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock_history_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "CSV file downloaded" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock History</h1>
          <p className="text-sm text-muted-foreground">View and export transaction records</p>
        </div>
        <Button onClick={exportCSV} variant="outline" size="sm">
          <Download className="mr-1 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="IN">Stock IN</SelectItem>
            <SelectItem value="OUT">Stock OUT</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="medicine">Sort by Medicine</SelectItem>
            <SelectItem value="quantity">Sort by Quantity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Medicine</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Quantity</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const medicine = medicines.find(m => m._id === t.medicine_id);
                  return (
                    <tr key={t._id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">{t.date}</td>
                      <td className="px-4 py-3 font-medium">{t.medicine_name}</td>
                      <td className="px-4 py-3">
                        <Badge className={t.type === "IN" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>
                          {t.type === "IN" ? <ArrowDownLeft className="mr-1 h-3 w-3" /> : <ArrowUpRight className="mr-1 h-3 w-3" />}
                          {t.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-bold">{t.quantity} {medicine?.unit || ''}</td>
                      <td className="px-4 py-3">{t.username || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.remarks || "-"}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No transactions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockHistory;
