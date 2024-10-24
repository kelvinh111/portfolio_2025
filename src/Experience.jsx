import { useGLTF, useTexture, OrbitControls, Sparkles, MeshTransmissionMaterial, useFBO, Environment, shaderMaterial } from '@react-three/drei';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import portalVertexShader from './shaders/portal/vertex.glsl';
import portalFragmentShader from './shaders/portal/fragment.glsl';
import * as THREE from 'three';
import { useRef } from 'react';
import { useControls } from 'leva';

const loader = new THREE.TextureLoader();
const texture0 = loader.load("./4.png");
texture0.minFilter = THREE.NearestFilter;
texture0.magFilter = THREE.NearestFilter;
texture0.wrapS = THREE.RepeatWrapping;
texture0.wrapT = THREE.RepeatWrapping;

const objectNames = [
    "book", "chair2", "curtain", "coffee", "window1", "window2",
    "computer", "desk_lamp", "ceiling", "wall1", "wall2", "floor",
    "desk", "keyboard", "mouse", "plant1", "plant2", "plant3",
    "floor_lamp", "curtain_stick", "poster1", "poster2", "poster3", "phone"
];

const glasses = ['window1glass1', 'window1glass2', 'window2glass1', 'window2glass2'];

const PortalMaterial = shaderMaterial(
    {
        iTime: 0,
        iMouse: new THREE.Vector4(),
        iResolution: new THREE.Vector3(),
        iChannel0: texture0,
        uSunColor: new THREE.Color(),
        uLightColor: new THREE.Color(),
        uDarkColor: new THREE.Color(),
        uBaseSkyColor: new THREE.Color(),
    },
    portalVertexShader,
    portalFragmentShader
);

extend({ PortalMaterial });

export default function Experience() {
    // Leva controls for tweaking colors
    const { sunColor, lightColor, darkColor, baseSkyColor } = useControls({
        sunColor: { value: '#0013ba' },       // Initial value for sunColor in hex
        lightColor: { value: '#ffffff' },     // Initial value for lightColor in hex
        darkColor: { value: '#9e9ef5' },      // Initial value for darkColor in hex
        baseSkyColor: { value: '#ff8080' },   // Initial value for baseSkyColor in hex
    });

    const normalMap = useTexture("./model/dirt1.png");
    normalMap.wrapS = normalMap.wrapT = 1000;

    const buffer = useFBO();

    const sceneRef = useRef();
    const glassRefs = useRef([]);
    const planeRef = useRef();
    const portalMaterial = useRef();

    const { nodes } = useGLTF('./model/room19.glb', true, (loader) => {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('draco/');
        loader.setDRACOLoader(dracoLoader);
    });

    const textures = {};
    objectNames.forEach((name) => {
        const texture = useTexture(`./model/${name}.jpg`);
        texture.flipY = false;
        textures[name] = texture;
    });

    useFrame((state, delta) => {
        const planeGeometry = planeRef.current.geometry;
        const planeScale = planeRef.current.scale;
        const planeWidth = planeGeometry.parameters.width * planeScale.x;
        const planeHeight = planeGeometry.parameters.height * planeScale.y;

        portalMaterial.current.iResolution.set(planeWidth, planeHeight, 1);
        portalMaterial.current.iTime += delta;

        planeRef.current.visible = true;
        glassRefs.current.forEach(ref => ref.visible = false);

        state.gl.setRenderTarget(buffer);
        state.gl.render(state.scene, state.camera);
        state.gl.setRenderTarget(null);

        planeRef.current.visible = false;
        glassRefs.current.forEach(ref => ref.visible = true);
    });

    return (
        <>
            <OrbitControls makeDefault target={[-3.2, 1.4, -3.5]} />
            <group ref={sceneRef}>
                <mesh rotation={[0, 0, 0]} position={[-1.5, 2.5, -4]} ref={planeRef}>
                    <planeGeometry args={[4.5, 4]} />
                    <portalMaterial
                        ref={portalMaterial}
                        uSunColor={new THREE.Color(sunColor)}         // Leva controlled color
                        uLightColor={new THREE.Color(lightColor)}     // Leva controlled color
                        uDarkColor={new THREE.Color(darkColor)}       // Leva controlled color
                        uBaseSkyColor={new THREE.Color(baseSkyColor)} // Leva controlled color
                    />
                </mesh>
                {objectNames.map((name) => (
                    <mesh key={name} geometry={nodes[name]?.geometry} position={nodes[name]?.position} rotation={nodes[name]?.rotation}>
                        <meshBasicMaterial map={textures[name]} />
                    </mesh>
                ))}
            </group>
            {glasses.map((name, index) => (
                <mesh
                    key={name}
                    geometry={nodes[name]?.geometry}
                    position={nodes[name]?.position}
                    rotation={nodes[name]?.rotation}
                    ref={ref => (glassRefs.current[index] = ref)}
                >
                    <MeshTransmissionMaterial
                        transmission={1}
                        roughness={0.01}
                        thickness={0.01}
                        normalMap={normalMap}
                        normalScale={[0.4, 0.4]}
                        color={"#ffffff"}
                        buffer={buffer.texture}
                        side={THREE.BackSide}
                    />
                </mesh>
            ))}
            <Environment files="./AdobeStock_404915950_Preview.jpeg" />
            <Sparkles size={2} scale={[3, 2, 3]} position={[-2, 1, -2]} speed={0.2} count={50} />
        </>
    );
}
