import { useGLTF } from "@react-three/drei";
import React from "react";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";
type AvatarSource = string | File;

interface AvatarProps {
  avatar: AvatarSource;
}

const Avatar: React.FC<AvatarProps> = ({ avatar, ...props }) => {
  const { scene } = useGLTF(`${avatar}`, undefined, undefined, (loader) => {
    loader.register(
      ((parser: any) => new VRMLoaderPlugin(parser as any)) as any
    );
  });
  return (
    <group {...props}>
      <primitive
        object={scene}
        rotation-y={Math.PI / 2}
        scale={2}
        position={[0.8, 0, -1]}
      />
    </group>
  );
};

export default Avatar;
