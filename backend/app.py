from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import numpy as np
import cv2
import base64
from datetime import datetime
from PIL import Image
import io
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing import image as keras_image
from scipy.spatial.distance import cosine

app = Flask(__name__)

# Enable CORS for React Native
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Load pre-trained model for general object/animal comparison
print("📦 Loading MobileNetV2 model for object/animal recognition...")
feature_extractor = MobileNetV2(weights='imagenet', include_top=False, pooling='avg')
print("✓ Model loaded successfully")

def extract_features(img_array):
    """Extract features from image using MobileNetV2"""
    # Resize image to 224x224 (MobileNetV2 input size)
    img_resized = cv2.resize(img_array, (224, 224))
    # Convert BGR to RGB
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    # Expand dimensions and preprocess
    img_expanded = np.expand_dims(img_rgb, axis=0)
    img_preprocessed = preprocess_input(img_expanded)
    # Extract features
    features = feature_extractor.predict(img_preprocessed, verbose=0)
    return features.flatten()

def compare_general_images(img1, img2):
    """Compare two images using deep learning features (for animals/objects)"""
    print("🔬 Using general image comparison (animals/objects mode)")
    
    # Extract features from both images
    print("🧬 Extracting image features...")
    features1 = extract_features(img1)
    features2 = extract_features(img2)
    
    # Calculate cosine similarity
    similarity = 1 - cosine(features1, features2)
    
    # Convert to percentage (0-100)
    similarity_percentage = max(0, min(100, similarity * 100))
    
    # Distance metric (inverse of similarity for consistency)
    distance = 1 - similarity
    
    # Determine match threshold for objects/animals (less strict than faces)
    OBJECT_TOLERANCE = 0.3  # 70% similarity threshold
    is_match = distance < OBJECT_TOLERANCE
    
    # Calculate confidence level
    if distance < 0.15:
        confidence_level = 'very_high'
        confidence_description = 'Very similar (very high confidence)'
    elif distance < 0.3:
        confidence_level = 'high'
        confidence_description = 'Similar (high confidence)'
    elif distance < 0.5:
        confidence_level = 'medium'
        confidence_description = 'Somewhat similar'
    elif distance < 0.7:
        confidence_level = 'low'
        confidence_description = 'Likely different'
    else:
        confidence_level = 'very_low'
        confidence_description = 'Different'
    
    return {
        'similarity': float(np.round(similarity_percentage, 2)),
        'match': bool(is_match),
        'distance': float(np.round(distance, 4)),
        'confidence_level': str(confidence_level),
        'interpretation': confidence_description,
        'comparison_type': 'general_object_animal'
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Face Recognition API',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/compare', methods=['POST', 'OPTIONS'])
def compare_images():
    """Compare two images using deep learning (faces, animals, or objects)"""
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        print("🚀 Starting image comparison...")
        data = request.get_json()
        
        if not data or 'image1' not in data or 'image2' not in data:
            print("❌ Missing image data in request")
            return jsonify({
                "error": "Missing image data",
                "status": "error",
                "message": "Both image1 and image2 are required"
            }), 400
        
        # Decode base64 images
        print("📥 Decoding images...")
        try:
            image1_data = base64.b64decode(data['image1'])
            image2_data = base64.b64decode(data['image2'])
            print(f"✓ Base64 decoded - Image 1: {len(image1_data)} bytes, Image 2: {len(image2_data)} bytes")
        except Exception as decode_error:
            print(f"❌ Base64 decode error: {decode_error}")
            return jsonify({
                "error": "Invalid base64 data",
                "status": "error",
                "message": str(decode_error)
            }), 400
        
        # Convert to numpy arrays
        nparr1 = np.frombuffer(image1_data, np.uint8)
        nparr2 = np.frombuffer(image2_data, np.uint8)
        
        # Decode as OpenCV images with PIL fallback
        print("🖼️ Attempting to decode images...")
        
        # Try to decode image 1
        img1 = cv2.imdecode(nparr1, cv2.IMREAD_COLOR)
        if img1 is None:
            print("⚠️ OpenCV decode failed for image 1, trying PIL...")
            try:
                pil_img1 = Image.open(io.BytesIO(image1_data))
                if pil_img1.mode != 'RGB':
                    pil_img1 = pil_img1.convert('RGB')
                img1 = cv2.cvtColor(np.array(pil_img1), cv2.COLOR_RGB2BGR)
                print("✓ PIL decode successful for image 1")
            except Exception as pil_error:
                print(f"❌ PIL decode also failed: {pil_error}")
                img1 = None
        
        # Try to decode image 2
        img2 = cv2.imdecode(nparr2, cv2.IMREAD_COLOR)
        if img2 is None:
            print("⚠️ OpenCV decode failed for image 2, trying PIL...")
            try:
                pil_img2 = Image.open(io.BytesIO(image2_data))
                if pil_img2.mode != 'RGB':
                    pil_img2 = pil_img2.convert('RGB')
                img2 = cv2.cvtColor(np.array(pil_img2), cv2.COLOR_RGB2BGR)
                print("✓ PIL decode successful for image 2")
            except Exception as pil_error:
                print(f"❌ PIL decode also failed: {pil_error}")
                img2 = None
        
        if img1 is None or img2 is None:
            print("❌ Image decode failed!")
            return jsonify({
                "error": "Invalid image format",
                "status": "error",
                "message": "Could not decode images"
            }), 400
        
        print(f"📊 Image 1 shape: {img1.shape}, Image 2 shape: {img2.shape}")
        
        # Convert BGR to RGB for face_recognition
        rgb_img1 = cv2.cvtColor(img1, cv2.COLOR_BGR2RGB)
        rgb_img2 = cv2.cvtColor(img2, cv2.COLOR_BGR2RGB)
        
        # TRY FACE RECOGNITION FIRST
        print("🔍 Attempting face detection...")
        try:
            face_locations1 = face_recognition.face_locations(rgb_img1, model='hog')
            face_locations2 = face_recognition.face_locations(rgb_img2, model='hog')
            
            print(f"📍 Faces found - Image 1: {len(face_locations1)}, Image 2: {len(face_locations2)}")
            
            # If faces found in both images, use face recognition
            if len(face_locations1) > 0 and len(face_locations2) > 0:
                print("👤 Using face recognition mode")
                
                face_encodings1 = face_recognition.face_encodings(rgb_img1, face_locations1)
                face_encodings2 = face_recognition.face_encodings(rgb_img2, face_locations2)
                
                if len(face_encodings1) == 0 or len(face_encodings2) == 0:
                    raise Exception("Face encoding failed")
                
                encoding1 = face_encodings1[0]
                encoding2 = face_encodings2[0]
                
                face_distance = face_recognition.face_distance([encoding1], encoding2)[0]
                similarity_percentage = max(0, (1 - (face_distance / 0.6)) * 100)
                similarity_percentage = min(100, similarity_percentage)
                
                STRICT_TOLERANCE = 0.4
                is_match = face_distance < STRICT_TOLERANCE
                
                if face_distance < 0.3:
                    confidence_level = 'very_high'
                    confidence_description = 'Same person (very high confidence)'
                elif face_distance < 0.4:
                    confidence_level = 'high'
                    confidence_description = 'Same person (high confidence)'
                elif face_distance < 0.5:
                    confidence_level = 'medium'
                    confidence_description = 'Possibly same person'
                elif face_distance < 0.6:
                    confidence_level = 'low'
                    confidence_description = 'Likely different people'
                else:
                    confidence_level = 'very_low'
                    confidence_description = 'Different people'
                
                result = {
                    'similarity': float(np.round(similarity_percentage, 2)),
                    'match': bool(is_match),
                    'face_distance': float(np.round(face_distance, 4)),
                    'confidence_level': str(confidence_level),
                    'message': f"Analysis complete: {float(similarity_percentage):.1f}% match",
                    'analysis_details': {
                        'faces_detected_img1': int(len(face_locations1)),
                        'faces_detected_img2': int(len(face_locations2)),
                        'tolerance_used': float(STRICT_TOLERANCE),
                        'interpretation': str(confidence_description),
                        'distance_explanation': f"Face distance: {float(face_distance):.3f} (lower is better)"
                    },
                    'status': 'success',
                    'analysis_type': 'face_recognition'
                }
                
                print(f"✅ Face comparison completed: {float(similarity_percentage):.1f}%")
                return jsonify(result)
            
            else:
                # No faces found, fall back to general object/animal comparison
                print("⚠️ No faces detected in one or both images")
                print("🔄 Switching to general object/animal comparison mode")
                
        except Exception as face_error:
            print(f"⚠️ Face detection failed: {face_error}")
            print("🔄 Switching to general object/animal comparison mode")
        
        # GENERAL OBJECT/ANIMAL COMPARISON
        comparison_result = compare_general_images(img1, img2)
        
        result = {
            'similarity': comparison_result['similarity'],
            'match': comparison_result['match'],
            'distance': comparison_result['distance'],
            'confidence_level': comparison_result['confidence_level'],
            'message': f"Analysis complete: {comparison_result['similarity']:.1f}% similarity",
            'analysis_details': {
                'interpretation': comparison_result['interpretation'],
                'distance_explanation': f"Feature distance: {comparison_result['distance']:.3f} (lower is better)",
                'method': 'Deep learning feature extraction (MobileNetV2)'
            },
            'status': 'success',
            'analysis_type': comparison_result['comparison_type']
        }
        
        print(f"✅ Object/Animal comparison completed: {comparison_result['similarity']:.1f}%")
        print(f"   Interpretation: {comparison_result['interpretation']}")
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Comparison failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "status": "error",
            "message": "Image comparison failed"
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Universal Image Comparison API Starting...")
    print(f"📦 NumPy version: {np.__version__}")
    print(f"📦 TensorFlow version: {tf.__version__}")
    print("=" * 60)
    print("📡 Server will run on: http://0.0.0.0:5000")
    print("🔍 Endpoints available:")
    print("   GET  /health  - Health check")
    print("   POST /compare - Universal image comparison")
    print("=" * 60)
    print("✨ Supported:")
    print("   👤 Human faces (face_recognition)")
    print("   🐕 Animals (deep learning features)")
    print("   📦 Objects (deep learning features)")
    print("   🌐 Cloudinary/WEBP support")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)
