"use client";
import { CameraControls, Environment, Gltf } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useControls } from "leva";
import { useRef, type ComponentRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Avatar from "./Avatar";

export const Experience = () => {
  const controls = useRef<ComponentRef<typeof CameraControls> | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const worldPos = useRef(new THREE.Vector3());

  const { avatar } = useControls("VRM", {
    avatar: {
      value: "shinji.vrm",
      options: [
        "arlesomething.vrm",
        "idk.vrm",
        "putin.vrm",
        "idkts.vrm",
        "kazuha.vrm",
      ],
    },
  });
  useFrame(() => {
    const g = groupRef.current;
    const ctrl = controls.current as any;
    if (!g || !ctrl) return;
    g.getWorldPosition(worldPos.current);

    const targetY = worldPos.current.y + 3;
    const targetZ = worldPos.current.z - 1;

    if (typeof ctrl.setTarget === "function") {
      // @ts-ignore
      ctrl.setTarget(worldPos.current.x, targetY, targetZ, false);
    } else if (typeof ctrl.setLookAt === "function") {
      const cam = (ctrl.camera as THREE.Camera) ?? null;
      if (cam) {
        const camPos = new THREE.Vector3();
        cam.getWorldPosition(camPos);
        // @ts-ignore
        ctrl.setLookAt(
          camPos.x,
          camPos.y,
          camPos.z,
          worldPos.current.x,
          targetY,
          worldPos.current.z,
          false
        );
      }
    } else {
      const cam = (ctrl.camera as THREE.Camera) ?? null;
      if (cam)
        cam.lookAt(
          new THREE.Vector3(worldPos.current.x, targetY, worldPos.current.z)
        );
    }
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
      <group ref={groupRef} position-y={-1.25}>
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
