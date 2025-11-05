// DetailsScreen.js - COMPLETE VERSION WITH CUSTOM THEMED ANDROID ALERT
import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, SafeAreaView, Modal, Platform, Animated, Dimensions
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { doc, getDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth } from "../Firebase/firebaseConfig";
import * as ImagePicker from 'expo-image-picker';
import { File, Directory, Paths } from 'expo-file-system';
import { LineChart } from 'react-native-chart-kit';
import Config from '../Config';

const screenWidth = Dimensions.get("window").width;
const API_URL = Config.API_URL;

// Test connection function
async function testServerConnection() {
  try {
    console.log(`Testing connection to ${API_URL}/health...`);
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log('✓ Server connection successful:', data);
    return true;
  } catch (error) {
    console.error('✗ Server connection failed:', error.message);
    return false;
  }
}

// Helper function to convert Cloudinary URLs to JPEG format
const convertCloudinaryToJpeg = (url) => {
  if (url && url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/f_jpg,q_90/');
  }
  return url;
};

// Image to base64 conversion
const imageToBase64 = async (imageUri) => {
  try {
    console.log('Converting image to base64:', imageUri);
    
    if (imageUri.startsWith('file://')) {
      const file = new File(imageUri);
      const base64 = await file.base64();
      return base64;
    } else {
      const processedUri = convertCloudinaryToJpeg(imageUri);
      const destination = new Directory(Paths.cache, 'temp_downloads');
      
      try {
        destination.create({ intermediates: true });
      } catch (err) {
        // Directory exists
      }
      
      console.log('📥 Downloading from:', processedUri);
      
      const timestamp = Date.now();
      const fileName = `img_${timestamp}.jpg`;
      const targetFile = new File(destination.uri, fileName);
      
      if (targetFile.exists) {
        targetFile.delete();
      }
      
      const downloadedFile = await File.downloadFileAsync(
        processedUri, 
        new File(destination.uri, fileName)
      );
      
      console.log('✓ Downloaded to:', downloadedFile.uri);
      
      const base64 = await downloadedFile.base64();
      
      try {
        downloadedFile.delete();
      } catch (cleanupErr) {
        console.log('⚠️ Could not cleanup temp file:', cleanupErr.message);
      }
      
      return base64;
    }
  } catch (error) {
    console.error('Image conversion error:', error);
    throw new Error(`Image conversion failed: ${error.message}`);
  }
};

