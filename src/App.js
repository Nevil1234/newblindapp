import React, { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [detectedObject, setDetectedObject] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

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
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error('Error accessing webcam:', err);
      });
  };

  useEffect(() => {
    if (isDetecting) {
      const detectObjects = async () => {
        if (model && videoRef.current) {
          const predictions = await model.detect(videoRef.current);
          if (predictions.length > 0) {
            const firstPrediction = predictions[0].class;
            setDetectedObject(firstPrediction);
            announceObject(firstPrediction);
          }
        }
      };

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
  };

  const provideNavigationGuidance = () => {
    const directions = ['Move forward', 'Turn left', 'Turn right', 'Stop'];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    const speech = new SpeechSynthesisUtterance();
    speech.text = randomDirection;
    window.speechSynthesis.speak(speech);
  };

  return (
    <div className="App">
      <h1>Object Detection and Navigation App</h1>
      <video ref={videoRef} autoPlay muted width="600" height="400"></video>
      <div className="controls">
        <button onClick={() => setIsDetecting(!isDetecting)}>
          {isDetecting ? 'Stop Detection' : 'Start Detection'}
        </button>
        {detectedObject && <h2>{detectedObject} detected</h2>}
        <button onClick={provideNavigationGuidance}>Get Navigation Guidance</button>
      </div>
    </div>
  );
}

export default App;
