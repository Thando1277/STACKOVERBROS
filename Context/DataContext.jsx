import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [reports, setReports] = useState([]);

  // Load reports from AsyncStorage on app start
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

  // Persist reports to AsyncStorage
  const persist = async (next) => {
    try {
      await AsyncStorage.setItem("reports", JSON.stringify(next));
    } catch (e) {
      console.warn("Failed to save reports", e);
    }
  };

  // Add a new report
  const addReport = (payload) => {
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      status: "search",
      comments: [],
      ...payload,
    };

    setReports((prev) => {
      const next = [record, ...prev];
      persist(next);
      return next;
    });
  };

  // Update existing report fields
  const updateReport = (id, changes) => {
    setReports((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...changes } : r));
      persist(next);
      return next;
    });
  };

  // Add a new comment
  const addComment = (reportId, commentText) => {
    const newComment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: commentText,
      createdAt: new Date().toISOString(),
    };

    setReports((prev) => {
      const next = prev.map((r) =>
        r.id === reportId
          ? { ...r, comments: [...(r.comments || []), newComment] }
          : r
      );
      persist(next);
      return next;
    });
  };

  // Mark a report as found
  const markAsFound = (id) => {
    setReports((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, status: "found" } : r
      );
      persist(next);
      return next;
    });
  };

  return (
    <DataContext.Provider
      value={{ reports, addReport, updateReport, addComment, markAsFound }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to access the context
export const useData = () => useContext(DataContext);
