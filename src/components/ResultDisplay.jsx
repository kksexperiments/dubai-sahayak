import React from 'react';
import { Search, Globe, Info, Footprints, Lightbulb } from 'lucide-react';

const ResultDisplay = ({ result, onReset, onListen, isPlayingAudio }) => {
    if (!result) return null;

    return (
        <div className="result-container">
            {result.identification && (
                <div className="result-section">
                    <h3><Search size={24} /> চিনাক্তকৰণ:</h3>
                    <p>{result.identification}</p>
                </div>
            )}

            {result.translation && (
                <div className="result-section">
                    <h3><Globe size={24} /> অনুবাদ (Translation):</h3>
                    <p style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{result.translation}</p>
                </div>
            )}

            {result.explanation && (
                <div className="result-section">
                    <h3><Info size={24} /> ব্যাখ্যা আৰু ইতিহাস:</h3>
                    <p>{result.explanation}</p>
                </div>
            )}

            {result.nextSteps && result.nextSteps.length > 0 && (
                <div className="result-section">
                    <h3><Footprints size={24} /> পৰৱৰ্তী পদক্ষেপ:</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {result.nextSteps.map((step, i) => (
                            <p key={i}>{step}</p>
                        ))}
                    </div>
                </div>
            )}

            {result.tip && (
                <div className="result-section" style={{ borderLeft: '6px solid var(--success)' }}>
                    <h3><Lightbulb size={24} /> উপযোগী পৰামৰ্শ:</h3>
                    <p>{result.tip}</p>
                </div>
            )}

            <div className="audio-controls">
                <button
                    className="audio-btn listen-btn"
                    onClick={onListen}
                    disabled={isPlayingAudio}
                >
                    {isPlayingAudio ? "🔊 শুনাই আছে..." : "🔊 শুনক (Listen)"}
                </button>
                <button className="audio-btn retry-btn" onClick={onReset}>
                    📋 নতুন প্ৰশ্ন
                </button>
            </div>
        </div>
    );
};

export default ResultDisplay;
