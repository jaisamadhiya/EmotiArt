declare module "@vladmandic/face-api" {
  export const nets: {
    tinyFaceDetector: {
      loadFromUri: (uri: string) => Promise<void>;
    };
    faceExpressionNet: {
      loadFromUri: (uri: string) => Promise<void>;
    };
  };

  export class TinyFaceDetectorOptions {
    constructor(options?: { inputSize?: number; scoreThreshold?: number });
  }

  export function detectSingleFace(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    options?: TinyFaceDetectorOptions
  ): {
    withFaceExpressions: () => Promise<{
      expressions: {
        neutral: number;
        happy: number;
        sad: number;
        angry: number;
        fearful: number;
        disgusted: number;
        surprised: number;
      };
    } | undefined>;
  };
}

declare module "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.esm.js" {
  export * from "@vladmandic/face-api";
  export default {
    nets: {
      tinyFaceDetector: {
        loadFromUri: (uri: string) => Promise<void>;
      };
      faceExpressionNet: {
        loadFromUri: (uri: string) => Promise<void>;
      };
    };
    TinyFaceDetectorOptions: new (options?: { inputSize?: number; scoreThreshold?: number }) => object;
    detectSingleFace: (
      input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
      options?: object
    ) => {
      withFaceExpressions: () => Promise<{
        expressions: {
          neutral: number;
          happy: number;
          sad: number;
          angry: number;
          fearful: number;
          disgusted: number;
          surprised: number;
        };
      } | undefined>;
    };
  };
}
