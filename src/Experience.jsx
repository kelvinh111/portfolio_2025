import * as THREE from 'three';
import { useGLTF, useTexture, OrbitControls, Sparkles, MeshTransmissionMaterial, useFBO, Environment, shaderMaterial } from '@react-three/drei';
import { useFrame, extend } from '@react-three/fiber';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { useRef } from 'react';
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

    // sky texture
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

    const { sunColor, lightColor, darkColor, baseSkyColor } = useControls({
        sunColor: { value: '#00063e' },
        lightColor: { value: '#000000' },
        darkColor: { value: '#6161a3' },
        baseSkyColor: { value: '#d55959' },
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

    return (
        <>
            <OrbitControls makeDefault target={[-3.2, 1.4, -3.5]} />
            <group ref={sceneRef}>
                {/* Sky */}
                <mesh rotation={[0, 0, 0]} position={[-5, 11, -30]} ref={planeRef}>
                    <planeGeometry args={[50, 40]} />
                    <portalMaterial
                        ref={portalMaterial}
                        uSunColor={new THREE.Color(sunColor)}
                        uLightColor={new THREE.Color(lightColor)}
                        uDarkColor={new THREE.Color(darkColor)}
                        uBaseSkyColor={new THREE.Color(baseSkyColor)}
                    />
                </mesh>

                {/* Objects */}
                {objects.map((name) => (
                    <mesh key={name} geometry={nodes[name]?.geometry} position={nodes[name]?.position} rotation={nodes[name]?.rotation}>
                        <meshBasicMaterial map={objectsTextures[name]} />
                    </mesh>
                ))}
            </group>

            {/* Window glasses */}
            {glasses.map((name, index) => (
                <mesh
                    key={name}
                    geometry={nodes[name]?.geometry}
                    position={nodes[name]?.position}
                    rotation={nodes[name]?.rotation}
                    ref={ref => (glassRefs.current[index] = ref)}
                >
                    <MeshTransmissionMaterial
                        transmission={1.5}
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

            {/* Environment background */}
            {/* <Environment files="./white.jpg" /> */}
            <Environment files="./AdobeStock_404915950_Preview.jpeg" />
            {/* <Environment files="./kloofendal_48d_partly_cloudy_puresky_1k.hdr" /> */}

            {/* Sparkles */}
            <Sparkles size={2} scale={[3, 2, 3]} position={[-2, 1, -2]} speed={0.2} count={50} />
        </>
    );
}
