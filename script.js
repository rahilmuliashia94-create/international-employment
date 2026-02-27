const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("canvas-container").appendChild(renderer.domElement);

camera.position.z = 4;

// Light
const light = new THREE.PointLight(0xffffff, 1.5);
light.position.set(5,3,5);
scene.add(light);

// Earth
const geometry = new THREE.SphereGeometry(1, 64, 64);
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load(
  "https://threejsfundamentals.org/threejs/resources/images/earth-night.jpg"
);

const material = new THREE.MeshStandardMaterial({ map: earthTexture });
const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

// Scroll Camera Movement
let scrollY = 0;

window.addEventListener("scroll", () => {
  scrollY = window.scrollY;
});

// Animate
function animate() {
  requestAnimationFrame(animate);

  earth.rotation.y += 0.002;

  // Camera movement based on scroll
  camera.position.z = 4 - scrollY * 0.001;
  camera.position.x = Math.sin(scrollY * 0.0005) * 2;
  camera.lookAt(earth.position);

  renderer.render(scene, camera);
}

animate();

// Fade-in panels
const panels = document.querySelectorAll(".panel");

function checkPanels() {
  panels.forEach(panel => {
    const rect = panel.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.75) {
      panel.classList.add("visible");
    }
  });
}

window.addEventListener("scroll", checkPanels);
checkPanels();

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
});
