declare module "@mediapipe/holistic" {
  export class Holistic {
    constructor(config: { locateFile: (file: string) => string });
    setOptions(options: {
      modelComplexity?: number;
      smoothLandmarks?: boolean;
      minDetectionConfidence?: number;
      minTrackingConfidence?: number;
      refineFaceLandmarks?: boolean;
    }): void;
    onResults(callback: (results: any) => void): void;
    send(data: { image: HTMLVideoElement }): Promise<void>;
    close(): void;
  }

  export const FACEMESH_TESSELATION: any;
  export const HAND_CONNECTIONS: any;
  export const POSE_CONNECTIONS: any;
}

declare module "@mediapipe/camera_utils" {
  export class Camera {
    constructor(
      videoElement: HTMLVideoElement,
      options: {
        onFrame: () => Promise<void>;
        width: number;
        height: number;
      }
    );
    start(): void;
    stop(): void;
  }
}

declare module "@mediapipe/drawing_utils" {
  export function drawConnectors(
    ctx: CanvasRenderingContext2D,
    landmarks: any,
    connections: any,
    style: {
      color: string;
      lineWidth: number;
    }
  ): void;

  export function drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: any,
    style: {
      color: string;
      lineWidth: number;
    }
  ): void;
}
