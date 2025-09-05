import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useControls } from "leva";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { lerp } from "three/src/math/MathUtils.js";
import { loadMixamoAnimation } from "@/utils/remapMixamo";
import { useVideoRecognition } from "@/hooks/useVideoRecognition";
import { Face, Hand, Pose, Results, TFVectorPose } from "kalidokit";
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

  const setResultCallback = useVideoRecognition(
    (state) => state.setResultsCallback
  );

  const videoElement = useVideoRecognition((state) => state.videoElement);
  const riggedFace = useRef<any>(null);
  const riggedPose = useRef<any>(null);
  const riggedLeftHand = useRef<any>(null);
  const riggedRightHand = useRef<any>(null);

  const resultsCallback = useCallback(
    (result: {
      faceLandmarks: Results;
      za: TFVectorPose;
      poseLandmarks: Omit<TFVectorPose, "z">;
      leftHandLandmarks: Results;
      rightHandLandmarks: Results;
    }) => {
      if (!videoElement || !currentVRM) return;
      if (result.faceLandmarks) {
        riggedFace.current = Face.solve(result.faceLandmarks, {
          runtime: "mediapipe",
          video: videoElement,
          imageSize: { width: 640, height: 480 },
          smoothBlink: false,
          blinkSettings: [0.25, 0.75],
        });
      }
      if (result.za && result.poseLandmarks) {
        riggedPose.current = Pose.solve(result.za, result.poseLandmarks, {
          runtime: "mediapipe",
          video: videoElement,
        });
      }

      if (result.leftHandLandmarks) {
        riggedRightHand.current = Hand.solve(result.leftHandLandmarks, "Right");
      }
      if (result.rightHandLandmarks) {
        riggedLeftHand.current = Hand.solve(result.rightHandLandmarks, "Left");
      }
    },
    [videoElement, currentVRM]
  );
  useEffect(() => {
    setResultCallback(resultsCallback);
  }, [resultsCallback]);

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

    // Apply motion capture data if available, otherwise use Leva controls
    if (
      riggedFace.current &&
      riggedFace.current.mouth &&
      riggedFace.current.eye
    ) {
      // Apply facial expressions from motion capture
      userData.vrm.expressionManager.setValue(
        "aa",
        riggedFace.current.mouth.shape?.A || 0
      );
      userData.vrm.expressionManager.setValue(
        "ih",
        riggedFace.current.mouth.shape?.I || 0
      );
      userData.vrm.expressionManager.setValue(
        "ee",
        riggedFace.current.mouth.shape?.E || 0
      );
      userData.vrm.expressionManager.setValue(
        "oh",
        riggedFace.current.mouth.shape?.O || 0
      );
      userData.vrm.expressionManager.setValue(
        "ou",
        riggedFace.current.mouth.shape?.U || 0
      );
      userData.vrm.expressionManager.setValue(
        "blinkLeft",
        riggedFace.current.eye.l || 0
      );
      userData.vrm.expressionManager.setValue(
        "blinkRight",
        riggedFace.current.eye.r || 0
      );
    } else {
      // Fallback to Leva controls when no motion capture data
      [
        { name: "aa", value: aa },
        { name: "ih", value: ih },
        { name: "ee", value: ee },
        { name: "oh", value: oh },
        { name: "ou", value: ou },
        { name: "blinkLeft", value: blinkLeft },
        { name: "blinkRight", value: blinkRight },
      ].forEach(({ name, value }) => {
        lerpExpression(name, value, delta * 12);
      });
    }

    // Always apply emotion controls
    userData.vrm.expressionManager.setValue("angry", angry);
    userData.vrm.expressionManager.setValue("sad", sad);
    userData.vrm.expressionManager.setValue("happy", happy);

    // Apply pose data if available
    if (riggedPose.current && userData.vrm.humanoid) {
      try {
        // Apply head rotation
        if (riggedPose.current.head) {
          const headNode = userData.vrm.humanoid.getNormalizedBoneNode("head");
          if (headNode) {
            headNode.rotation.set(
              riggedPose.current.head.x || 0,
              riggedPose.current.head.y || 0,
              riggedPose.current.head.z || 0
            );
          }
        }

        // Apply spine rotation
        if (riggedPose.current.spine) {
          const spineNode =
            userData.vrm.humanoid.getNormalizedBoneNode("spine");
          if (spineNode) {
            spineNode.rotation.set(
              riggedPose.current.spine.x || 0,
              riggedPose.current.spine.y || 0,
              riggedPose.current.spine.z || 0
            );
          }
        }
      } catch (error) {
        // Silently handle pose application errors
      }
    }

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
