import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export const LowStockAlert = () => {
  const { getLowStockMedicines, medicines, stocks } = useData();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<ReturnType<typeof getLowStockMedicines>>([]);

  useEffect(() => {
    console.log("=== LowStockAlert useEffect ===");
    console.log("Medicines count:", medicines.length);
    console.log("Stocks count:", stocks.length);
    console.log("Is authenticated:", isAuthenticated);
    
    // Check if we have data and user is authenticated
    if (medicines.length > 0 && stocks.length > 0 && isAuthenticated) {
      // Check if alert was already shown in this session
      const alertShown = sessionStorage.getItem('lowStockAlertShown');
      console.log("Alert already shown:", alertShown);
      
      if (!alertShown) {
        const items = getLowStockMedicines();
        console.log("Low stock items:", items);
        console.log("Low stock count:", items.length);
        
        if (items.length > 0) {
          console.log("Setting low stock items and opening dialog...");
          setLowStockItems(items);
          
          // Use a longer delay and force open
          setTimeout(() => {
            console.log("Opening dialog now!");
            setOpen(true);
            sessionStorage.setItem('lowStockAlertShown', 'true');
          }, 1000);
        } else {
          console.log("No low stock items found");
        }
      } else {
        console.log("Alert was already shown in this session");
      }
    } else {
      console.log("Conditions not met for showing alert");
    }
  }, [medicines.length, stocks.length, isAuthenticated, getLowStockMedicines]);

  const handleViewLowStock = () => {
    setOpen(false);
    navigate("/medicines");
  };

  console.log("LowStockAlert render - open:", open, "items:", lowStockItems.length);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <AlertDialogTitle>Low Stock Alert</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              You have {lowStockItems.length} medicine{lowStockItems.length > 1 ? "s" : ""} with low stock levels:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {lowStockItems.slice(0, 5).map((item) => (
                <li key={item._id}>
                  <span className="font-medium">{item.medicine_name}</span> - 
                  Current: {item.quantity_available} {item.unit} 
                  (Limit: {item.low_stock_limit})
                </li>
              ))}
              {lowStockItems.length > 5 && (
                <li className="text-muted-foreground">
                  ...and {lowStockItems.length - 5} more
                </li>
              )}
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setOpen(false)}>
            OK
          </AlertDialogAction>
          <Button onClick={handleViewLowStock} variant="default">
            View Low Stock Items
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
