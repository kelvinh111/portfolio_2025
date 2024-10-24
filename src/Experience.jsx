import { useGLTF, useTexture, OrbitControls, Sparkles, MeshTransmissionMaterial, useFBO, Environment, shaderMaterial } from '@react-three/drei';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'
import * as THREE from 'three';
import { useRef } from 'react';

const loader = new THREE.TextureLoader();
const texture0 = loader.load("./4.png");
texture0.minFilter = THREE.NearestFilter;
texture0.magFilter = THREE.NearestFilter;
texture0.wrapS = THREE.RepeatWrapping;
texture0.wrapT = THREE.RepeatWrapping;


const materialParameters = {
    sunColor: { r: 1.09, g: 0.746, b: 1.828 },
    lightColor: { r: 0.918, g: 2, b: 2 },
    darkColor: { r: 0, g: 0.299, b: 0.73 },
    baseSkyColor: { r: 0.607, g: 0.557, b: 1 },
};

const PortalMaterial = shaderMaterial(
    {
        // uTime: 0,
        // uColorStart: new THREE.Color(1,0,1),
        // uColorEnd: new THREE.Color(0,0,0),
        iTime: 0,
        iMouse: new THREE.Vector4(),
        iResolution: new THREE.Vector3(),
        iChannel0: texture0,
        uSunColor: new THREE.Color(materialParameters.sunColor.r, materialParameters.sunColor.g, materialParameters.sunColor.b),
        uLightColor: new THREE.Color(materialParameters.lightColor.r, materialParameters.lightColor.g, materialParameters.lightColor.b),
        uDarkColor: new THREE.Color(materialParameters.darkColor.r, materialParameters.darkColor.g, materialParameters.darkColor.b),
        uBaseSkyColor: new THREE.Color(materialParameters.baseSkyColor.r, materialParameters.baseSkyColor.g, materialParameters.baseSkyColor.b),
    },
    portalVertexShader,
    portalFragmentShader
)

extend({ PortalMaterial })

const objectNames = [
    "book", "chair2", "curtain", "coffee", "window1", "window2",
    "computer", "desk_lamp", "ceiling", "wall1", "wall2", "floor",
    "desk", "keyboard", "mouse", "plant1", "plant2", "plant3",
    "floor_lamp", "curtain_stick", "poster1", "poster2", "poster3", "phone"
];


const glasses = ['window1glass1', 'window1glass2', 'window2glass1', 'window2glass2'];

export default function Experience() {
    const normalMap = useTexture("./model/dirt1.png");
    normalMap.wrapS = normalMap.wrapT = 1000;

    const buffer = useFBO();

    // References for glass, scene, and plane objects
    const sceneRef = useRef();
    const glassRefs = useRef([]);
    const planeRef = useRef();
    const portalMaterial = useRef()

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

    // Use useFrame to handle rendering order

    useFrame((state, delta) => {
        portalMaterial.current.iResolution.set(window.innerWidth*2, window.innerHeight*1.5, 1)
        portalMaterial.current.iTime += delta

        planeRef.current.visible = true;
        // Hide the glass during the buffer render
        glassRefs.current.forEach(ref => ref.visible = false);

        // Render the scene (including the plane) into the FBO buffer
        state.gl.setRenderTarget(buffer);
        state.gl.render(state.scene, state.camera);
        state.gl.setRenderTarget(null);

        planeRef.current.visible = false;
        // Show the glass after the buffer is rendered
        glassRefs.current.forEach(ref => ref.visible = true);
    });

    return (
        <>
            <OrbitControls makeDefault target={[-3.2, 1.4, -3.5]} />

            {/* All non-glass objects, including the plane */}
            <group ref={sceneRef}>
                {/* Add the plane (which should be visible through the glass) */}
                <mesh rotation={[0, 0, 0]} position={[0, 1, -5]} ref={planeRef}>
                    <planeGeometry args={[10, 10]} /> {/* Width, height */}
                    {/* <meshStandardMaterial color="#5500cc" /> */}
                    <portalMaterial ref={portalMaterial} />
                </mesh>

                {/* Non-glass objects */}
                {objectNames.map((name) => (
                    <mesh key={name} geometry={nodes[name]?.geometry} position={nodes[name]?.position} rotation={nodes[name]?.rotation}>
                        <meshBasicMaterial map={textures[name]} />
                    </mesh>
                ))}
            </group>

            {/* Glass objects */}
            {glasses.map((name, index) => (
                <mesh
                    key={name}
                    geometry={nodes[name]?.geometry}
                    position={nodes[name]?.position}
                    rotation={nodes[name]?.rotation}
                    ref={ref => (glassRefs.current[index] = ref)} // Store the reference
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

            {/* Render the environment (so it's behind everything else) */}
            {/* <Environment preset="city" /> */}
            <Environment files="./AdobeStock_404915950_Preview.jpeg" />
            {/* <Environment background near={1} far={1000} resolution={256}>
                <mesh scale={100}>
                    <sphereGeometry args={[1, 64, 64]} />
                    <meshBasicMaterial color="black" side={THREE.BackSide} />
                </mesh>
            </Environment> */}

            <Sparkles
                size={2}
                scale={[3, 2, 3]}
                position={[-2, 1, -2]}
                speed={0.2}
                count={50}
            />
        </>
    );
}
