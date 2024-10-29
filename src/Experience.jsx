import * as THREE from 'three';
import { useGLTF, useTexture, OrbitControls, Sparkles, MeshTransmissionMaterial, useFBO, Environment, shaderMaterial } from '@react-three/drei';
import { useFrame, extend } from '@react-three/fiber';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { useRef, useState } from 'react';
import { useControls } from 'leva';
import portalVertexShader from './shaders/portal/vertex.glsl';
import portalFragmentShader from './shaders/portal/fragment.glsl';

export default function Experience() {
    const objects = [
        "book", "chair2", "curtain", "coffee", "window1", "window2",
        "computer", "desk_lamp", "ceiling", "wall1", "wall2", "floor",
        "desk", "keyboard", "mouse", "plant1", "plant2", "plant3",
        "floor_lamp", "curtain_stick", "poster1", "poster2", "poster3", "phone"
    ];

    const glasses = ['window1glass1', 'window1glass2', 'window2glass1', 'window2glass2'];

    // Sky texture
    const textureLoader = new THREE.TextureLoader();
    const skyTexture = textureLoader.load("./4.png");
    skyTexture.minFilter = THREE.NearestFilter;
    skyTexture.magFilter = THREE.NearestFilter;
    skyTexture.wrapS = THREE.RepeatWrapping;
    skyTexture.wrapT = THREE.RepeatWrapping;

    const PortalMaterial = shaderMaterial(
        {
            uTime: 0,
            uMouse: new THREE.Vector4(),
            uChannel0: skyTexture,
            uSunColor: new THREE.Color(),
            uLightColor: new THREE.Color(),
            uDarkColor: new THREE.Color(),
            uBaseSkyColor: new THREE.Color(),
        },
        portalVertexShader,
        portalFragmentShader
    );

    extend({ PortalMaterial });

    const { sunColor, lightColor, darkColor, baseSkyColor, planePosition, planeSize } = useControls({
        sunColor: { value: '#d58a5d' },
        lightColor: { value: '#ffffff' },
        darkColor: { value: '#11119a' },
        baseSkyColor: { value: '#0017e8' },
        planePosition: { value: [-9, 36, -106], step: 0.1 },
        planeSize: { value: [180, 120], step: 0.5 },
    });

    const normalMap = useTexture("./dirt1.png");
    normalMap.wrapS = normalMap.wrapT = 1000;

    const buffer = useFBO();

    const sceneRef = useRef();
    const glassRefs = useRef([]);
    const planeRef = useRef();
    const portalMaterial = useRef();

    const { nodes } = useGLTF('./room19.glb', true, (loader) => {
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
        portalMaterial.current.uTime += delta;

        planeRef.current.visible = true;
        glassRefs.current.forEach(ref => ref.visible = false);

        state.gl.setRenderTarget(buffer);
        state.gl.render(state.scene, state.camera);
        state.gl.setRenderTarget(null);

        planeRef.current.visible = false;
        glassRefs.current.forEach(ref => ref.visible = true);
    });

    const directionalLightRef = useRef();

    // State to manage light and material
    const [isLightOn, setIsLightOn] = useState(true);
    const [isPhongMaterial, setIsPhongMaterial] = useState(true);

    // Click handler for the desk lamp
    const handleDeskLampClick = () => {
        setIsLightOn(prev => !prev);
        setIsPhongMaterial(prev => !prev);
    };

    return (
        <>
            <OrbitControls makeDefault target={[-3.2, 1.4, -3.5]} />
            <group ref={sceneRef}>
                {/* Sky */}
                <mesh rotation={[0, 0, 0]} position={planePosition} ref={planeRef}>
                    <planeGeometry args={planeSize} />
                    <portalMaterial
                        ref={portalMaterial}
                        uSunColor={new THREE.Color(sunColor)}
                        uLightColor={new THREE.Color(lightColor)}
                        uDarkColor={new THREE.Color(darkColor)}
                        uBaseSkyColor={new THREE.Color(baseSkyColor)}
                    />
                </mesh>

                {/* Directional Light */}
                {isLightOn && (
                    <directionalLight
                        ref={directionalLightRef}
                        position={[10, 20, 15]} // Position to simulate sunlight angle
                        intensity={1.5} // Adjust brightness
                        color={sunColor}
                        castShadow // Enable shadows
                    />
                )}

                {/* Objects */}
                {objects.map((name) => {
                    const material = (isPhongMaterial
                        ? <meshPhongMaterial map={objectsTextures[name]} />
                        : <meshBasicMaterial map={objectsTextures[name]} />)

                    return (
                        <mesh
                            key={name}
                            geometry={nodes[name]?.geometry}
                            position={nodes[name]?.position}
                            rotation={nodes[name]?.rotation}
                            onClick={name === "desk_lamp" ? handleDeskLampClick : undefined} // Add click handler only for desk_lamp
                        >
                            {material}
                        </mesh>
                    );
                })}
            </group>

            {/* Window glasses */}
            {glasses.map((name, index) => (
                <mesh
                    key={name}
                    geometry={nodes[name]?.geometry}
                    position={nodes[name]?.position}
                    rotation={nodes[name]?.rotation}
                    ref={ref => (glassRefs.current[index] = ref)}
                    renderOrder={1}
                >
                    <MeshTransmissionMaterial
                        transmission={1.2}
                        roughness={0}
                        thickness={0}
                        normalMap={normalMap}
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
            <Environment files="./env3.jpg" />

            {/* Sparkles */}
            <Sparkles
                size={1.2}
                scale={[3, 2, 1.6]}
                position={[-2.2, 1, -2.8]}
                speed={0.2}
                count={60}
                color={"#ffffff"}
                opacity={0.3}
                renderOrder={0}
            />
        </>
    );
}
