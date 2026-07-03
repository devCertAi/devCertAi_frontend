import { useEffect, useRef } from 'react'
interface CameraMonitorProps { stream: MediaStream | null }
export function CameraMonitor({ stream }: CameraMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream
  }, [stream])
  return <video ref={videoRef} autoPlay muted className="w-full h-full object-cover rounded-xl" />
}
