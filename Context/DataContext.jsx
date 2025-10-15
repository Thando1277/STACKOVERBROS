// DataContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig"; // adjust path if needed

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [reports, setReports] = useState([]);

  // ✅ Real-time Firestore listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reports"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReports(list);

      // Also persist in AsyncStorage
      persist(list);
    }, (error) => {
      console.error("Firestore fetch error:", error);
    });

    return () => unsub();
  }, []);

  // Load reports from AsyncStorage on app start (fallback if Firestore fails)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("reports");
        if (raw) setReports(JSON.parse(raw));
      } catch (e) {
        console.warn("Failed to load reports from AsyncStorage", e);
      }
    })();
  }, []);

  // Persist reports to AsyncStorage
  const persist = async (next) => {
    try {
      await AsyncStorage.setItem("reports", JSON.stringify(next));
    } catch (e) {
      console.warn("Failed to save reports to AsyncStorage", e);
    }
  };

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

  const updateReport = (id, changes) => {
    setReports((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...changes } : r));
      persist(next);
      return next;
    });
  };

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

  const updateReportStatus = (id, status) => {
    setReports((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, status } : r));
      persist(next);
      return next;
    });
  };

  const deleteReport = (id) => {
    setReports((prev) => {
      const next = prev.filter((r) => r.id !== id);
      persist(next);
      return next;
    });
  };

  return (
    <DataContext.Provider
      value={{
        reports,
        addReport,
        updateReport,
        addComment,
        updateReportStatus,
        deleteReport,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
