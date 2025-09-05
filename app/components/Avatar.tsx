import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import React, { useEffect, useMemo } from "react";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useControls } from "leva";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { lerp } from "three/src/math/MathUtils.js";
import { loadMixamoAnimation } from "@/utils/remapMixamo";
type AvatarSource = string | File;

interface AvatarProps {
  avatar: AvatarSource;
}

const Avatar: React.FC<AvatarProps> = ({ avatar, ...props }) => {
  const { scene, userData } = useGLTF(
    `${avatar}`,
    undefined,
    undefined,
    (loader) => {
      loader.register(
        ((parser: any) => new VRMLoaderPlugin(parser as any)) as any
      );
    }
  );

  const assetA = useFBX("/animation/Dancing.fbx");
  const assetB = useFBX("/animation/Snake.fbx");
  const assetC = useFBX("/animation/Idle.fbx");

  const currentVRM = userData.vrm;
  const remapMixamoAnimationToVrm = (vrm: any, asset: any) => {
    return loadMixamoAnimation(vrm, asset.animations[0], asset);
  };

  const animationClipA = useMemo(() => {
    if (!currentVRM || !assetA) return null;
    const clip = remapMixamoAnimationToVrm(currentVRM, assetA);
    clip.name = "Dancing";
    return clip;
  }, [assetA, currentVRM]);

  const animationClipB = useMemo(() => {
    if (!currentVRM || !assetB) return null;
    const clip = remapMixamoAnimationToVrm(currentVRM, assetB);
    clip.name = "Snake";
    return clip;
  }, [assetB, currentVRM]);

  const animationClipC = useMemo(() => {
    if (!currentVRM || !assetC) return null;
    const clip = remapMixamoAnimationToVrm(currentVRM, assetC);
    clip.name = "Idle";
    return clip;
  }, [assetC, currentVRM]);

  const clips = [animationClipA, animationClipB, animationClipC].filter(
    (c): c is THREE.AnimationClip => c != null
  );
  const { actions } = useAnimations(clips, currentVRM?.scene);

  useEffect(() => {
    const vrm = userData.vrm;
    console.log("VRM:", vrm);
    VRMUtils.removeUnnecessaryVertices(scene);
    VRMUtils.combineSkeletons(scene);

    if (vrm) {
      VRMUtils.combineMorphs(vrm);

      if (vrm.scene) {
        vrm.scene.traverse((obj: { frustumCulled: boolean }) => {
          obj.frustumCulled = false;
        });
      }
    }
  }, [scene, userData]);

  const {
    aa,
    ih,
    ee,
    oh,
    ou,
    blinkLeft,
    blinkRight,
    angry,
    sad,
    happy,
    animation,
  } = useControls("VRM", {
    aa: { value: 0, min: 0, max: 1 },
    ih: { value: 0, min: 0, max: 1 },
    ee: { value: 0, min: 0, max: 1 },
    oh: { value: 0, min: 0, max: 1 },
    ou: { value: 0, min: 0, max: 1 },
    blinkLeft: { value: 0, min: 0, max: 1 },
    blinkRight: { value: 0, min: 0, max: 1 },
    angry: { value: 0, min: 0, max: 1 },
    sad: { value: 0, min: 0, max: 1 },
    happy: { value: 0, min: 0, max: 1 },
    animation: {
      options: ["None", "Dancing", "Snake", "Idle"],
      value: "Idle",
    },
  });

  useEffect(() => {
    if (animation == "None") return;
    actions[animation]?.play();

    return () => {
      actions[animation]?.stop();
    };
  }, [actions, animation]);

  const lerpExpression = (name: any, value: number, lerpFactor: number) => {
    userData.vrm.expressionManager.setValue(
      name,
      lerp(userData.vrm.expressionManager.getValue(name), value, lerpFactor)
    );
  };

  useFrame((_, delta) => {
    if (!userData.vrm) return;

    userData.vrm.expressionManager.setValue("angry", angry);
    userData.vrm.expressionManager.setValue("sad", sad);
    userData.vrm.expressionManager.setValue("happy", happy);

    [
      {
        name: "aa",
        value: aa,
      },
      {
        name: "ih",
        value: ih,
      },
      {
        name: "ee",
        value: ee,
      },
      {
        name: "oh",
        value: oh,
      },
      {
        name: "ou",
        value: ou,
      },
      {
        name: "blinkLeft",
        value: blinkLeft,
      },
      {
        name: "blinkRight",
        value: blinkRight,
      },
      {
        name: "angry",
        value: angry,
      },
      {
        name: "sad",
        value: sad,
      },
      {
        name: "happy",
        value: happy,
      },
    ].forEach(({ name, value }) => {
      lerpExpression(name, value, delta * 12);
    });

    userData.vrm.update(delta);
  });

  return (
    <group {...props}>
      <primitive
        object={scene}
        rotation-y={avatar === "idk.vrm" ? Math.PI / 2 : -(Math.PI / 2)}
        scale={2}
        position={[0.8, 0, -1]}
      />
    </group>
  );
};

export default Avatar;
