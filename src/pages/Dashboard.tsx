import { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pill, Package, AlertTriangle, ArrowDownUp, Plus, FileText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const Dashboard = () => {
  const { medicines, stocks, transactions, getLowStockMedicines, getStockForMedicine } = useData();
  const navigate = useNavigate();
  const lowStockMeds = getLowStockMedicines();
  const totalStock = stocks.reduce((sum, s) => sum + s.quantity_available, 0);
  const totalIn = transactions.filter((t) => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
  const totalOut = transactions.filter((t) => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);

  // State for filters
  const [timeRange, setTimeRange] = useState("7days");
  const [medicineSearch, setMedicineSearch] = useState("");
  const [medicineSort, setMedicineSort] = useState("quantity");

  // Generate date range based on selection
  const getDateRange = () => {
    const dates = [];
    let days = 7;
    let format: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    
    if (timeRange === "30days") {
      days = 30;
      format = { month: 'short', day: 'numeric' };
    } else if (timeRange === "12months") {
      days = 365;
      format = { month: 'short', year: '2-digit' };
    }
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push({
        fullDate: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', format)
      });
    }
    return dates;
  };

  // Group transactions by date for line chart
  const dailyData = useMemo(() => {
    const dateRange = getDateRange();
    
    // Group by month if showing 12 months
    if (timeRange === "12months") {
      const monthlyData: { [key: string]: { stockIn: number; stockOut: number; display: string } } = {};
      
      dateRange.forEach(({ fullDate, displayDate }) => {
        const monthKey = fullDate.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { stockIn: 0, stockOut: 0, display: displayDate };
        }
        
        const dayTransactions = transactions.filter(t => t.date === fullDate);
        monthlyData[monthKey].stockIn += dayTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.quantity, 0);
        monthlyData[monthKey].stockOut += dayTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.quantity, 0);
      });
      
      return Object.values(monthlyData).map(data => ({
        date: data.display,
        'Stock IN': data.stockIn,
        'Stock OUT': data.stockOut
      }));
    }
    
    return dateRange.map(({ fullDate, displayDate }) => {
      const dayTransactions = transactions.filter(t => t.date === fullDate);
      const stockIn = dayTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.quantity, 0);
      const stockOut = dayTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.quantity, 0);
      
      return {
        date: displayDate,
        'Stock IN': stockIn,
        'Stock OUT': stockOut
      };
    });
  }, [transactions, timeRange]);

  // All medicines with stock data, search and sort
  const medicineStockData = useMemo(() => {
    let data = medicines.map(m => {
      const quantity = getStockForMedicine(m._id);
      const lowStockLimit = m.low_stock_limit || 10;
      
      // Determine color based on stock level
      let color = '#22c55e'; // Green - high stock
      if (quantity === 0) {
        color = '#ef4444'; // Red - no stock
      } else if (quantity < lowStockLimit) {
        color = '#ef4444'; // Red - low stock
      } else if (quantity < lowStockLimit * 2) {
        color = '#eab308'; // Yellow - medium stock
      }
      
      return {
        name: m.medicine_name,
        quantity,
        unit: m.unit,
        color,
        lowStockLimit
      };
    });

    // Filter by search
    if (medicineSearch) {
      data = data.filter(m => 
        m.name.toLowerCase().includes(medicineSearch.toLowerCase())
      );
    }

    // Sort
    if (medicineSort === "quantity") {
      data.sort((a, b) => b.quantity - a.quantity);
    } else if (medicineSort === "name") {
      data.sort((a, b) => a.name.localeCompare(b.name));
    } else if (medicineSort === "lowStock") {
      data.sort((a, b) => a.quantity - b.quantity);
    }

    return data;
  }, [medicines, getStockForMedicine, medicineSearch, medicineSort]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your medicine inventory</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/medicines")} size="sm">
            <Plus className="mr-1 h-4 w-4" /> Add Medicine
          </Button>
          <Button onClick={() => navigate("/stock-entry")} variant="outline" size="sm">
            <ArrowDownUp className="mr-1 h-4 w-4" /> Stock Entry
          </Button>
          <Button onClick={() => navigate("/history")} variant="outline" size="sm">
            <FileText className="mr-1 h-4 w-4" /> Reports
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Pill className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Medicines</p>
              <p className="text-2xl font-bold">{medicines.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Stock</p>
              <p className="text-2xl font-bold">{totalStock}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold">{lowStockMeds.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <ArrowDownUp className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Daily Stock Movement</CardTitle>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                  <SelectItem value="12months">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {dailyData.some(d => d['Stock IN'] > 0 || d['Stock OUT'] > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    angle={timeRange === "30days" ? -45 : 0}
                    textAnchor={timeRange === "30days" ? "end" : "middle"}
                    height={timeRange === "30days" ? 60 : 30}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Stock IN" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    strokeOpacity={0.7}
                    dot={{ fill: '#22c55e', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Stock OUT" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeOpacity={0.7}
                    dot={{ fill: '#ef4444', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No transaction data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Medicines Stock Level</CardTitle>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  className="pl-9 h-9" 
                  placeholder="Search medicine..." 
                  value={medicineSearch}
                  onChange={(e) => setMedicineSearch(e.target.value)}
                />
              </div>
              <Select value={medicineSort} onValueChange={setMedicineSort}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantity">Highest First</SelectItem>
                  <SelectItem value="lowStock">Lowest First</SelectItem>
                  <SelectItem value="name">By Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {medicineStockData.length > 0 ? (
              <div className="h-[350px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr className="text-left">
                      <th className="pb-2 font-medium text-muted-foreground">Medicine</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Quantity</th>
                      <th className="pb-2 font-medium text-muted-foreground w-32">Stock Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicineStockData.map((med, index) => {
                      const percentage = med.lowStockLimit > 0 
                        ? Math.min((med.quantity / (med.lowStockLimit * 3)) * 100, 100)
                        : 100;
                      
                      return (
                        <tr key={index} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2.5 font-medium">{med.name}</td>
                          <td className="py-2.5 text-right">
                            <span className="font-bold" style={{ color: med.color }}>
                              {med.quantity}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">{med.unit}</span>
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full transition-all duration-300"
                                  style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: med.color
                                  }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {Math.round(percentage)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                {medicineSearch ? "No medicines found" : "No medicine data available"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Table */}
      {lowStockMeds.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-5 w-5" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Medicine</th>
                    <th className="pb-2 font-medium text-muted-foreground">Category</th>
                    <th className="pb-2 font-medium text-muted-foreground">Available</th>
                    <th className="pb-2 font-medium text-muted-foreground">Limit</th>
                    <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockMeds.map((m) => (
                    <tr key={m._id} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{m.medicine_name}</td>
                      <td className="py-2.5">{m.category}</td>
                      <td className="py-2.5 font-bold text-destructive">{m.quantity_available}</td>
                      <td className="py-2.5">{m.low_stock_limit}</td>
                      <td className="py-2.5">
                        <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
