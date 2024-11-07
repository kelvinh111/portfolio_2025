import * as THREE from 'three';
import { useGLTF, useTexture, OrbitControls, Sparkles, MeshTransmissionMaterial, useFBO, Environment, shaderMaterial, Html } from '@react-three/drei';
import { useFrame, extend } from '@react-three/fiber';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { useRef, useState } from 'react';
import { useControls } from 'leva';
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

    // Sky texture
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

    const windowNormalMap = useTexture("./window_normal.png");
    windowNormalMap.wrapS = windowNormalMap.wrapT = 1000;

    const buffer = useFBO();
    const sceneRef = useRef();
    const glassRefs = useRef([]);
    const planeRef = useRef();
    const skyMaterial = useRef();
    const pointLightRef = useRef();

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

    useFrame((state, delta) => {
        skyMaterial.current.uTime += delta;

        planeRef.current.visible = true;
        glassRefs.current.forEach(ref => ref.visible = false);

        state.gl.setRenderTarget(buffer);
        state.gl.render(state.scene, state.camera);
        state.gl.setRenderTarget(null);

        planeRef.current.visible = false;
        glassRefs.current.forEach(ref => ref.visible = true);
    });

    const directionalLightRef = useRef();

    // State to manage desk lamp light
    const [isHovered, setIsHovered] = useState(false);
    const [islampLabelConfirmed, setIslampLabelConfirmed] = useState(false);
    const [isLightOff, setIsLightOff] = useState(true);

    // Click handler for the desk lamp
    const handleDeskLampClick = () => {
        setIsLightOff(prev => !prev);
        setIslampLabelConfirmed(true);
    };

    const computerScreenPosition = nodes["computer_screen"]?.position;
    const computerScreenRotation = nodes["computer_screen"]?.rotation;
    const computerScreenScale = nodes["computer_screen"]?.scale;

    return (
        <>
            <OrbitControls makeDefault target={[-3.2, 1.4, -3.5]} />
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
                            ref={pointLightRef}
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
                    const isLamp = name === 'desk_lamp'
                    let material;

                    if (isLamp && isHovered) {
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
                                    setIsHovered(true);
                                    document.body.style.cursor = "pointer";
                                }
                            }}
                            onPointerOut={() => {
                                if (isLamp) {
                                    setIsHovered(false);
                                    document.body.style.cursor = "auto";
                                }
                            }}
                        >
                            {material}
                            {/* Desk Lamp light hint label */}
                            {isLamp &&  (
                                <Html
                                    position={[0, 0, 0]}
                                    distanceFactor={3}
                                >
                                    <span
                                        onClick={handleDeskLampClick}
                                        className={`desk-lamp-label ${islampLabelConfirmed ? 'hidden' : ''}`}
                                    >
                                        Turn on the light
                                    </span>
                                </Html>
                            )}
                        </mesh>
                    );
                })}

                {/* Computer screen */}
                <Html
                    transform
                    position-x={computerScreenPosition.x + 0.017}
                    position-y={computerScreenPosition.y - 0.095}
                    position-z={computerScreenPosition.z}
                    rotation={computerScreenRotation}
                    scale-x={computerScreenScale.x}
                    scale-y={computerScreenScale.y - 0.1}
                    scale-z={computerScreenScale.z}
                    distanceFactor={0.56}
                    wrapperClass="computer-screen"
                >
                    <iframe src="https://www.webbyawards.com/" style={{ border: "none" }} />
                </Html>

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
                    count={80}
                    color={"#ffffff"}
                    opacity={0.3}
                    renderOrder={0}
                />
            </group>
        </>
    );
}
