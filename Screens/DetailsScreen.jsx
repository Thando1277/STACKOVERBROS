import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, SafeAreaView, Modal,
  TextInput, Platform
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { doc, getDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth, storage } from "../Firebase/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import ImageBenchmark from '../utils/ImageBenchmark';

// REPLACE THIS WITH YOUR COMPUTER'S LOCAL IP ADDRESS
const API_URL = 'http://10.250.152.87:5000';

// Image Upload Modal Component
function ImageUploadModal({ 
  visible, 
  onClose, 
  onImageUpload,
  themeColors 
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDescription, setImageDescription] = useState('');

  const pickImage = async (source) => {
    try {
      let result;
      
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permission required", "Camera access is needed.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permission required", "Photo library access is needed.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8
        });
      }

      if (!result.canceled && result.assets[0]) {
        // Compress and resize image
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        setSelectedImage(manipulatedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const filename = `upload_${Date.now()}.jpg`;
      const storageRef = ref(storage, `uploads/${filename}`);
      
      // Convert URI to blob
      const response = await fetch(selectedImage);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const snapshot = await uploadBytes(storageRef, blob);
      
      // Simulate progress (Firebase doesn't provide real progress for small files)
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Call callback with uploaded image info
      onImageUpload({
        uri: downloadURL,
        localUri: selectedImage,
        description: imageDescription,
        filename: filename,
        timestamp: new Date().toISOString()
      });

      Alert.alert("Success", "Image uploaded successfully!");
      resetModal();
      onClose();

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert("Upload Failed", "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setSelectedImage(null);
    setImageDescription('');
    setUploadProgress(0);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={uploadStyles.modalContainer}>
        <View style={[uploadStyles.modalContent, { backgroundColor: themeColors.cardBg }]}>
          <View style={uploadStyles.modalHeader}>
            <Text style={[uploadStyles.modalTitle, { color: themeColors.text }]}>
              Upload Image
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={uploadStyles.scrollContent}>
            {/* Image Preview */}
            {selectedImage ? (
              <View style={uploadStyles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={uploadStyles.imagePreview} />
                <TouchableOpacity 
                  style={uploadStyles.changeImageBtn}
                  onPress={() => setSelectedImage(null)}
                >
                  <Text style={uploadStyles.changeImageText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={uploadStyles.imageSelection}>
                <Text style={[uploadStyles.sectionTitle, { color: themeColors.text }]}>
                  Select Image Source
                </Text>
                <View style={uploadStyles.sourceButtons}>
                  <TouchableOpacity 
                    style={[uploadStyles.sourceBtn, { backgroundColor: themeColors.primary }]}
                    onPress={() => pickImage('camera')}
                  >
                    <Ionicons name="camera" size={24} color="white" />
                    <Text style={uploadStyles.sourceBtnText}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[uploadStyles.sourceBtn, { backgroundColor: themeColors.primary }]}
                    onPress={() => pickImage('library')}
                  >
                    <Ionicons name="images" size={24} color="white" />
                    <Text style={uploadStyles.sourceBtnText}>Choose from Library</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Description Input */}
            {selectedImage && (
              <View style={uploadStyles.descriptionContainer}>
                <Text style={[uploadStyles.sectionTitle, { color: themeColors.text }]}>
                  Image Description (Optional)
                </Text>
                <TextInput
                  style={[uploadStyles.textInput, { 
                    backgroundColor: themeColors.bg, 
                    color: themeColors.text,
                    borderColor: themeColors.border
                  }]}
                  placeholder="Describe this image..."
                  placeholderTextColor={themeColors.subText}
                  value={imageDescription}
                  onChangeText={setImageDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            {/* Upload Progress */}
            {uploading && (
              <View style={uploadStyles.progressContainer}>
                <Text style={[uploadStyles.progressText, { color: themeColors.text }]}>
                  Uploading... {uploadProgress}%
                </Text>
                <View style={[uploadStyles.progressBar, { backgroundColor: themeColors.border }]}>
                  <View 
                    style={[
                      uploadStyles.progressFill, 
                      { 
                        width: `${uploadProgress}%`,
                        backgroundColor: themeColors.primary
                      }
                    ]} 
                  />
                </View>
              </View>
            )}

            {/* Action Buttons */}
            {selectedImage && !uploading && (
              <View style={uploadStyles.actionButtons}>
                <TouchableOpacity 
                  style={[uploadStyles.cancelBtn, { borderColor: themeColors.border }]}
                  onPress={() => setSelectedImage(null)}
                >
                  <Text style={[uploadStyles.cancelBtnText, { color: themeColors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[uploadStyles.uploadBtn, { backgroundColor: themeColors.primary }]}
                  onPress={uploadImage}
                >
                  <Ionicons name="cloud-upload" size={20} color="white" />
                  <Text style={uploadStyles.uploadBtnText}>Upload Image</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Advanced Image Comparison Modal Component
function ImageComparisonModal({ 
  visible, 
  onClose, 
  referenceImage, 
  reportType, 
  themeColors,
  userImages = [] // Add user images for comparison
}) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState(null);
  const [analysisSteps, setAnalysisSteps] = useState([]);
  const [selectedUserImage, setSelectedUserImage] = useState(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Camera access is needed.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8
    });
    if (!res.canceled && res.assets[0]) {
      setCapturedImage(res.assets[0].uri);
      setSelectedUserImage(null);
      setResult(null);
      setAnalysisSteps([]);
    }
  };

  const selectFromUploads = (image) => {
    setSelectedUserImage(image);
    setCapturedImage(image.uri);
    setResult(null);
    setAnalysisSteps([]);
    setShowImagePicker(false);
  };

  const compareImages = async () => {
    if (!capturedImage || !referenceImage) {
      Alert.alert("Error", "Both images required for comparison.");
      return;
    }

    setComparing(true);
    setResult(null);
    setAnalysisSteps([]);

    const steps = [
      "🔍 Loading and preprocessing images...",
      "📐 Analyzing structural features...",
      "🎨 Comparing color distributions...",
      "👤 Detecting facial/feature patterns...",
      "📊 Calculating similarity metrics...",
      "✅ Finalizing analysis..."
    ];

    // Show analysis steps
    for (let i = 0; i < steps.length; i++) {
      setAnalysisSteps(steps.slice(0, i + 1));
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      // Convert images to base64
      const img1Base64 = await FileSystem.readAsStringAsync(referenceImage, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const img2Base64 = await FileSystem.readAsStringAsync(capturedImage, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('Calling Vision API...');

      // Call Flask API with advanced comparison
      const response = await fetch(`${API_URL}/compare-advanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image1: img1Base64,
          image2: img2Base64,
          report_type: reportType,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Vision API Response:', data);

      setResult({
        similarity: data.similarity,
        match: data.match,
        confidence: data.confidence_level,
        message: data.message,
        processingTime: data.processing_time_ms,
        analysisFactors: data.analysis_factors
      });

    } catch (error) {
      console.error('Comparison error:', error);
      Alert.alert('Error', `Failed to compare images: ${error.message}\n\nMake sure your Flask server is running!`);
      setResult({
        similarity: 0,
        match: false,
        confidence: 'error',
        message: 'Analysis failed. Please check your connection and try again.'
      });
    } finally {
      setComparing(false);
    }
  };

  const resetComparison = () => {
    setCapturedImage(null);
    setSelectedUserImage(null);
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
      <View style={comparisonStyles.modalContainer}>
        <View style={[comparisonStyles.modalContent, { backgroundColor: themeColors.cardBg }]}>
          <View style={comparisonStyles.modalHeader}>
            <View>
              <Text style={[comparisonStyles.modalTitle, { color: themeColors.text }]}>
                Google Vision Analysis
              </Text>
              <Text style={[comparisonStyles.modalSubtitle, { color: themeColors.subText }]}>
                ~95% accuracy • Multi-factor comparison
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={comparisonStyles.closeButton}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <View style={comparisonStyles.comparisonContainer}>
            <View style={comparisonStyles.imageBox}>
              <Text style={[comparisonStyles.imageLabel, { color: themeColors.text }]}>Reference</Text>
              {referenceImage ? (
                <Image source={{ uri: referenceImage }} style={comparisonStyles.comparisonImage} />
              ) : (
                <View style={[comparisonStyles.placeholderBox, { borderColor: themeColors.border }]}>
                  <Ionicons name="image-outline" size={40} color="#999" />
                </View>
              )}
              <Text style={[comparisonStyles.imageType, { color: themeColors.subText }]}>{reportType}</Text>
            </View>

            <View style={comparisonStyles.vsContainer}>
              <View style={[comparisonStyles.vsCircle, { backgroundColor: themeColors.primary }]}>
                <Ionicons name="scan" size={20} color="white" />
              </View>
            </View>

            <View style={comparisonStyles.imageBox}>
              <Text style={[comparisonStyles.imageLabel, { color: themeColors.text }]}>Your Photo</Text>
              {capturedImage ? (
                <Image source={{ uri: capturedImage }} style={comparisonStyles.comparisonImage} />
              ) : (
                <View style={comparisonStyles.imageSelectionOptions}>
                  <TouchableOpacity 
                    onPress={pickImage} 
                    style={[comparisonStyles.placeholderBox, { borderColor: themeColors.border }]}
                  >
                    <Ionicons name="camera-outline" size={40} color="#999" />
                    <Text style={comparisonStyles.placeholderText}>Take Photo</Text>
                  </TouchableOpacity>
                  
                  {userImages.length > 0 && (
                    <TouchableOpacity 
                      onPress={() => setShowImagePicker(true)}
                      style={[comparisonStyles.placeholderBox, { borderColor: themeColors.border, marginTop: 10 }]}
                    >
                      <Ionicons name="folder-open" size={40} color="#999" />
                      <Text style={comparisonStyles.placeholderText}>Choose from Uploads</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <Text style={[comparisonStyles.imageType, { color: themeColors.subText }]}>
                {selectedUserImage ? 'Uploaded Image' : 'Current'}
              </Text>
            </View>
          </View>

          {/* User Images Picker Modal */}
          {showImagePicker && (
            <Modal visible={true} animationType="slide" transparent={true}>
              <View style={comparisonStyles.modalContainer}>
                <View style={[comparisonStyles.modalContent, { backgroundColor: themeColors.cardBg }]}>
                  <View style={comparisonStyles.modalHeader}>
                    <Text style={[comparisonStyles.modalTitle, { color: themeColors.text }]}>
                      Select Uploaded Image
                    </Text>
                    <TouchableOpacity onPress={() => setShowImagePicker(false)}>
                      <Ionicons name="close" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={{ maxHeight: 300 }}>
                    {userImages.map((image, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[comparisonStyles.userImageItem, { borderColor: themeColors.border }]}
                        onPress={() => selectFromUploads(image)}
                      >
                        <Image source={{ uri: image.uri }} style={comparisonStyles.userImageThumb} />
                        <View style={comparisonStyles.userImageInfo}>
                          <Text style={[comparisonStyles.userImageName, { color: themeColors.text }]}>
                            {image.filename || `Image ${index + 1}`}
                          </Text>
                          {image.description && (
                            <Text style={[comparisonStyles.userImageDesc, { color: themeColors.subText }]}>
                              {image.description}
                            </Text>
                          )}
                          <Text style={[comparisonStyles.userImageDate, { color: themeColors.subText }]}>
                            {new Date(image.timestamp).toLocaleDateString()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  {userImages.length === 0 && (
                    <Text style={[comparisonStyles.noImagesText, { color: themeColors.subText }]}>
                      No uploaded images found
                    </Text>
                  )}
                </View>
              </View>
            </Modal>
          )}

          {/* Analysis Steps */}
          {comparing && analysisSteps.length > 0 && (
            <View style={comparisonStyles.analysisContainer}>
              <Text style={[comparisonStyles.analysisTitle, { color: themeColors.text }]}>
                Analysis Progress
              </Text>
              {analysisSteps.map((step, index) => (
                <View key={index} style={comparisonStyles.stepRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#7CC242" style={comparisonStyles.stepIcon} />
                  <Text style={[comparisonStyles.stepText, { color: themeColors.text }]}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          {!result && !comparing && (
            <View style={comparisonStyles.actionButtons}>
              {!capturedImage ? (
                <View style={comparisonStyles.initialActions}>
                  <TouchableOpacity 
                    style={[comparisonStyles.actionBtn, { backgroundColor: themeColors.primary }]}
                    onPress={pickImage}
                  >
                    <Ionicons name="camera" size={20} color="white" />
                    <Text style={comparisonStyles.actionBtnText}>Take Photo</Text>
                  </TouchableOpacity>
                  
                  {userImages.length > 0 && (
                    <TouchableOpacity 
                      style={[comparisonStyles.actionBtn, { backgroundColor: themeColors.primary }]}
                      onPress={() => setShowImagePicker(true)}
                    >
                      <Ionicons name="folder-open" size={20} color="white" />
                      <Text style={comparisonStyles.actionBtnText}>Use Uploaded Image</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity 
                  style={[comparisonStyles.compareBtn, { backgroundColor: '#FF6B35' }]}
                  onPress={compareImages}
                >
                  <Ionicons name="analytics" size={20} color="white" />
                  <Text style={comparisonStyles.compareBtnText}>Start Vision Analysis</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Results Display */}
          {result && (
            <View style={comparisonStyles.resultContainer}>
              <View style={[
                comparisonStyles.similarityBadge,
                { backgroundColor: result.similarity >= 75 ? '#7CC242' : result.similarity >= 50 ? '#FF9800' : '#E74C3C' }
              ]}>
                <Text style={comparisonStyles.similarityScore}>{result.similarity}%</Text>
                <Text style={comparisonStyles.similarityLabel}>Vision API Score</Text>
              </View>

              <View style={[comparisonStyles.matchIndicator, { 
                backgroundColor: result.similarity >= 75 ? '#7CC24220' : result.similarity >= 50 ? '#FF980020' : '#E74C3C20'
              }]}>
                <Ionicons 
                  name={result.similarity >= 75 ? "checkmark-circle" : result.similarity >= 50 ? "help-circle" : "close-circle"} 
                  size={40} 
                  color={result.similarity >= 75 ? '#7CC242' : result.similarity >= 50 ? '#FF9800' : '#E74C3C'}
                />
                <View>
                  <Text style={[comparisonStyles.matchText, { 
                    color: result.similarity >= 75 ? '#7CC242' : result.similarity >= 50 ? '#FF9800' : '#E74C3C'
                  }]}>
                    {result.similarity >= 75 ? "Strong Match!" : result.similarity >= 50 ? "Possible Match" : "No Match"}
                  </Text>
                  <Text style={[comparisonStyles.confidenceText, { color: themeColors.subText }]}>
                    Confidence: {result.confidence.replace('-', ' ')}
                  </Text>
                </View>
              </View>

              <Text style={[comparisonStyles.resultMessage, { color: themeColors.text }]}>
                {result.message}
              </Text>

              {result.processingTime && (
                <Text style={[comparisonStyles.processingTime, { color: themeColors.subText }]}>
                  ⏱️ Processed in {Math.round(result.processingTime)}ms
                </Text>
              )}

              <View style={comparisonStyles.resultActions}>
                <TouchableOpacity 
                  style={[comparisonStyles.resultActionBtn, { backgroundColor: themeColors.border }]}
                  onPress={resetComparison}
                >
                  <Ionicons name="refresh" size={18} color={themeColors.text} />
                  <Text style={[comparisonStyles.resultActionText, { color: themeColors.text }]}>New Comparison</Text>
                </TouchableOpacity>

                {result.similarity >= 70 && (
                  <TouchableOpacity 
                    style={[comparisonStyles.resultActionBtn, { backgroundColor: '#FF6B35' }]}
                    onPress={handleReportMatch}
                  >
                    <Ionicons name="flag" size={18} color="white" />
                    <Text style={comparisonStyles.resultActionText}>Report Match</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <Text style={[comparisonStyles.disclaimer, { color: themeColors.subText }]}>
            🔍 Google Cloud Vision API • Real-time analysis • Always verify in person
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// Benchmark Modal Component
function BenchmarkModal({ visible, onClose, themeColors }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [testLog, setTestLog] = useState([]);

  const runBenchmark = async () => {
    setRunning(true);
    setProgress(0);
    setMetrics(null);
    setTestLog([]);

    const benchmark = new ImageBenchmark(75.0, API_URL);
    
    // Example test cases - YOU NEED TO REPLACE WITH REAL TEST IMAGES
    const testCases = [
      {
        testId: 'test_same_01',
        img1Uri: 'file://path/to/test/image1.jpg', // Replace with actual URIs
        img2Uri: 'file://path/to/test/image2.jpg',
        groundTruth: true, // Same entity
        metadata: { category: 'person' }
      },
      {
        testId: 'test_different_01',
        img1Uri: 'file://path/to/test/image3.jpg',
        img2Uri: 'file://path/to/test/image4.jpg',
        groundTruth: false, // Different entity
        metadata: { category: 'person' }
      },
      // Add more test cases...
    ];

    try {
      const results = await benchmark.runBenchmarkSuite(testCases, (progressData) => {
        setProgress(progressData.progress);
        setCurrentTest(`Test ${progressData.current}/${progressData.total}`);
        
        if (progressData.result) {
          setTestLog(prev => [...prev, 
            `${progressData.result.correctPrediction ? '✓' : '✗'} ${progressData.result.testId}: ${progressData.result.predictedSimilarity}%`
          ]);
        }
      });

      setMetrics(results);
      Alert.alert('Benchmark Complete!', `Accuracy: ${results.accuracy}%`);
    } catch (error) {
      Alert.alert('Error', `Benchmark failed: ${error.message}\n\nMake sure Flask server is running on ${API_URL}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={[comparisonStyles.modalContainer, { padding: 20 }]}>
        <ScrollView>
          <View style={[comparisonStyles.modalContent, { backgroundColor: themeColors.cardBg }]}>
            <View style={comparisonStyles.modalHeader}>
              <Text style={[comparisonStyles.modalTitle, { color: themeColors.text }]}>
                Performance Benchmark
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {!running && !metrics && (
              <View>
                <Text style={{ color: themeColors.text, marginBottom: 20, lineHeight: 22 }}>
                  Run benchmark to test image comparison accuracy against Google Cloud Vision API standards (~95% target accuracy).
                </Text>
                <TouchableOpacity 
                  style={[comparisonStyles.compareBtn, { backgroundColor: '#FF6B35' }]}
                  onPress={runBenchmark}
                >
                  <Ionicons name="speedometer" size={20} color="white" />
                  <Text style={comparisonStyles.compareBtnText}>Start Benchmark</Text>
                </TouchableOpacity>
              </View>
            )}

            {running && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color="#7CC242" />
                <Text style={{ color: themeColors.text, marginTop: 20, fontSize: 16 }}>
                  {currentTest}
                </Text>
                <Text style={{ color: themeColors.subText, marginTop: 10 }}>
                  {Math.round(progress)}% Complete
                </Text>
                
                <ScrollView style={{ maxHeight: 200, width: '100%', marginTop: 20 }}>
                  {testLog.map((log, i) => (
                    <Text key={i} style={{ color: themeColors.text, fontSize: 12, marginVertical: 2 }}>
                      {log}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            )}

            {metrics && (
              <View style={{ padding: 10 }}>
                <Text style={{ color: themeColors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
                  Benchmark Results
                </Text>
                
                <View style={{ 
                  backgroundColor: metrics.meetsAccuracyTarget ? '#7CC24220' : '#FF980020', 
                  padding: 15, 
                  borderRadius: 10, 
                  marginBottom: 15 
                }}>
                  <Text style={{ 
                    fontSize: 32, 
                    fontWeight: 'bold', 
                    color: metrics.meetsAccuracyTarget ? '#7CC242' : '#FF9800' 
                  }}>
                    {metrics.accuracy}%
                  </Text>
                  <Text style={{ color: themeColors.text, fontSize: 16 }}>
                    Accuracy {metrics.meetsAccuracyTarget ? '✅' : '❌'} (Target: 95%)
                  </Text>
                </View>

                <View style={{ backgroundColor: themeColors.border + '30', padding: 12, borderRadius: 8 }}>
                  <Text style={{ color: themeColors.text, marginVertical: 3, fontSize: 14 }}>
                    • Precision: {metrics.precision}%
                  </Text>
                  <Text style={{ color: themeColors.text, marginVertical: 3, fontSize: 14 }}>
                    • Recall: {metrics.recall}%
                  </Text>
                  <Text style={{ color: themeColors.text, marginVertical: 3, fontSize: 14 }}>
                    • F1 Score: {metrics.f1Score}%
                  </Text>
                  <Text style={{ color: themeColors.text, marginVertical: 3, fontSize: 14 }}>
                    • Avg Processing: {metrics.avgProcessingTimeMs}ms
                  </Text>
                  <Text style={{ color: themeColors.text, marginVertical: 3, fontSize: 14 }}>
                    • False Positives: {metrics.falsePositiveRate}%
                  </Text>
                  <Text style={{ color: themeColors.text, marginVertical: 3, fontSize: 14 }}>
                    • False Negatives: {metrics.falseNegativeRate}%
                  </Text>
                  <Text style={{ color: themeColors.text, marginVertical: 3, fontSize: 14 }}>
                    • Total Tests: {metrics.totalTests}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
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
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [userImages, setUserImages] = useState([]); // Store user uploaded images

  const { report: reportProp, reportId } = route.params;

  const themeColors = {
    bg: isDark ? "#1E1E1E" : "#fff",
    text: isDark ? "#E0E0E0" : "#222",
    subText: isDark ? "#aaa" : "#555",
    section: "#7CC242",
    textLight: isDark ? "#ccc" : "#333",
    small: isDark ? "#777" : "#999",
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

  // Load user uploaded images (you might want to store these in Firestore)
  useEffect(() => {
    // For now, we'll use local state. You can implement Firestore storage for user images
    const loadUserImages = async () => {
      // This is where you would load user's previously uploaded images from Firestore
      // For now, we'll just use the local state
    };
    
    loadUserImages();
  }, []);

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

  const handleImageUpload = (uploadedImage) => {
    // Add the uploaded image to user images list
    setUserImages(prev => [...prev, uploadedImage]);
    // You might want to save this to Firestore here
    console.log('Image uploaded:', uploadedImage);
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
              onPress={() => setShowUploadModal(true)}
              style={styles.cameraButton}
            >
              <Ionicons name="cloud-upload" size={22} color="#7CC242" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowComparisonModal(true)}
              style={styles.cameraButton}
            >
              <Ionicons name="camera" size={22} color="#7CC242" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowBenchmarkModal(true)}
              style={styles.cameraButton}
            >
              <Ionicons name="speedometer" size={22} color="#7CC242" />
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
            <Text style={[styles.sectionText, { color: themeColors.textLight }]}>{report.lastSeenDate}</Text>
            <Text style={[styles.sectionText, { color: themeColors.textLight }]}>{report.lastSeenLocation}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={[styles.sectionText, { color: themeColors.textLight }]}>
              {report.description || "No description provided."}
            </Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <Text style={[styles.sectionText, { color: themeColors.textLight }]}>Name: {report.contactName || "N/A"}</Text>
            <Text style={[styles.sectionText, { color: themeColors.textLight }]}>Phone: {report.contactNumber || "N/A"}</Text>
            <TouchableOpacity
              style={styles.replyPrivatelyBtn}
              onPress={async () => {
                try {
                  const userDoc = await getDoc(doc(db, 'users', report.userId));
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    navigation.navigate('ChatScreen', {
                      user: {
                        id: report.userId,
                        fullname: userData.fullname,
                        avatar: userData.avatar || null
                      }
                    });
                  }
                } catch (error) {
                  console.error('Error fetching user data:', error);
                }
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="white" />
              <Text style={styles.replyPrivatelyText}>Reply Privately</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.footerText, { color: themeColors.small }]}>
            Reported: {report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleString() : "N/A"}
          </Text>
        </View>

        {/* Uploaded Images Section */}
        {userImages.length > 0 && (
          <View style={[styles.card, { backgroundColor: themeColors.cardBg, marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Your Uploaded Images</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {userImages.map((image, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.uploadedImageItem}
                  onPress={() => setPreviewImage(image.uri)}
                >
                  <Image source={{ uri: image.uri }} style={styles.uploadedImageThumb} />
                  {image.description && (
                    <Text style={[styles.uploadedImageDesc, { color: themeColors.subText }]} numberOfLines={2}>
                      {image.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity 
          style={styles.aiComparisonCta}
          onPress={() => setShowComparisonModal(true)}
        >
          <Ionicons name="analytics" size={24} color="white" />
          <View style={styles.ctaTextContainer}>
            <Text style={styles.ctaTitle}>Google Vision Analysis</Text>
            <Text style={styles.ctaSubtitle}>~95% accuracy • Multi-factor comparison</Text>
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

      <ImageUploadModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onImageUpload={handleImageUpload}
        themeColors={themeColors}
      />

      <ImageComparisonModal
        visible={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        referenceImage={report.photo}
        reportType={report.type}
        themeColors={themeColors}
        userImages={userImages}
      />

      <BenchmarkModal
        visible={showBenchmarkModal}
        onClose={() => setShowBenchmarkModal(false)}
        themeColors={themeColors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FB" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    elevation: 2,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
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
    backgroundColor: "#fff",
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
  name: { fontSize: 22, fontWeight: "800", color: "#222", flex: 1 },
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
  subText: { fontSize: 15, color: "#555", marginBottom: 12 },
  sectionContainer: { marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#7CC242", marginBottom: 6 },
  sectionText: { fontSize: 15, color: "#333", lineHeight: 22 },
  footerText: { fontSize: 12, color: "#999", marginTop: 12, textAlign: "right" },
  replyPrivatelyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7CC242",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  replyPrivatelyText: { color: "white", fontSize: 14, fontWeight: "600", marginLeft: 6 },
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
  // Uploaded images styles
  uploadedImageItem: {
    marginRight: 12,
    alignItems: 'center',
  },
  uploadedImageThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  uploadedImageDesc: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 80,
  },
});

const comparisonStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalSubtitle: { fontSize: 12, marginTop: 4 },
  closeButton: { padding: 4 },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  imageBox: { flex: 1, alignItems: 'center' },
  imageLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  imageType: { fontSize: 10, marginTop: 6, fontWeight: '500' },
  comparisonImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7CC242',
  },
  placeholderBox: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  placeholderText: { fontSize: 11, color: '#999', marginTop: 8, textAlign: 'center' },
  imageSelectionOptions: {
    alignItems: 'center',
  },
  vsContainer: { width: 50, alignItems: 'center', justifyContent: 'center' },
  vsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  analysisTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  stepIcon: { marginRight: 8 },
  stepText: { fontSize: 12 },
  actionButtons: { marginBottom: 16 },
  initialActions: {
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  compareBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  resultContainer: { alignItems: 'center', marginVertical: 16 },
  similarityBadge: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    minWidth: 140,
  },
  similarityScore: { fontSize: 36, fontWeight: 'bold', color: 'white' },
  similarityLabel: { fontSize: 12, color: 'white', marginTop: 4, fontWeight: '600' },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    width: '100%',
  },
  matchText: { fontSize: 18, fontWeight: 'bold' },
  confidenceText: { fontSize: 12, marginTop: 2 },
  resultMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  processingTime: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  resultActions: { flexDirection: 'row', gap: 10, width: '100%' },
  resultActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  resultActionText: { fontSize: 13, fontWeight: '600', color: 'white' },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  // User images picker styles
  userImageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  userImageThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  userImageInfo: {
    flex: 1,
  },
  userImageName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  userImageDesc: {
    fontSize: 12,
    marginBottom: 2,
  },
  userImageDate: {
    fontSize: 10,
  },
  noImagesText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
});

const uploadStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  scrollContent: {
    flexGrow: 1,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeImageBtn: {
    padding: 8,
  },
  changeImageText: {
    color: '#7CC242',
    fontSize: 14,
    fontWeight: '600',
  },
  imageSelection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sourceButtons: {
    gap: 12,
  },
  sourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  sourceBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  uploadBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  uploadBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});