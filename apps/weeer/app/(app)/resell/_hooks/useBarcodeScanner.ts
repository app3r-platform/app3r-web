"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// BarcodeDetector is a newer web API not yet in TypeScript's default lib
// Minimal type declaration for our usage
interface BarcodeDetectorResult { rawValue: string }
interface BarcodeDetectorOptions { formats: string[] }
declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  detect(source: HTMLVideoElement): Promise<BarcodeDetectorResult[]>;
}

export type ScannerState = "idle" | "scanning" | "success" | "error" | "unsupported";

export function useBarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const rafRef = useRef<number | null>(null);

  const [state, setState] = useState<ScannerState>("idle");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Check native BarcodeDetector support
  const supported =
    typeof window !== "undefined" && "BarcodeDetector" in window;

  const stopScan = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState("idle");
  }, []);

  const startScan = useCallback(async () => {
    if (!supported) {
      setState("unsupported");
      return;
    }
    setState("scanning");
    setResult("");
    setError("");
    try {
      // Init detector
      if (!detectorRef.current) {
        detectorRef.current = new BarcodeDetector({
          formats: ["qr_code", "code_128", "ean_13", "ean_8", "code_39"],
        });
      }
      // Open camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // Scan loop
      const scan = async () => {
        if (!videoRef.current || !detectorRef.current) return;
        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const barcodes = await detectorRef.current.detect(videoRef.current);
          if (barcodes.length > 0) {
            const value = barcodes[0].rawValue;
            setResult(value);
            setState("success");
            stopScan();
            return;
          }
        }
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    } catch (e) {
      setError((e as Error).message);
      setState("error");
      stopScan();
    }
  }, [supported, stopScan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScan(); };
  }, [stopScan]);

  return {
    supported,
    state,
    result,
    error,
    videoRef,
    startScan,
    stopScan,
  };
}
