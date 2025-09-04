"use client";
import { Loader, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Experience } from "./components/Experience";
function App() {
  return (
    <>
      <Loader />
      <div style={{ height: "100vh", width: "100vw" }}>
        <Canvas
          style={{ height: "100%", width: "100%" }}
          shadows
          camera={{ position: [0.25, 0.25, 2], fov: 30 }}
        >
          <color attach="background" args={["#333"]} />
          <fog attach="fog" args={["#333", 10, 20]} />
          <Stats />
          <Suspense>
            <Experience />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}

export default App;
