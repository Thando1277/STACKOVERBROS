// OfflineReportManager.js - Enhanced for Android & iOS with persistent photo handling
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";
import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from 'expo-file-system/legacy';

const OFFLINE_REPORTS_KEY = "offlineReports";
const SYNC_STATUS_KEY = "lastSyncStatus";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const UPLOAD_TIMEOUT = 60000; // 60 seconds
const OFFLINE_PHOTOS_DIR = FileSystem.documentDirectory + "offline_photos/";

export class OfflineReportManager {
  // --- Connectivity ---
  static async checkConnectivity() {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected && state.isInternetReachable !== false;
    } catch (error) {
      console.error("Error checking connectivity:", error);
      return false;
    }
  }

  // --- Ensure photo folder exists ---
  static async ensurePhotoDir() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(OFFLINE_PHOTOS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(OFFLINE_PHOTOS_DIR, { intermediates: true });
      }
    } catch (err) {
      console.error("Error creating offline photos folder:", err);
    }
  }

  // --- Platform-specific URI handling ---
  static normalizeUri(uri) {
    if (!uri) return uri;
    
    // Handle Android content URIs and file paths
    if (Platform.OS === 'android') {
      if (uri.startsWith('content://')) {
        return uri;
      }
      if (uri.startsWith('file://')) {
        return uri;
      }
    }
    
    // Handle iOS file URIs
    if (Platform.OS === 'ios' && uri.startsWith('file://')) {
      return uri;
    }
    
    return uri;
  }

  // --- Persist photo in permanent folder ---
  static async persistPhoto(pickedUri) {
    try {
      await this.ensurePhotoDir();
      const normalizedUri = this.normalizeUri(pickedUri);
      
      // Extract file extension safely
      let ext = 'jpg';
      try {
        const uriParts = normalizedUri.split('.');
        if (uriParts.length > 1) {
          ext = uriParts.pop().split('?')[0].toLowerCase();
          // Validate extension
          if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            ext = 'jpg';
          }
        }
      } catch (e) {
        console.warn("Could not determine file extension, using jpg:", e);
        ext = 'jpg';
      }
      
      const filename = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
      const dest = OFFLINE_PHOTOS_DIR + filename;

      // Use copyAsync for both platforms
      await FileSystem.copyAsync({ 
        from: normalizedUri, 
        to: dest 
      });
      
      console.log("✅ Photo persisted to:", dest);
      return dest;
    } catch (err) {
      console.error("❌ Error persisting photo:", err);
      // Return original URI as fallback
      return pickedUri;
    }
  }

  // --- Validate photo URI exists ---
  static async validatePhotoUri(uri) {
    try {
      if (!uri) return false;

      // Check if it's a local file path
      if (uri.startsWith("file://") || uri.startsWith(OFFLINE_PHOTOS_DIR) || uri.startsWith("content://")) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          console.warn("Photo file does not exist:", uri);
          return false;
        }
        // Additional check for file size
        if (fileInfo.size && fileInfo.size === 0) {
          console.warn("Photo file is empty:", uri);
          return false;
        }
        return true;
      }

      // Skip URLs - they're already uploaded
      if (uri.startsWith("http://") || uri.startsWith("https://")) {
        return false;
      }

      return false; // Default to false for unknown URI types
    } catch (error) {
      console.error("Error validating photo:", error);
      return false;
    }
  }

  // --- Save report offline ---
  static async saveOfflineReport(report) {
    try {
      const existing = await AsyncStorage.getItem(OFFLINE_REPORTS_KEY);
      const reports = existing ? JSON.parse(existing) : [];

      // Persist photo if exists
      let persistentPhoto = null;
      if (report.photo) {
        persistentPhoto = await this.persistPhoto(report.photo);
      }

      const offlineReport = {
        ...report,
        photo: persistentPhoto,
        offlineId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        savedAt: new Date().toISOString(),
        syncAttempts: 0,
        platform: Platform.OS, // Store platform for debugging
      };

      reports.push(offlineReport);
      await AsyncStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(reports));

      console.log("✅ Report saved offline:", offlineReport.offlineId);
      return { success: true, offlineId: offlineReport.offlineId };
    } catch (err) {
      console.error("❌ Failed to save offline report:", err);
      return { success: false, error: err.message };
    }
  }

  // --- Pending reports ---
  static async getPendingCount() {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_REPORTS_KEY);
      if (!data) return 0;
      const reports = JSON.parse(data);
      return reports.length;
    } catch (err) {
      console.error("Error getting pending count:", err);
      return 0;
    }
  }

  static async getPendingReports() {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_REPORTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error("Error getting pending reports:", err);
      return [];
    }
  }

  // --- Upload photo with Android compatibility ---
  static async uploadPhoto(photoUri, retries = MAX_RETRIES) {
    const isValid = await this.validatePhotoUri(photoUri);
    if (!isValid) return { success: false, error: "Invalid photo URI", skip: true };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📤 Photo upload attempt ${attempt}/${retries} for:`, photoUri);
        const isConnected = await this.checkConnectivity();
        if (!isConnected) throw new Error("No internet connection");

        let uri = photoUri;
        
        // Platform-specific URI handling
        if (Platform.OS === "ios" && uri.startsWith("file://")) {
          uri = uri.replace("file://", "");
        }
        
        // For Android, use the URI as-is (supports content:// and file://)
        // Read file as base64 for universal compatibility
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          throw new Error("File does not exist");
        }

        const base64 = await FileSystem.readAsStringAsync(uri, { 
          encoding: FileSystem.EncodingType.Base64 
        });

        const formData = new FormData();
        formData.append("file", `data:image/jpeg;base64,${base64}`);
        formData.append("upload_preset", "UserPosts");
        formData.append("folder", "offline_reports");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT);

        const res = await fetch("https://api.cloudinary.com/v1_1/dpo2fiwoz/image/upload", {
          method: "POST",
          headers: { 
            Accept: "application/json", 
            "Content-Type": "multipart/form-data" 
          },
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Upload failed with status ${res.status}: ${errorText}`);
        }

        const json = await res.json();
        if (!json.secure_url) throw new Error("Cloudinary upload failed - no URL returned");

        console.log("✅ Photo uploaded:", json.secure_url);
        return { success: true, url: json.secure_url };
      } catch (err) {
        console.error(`Photo upload attempt ${attempt} failed:`, err.message);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }
    return { success: false, error: "Max retries exceeded" };
  }

  // --- Alternative upload method for problematic files ---
  static async uploadPhotoAlternative(photoUri) {
    try {
      console.log("🔄 Trying alternative upload method for:", photoUri);
      const isConnected = await this.checkConnectivity();
      if (!isConnected) throw new Error("No internet connection");

      const uri = this.normalizeUri(photoUri);
      
      // Create form data with file object
      const formData = new FormData();
      formData.append("file", { 
        uri: uri, 
        type: "image/jpeg", 
        name: `offline_report_${Date.now()}.jpg` 
      });
      formData.append("upload_preset", "UserPosts");
      formData.append("folder", "offline_reports");

      const res = await fetch("https://api.cloudinary.com/v1_1/dpo2fiwoz/image/upload", { 
        method: "POST", 
        body: formData 
      });
      
      if (!res.ok) throw new Error(`Alternative upload failed: ${res.status}`);

      const json = await res.json();
      if (!json.secure_url) throw new Error("No URL in response");

      console.log("✅ Alternative upload successful");
      return { success: true, url: json.secure_url };
    } catch (error) {
      console.error("Alternative upload failed:", error);
      return { success: false, error: error.message };
    }
  }

  // --- Sync offline reports ---
  static async syncOfflineReports(onProgress, skipPhotos = false) {
    try {
      const isConnected = await this.checkConnectivity();
      if (!isConnected) return { success: false, error: "No internet connection" };

      const data = await AsyncStorage.getItem(OFFLINE_REPORTS_KEY);
      if (!data) return { success: true, synced: 0, failed: 0 };

      const reports = JSON.parse(data);
      if (reports.length === 0) return { success: true, synced: 0, failed: 0 };

      const failed = [];
      const syncedReports = [];
      let syncedCount = 0;
      let photosSkipped = 0;

      for (let i = 0; i < reports.length; i++) {
        const report = reports[i];
        if (onProgress) onProgress(i + 1, reports.length, report);

        try {
          const stillConnected = await this.checkConnectivity();
          if (!stillConnected) throw new Error("Connection lost during sync");

          let photoUrl = null;
          let photoFailed = false;

          // Handle photo upload if not skipped
          if (report.photo && !skipPhotos) {
            console.log(`🖼️ Uploading photo for report ${report.offlineId}`);
            let uploadResult = await this.uploadPhoto(report.photo);
            
            // Try alternative method if first attempt fails
            if (!uploadResult.success && !uploadResult.skip) {
              console.log("🔄 Trying alternative upload method");
              uploadResult = await this.uploadPhotoAlternative(report.photo);
            }

            if (uploadResult.success) {
              photoUrl = uploadResult.url;
            } else {
              photoFailed = true;
              photosSkipped++;
              console.warn("❌ Photo upload failed for report:", report.offlineId);
            }
          }

          // Prepare clean report for Firestore
          const { offlineId, savedAt, photo, syncAttempts, lastSyncError, lastSyncAttempt, platform, ...cleanReport } = report;

          // Upload to Firestore
          await addDoc(collection(db, "reports"), {
            ...cleanReport,
            photo: photoUrl,
            status: "search",
            createdAt: serverTimestamp(),
            syncedFrom: "offline",
            photoUploadFailed: photoFailed,
            originalOfflineId: offlineId,
          });

          syncedCount++;
          syncedReports.push(offlineId);
          console.log("✅ Report synced successfully:", offlineId);

        } catch (err) {
          console.error("❌ Failed to sync report:", report.offlineId, err);
          report.syncAttempts = (report.syncAttempts || 0) + 1;
          report.lastSyncError = err.message;
          report.lastSyncAttempt = new Date().toISOString();
          failed.push(report);
        }
      }

      // Update storage with failed reports only
      await AsyncStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(failed));

      // Save sync status
      const syncStatus = { 
        lastSync: new Date().toISOString(), 
        synced: syncedCount, 
        failed: failed.length, 
        photosSkipped, 
        syncedReportIds: syncedReports 
      };
      await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));

      // Clean up synced photos
      if (syncedCount > 0) {
        this.cleanupSyncedPhotos(syncedReports, reports);
      }

      return { 
        success: true, 
        synced: syncedCount, 
        failed: failed.length, 
        photosSkipped, 
        failedReports: failed 
      };
    } catch (error) {
      console.error("Sync error:", error);
      return { success: false, error: error.message };
    }
  }

  // --- Clean up photos from synced reports ---
  static async cleanupSyncedPhotos(syncedReportIds, allReports) {
    try {
      const syncedReports = allReports.filter(report => 
        syncedReportIds.includes(report.offlineId)
      );

      for (const report of syncedReports) {
        if (report.photo && report.photo.startsWith(OFFLINE_PHOTOS_DIR)) {
          try {
            await FileSystem.deleteAsync(report.photo, { idempotent: true });
            console.log("🧹 Cleaned up photo:", report.photo);
          } catch (err) {
            console.warn("Could not delete photo:", report.photo, err);
          }
        }
      }
    } catch (error) {
      console.error("Error cleaning up photos:", error);
    }
  }

  // --- Sync single report ---
  static async syncSingleReport(offlineId, skipPhoto = false) {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_REPORTS_KEY);
      if (!data) return { success: false, error: "Report not found" };

      const reports = JSON.parse(data);
      const reportIndex = reports.findIndex(r => r.offlineId === offlineId);
      if (reportIndex === -1) return { success: false, error: "Report not found" };

      const report = reports[reportIndex];
      const isConnected = await this.checkConnectivity();
      if (!isConnected) return { success: false, error: "No internet connection" };

      let photoUrl = null;
      let photoFailed = false;

      if (report.photo && !skipPhoto) {
        let uploadResult = await this.uploadPhoto(report.photo);
        if (!uploadResult.success && !uploadResult.skip) {
          uploadResult = await this.uploadPhotoAlternative(report.photo);
        }

        if (uploadResult.success) {
          photoUrl = uploadResult.url;
        } else {
          photoFailed = true;
        }
      }

      const { offlineId: id, savedAt, photo, syncAttempts, lastSyncError, lastSyncAttempt, platform, ...cleanReport } = report;

      await addDoc(collection(db, "reports"), { 
        ...cleanReport, 
        photo: photoUrl, 
        status: "search", 
        createdAt: serverTimestamp(), 
        syncedFrom: "offline", 
        photoUploadFailed: photoFailed,
        originalOfflineId: offlineId,
      });

      // Remove from storage
      reports.splice(reportIndex, 1);
      await AsyncStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(reports));

      // Clean up photo file
      if (photo && photo.startsWith(OFFLINE_PHOTOS_DIR)) {
        try {
          await FileSystem.deleteAsync(photo, { idempotent: true });
        } catch (err) {
          console.warn("Could not delete photo file:", photo);
        }
      }

      return { success: true, photoUploaded: !!photoUrl };
    } catch (error) {
      console.error("Single sync error:", error);
      return { success: false, error: error.message };
    }
  }

  // --- Clear all offline data including photos ---
  static async clearAllOfflineReports() {
    try {
      // Clear stored reports
      await AsyncStorage.removeItem(OFFLINE_REPORTS_KEY);
      
      // Clear photos directory
      try {
        const dirInfo = await FileSystem.getInfoAsync(OFFLINE_PHOTOS_DIR);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(OFFLINE_PHOTOS_DIR, { idempotent: true });
        }
        // Recreate empty directory
        await this.ensurePhotoDir();
      } catch (photoErr) {
        console.warn("Could not clear photos directory:", photoErr);
      }
      
      console.log("🧹 Cleared all offline reports and photos");
      return { success: true };
    } catch (err) {
      console.error("Error clearing offline reports:", err);
      return { success: false, error: err.message };
    }
  }

  // --- Get last sync status ---
  static async getLastSyncStatus() {
    try {
      const data = await AsyncStorage.getItem(SYNC_STATUS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error("Error getting sync status:", err);
      return null;
    }
  }

  // --- Delete single report ---
  static async deleteReport(offlineId) {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_REPORTS_KEY);
      if (!data) return { success: false, error: "No reports found" };

      const reports = JSON.parse(data);
      const reportIndex = reports.findIndex(r => r.offlineId === offlineId);
      
      if (reportIndex === -1) return { success: false, error: "Report not found" };

      const report = reports[reportIndex];
      
      // Delete associated photo file
      if (report.photo && report.photo.startsWith(OFFLINE_PHOTOS_DIR)) {
        try {
          await FileSystem.deleteAsync(report.photo, { idempotent: true });
        } catch (photoErr) {
          console.warn("Could not delete photo file:", report.photo);
        }
      }

      // Remove from storage
      const filteredReports = reports.filter(r => r.offlineId !== offlineId);
      await AsyncStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(filteredReports));

      return { success: true };
    } catch (error) {
      console.error("Error deleting report:", error);
      return { success: false, error: error.message };
    }
  }

  // --- Get storage usage info ---
  static async getStorageInfo() {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_REPORTS_KEY);
      const reports = data ? JSON.parse(data) : [];
      
      let totalPhotoSize = 0;
      for (const report of reports) {
        if (report.photo && (report.photo.startsWith(OFFLINE_PHOTOS_DIR) || report.photo.startsWith('file://'))) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(report.photo);
            if (fileInfo.exists && fileInfo.size) {
              totalPhotoSize += fileInfo.size;
            }
          } catch (err) {
            console.warn("Could not get file info for:", report.photo);
          }
        }
      }

      return {
        reportCount: reports.length,
        totalPhotoSize,
        totalPhotoSizeMB: (totalPhotoSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.error("Error getting storage info:", error);
      return { reportCount: 0, totalPhotoSize: 0, totalPhotoSizeMB: '0.00' };
    }
  }
}