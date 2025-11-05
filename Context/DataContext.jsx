// DataContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [reports, setReports] = useState([]);
  const [lastSeenAlerts, setLastSeenAlerts] = useState(null);

  // ✅ Load last seen timestamp on mount
  useEffect(() => {
    loadLastSeenAlerts();
  }, []);

  // ✅ Real-time Firestore listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "reports"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(list);
        console.log(`📦 Loaded ${list.length} reports from Firestore`);

        // Also persist in AsyncStorage
        persist(list);
      },
      (error) => {
        console.error("Firestore fetch error:", error);
      }
    );

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

  // ✅ Load last seen alerts timestamp
  const loadLastSeenAlerts = async () => {
    try {
      const timestamp = await AsyncStorage.getItem("lastSeenAlerts");
      if (timestamp) {
        const date = new Date(timestamp);
        setLastSeenAlerts(date);
        console.log("📅 Last seen alerts:", date.toLocaleString());
      } else {
        console.log("📅 No lastSeenAlerts found (first time user)");
      }
    } catch (error) {
      console.warn("Error loading lastSeenAlerts:", error);
    }
  };

  // ✅ Mark alerts as seen
  const markAlertsAsSeen = async () => {
    try {
      const now = new Date().toISOString();
      await AsyncStorage.setItem("lastSeenAlerts", now);
      setLastSeenAlerts(new Date(now));
      console.log("✅ Alerts marked as seen at:", now);
    } catch (error) {
      console.warn("Error marking alerts as seen:", error);
    }
  };

  // ✅ Get unseen alerts count (SAFE VERSION)
  const getUnseenAlertsCount = () => {
    try {
      // Safety checks
      if (!Array.isArray(reports)) {
        return 0;
      }

      if (!lastSeenAlerts) {
        // First time user - count all alerts
        const allAlerts = reports.filter(
          (r) => r && (r.type === "Panic" || r.type === "Wanted")
        );
        console.log(`🔢 Unseen count (first time): ${allAlerts.length}`);
        return allAlerts.length || 0;
      }

      // Count alerts created after last seen timestamp
      const unseenAlerts = reports.filter((r) => {
        if (!r || !r.type || !r.createdAt) return false;
        const isAlert = r.type === "Panic" || r.type === "Wanted";
        
        let createdDate;
        if (r.createdAt?.seconds) {
          createdDate = new Date(r.createdAt.seconds * 1000);
        } else {
          createdDate = new Date(r.createdAt);
        }
        
        const isNew = createdDate > lastSeenAlerts;
        return isAlert && isNew;
      });

      console.log(`🔢 Unseen count: ${unseenAlerts.length}`);
      return unseenAlerts.length || 0;
    } catch (error) {
      console.warn("Error in getUnseenAlertsCount:", error);
      return 0;
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
        // ✅ Badge tracking functions
        lastSeenAlerts,
        markAlertsAsSeen,
        getUnseenAlertsCount,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
