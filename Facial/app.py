
import os
import cv2
from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from deepface import DeepFace
from collections import Counter

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

UPLOAD_FOLDER = './uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def analyze_faces_in_frame(frame_resized):
    faces = face_cascade.detectMultiScale(frame_resized, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    emotion_list = []

    for (x, y, w, h) in faces:
        face_roi = frame_resized[y:y + h, x:x + w]
        try:
            result = DeepFace.analyze(face_roi, actions=['emotion'], enforce_detection=False, detector_backend='mtcnn')
            emotion = result[0]['dominant_emotion']
            emotion_list.append(emotion)
        except Exception as e:
            print(f"Error analyzing face: {e}")
    
    return emotion_list

@app.route('/upload_image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"status": "error", "message": "No image uploaded"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    # Save the uploaded file
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)

    try:
        # Process the image
        frame = cv2.imread(file_path)
        if frame is None:
            return jsonify({"status": "error", "message": "Invalid image file"}), 400

        frame_resized = cv2.resize(frame, (640, 480))
        emotion_list = analyze_faces_in_frame(frame_resized)

        # Count the most frequent emotion
        emotion_counter = Counter(emotion_list)
        if emotion_counter:
            most_common_emotion, most_common_count = emotion_counter.most_common(1)[0]
        else:
            most_common_emotion, most_common_count = "None", 0

        # Count the number of faces (people)
        num_people = len(face_cascade.detectMultiScale(frame_resized, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)))

        # Prepare data to broadcast
        emotion_data = {
            "emotion": most_common_emotion,
            "num_people": num_people
        }

        # Emit the data to connected WebSocket clients
        socketio.emit('emotion_data', emotion_data)

        return jsonify({"status": "success", "emotion": most_common_emotion, "num_people": num_people}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
