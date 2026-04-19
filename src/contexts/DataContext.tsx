import React, { createContext, useContext, useState, useCallback } from "react";

export interface Medicine {
  _id: string;
  medicine_name: string;
  category: string;
  unit: string;
  description: string;
  low_stock_limit: number;
  created_at: string;
}

export interface Stock {
  _id: string;
  medicine_id: string;
  quantity_available: number;
  last_updated: string;
}

export interface StockTransaction {
  _id: string;
  medicine_id: string;
  medicine_name?: string;
  type: "IN" | "OUT";
  quantity: number;
  user_id: string;
  username?: string;
  remarks: string;
  date: string;
}

interface DataContextType {
  medicines: Medicine[];
  stocks: Stock[];
  transactions: StockTransaction[];
  addMedicine: (med: Omit<Medicine, "_id" | "created_at">) => Promise<Medicine | null>;
  updateMedicine: (id: string, med: Partial<Medicine>) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  addTransaction: (tx: Omit<StockTransaction, "_id" | "date">) => Promise<boolean>;
  getStockForMedicine: (medicineId: string) => number;
  getLowStockMedicines: () => (Medicine & { quantity_available: number })[];
}

const DataContext = createContext<DataContextType>({} as DataContextType);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchMedicines(),
          fetchStocks(),
          fetchTransactions()
        ]);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await fetch(`${API_URL}/medicines`);
      if (res.ok) {
        const data = await res.json();
        setMedicines(data);
      }
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
      // Set empty array on error so app doesn't break
      setMedicines([]);
    }
  };

  const fetchStocks = async () => {
    try {
      const res = await fetch(`${API_URL}/stock`);
      if (res.ok) {
        const data = await res.json();
        setStocks(data);
      }
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
      setStocks([]);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_URL}/transactions`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    }
  };

  const addMedicine = useCallback(async (med: Omit<Medicine, "_id" | "created_at">) => {
    try {
      const res = await fetch(`${API_URL}/medicines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(med)
      });
      if (res.ok) {
        const newMed = await res.json();
        setMedicines(prev => [...prev, newMed]);
        
        // Fetch the stock that was created by backend
        const stockRes = await fetch(`${API_URL}/stock`);
        if (stockRes.ok) {
          const allStocks = await stockRes.json();
          setStocks(allStocks);
        }
        
        return newMed;
      }
    } catch (error) {
      console.error('Failed to add medicine:', error);
    }
    return null;
  }, []);

  const updateMedicine = useCallback(async (id: string, med: Partial<Medicine>) => {
    try {
      const res = await fetch(`${API_URL}/medicines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(med)
      });
      if (res.ok) {
        const updated = await res.json();
        setMedicines((prev) => prev.map((m) => (m._id === id ? updated : m)));
      }
    } catch (error) {
      console.error('Failed to update medicine:', error);
    }
  }, []);

  const deleteMedicine = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/medicines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMedicines((prev) => prev.filter((m) => m._id !== id));
        setStocks((prev) => prev.filter((s) => s.medicine_id !== id));
      }
    } catch (error) {
      console.error('Failed to delete medicine:', error);
    }
  }, []);

  const getStockForMedicine = useCallback((medicineId: string) => {
    return stocks.find((s) => s.medicine_id === medicineId)?.quantity_available ?? 0;
  }, [stocks]);

  const addTransaction = useCallback(async (tx: Omit<StockTransaction, "_id" | "date">) => {
    const currentStock = stocks.find((s) => s.medicine_id === tx.medicine_id);
    
    // For OUT transactions, check if we have enough stock
    if (tx.type === "OUT") {
      if (!currentStock || currentStock.quantity_available < tx.quantity) {
        return false;
      }
    }

    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx)
      });
      if (res.ok) {
        const newTx = await res.json();
        // Backend returns formatted transaction with medicine_name and username
        setTransactions(prev => [newTx, ...prev]);
        
        // Refresh stocks from backend to get accurate data
        const stockRes = await fetch(`${API_URL}/stock`);
        if (stockRes.ok) {
          const allStocks = await stockRes.json();
          setStocks(allStocks);
        }
        
        return true;
      }
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
    return false;
  }, [stocks]);

  const getLowStockMedicines = useCallback(() => {
    return medicines
      .map((m) => ({
        ...m,
        quantity_available: getStockForMedicine(m._id),
      }))
      .filter((m) => m.quantity_available < m.low_stock_limit);
  }, [medicines, getStockForMedicine]);

  return (
    <DataContext.Provider
      value={{
        medicines, stocks, transactions,
        addMedicine, updateMedicine, deleteMedicine,
        addTransaction, getStockForMedicine, getLowStockMedicines,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
