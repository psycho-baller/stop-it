import {
    BoundingBox,
    Detection,
    FaceDetector,
    FaceDetectorOptions,
    FaceDetectorResult,
    HandLandmarker,
    HandLandmarkerOptions,
    HandLandmarkerResults
} from "@mediapipe/tasks-vision";
// import { Email } from "@/tools/send_email";
// import { Reward } from "@/tools/reward_system";
// import { SoundController } from "@/tools/sound_controller";
// import { PlotData } from "@/tools/plot_data";
import { RUNNING_MODE_VIDEO } from "@/utils/definitions";

// const rewardSystem = new Reward();
// const soundController = new SoundController();
// const plotter = new PlotData();

const NailBitingDetection = (() => {
    const FACE_MODEL_URL: string =
        "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite";
    const HAND_MODEL_URL: string =
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.tflite";

    let minDetectionConfidence: number = 0.5;
    let minSuppressionThreshold: number = 0.3;
    let runningMode = RUNNING_MODE_VIDEO;
    let isUpdating: boolean = false;

    let faceDetector: FaceDetector | null = null;
    let handLandmarker: HandLandmarker | null = null;

    let handInMouthRegion: boolean = false;
    let printed: boolean = false;
    let musicFilename: string = "resources/got_caught.mp3";
    let nailBitingCount: number = 0;
    let lastBiteTime: number = Date.now();
    let timeSinceLastBite: number = 0.0;
    let countdownDuration: number = 10;
    let countdownStartTime: number = 0.0;
    let countdownEndTime: number = 0.0;
    let bitingDuration: number = 0.0;
    let countdownActive: boolean = false;
    let timeBiting: number = 0.0;

    const initModel = async (vision: any): Promise<void> => {
        if (faceDetector && handLandmarker) return;

        try {
            const faceConfig: FaceDetectorOptions = {
                baseOptions: {
                    modelAssetPath: FACE_MODEL_URL,
                    delegate: "GPU",
                },
                minDetectionConfidence: minDetectionConfidence,
                minSuppressionThreshold: minSuppressionThreshold,
                runningMode: runningMode,
            };

            faceDetector = await FaceDetector.createFromOptions(vision, faceConfig);

            const handConfig: HandLandmarkerOptions = {
                baseOptions: {
                    modelAssetPath: HAND_MODEL_URL,
                    delegate: "GPU",
                },
                minHandDetectionConfidence: minDetectionConfidence,
                runningMode: runningMode,
            };

            handLandmarker = await HandLandmarker.createFromOptions(vision, handConfig);
        } catch (error) {
            console.error("Error initializing models:", error);
        }
    };

    const getConfig = (): FaceDetectorOptions => {
        const config: FaceDetectorOptions = {
            baseOptions: {
                modelAssetPath: MODEL_URL,
                delegate: delegate,
            },
            minDetectionConfidence: minDetectionConfidence,
            minSuppressionThreshold: minSuppressionThreshold,
            runningMode: runningMode,
        };

        return config;
    };

    const detect = async (video: HTMLVideoElement, emailDict?: any) => {
        if (!faceDetector || !handLandmarker) return;

        const detectFrame = async () => {
            const faceResults = faceDetector!.detectForVideo(video, performance.now());
            const handResults = await handLandmarker!.detectForVideo(video, performance.now());

            if (faceResults?.detections) {
                faceResults.detections.forEach((detection) => {
                    const box = detection.boundingBox;
                    const ih = video.videoHeight;
                    const iw = video.videoWidth;
                    const x = box.originX * iw;
                    const y = box.originY * ih;
                    const w = box.width * iw;
                    const h = box.height * ih;

                    const mouthRectLeft = x + 70;
                    const mouthRectTop = y + 110;
                    const mouthRectRight = x + w - 30;
                    const mouthRectBottom = y + h - 10;

                    if (handResults && handResults.landmarks) {
                        handResults.landmarks.forEach((handLandmarks) => {
                            const palmLandmarks = handLandmarks.slice(0, 9);
                            const palmCenterX = palmLandmarks.reduce((sum, lm) => sum + lm.x, 0) / palmLandmarks.length * iw;
                            const palmCenterY = palmLandmarks.reduce((sum, lm) => sum + lm.y, 0) / palmLandmarks.length * ih;

                            const squareSize = 35;
                            const handRectLeft = palmCenterX - squareSize;
                            const handRectTop = palmCenterY - squareSize;
                            const handRectRight = palmCenterX + squareSize;
                            const handRectBottom = palmCenterY + squareSize;

                            handInMouthRegion = (handRectLeft >= mouthRectLeft && handRectRight <= mouthRectRight) &&
                                                (handRectTop >= mouthRectTop && handRectBottom <= mouthRectBottom);

                            if (handInMouthRegion) {
                                lastBiteTime = Date.now();
                                timeSinceLastBite = 0.0;
                                // rewardSystem.earnedRewards = [];
                                if (!soundController.isPlaying()) {
                                    soundController.playSound(musicFilename);
                                }

                                if (!countdownActive) {
                                    countdownStartTime = Date.now();
                                    // plotter.timeStamps.push(new Date().toLocaleString());
                                    countdownActive = true;
                                    nailBitingCount += 1;
                                }

                                if (!printed) {
                                    if (emailDict) {
                                        // const email = new Email(emailDict.username, emailDict.password, emailDict.receiver_email);
                                        // email.sendEmail(video);
                                    }
                                    console.log(`Nail biting detected at ${new Date().toLocaleTimeString()}!`);
                                    printed = true;
                                }
                            } else {
                                if (countdownActive) {
                                    countdownEndTime = Date.now();
                                    bitingDuration = (countdownEndTime - countdownStartTime) / 1000;
                                    // plotter.bitingDurations.push(bitingDuration);
                                    console.log(`Biting duration: ${bitingDuration.toFixed(3)}`);
                                    countdownActive = false;
                                }
                                timeSinceLastBite = (Date.now() - lastBiteTime) / 1000;
                                // rewardSystem.checkForRewards(timeSinceLastBite);
                                printed = false;
                            }
                        });
                    } else {
                        if (!countdownActive) {
                            timeSinceLastBite = (Date.now() - lastBiteTime) / 1000;
                            // rewardSystem.checkForRewards(timeSinceLastBite);
                        }
                        printed = false;
                    }
                });
            } else {
                printed = false;
            }

            if (countdownActive) {
                timeBiting = (Date.now() - countdownStartTime) / 1000;
                if (timeBiting > 0.0) {
                    console.log(`Biting for: ${Math.floor(timeBiting)}s`);
                }
            } else {
                console.log(`Clean for: ${Math.floor(timeSinceLastBite)}s`);
            }

            if (rewardSystem.earnedRewards.length > 0) {
                console.log(`Title: ${rewardSystem.earnedRewards[rewardSystem.earnedRewards.length - 1]}`);
            } else {
                console.log("Title: Noob");
            }

            console.log(`Caught: ${nailBitingCount} times`);

            // plotter.plotData(handInMouthRegion);

            requestAnimationFrame(detectFrame);
        };

        detectFrame();
    };

    return {
        initModel,
        detect,
    };
})();

export default NailBitingDetection;