# Python OpenCV Face Recognition Backend

This backend is designed to provide server-side face recognition using Python and OpenCV.

## Setup Instructions

1.  Make sure you have Python 3.8+ installed.
2.  Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run the FastAPI server:
    ```bash
    uvicorn main:app --reload
    ```
4.  The server will start on `http://localhost:8000`.

## Architecture Notes
Currently, your frontend uses `face-api.js` (which relies on MobileNet/ResNet models) to extract a 128-dimensional float descriptor for each face. 
Pure OpenCV (`cv2.CascadeClassifier` and `cv2.face_LBPHFaceRecognizer`) uses radically different, older algorithms (like Local Binary Patterns Histograms). It does not natively output a 128-d descriptor compatible with your existing Supabase `profiles` database unless you use OpenCV's Deep Neural Network (DNN) module with a compatible model (like OpenFace).

For a robust Python implementation that matches `face-api.js` embeddings, it is highly recommended to use a deep-learning package such as:
*   **DeepFace** (`pip install deepface`)
*   **face_recognition** (`pip install face_recognition` - requires dlib)
*   **MediaPipe** (`pip install mediapipe`)

The provided `main.py` is a foundation that currently detects faces using OpenCV Haunted Cascades. You can drop in your prefered embeddings extractor in the `# TODO` section in `main.py` to match against your Supabase profile descriptors.
