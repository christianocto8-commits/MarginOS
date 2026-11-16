"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Outlet {
  id: string;
  name: string;
  code: string;
  category: string;
  address?: string;
  phone?: string;
  currency: string;
  targetFoodCostPercent: number;
  monthlyFixedCost: number;
}

interface OutletContextType {
  outlets: Outlet[];
  currentOutlet: Outlet | null;
  setCurrentOutlet: (outlet: Outlet) => void;
  loading: boolean;
  refreshOutlets: () => Promise<void>;
}

const OutletContext = createContext<OutletContextType | undefined>(undefined);

export function OutletProvider({ children }: { children: React.ReactNode }) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [currentOutlet, setCurrentOutletState] = useState<Outlet | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOutlets = async () => {
    try {
      const res = await fetch("/api/outlets");
      if (res.ok) {
        const data: Outlet[] = await res.json();
        setOutlets(data);

        // Restore selected outlet from localStorage or default to first
        const savedId =
          typeof window !== "undefined"
            ? localStorage.getItem("marginos_outlet_id") || localStorage.getItem("dapurmetric_outlet_id")
            : null;
        const matched = data.find((o) => o.id === savedId) || data[0] || null;
        setCurrentOutletState(matched);
      }
    } catch (err) {
      console.error("Failed to load outlets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  const setCurrentOutlet = (outlet: Outlet) => {
    setCurrentOutletState(outlet);
    if (typeof window !== "undefined") {
      localStorage.setItem("marginos_outlet_id", outlet.id);
    }
  };

  return (
    <OutletContext.Provider
      value={{
        outlets,
        currentOutlet,
        setCurrentOutlet,
        loading,
        refreshOutlets: fetchOutlets,
      }}
    >
      {children}
    </OutletContext.Provider>
  );
}

export function useOutlet() {
  const context = useContext(OutletContext);
  if (!context) {
    throw new Error("useOutlet must be used within an OutletProvider");
  }
  return context;
}
