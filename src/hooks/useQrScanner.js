import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Custom hook for managing Html5Qrcode camera scanner lifecycle cleanly.
 */
export function useQrScanner({ elementId, onScan, onError, config = {} }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const scannerRef = useRef(null);

  const startScanner = async () => {
    if (isScanning) return;
    try {
      setScannerError(null);
      const html5QrCode = new Html5Qrcode(elementId);
      scannerRef.current = html5QrCode;

      const qrConfig = {
        fps: config.fps || 10,
        qrbox: config.qrbox || { width: 250, height: 250 },
        aspectRatio: config.aspectRatio || 1.0
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        qrConfig,
        (decodedText, decodedResult) => {
          if (onScan) onScan(decodedText, decodedResult);
        },
        (errorMessage) => {
          if (onError) onError(errorMessage);
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start QR scanner:', err);
      setScannerError(err.message || 'Could not access camera');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch (err) {
      console.warn('Scanner cleanup warning:', err);
    } finally {
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        });
      }
    };
  }, []);

  return {
    isScanning,
    scannerError,
    startScanner,
    stopScanner
  };
}
