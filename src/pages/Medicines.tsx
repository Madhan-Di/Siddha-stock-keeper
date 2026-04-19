import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categories = ["Kudineer", "Chooranam", "Legiyam", "Manapagu", "Nei", "Thailam", "Parpam", "Chendooram", "Other"];
const units = ["Gram", "Bottle", "Tablet", "Packet", "Liter", "Kg"];

const Medicines = () => {
  const { medicines, addMedicine, updateMedicine, deleteMedicine, getStockForMedicine, addTransaction } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ medicine_name: "", category: "", unit: "", description: "", low_stock_limit: 10, initial_stock: 0 });

  const filtered = medicines.filter((m) =>
    m.medicine_name.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({ medicine_name: "", category: "", unit: "", description: "", low_stock_limit: 10, initial_stock: 0 });
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.medicine_name || !form.category || !form.unit) {
      toast({ title: "Error", description: "Fill all required fields", variant: "destructive" });
      return;
    }
    
    try {
      if (editId) {
        await updateMedicine(editId, form);
        toast({ title: "Updated", description: "Medicine updated successfully" });
      } else {
        console.log("=== Adding New Medicine ===");
        console.log("Form data:", form);
        
        const newMed = await addMedicine(form);
        console.log("Medicine created:", newMed);
        
        if (!newMed) {
          toast({ title: "Error", description: "Failed to create medicine", variant: "destructive" });
          return;
        }
        
        // If adding new medicine with initial stock, create IN transaction
        if (form.initial_stock > 0) {
          if (!user?._id) {
            toast({ title: "Warning", description: "Medicine added but you must be logged in to set initial stock", variant: "destructive" });
            return;
          }
          
          console.log("Creating initial stock transaction...");
          console.log("Transaction data:", {
            medicine_id: newMed._id,
            type: "IN",
            quantity: form.initial_stock,
            user_id: user._id,
            username: user.username,
            remarks: "Initial stock"
          });
          
          const success = await addTransaction({
            medicine_id: newMed._id,
            type: "IN",
            quantity: form.initial_stock,
            user_id: user._id,
            username: user.username,
            remarks: "Initial stock"
          });
          
          console.log("Transaction success:", success);
          
          if (success) {
            toast({ 
              title: "Success", 
              description: `Medicine added with initial stock of ${form.initial_stock}` 
            });
          } else {
            toast({ 
              title: "Warning", 
              description: "Medicine added but initial stock transaction failed", 
              variant: "destructive" 
            });
          }
        } else {
          toast({ title: "Success", description: "Medicine added successfully" });
        }
      }
      
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast({ 
        title: "Error", 
        description: "An error occurred. Check console for details.", 
        variant: "destructive" 
      });
    }
  };

  const handleEdit = (m: typeof medicines[0]) => {
    setForm({
      medicine_name: m.medicine_name,
      category: m.category,
      unit: m.unit,
      description: m.description,
      low_stock_limit: m.low_stock_limit,
      initial_stock: 0, // Reset initial stock for edit mode
    });
    setEditId(m._id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMedicine(id);
    toast({ title: "Deleted", description: "Medicine removed" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medicines</h1>
          <p className="text-sm text-muted-foreground">Manage your medicine inventory</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Add Medicine</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Medicine" : "Add Medicine"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Medicine Name *</Label>
                <Input value={form.medicine_name} onChange={(e) => setForm({ ...form, medicine_name: e.target.value })} placeholder="Enter name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit *</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Low Stock Limit</Label>
                <Input 
                  type="number" 
                  inputMode="numeric"
                  value={form.low_stock_limit} 
                  onChange={(e) => setForm({ ...form, low_stock_limit: parseInt(e.target.value) || 0 })} 
                  min="0"
                />
              </div>
              {!editId && (
                <div className="space-y-2">
                  <Label>Initial Stock</Label>
                  <Input 
                    type="number" 
                    inputMode="numeric"
                    value={form.initial_stock} 
                    onChange={(e) => setForm({ ...form, initial_stock: parseInt(e.target.value) || 0 })} 
                    placeholder="Enter initial stock quantity"
                    min="0"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
              </div>
              <Button type="submit" className="w-full">{editId ? "Update" : "Add Medicine"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Medicine</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Unit</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Stock</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const stock = getStockForMedicine(m._id);
                  const isLow = stock < m.low_stock_limit;
                  return (
                    <tr key={m._id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{m.medicine_name}</td>
                      <td className="px-4 py-3">{m.category}</td>
                      <td className="px-4 py-3">{m.unit}</td>
                      <td className={`px-4 py-3 font-bold ${isLow ? "text-destructive" : ""}`}>{stock}</td>
                      <td className="px-4 py-3">
                        {isLow ? (
                          <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-success text-success-foreground text-xs">In Stock</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(m)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(m._id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No medicines found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Medicines;
