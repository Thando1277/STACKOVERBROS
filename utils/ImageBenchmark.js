// utils/ImageBenchmark.js
// React Native Image Comparison Performance Benchmark
// Uses Google Cloud Vision API for ~95% accuracy

import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

class ImageBenchmark {
  constructor(similarityThreshold = 75.0, apiUrl = 'http://127.0.0.1:5000/compare') {
    this.threshold = similarityThreshold;
    this.apiUrl = apiUrl;
    this.results = [];
    this.isRunning = false;
  }

  // Use real Google Cloud Vision API
  async compareImagesVisionAPI(img1Uri, img2Uri) {
    const startTime = Date.now();

    try {
      // Convert images to base64
      const img1Base64 = await FileSystem.readAsStringAsync(img1Uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const img2Base64 = await FileSystem.readAsStringAsync(img2Uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('Calling Vision API...');

      // Call Flask API
      const response = await fetch(`${this.apiUrl}/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image1: img1Base64,
          image2: img2Base64,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      console.log('Vision API Response:', data);

      return {
        similarity: data.similarity,
        processingTime,
        labels1: data.labels1 || [],
        labels2: data.labels2 || [],
      };
    } catch (error) {
      console.error('Vision API error:', error);
      throw error;
    }
  }

  getConfidenceLevel(similarity) {
    if (similarity >= 85) return 'very-high';
    if (similarity >= 75) return 'high';
    if (similarity >= 60) return 'medium';
    if (similarity >= 40) return 'low';
    return 'very-low';
  }

  // Run single benchmark test
  async runSingleTest(testId, img1Uri, img2Uri, groundTruth, metadata = {}) {
    try {
      const result = await this.compareImagesVisionAPI(img1Uri, img2Uri);
      
      const similarity = result.similarity;
      const predictedMatch = similarity >= this.threshold;
      const correct = predictedMatch === groundTruth;

      const benchmarkResult = {
        testId,
        imagePair: [img1Uri, img2Uri],
        groundTruth,
        predictedSimilarity: similarity,
        predictedMatch,
        processingTimeMs: result.processingTime,
        confidenceLevel: this.getConfidenceLevel(similarity),
        correctPrediction: correct,
        timestamp: new Date().toISOString(),
        metadata,
        labels1: result.labels1,
        labels2: result.labels2,
      };

      this.results.push(benchmarkResult);
      return benchmarkResult;
    } catch (error) {
      console.error(`Test ${testId} failed:`, error);
      throw error;
    }
  }

  // Run full benchmark suite
  async runBenchmarkSuite(testCases, onProgress) {
    this.isRunning = true;
    this.results = [];

    console.log(`Starting benchmark suite with ${testCases.length} test cases...`);
    console.log(`Similarity threshold: ${this.threshold}%\n`);

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      try {
        const result = await this.runSingleTest(
          testCase.testId,
          testCase.img1Uri,
          testCase.img2Uri,
          testCase.groundTruth,
          testCase.metadata
        );

        const progress = ((i + 1) / testCases.length) * 100;
        const status = result.correctPrediction ? '✓' : '✗';
        
        console.log(
          `Test ${i + 1}/${testCases.length}: ${testCase.testId} ${status} ` +
          `(${result.predictedSimilarity}%, ${result.processingTimeMs}ms)`
        );

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: testCases.length,
            progress,
            result,
          });
        }
      } catch (error) {
        console.error(`Test ${i + 1} error:`, error);
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: testCases.length,
            progress: ((i + 1) / testCases.length) * 100,
            error: error.message,
          });
        }
      }
    }

    this.isRunning = false;
    return this.calculateMetrics();
  }

  // Calculate comprehensive metrics
  calculateMetrics() {
    if (this.results.length === 0) {
      throw new Error('No results to calculate metrics from');
    }

    const yTrue = this.results.map(r => r.groundTruth);
    const yPred = this.results.map(r => r.predictedMatch);
    const processingTimes = this.results.map(r => r.processingTimeMs);

    // Calculate confusion matrix
    let tp = 0, tn = 0, fp = 0, fn = 0;
    for (let i = 0; i < yTrue.length; i++) {
      if (yTrue[i] && yPred[i]) tp++;
      else if (!yTrue[i] && !yPred[i]) tn++;
      else if (!yTrue[i] && yPred[i]) fp++;
      else if (yTrue[i] && !yPred[i]) fn++;
    }

    // Calculate metrics
    const accuracy = ((tp + tn) / this.results.length) * 100;
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    const fpr = fp / (fp + tn) || 0;
    const fnr = fn / (fn + tp) || 0;

    // Processing time metrics
    const sortedTimes = [...processingTimes].sort((a, b) => a - b);
    const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
    const p95Time = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99Time = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

    // Confidence distribution
    const confidenceDist = {};
    this.results.forEach(r => {
      confidenceDist[r.confidenceLevel] = (confidenceDist[r.confidenceLevel] || 0) + 1;
    });

    const metrics = {
      totalTests: this.results.length,
      accuracy: Math.round(accuracy * 100) / 100,
      precision: Math.round(precision * 10000) / 100,
      recall: Math.round(recall * 10000) / 100,
      f1Score: Math.round(f1Score * 10000) / 100,
      falsePositiveRate: Math.round(fpr * 10000) / 100,
      falseNegativeRate: Math.round(fnr * 10000) / 100,
      avgProcessingTimeMs: Math.round(avgTime * 100) / 100,
      medianProcessingTimeMs: Math.round(medianTime * 100) / 100,
      p95ProcessingTimeMs: Math.round(p95Time * 100) / 100,
      p99ProcessingTimeMs: Math.round(p99Time * 100) / 100,
      confidenceDistribution: confidenceDist,
      confusionMatrix: [[tn, fp], [fn, tp]],
      meetsAccuracyTarget: accuracy >= 95.0,
      meetsPerformanceTarget: medianTime <= 2000.0,
      targetAccuracy: 95.0,
      targetProcessingTime: 2000.0,
    };

    return metrics;
  }

  // Export results
  async exportResults(filename = 'benchmark_results.json') {
    const data = {
      benchmarkConfig: {
        threshold: this.threshold,
        apiUrl: this.apiUrl,
        timestamp: new Date().toISOString(),
      },
      results: this.results,
      metrics: this.calculateMetrics(),
    };

    try {
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));
      console.log(`Results exported to ${fileUri}`);
      return fileUri;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }
}

export default ImageBenchmark;