// ✅ NEW: Custom Themed Android Alert Modal
function CustomAlertModal({ visible, onClose, isDark }) {
  const themeColors = {
    overlay: 'rgba(0, 0, 0, 0.85)',
    card: isDark ? "#2A2A2A" : "#FFF",
    text: isDark ? "#E0E0E0" : "#222",
    subText: isDark ? "#AAA" : "#666",
    primary: "#7CC242",
    border: isDark ? "#555" : "#EEE",
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={customAlertStyles.overlay}>
        <View style={[customAlertStyles.container, { backgroundColor: themeColors.card }]}>
          {/* Icon Header */}
          <View style={[customAlertStyles.iconCircle, { backgroundColor: '#7CC24215' }]}>
            <Ionicons name="phone-portrait-outline" size={48} color="#7CC242" />
          </View>

          {/* Title */}
          <Text style={[customAlertStyles.title, { color: themeColors.text }]}>
            iOS Only Feature
          </Text>

          {/* Description */}
          <Text style={[customAlertStyles.description, { color: themeColors.subText }]}>
            Face scanning with AI is currently only available on iPhone devices.{'\n\n'}
            Android support is coming soon! 🚀
          </Text>

          {/* Feature Pills */}
          <View style={customAlertStyles.featurePills}>
            <View style={customAlertStyles.pill}>
              <Ionicons name="logo-apple" size={16} color="#7CC242" />
              <Text style={[customAlertStyles.pillText, { color: themeColors.text }]}>iOS Ready</Text>
            </View>
            <View style={[customAlertStyles.pill, { opacity: 0.5 }]}>
              <Ionicons name="logo-android" size={16} color="#999" />
              <Text style={[customAlertStyles.pillText, { color: themeColors.subText }]}>Coming Soon</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[customAlertStyles.divider, { backgroundColor: themeColors.border }]} />

          {/* Buttons */}
          <TouchableOpacity
            style={[customAlertStyles.button, customAlertStyles.primaryButton]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={customAlertStyles.buttonText}>Got It!</Text>
            <Ionicons name="checkmark-circle" size={20} color="white" />
          </TouchableOpacity>

          {/* Footer */}
          <View style={customAlertStyles.footer}>
            <Ionicons name="information-circle-outline" size={14} color={themeColors.subText} />
            <Text style={[customAlertStyles.footerText, { color: themeColors.subText }]}>
              Powered by Google Vision AI
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Animated Loading Graph Component
function AnimatedLoadingGraph() {
  const [dataPoints, setDataPoints] = useState([0, 20, 40, 35, 60, 75, 85]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints(prev => {
        const newPoints = [...prev.slice(1), Math.random() * 100];
        return newPoints;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={comparisonStyles.graphContainer}>
      <LineChart
        data={{
          labels: [],
          datasets: [{
            data: dataPoints,
            strokeWidth: 3,
          }],
        }}
        width={screenWidth - 80}
        height={120}
        chartConfig={{
          backgroundColor: '#1e1e1e',
          backgroundGradientFrom: '#2A2A2A',
          backgroundGradientTo: '#1E1E1E',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(124, 194, 66, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '0',
          },
        }}
        bezier
        style={comparisonStyles.chart}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLabels={false}
        withHorizontalLabels={false}
      />
      <View style={comparisonStyles.graphOverlay}>
        <ActivityIndicator size="small" color="#7CC242" />
        <Text style={comparisonStyles.graphText}>Analyzing visual patterns...</Text>
      </View>
    </View>
  );
}

// Advanced Image Comparison Modal Component
function ImageComparisonModal({ 
  visible, 
  onClose, 
  referenceImage, 
  reportType, 
  themeColors 
}) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState(null);
  const [analysisSteps, setAnalysisSteps] = useState([]);
  const [currentMetric, setCurrentMetric] = useState({ name: '', value: 0 });
  const [showAndroidAlert, setShowAndroidAlert] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // ✅ UPDATED: Use custom alert
  const pickImage = async () => {
    if (Platform.OS === 'android') {
      setShowAndroidAlert(true);
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Camera access is needed to take photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        setResult(null);
        setAnalysisSteps([]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert("Error", "Failed to capture image");
    }
  };

  const compareImages = async () => {
    // ✅ UPDATED: Use custom alert
    if (Platform.OS === 'android') {
      setShowAndroidAlert(true);
      return;
    }

    if (!capturedImage || !referenceImage) {
      Alert.alert("Error", "Both images are required for comparison.");
      return;
    }

    setComparing(true);
    setResult(null);
    setAnalysisSteps([]);

    const steps = [
      { name: "🔍 Preprocessing images", metric: "Image Quality", value: 95 },
      { name: "📐 Detecting features", metric: "Features Found", value: 128 },
      { name: "🎨 Analyzing patterns", metric: "Pattern Match", value: 87 },
      { name: "👤 Deep learning scan", metric: "AI Confidence", value: 92 },
      { name: "📊 Computing similarity", metric: "Similarity", value: 0 },
      { name: "✅ Finalizing results", metric: "Analysis", value: 100 }
    ];

    for (let i = 0; i < steps.length; i++) {
      setAnalysisSteps(prev => [...prev, steps[i].name]);
      setCurrentMetric({ name: steps[i].metric, value: steps[i].value });
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    try {
      const isConnected = await testServerConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to server at ' + API_URL);
      }

      console.log('🔄 Converting images to base64...');
      const img1Base64 = await imageToBase64(referenceImage);
      const img2Base64 = await imageToBase64(capturedImage);

      if (!img1Base64 || !img2Base64) {
        throw new Error('Image conversion produced empty data');
      }

      console.log('✓ Images converted, sending to API...');
      const response = await fetch(`${API_URL}/compare`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          image1: img1Base64,
          image2: img2Base64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server returned ${response.status}`);
      }

      const data = await response.json();
      console.log('✓ Comparison result:', data);

      setResult({
        similarity: data.similarity || 0,
        match: data.match || false,
        confidence: data.confidence_level || 'unknown',
        message: data.message || 'Analysis complete',
        faceDistance: data.face_distance || data.distance,
        interpretation: data.analysis_details?.interpretation || 'No interpretation available',
        analysisType: data.analysis_type || data.comparison_type || 'unknown'
      });

      const matchStatus = data.similarity >= 75 ? "Strong Match! 🎯" : 
                         data.similarity >= 50 ? "Possible Match 🤔" : "No Match ❌";
      Alert.alert(
        'Analysis Complete',
        `${matchStatus}\n\n${data.analysis_details?.interpretation}\n\nSimilarity: ${data.similarity}%`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('❌ Comparison failed:', error);
      Alert.alert('Comparison Failed', error.message || 'Unknown error occurred');
      
      setResult({
        similarity: 0,
        match: false,
        confidence: 'error',
        message: `Error: ${error.message}`
      });
    } finally {
      setComparing(false);
    }
  };

  const resetComparison = () => {
    setCapturedImage(null);
    setResult(null);
    setAnalysisSteps([]);
  };

  const handleReportMatch = async () => {
    if (!result) return;

    Alert.alert(
      "Report Potential Match",
      `Report this ${result.similarity}% confidence match to the owner?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Report Match", 
          onPress: () => {
            Alert.alert("Success!", `Match reported with ${result.similarity}% confidence.`);
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <Animated.View style={[comparisonStyles.modalContainer, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={comparisonStyles.scrollContent}>
          <View style={[comparisonStyles.modalContent, { backgroundColor: themeColors.cardBg }]}>
            <View style={comparisonStyles.modalHeader}>
              <View style={comparisonStyles.headerLeft}>
                <View style={comparisonStyles.iconCircle}>
                  <Ionicons name="scan" size={24} color="#7CC242" />
                </View>
                <View>
                  <Text style={[comparisonStyles.modalTitle, { color: themeColors.text }]}>
                    AI Vision Analysis
                  </Text>
                  <Text style={[comparisonStyles.modalSubtitle, { color: themeColors.subText }]}>
                    Google Vision AI • Real-time processing • iOS Only
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={comparisonStyles.closeButton}>
                <Ionicons name="close-circle" size={32} color={themeColors.subText} />
              </TouchableOpacity>
            </View>

            <View style={comparisonStyles.comparisonContainer}>
              <View style={comparisonStyles.imageBox}>
                <Text style={[comparisonStyles.imageLabel, { color: themeColors.text }]}>
                  <Ionicons name="image" size={14} color="#7CC242" /> Reference
                </Text>
                {referenceImage ? (
                  <View style={comparisonStyles.imageWrapper}>
                    <Image source={{ uri: referenceImage }} style={comparisonStyles.comparisonImage} />
                    <View style={comparisonStyles.imageBadge}>
                      <Text style={comparisonStyles.badgeText}>{reportType}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={[comparisonStyles.placeholderBox, { borderColor: themeColors.border }]}>
                    <Ionicons name="image-outline" size={40} color="#999" />
                  </View>
                )}
              </View>

              <View style={comparisonStyles.vsContainer}>
                <View style={comparisonStyles.vsCircle}>
                  <Ionicons name="git-compare" size={20} color="white" />
                </View>
                <Text style={comparisonStyles.vsText}>VS</Text>
              </View>

              <View style={comparisonStyles.imageBox}>
                <Text style={[comparisonStyles.imageLabel, { color: themeColors.text }]}>
                  <Ionicons name="camera" size={14} color="#FF6B35" /> Your Photo
                </Text>
                {capturedImage ? (
                  <View style={comparisonStyles.imageWrapper}>
                    <Image source={{ uri: capturedImage }} style={comparisonStyles.comparisonImage} />
                    <View style={[comparisonStyles.imageBadge, { backgroundColor: '#FF6B35' }]}>
                      <Text style={comparisonStyles.badgeText}>Live</Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity 
                    onPress={pickImage} 
                    style={[comparisonStyles.placeholderBox, { borderColor: '#FF6B35' }]}
                  >
                    <Ionicons name="camera" size={40} color="#FF6B35" />
                    <Text style={comparisonStyles.placeholderText}>Tap to Capture</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {comparing && (
              <View style={comparisonStyles.analysisSection}>
                <AnimatedLoadingGraph />
                
                <View style={comparisonStyles.metricsContainer}>
                  <View style={comparisonStyles.metricBox}>
                    <Ionicons name="speedometer" size={20} color="#7CC242" />
                    <Text style={comparisonStyles.metricLabel}>{currentMetric.name}</Text>
                    <Text style={comparisonStyles.metricValue}>{currentMetric.value}{currentMetric.name === 'Features Found' ? '' : '%'}</Text>
                  </View>
                </View>

                <View style={comparisonStyles.stepsContainer}>
                  {analysisSteps.map((step, index) => (
                    <Animated.View 
                      key={index} 
                      style={[
                        comparisonStyles.stepRow,
                        { opacity: index === analysisSteps.length - 1 ? 1 : 0.5 }
                      ]}
                    >
                      <View style={comparisonStyles.stepIndicator}>
                        <Ionicons name="checkmark-circle" size={18} color="#7CC242" />
                      </View>
                      <Text style={[comparisonStyles.stepText, { color: themeColors.text }]}>
                        {step}
                      </Text>
                      {index === analysisSteps.length - 1 && (
                        <ActivityIndicator size="small" color="#7CC242" style={{ marginLeft: 'auto' }} />
                      )}
                    </Animated.View>
                  ))}
                </View>
              </View>
            )}

            {!result && !comparing && capturedImage && (
              <TouchableOpacity 
                style={comparisonStyles.compareBtn}
                onPress={compareImages}
              >
                <Ionicons name="flash" size={22} color="white" />
                <Text style={comparisonStyles.compareBtnText}>Start AI Analysis</Text>
              </TouchableOpacity>
            )}

            {result && (
              <View style={comparisonStyles.resultContainer}>
                <View style={[
                  comparisonStyles.similarityBadge,
                  { 
                    backgroundColor: result.similarity >= 75 ? '#7CC242' : 
                                   result.similarity >= 50 ? '#FF9800' : '#E74C3C' 
                  }
                ]}>
                  <Ionicons 
                    name={result.similarity >= 75 ? "checkmark-circle" : 
                          result.similarity >= 50 ? "alert-circle" : "close-circle"} 
                    size={32} 
                    color="white" 
                  />
                  <Text style={comparisonStyles.similarityScore}>{result.similarity}%</Text>
                  <Text style={comparisonStyles.similarityLabel}>Match Confidence</Text>
                </View>

                <View style={comparisonStyles.resultDetailsCard}>
                  <View style={comparisonStyles.resultRow}>
                    <Ionicons name="layers" size={20} color="#7CC242" />
                    <View style={comparisonStyles.resultInfo}>
                      <Text style={[comparisonStyles.resultLabel, { color: themeColors.subText }]}>
                        Analysis Type
                      </Text>
                      <Text style={[comparisonStyles.resultValue, { color: themeColors.text }]}>
                        {result.analysisType === 'face_recognition' ? '👤 Face Recognition' : 
                         result.analysisType === 'object_pet_comparison' ? '🐾 Object/Pet Matching' : 
                         '🔍 Deep Learning'}
                      </Text>
                    </View>
                  </View>

                  <View style={comparisonStyles.resultRow}>
                    <Ionicons name="flag" size={20} color="#FF9800" />
                    <View style={comparisonStyles.resultInfo}>
                      <Text style={[comparisonStyles.resultLabel, { color: themeColors.subText }]}>
                        Interpretation
                      </Text>
                      <Text style={[comparisonStyles.resultValue, { color: themeColors.text }]}>
                        {result.interpretation}
                      </Text>
                    </View>
                  </View>

                  {result.faceDistance && (
                    <View style={comparisonStyles.resultRow}>
                      <Ionicons name="git-compare" size={20} color="#E74C3C" />
                      <View style={comparisonStyles.resultInfo}>
                        <Text style={[comparisonStyles.resultLabel, { color: themeColors.subText }]}>
                          Distance Metric
                        </Text>
                        <Text style={[comparisonStyles.resultValue, { color: themeColors.text }]}>
                          {result.faceDistance} (lower = better)
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={comparisonStyles.resultActions}>
                  <TouchableOpacity 
                    style={[comparisonStyles.actionBtn, comparisonStyles.secondaryBtn]}
                    onPress={resetComparison}
                  >
                    <Ionicons name="refresh" size={20} color="#7CC242" />
                    <Text style={[comparisonStyles.actionBtnText, { color: '#7CC242' }]}>
                      New Scan
                    </Text>
                  </TouchableOpacity>

                  {result.similarity >= 70 && (
                    <TouchableOpacity 
                      style={[comparisonStyles.actionBtn, comparisonStyles.primaryBtn]}
                      onPress={handleReportMatch}
                    >
                      <Ionicons name="flag" size={20} color="white" />
                      <Text style={[comparisonStyles.actionBtnText, { color: 'white' }]}>
                        Report Match
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <View style={comparisonStyles.footer}>
              <Ionicons name="shield-checkmark" size={16} color="#7CC242" />
              <Text style={[comparisonStyles.footerText, { color: themeColors.subText }]}>
                Powered by Google Vision AI • iOS Only • Always verify in person
              </Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* ✅ Custom Android Alert inside ImageComparisonModal */}
      <CustomAlertModal
        visible={showAndroidAlert}
        onClose={() => setShowAndroidAlert(false)}
        isDark={themeColors.text === "#E0E0E0"}
      />
    </Modal>
  );
}

// Main DetailsScreen Component
export default function DetailsScreen({ route }) {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showAndroidAlert, setShowAndroidAlert] = useState(false);

  const { report: reportProp, reportId } = route.params;

  const themeColors = {
    bg: isDark ? "#1E1E1E" : "#fff",
    text: isDark ? "#E0E0E0" : "#222",
    subText: isDark ? "#aaa" : "#555",
    cardBg: isDark ? "#2A2A2A" : "#fff",
    border: isDark ? "#555" : "#ddd",
    primary: "#7CC242",
  };

  const user = auth.currentUser;

  useEffect(() => {
    const fetchReport = async () => {
      if (reportProp) {
        setReport(reportProp);
      } else if (reportId) {
        setLoading(true);
        try {
          const reportDoc = await getDoc(doc(db, "reports", reportId));
          if (reportDoc.exists()) {
            setReport({ id: reportDoc.id, ...reportDoc.data() });
          } else {
            Alert.alert("Error", "Report not found.");
            navigation.goBack();
          }
        } catch (error) {
          console.error("Error fetching report:", error);
          Alert.alert("Error", "Failed to load report details.");
          navigation.goBack();
        } finally {
          setLoading(false);
        }
      }
    };

    fetchReport();
  }, [reportProp, reportId]);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!report || !user) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const savedReports = userDoc.data().savedReports || [];
          setIsSaved(savedReports.includes(report.id));
        }
      } catch (error) {
        console.error("Error checking saved status:", error);
      }
    };

    checkIfSaved();
  }, [report, user]);

  const handleSaveReport = async () => {
    if (!user || !report) return;

    const userRef = doc(db, "users", user.uid);

    try {
      if (isSaved) {
        await updateDoc(userRef, {
          savedReports: arrayRemove(report.id)
        });
        setIsSaved(false);
        Alert.alert("Removed", "Report removed from saved items.");
      } else {
        await updateDoc(userRef, {
          savedReports: arrayUnion(report.id)
        });
        setIsSaved(true);
        Alert.alert("Saved", "Report saved successfully!");
      }
    } catch (error) {
      console.error("Error saving/unsaving report:", error);
      Alert.alert("Error", "Failed to update saved status.");
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to delete this report? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "reports", report.id));
              Alert.alert("Deleted", "The report has been successfully deleted.");
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting report:", error);
              Alert.alert("Error", "Failed to delete the report. Please try again.");
            }
          },
        },
      ]
    );
  };

  // ✅ UPDATED: Use custom themed alert
  const handleAIClick = () => {
    if (Platform.OS === 'android') {
      setShowAndroidAlert(true);
      return;
    }
    
    setShowComparisonModal(true);
  };

  if (loading || !report) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7CC242" />
        <Text style={{ color: themeColors.text, marginTop: 10 }}>Loading report...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.headerRow, { backgroundColor: themeColors.cardBg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={handleAIClick}
              style={styles.cameraButton}
            >
              <Ionicons name="camera" size={22} color="#7CC242" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleSaveReport}
              style={styles.bookmarkButton}
            >
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={22} 
                color="#7CC242" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {report.photo ? (
          <TouchableOpacity onPress={() => setPreviewImage(report.photo)}>
            <Image source={{ uri: report.photo }} style={styles.image} />
          </TouchableOpacity>
        ) : (
          <View style={styles.noImage}>
            <Ionicons name="image-outline" size={60} color="#aaa" />
            <Text style={styles.noImageText}>No Photo Available</Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: themeColors.cardBg }]}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: themeColors.text }]}>{report.fullName}</Text>
            {isSaved && (
              <View style={styles.savedBadge}>
                <Ionicons name="bookmark" size={14} color="#7CC242" />
                <Text style={styles.savedBadgeText}>Saved</Text>
              </View>
            )}
          </View>
          <Text style={[styles.subText, { color: themeColors.subText }]}>
            {report.age} • {report.gender} • {report.type}
          </Text>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Last Seen</Text>
            <Text style={[styles.sectionText, { color: themeColors.text }]}>{report.lastSeenDate}</Text>
            <Text style={[styles.sectionText, { color: themeColors.text }]}>{report.lastSeenLocation}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={[styles.sectionText, { color: themeColors.text }]}>
              {report.description || "No description provided."}
            </Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <Text style={[styles.sectionText, { color: themeColors.text }]}>Name: {report.contactName || "N/A"}</Text>
            <Text style={[styles.sectionText, { color: themeColors.text }]}>Phone: {report.contactNumber || "N/A"}</Text>
            
            <TouchableOpacity
              style={styles.replyPrivatelyBtn}
              onPress={async () => {
                if (report.userId === auth.currentUser?.uid) {
                  Alert.alert(
                    "Cannot Message Yourself",
                    "You cannot send messages to yourself on your own post.",
                    [{ text: "OK" }]
                  );
                  return;
                }

                try {
                  const userDoc = await getDoc(doc(db, 'users', report.userId));
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    navigation.navigate('ChatScreen', {
                      user: {
                        id: report.userId,
                        fullname: userData.fullname || userData.fullName || 'User',
                        avatar: userData.avatar || null
                      },
                      reportId: report.id,
                      reportOwnerId: report.userId
                    });
                  } else {
                    Alert.alert("Error", "Could not find user information.");
                  }
                } catch (error) {
                  console.error('Error fetching user data:', error);
                  Alert.alert("Error", "Failed to load user information.");
                }
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="white" />
              <Text style={styles.replyPrivatelyText}>Reply Privately</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.footerText, { color: themeColors.subText }]}>
            Reported: {report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleString() : "N/A"}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.aiComparisonCta}
          onPress={handleAIClick}
        >
          <Ionicons name="analytics" size={24} color="white" />
          <View style={styles.ctaTextContainer}>
            <Text style={styles.ctaTitle}>AI Vision Analysis</Text>
            <Text style={styles.ctaSubtitle}>Google Vision • iOS Only • Face + Object matching</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>

        {user && report.userId === user.uid && (
          <View style={styles.deleteContainer}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.deleteText}>Delete Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {previewImage && (
        <Modal
          visible={!!previewImage}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewImage(null)}
        >
          <TouchableOpacity
            style={styles.imageModalCover}
            onPress={() => setPreviewImage(null)}
            activeOpacity={1}
          >
            <Image
              source={{ uri: previewImage }}
              style={styles.imageModal}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Modal>
      )}

      {/* ✅ Custom Android Alert Modal */}
      <CustomAlertModal
        visible={showAndroidAlert}
        onClose={() => setShowAndroidAlert(false)}
        isDark={isDark}
      />

      <ImageComparisonModal
        visible={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        referenceImage={report.photo}
        reportType={report.type}
        themeColors={themeColors}
      />
    </SafeAreaView>
  );
}

