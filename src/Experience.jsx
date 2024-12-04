import * as THREE from 'three';
import { useGLTF, useTexture, Sparkles, MeshTransmissionMaterial, useFBO, Environment, shaderMaterial, Html } from '@react-three/drei';
import { useFrame, extend, useThree, useLoader } from '@react-three/fiber';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { useRef, useState, useEffect } from 'react';
import { useControls, button } from 'leva';
import CameraControls from 'camera-controls';
import { isMobile } from 'react-device-detect';
import skyVertexShader from './shaders/sky/vertex.glsl';
import skyFragmentShader from './shaders/sky/fragment.glsl';

export default function Experience() {
    const buffer = useFBO();
    const sceneRef = useRef();
    const glassRefs = useRef([]);
    const planeRef = useRef();
    const skyMaterial = useRef();
    const cameraControlsRef = useRef();
    const { camera, gl } = useThree();
    const mousePosition = useRef(new THREE.Vector2());
    const targetPosition = useRef(new THREE.Vector2(0, 0));

    // Load the scene
    const { nodes } = useGLTF('./scene.glb', true, (loader) => {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('draco/');
        loader.setDRACOLoader(dracoLoader);
    });

    // Scene objects
    const textureNames = [
        'book', 'chair2', 'curtain', 'coffee', 'window1', 'window2',
        'computer', 'desk_lamp', 'ceiling', 'wall1', 'wall2', 'floor',
        'desk', 'keyboard', 'mouse', 'plant1', 'plant2', 'plant3',
        'floor_lamp', 'curtain_stick', 'poster1', 'poster2', 'poster3',
    ];

    const texturePaths = textureNames.map((name) => `./${name}.jpg`);

    // Call useTexture once with an array of paths
    const textures = useTexture(texturePaths);

    // Set flipY property for all textures
    textures.forEach((texture) => {
        texture.flipY = false;
    });

    // Map textures to object names
    const objectsTextures = {};
    textureNames.forEach((name, index) => {
        objectsTextures[name] = textures[index];
    });


    // Windows glass effect
    const windows = ['window1glass1', 'window1glass2', 'window2glass1', 'window2glass2'];
    const windowNormalMap = useTexture("./window_normal.png");
    windowNormalMap.wrapS = windowNormalMap.wrapT = 1000;

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

    const sunColorO = '#ff5c98';
    const lightColorO = '#ffffff';
    const darkColorO = '#424296';
    const baseSkyColorO = '#151c5c';
    const planePositionO = [35, 65, -300]
    const planeSizeO = [400, 260]

    if (window.location.search.includes('?debug')) {
        var { sunColor, lightColor, darkColor, baseSkyColor, planePosition, planeSize } = useControls({
            sunColor: { value: sunColorO },
            lightColor: { value: lightColorO },
            darkColor: { value: darkColorO },
            baseSkyColor: { value: baseSkyColorO },
            planePosition: { value: planePositionO, step: 0.1 },
            planeSize: { value: planeSizeO, step: 0.5 },
            logCameraPosition: button(() => {
                if (cameraControlsRef.current) {
                    const cameraPosition = camera.position;
                    const targetPosition = cameraControlsRef.current.getTarget(new THREE.Vector3());
                    console.log('Camera Position:', cameraPosition);
                    console.log('Target Position:', targetPosition);
                } else {
                    console.log('Camera Controls not initialized');
                }
            }),
        });
    } else {
        var sunColor = sunColorO;
        var lightColor = lightColorO;
        var darkColor = darkColorO
        var baseSkyColor = baseSkyColorO
        var planePosition = planePositionO
        var planeSize = planeSizeO
    }

    // Camera
    CameraControls.install({ THREE });
    extend({ CameraControls });

    const cameraLimits = {
        minAzimuthAngle: 0.2,
        maxAzimuthAngle: 0.28,
        minPolarAngle: 1.58,
        maxPolarAngle: 1.72,
        minDistance: 3.1,
        maxDistance: 3.1,
    };

    function resetCamera() {
        if (cameraControlsRef.current) {
            cameraControlsRef.current.setLookAt(
                -2.4, 1.05, -0.6, // camera position
                -3.2, 1.4, -3.5, // Target position
                true // Smooth transition
            );
        }
    }

    // Set the initial camera position
    useEffect(() => {
        resetCamera()
    }, [camera]);

    useEffect(() => {
        if (cameraControlsRef.current) {
            // Disable mouse wheel zooming
            cameraControlsRef.current.mouseButtons.wheel = CameraControls.ACTION.NONE;

            // Disable mouse drag interactions
            cameraControlsRef.current.mouseButtons.left = CameraControls.ACTION.NONE;
            cameraControlsRef.current.mouseButtons.middle = CameraControls.ACTION.NONE;
            cameraControlsRef.current.mouseButtons.right = CameraControls.ACTION.NONE;

            // Optionally, disable touch interactions if needed
            cameraControlsRef.current.touches.one = CameraControls.ACTION.NONE; // One finger touch
            cameraControlsRef.current.touches.two = CameraControls.ACTION.NONE; // Two finger touch
            cameraControlsRef.current.touches.three = CameraControls.ACTION.NONE; // Three finger touch
        }
    }, []);

    // Mouse & touch
    useEffect(() => {
        gl.domElement.style.touchAction = 'none';

        const handleMouseMove = (event) => {
            // Normalize mouse position to range [0, 1]
            mousePosition.current.x = event.clientX / window.innerWidth;
            mousePosition.current.y = event.clientY / window.innerHeight;
        };

        const handleTouchMove = (event) => {
            // event.preventDefault(); // Prevent default touch behavior like scrolling
            if (event.touches.length > 0) {
                const touch = event.touches[0];
                mousePosition.current.x = touch.clientX / window.innerWidth;
                mousePosition.current.y = touch.clientY / window.innerHeight;
            }
        };

        gl.domElement.addEventListener('mousemove', handleMouseMove);
        gl.domElement.addEventListener('touchmove', handleTouchMove, { passive: true });

        return () => {
            gl.domElement.removeEventListener('mousemove', handleMouseMove);
            gl.domElement.removeEventListener('touchmove', handleTouchMove);
        };
    }, [gl.domElement]);


    // Light

    // Sky light from outside
    const directionalLightRef = useRef();

    // Desk lamp light
    const [isDeskLampHovered, setIsDeskLampHovered] = useState(false);
    const [islampLabelConfirmed, setIslampLabelConfirmed] = useState(false);
    const [isLightOff, setIsLightOff] = useState(true);

    const handleDeskLampClick = () => {
        setIsLightOff(prev => !prev);
        setIslampLabelConfirmed(true);
    };

    // Computer screen
    const computerScreenPosition = nodes["computer_screen"]?.position;
    const computerScreenScale = nodes["computer_screen"]?.scale;
    const computerScreenRef = useRef();

    // Zoom
    const [isZoomedIn, setIsZoomedIn] = useState(false);
    const originalLimits = { ...cameraLimits };

    function handleZoomToComputerScreen() {
        const computerScreen = computerScreenRef.current;
        if (!computerScreen || !cameraControlsRef.current) return;

        // Toggle zoom state
        if (isZoomedIn) {
            setIsZoomedIn(false);
            cameraControlsRef.current.minAzimuthAngle = originalLimits.minAzimuthAngle;
            cameraControlsRef.current.maxAzimuthAngle = originalLimits.maxAzimuthAngle;
            cameraControlsRef.current.minPolarAngle = originalLimits.minPolarAngle;
            cameraControlsRef.current.maxPolarAngle = originalLimits.maxPolarAngle;
            setTimeout(() => {
                resetCamera()
            })
        } else {
            setIsZoomedIn(true);
            cameraControlsRef.current.minAzimuthAngle = null;
            cameraControlsRef.current.maxAzimuthAngle = null;
            cameraControlsRef.current.minPolarAngle = null;
            cameraControlsRef.current.maxPolarAngle = null;

            setTimeout(() => {
                if (cameraControlsRef.current) {
                    cameraControlsRef.current.setLookAt(
                        -2.8, 1.29, -2.334, // camera position
                        -3.42, 1.19, -2.56, // Target position
                        true
                    );
                }
            })
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
                            color={"#cb79ff"}
                        />
                    </>
                )}

                {/* Objects */}
                {textureNames.map((name) => {
                    const isLamp = name === 'desk_lamp';
                    let material;

                    if (isLamp && isDeskLampHovered) {
                        material = <meshBasicMaterial color="#cc99ff" transparent opacity={0.6} />;
                    } else if (isLightOff) {
                        material = <meshPhongMaterial map={objectsTextures[name]} />;
                    } else {
                        material = <meshBasicMaterial color="#cccbff" map={objectsTextures[name]} />;
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
                        position-x={0.01}
                        position-y={-0.095}
                        scale-x={computerScreenScale.x}
                        scale-y={computerScreenScale.y}
                        scale-z={computerScreenScale.z}
                        distanceFactor={0.34}
                        wrapperClass="computer-screen"
                    >
                        <iframe src="http://192.168.0.13:1234" style={{ border: "none" }} />
                        {/* <iframe src="https://static.kelvinhung.uk/" style={{ border: "none" }} /> */}
                    </Html>
                    <Html
                        position-x={isZoomedIn ? 0 : -0.05}
                        position-y={isZoomedIn ? -0.34 : 0.23}
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
                <Environment files="./env.hdr" />

                {/* Sparkles */}
                <Sparkles
                    size={isMobile ? 0.4 : 1.2}
                    scale={[3, 2, 1.6]}
                    position={[-2.4, 1.6, -2.2]}
                    speed={0.2}
                    count={60}
                    color={"#ffeeaa"}
                    opacity={isMobile ? 0.2 : 0.3}
                    renderOrder={0}
                />
            </group>
        </>
    );
}
