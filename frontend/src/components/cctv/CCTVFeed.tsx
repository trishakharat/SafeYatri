import React, { useRef, useEffect, useState } from 'react';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface Camera {
  id: string;
  name: string;
  location: string;
  stream_url: string;
  status: 'online' | 'offline' | 'maintenance';
  ai_enabled: boolean;
  last_detection?: {
    type: string;
    confidence: number;
    timestamp: string;
  };
}

interface CCTVFeedProps {
  camera: Camera;
  isSelected?: boolean;
  onSelect?: () => void;
  showControls?: boolean;
  className?: string;
}

const CCTVFeed: React.FC<CCTVFeedProps> = ({
  camera,
  isSelected = false,
  onSelect,
  showControls = true,
  className
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDetections, setShowDetections] = useState(true);
  const [detectionBoxes, setDetectionBoxes] = useState<any[]>([]);
  const [connectionError, setConnectionError] = useState(false);

  // Simulate AI detection boxes (in real implementation, this would come from the AI service)
  useEffect(() => {
    if (camera.ai_enabled && camera.last_detection) {
      const mockDetections = [
        {
          id: 1,
          type: camera.last_detection.type,
          confidence: camera.last_detection.confidence,
          bbox: { x: 0.2, y: 0.3, width: 0.15, height: 0.25 }, // normalized coordinates
          color: camera.last_detection.type === 'violence' ? '#ef4444' : '#f59e0b'
        }
      ];
      setDetectionBoxes(mockDetections);
    }
  }, [camera.ai_enabled, camera.last_detection]);

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          setConnectionError(true);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const getStatusColor = () => {
    switch (camera.status) {
      case 'online':
        return 'border-green-500';
      case 'offline':
        return 'border-red-500';
      case 'maintenance':
        return 'border-yellow-500';
      default:
        return 'border-gray-300';
    }
  };

  const getStatusBadge = () => {
    const colors = {
      online: 'bg-green-500',
      offline: 'bg-red-500',
      maintenance: 'bg-yellow-500'
    };

    return (
      <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium text-white ${colors[camera.status]}`}>
        {camera.status.toUpperCase()}
      </div>
    );
  };

  return (
    <div
      className={clsx(
        'relative bg-black rounded-lg overflow-hidden cursor-pointer transition-all duration-200',
        isSelected ? `ring-2 ring-primary-500 ${getStatusColor()}` : `border-2 ${getStatusColor()}`,
        className
      )}
      onClick={onSelect}
    >
      {/* Video Element */}
      <div className="relative aspect-video">
        {camera.status === 'online' ? (
          <>
            {/* For demo purposes, we'll show a placeholder with simulated feed */}
            <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
              {connectionError ? (
                <div className="text-center text-white">
                  <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Connection Error</p>
                  <p className="text-xs text-gray-400">Unable to load stream</p>
                </div>
              ) : (
                <>
                  {/* Simulated video feed background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="absolute inset-0 opacity-20">
                      <div className="w-full h-full bg-noise animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Live indicator */}
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                    ● LIVE
                  </div>

                  {/* Simulated scene */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-lg font-medium">{camera.name}</div>
                      <div className="text-sm text-gray-300">{camera.location}</div>
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* AI Detection Overlays */}
                  {showDetections && detectionBoxes.map((detection) => (
                    <div
                      key={detection.id}
                      className="absolute border-2 animate-pulse"
                      style={{
                        borderColor: detection.color,
                        left: `${detection.bbox.x * 100}%`,
                        top: `${detection.bbox.y * 100}%`,
                        width: `${detection.bbox.width * 100}%`,
                        height: `${detection.bbox.height * 100}%`,
                      }}
                    >
                      <div 
                        className="absolute -top-6 left-0 px-2 py-1 text-xs font-bold text-white rounded"
                        style={{ backgroundColor: detection.color }}
                      >
                        {detection.type.toUpperCase()} {Math.round(detection.confidence * 100)}%
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Hidden video element for future real stream integration */}
            <video
              ref={videoRef}
              className="hidden w-full h-full object-cover"
              muted={isMuted}
              autoPlay
              playsInline
              onError={() => setConnectionError(true)}
            >
              <source src={camera.stream_url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </>
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Camera {camera.status}</p>
              <p className="text-sm">
                {camera.status === 'offline' ? 'Connection lost' : 'Scheduled maintenance'}
              </p>
            </div>
          </div>
        )}

        {/* Status Badge */}
        {getStatusBadge()}

        {/* AI Detection Indicator */}
        {camera.ai_enabled && (
          <div className="absolute top-2 right-12 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
            AI
          </div>
        )}
      </div>

      {/* Camera Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
        <h3 className="text-white font-medium text-sm truncate">{camera.name}</h3>
        <p className="text-gray-300 text-xs truncate">{camera.location}</p>
      </div>

      {/* Controls Overlay */}
      {showControls && camera.status === 'online' && (
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
              className="p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30 transition-all"
            >
              {isPlaying ? (
                <PauseIcon className="h-5 w-5" />
              ) : (
                <PlayIcon className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMute();
              }}
              className="p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30 transition-all"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="h-5 w-5" />
              ) : (
                <SpeakerWaveIcon className="h-5 w-5" />
              )}
            </button>

            {camera.ai_enabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetections(!showDetections);
                }}
                className="p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30 transition-all"
              >
                {showDetections ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFullscreen();
              }}
              className="p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30 transition-all"
            >
              <ArrowsPointingOutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 ring-2 ring-primary-500 ring-inset rounded-lg pointer-events-none" />
      )}

      <style jsx>{`
        .bg-noise {
          background-image: 
            radial-gradient(circle at 1px 1px, rgba(255,255,255,.15) 1px, transparent 0);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
};

export default CCTVFeed;
