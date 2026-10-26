"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

interface GateScannerProps {
  mode: "ticket" | "member";
}

export function GateScanner({ mode }: GateScannerProps) {
  const router = useRouter();
  const [inputVal, setInputVal] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is not supported on this device or browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);

      // Initialize native BarcodeDetector if available
      const winWithDetector = window as unknown as {
        BarcodeDetector?: new (options: { formats: string[] }) => {
          detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
        };
      };
      if (typeof window !== "undefined" && winWithDetector.BarcodeDetector) {
        const detector = new winWithDetector.BarcodeDetector({ formats: ["qr_code"] });
        const interval = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0 && barcodes[0]?.rawValue) {
              const raw = barcodes[0].rawValue.trim();
              clearInterval(interval);
              handleScannedValue(raw);
            }
          } catch {
            // Frame detection error, continue next frame
          }
        }, 300);
      }
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? err.message
          : "Unable to start camera. Please grant camera permissions or type reference manually.",
      );
      setIsCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleScannedValue = (raw: string) => {
    handleStopCamera();
    // Parse URL if scanned QR code is full URL
    let code = raw;
    if (raw.includes("/verify/ticket/")) {
      code = raw.split("/verify/ticket/")[1]?.split("?")[0] || raw;
    } else if (raw.includes("/verify/member/")) {
      code = raw.split("/verify/member/")[1]?.split("?")[0] || raw;
    }

    if (mode === "ticket") {
      router.push(`/verify/ticket/${encodeURIComponent(code)}` as Route);
    } else {
      router.push(`/verify/member/${encodeURIComponent(code)}` as Route);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    handleScannedValue(inputVal.trim());
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {mode === "ticket" ? (
              <svg
                aria-hidden="true"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                />
              </svg>
            )}
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground">
            {mode === "ticket" ? "Gate Ticket & Pass Scanner" : "Member Credential Lookup"}
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {mode === "ticket"
              ? "Scan attendee QR codes from paper passes or smartphones for instant venue admission."
              : "Verify active membership status, valid term year, and garden club privileges."}
          </p>
        </div>

        {/* Live Camera Viewfinder */}
        <div className="space-y-3">
          {isCameraActive ? (
            <div className="relative overflow-hidden rounded-2xl border-2 border-primary bg-black aspect-video flex items-center justify-center shadow-inner">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-emerald-400/50 m-8 rounded-xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="rounded-full bg-black/75 backdrop-blur-xs px-3 py-1 text-[11px] font-semibold text-white">
                  Point camera at pass QR code
                </span>
              </div>
              <button
                type="button"
                onClick={handleStopCamera}
                className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/90 cursor-pointer"
                aria-label="Close camera"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartCamera}
              className="w-full rounded-2xl bg-primary/10 border-2 border-dashed border-primary/30 p-6 text-center hover:bg-primary/15 transition-all cursor-pointer group space-y-2"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:scale-105 transition-transform shadow-xs">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <span className="text-sm font-bold text-foreground block">
                  Open Gate Camera Scanner
                </span>
                <span className="text-xs text-muted-foreground">
                  Use mobile camera to scan passes hands-free
                </span>
              </div>
            </button>
          )}

          {cameraError && (
            <p className="text-xs text-amber-700 dark:text-amber-400 text-center font-medium">
              {cameraError}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-card px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
            Or Enter Code Manually
          </span>
        </div>

        {/* Manual Search Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                mode === "ticket"
                  ? "e.g. SDGC-TKT-2027-A8B9C1"
                  : "e.g. SDGC-MBR-ABC12345 or username"
              }
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-40"
          >
            Verify Credential &rarr;
          </button>
        </form>
      </div>
    </div>
  );
}