// Main Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: { padding: 4 },
  headerActions: { flexDirection: "row", alignItems: "center" },
  cameraButton: { padding: 8, marginRight: 8 },
  bookmarkButton: { padding: 8 },
  image: {
    width: "90%",
    height: 280,
    marginHorizontal: "5%",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    resizeMode: "cover",
  },
  noImage: {
    width: "100%",
    height: 260,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  noImageText: { marginTop: 6, color: "#999" },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: { fontSize: 22, fontWeight: "800", flex: 1 },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7CC242",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  savedBadgeText: { color: "white", fontSize: 12, fontWeight: "600", marginLeft: 4 },
  subText: { fontSize: 15, marginBottom: 12 },
  sectionContainer: { marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#7CC242", marginBottom: 6 },
  sectionText: { fontSize: 15, lineHeight: 22 },
  footerText: { fontSize: 12, marginTop: 12, textAlign: "right" },
  replyPrivatelyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7CC242",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 12,
    elevation: 2,
  },
  replyPrivatelyText: { color: "white", fontSize: 15, fontWeight: "600", marginLeft: 8 },
  aiComparisonCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7CC242",
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
  },
  ctaTextContainer: { flex: 1, marginLeft: 12 },
  ctaTitle: { color: "white", fontSize: 16, fontWeight: "bold" },
  ctaSubtitle: { color: "white", fontSize: 12, opacity: 0.9, marginTop: 2 },
  deleteContainer: { marginTop: 20, alignItems: "center", marginBottom: 40 },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E74C3C",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: "90%",
    elevation: 3,
  },
  deleteText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 8 },
  imageModalCover: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModal: { width: "90%", height: "90%", borderRadius: 12 },
});

