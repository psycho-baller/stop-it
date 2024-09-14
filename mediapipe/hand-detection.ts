import {
  HandLandmarker,
  HandLandmarkerOptions,
  HandLandmarkerResults
} from "@mediapipe/tasks-vision";
import {
  DELEGATE_GPU,
  HAND_LANDMARK_DETECTION_MODE,
  HAND_LANDMARK_DETECTION_STR,
  InterfaceDelegate,
  ModelLoadResult,
  RUNNING_MODE_VIDEO,
  RunningMode,
} from "@/utils/definitions";

const HandDetection = (() => {
  const MODEL_URL: string =
      "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.tflite";

  const CONFIG_MIN_DETECTION_CONFIDENCE_VALUE: number = 0;
  const CONFIG_MAX_DETECTION_CONFIDENCE_VALUE: number = 1;
  const CONFIG_DEFAULT_DETECTION_CONFIDENCE_SLIDER_STEP_VALUE: number = 0.1;

  let minDetectionConfidence: number = 0.5;
  let runningMode: RunningMode = RUNNING_MODE_VIDEO;
  let delegate: InterfaceDelegate = DELEGATE_GPU;
  let isUpdating: boolean = false;

  let handLandmarker: HandLandmarker | null = null;

  const initModel = async (vision: any): Promise<ModelLoadResult> => {
      const result: ModelLoadResult = {
          modelName: HAND_LANDMARK_DETECTION_STR,
          mode: HAND_LANDMARK_DETECTION_MODE,
          loadResult: false,
      };

      if (handLandmarker) {
          result.loadResult = true;
          return result;
      }

      try {
          if (vision) {
              const config: HandLandmarkerOptions = getConfig();

              handLandmarker = await HandLandmarker.createFromOptions(
                  vision,
                  config
              );

              result.loadResult = true;
          }
      } catch (error) {
          if (error instanceof Error) {
              console.log(error.message);
          } else {
              console.log(error);
          }
      }

      return result;
  };

  const getConfig = (): HandLandmarkerOptions => {
      const config: HandLandmarkerOptions = {
          baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: delegate,
          },
          minDetectionConfidence: minDetectionConfidence,
          runningMode: runningMode,
      };

      return config;
  };

  const getRunningMode = (): RunningMode => runningMode;
  const setRunningMode = (mode: RunningMode) => (runningMode = mode);

  const getMinDetectionConfidence = (): number => minDetectionConfidence;
  const setMinDetectionConfidence = (min: number) =>
      (minDetectionConfidence = min);

  const getInterfaceDelegate = (): InterfaceDelegate => delegate;
  const setInterfaceDelegate = (del: InterfaceDelegate) => (delegate = del);

  const updateModelConfig = async () => {
      if (handLandmarker) {
          isUpdating = true;
          console.log("interface:", delegate);
          await handLandmarker.setOptions(getConfig());
          isUpdating = false;
      }
  };

  const isModelUpdating = (): boolean => {
      return isUpdating;
  };

  const detectHand = (video: HTMLVideoElement): HandLandmarkerResults | null => {
      if (handLandmarker) {
          try {
              const detection: HandLandmarkerResults =
                  handLandmarker.detectForVideo(video, performance.now());

              return detection;
          } catch (error) {
              if (error instanceof Error) {
                  console.log(error.message);
              } else {
                  console.log(error);
              }
          }
      }

      return null;
  };

  return {
      CONFIG_HAND_MIN_DETECTION_CONFIDENCE_VALUE:
          CONFIG_MIN_DETECTION_CONFIDENCE_VALUE,
      CONFIG_HAND_MAX_DETECTION_CONFIDENCE_VALUE:
          CONFIG_MAX_DETECTION_CONFIDENCE_VALUE,
      CONFIG_HAND_DEFAULT_DETECTION_CONFIDENCE_SLIDER_STEP_VALUE:
          CONFIG_DEFAULT_DETECTION_CONFIDENCE_SLIDER_STEP_VALUE,
      initModel,
      getInterfaceDelegate,
      setInterfaceDelegate,
      getMinDetectionConfidence,
      setMinDetectionConfidence,
      getRunningMode,
      setRunningMode,
      detectHand,
      isModelUpdating,
      updateModelConfig,
  };
})();

export default HandDetection;