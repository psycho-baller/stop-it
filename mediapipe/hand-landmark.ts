import Drawing3d from "@/lib/Drawing3d";
import {
    DELEGATE_GPU,
    InterfaceDelegate,
    RUNNING_MODE_VIDEO,
    RunningMode,
    HAND_LANDMARK_DETECTION_MODE,
    HAND_LANDMARK_DETECTION_STR,
    ModelLoadResult,
} from "@/utils/definitions";
import {
    HandLandmarker,
    HandLandmarkerOptions,
    HandLandmarkerResults,
    NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import {
    BufferGeometry,
    CircleGeometry,
    DoubleSide,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    Object3DEventMap,
    Vector3,
} from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";

type Connection = {
    start: number;
    end: number;
};

export type ConnectionData = {
    name: string;
    mode: number;
    connection: Connection[];
    connectionIndex: number[];
    color: string;
    isLoaded: boolean;
    isEnabled: boolean;
};

const HandLandmarkDetection = (() => {
    const MODEL_URL: string =
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.tflite";

    const CONFIG_MIN_DETECTION_CONFIDENCE: number = 0;
    const CONFIG_MAX_DETECTION_CONFIDENCE: number = 1;
    const CONFIG_MIN_PRESENCE_CONFIDENCE: number = 0;
    const CONFIG_MAX_PRESENCE_CONFIDENCE: number = 1;
    const CONFIG_MIN_TRACKING_CONFIDENCE: number = 0;
    const CONFIG_MAX_TRACKING_CONFIDENCE: number = 1;
    const CONFIG_MIN_HAND_NUMBER: number = 1;
    const CONFIG_MAX_HAND_NUMBER: number = 2;

    const CONFIG_DEFAULT_HAND_SLIDER_STEP: number = 1;
    const CONFIG_DEFAULT_CONFIDENCE_SLIDER_STEP: number = 0.1;

    const BASE_SCALE: number = 0.25;
    const SCALE_FACTOR: number = 4;

    const CIRCLE_RADIUS: number = 3;
    const CIRCLE_SEGMENTS: number = 32;

    const CONNECTION_HAND_LANDMARKS: number = 0;
    const CONNECTION_HAND_LANDMARKS_POINTS: number = 1;

    const HAND_LANDMARKS_STR: string = "Hand Landmarks";
    const HAND_LANDMARKS_POINTS_STR: string = "Hand Landmarks Points";

    const ConnectionIndexes: ConnectionData[] = [
        {
            name: HAND_LANDMARKS_STR,
            mode: CONNECTION_HAND_LANDMARKS,
            connection: HandLandmarker.HAND_CONNECTIONS,
            connectionIndex: [],
            color: "#C0C0C0",
            isLoaded: false,
            isEnabled: true,
        },
    ];

    let numHands: number = 1;
    let minHandDetectionConfidence: number = 0.5;
    let minHandPresenceConfidence: number = 0.5;
    let minTrackingConfidence: number = 0.5;
    let delegate: InterfaceDelegate = DELEGATE_GPU;
    let runningMode: RunningMode = RUNNING_MODE_VIDEO;

    let isUpdating: boolean = false;
    let drawingMode: number = CONNECTION_HAND_LANDMARKS;

    let handLandmarker: HandLandmarker | null = null;

    const generateMeshIndexes = async () => {
        ConnectionIndexes.forEach((data: ConnectionData) => {
            if (data.isLoaded) {
                return;
            }

            data.connection.forEach((conn: Connection) => {
                data.connectionIndex.push(conn.start, conn.end);
            });

            data.isLoaded = true;
        });
    };

    const getAvailableMode = (): ConnectionData[] => {
        const result: ConnectionData[] = ConnectionIndexes.filter(
            (data: ConnectionData) => data.isEnabled && data.isLoaded
        );

        result.push({
            name: HAND_LANDMARKS_POINTS_STR,
            mode: CONNECTION_HAND_LANDMARKS_POINTS,
            connection: [],
            connectionIndex: [],
            color: "#C0C0C0",
            isLoaded: true,
            isEnabled: true,
        });

        return result;
    };

    const initModel = async (vision: any): Promise<ModelLoadResult> => {
        const result: ModelLoadResult = {
            modelName: HAND_LANDMARK_DETECTION_STR,
            mode: HAND_LANDMARK_DETECTION_MODE,
            loadResult: false,
        };

        generateMeshIndexes();

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
            numHands: numHands,
            minHandDetectionConfidence: minHandDetectionConfidence,
            minHandPresenceConfidence: minHandPresenceConfidence,
            minTrackingConfidence: minTrackingConfidence,
            runningMode: runningMode,
        };

        return config;
    };

    const getRunningMode = (): RunningMode => runningMode;
    const setRunningMode = (mode: RunningMode) => (runningMode = mode);

    const getNumOfHands = (): number => numHands;
    const setNumOfHands = (num: number) => (numHands = num);

    const getMinHandDetectionConfidence = (): number =>
        minHandDetectionConfidence;
    const setMinHandDetectionConfidence = (num: number) =>
        (minHandDetectionConfidence = num);

    const getMinHandPresenceConfidence = (): number =>
        minHandPresenceConfidence;
    const setMinHandPresenceConfidence = (num: number) =>
        (minHandPresenceConfidence = num);

    const getMinTrackingConfidence = (): number => minTrackingConfidence;
    const setMinTrackingConfidence = (num: number) =>
        (minTrackingConfidence = num);

    const getInterfaceDelegate = (): InterfaceDelegate => delegate;
    const setInterfaceDelegate = (del: InterfaceDelegate) => (delegate = del);

    const getDrawingMode = (): number => drawingMode;
    const setDrawingMode = (mode: number) => (drawingMode = mode);

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

    const detectHand = (
        video: HTMLVideoElement
    ): HandLandmarkerResults | null => {
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

    const draw = (
        mirrored: boolean,
        results: HandLandmarkerResults | null | undefined,
        width: number,
        height: number
    ) => {
        if (results) {
            Drawing3d.clearScene();

            const objGroup: Object3D<Object3DEventMap> = new Object3D();
            let model: Object3D<Object3DEventMap> | null = null;

            if (drawingMode === CONNECTION_HAND_LANDMARKS) {
                model = drawHandConnection(
                    mirrored,
                    results.landmarks,
                    ConnectionIndexes[CONNECTION_HAND_LANDMARKS],
                    width,
                    height
                );
            } else if (drawingMode === CONNECTION_HAND_LANDMARKS_POINTS) {
                model = drawLandmarkPoints(
                    mirrored,
                    results.landmarks,
                    width,
                    height
                );
            }

            if (model) {
                objGroup.add(model);
            }

            Drawing3d.addToScene(objGroup);
            Drawing3d.render();
        }
    };

    const drawLandmarkPoints = (
        mirrored: boolean,
        landmarks: NormalizedLandmark[][],
        width: number,
        height: number
    ): Object3D<Object3DEventMap> | null => {
        if (landmarks) {
            const pointGroups: Object3D<Object3DEventMap> = new Object3D();

            const offsetX: number = width / 2;
            const offsetY: number = height / 2;
            const dist = Drawing3d.calculateDistance(height);

            landmarks.forEach((landmark: NormalizedLandmark[]) => {
                landmark.forEach((data: NormalizedLandmark) => {
                    const circleObjGroup = new Object3D();

                    const x = (width * data.x - offsetX) * (mirrored ? -1 : 1);
                    const y = -height * data.y + offsetY;
                    const scaleFactor =
                        ((dist * data.z) / dist) * -SCALE_FACTOR + BASE_SCALE;

                    const circleGeo = new CircleGeometry(
                        CIRCLE_RADIUS,
                        CIRCLE_SEGMENTS
                    );
                    const circleMat = new MeshBasicMaterial({
                        depthTest: true,
                        depthWrite: true,
                        color: "white",
                        side: DoubleSide,
                    });

                    const circle = new Mesh(circleGeo, circleMat);

                    circleObjGroup.add(circle);
                    circleObjGroup.position.set(x, y, dist);
                    circleObjGroup.scale.set(scaleFactor, scaleFactor, 1);

                    pointGroups.add(circleObjGroup);
                });
            });

            return pointGroups;
        }

        return null;
    };

    const drawHandConnection = (
        mirrored: boolean,
        landmarks: NormalizedLandmark[][],
        connectionData: ConnectionData,
        width: number,
        height: number
    ): Object3D<Object3DEventMap> | null => {
        if (landmarks) {
            const groups: Object3D<Object3DEventMap> = new Object3D();

            const offsetX: number = width / 2;
            const offsetY: number = height / 2;
            const dist = Drawing3d.calculateDistance(height);

            landmarks.forEach((landmark: NormalizedLandmark[]) => {
                let avgScaleFactor: number = 0;
                const points: Vector3[] = [];

                landmark.forEach((point: NormalizedLandmark) => {
                    const x = (width * point.x - offsetX) * (mirrored ? -1 : 1);
                    const y = -height * point.y + offsetY;
                    const scaleFactor =
                        ((dist * point.z) / dist) * -SCALE_FACTOR + BASE_SCALE;
                    avgScaleFactor += scaleFactor;

                    const vector = new Vector3(x, y, dist);
                    points.push(vector);
                });

                avgScaleFactor /= landmark.length;
                const bufferGeo = new BufferGeometry().setFromPoints(points);
                bufferGeo.setIndex(connectionData.connectionIndex);

                const geo = new LineSegmentsGeometry();
                geo.setPositions(
                    bufferGeo.toNonIndexed().getAttribute("position")
                        .array as Float32Array
                );

                const lineWidth = 0.0075 * avgScaleFactor;

                const material = new LineMaterial({
                    color: connectionData.color,
                    linewidth: lineWidth < 0 ? 0.001 : lineWidth,
                    alphaToCoverage: true,
                    worldUnits: false,
                });

                const lines = new LineSegments2(geo, material);
                groups.add(lines);
            });

            return groups;
        }

        return null;
    };

    return {
        CONNECTION_HAND_LANDMARKS,
        CONNECTION_HAND_LANDMARKS_POINTS,
        CONFIG_MIN_DETECTION_CONFIDENCE,
        CONFIG_MAX_DETECTION_CONFIDENCE,
        CONFIG_MIN_PRESENCE_CONFIDENCE,
        CONFIG_MAX_PRESENCE_CONFIDENCE,
        CONFIG_MIN_TRACKING_CONFIDENCE,
        CONFIG_MAX_TRACKING_CONFIDENCE,
        CONFIG_MIN_HAND_NUMBER,
        CONFIG_MAX_HAND_NUMBER,
        CONFIG_DEFAULT_HAND_SLIDER_STEP,
        CONFIG_DEFAULT_CONFIDENCE_SLIDER_STEP,
        initModel,
        getAvailableMode,
        getRunningMode,
        setRunningMode,
        getNumOfHands,
        setNumOfHands,
        getMinHandDetectionConfidence,
        setMinHandDetectionConfidence,
        getMinHandPresenceConfidence,
        setMinHandPresenceConfidence,
        getMinTrackingConfidence,
        setMinTrackingConfidence,
        getInterfaceDelegate,
        setInterfaceDelegate,
        getDrawingMode,
        setDrawingMode,
        updateModelConfig,
        isModelUpdating,
        detectHand,
        draw,
    };
})();

export default HandLandmarkDetection;