// ✅ Custom Alert Styles
const customAlertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  featurePills: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7CC24210',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#7CC24230',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#7CC242',
    shadowColor: '#7CC242',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  footerText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});

// Comparison Modal Styles (keeping existing)
const comparisonStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#7CC24220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold',
  },
  modalSubtitle: { 
    fontSize: 11, 
    marginTop: 2,
  },
  closeButton: { 
    padding: 4,
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  imageBox: { 
    flex: 1, 
    alignItems: 'center',
  },
  imageLabel: { 
    fontSize: 12, 
    fontWeight: '600', 
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  comparisonImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#7CC242',
  },
  imageBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#7CC242',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  placeholderBox: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  placeholderText: { 
    fontSize: 11, 
    color: '#999', 
    marginTop: 8,
    fontWeight: '600',
  },
  vsContainer: { 
    width: 60, 
    alignItems: 'center',
    marginHorizontal: 8,
  },
  vsCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7CC242',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  vsText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7CC242',
  },
  analysisSection: {
    marginBottom: 20,
  },
  graphContainer: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 16,
  },
  graphOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    gap: 8,
  },
  graphText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  metricsContainer: {
    marginBottom: 16,
  },
  metricBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7CC24210',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  metricLabel: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7CC242',
  },
  stepsContainer: {
    gap: 8,
  },
  stepRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  stepIndicator: {
    marginRight: 10,
  },
  stepText: { 
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 20,
    elevation: 5,
  },
  compareBtnText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold',
  },
  resultContainer: { 
    alignItems: 'center',
    marginBottom: 20,
  },
  similarityBadge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 8,
  },
  similarityScore: { 
    fontSize: 42, 
    fontWeight: 'bold', 
    color: 'white',
    marginTop: 8,
  },
  similarityLabel: { 
    fontSize: 11, 
    color: 'white', 
    marginTop: 4,
    fontWeight: '600',
  },
  resultDetailsCard: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 16,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultActions: { 
    flexDirection: 'row', 
    gap: 12, 
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
  },
  primaryBtn: {
    backgroundColor: '#FF6B35',
  },
  secondaryBtn: {
    backgroundColor: '#7CC24220',
    borderWidth: 2,
    borderColor: '#7CC242',
  },
  actionBtnText: { 
    fontSize: 14, 
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    flex: 1,
  },
});
