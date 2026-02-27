import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.152/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.152/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.152/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.152/examples/jsm/geometries/TextGeometry.js';

/* BASIC SETUP */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 2000);
camera.position.set(0, 0, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setSize(innerWidth, innerHeight);
document.getElementById("canvas-container").appendChild(renderer.domElement);

/* POST PROCESSING (LIGHT SCATTER / BLOOM) */

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  1.5,  // strength
  0.4,  // radius
  0.85  // threshold
);
composer.addPass(bloom);

/* LIGHT SOURCE */

const sun = new THREE.PointLight(0xffffff, 3, 200);
sun.position.set(15, 5, 10);
scene.add(sun);

/* STARFIELD */

const starGeo = new THREE.BufferGeometry();
const starCount = 6000;
const starArray = new Float32Array(starCount * 3);

for (let i = 0; i < starCount * 3; i++) {
  starArray[i] = (Math.random() - 0.5) * 500;
}

starGeo.setAttribute('position', new THREE.BufferAttribute(starArray, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.7 }));
scene.add(stars);

/* SHADER-BASED ANIMATED OCEAN */

const earthGeo = new THREE.SphereGeometry(5, 128, 128);

const earthMat = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 }
  },
  vertexShader: `
    uniform float time;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      float wave = sin(uv.y * 20.0 + time) * 0.03;
      pos += normal * wave;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    void main() {
      vec3 ocean = vec3(0.0,0.1,0.3);
      vec3 glow = vec3(0.0,0.5,1.0);
      float fresnel = pow(1.0 - dot(normalize(vec3(0,0,1)), normalize(vec3(vUv,1.0))),3.0);
      gl_FragColor = vec4(ocean + glow * fresnel, 1.0);
    }
  `
});

const earth = new THREE.Mesh(earthGeo, earthMat);
scene.add(earth);

/* GPU PARTICLE FLOW */

const particleCount = 2000;
const particleGeo = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);

for(let i=0;i<particleCount*3;i++){
  positions[i] = (Math.random()-0.5)*10;
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(positions,3));

const particleMat = new THREE.PointsMaterial({
  size: 0.05
});

const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

/* 3D TEXT MESHES */

const loader = new FontLoader();

loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font){

  const textGeo = new TextGeometry("Global Engineers", {
    font: font,
    size: 0.8,
    height: 0.2
  });

  const textMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const textMesh = new THREE.Mesh(textGeo, textMat);

  textMesh.position.set(-4,6,0);
  scene.add(textMesh);

});

/* SCROLL-SYNCED CAMERA */

let scrollTarget = 0;

window.addEventListener("scroll",()=>{
  scrollTarget = window.scrollY * 0.01;
});

function animate(){
  requestAnimationFrame(animate);

  earthMat.uniforms.time.value += 0.02;

  stars.rotation.y += 0.0003;

  camera.position.z = 18 - scrollTarget;
  camera.position.x = Math.sin(scrollTarget * 0.2) * 6;
  camera.lookAt(0,0,0);

  composer.render();
}

animate();

/* RESIZE */

window.addEventListener("resize",()=>{
  renderer.setSize(innerWidth,innerHeight);
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
});
