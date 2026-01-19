import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';

const CameraCapture = ({ onCapture, onCancel }) => {
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        async function setupCamera() {
            try {
                const constraints = {
                    video: {
                        facingMode: 'environment', // Use rear camera by default
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };
                const userStream = await navigator.mediaDevices.getUserMedia(constraints);
                setStream(userStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = userStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("কেমেৰা খুলিব পৰা নগ'ল। অনুগ্ৰহ কৰি অনুমতি দিয়ক। (Camera access failed. Please grant permission.)");
            }
        }

        setupCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            onCapture(base64);

            // Stop stream after capture
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    };

    return (
        <div className="camera-container">
            <div className="camera-header">
                <button onClick={onCancel} className="close-btn">
                    <X size={32} />
                </button>
                <h2>ফটো তোলক (Take Photo)</h2>
            </div>

            <div className="viewfinder-container">
                {error ? (
                    <div className="camera-error">{error}</div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="viewfinder"
                    />
                )}
            </div>

            <div className="camera-footer">
                <button
                    onClick={capturePhoto}
                    className="capture-btn"
                    disabled={!!error}
                >
                    <div className="capture-inner">
                        <Camera size={48} color="white" />
                    </div>
                </button>
                <p className="camera-tip">চিন বা মেনুখন স্পষ্টকৈ পোহৰত তোলক</p>
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

export default CameraCapture;
