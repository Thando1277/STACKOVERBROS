// Screens/OfflineReportsScreen.jsx - Enhanced with retry and skip photo options
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { OfflineReportManager } from "../utils/OfflineReportManager";
import NetInfo from "@react-native-community/netinfo";

export default function OfflineReportsScreen() {
  const navigation = useNavigation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  // Check network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsConnected(connected);
      
      if (connected && !syncing) {
        // Connection restored, check if we should prompt for sync
        checkForAutoSync();
      }
    });
    return () => unsubscribe();
  }, [syncing]);

  // Load reports when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  const checkForAutoSync = async () => {
    const count = await OfflineReportManager.getPendingCount();
    if (count > 0) {
      const lastStatus = await OfflineReportManager.getLastSyncStatus();
      // Only prompt if last sync failed or never synced
      if (!lastStatus || lastStatus.failed > 0) {
        setTimeout(() => {
          Alert.alert(
            "Connection Restored",
            `You have ${count} pending report${count > 1 ? "s" : ""}. Would you like to sync now?`,
            [
              { text: "Later", style: "cancel" },
              { text: "Sync Now", onPress: () => syncAllReports() },
            ]
          );
        }, 1000);
      }
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const pendingReports = await OfflineReportManager.getPendingReports();
      setReports(pendingReports);
    } catch (error) {
      console.error("Error loading reports:", error);
      Alert.alert("Error", "Failed to load offline reports");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const syncAllReports = async (skipPhotos = false) => {
    if (!isConnected) {
      Alert.alert(
        "No Connection",
        "Please connect to the internet to sync reports."
      );
      return;
    }

    if (reports.length === 0) {
      Alert.alert("No Reports", "There are no pending reports to sync.");
      return;
    }

    setSyncing(true);
    setSyncProgress({ current: 0, total: reports.length });

    const result = await OfflineReportManager.syncOfflineReports(
      (current, total, report) => {
        setSyncProgress({ current, total });
        console.log(`Syncing ${current}/${total}: ${report.fullName}`);
      },
      skipPhotos
    );

    setSyncing(false);
    setSyncProgress({ current: 0, total: 0 });

    if (result.success) {
      await loadReports();
      
      if (result.synced > 0 && result.failed === 0) {
        // All synced successfully
        let message = `Successfully synced all ${result.synced} report${result.synced > 1 ? "s" : ""}!`;
        if (result.photosSkipped > 0) {
          message += `\n\nNote: ${result.photosSkipped} photo${result.photosSkipped > 1 ? "s" : ""} could not be uploaded. Reports were saved with text information only.`;
        }
        Alert.alert("Sync Complete ✓", message);
      } else if (result.synced > 0 && result.failed > 0) {
        // Partial success
        Alert.alert(
          "Partially Synced",
          `Successfully synced ${result.synced} report${result.synced > 1 ? "s" : ""}.\n${result.failed} failed to sync.`,
          [
            { text: "OK", style: "cancel" },
            { 
              text: "Retry Failed", 
              onPress: () => {
                // Show options for retry
                showRetryOptions();
              }
            },
          ]
        );
      } else {
        // All failed
        Alert.alert(
          "Sync Failed",
          "All reports failed to sync. This might be due to network issues.",
          [
            { text: "OK", style: "cancel" },
            { text: "Try Without Photos", onPress: () => syncAllReports(true) },
            { text: "Retry", onPress: () => syncAllReports() },
          ]
        );
      }
    } else {
      Alert.alert(
        "Sync Error",
        result.error || "Unknown error occurred. Please try again.",
        [
          { text: "OK", style: "cancel" },
          { text: "Retry", onPress: () => syncAllReports() },
        ]
      );
    }
  };

  const showRetryOptions = () => {
    Alert.alert(
      "Sync Options",
      "Choose how to retry syncing failed reports:",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Skip Photos", 
          onPress: () => syncAllReports(true),
          style: "default" 
        },
        { 
          text: "Retry with Photos", 
          onPress: () => syncAllReports(false) 
        },
      ]
    );
  };

  const syncSingleReport = async (report) => {
    if (!isConnected) {
      Alert.alert("No Connection", "Please connect to the internet first.");
      return;
    }

    Alert.alert(
      "Sync Report",
      `Sync "${report.fullName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sync",
          onPress: async () => {
            setSyncing(true);
            const result = await OfflineReportManager.syncSingleReport(report.offlineId);
            setSyncing(false);

            if (result.success) {
              await loadReports();
              Alert.alert("Success", "Report synced successfully!");
            } else {
              Alert.alert(
                "Sync Failed",
                result.error || "Please try again",
                [
                  { text: "OK", style: "cancel" },
                  { 
                    text: "Skip Photo", 
                    onPress: async () => {
                      setSyncing(true);
                      const retryResult = await OfflineReportManager.syncSingleReport(report.offlineId, true);
                      setSyncing(false);
                      if (retryResult.success) {
                        await loadReports();
                        Alert.alert("Success", "Report synced without photo!");
                      }
                    }
                  },
                ]
              );
            }
          },
        },
      ]
    );
  };

  const deleteReport = (report) => {
    Alert.alert(
      "Delete Report",
      `Delete "${report.fullName}"?\n\nThis cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await OfflineReportManager.deleteReport(report.offlineId);
            if (result.success) {
              await loadReports();
            } else {
              Alert.alert("Error", "Failed to delete report");
            }
          },
        },
      ]
    );
  };

  const clearAllReports = () => {
    Alert.alert(
      "Clear All Reports",
      "Are you sure you want to delete all pending reports? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await OfflineReportManager.clearAllOfflineReports();
              await loadReports();
              Alert.alert("Success", "All offline reports cleared");
            } catch (error) {
              Alert.alert("Error", "Failed to clear reports");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const ReportCard = ({ report }) => {
    const hasPhoto = !!report.photo;
    const syncAttempts = report.syncAttempts || 0;
    const hasError = !!report.lastSyncError;

    return (
      <View style={styles.reportCard}>
        {hasError && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={16} color="#fff" />
            <Text style={styles.errorText} numberOfLines={1}>
              {syncAttempts > 0 && `Failed ${syncAttempts}x: `}
              {report.lastSyncError}
            </Text>
          </View>
        )}

        <View style={styles.reportHeader}>
          <View style={styles.reportInfo}>
            <Text style={styles.reportName}>{report.fullName}</Text>
            <Text style={styles.reportDetails}>
              {report.age} years • {report.gender}
            </Text>
            <Text style={styles.reportLocation}>
              <Ionicons name="location" size={14} color="#666" />{" "}
              {report.lastSeenLocation}
            </Text>
            <Text style={styles.reportDate}>
              Last seen: {formatDate(report.lastSeenDate)}
            </Text>
            <Text style={styles.savedDate}>
              Saved: {formatDate(report.savedAt)}
            </Text>
          </View>
          {hasPhoto && (
            <Image source={{ uri: report.photo }} style={styles.reportImage} />
          )}
        </View>

        {report.description && (
          <Text style={styles.description} numberOfLines={2}>
            {report.description}
          </Text>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.syncSingleBtn}
            onPress={() => syncSingleReport(report)}
            disabled={!isConnected || syncing}
          >
            <Ionicons 
              name="sync" 
              size={18} 
              color={isConnected && !syncing ? "#7CC242" : "#ccc"} 
            />
            <Text style={[
              styles.syncSingleText,
              (!isConnected || syncing) && styles.disabledText
            ]}>
              Sync Now
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteReport(report)}
          >
            <Ionicons name="trash-outline" size={18} color="#ff3b30" />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7CC242" />
        <Text style={styles.loadingText}>Loading offline reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#7CC242" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Offline Reports</Text>

        {reports.length > 0 && (
          <TouchableOpacity onPress={clearAllReports}>
            <Ionicons name="trash-outline" size={24} color="#ff3b30" />
          </TouchableOpacity>
        )}
        {reports.length === 0 && <View style={{ width: 28 }} />}
      </View>

      {/* Connection Status Banner */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={20} color="#fff" />
          <Text style={styles.offlineText}>
            No internet connection. Connect to sync reports.
          </Text>
        </View>
      )}

      {/* Sync Progress */}
      {syncing && (
        <View style={styles.syncingBanner}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.syncingText}>
            Syncing {syncProgress.current} of {syncProgress.total}...
          </Text>
        </View>
      )}

      {/* Reports List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7CC242"
          />
        }
      >
        {reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#7CC242" />
            <Text style={styles.emptyTitle}>All Synced!</Text>
            <Text style={styles.emptyText}>
              You have no pending offline reports.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{reports.length}</Text>
                <Text style={styles.statLabel}>
                  Pending Report{reports.length > 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            {reports.map((report) => (
              <ReportCard key={report.offlineId} report={report} />
            ))}
          </>
        )}
      </ScrollView>

      {/* Sync Button */}
      {reports.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.syncBtn,
              (!isConnected || syncing) && styles.syncBtnDisabled,
            ]}
            onPress={() => syncAllReports()}
            disabled={!isConnected || syncing}
          >
            <Ionicons
              name={syncing ? "hourglass" : "sync"}
              size={20}
              color="#fff"
            />
            <Text style={styles.syncBtnText}>
              {syncing
                ? "Syncing..."
                : `Sync All ${reports.length} Report${reports.length > 1 ? "s" : ""}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#7CC242",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff9800",
    padding: 12,
    gap: 8,
  },
  offlineText: {
    color: "#fff",
    fontWeight: "600",
    flex: 1,
  },
  syncingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    padding: 12,
    gap: 8,
  },
  syncingText: {
    color: "#fff",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statBox: {
    backgroundColor: "#7CC242",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
  },
  statLabel: {
    fontSize: 16,
    color: "#fff",
    marginTop: 4,
  },
  reportCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff3b30",
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    gap: 6,
  },
  errorText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reportInfo: {
    flex: 1,
    marginRight: 12,
  },
  reportName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
    marginBottom: 4,
  },
  reportDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  reportLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 13,
    color: "#888",
    marginBottom: 2,
  },
  savedDate: {
    fontSize: 12,
    color: "#aaa",
    fontStyle: "italic",
  },
  reportImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  description: {
    fontSize: 14,
    color: "#555",
    marginTop: 12,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  syncSingleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: "#f0f7e8",
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  syncSingleText: {
    color: "#7CC242",
    fontWeight: "600",
    fontSize: 14,
  },
  disabledText: {
    color: "#ccc",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: "#ffebee",
    gap: 6,
  },
  deleteBtnText: {
    color: "#ff3b30",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#7CC242",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  syncBtn: {
    backgroundColor: "#7CC242",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  syncBtnDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  syncBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});