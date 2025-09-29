import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import QRCode from 'qrcode';
import {
  VideoCameraIcon,
  QrCodeIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';

interface PhoneCameraSetupProps {
  onStreamStart?: (streamUrl: string) => void;
  onStreamStop?: () => void;
}

const PhoneCameraSetup: React.FC<PhoneCameraSetupProps> = ({
  onStreamStart,
  onStreamStop
}) => {
  const [setupMethod, setSetupMethod] = useState<'webcam' | 'phone' | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code for phone connection
  useEffect(() => {
    const generateQRCode = async () => {
      const phoneStreamUrl = `${window.location.origin}/phone-camera`;
      try {
        const qrDataUrl = await QRCode.toDataURL(phoneStreamUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, []);

  const startWebcamStream = () => {
    if (webcamRef.current) {
      const stream = webcamRef.current.getScreenshot();
      if (stream) {
        setStreamUrl('webcam://local');
        setIsStreaming(true);
        onStreamStart?.('webcam://local');
        
        // Simulate AI detection on webcam feed
        simulateAIDetection();
      }
    }
  };

  const stopWebcamStream = () => {
    setIsStreaming(false);
    setStreamUrl('');
    onStreamStop?.();
  };

  const simulatePhoneConnection = () => {
    // Simulate phone connection after 3 seconds
    setTimeout(() => {
      setPhoneConnected(true);
      setStreamUrl('phone://mobile-camera');
      setIsStreaming(true);
      onStreamStart?.('phone://mobile-camera');
      
      // Simulate AI detection on phone feed
      simulateAIDetection();
    }, 3000);
  };

  const simulateAIDetection = () => {
    // Simulate violence detection after 10 seconds
    setTimeout(() => {
      const mockAlert = {
        type: 'violence',
        severity: 'high',
        confidence: 0.89,
        location: { lat: 28.6562, lng: 77.2410 },
        tourist_ids: ['tourist_demo_001'],
        description: 'Suspicious activity detected in camera feed',
        camera_id: setupMethod === 'webcam' ? 'webcam_001' : 'phone_cam',
        evidence: {
          video_url: '/demo/violence_clip.mp4',
          image_url: '/demo/violence_frame.jpg'
        }
      };

      // Dispatch custom event to trigger alert
      window.dispatchEvent(new CustomEvent('demo-alert', { detail: mockAlert }));
    }, 10000);
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Camera Setup for Demo</h3>
          <p className="text-sm text-gray-600 mt-1">
            Set up a camera feed to demonstrate AI violence detection
          </p>
        </div>
        {isStreaming && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Stream Active</span>
          </div>
        )}
      </div>

      {!setupMethod && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Webcam Option */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 cursor-pointer transition-colors"
            onClick={() => setSetupMethod('webcam')}
          >
            <div className="text-center">
              <VideoCameraIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Use Webcam</h4>
              <p className="text-sm text-gray-600">
                Use your computer's built-in camera for the demo
              </p>
            </div>
          </div>

          {/* Phone Option */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 cursor-pointer transition-colors"
            onClick={() => setSetupMethod('phone')}
          >
            <div className="text-center">
              <DevicePhoneMobileIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Use Phone Camera</h4>
              <p className="text-sm text-gray-600">
                Connect your phone as an IP camera using QR code
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Webcam Setup */}
      {setupMethod === 'webcam' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">Webcam Stream</h4>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSetupMethod(null)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Change Method
              </button>
              {!isStreaming ? (
                <button
                  onClick={startWebcamStream}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start Stream
                </button>
              ) : (
                <button
                  onClick={stopWebcamStream}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <StopIcon className="h-4 w-4 mr-2" />
                  Stop Stream
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              height={360}
              width={640}
              videoConstraints={videoConstraints}
              className="w-full rounded-lg border border-gray-300"
            />
            
            {isStreaming && (
              <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded text-sm font-bold animate-pulse">
                ● LIVE
              </div>
            )}

            {isStreaming && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm">
                AI Detection: Active
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-blue-800">Demo Instructions</h5>
                <p className="text-sm text-blue-700 mt-1">
                  Once streaming starts, the AI will automatically detect suspicious activity after 10 seconds 
                  to demonstrate the alert workflow. You can simulate violent gestures or movements to test the system.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Setup */}
      {setupMethod === 'phone' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">Phone Camera Setup</h4>
            <button
              onClick={() => setSetupMethod(null)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Change Method
            </button>
          </div>

          {!phoneConnected ? (
            <div className="text-center space-y-6">
              <div>
                <QrCodeIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h5 className="text-lg font-medium text-gray-900 mb-2">Scan QR Code</h5>
                <p className="text-sm text-gray-600 mb-6">
                  Scan this QR code with your phone to connect it as an IP camera
                </p>
              </div>

              {qrCodeUrl && (
                <div className="flex justify-center">
                  <img src={qrCodeUrl} alt="QR Code" className="border border-gray-300 rounded-lg" />
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium text-yellow-800">Instructions</h5>
                      <ol className="text-sm text-yellow-700 mt-1 list-decimal list-inside space-y-1">
                        <li>Open your phone's camera app</li>
                        <li>Scan the QR code above</li>
                        <li>Allow camera permissions when prompted</li>
                        <li>Keep your phone stable and pointed at the demo area</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <button
                  onClick={simulatePhoneConnection}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Simulate Phone Connection (Demo)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                <div>
                  <h5 className="text-sm font-medium text-green-800">Phone Connected Successfully</h5>
                  <p className="text-sm text-green-700">Your phone camera is now streaming to the system</p>
                </div>
              </div>

              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <DevicePhoneMobileIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Phone Camera Feed</p>
                    <p className="text-sm opacity-75">Simulated mobile camera stream</p>
                  </div>
                </div>
                
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded text-sm font-bold animate-pulse">
                  ● LIVE
                </div>

                <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm">
                  AI Detection: Active | Phone Camera
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-medium text-blue-800">Demo Active</h5>
                    <p className="text-sm text-blue-700 mt-1">
                      The system will automatically generate a violence detection alert in 10 seconds 
                      to demonstrate the complete workflow from detection to dispatch.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stream Status */}
      {isStreaming && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-900 mb-3">Stream Information</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Stream URL:</span>
              <div className="font-mono text-gray-900 break-all">{streamUrl}</div>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <div className="text-green-600 font-medium">Active</div>
            </div>
            <div>
              <span className="text-gray-600">AI Detection:</span>
              <div className="text-blue-600 font-medium">Enabled</div>
            </div>
            <div>
              <span className="text-gray-600">Resolution:</span>
              <div className="text-gray-900">1280x720</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneCameraSetup;
