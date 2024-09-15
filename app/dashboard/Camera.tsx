//cspell:ignore clsx

"use client";

import AutoRecord from "@/components/AutoRecord";
import DarkMode from "@/components/DarkMode";
import FlipCamera from "@/components/FlipCamera";
import InformationDialog from "@/components/InformationDialog";
import RecordVideo from "@/components/RecordVideo";
import ScreenShot from "@/components/ScreenShot";
import Volume from "@/components/Volume";
import FaceModelSelect from "@/components/face-model-changer/FaceModelSelect";
import useInterval from "@/components/hooks/useInterval";
import ModelSelect from "@/components/model-changer/ModelSelect";
import ModelSetting from "@/components/model-settings/ModelSetting";
import { Separator } from "@/components/ui/separator";
import Drawing3d from "@/lib/Drawing3d";
import FaceDetection from "@/mediapipe/face-detection";
import FaceLandmarkDetection from "@/mediapipe/face-landmark";
import HandLandmarkDetection from "@/mediapipe/hand-landmark";
import GestureRecognition from "@/mediapipe/gesture-recognition";
import initMediaPipVision from "@/mediapipe/mediapipe-vision";
import ObjectDetection from "@/mediapipe/object-detection";
import { CameraDevicesContext } from "@/providers/CameraDevicesProvider";
import { beep } from "@/utils/audio";
import {
    CAMERA_LOAD_STATUS_ERROR,
    CAMERA_LOAD_STATUS_NO_DEVICES,
    CAMERA_LOAD_STATUS_SUCCESS,
    ERROR_ENABLE_CAMERA_PERMISSION_MSG,
    ERROR_NO_CAMERA_DEVICE_AVAILABLE_MSG,
    FACE_DETECTION_MODE,
    FACE_LANDMARK_DETECTION_MODE,
    GESTURE_RECOGNITION_MODE,
    HAND_LANDMARK_DETECTION_MODE,
    ModelLoadResult,
    NO_MODE,
    OBJ_DETECTION_MODE,
} from "@/utils/definitions";
import "@mediapipe/tasks-vision";
import clsx from "clsx";
import {
    RefObject,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { Rings } from "react-loader-spinner";
import Webcam from "react-webcam";
import { toast } from "sonner";
import { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import { selectedTeamAtom } from "@/lib/atoms"
import { useAtom } from "jotai/react"
import { generateFeedback } from "@/convex/langchainAction";

type Props = {};

let interval: any = null;
let stopTimeout: any = null;

const Home = (props: Props) => {
    const cameraDeviceProvider = useContext(CameraDevicesContext);

    const webcamRef = useRef<Webcam | null>(null);
    const canvas3dRef = useRef<HTMLCanvasElement | null>(null);

    const [mirrored, setMirrored] = useState<boolean>(false);
    const [isRecording, setRecording] = useState<boolean>(false);
    const [isAutoRecordEnabled, setAutoRecordEnabled] =
        useState<boolean>(false);
    const [volume, setVolume] = useState<number>(0.8);
    const [modelLoadResult, setModelLoadResult] = useState<ModelLoadResult[]>();
    const [loading, setLoading] = useState<boolean>(false);
    const [currentMode, setCurrentMode] = useState<number>(NO_MODE);
    const [animateDelay, setAnimateDelay] = useState<number | null>(150);

    const [isHandInMouth, setIsHandInMouth] = useState(false);
  const [handInMouthDuration, setHandInMouthDuration] = useState(0);
  const [selectedTeam, setSelectedTeam] = useAtom(selectedTeamAtom);
  const addFailure = useMutation(api.failures.add);
// const generateFeedbackAction = useAction(generateFeedback);
const speakTextAction = useAction(api.elevenLabsActions.speakText);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const handleHandInMouth = async () => {
        if (isHandInMouth) {
          interval = setInterval(() => {
            setHandInMouthDuration((prev) => prev + 1);
          }, 1000);
        } else {
          if (handInMouthDuration > 0) {
            // Call the add mutation when the hand leaves the mouth region
            const feedback = await addFailure({
              badHabit: selectedTeam,
              duration: handInMouthDuration,
            });
            console.log("feedback", feedback);
            await speakTextAction({ text: feedback });
            setHandInMouthDuration(0);
          }
        }
      };

      handleHandInMouth();
    return () => clearInterval(interval);
  }, [isHandInMouth, handInMouthDuration, addFailure]);

    const takeScreenShot = () => {};
    const recordVideo = () => {
        if (isRecording) {
            setRecording(false);
        } else {
            setRecording(true);
        }
    };
    const toggleAutoRecord = () => {
        if (isAutoRecordEnabled) {
            setAutoRecordEnabled(false);
            toast("Autorecord disenabled");
        } else {
            setAutoRecordEnabled(true);
            toast("Autorecord enabled");
        }
    };

    const initModels = async () => {
        const vision = await initMediaPipVision();

        if (vision) {
            const models = [
                ObjectDetection.initModel(vision),
                FaceDetection.initModel(vision),
                GestureRecognition.initModel(vision),
                FaceLandmarkDetection.initModel(vision),
                HandLandmarkDetection.initModel(vision),
            ];

            const results = await Promise.all(models);
            const enabledModels = results.filter((result) => result.loadResult);

            if (enabledModels.length > 0) {
                setCurrentMode(enabledModels[0].mode);
            }
            setModelLoadResult(enabledModels);
        }
    };

    const resizeCanvas = (
        canvasRef: RefObject<HTMLCanvasElement>,
        webcamRef: RefObject<Webcam>
    ) => {
        const canvas = canvasRef.current;
        const video = webcamRef.current?.video;

        if (canvas && video) {
            const { videoWidth, videoHeight } = video;
            canvas.width = videoWidth;
            canvas.height = videoHeight;
        }
    };


    const getMouthRegion = (faceLandmarks: NormalizedLandmark[][]) => {
        // Assuming the mouth region is defined by specific landmarks
        // You need to adjust the indices based on the actual landmarks used by your model
        const mouthLandmarks = faceLandmarks[0]?.slice(61, 81); // Example indices for mouth region
        return mouthLandmarks;
    };

    const isHandInMouthRegion = (
        handLandmarks: NormalizedLandmark[][],
        mouthRegion: NormalizedLandmark[] | undefined
    ) => {
        // Check if any hand landmark is within the mouth region
        for (const hand of handLandmarks) {
            for (const handPoint of hand) {
                if (mouthRegion) {
                    for (const mouthPoint of mouthRegion) {
                        // Your code here
                        const distance = Math.sqrt(
                            Math.pow(handPoint.x - mouthPoint.x, 2) +
                            Math.pow(handPoint.y - mouthPoint.y, 2) +
                            Math.pow(handPoint.z - mouthPoint.z, 2)
                        );
                        
                        if (distance < 0.05) { // Adjust the threshold as needed
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    };


    const runPrediction = () => {
        if (
            webcamRef?.current?.video?.readyState === 4
        ) {
            if (
                currentMode === OBJ_DETECTION_MODE &&
                !ObjectDetection.isModelUpdating()
            ) {
                const objPredictions = ObjectDetection.detectObject(
                    webcamRef.current.video
                );

                if (objPredictions?.detections) {
                    const canvas = canvas3dRef.current;
                    const video = webcamRef.current?.video;

                    if (canvas && video) {
                        const { videoWidth, videoHeight } = video;
                        Drawing3d.resizeCamera(videoWidth, videoHeight);

                        ObjectDetection.draw(
                            mirrored,
                            objPredictions.detections,
                            videoWidth,
                            videoHeight
                        );
                    }
                }
            } else if (
                currentMode === FACE_DETECTION_MODE &&
                !FaceDetection.isModelUpdating()
            ) {
                const facePredictions = FaceDetection.detectFace(
                    webcamRef.current.video
                );

                if (facePredictions?.detections) {
                    const canvas = canvas3dRef.current;
                    const video = webcamRef.current?.video;

                    if (canvas && video) {
                        const { videoWidth, videoHeight } = video;
                        Drawing3d.resizeCamera(videoWidth, videoHeight);
                        FaceDetection.draw(
                            mirrored,
                            facePredictions.detections,
                            videoWidth,
                            videoHeight
                        );
                    }
                }
            } else if (
                currentMode === GESTURE_RECOGNITION_MODE &&
                !GestureRecognition.isModelUpdating()
            ) {
                const gesturePrediction = GestureRecognition.detectGesture(
                    webcamRef.current.video
                );

                if (gesturePrediction) {
                    const canvas = canvas3dRef.current;
                    const video = webcamRef.current?.video;

                    if (canvas && video) {
                        const { videoWidth, videoHeight } = video;
                        Drawing3d.resizeCamera(videoWidth, videoHeight);

                        GestureRecognition.draw(
                            mirrored,
                            gesturePrediction,
                            videoWidth,
                            videoHeight
                        );
                    }
                }
            } else if (
                currentMode === FACE_LANDMARK_DETECTION_MODE &&
                !FaceLandmarkDetection.isModelUpdating()
            ) {
                const faceLandmarkPrediction = FaceLandmarkDetection.detectFace(
                    webcamRef.current.video
                );

                if (faceLandmarkPrediction) {
                    const canvas = canvas3dRef.current;
                    const video = webcamRef.current?.video;

                    if (canvas && video) {
                        const { videoWidth, videoHeight } = video;
                        Drawing3d.resizeCamera(videoWidth, videoHeight);

                        FaceLandmarkDetection.draw(
                            mirrored,
                            faceLandmarkPrediction,
                            videoWidth,
                            videoHeight
                        );
                    }
                }
            } else if (currentMode === HAND_LANDMARK_DETECTION_MODE
            && !HandLandmarkDetection.isModelUpdating()) {
                const handLandmarkPrediction = HandLandmarkDetection.detectHand(
                    webcamRef.current.video
                );

                if (handLandmarkPrediction) {
                    const canvas = canvas3dRef.current;
                    const video = webcamRef.current?.video;

                    if (canvas && video) {
                        const { videoWidth, videoHeight } = video;
                        Drawing3d.resizeCamera(videoWidth, videoHeight);

                        HandLandmarkDetection.draw(
                            mirrored,
                            handLandmarkPrediction,
                            videoWidth,
                            videoHeight
                        );

                        // Check if hand is in the mouth region
                        const faceLandmarkPrediction = FaceLandmarkDetection.detectFace(
                            webcamRef.current.video
                        );

                        if (faceLandmarkPrediction) {
                            const mouthRegion = getMouthRegion(
                                faceLandmarkPrediction.faceLandmarks
                            );

                            if (isHandInMouthRegion(
                                handLandmarkPrediction.landmarks,
                                mouthRegion
                            )) {
                                console.log("Hand is in the mouth region");
                                setIsHandInMouth(true);
                            } else {
                                setIsHandInMouth(false);
                            }
                        }
                    }
                }
            }
        }
    };

    const onModeChange = (mode: string) => {
        const newMode: number = parseInt(mode);

        if (newMode === FACE_LANDMARK_DETECTION_MODE) {
            FaceLandmarkDetection.setDrawingMode(
                FaceLandmarkDetection.CONNECTION_FACE_LANDMARKS_TESSELATION
            );
        }
        setCurrentMode(newMode);
    };

    const canvas3dRefCallback = useCallback((element: any) => {
        if (element !== null && !Drawing3d.isRendererInitialized()) {
            canvas3dRef.current = element;
            Drawing3d.initRenderer(element);
            console.log("init three renderer");
        }
    }, []);

    const webcamRefCallback = useCallback((element: any) => {
        if (element != null) {
            webcamRef.current = element;
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        Drawing3d.initScene(window.innerWidth, window.innerHeight);
        initModels();
    }, []);

    useEffect(() => {
        if (modelLoadResult) {
            setLoading(false);
        }
    }, [modelLoadResult]);

    useEffect(() => {
        if (!loading) {
            if (
                cameraDeviceProvider?.status.status === CAMERA_LOAD_STATUS_ERROR
            ) {
                alert(ERROR_ENABLE_CAMERA_PERMISSION_MSG);
            } else if (
                cameraDeviceProvider?.status.status ===
                CAMERA_LOAD_STATUS_NO_DEVICES
            ) {
                alert(ERROR_NO_CAMERA_DEVICE_AVAILABLE_MSG);
            }
        }
    }, [loading, cameraDeviceProvider?.status.status]);

    useEffect(() => {
        const cleanup = () => {
            setAnimateDelay(null);
            webcamRef.current = null;
            canvas3dRef.current = null;
        };

        window.addEventListener("beforeunload", cleanup);
        return () => {
            window.removeEventListener("beforeunload", cleanup);
        };
    }, []);

    useInterval({ callback: runPrediction, delay: animateDelay });

    return (
        <div className="flex flex-col h-screen w-screen items-center">
            {/* Camera area */}
            <div
                className={clsx(
                    "relative h-[80%] w-[85%]",
                    "border-primary/5 border-2 max-h-xs"
                )}
            >
                <div className="flex relative w-full h-full">
                    {cameraDeviceProvider?.status.status ===
                        CAMERA_LOAD_STATUS_SUCCESS &&
                    cameraDeviceProvider?.webcamId ? (
                        <>
                            <Webcam
                                ref={webcamRefCallback}
                                mirrored={mirrored}
                                className="h-full w-full object-contain p-2"
                                videoConstraints={{
                                    deviceId: cameraDeviceProvider.webcamId,
                                }}
                            />
                            <canvas
                                id="3d canvas"
                                ref={canvas3dRefCallback}
                                className="absolute top-0 left-0 h-full w-full object-contain"
                            ></canvas>
                        </>
                    ) : cameraDeviceProvider?.status.status ===
                      CAMERA_LOAD_STATUS_ERROR ? (
                        <div className="flex h-full w-full justify-center items-center">
                            Please Enable Camera Permission
                        </div>
                    ) : cameraDeviceProvider?.status.status ===
                      CAMERA_LOAD_STATUS_NO_DEVICES ? (
                        <div className="flex h-full w-full justify-center items-center">
                            No Camera Device Available
                        </div>
                    ) : null}
                </div>
            </div>
            {/* Bottom area */}
            <div className="flex flex-col flex-1 w-[85%]">
                <div
                    className={clsx(
                        "border-primary/5 border-2 max-h-xs",
                        "flex flex-row gap-2 justify-between",
                        "shadow-md rounded-md p-4"
                    )}
                >
                    <div className="flex flex-row gap-2">
                        <DarkMode />
                        <FlipCamera setMirrored={setMirrored} />
                        <Separator orientation="vertical" className="mx-2" />
                        {false && (
                            <>
                                <ScreenShot takeScreenShot={takeScreenShot} />
                                <RecordVideo
                                    isRecording={isRecording}
                                    recordVideo={recordVideo}
                                />
                                <Separator
                                    orientation="vertical"
                                    className="mx-2"
                                />
                                <AutoRecord
                                    isAutoRecordEnabled={isAutoRecordEnabled}
                                    toggleAutoRecord={toggleAutoRecord}
                                />
                                <Separator
                                    orientation="vertical"
                                    className="mx-2"
                                />
                            </>
                        )}
                    </div>
                    <div className="flex flex-row gap-2">
                        {currentMode === FACE_LANDMARK_DETECTION_MODE && (
                            <FaceModelSelect
                                currentMode={currentMode.toString()}
                            />
                        )}
                        <ModelSelect
                            cameraStatus={cameraDeviceProvider?.status.status}
                            modelList={modelLoadResult}
                            currentMode={currentMode.toString()}
                            onModeChange={onModeChange}
                        />
                        <ModelSetting
                            cameraStatus={cameraDeviceProvider?.status.status}
                            mode={currentMode}
                        />
                        <InformationDialog />
                        <Separator orientation="vertical" className="mx-2" />
                        <Volume
                            cameraStatus={cameraDeviceProvider?.status.status}
                            volume={volume}
                            setVolume={setVolume}
                            beep={beep}
                        />
                    </div>
                </div>
            </div>
            {loading && (
                <div
                    className={clsx(
                        "absolute z-50 w-full h-full flex flex-col items-center justify-center bg-primary-foreground"
                    )}
                >
                    Loading module...
                    <Rings height={50} color="red" />
                </div>
            )}
        </div>
    );
};

export default Home;