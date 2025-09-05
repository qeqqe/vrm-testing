import * as THREE from "three";
import { mixamoVRMRigMap } from "./mixamoVRMAnimation";

/**
 * Load Mixamo animation, convert for three-vrm use, and return it.
 *
 * @param {any} vrm A target VRM instance
 * @param {THREE.AnimationClip} clip The Mixamo animation clip (from FBX/GLTF)
 * @param {THREE.Object3D} asset The Mixamo skeleton root (the loaded FBX/GLTF scene)
 * @returns {THREE.AnimationClip} The converted AnimationClip for the target VRM
 */
export function loadMixamoAnimation(
  vrm: any,
  clip: THREE.AnimationClip,
  asset: THREE.Object3D
): THREE.AnimationClip {
  const tracks: THREE.KeyframeTrack[] = []; // KeyframeTracks compatible with VRM will be added here

  const restRotationInverse = new THREE.Quaternion();
  const parentRestWorldRotation = new THREE.Quaternion();
  const _quatA = new THREE.Quaternion();
  const _vec3 = new THREE.Vector3();

  clip = clip.clone();
  // Adjust with reference to hips height.
  const motionHips = asset.getObjectByName("mixamorigHips");
  const motionHipsHeight = motionHips?.position?.y ?? 0.0;
  const vrmHipsHeight =
    (vrm?.humanoid?.normalizedRestPose?.hips?.position &&
      vrm.humanoid.normalizedRestPose.hips.position[1]) ||
    0.0;
  const hipsPositionScale =
    motionHipsHeight > 0 ? vrmHipsHeight / motionHipsHeight : 1.0;

  // Iterate through tracks on the provided clip
  clip.tracks.forEach((track: any) => {
    // Convert each track for VRM use, and push to `tracks`
    const trackSplitted = (track.name as string).split(".");
    const mixamoRigName = trackSplitted[0];
    const vrmBoneName = mixamoVRMRigMap[mixamoRigName];
    const vrmNodeName =
      vrm.humanoid?.getNormalizedBoneNode?.(vrmBoneName)?.name;
    const mixamoRigNode = asset.getObjectByName(mixamoRigName) as
      | THREE.Object3D
      | undefined;

    if (vrmNodeName != null && mixamoRigNode) {
      const propertyName = trackSplitted[1];

      // Store rotations of rest-pose.
      mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
      const parent = mixamoRigNode.parent ?? mixamoRigNode;
      parent.getWorldQuaternion(parentRestWorldRotation);

      if (track instanceof THREE.QuaternionKeyframeTrack) {
        // Retarget rotation of mixamoRig to NormalizedBone.
        for (let i = 0; i < track.values.length; i += 4) {
          const flatQuaternion = track.values.slice(i, i + 4);

          _quatA.fromArray(flatQuaternion);

          // parent rest world rotation * track rotation * restRotationInverse
          _quatA
            .premultiply(parentRestWorldRotation)
            .multiply(restRotationInverse);

          _quatA.toArray(flatQuaternion);

          for (let k = 0; k < flatQuaternion.length; k++) {
            track.values[i + k] = flatQuaternion[k];
          }
        }

        tracks.push(
          new THREE.QuaternionKeyframeTrack(
            `${vrmNodeName}.${propertyName}`,
            track.times.slice(),
            track.values.map((v: number, i: number) =>
              vrm?.meta?.metaVersion === "0" && i % 2 === 0 ? -v : v
            )
          )
        );
      } else if (track instanceof THREE.VectorKeyframeTrack) {
        const value = track.values.map(
          (v: number, i: number) =>
            (vrm?.meta?.metaVersion === "0" && i % 3 !== 1 ? -v : v) *
            hipsPositionScale
        );
        tracks.push(
          new THREE.VectorKeyframeTrack(
            `${vrmNodeName}.${propertyName}`,
            track.times.slice(),
            value
          )
        );
      }
    }
  });

  return new THREE.AnimationClip("vrmAnimation", clip.duration, tracks);
}
