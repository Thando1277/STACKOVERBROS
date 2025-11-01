// utils/NetworkDiagnostic.js - Tool to diagnose upload issues
import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from 'expo-file-system';

export class NetworkDiagnostic {
  static async runDiagnostics(photoUri = null) {
    const results = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    console.log("\n🔍 === NETWORK DIAGNOSTIC START ===\n");

    // Test 1: Network State
    try {
      const netState = await NetInfo.fetch();
      const test = {
        name: "Network Connectivity",
        status: netState.isConnected ? "PASS" : "FAIL",
        details: {
          isConnected: netState.isConnected,
          isInternetReachable: netState.isInternetReachable,
          type: netState.type,
          isWifiEnabled: netState.details?.isConnectionExpensive,
        },
      };
      results.tests.push(test);
      console.log(`✓ Network: ${test.status}`, test.details);
    } catch (error) {
      results.tests.push({
        name: "Network Connectivity",
        status: "ERROR",
        error: error.message,
      });
      console.error("✗ Network test failed:", error);
    }

    // Test 2: Internet Access (ping test)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("https://www.google.com", {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const test = {
        name: "Internet Access",
        status: response.ok ? "PASS" : "FAIL",
        details: {
          status: response.status,
          reachable: response.ok,
        },
      };
      results.tests.push(test);
      console.log(`✓ Internet: ${test.status}`);
    } catch (error) {
      results.tests.push({
        name: "Internet Access",
        status: "FAIL",
        error: error.message,
      });
      console.error("✗ Internet test failed:", error.message);
    }

    // Test 3: Cloudinary Reachability
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dpo2fiwoz/image/upload",
        {
          method: "OPTIONS",
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      const test = {
        name: "Cloudinary API Access",
        status: "PASS",
        details: {
          status: response.status,
          reachable: true,
        },
      };
      results.tests.push(test);
      console.log(`✓ Cloudinary: ${test.status}`);
    } catch (error) {
      results.tests.push({
        name: "Cloudinary API Access",
        status: "FAIL",
        error: error.message,
      });
      console.error("✗ Cloudinary test failed:", error.message);
    }

    // Test 4: Photo File Check (if URI provided)
    if (photoUri) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(photoUri);
        const test = {
          name: "Photo File Check",
          status: fileInfo.exists ? "PASS" : "FAIL",
          details: {
            exists: fileInfo.exists,
            uri: photoUri,
            size: fileInfo.size,
            isDirectory: fileInfo.isDirectory,
          },
        };
        results.tests.push(test);
        console.log(`✓ Photo File: ${test.status}`, test.details);

        // Test 4b: Read photo as base64
        if (fileInfo.exists) {
          try {
            const base64 = await FileSystem.readAsStringAsync(photoUri, {
              encoding: FileSystem.EncodingType.Base64,
              length: 100, // Just read first 100 bytes to test
            });
            results.tests.push({
              name: "Photo Read Test",
              status: "PASS",
              details: { readable: true, preview: base64.substring(0, 50) },
            });
            console.log("✓ Photo readable as base64");
          } catch (readError) {
            results.tests.push({
              name: "Photo Read Test",
              status: "FAIL",
              error: readError.message,
            });
            console.error("✗ Photo read failed:", readError.message);
          }
        }
      } catch (error) {
        results.tests.push({
          name: "Photo File Check",
          status: "ERROR",
          error: error.message,
        });
        console.error("✗ Photo file check failed:", error);
      }
    }

    // Test 5: Test Upload with Minimal Data
    try {
      const testData = new FormData();
      testData.append("upload_preset", "UserPosts");
      testData.append("file", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="); // 1x1 transparent PNG

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dpo2fiwoz/image/upload",
        {
          method: "POST",
          body: testData,
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      const json = await response.json();

      const test = {
        name: "Test Upload",
        status: json.secure_url ? "PASS" : "FAIL",
        details: {
          status: response.status,
          hasUrl: !!json.secure_url,
          url: json.secure_url?.substring(0, 50),
        },
      };
      results.tests.push(test);
      console.log(`✓ Test Upload: ${test.status}`);
    } catch (error) {
      results.tests.push({
        name: "Test Upload",
        status: "FAIL",
        error: error.message,
      });
      console.error("✗ Test upload failed:", error.message);
    }

    console.log("\n🔍 === DIAGNOSTIC COMPLETE ===\n");
    console.log("Summary:", {
      total: results.tests.length,
      passed: results.tests.filter(t => t.status === "PASS").length,
      failed: results.tests.filter(t => t.status === "FAIL").length,
      errors: results.tests.filter(t => t.status === "ERROR").length,
    });

    return results;
  }

  static async testPhotoUpload(photoUri) {
    console.log("\n📸 === TESTING PHOTO UPLOAD ===\n");

    try {
      // Run diagnostics first
      const diagnostics = await this.runDiagnostics(photoUri);
      
      // Check if all prerequisite tests passed
      const criticalTests = ["Network Connectivity", "Internet Access", "Cloudinary API Access"];
      const allCriticalPass = diagnostics.tests
        .filter(t => criticalTests.includes(t.name))
        .every(t => t.status === "PASS");

      if (!allCriticalPass) {
        return {
          success: false,
          error: "Prerequisites failed. Check network connectivity.",
          diagnostics,
        };
      }

      // Attempt actual upload
      console.log("📤 Attempting real photo upload...");

      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const formData = new FormData();
      formData.append("file", `data:image/jpeg;base64,${base64}`);
      formData.append("upload_preset", "UserPosts");
      formData.append("folder", "diagnostic_test");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dpo2fiwoz/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", errorText);
        return {
          success: false,
          error: `Upload failed: ${response.status}`,
          response: errorText,
          diagnostics,
        };
      }

      const json = await response.json();

      if (!json.secure_url) {
        return {
          success: false,
          error: "No URL in response",
          response: json,
          diagnostics,
        };
      }

      console.log("✅ Upload successful!");
      return {
        success: true,
        url: json.secure_url,
        diagnostics,
      };
    } catch (error) {
      console.error("❌ Upload test failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static printResults(results) {
    console.log("\n📊 === DIAGNOSTIC REPORT ===");
    console.log("Timestamp:", results.timestamp);
    console.log("\nTests:");
    results.tests.forEach((test, index) => {
      const icon = test.status === "PASS" ? "✅" : test.status === "FAIL" ? "❌" : "⚠️";
      console.log(`${index + 1}. ${icon} ${test.name}: ${test.status}`);
      if (test.details) {
        console.log("   Details:", test.details);
      }
      if (test.error) {
        console.log("   Error:", test.error);
      }
    });
    console.log("========================\n");
  }
}