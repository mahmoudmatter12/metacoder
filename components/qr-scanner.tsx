"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Loader2, Camera, CameraOff, RotateCw, Scan } from "lucide-react"
import { toast } from "sonner"

interface QrScannerProps {
  onScan: (data: string) => void
  onError?: (error: Error) => void
}

export function QrScanner({ onScan, onError }: QrScannerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraDevices, setCameraDevices] = useState<{ id: string; label: string; isFrontCamera?: boolean }[]>([])
  const [activeCamera, setActiveCamera] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const qrScannerId = "qr-scanner"

  // Simplified front camera detection
  const detectFrontCamera = (deviceId: string, label: string): boolean => {
    // Use label as the primary detection method
    const labelLower = label.toLowerCase()
    return (
      labelLower.includes("front") ||
      labelLower.includes("face") ||
      labelLower.includes("user") ||
      labelLower.includes("selfie")
    )
  }

  // Initialize scanner and get camera devices - optimized
  useEffect(() => {
    let isMounted = true

    const initializeScanner = async () => {
      if (!isMounted) return

      setIsLoading(true)
      try {
        const devices = await Html5Qrcode.getCameras()
        if (!isMounted) return

        if (devices && devices.length > 0) {
          // Process devices with simplified front camera detection
          const devicesWithInfo = devices.map((device) => ({
            ...device,
            isFrontCamera: detectFrontCamera(device.id, device.label || ""),
          }))

          // Prefer back camera as default
          const backCamera = devicesWithInfo.find((d) => !d.isFrontCamera)
          const defaultCamera = backCamera || devicesWithInfo[0]

          setCameraDevices(devicesWithInfo)
          setActiveCamera(defaultCamera.id)
          setHasPermission(true)

          // Start scanner automatically with the selected camera
          if (isMounted) {
            setTimeout(() => {
              if (isMounted && defaultCamera.id) {
                startScanner(defaultCamera.id)
              }
            }, 500)
          }
        } else {
          if (isMounted) {
            setHasPermission(false)
            toast(
            "No cameras found",
            )
            if (onError) onError(new Error("No cameras found"))
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error getting cameras:", err)
          setHasPermission(false)
          toast("Error accessing cameras")
          if (onError) onError(err as Error)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initializeScanner()

    return () => {
      isMounted = false
      stopScanner()
    }
  }, [onError])

  // Only handle camera switching, not auto-start
  useEffect(() => {
    if (activeCamera && isScanning) {
      stopScanner().then(() => {
        startScanner(activeCamera)
      })
    }

    return () => {
      if (isScanning) {
        stopScanner()
      }
    }
  }, [activeCamera])

  const startScanner = async (cameraId: string) => {
    try {
      if (scannerRef.current?.isScanning) {
        await stopScanner()
      }

      const html5QrCode = new Html5Qrcode(qrScannerId)
      scannerRef.current = html5QrCode

      const activeDevice = cameraDevices.find((d) => d.id === cameraId)
      const isFrontCamera = activeDevice?.isFrontCamera || false
      setIsFlipped(isFrontCamera)

      // Optimize scanner configuration
      await html5QrCode.start(
        cameraId,
        {
          fps: 5, // Lower FPS for better performance
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          disableFlip: false, // Let the library handle flipping
          // Removed unsupported property
        },
        (decodedText) => {
          // Prevent multiple scans of the same code
          stopScanner()
          setIsScanning(false)

          // Delay the callback to allow UI to update
          setTimeout(() => {
            onScan(decodedText)
            toast("QR Code scanned successfully")
          }, 300)
        },
        (errorMessage) => {
          // Ignore most scanning errors as they're normal during scanning
          if (errorMessage.includes("No QR code found")) {
            return
          }
          console.log("QR Code scan error:", errorMessage)
        },
      )

      // Apply mirror effect for front camera
      const scannerElement = document.getElementById(qrScannerId)
      if (scannerElement) {
        scannerElement.style.transform = isFrontCamera ? "scaleX(-1)" : "none"
      }

      setIsScanning(true)
    } catch (err) {
      console.error("Error starting scanner:", err)
      toast("Error starting scanner")
      if (onError) onError(err as Error)
      setIsScanning(false)
    }
  }

  const handleRequestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((track) => track.stop())

      toast("Camera access granted")

      setHasPermission(true)

      // Reinitialize the scanner
      const devices = await Html5Qrcode.getCameras()
      if (devices && devices.length > 0) {
        const devicesWithInfo = devices.map((device) => ({
          ...device,
          isFrontCamera: detectFrontCamera(device.id, device.label || ""),
        }))

        setCameraDevices(devicesWithInfo)
        setActiveCamera(devicesWithInfo[0].id)

        // Start scanner automatically
        setTimeout(() => {
          startScanner(devicesWithInfo[0].id)
        }, 500)
      }
    } catch (err) {
      console.error("Error requesting camera access:", err)
      toast("Error requesting camera access")
      setHasPermission(false)
      if (onError) onError(err as Error)
    }
  }

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop()
      }
      setIsScanning(false)

      // Reset any transforms
      const scannerElement = document.getElementById(qrScannerId)
      if (scannerElement) {
        scannerElement.style.transform = "none"
      }
    } catch (err) {
      console.error("Error stopping scanner:", err)
      if (onError) onError(err as Error)
    }
    return Promise.resolve()
  }

  const switchCamera = () => {
    if (cameraDevices.length < 2) return

    const currentIndex = cameraDevices.findIndex((device) => device.id === activeCamera)
    const nextIndex = (currentIndex + 1) % cameraDevices.length
    setActiveCamera(cameraDevices[nextIndex].id)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Initializing scanner...</p>
        </div>
      ) : hasPermission === false ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <CameraOff className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Camera Access Required</h3>
          <p className="text-muted-foreground mb-6">Please enable camera permissions to scan QR codes</p>
          <Button onClick={handleRequestCameraAccess}>
            <Camera className="mr-2 h-4 w-4" />
            Allow Camera Access
          </Button>
        </div>
      ) : cameraDevices.length === 0 ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <CameraOff className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Cameras Found</h3>
          <p className="text-muted-foreground mb-6">Could not detect any camera devices on your system</p>
          <Button onClick={() => window.location.reload()}>
            <RotateCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      ) : (
        <div className="relative group">
          {/* Scanner View */}
          <div
            id={qrScannerId}
            className={`w-full aspect-square bg-black rounded-lg overflow-hidden ${isFlipped ? "scale-x-[-1]" : ""}`}
          />

          {/* Scanner UI Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            {/* Top bar */}
            <div className="bg-gradient-to-b from-black/60 to-transparent p-4 flex justify-between items-start">
              <div className="pointer-events-auto">
                {isScanning ? (
                  <div className="flex items-center bg-primary/80 text-white px-3 py-1 rounded-full">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse mr-2" />
                    <span className="text-xs">Scanning</span>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="pointer-events-auto"
                    onClick={() => activeCamera && startScanner(activeCamera)}
                  >
                    <Scan className="mr-2 h-4 w-4" />
                    Start Scanner
                  </Button>
                )}
              </div>
            </div>

            {/* Center frame */}
            <div className="flex-1 flex items-center justify-center">
              <div className="border-2 border-dashed border-primary/50 rounded-lg w-64 h-64 relative">
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-primary" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-primary" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary" />
              </div>
            </div>

            {/* Bottom bar */}
            <div className="bg-gradient-to-t from-black/60 to-transparent p-4 flex justify-center">
              <div className="pointer-events-auto flex gap-2">
                {cameraDevices.length > 1 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={switchCamera}
                    title="Switch Camera"
                    className="pointer-events-auto"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                )}

                {isScanning && (
                  <Button variant="secondary" onClick={() => stopScanner()} className="pointer-events-auto">
                    Stop Scanner
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera selection dropdown (when not scanning) */}
      {!isScanning && cameraDevices.length > 1 && (
        <div className="mt-4">
          <label htmlFor="camera-select" className="block text-sm font-medium text-muted-foreground mb-1">
            Select Camera
          </label>
          <select
            id="camera-select"
            value={activeCamera || ""}
            onChange={(e) => setActiveCamera(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
          >
            {cameraDevices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.label || `Camera ${cameraDevices.indexOf(device) + 1}`}
                {device.isFrontCamera ? " (Front)" : " (Back)"}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
