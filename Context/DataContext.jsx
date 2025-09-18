import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("reports");
        if (raw) setReports(JSON.parse(raw));
      } catch (e) {
        console.warn("Failed to load reports", e);
      }
    })();
  }, []);

  const persist = async (next) => {
    try {
      await AsyncStorage.setItem("reports", JSON.stringify(next));
    } catch (e) {
      console.warn("Failed to save reports", e);
    }
  };

  const addReport = (payload) => {
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      status: "search", 
      ...payload,
    };
    setReports((prev) => {
      const next = [record, ...prev];
      persist(next);
      return next;
    });
  };

  const updateReport = (id, changes) => {
    setReports((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...changes } : r));
      persist(next);
      return next;
    });
  };

  return (
    <DataContext.Provider value={{ reports, addReport, updateReport }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
