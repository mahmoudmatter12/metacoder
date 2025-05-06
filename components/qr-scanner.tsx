"use client"

import { useState, useEffect } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface QrScannerProps {
  onScan: (data: string) => void
}

export function QrScanner({ onScan }: QrScannerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasCamera, setHasCamera] = useState(true)
  const [, setScanner] = useState<Html5Qrcode | null>(null)
  const qrScannerId = "qr-scanner"

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null

    const initializeScanner = async () => {
      setIsLoading(true)
      try {
        html5QrCode = new Html5Qrcode(qrScannerId)
        setScanner(html5QrCode)

        const devices = await Html5Qrcode.getCameras()
        if (devices && devices.length > 0) {
          setHasCamera(true)
          const cameraId = devices[0].id

          await html5QrCode.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              onScan(decodedText)
              html5QrCode?.stop()
            },
            (errorMessage) => {
              console.log("QR Code scan error:", errorMessage)
            },
          )
        } else {
          setHasCamera(false)
        }
      } catch (err) {
        console.error("Error initializing scanner:", err)
        setHasCamera(false)
      } finally {
        setIsLoading(false)
      }
    }

    initializeScanner()

    return () => {
      if (html5QrCode?.isScanning) {
        html5QrCode.stop().catch((err) => console.error("Error stopping scanner:", err))
      }
    }
  }, [onScan])

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Initializing camera...</p>
        </div>
      ) : !hasCamera ? (
        <div className="text-center p-8">
          <p className="text-red-500 mb-4">No camera detected or permission denied</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : (
        <div className="relative">
          <div id={qrScannerId} className="w-full aspect-square max-w-md mx-auto rounded-lg overflow-hidden"></div>
          <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-primary/50 rounded-lg"></div>
        </div>
      )}
    </div>
  )
}
