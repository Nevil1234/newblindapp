import React, { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [detectedObject, setDetectedObject] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false); // Start detecting when user clicks
  const [pathGuidance, setPathGuidance] = useState('');
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    };

    loadModel();
    startVideo();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: 'environment' } }, // Use rear camera
    })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error('Error accessing webcam:', err);
      });
  };

  useEffect(() => {
    const detectObjects = async () => {
      if (model && videoRef.current && isDetecting) {
        const predictions = await model.detect(videoRef.current);
        if (predictions.length > 0) {
          const firstPrediction = predictions[0].class;
          setDetectedObject(firstPrediction);
          announceObject(firstPrediction);
        }
      }
    };

    if (isDetecting) {
      const interval = setInterval(() => {
        detectObjects();
      }, 1000); // Run detection every second

      return () => clearInterval(interval);
    }
  }, [isDetecting, model]);

  const announceObject = (object) => {
    const speech = new SpeechSynthesisUtterance();
    speech.text = `${object} detected`;
    window.speechSynthesis.speak(speech);

    // Optionally, trigger path guidance based on object detection
    if (object === 'person') {
      setPathGuidance('Person detected ahead, move carefully.');
    } else if (object === 'car') {
      setPathGuidance('Car detected, turn left or wait.');
    } else {
      setPathGuidance('Continue straight.');
    }

    providePathGuidance();
  };

  const providePathGuidance = () => {
    const speech = new SpeechSynthesisUtterance();
    speech.text = pathGuidance || 'Path is clear, continue forward.';
    window.speechSynthesis.speak(speech);
  };

  const provideUserRequestedNavigation = () => {
    const directions = ['Move forward', 'Turn left', 'Turn right', 'Stop'];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    const speech = new SpeechSynthesisUtterance();
    speech.text = randomDirection;
    window.speechSynthesis.speak(speech);
  };

  // Click handler to distinguish between single, double, and triple clicks
  const handleClick = () => {
    setClickCount(prev => prev + 1);
    setTimeout(() => {
      if (clickCount === 1) {
        // Single click: Start object detection
        setIsDetecting(true);
      } else if (clickCount === 2) {
        // Double click: Start navigation guidance
        providePathGuidance();
      } else if (clickCount === 3) {
        // Triple click: Interact with user for navigation
        provideUserRequestedNavigation();
      }
      setClickCount(0); // Reset click count after timeout
    }, 300); // Adjust timing for detecting multiple clicks
  };

  return (
    <div className="App" onClick={handleClick} style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h1>Object Detection and Navigation App</h1>
      <video ref={videoRef} autoPlay muted width="100%" height="auto" style={{ maxWidth: '600px', borderRadius: '10px' }}></video>
      <div className="controls" style={{ marginTop: '20px', textAlign: 'center' }}>
        {detectedObject && <h2>{detectedObject} detected</h2>}
        <h2>Navigation: {pathGuidance}</h2>
      </div>
    </div>
  );
}

export default App;
