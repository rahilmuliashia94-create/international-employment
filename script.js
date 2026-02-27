import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.152/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.152/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.152/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.152/examples/jsm/geometries/TextGeometry.js';

/* =========================
   SCENE SETUP
========================= */

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 2000);
camera.position.set(0, 0, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.getElementById("canvas-container").appendChild(renderer.domElement);

/* =========================
   POST PROCESSING
========================= */

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  1.8,
  0.5,
  0.7
);
composer.addPass(bloom);

/* =========================
   LIGHTING
========================= */

const sun = new THREE.PointLight(0xffffff, 3, 300);
sun.position.set(20, 10, 15);
scene.add(sun);

/* =========================
   STARFIELD
========================= */

const starGeo = new THREE.BufferGeometry();
const starCount = 8000;
const starPos = new Float32Array(starCount * 3);

for (let i = 0; i < starCount * 3; i++) {
  starPos[i] = (Math.random() - 0.5) * 800;
}

starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.7 }));
scene.add(stars);

/* =========================
   SHADER OCEAN EARTH
========================= */

const earthGeo = new THREE.SphereGeometry(6, 128, 128);

const earthMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: `
    uniform float time;
    varying vec2 vUv;
    void main(){
      vUv = uv;
      vec3 pos = position;
      float wave = sin(uv.y * 30.0 + time) * 0.08;
      pos += normal * wave;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    void main(){
      vec3 deep = vec3(0.0,0.05,0.2);
      vec3 glow = vec3(0.0,0.6,1.0);
      float fresnel = pow(1.0 - dot(normalize(vec3(0,0,1)), normalize(vec3(vUv,1.0))), 3.0);
      gl_FragColor = vec4(deep + glow * fresnel, 1.0);
    }
  `
});

const earth = new THREE.Mesh(earthGeo, earthMat);
scene.add(earth);

/* =========================
   GPU PARTICLE FLOW
========================= */

const particleCount = 4000;
const particleGeo = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 20;
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particleMat = new THREE.PointsMaterial({ size: 0.05 });
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

/* =========================
   3D TEXT
========================= */

const loader = new FontLoader();

loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font){

  const geo = new TextGeometry("GLOBAL DEPLOYMENT", {
    font: font,
    size: 1,
    height: 0.3
  });

  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const textMesh = new THREE.Mesh(geo, mat);

  textMesh.position.set(-6, 10, 0);
  scene.add(textMesh);

});

/* =========================
   SCROLL CINEMATIC CAMERA
========================= */

let scrollTarget = 0;

window.addEventListener("scroll", () => {
  scrollTarget = window.scrollY * 0.02;
});

function animate() {
  requestAnimationFrame(animate);

  earthMat.uniforms.time.value += 0.03;

  stars.rotation.y += 0.0005;
  earth.rotation.y += 0.002;

  /* Dramatic Camera Orbit */
  camera.position.x = Math.sin(scrollTarget * 0.2) * 20;
  camera.position.z = 25 - scrollTarget;
  camera.position.y = Math.cos(scrollTarget * 0.15) * 8;

  camera.lookAt(0, 0, 0);

  composer.render();
}

animate();

/* =========================
   RESIZE
========================= */

window.addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
