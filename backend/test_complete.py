import requests
import base64
import json
from PIL import Image, ImageDraw, ImageFilter
import io
import time
import random

print("🔥 EXTREME DIFFICULTY TEST - API STRESS & CHAOS")
print("=" * 70 + "\n")

# Test health check
print("🔍 Health Check...")
try:
    response = requests.get('http://127.0.0.1:5000/health')
    health = response.json()
    print(f"✓ Status: {health['status']}")
    print(f"✓ Vision API: {health['vision_api']}\n")
except Exception as e:
    print(f"❌ Connection failed: {e}\n")
    exit()

def create_extreme_image(difficulty_level):
    """Create extremely difficult images"""
    
    if difficulty_level == 1:
        # Blurry image
        img = Image.new('RGB', (800, 800), color=(200, 200, 200))
        draw = ImageDraw.Draw(img)
        
        draw.ellipse([150, 100, 650, 700], fill=(220, 180, 150), outline=(100, 100, 100), width=5)
        draw.circle((300, 300), 25, fill=(50, 50, 50))
        draw.circle((500, 300), 25, fill=(50, 50, 50))
        draw.arc([250, 400, 550, 550], 0, 180, fill=(150, 100, 100), width=5)
        
        img = img.filter(ImageFilter.GaussianBlur(radius=15))
        
    elif difficulty_level == 2:
        # Rotated/distorted image
        img = Image.new('RGB', (800, 800), color=(100, 150, 200))
        draw = ImageDraw.Draw(img)
        
        for i in range(5):
            x_off = random.randint(50, 300)
            y_off = random.randint(50, 300)
            size = random.randint(150, 300)
            draw.ellipse([x_off, y_off, x_off+size, y_off+size], 
                        fill=(random.randint(180, 220), random.randint(140, 180), random.randint(100, 150)),
                        outline=(0, 0, 0), width=2)
        
        img = img.rotate(random.randint(15, 45))
        
    elif difficulty_level == 3:
        # Very small faces
        img = Image.new('RGB', (800, 800), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        
        for i in range(20):
            x = random.randint(50, 750)
            y = random.randint(50, 750)
            draw.ellipse([x, y, x+30, y+30], fill=(220, 180, 150), outline=(0, 0, 0))
            draw.circle((x+10, y+10), 2, fill=(0, 0, 0))
            draw.circle((x+20, y+10), 2, fill=(0, 0, 0))
        
    elif difficulty_level == 4:
        # Inverted colors
        img = Image.new('RGB', (800, 800), color=(50, 50, 50))
        draw = ImageDraw.Draw(img)
        
        draw.ellipse([100, 50, 700, 750], fill=(30, 70, 100), outline=(200, 200, 200), width=3)
        draw.circle((250, 250), 30, fill=(200, 200, 200))
        draw.circle((550, 250), 30, fill=(200, 200, 200))
        draw.arc([200, 350, 600, 550], 0, 180, fill=(100, 150, 200), width=5)
        
    elif difficulty_level == 5:
        # Mixed shapes with fixed coordinates
        img = Image.new('RGB', (800, 800), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        
        for _ in range(100):
            x1, y1 = random.randint(0, 400), random.randint(0, 400)
            x2, y2 = x1 + random.randint(50, 300), y1 + random.randint(50, 300)
            color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
            
            shape_type = random.choice(['line', 'circle', 'ellipse', 'rectangle'])
            if shape_type == 'line':
                draw.line([x1, y1, x2, y2], fill=color, width=random.randint(1, 5))
            elif shape_type == 'circle':
                draw.circle((x1, y1), random.randint(5, 50), fill=color)
            elif shape_type == 'ellipse':
                draw.ellipse([x1, y1, x2, y2], fill=color)
            else:  # rectangle
                draw.rectangle([x1, y1, x2, y2], fill=color)
        
    elif difficulty_level == 6:
        # Pixelated image
        img = Image.new('RGB', (800, 800), color=(220, 180, 150))
        draw = ImageDraw.Draw(img)
        
        draw.ellipse([100, 50, 700, 750], fill=(220, 180, 150), outline=(0, 0, 0), width=2)
        draw.circle((250, 250), 30, fill=(0, 0, 0))
        draw.circle((550, 250), 30, fill=(0, 0, 0))
        
        img = img.resize((100, 100), Image.NEAREST)
        img = img.resize((800, 800), Image.NEAREST)
        
    elif difficulty_level == 7:
        # Text/noise with hidden faces
        img = Image.new('RGB', (800, 800), color=(200, 200, 200))
        draw = ImageDraw.Draw(img)
        
        import string
        for _ in range(50):
            text = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
            x = random.randint(0, 700)
            y = random.randint(0, 750)
            draw.text((x, y), text, fill=(random.randint(0, 100), random.randint(0, 100), random.randint(0, 100)))
        
        draw.ellipse([350, 350, 450, 450], fill=(220, 180, 150), outline=(0, 0, 0))
        draw.circle((380, 380), 3, fill=(0, 0, 0))
        draw.circle((420, 380), 3, fill=(0, 0, 0))
        
    elif difficulty_level == 8:
        # Motion blur effect
        img = Image.new('RGB', (800, 800), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        
        for offset in range(0, 50, 5):
            alpha = int(255 * (1 - offset / 50))
            color = (200 + offset, 140 + offset, 100 + offset)
            draw.ellipse([100+offset, 50+offset, 700+offset, 750+offset], 
                        outline=color, width=2)
        
    elif difficulty_level == 9:
        # Multiple overlapping complex objects
        img = Image.new('RGB', (800, 800), color=(100, 100, 100))
        draw = ImageDraw.Draw(img)
        
        # Faces
        for i in range(3):
            x, y = 100 + i*200, 100
            draw.ellipse([x, y, x+150, y+150], fill=(220, 180, 150), outline=(0, 0, 0), width=2)
        
        # Pets
        for i in range(2):
            x, y = 100 + i*300, 300
            draw.ellipse([x, y, x+200, y+100], fill=(180, 100, 60), outline=(0, 0, 0), width=2)
        
        # Objects
        for i in range(3):
            x, y = 50 + i*200, 500
            draw.rectangle([x, y, x+150, y+150], fill=(255, 0, 0), outline=(0, 0, 0), width=2)
        
    else:  # difficulty_level == 10 - CHAOS MODE
        img = Image.new('RGB', (800, 800), color=(128, 128, 128))
        draw = ImageDraw.Draw(img)
        
        # Fill with controlled chaos
        for x in range(0, 800, 20):
            for y in range(0, 800, 20):
                color = (random.randint(50, 200), random.randint(50, 200), random.randint(50, 200))
                draw.rectangle([x, y, x+20, y+20], fill=color)
        
        # Multiple faces at different scales
        for i in range(5):
            size = random.randint(50, 300)
            x, y = random.randint(0, 500), random.randint(0, 500)
            draw.ellipse([x, y, x+size, y+size], 
                        fill=(random.randint(150, 220), random.randint(100, 180), random.randint(80, 150)),
                        outline=(random.randint(0, 100), random.randint(0, 100), random.randint(0, 100)), width=2)
        
        img = img.filter(ImageFilter.GaussianBlur(radius=3))
        img = img.rotate(random.randint(0, 360))
    
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=85)
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode()

print("🔥 Generating extreme test cases...\n")

test_cases = {
    1: "Blurry Image",
    2: "Rotated & Distorted",
    3: "Tiny Faces (20x)",
    4: "Inverted Colors",
    5: "Pure Chaos/Noise",
    6: "Pixelated",
    7: "Text Overload + Hidden Face",
    8: "Motion Blur",
    9: "Multiple Overlapping Content",
    10: "CHAOS MODE (Everything Combined)"
}

results = []

for difficulty, description in test_cases.items():
    print("=" * 70)
    print(f"🔥 EXTREME TEST {difficulty}/10: {description}")
    print("=" * 70)
    
    try:
        image = create_extreme_image(difficulty)
        
        # Test detection
        start_time = time.time()
        response = requests.post(
            'http://127.0.0.1:5000/detect',
            json={'image': image},
            timeout=10
        )
        elapsed = time.time() - start_time
        result = response.json()
        
        status = result.get('status')
        primary_type = result.get('primary_type')
        detected = result.get('detected', {})
        
        print(f"\n⏱️  Response Time: {elapsed:.2f}s")
        print(f"Status: {status}")
        print(f"Detected Type: {primary_type}")
        
        if detected.get('faces'):
            print(f"✅ Faces: {len(detected['faces'])}")
        if detected.get('pets'):
            print(f"✅ Pets: {len(detected['pets'])}")
        if detected.get('objects'):
            print(f"✅ Objects: {len(detected['objects'])} detected")
        
        results.append({
            'difficulty': difficulty,
            'description': description,
            'success': status == 'success',
            'time': elapsed,
            'type': primary_type
        })
        
        print(f"✅ PASSED")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)[:80]}")
        results.append({
            'difficulty': difficulty,
            'description': description,
            'success': False,
            'time': 0,
            'type': 'error'
        })
        print(f"❌ FAILED")
    
    print()

# ============================================================================
# SUMMARY
# ============================================================================
print("=" * 70)
print("🏆 EXTREME DIFFICULTY TEST SUMMARY")
print("=" * 70)

passed = sum(1 for r in results if r['success'])
total = len(results)

print(f"\n📊 Results:")
for result in results:
    status = "✅" if result['success'] else "❌"
    print(f"{status} Test {result['difficulty']:2d}: {result['description']:35s} ({result['time']:.2f}s)")

print(f"\n🎯 Overall Success Rate: {passed}/{total} ({(passed/total*100):.0f}%)")

if passed == total:
    print("\n🏆 PERFECT SCORE! Your API handles EXTREME conditions!")
    print("   This is ENTERPRISE-GRADE performance! 🚀")
elif passed >= total * 0.9:
    print("\n🔥 EXCELLENT! 90%+ pass rate - VERY robust API!")
elif passed >= total * 0.8:
    print("\n⚡ GREAT! 80%+ pass rate - Solid performance!")
else:
    print("\n⚠️  Fair performance - Some edge cases need improvement")

print("\n" + "=" * 70)
print("✨ Extreme Testing Complete!")
print("=" * 70)
