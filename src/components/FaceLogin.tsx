import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Añade esta importación
import * as faceapi from 'face-api.js';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

type LabeledDescriptor = {
  label: string;
  descriptors: number[];
};

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

const FaceLogin: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Añade esta línea

  // Cargar modelos
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      setLoading(false);
    };
    loadModels();
  }, []);

  // Encender cámara
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((mediaStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        streamRef.current = mediaStream;
      })
      .catch((err) => console.error('Error al acceder a la cámara', err));
  };

  // Apagar cámara
  const stopVideo = () => {
    const currentStream = streamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleLogin = async () => {
    if (!videoRef.current) return;
  
    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
  
    if (!detection) {
      setMessage('No se detectó ningún rostro.');
      return;
    }
  
    const currentDescriptor = Array.from(detection.descriptor);
  
    try {
      // Autenticar con Supabase
      const response = await fetch(`${SUPABASE_URL}/functions/v1/authenticate-face`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ descriptor: currentDescriptor })
      });
  
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Error en autenticación');
  
      // Establecer sesión en el cliente Supabase
      const { data: sessionData, error } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      });
  
      if (error) throw error;
  
      setMessage(`✅ Bienvenido!`);
      setTimeout(() => {
        stopVideo();
        onSuccess();
        navigate('/'); // Añade esta línea para redirigir
      }, 2000);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!loading) startVideo();
  }, [loading]);

  // Apagar cámara al desmontar
  useEffect(() => {
    return () => stopVideo();
  }, []);

  const handleCancel = () => {
    stopVideo();
    onCancel(); // Notifica cancelación
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-3xl w-full text-center relative">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Autenticación Biométrica</h2>

        {loading ? (
          <p className="text-blue-500 animate-pulse">Cargando modelos de reconocimiento facial...</p>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full max-w-[640px] h-[480px] rounded-xl shadow-lg mx-auto border border-gray-300"
            />
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={handleLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow"
              >
                Verificar Rostro
              </button>
              <button
                onClick={handleCancel}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg shadow"
              >
                Cancelar
              </button>
            </div>
            {message && (
              <p className="mt-4 text-sm font-medium text-gray-700">{message}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FaceLogin;
