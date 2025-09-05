import { Camera as MediaPipeCamera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import {
  FACEMESH_TESSELATION,
  HAND_CONNECTIONS,
  POSE_CONNECTIONS,
} from "@mediapipe/holistic";
import * as holistic from "@mediapipe/holistic";
import { useEffect, useRef, useState } from "react";
import { useVideoRecognition } from "../../hooks/useVideoRecognition";

export default function Camera() {
  const [start, setStart] = useState(false);
  const videoElement = useRef<HTMLVideoElement | null>(null);
  const drawCanvas = useRef<HTMLCanvasElement | null>(null);
  const setVideoElement: (el: HTMLVideoElement | null) => void =
    useVideoRecognition((state: any) => state.setVideoElement);

  const drawResults = (results: any) => {
    if (!drawCanvas.current || !videoElement.current) return;
    drawCanvas.current.width = videoElement.current.videoWidth;
    drawCanvas.current.height = videoElement.current.videoHeight;
    const canvasCtx = drawCanvas.current.getContext("2d");
    if (!canvasCtx) return;
    canvasCtx.save();
    canvasCtx.clearRect(
      0,
      0,
      drawCanvas.current.width,
      drawCanvas.current.height
    );
    // Use `Mediapipe` drawing functions
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: "#00cff7",
      lineWidth: 4,
    });
    drawLandmarks(canvasCtx, results.poseLandmarks, {
      color: "#ff0364",
      lineWidth: 2,
    });
    drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, {
      color: "#C0C0C070",
      lineWidth: 1,
    });
    if (results.faceLandmarks && results.faceLandmarks.length === 478) {
      //draw pupils
      drawLandmarks(
        canvasCtx,
        [results.faceLandmarks[468], results.faceLandmarks[468 + 5]],
        {
          color: "#ffe603",
          lineWidth: 2,
        }
      );
    }
    drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
      color: "#eb1064",
      lineWidth: 5,
    });
    drawLandmarks(canvasCtx, results.leftHandLandmarks, {
      color: "#00cff7",
      lineWidth: 2,
    });
    drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
      color: "#22c3e3",
      lineWidth: 5,
    });
    drawLandmarks(canvasCtx, results.rightHandLandmarks, {
      color: "#ff0364",
      lineWidth: 2,
    });
  };

  useEffect(() => {
    if (!start) {
      setVideoElement(null);
      return;
    }
    if (useVideoRecognition.getState().videoElement) {
      return;
    }
    setVideoElement(videoElement.current);

    let holisticInstance: any = null;
    let cameraInstance: any = null;

    const initializeMediaPipe = async () => {
      try {
        holisticInstance = new holistic.Holistic({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675471629/${file}`;
          },
        });

        holisticInstance.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
          refineFaceLandmarks: true,
        });

        holisticInstance.onResults((results: any) => {
          drawResults(results);
          useVideoRecognition.getState().resultsCallback?.(results);
        });

        if (videoElement.current) {
          try {
            // Try to acquire a camera stream first — some browsers / environments
            // require explicit getUserMedia before using camera utilities.
            let stream: MediaStream | null = null;

            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "user" },
                audio: false,
              });
            } catch (err) {
              console.warn("Initial getUserMedia failed:", err);

              // Fallback: try to find any available video input device and request it by deviceId
              if (
                navigator.mediaDevices &&
                navigator.mediaDevices.enumerateDevices
              ) {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevice = devices.find(
                  (d) => d.kind === "videoinput"
                );
                if (videoDevice && videoDevice.deviceId) {
                  try {
                    stream = await navigator.mediaDevices.getUserMedia({
                      video: {
                        deviceId: { exact: videoDevice.deviceId },
                        width: 640,
                        height: 480,
                      },
                      audio: false,
                    });
                  } catch (err2) {
                    console.warn("getUserMedia with deviceId failed:", err2);
                  }
                }
              }
            }

            if (!stream) {
              // Last-resort fallback: try very simple constraints
              try {
                stream = await navigator.mediaDevices.getUserMedia({
                  video: true,
                  audio: false,
                });
              } catch (err3) {
                console.error("No camera available:", err3);
                throw err3;
              }
            }

            // attach stream to video element so MediaPipe can consume it
            try {
              if (videoElement.current) {
                videoElement.current.srcObject = stream;
                videoElement.current.muted = true;
                videoElement.current.playsInline = true;
                // some browsers require play() to be called
                await videoElement.current.play().catch(() => {});
              }
            } catch (e) {
              // ignore play errors — we'll still pass the element to MediaPipe
            }

            cameraInstance = new MediaPipeCamera(
              videoElement.current as HTMLVideoElement,
              {
                onFrame: async () => {
                  if (holisticInstance) {
                    await holisticInstance.send({
                      image: videoElement.current,
                    });
                  }
                },
                width: 640,
                height: 480,
              }
            );

            cameraInstance.start();
          } catch (err: any) {
            console.error("Failed to acquire camera feed:", err);
            // stop startup and reset the state so user can retry
            setVideoElement(null);
            setStart(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    initializeMediaPipe();

    return () => {
      // cleanup
      setVideoElement(null);
      if (cameraInstance) {
        try {
          cameraInstance.stop();
        } catch (e) {
          console.warn("Error stopping camera:", e);
        }
      }
      if (holisticInstance && typeof holisticInstance.close === "function") {
        try {
          holisticInstance.close();
        } catch (e) {
          console.warn("Error closing holistic:", e);
        }
      }
    };
  }, [start]);

  return (
    <>
      <button
        onClick={() => setStart((prev) => !prev)}
        className={`fixed bottom-4 right-4 cursor-pointer ${
          start
            ? "bg-red-500 hover:bg-red-700"
            : "bg-indigo-400 hover:bg-indigo-700"
        } transition-colors duration-200 flex items-center justify-center z-20 p-4 rounded-full text-white drop-shadow-sm`}
      >
        {!start ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 0 0-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409"
            />
          </svg>
        )}
      </button>
      <div
        className={`absolute z-[999999] bottom-24 right-4 w-[320px] h-[240px] rounded-[20px] overflow-hidden ${
          !start ? "hidden" : ""
        }`}
      >
        <canvas
          ref={drawCanvas}
          className="absolute z-10 w-full h-full bg-black/50 top-0 left-0"
        />
        <video
          ref={videoElement}
          className="absolute z-0 w-full h-full top-0 left-0"
        />
      </div>
    </>
  );
}
