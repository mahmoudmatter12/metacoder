import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Loader2, Camera, CameraOff, RotateCw } from "lucide-react";

interface QrScannerProps {
  onScan: (data: string) => void;
  onError?: (error: Error) => void;
  preferredCamera?: 'back' | 'front' | 'environment' | 'user';
  autoClose?: boolean;
}

export function QrScanner({ 
  onScan, 
  onError, 
  preferredCamera = 'environment',
  autoClose = true
}: QrScannerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<{ id: string, label: string, facingMode: 'environment' | 'user' | 'unknown' }[]>([]);
  const [activeCamera, setActiveCamera] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const qrScannerId = "qr-scanner";

  // Get camera facing mode with better detection
  const getCameraFacingMode = async (deviceId: string): Promise<'environment' | 'user' | 'unknown'> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      stream.getTracks().forEach(track => track.stop());

      // Standard way to detect facing mode
      if (settings.facingMode) {
        return settings.facingMode === 'user' ? 'user' : 'environment';
      }

      // Fallback: check device label
      const label = track.label.toLowerCase();
      if (label.includes('front') || label.includes('face') || label.includes('user')) {
        return 'user';
      }
      if (label.includes('back') || label.includes('environment') || label.includes('rear')) {
        return 'environment';
      }

      // Fallback for browsers that don't support facingMode
      if (settings.width && settings.height) {
        return settings.width < settings.height ? 'user' : 'environment';
      }

      return 'unknown';
    } catch {
      return 'unknown';
    }
  };

  // Initialize scanner and get camera devices
  useEffect(() => {
    const initializeScanner = async () => {
      setIsLoading(true);
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          // Detect which cameras are front/back facing
          const devicesWithInfo = await Promise.all(
            devices.map(async device => ({
              ...device,
              facingMode: await getCameraFacingMode(device.id)
            }))
          );

          setCameraDevices(devicesWithInfo);
          
          // Try to find the preferred camera
          const preferredCam = devicesWithInfo.find(device => 
            preferredCamera === 'environment' 
              ? device.facingMode === 'environment' 
              : device.facingMode === 'user'
          );
          
          // Fallback to first available camera if preferred not found
          setActiveCamera(preferredCam?.id || devicesWithInfo[0].id);
          setHasPermission(true);
        } else {
          setHasPermission(false);
          console.error("No cameras found");
          if (onError) onError(new Error("No cameras found"));
        }
      } catch (err) {
        console.error("Error getting cameras:", err);
        setHasPermission(false);
        if (onError) onError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeScanner();

    return () => {
      stopScanner();
    };
  }, [onError, preferredCamera]);

  // Start scanner when active camera changes
  useEffect(() => {
    if (activeCamera) {
      startScanner(activeCamera);
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [activeCamera]);

  const startScanner = async (cameraId: string) => {
    try {
      if (scannerRef.current?.isScanning) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(qrScannerId);
      scannerRef.current = html5QrCode;

      setIsScanning(true);

      const activeDevice = cameraDevices.find(d => d.id === cameraId);
      const isFrontCamera = activeDevice?.facingMode === 'user';
      setIsFlipped(isFrontCamera);

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.333, // Standard camera aspect ratio (4:3)
        },
        (decodedText) => {
          // Pass the scanned data to the parent component
          onScan(decodedText);
          
          // Automatically stop the scanner after successful scan
          if (autoClose) {
            stopScanner();
          }
        },
        (errorMessage) => {
          console.log("QR Code scan error:", errorMessage);
        }
      );

      // Apply mirror effect for front camera
      const scannerElement = document.getElementById(qrScannerId);
      if (scannerElement) {
        scannerElement.style.transform = isFrontCamera ? 'scaleX(-1)' : 'none';
      }
    } catch (err) {
      console.error("Error starting scanner:", err);
      if (onError) onError(err as Error);
      setIsScanning(false);
    }
  };

  const handleRequestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      // Reload cameras after permission granted
      window.location.reload();
    } catch (err) {
      console.error("Error requesting camera access:", err);
      setHasPermission(false);
      if (onError) onError(err as Error);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      scannerRef.current = null;
      setIsScanning(false);

      // Reset any transforms
      const scannerElement = document.getElementById(qrScannerId);
      if (scannerElement) {
        scannerElement.style.transform = 'none';
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
      if (onError) onError(err as Error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p>Initializing scanner...</p>
        </div>
      ) : hasPermission === false ? (
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <CameraOff className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Camera Access Required</h3>
          <p className="text-gray-500 mb-6">
            Please enable camera permissions to scan QR codes
          </p>
          <button 
            onClick={handleRequestCameraAccess}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Camera className="mr-2 h-4 w-4" />
            Allow Camera Access
          </button>
        </div>
      ) : cameraDevices.length === 0 ? (
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <CameraOff className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Cameras Found</h3>
          <p className="text-gray-500 mb-6">
            Could not detect any camera devices on your system
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Try Again
          </button>
        </div>
      ) : (
        <div className="relative group">
          {/* Scanner View */}
          <div
            id={qrScannerId}
            className={`w-full aspect-square bg-black rounded-lg overflow-hidden ${isFlipped ? 'scale-x-[-1]' : ''}`}
          />

          {/* Scanner UI Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            {/* Top bar */}
            <div className="bg-gradient-to-b from-black/60 to-transparent p-4 flex justify-between items-start">
              <div className="pointer-events-auto">
                {isScanning && (
                  <div className="flex items-center bg-blue-600/80 text-white px-3 py-1 rounded-full">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse mr-2" />
                    <span className="text-xs">Scanning</span>
                  </div>
                )}
              </div>
            </div>

            {/* Center frame */}
            <div className="flex-1 flex items-center justify-center">
              <div className="border-2 border-dashed border-white/70 rounded-lg w-64 h-64 relative animate-pulse">
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-white" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-white" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-white" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-white" />
              </div>
            </div>

            {/* Bottom info text */}
            <div className="bg-gradient-to-t from-black/60 to-transparent p-4 flex justify-center">
              <div className="text-center text-white text-sm">
                Position QR code within the frame
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}