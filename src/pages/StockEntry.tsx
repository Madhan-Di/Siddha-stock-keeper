import { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowDownLeft, ArrowUpRight, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const StockEntry = () => {
  const { medicines, getStockForMedicine, addTransaction } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ medicine_id: "", type: "" as "IN" | "OUT" | "", quantity: "", remarks: "" });
  const [open, setOpen] = useState(false);

  const selectedMed = medicines.find((m) => m._id === form.medicine_id);
  const currentStock = selectedMed ? getStockForMedicine(selectedMed._id) : 0;

  // Check if submit should be disabled
  const isSubmitDisabled = useMemo(() => {
    if (!form.medicine_id || !form.type || !form.quantity) return true;
    const qty = parseInt(form.quantity);
    if (qty <= 0) return true;
    if (form.type === "OUT" && qty > currentStock) return true;
    return false;
  }, [form, currentStock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.medicine_id || !form.type || !form.quantity) {
      toast({ title: "Error", description: "Fill all required fields", variant: "destructive" });
      return;
    }
    const qty = parseInt(form.quantity);
    if (qty <= 0) {
      toast({ title: "Error", description: "Quantity must be positive", variant: "destructive" });
      return;
    }
    const success = await addTransaction({
      medicine_id: form.medicine_id,
      type: form.type as "IN" | "OUT",
      quantity: qty,
      user_id: user?._id || "unknown",
      username: user?.username,
      remarks: form.remarks,
    });
    if (success) {
      toast({ title: "Success", description: `Stock ${form.type} recorded successfully` });
      setForm({ medicine_id: "", type: "", quantity: "", remarks: "" });
    } else {
      toast({ title: "Error", description: "Not enough stock for OUT transaction", variant: "destructive" });
    }
  };

  const filteredMedicines = medicines.filter((m) =>
    m.medicine_name.toLowerCase().includes(form.medicine_id.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stock Entry</h1>
        <p className="text-sm text-muted-foreground">Record stock IN and OUT transactions</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Medicine *</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {form.medicine_id
                        ? medicines.find((m) => m._id === form.medicine_id)?.medicine_name
                        : "Search medicine..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search medicine..." />
                      <CommandList>
                        <CommandEmpty>No medicine found.</CommandEmpty>
                        <CommandGroup>
                          {medicines.map((m) => (
                            <CommandItem
                              key={m._id}
                              value={m.medicine_name}
                              onSelect={() => {
                                setForm({ ...form, medicine_id: m._id });
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.medicine_id === m._id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {m.medicine_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Transaction Type *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "IN" })}
                    className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                      form.type === "IN" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                    }`}
                  >
                    <ArrowDownLeft className="h-5 w-5" /> Stock IN
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "OUT" })}
                    className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                      form.type === "OUT" ? "border-destructive bg-destructive/10 text-destructive" : "border-border hover:bg-muted"
                    }`}
                  >
                    <ArrowUpRight className="h-5 w-5" /> Stock OUT
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input 
                  type="number" 
                  inputMode="numeric"
                  value={form.quantity} 
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })} 
                  placeholder="Enter quantity" 
                  min="1" 
                />
                {form.type === "OUT" && form.quantity && parseInt(form.quantity) > currentStock && (
                  <p className="text-sm text-destructive">Quantity exceeds available stock ({currentStock})</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional remarks" />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
                Submit Transaction
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Info</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMed ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Selected Medicine</p>
                  <p className="text-lg font-bold">{selectedMed.medicine_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Current Stock</p>
                    <p className="text-2xl font-bold">{currentStock}</p>
                    <p className="text-xs text-muted-foreground">{selectedMed.unit}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Low Stock Limit</p>
                    <p className="text-2xl font-bold">{selectedMed.low_stock_limit}</p>
                    <p className="text-xs text-muted-foreground">{selectedMed.unit}</p>
                  </div>
                </div>
                {form.quantity && form.type && (
                  <div className="rounded-lg border-2 border-dashed p-4">
                    <p className="text-sm text-muted-foreground">After Transaction</p>
                    <p className="text-2xl font-bold">
                      {form.type === "IN"
                        ? currentStock + parseInt(form.quantity || "0")
                        : currentStock - parseInt(form.quantity || "0")}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedMed.unit}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="py-12 text-center text-muted-foreground">Select a medicine to view stock info</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockEntry;
