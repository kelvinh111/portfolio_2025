import * as THREE from 'three';
import { useGLTF, useTexture, Sparkles, MeshTransmissionMaterial, useFBO, Environment, shaderMaterial, Html } from '@react-three/drei';
import { useFrame, extend, useThree } from '@react-three/fiber';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { useRef, useState, useEffect } from 'react';
import { useControls } from 'leva';
import CameraControls from 'camera-controls';
import skyVertexShader from './shaders/sky/vertex.glsl';
import skyFragmentShader from './shaders/sky/fragment.glsl';

export default function Experience() {
    const objects = [
        "book", "chair2", "curtain", "coffee", "window1", "window2",
        "computer", "desk_lamp", "ceiling", "wall1", "wall2", "floor",
        "desk", "keyboard", "mouse", "plant1", "plant2", "plant3",
        "floor_lamp", "curtain_stick", "poster1", "poster2", "poster3"
    ];

    const windows = ['window1glass1', 'window1glass2', 'window2glass1', 'window2glass2'];

    // Camera
    const cameraLimits = {
        minAzimuthAngle: 0.2,
        maxAzimuthAngle: 0.28,
        minPolarAngle: 1.58,
        maxPolarAngle: 1.72,
        minDistance: 3.1,
        maxDistance: 3.1,
    };

    CameraControls.install({ THREE });
    extend({ CameraControls });

    // Sky
    const skyTexture = useTexture('./sky.png');
    skyTexture.minFilter = THREE.NearestFilter;
    skyTexture.magFilter = THREE.NearestFilter;
    skyTexture.wrapS = skyTexture.wrapT = THREE.RepeatWrapping;

    const SkyMaterial = shaderMaterial(
        {
            uTime: 0,
            uMouse: new THREE.Vector4(),
            uChannel0: skyTexture,
            uSunColor: new THREE.Color(),
            uLightColor: new THREE.Color(),
            uDarkColor: new THREE.Color(),
            uBaseSkyColor: new THREE.Color(),
        },
        skyVertexShader,
        skyFragmentShader
    );

    extend({ SkyMaterial });

    const { sunColor, lightColor, darkColor, baseSkyColor, planePosition, planeSize } = useControls({
        sunColor: { value: '#d65e8b' },
        lightColor: { value: '#ffffff' },
        darkColor: { value: '#1e1e7c' },
        baseSkyColor: { value: '#151c5c' },
        planePosition: { value: [35, 65, -300], step: 0.1 },
        planeSize: { value: [400, 260], step: 0.5 },
    });

    // Windows
    const windowNormalMap = useTexture("./window_normal.png");
    windowNormalMap.wrapS = windowNormalMap.wrapT = 1000;

    const buffer = useFBO();
    const sceneRef = useRef();
    const glassRefs = useRef([]);
    const planeRef = useRef();
    const skyMaterial = useRef();
    const cameraControlsRef = useRef();
    const { camera, gl } = useThree();

    const { nodes } = useGLTF('./room22.glb', true, (loader) => {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('draco/');
        loader.setDRACOLoader(dracoLoader);
    });

    const objectsTextures = {};
    objects.forEach((name) => {
        const texture = useTexture(`./${name}.jpg`);
        texture.flipY = false;
        objectsTextures[name] = texture;
    });

    // Mouse move camera controls
    const mousePosition = useRef(new THREE.Vector2());
    const targetPosition = useRef(new THREE.Vector2(0, 0));

    function resetCamera() {
        camera.position.set(-2.4, 1.05, -0.6)
        if (cameraControlsRef.current) {
            cameraControlsRef.current.setLookAt(
                camera.position.x,
                camera.position.y,
                camera.position.z,
                -3.2, 1.4, -3.5, // Target position
                true // Smooth transition
            );
        }
    }

    // Log the camera position and set it dynamically
    useEffect(() => {
        resetCamera()
    }, [camera]);

    useEffect(() => {
        if (cameraControlsRef.current) {
            cameraControlsRef.current.mouseButtons.wheel = CameraControls.ACTION.NONE;
        }
    }, []);

    useEffect(() => {
        const handleMouseMove = (event) => {
            // Normalize mouse position to range [0, 1]
            mousePosition.current.x = event.clientX / window.innerWidth;
            mousePosition.current.y = event.clientY / window.innerHeight;
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const directionalLightRef = useRef();

    // State to manage desk lamp light
    const [isDeskLampHovered, setIsDeskLampHovered] = useState(false);
    const [islampLabelConfirmed, setIslampLabelConfirmed] = useState(false);
    const [isLightOff, setIsLightOff] = useState(true);

    // Click handler for the desk lamp
    const handleDeskLampClick = () => {
        setIsLightOff(prev => !prev);
        setIslampLabelConfirmed(true);
    };

    const computerScreenPosition = nodes["computer_screen"]?.position;
    const computerScreenScale = nodes["computer_screen"]?.scale;

    // Reference to the computer screen mesh
    const computerScreenRef = useRef();

    // State to manage zoom
    const [isZoomedIn, setIsZoomedIn] = useState(false);

    // Function to handle zooming into the computer screen
    function handleZoomToComputerScreen() {
        const computerScreen = computerScreenRef.current;
        if (!computerScreen || !cameraControlsRef.current) return;

        // Toggle zoom state
        if (isZoomedIn) {
            // Reset camera to initial position
            // cameraControlsRef.current.reset(true);
            resetCamera()
            setIsZoomedIn(false);
        } else {
            // Get the world position and orientation of the computer screen
            const screenWorldPosition = new THREE.Vector3();
            computerScreen.getWorldPosition(screenWorldPosition);

            const screenWorldQuaternion = new THREE.Quaternion();
            computerScreen.getWorldQuaternion(screenWorldQuaternion);

            // Calculate the screen's normal vector (direction it's facing)
            const screenNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(screenWorldQuaternion);

            // Get the size of the computer screen
            const box = new THREE.Box3().setFromObject(computerScreen);
            const size = new THREE.Vector3();
            box.getSize(size);
            const screenHeight = size.y;
            const screenWidth = size.x;

            // Calculate the camera's field of view in radians
            const fovY = (camera.fov * Math.PI) / 180;
            const aspect = camera.aspect;
            const fovX = 2 * Math.atan(Math.tan(fovY / 2) * aspect);

            // Compute the distance needed to frame the screen without distortion
            const distanceY = (screenHeight / 2) / Math.tan(fovY / 2) * 1.3;
            const distanceX = (screenWidth / 2) / Math.tan(fovX / 2) * 1.3;
            const distance = Math.max(distanceY, distanceX);

            // Determine the new camera position
            const cameraPosition = screenWorldPosition
                .clone()
                .add(screenNormal.multiplyScalar(distance));

            // Adjust the camera's up vector
            const screenUp = new THREE.Vector3(0, 1, 0).applyQuaternion(screenWorldQuaternion);
            camera.up.copy(screenUp);
            camera.updateProjectionMatrix();

            // Smoothly move the camera to the new position and look at the screen
            cameraControlsRef.current.setLookAt(
                cameraPosition.x,
                cameraPosition.y,
                cameraPosition.z,
                screenWorldPosition.x,
                screenWorldPosition.y - 0.1,
                screenWorldPosition.z,
                true // Enable smooth transition
            );

            setIsZoomedIn(true);
        }
    }

    useFrame((state, delta) => {
        skyMaterial.current.uTime += delta;

        planeRef.current.visible = true;
        glassRefs.current.forEach(ref => ref.visible = false);

        state.gl.setRenderTarget(buffer);
        state.gl.render(state.scene, state.camera);
        state.gl.setRenderTarget(null);

        planeRef.current.visible = false;
        glassRefs.current.forEach(ref => ref.visible = true);

        if (!isZoomedIn) {
            targetPosition.current.x = THREE.MathUtils.lerp(
                -cameraLimits.minAzimuthAngle,
                -cameraLimits.maxAzimuthAngle,
                1 - mousePosition.current.x
            );

            targetPosition.current.y = THREE.MathUtils.lerp(
                cameraLimits.minPolarAngle,
                cameraLimits.maxPolarAngle,
                1 - mousePosition.current.y
            );

            cameraControlsRef.current.rotateTo(-targetPosition.current.x, targetPosition.current.y, true);
        }

        cameraControlsRef.current?.update(delta);
    });

    return (
        <>
            <cameraControls
                ref={cameraControlsRef}
                args={[camera, gl.domElement]}
                minAzimuthAngle={cameraLimits.minAzimuthAngle} // Limit horizontal rotation
                maxAzimuthAngle={cameraLimits.maxAzimuthAngle}
                minPolarAngle={cameraLimits.minPolarAngle} // Limit vertical rotation
                maxPolarAngle={cameraLimits.maxPolarAngle}
                minDistance={cameraLimits.minDistance} // Minimum zoom distance
                maxDistance={cameraLimits.maxDistance} // Maximum zoom distance
            />
            <group ref={sceneRef}>
                {/* Sky */}
                <mesh rotation={[0, 0, 0]} position={planePosition} ref={planeRef}>
                    <planeGeometry args={planeSize} />
                    <skyMaterial
                        ref={skyMaterial}
                        uSunColor={new THREE.Color(sunColor)}
                        uLightColor={new THREE.Color(lightColor)}
                        uDarkColor={new THREE.Color(darkColor)}
                        uBaseSkyColor={new THREE.Color(baseSkyColor)}
                    />
                </mesh>

                {/* Directional Light */}
                {isLightOff && (
                    <>
                        <directionalLight
                            ref={directionalLightRef}
                            position={[10, 20, 15]}
                            intensity={1.5}
                            color={'#7461d3'}
                        />
                        <pointLight
                            position={[computerScreenPosition?.x + 0.4, computerScreenPosition?.y, computerScreenPosition?.z]}
                            intensity={0.3}
                            distance={1}
                            decay={2}
                            color={"#ffffff"}
                        />
                    </>
                )}

                {/* Objects */}
                {objects.map((name) => {
                    const isLamp = name === 'desk_lamp';
                    let material;

                    if (isLamp && isDeskLampHovered) {
                        material = <meshBasicMaterial color="#cc99ff" transparent opacity={0.6} />;
                    } else if (isLightOff) {
                        material = <meshPhongMaterial map={objectsTextures[name]} />;
                    } else {
                        material = <meshBasicMaterial map={objectsTextures[name]} />;
                    }

                    return (
                        <mesh
                            key={name}
                            geometry={nodes[name]?.geometry}
                            position={nodes[name]?.position}
                            rotation={nodes[name]?.rotation}
                            scale={nodes[name]?.scale}
                            onClick={isLamp ? handleDeskLampClick : undefined}
                            onPointerOver={() => {
                                if (isLamp) {
                                    setIsDeskLampHovered(true);
                                    document.body.style.cursor = "pointer";
                                }
                            }}
                            onPointerOut={() => {
                                if (isLamp) {
                                    setIsDeskLampHovered(false);
                                    document.body.style.cursor = "auto";
                                }
                            }}
                        >
                            {material}
                            {/* Desk Lamp light hint label */}
                            {isLamp && (
                                <Html
                                    position={[0.15, 0, 1]}
                                    distanceFactor={3}
                                >
                                    <span
                                        onClick={handleDeskLampClick}
                                        onPointerOver={() => { setIsDeskLampHovered(true); }}
                                        onPointerOut={() => { setIsDeskLampHovered(false); }}
                                        className={`label desk-lamp-label ${islampLabelConfirmed ? 'hidden' : ''} ${isDeskLampHovered ? 'active' : ''}`}
                                    >
                                        Turn on the light
                                    </span>
                                </Html>
                            )}
                        </mesh>
                    );
                })}

                {/* Computer screen with iframe and zoom button */}
                <mesh
                    ref={computerScreenRef}
                    geometry={nodes["computer_screen"]?.geometry}
                    position={nodes["computer_screen"]?.position}
                    rotation={nodes["computer_screen"]?.rotation}
                    scale={nodes["computer_screen"]?.scale}
                    visible={false}
                >
                    <Html
                        transform
                        // position-x={computerScreenPosition.x + 0.017}
                        // position-y={computerScreenPosition.y - 0.095}
                        // position-z={computerScreenPosition.z}
                        // rotation={computerScreenRotation}
                        position-x={0.01}
                        position-y={-0.095}
                        scale-x={computerScreenScale.x}
                        scale-y={computerScreenScale.y}
                        scale-z={computerScreenScale.z}
                        distanceFactor={0.34}
                        wrapperClass="computer-screen"
                    >
                        <iframe src="http://localhost:1234" style={{ border: "none" }} />
                    </Html>
                    <Html
                        position-x={isZoomedIn ? 0 : -0.05}
                        position-y={isZoomedIn ? -0.33 : 0.23}
                        distanceFactor={2.5}
                    >
                        <span
                            onClick={handleZoomToComputerScreen}
                            className="label"
                        >
                            {isZoomedIn ? 'Go back' : 'View my page'}
                        </span>
                    </Html>
                </mesh>


                {/* The Zoom Button */}

                {/* Windows */}
                {windows.map((name, index) => (
                    <mesh
                        key={name}
                        geometry={nodes[name]?.geometry}
                        position={nodes[name]?.position}
                        rotation={nodes[name]?.rotation}
                        ref={ref => (glassRefs.current[index] = ref)}
                        renderOrder={1}
                    >
                        <MeshTransmissionMaterial
                            transmission={1.0}
                            roughness={0}
                            thickness={0}
                            normalMap={windowNormalMap}
                            normalScale={[0.4, 0.4]}
                            color={"#ffffff"}
                            buffer={buffer.texture}
                            side={THREE.BackSide}
                            transparent={true}
                            depthWrite={true}
                        />
                    </mesh>
                ))}

                {/* Environment background */}
                <Environment files="./env.jpg" />

                {/* Sparkles */}
                <Sparkles
                    size={1.2}
                    scale={[3, 2, 1.6]}
                    position={[-2.4, 1.6, -2.2]}
                    speed={0.2}
                    count={60}
                    color={"#ffffff"}
                    opacity={0.3}
                    renderOrder={0}
                />
            </group>
        </>
    );
}
