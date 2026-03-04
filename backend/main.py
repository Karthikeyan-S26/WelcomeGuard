from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import io

app = FastAPI(title="Face Recognition API")

# Allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load OpenCV's pre-trained Haar cascades for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# IMPORTANT: In a real system, you'd use a deep learning model (like face_recognition dlib model, MediaPipe, or VGGFace) 
# to obtain face embeddings/descriptors for robust recognition rather than just detection. For an OpenCV only approach, 
# you'd extract the ROI and use cv2.face.LBPHFaceRecognizer_create() and train it on the `profiles` dataset.

@app.get("/")
def root():
    return {"message": "OpenCV Face Recognition Backend is Running"}

@app.post("/recognize")
async def recognize_face(file: UploadFile = File(...)):
    """
    Accepts an image file and returns bounding boxes of detected faces along with
    a mock predicted "label". Replace the logic inside this function to query your 
    database or perform real feature-matching against registered profiles.
    """
    contents = await file.read()
    
    # Convert uploaded file data to an OpenCV image
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        return {"faces": [], "error": "Invalid image"}

    # Convert to grayscale for detection
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Detect faces
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )

    detected_faces = []
    
    # Process each detected face
    for (x, y, w, h) in faces:
        # Here is where you would normally run an embedding extractor
        # e.g., descriptor = extract_features(image[y:y+h, x:x+w])
        # match = compare_descriptor_to_db(descriptor)

        # For demonstration, we simply return the bounding box
        detected_faces.append({
            "box": {
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h)
            },
            "label": "unknown", # Replace with actual recognition result (the profile ID)
            "confidence": 0.0   # Replace with actual confidence / distance
        })

    return {"faces": detected_faces}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
