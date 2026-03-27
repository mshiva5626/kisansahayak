import os
import sys
import json
import cv2
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from google import genai
from google.genai import types

# Ensure you have the required libraries installed:
# pip install google-genai opencv-python numpy matplotlib pillow

def analyze_plant_disease(image_path):
    """
    Hybrid Crop Disease Detection Pipeline using OpenCV and Gemini 2.0 Flash.

    Args:
        image_path (str): Path to the plant leaf image.
    """
    print(f"Loading image from: {image_path}")
    
    # 1. Load image using OpenCV
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not read image at {image_path}")
        sys.exit(1)
        
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # 2. Extract Leaf Bounding Box using simple contour detection
    # Convert to grayscale and apply Gaussian blur
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (15, 15), 0)
    
    # Using Otsu's thresholding to separate leaf from background
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        print("Error: No leaf detected in the image.")
        sys.exit(1)
        
    # Find the largest contour (assuming it's the leaf)
    largest_contour = max(contours, key=cv2.contourArea)
    
    # Verify the contour is large enough to actually be a leaf
    if cv2.contourArea(largest_contour) < 5000:
        print("Error: Detected object is too small to be a leaf. No leaf detected.")
        sys.exit(1)
        
    # Get bounding box for the leaf
    x, y, w, h = cv2.boundingRect(largest_contour)
    
    # Add some padding to the crop
    padding = 20
    x_pad = max(0, x - padding)
    y_pad = max(0, y - padding)
    w_pad = min(img.shape[1] - x_pad, w + 2*padding)
    h_pad = min(img.shape[0] - y_pad, h + 2*padding)
    
    # Crop the leaf image
    leaf_crop_bgr = img[y_pad:y_pad+h_pad, x_pad:x_pad+w_pad]
    leaf_crop_rgb = cv2.cvtColor(leaf_crop_bgr, cv2.COLOR_BGR2RGB)
    
    # 3. Highlight Symptoms (Hotspots) using HSV mask
    # Convert cropped leaf to HSV color space
    hsv = cv2.cvtColor(leaf_crop_bgr, cv2.COLOR_BGR2HSV)
    
    # Define HSV bounds for "hotspots" (yellows, browns, blacks indicative of disease)
    # These bounds capture necrotic/chlorotic tissue
    lower_disease1 = np.array([10, 50, 20])   # Browns/dark necrotic
    upper_disease1 = np.array([35, 255, 255]) # Yellows/chlorosis
    
    lower_disease2 = np.array([0, 0, 0])      # Blacks/severe necrosis
    upper_disease2 = np.array([179, 255, 60])
    
    # Create masks
    mask1 = cv2.inRange(hsv, lower_disease1, upper_disease1)
    mask2 = cv2.inRange(hsv, lower_disease2, upper_disease2)
    disease_mask = cv2.bitwise_or(mask1, mask2)
    
    # Apply morphological operations to clean up the mask
    kernel = np.ones((5,5), np.uint8)
    disease_mask = cv2.morphologyEx(disease_mask, cv2.MORPH_OPEN, kernel)
    disease_mask = cv2.morphologyEx(disease_mask, cv2.MORPH_CLOSE, kernel)
    
    # Find contours of the diseased areas
    disease_contours, _ = cv2.findContours(disease_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Create an image to draw bounding boxes on
    symptom_highlight_img = leaf_crop_rgb.copy()
    
    disease_areas_found = False
    for cnt in disease_contours:
        if cv2.contourArea(cnt) > 100: # Filter out tiny noise
            disease_areas_found = True
            dx, dy, dw, dh = cv2.boundingRect(cnt)
            # Draw red rectangle around symptoms
            cv2.rectangle(symptom_highlight_img, (dx, dy), (dx+dw, dy+dh), (255, 0, 0), 3)

    print(f"Symptom highlighting complete. Disease areas found: {disease_areas_found}")

    # 4. Prepare for API Integration
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        sys.exit(1)
        
    # Convert numpy arrays to PIL Images for the Gemini SDK
    pil_wide_shot = Image.fromarray(img_rgb)
    pil_close_up = Image.fromarray(symptom_highlight_img)
    
    # Initialize the Gemini client using the new google-genai SDK
    client = genai.Client()
    
    # 5. Send to Gemini 2.0 Flash
    print("Initiating analysis with Gemini 2.0 Flash...")
    prompt = """
    Compare the wide shot and the close-up of the symptoms. 
    Act as a plant pathologist. Analyze the necrotic patterns, lesion edges, and chlorosis highlighted in the red boxes. 
    
    Based on the visual evidence, provide: 
    1. Diagnosis (Include expected pathogen/disease name)
    2. Confidence Level (as a percentage)
    3. Organic vs Chemical treatment steps (Provide practical Integrated Pest Management advice)
    
    Return the response as a valid JSON object matching this structure:
    {
        "diagnosis": "Name of disease",
        "confidence": "85%",
        "analysis": "Detailed analysis of necrotic patterns, edges, and chlorosis",
        "treatment": {
            "organic": ["step 1", "step 2"],
            "chemical": ["step 1"]
        }
    }
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=[prompt, pil_wide_shot, pil_close_up],
            config=types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type="application/json"
            )
        )
        
        # Parse the JSON response
        result_text = response.text
        # Optional: strip markdown fences if model decides to use them despite response_mime_type
        if result_text.startswith("```json"):
            result_text = result_text.split("```json")[1].split("```")[0].strip()
            
        diagnosis_data = json.loads(result_text)
        print("\n--- ANALYSIS COMPLETE ---")
        
    except Exception as e:
        print(f"Error during Gemini API call: {e}")
        sys.exit(1)
        
    # 6. Display the Results using Matplotlib
    fig = plt.figure(figsize=(15, 10))
    fig.patch.set_facecolor('#f0f0f0')
    
    # Setup grid layout
    gs = fig.add_gridspec(2, 2, height_ratios=[1.5, 1])
    
    # Display Original Wide Shot
    ax1 = fig.add_subplot(gs[0, 0])
    ax1.imshow(img_rgb)
    ax1.set_title('1. Original Wide Shot', fontsize=12, fontweight='bold')
    ax1.axis('off')
    
    # Display Cropped & Highlighted Symptoms
    ax2 = fig.add_subplot(gs[0, 1])
    ax2.imshow(symptom_highlight_img)
    ax2.set_title('2. Extracted Leaf & Highlighted Symptoms (HSV Mask)', fontsize=12, fontweight='bold')
    ax2.axis('off')
    
    # Create a clean text display for the Gemini results
    ax3 = fig.add_subplot(gs[1, :])
    ax3.axis('off')
    
    # Format the output text beautifully
    title = f"DIAGNOSIS: {diagnosis_data.get('diagnosis', 'Unknown')} (Confidence: {diagnosis_data.get('confidence', 'N/A')})"
    analysis = f"PATHOLOGY ANALYSIS:\n{diagnosis_data.get('analysis', 'No detailed analysis provided.')}"
    
    treatments = diagnosis_data.get('treatment', {})
    org_steps = "\n".join([f"  • {step}" for step in treatments.get('organic', ['None recommended'])])
    chem_steps = "\n".join([f"  • {step}" for step in treatments.get('chemical', ['None recommended'])])
    
    treatment_text = f"TREATMENT PLAN:\n[Organic / Biological]\n{org_steps}\n\n[Chemical (If Necessary)]\n{chem_steps}"
    
    full_text = f"{title}\n\n{analysis}\n\n{treatment_text}"
    
    # Add text to the subplot
    ax3.text(0.02, 0.95, full_text, 
             fontsize=11, 
             verticalalignment='top', 
             fontfamily='monospace',
             bbox=dict(boxstyle='round', facecolor='white', alpha=0.9, edgecolor='gray'))
    
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python hybrid_disease_detector.py <path_to_leaf_image>")
        print("Example: python hybrid_disease_detector.py tomato_leaf.jpg")
    else:
        test_image = sys.argv[1]
        analyze_plant_disease(test_image)
