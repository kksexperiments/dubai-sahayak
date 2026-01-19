import React, { useState, useEffect } from 'react';
import { Camera, HelpCircle, MapPin, Coffee, Train, Hotel, Pill, Sparkles, Lightbulb } from 'lucide-react';
import CameraCapture from './components/CameraCapture';
import ResultDisplay from './components/ResultDisplay';
import { adaptiveCompress } from './utils/imageCompression';
import { analyzeImageWithRetry } from './services/geminiService';
import { playTextToSpeech } from './services/ttsService';
import { getCurrentLocation, getNearestFacility } from './services/locationService';
import './styles/App.css';

const App = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Dynamic Location State
  const [nearest, setNearest] = useState({
    hotel: null,
    metro: null,
    food: null,
    places: null,
    pharmacy: null,
    help: "দুবাই পুলিচ (901)"
  });
  const [loadingNearest, setLoadingNearest] = useState(false);

  useEffect(() => {
    async function loadNearest() {
      setLoadingNearest(true);
      try {
        const coords = await getCurrentLocation();
        const types = ['hotel', 'metro', 'food', 'places', 'pharmacy'];

        await Promise.all(types.map(async (type) => {
          const name = await getNearestFacility(coords.lat, coords.lng, type);
          if (name) {
            setNearest(prev => ({ ...prev, [type]: name }));
          }
        }));
      } catch (err) {
        console.warn("Location access denied or failed:", err);
      } finally {
        setLoadingNearest(false);
      }
    }
    loadNearest();
  }, []);

  const handleCapture = async (base64) => {
    setShowCamera(false);
    setCapturedImage(base64);
    setIsAnalyzing(true);
    setError(null);

    try {
      const compressed = await adaptiveCompress(base64);
      const analysisResult = await analyzeImageWithRetry(compressed);
      setResult(analysisResult);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("বিশ্লেষণ কৰোঁতে কিবা সমস্যা হ'ল। অনুগ্ৰহ কৰি আকৌ চেষ্টা কৰক।");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleListen = async () => {
    if (!result || isPlayingAudio) return;

    setIsPlayingAudio(true);
    try {
      const audioText = `${result.identification}. অনুবাদ: ${result.translation}. ব্যাখ্যা: ${result.explanation}. পৰৱৰ্তী পদক্ষেপ: ${result.nextSteps.join('. ')}`;
      await playTextToSpeech(audioText);
    } catch (err) {
      console.error("TTS error:", err);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const resetApp = () => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
    setShowCamera(false);
  };

  const helpItems = [
    { id: 'hotel', icon: <Hotel />, label: 'Hotel', assamese: 'হোটেল' },
    { id: 'metro', icon: <Train />, label: 'Metro', assamese: 'মেট্ৰ’' },
    { id: 'food', icon: <Coffee />, label: 'Food', assamese: 'খাদ্য' },
    { id: 'places', icon: <MapPin />, label: 'Places', assamese: 'ঠাই' },
    { id: 'pharmacy', icon: <Pill />, label: 'Doctor', assamese: 'ফার্মাচী' },
    { id: 'help', icon: <HelpCircle />, label: 'Help', assamese: 'সহায়' },
  ];

  return (
    <div className="app-container">
      {!showCamera && (
        <header>
          <h1>Dubai Sahayak</h1>
          <p>আপোনাৰ দুবাই ভ্ৰমণৰ সহায়ক</p>
        </header>
      )}

      <main>
        {!showCamera && !capturedImage && !isAnalyzing && (
          <div className="home-screen">
            <div className="hero-section">
              <div className="hero-icon-container">
                <img src="/app-icon.png" alt="Dubai Sahayak Icon" className="hero-icon" />
              </div>

              <button
                className="primary-btn"
                onClick={() => setShowCamera(true)}
              >
                <span><Camera size={40} strokeWidth={2.5} /> ফটো তোলক</span>
                <span className="subtitle">Tap to Take Photo</span>
              </button>

              <div className="tips-alert">
                <Lightbulb size={24} color="#3B82F6" />
                <p>চিন বা মেনুখন স্পষ্টকৈ পোহৰত তোলিব। তেতিয়া সঠিক উত্তৰ পাব।</p>
              </div>
            </div>

            <div className="quick-help-container">
              <div className="quick-help-header">
                <p>দ্ৰুত সহায় (Quick Help)</p>
              </div>

              <div className="quick-help-grid">
                {helpItems.map(item => (
                  <div key={item.id} className="help-item">
                    <div className="icon-box">
                      {item.icon}
                    </div>
                    <p>{item.assamese}</p>
                    {nearest[item.id] ? (
                      <span className="nearest-info">{nearest[item.id]}</span>
                    ) : (
                      loadingNearest && <div className="shimmer"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showCamera && (
          <CameraCapture
            onCapture={handleCapture}
            onCancel={() => setShowCamera(false)}
          />
        )}

        {isAnalyzing && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">বিশ্লেষণ কৰি আছে...<br /><span style={{ fontSize: '1.2rem', fontWeight: '500', color: '#64748B' }}>Analyzing for you...</span></p>
          </div>
        )}

        {result && !isAnalyzing && (
          <ResultDisplay
            result={result}
            onReset={resetApp}
            onListen={handleListen}
            isPlayingAudio={isPlayingAudio}
          />
        )}

        {error && (
          <div className="loading-container">
            <div style={{ color: 'var(--error)', fontSize: '4rem' }}>⚠️</div>
            <p className="loading-text">{error}</p>
            <button className="primary-btn" style={{ height: '70px', marginTop: '1rem' }} onClick={resetApp}>আকৌ চেষ্টা কৰক</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
