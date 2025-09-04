"use client";
import { CameraControls, Environment, Gltf } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useControls } from "leva";
import { useRef, type ComponentRef } from "react";
import Avatar from "./Avatar";

export const Experience = () => {
  const controls = useRef<ComponentRef<typeof CameraControls> | null>(null);

  const { avatar } = useControls("GLB", {
    avatar: {
      value: "ichigo.glb",
      options: ["raiden.glb", "mei.glb"],
    },
  });

  return (
    <>
      <CameraControls
        ref={controls}
        maxPolarAngle={Math.PI / 2}
        minDistance={1}
        maxDistance={10}
      />
      <Environment preset="sunset" />
      <directionalLight intensity={2} position={[10, 10, 5]} />
      <directionalLight intensity={1} position={[-10, 10, 5]} />
      <group position-y={-1.25}>
        <Avatar avatar={avatar} />
        <Gltf
          src="314-spooky-lofi.glb"
          position-z={-1.4}
          position-x={-0.5}
          scale={0.65}
        />
      </group>
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.7} />
      </EffectComposer>
    </>
  );
};
