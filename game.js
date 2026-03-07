import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js";

const canvas = document.getElementById("gameCanvas");
const scoreboard = document.getElementById("scoreboard");
const modeLabel = document.getElementById("modeLabel");
const controlHint = document.getElementById("controlHint");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlaySummary = document.getElementById("overlaySummary");
const restartInline = document.getElementById("restartInline");
const restartOverlay = document.getElementById("restartOverlay");
const touchPrompt = document.getElementById("touchPrompt");

const CONFIG = {
  desktopLaneCount: 5,
  touchLaneCount: 3,
  laneGap: 2.7,
  railOffset: 0.56,
  segmentLength: 24,
  trackSegmentCount: 22,
  scenerySegmentCount: 22,
  playerZ: 9.6,
  spawnZ: -70,
  cleanupZ: 40,
  gravity: 42,
  jumpVelocity: 17.8,
  slideDuration: 0.72,
  baseSpeed: 28,
  maxSpeed: 82,
  acceleration: 0.95,
  scoreRate: 16,
  coinScore: 65,
  startingLives: 3,
  scoreStealThreshold: 10000,
  respawnInvulnerability: 2,
  spawnHazardRange: [22, 34],
  spawnPickupRange: [12, 20],
  swipeThreshold: 32,
  swipeWindow: 480,
  trainCarLength: 8.4,
  trainGap: 0.35,
  trainCars: [2, 4],
  trainWidth: 2.45,
  trainRoofY: 3.08,
  trainLandingAssistHeight: 1.35,
  rampLength: 5.2,
  rampGap: 0.3,
  slowTrainChance: 0.28,
  slowTrainSpeedRange: [0.55, 0.78],
  maxLifeOrbs: 6,
  playerCollisionRadius: 0.78,
  bumpRadius: 1.16,
  bumpForce: 8.6,
  jetpackDuration: 3.2,
  jetpackHeight: 5.8,
  jetpackMinHeight: 0.9,
  jetpackMaxHeight: 10.8,
  jetpackVerticalSpeed: 12,
  jetpackTouchStep: 1.55,
  magnetDuration: 8.5,
  magnetRange: 4.6,
};

const PLAYER_PROFILES = [
  {
    name: "Signal Red",
    accent: "#ff8640",
    suit: 0xd95d29,
    trim: 0xffd3bb,
    visor: 0x3a0d00,
  },
  {
    name: "Schwarz",
    accent: "#000000b6",
    suit: 0x072732,
    trim: 0xdcfbff,
    visor: 0x072732,
  },
];

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbcd9f2);
scene.fog = new THREE.Fog(0xbcd9f2, 90, 340);

const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 720);
const cameraTarget = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();

const world = new THREE.Group();
scene.add(world);

const skyRoot = new THREE.Group();
const trackRoot = new THREE.Group();
const sceneryRoot = new THREE.Group();
const obstacleRoot = new THREE.Group();
const pickupRoot = new THREE.Group();
const playerRoot = new THREE.Group();

world.add(skyRoot);
world.add(trackRoot);
world.add(sceneryRoot);
world.add(obstacleRoot);
world.add(pickupRoot);
world.add(playerRoot);

const ambientLight = new THREE.HemisphereLight(0xeaf6ff, 0x5a6554, 1.45);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff0cd, 2.3);
sunLight.position.set(26, 42, 18);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 150;
sunLight.shadow.camera.left = -18;
sunLight.shadow.camera.right = 18;
sunLight.shadow.camera.top = 18;
sunLight.shadow.camera.bottom = -18;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0xb6ebff, 0.8);
fillLight.position.set(-18, 15, -8);
scene.add(fillLight);

const materials = {
  ballast: new THREE.MeshStandardMaterial({ color: 0x7e7a74, roughness: 1, metalness: 0.02 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x6a7077, roughness: 0.96, metalness: 0.03 }),
  grass: new THREE.MeshStandardMaterial({ color: 0x76996a, roughness: 1, metalness: 0.01 }),
  dirt: new THREE.MeshStandardMaterial({ color: 0x8f775f, roughness: 0.98, metalness: 0.01 }),
  rail: new THREE.MeshStandardMaterial({ color: 0xb5bcc1, roughness: 0.32, metalness: 0.9 }),
  sleeper: new THREE.MeshStandardMaterial({ color: 0x604638, roughness: 0.94, metalness: 0.06 }),
  serviceRoad: new THREE.MeshStandardMaterial({ color: 0x5a6169, roughness: 0.9, metalness: 0.1 }),
  warehouse: new THREE.MeshStandardMaterial({ color: 0xc1c9cf, roughness: 0.88, metalness: 0.06 }),
  window: new THREE.MeshStandardMaterial({ color: 0x8dc6ff, roughness: 0.15, metalness: 0.2, emissive: 0x588dc7, emissiveIntensity: 0.25 }),
  treeTrunk: new THREE.MeshStandardMaterial({ color: 0x6f5037, roughness: 0.96, metalness: 0.02 }),
  treeLeaves: new THREE.MeshStandardMaterial({ color: 0x4d7f49, roughness: 0.95, metalness: 0.02 }),
  signalPole: new THREE.MeshStandardMaterial({ color: 0x464b53, roughness: 0.78, metalness: 0.32 }),
  signalLamp: new THREE.MeshStandardMaterial({ color: 0xff7b44, roughness: 0.2, metalness: 0.15, emissive: 0xff8c5a, emissiveIntensity: 0.55 }),
  trainBody: new THREE.MeshStandardMaterial({ color: 0x9c303a, roughness: 0.42, metalness: 0.5 }),
  trainRoof: new THREE.MeshStandardMaterial({ color: 0x8a8d92, roughness: 0.5, metalness: 0.55 }),
  trainStripe: new THREE.MeshStandardMaterial({ color: 0xf1d59a, roughness: 0.36, metalness: 0.2 }),
  trainWindow: new THREE.MeshStandardMaterial({ color: 0xb4deff, roughness: 0.12, metalness: 0.2, emissive: 0x74a8dd, emissiveIntensity: 0.35 }),
  barrier: new THREE.MeshStandardMaterial({ color: 0xe4a74b, roughness: 0.58, metalness: 0.15 }),
  barrierStripe: new THREE.MeshStandardMaterial({ color: 0xf3efe7, roughness: 0.35, metalness: 0.05 }),
  gate: new THREE.MeshStandardMaterial({ color: 0x3e4f62, roughness: 0.52, metalness: 0.46 }),
  gateGlow: new THREE.MeshStandardMaterial({ color: 0x6be8ff, roughness: 0.2, metalness: 0.15, emissive: 0x6be8ff, emissiveIntensity: 0.65 }),
  coin: new THREE.MeshStandardMaterial({ color: 0xffd45f, roughness: 0.22, metalness: 0.92, emissive: 0x8c6d18, emissiveIntensity: 0.5 }),
  magnet: new THREE.MeshStandardMaterial({ color: 0xf85656, roughness: 0.25, metalness: 0.55, emissive: 0x721919, emissiveIntensity: 0.3 }),
  magnetTip: new THREE.MeshStandardMaterial({ color: 0xdce9f2, roughness: 0.18, metalness: 0.82 }),
  jetpack: new THREE.MeshStandardMaterial({ color: 0x697b87, roughness: 0.4, metalness: 0.62 }),
  jetpackGlow: new THREE.MeshStandardMaterial({ color: 0x6ff8ff, roughness: 0.18, metalness: 0.1, emissive: 0x6ff8ff, emissiveIntensity: 0.8 }),
  flame: new THREE.MeshBasicMaterial({ color: 0xffb14a, transparent: true, opacity: 0.78 }),
  shadow: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }),
  sun: new THREE.MeshBasicMaterial({ color: 0xfff1bc }),
  cloud: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }),
};

const geometries = {
  rail: new THREE.BoxGeometry(0.12, 0.14, CONFIG.segmentLength - 0.6),
  sleeper: new THREE.BoxGeometry(2.15, 0.16, 0.34),
  serviceStrip: new THREE.BoxGeometry(2.4, 0.12, CONFIG.segmentLength),
  runnerHead: new THREE.SphereGeometry(0.38, 18, 14),
  runnerTorso: new THREE.CapsuleGeometry(0.4, 1.04, 6, 10),
  runnerArm: new THREE.CapsuleGeometry(0.11, 0.76, 4, 8),
  runnerLeg: new THREE.CapsuleGeometry(0.14, 0.92, 5, 8),
  visor: new THREE.BoxGeometry(0.5, 0.18, 0.22),
  runnerShadow: new THREE.CircleGeometry(0.94, 24),
  treeTrunk: new THREE.CylinderGeometry(0.12, 0.17, 1.6, 8),
  treeLeaves: new THREE.ConeGeometry(0.9, 1.6, 10),
  coin: new THREE.TorusGeometry(0.38, 0.11, 12, 26),
};

const pressed = new Set();
const trackSegments = [];
const scenerySegments = [];
const players = [];
const obstacles = [];
const pickups = [];

const game = {
  running: true,
  time: 0,
  speed: CONFIG.baseSpeed,
  isTouchMode: detectTouchMode(),
  laneOffsets: [],
  laneCount: 0,
  trackHalfWidth: 0,
  nextHazardDistance: 0,
  nextPickupDistance: 0,
};

let obstacleId = 0;
let lastFrame = 0;
let touchState = null;

function detectTouchMode() {
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  return coarsePointer || (window.innerWidth <= 900 && navigator.maxTouchPoints > 0);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function buildLaneOffsets(count) {
  const start = -((count - 1) * CONFIG.laneGap) / 2;
  return Array.from({ length: count }, (_, index) => start + index * CONFIG.laneGap);
}

function laneX(laneIndex) {
  return game.laneOffsets[laneIndex] ?? 0;
}

function removeAllChildren(group) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
}

function setMeshShadows(mesh, receive = false) {
  if (!mesh || !mesh.isMesh) {
    return mesh;
  }

  mesh.castShadow = true;
  mesh.receiveShadow = receive;
  return mesh;
}

function configureSky() {
  removeAllChildren(skyRoot);

  const sun = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 24), materials.sun);
  sun.position.set(-44, 54, -170);
  skyRoot.add(sun);

  for (let index = 0; index < 7; index += 1) {
    const cloud = new THREE.Group();
    for (let puff = 0; puff < 3; puff += 1) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(choose([3.6, 4.2, 4.8]), 18, 18), materials.cloud);
      mesh.position.set((puff - 1) * 3.5, randomBetween(-1, 1), randomBetween(-2.2, 2.2));
      cloud.add(mesh);
    }
    cloud.position.set(randomBetween(-55, 55), randomBetween(28, 48), -randomBetween(90, 220));
    cloud.scale.setScalar(randomBetween(0.7, 1.3));
    skyRoot.add(cloud);
  }
}

function choose(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function createTrackSegment(zPosition) {
  const group = new THREE.Group();
  const corridorWidth = game.trackHalfWidth * 2 + 8.2;

  const ballast = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(corridorWidth, 0.56, CONFIG.segmentLength), materials.ballast), true);
  ballast.position.y = -0.34;
  group.add(ballast);

  const drainage = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(corridorWidth + 2.8, 0.15, CONFIG.segmentLength), materials.concrete), true);
  drainage.position.y = -0.68;
  group.add(drainage);

  const leftShoulder = setMeshShadows(new THREE.Mesh(geometries.serviceStrip, materials.serviceRoad), true);
  leftShoulder.position.set(-game.trackHalfWidth - 2.4, -0.06, 0);
  group.add(leftShoulder);

  const rightShoulder = setMeshShadows(new THREE.Mesh(geometries.serviceStrip, materials.serviceRoad), true);
  rightShoulder.position.set(game.trackHalfWidth + 2.4, -0.06, 0);
  group.add(rightShoulder);

  const leftGrass = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(8, 0.12, CONFIG.segmentLength), materials.grass), true);
  leftGrass.position.set(-game.trackHalfWidth - 7.3, -0.1, 0);
  group.add(leftGrass);

  const rightGrass = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(8, 0.12, CONFIG.segmentLength), materials.grass), true);
  rightGrass.position.set(game.trackHalfWidth + 7.3, -0.1, 0);
  group.add(rightGrass);

  for (const centerX of game.laneOffsets) {
    for (const railSide of [-1, 1]) {
      const rail = setMeshShadows(new THREE.Mesh(geometries.rail, materials.rail), true);
      rail.position.set(centerX + railSide * CONFIG.railOffset, 0.14, 0);
      group.add(rail);
    }

    for (let sleeperIndex = -6; sleeperIndex <= 6; sleeperIndex += 1) {
      const sleeper = setMeshShadows(new THREE.Mesh(geometries.sleeper, materials.sleeper), true);
      sleeper.position.set(centerX, -0.02, sleeperIndex * 1.75);
      group.add(sleeper);
    }
  }

  group.position.z = zPosition;
  return group;
}

function createWarehouse(xPosition, zPosition) {
  const group = new THREE.Group();
  const width = randomBetween(5.5, 10);
  const height = randomBetween(4, 12);
  const depth = randomBetween(6, 12);

  const building = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), materials.warehouse.clone()), true);
  building.position.set(0, height * 0.5 - 0.12, 0);
  building.material.color.offsetHSL(randomBetween(-0.03, 0.03), 0, randomBetween(-0.05, 0.05));
  group.add(building);

  const windowRows = randomInt(2, 4);
  const windowCols = randomInt(3, 5);
  for (let row = 0; row < windowRows; row += 1) {
    for (let col = 0; col < windowCols; col += 1) {
      const windowBox = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.75, 0.08), materials.window);
      const colSpan = depth * 0.64;
      windowBox.position.set(
        xPosition > 0 ? -width * 0.51 : width * 0.51,
        1.2 + row * 1.7,
        -depth * 0.32 + col * (colSpan / Math.max(windowCols - 1, 1))
      );
      group.add(windowBox);
    }
  }

  group.position.set(xPosition, 0, zPosition);
  return group;
}

function createTree(xPosition, zPosition) {
  const tree = new THREE.Group();
  const trunk = setMeshShadows(new THREE.Mesh(geometries.treeTrunk, materials.treeTrunk), true);
  trunk.position.y = 0.72;
  tree.add(trunk);

  for (let level = 0; level < 2; level += 1) {
    const leaves = setMeshShadows(new THREE.Mesh(geometries.treeLeaves, materials.treeLeaves), true);
    leaves.position.y = 1.8 + level * 0.7;
    leaves.scale.setScalar(level === 0 ? 1 : 0.82);
    tree.add(leaves);
  }

  tree.position.set(xPosition, 0, zPosition);
  tree.scale.setScalar(randomBetween(0.9, 1.3));
  return tree;
}

function createSignalPost(xPosition, zPosition) {
  const signal = new THREE.Group();
  const pole = setMeshShadows(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.6, 10), materials.signalPole), true);
  pole.position.y = 2.2;
  signal.add(pole);

  const lamp = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), materials.signalLamp), true);
  lamp.position.set(0, 3.9, 0);
  signal.add(lamp);

  signal.position.set(xPosition, 0, zPosition);
  return signal;
}

function createScenerySegment(zPosition) {
  const group = new THREE.Group();
  const leftEdge = -game.trackHalfWidth - 5.5;
  const rightEdge = game.trackHalfWidth + 5.5;

  for (let index = 0; index < 3; index += 1) {
    const sign = index % 2 === 0 ? -1 : 1;
    const xPosition = sign < 0 ? leftEdge - randomBetween(2.5, 4.5) : rightEdge + randomBetween(2.5, 4.5);
    const zLocal = randomBetween(-CONFIG.segmentLength * 0.45, CONFIG.segmentLength * 0.45);
    if (Math.random() < 0.55) {
      group.add(createTree(xPosition, zLocal));
    } else {
      group.add(createWarehouse(xPosition + sign * randomBetween(6, 12), zLocal));
    }
  }

  group.add(createSignalPost(leftEdge - 1.4, randomBetween(-8, 8)));
  if (Math.random() < 0.55) {
    group.add(createSignalPost(rightEdge + 1.4, randomBetween(-8, 8)));
  }

  const embankmentLeft = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(12, 0.28, CONFIG.segmentLength), materials.dirt), true);
  embankmentLeft.position.set(leftEdge - 6.4, -0.24, 0);
  group.add(embankmentLeft);

  const embankmentRight = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(12, 0.28, CONFIG.segmentLength), materials.dirt), true);
  embankmentRight.position.set(rightEdge + 6.4, -0.24, 0);
  group.add(embankmentRight);

  group.position.z = zPosition;
  return group;
}

function createRunner(profile) {
  const root = new THREE.Group();
  const figure = new THREE.Group();
  root.add(figure);

  const suitMaterial = new THREE.MeshStandardMaterial({
    color: profile.suit,
    roughness: 0.42,
    metalness: 0.14,
    emissive: profile.suit,
    emissiveIntensity: 0.06,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: profile.trim, roughness: 0.35, metalness: 0.12 });
  const visorMaterial = new THREE.MeshStandardMaterial({
    color: profile.visor,
    roughness: 0.12,
    metalness: 0.22,
    emissive: profile.visor,
    emissiveIntensity: 0.12,
  });

  const torso = setMeshShadows(new THREE.Mesh(geometries.runnerTorso, suitMaterial));
  torso.position.y = 2.04;
  torso.scale.z = 0.82;
  figure.add(torso);

  const chestPlate = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.68, 0.18), trimMaterial));
  chestPlate.position.set(0, 2.16, 0.34);
  figure.add(chestPlate);

  const lifeOrbMaterial = new THREE.MeshStandardMaterial({
    color: profile.trim,
    roughness: 0.2,
    metalness: 0.18,
    emissive: new THREE.Color(profile.accent),
    emissiveIntensity: 0.55,
  });
  const lifeOrbGeometry = new THREE.SphereGeometry(0.11, 12, 12);
  const lifeOrbAnchor = new THREE.Group();
  lifeOrbAnchor.position.set(0, 2.06, 0.5);
  figure.add(lifeOrbAnchor);

  const lifeOrbs = Array.from({ length: CONFIG.maxLifeOrbs }, (_, index) => {
    const orb = setMeshShadows(new THREE.Mesh(lifeOrbGeometry, lifeOrbMaterial));
    const column = index % 3;
    const row = Math.floor(index / 3);
    orb.position.set((column - 1) * 0.2, 0.13 - row * 0.26, 0);
    lifeOrbAnchor.add(orb);
    return orb;
  });

  const head = setMeshShadows(new THREE.Mesh(geometries.runnerHead, trimMaterial));
  head.position.y = 3.42;
  figure.add(head);

  const visor = setMeshShadows(new THREE.Mesh(geometries.visor, visorMaterial));
  visor.position.set(0, 3.4, 0.28);
  figure.add(visor);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.63, 2.55, 0);
  figure.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.63, 2.55, 0);
  figure.add(rightArmPivot);

  const leftArm = setMeshShadows(new THREE.Mesh(geometries.runnerArm, suitMaterial));
  leftArm.position.y = -0.48;
  leftArmPivot.add(leftArm);

  const rightArm = setMeshShadows(new THREE.Mesh(geometries.runnerArm, suitMaterial));
  rightArm.position.y = -0.48;
  rightArmPivot.add(rightArm);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.25, 1.32, 0);
  figure.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.25, 1.32, 0);
  figure.add(rightLegPivot);

  const leftLeg = setMeshShadows(new THREE.Mesh(geometries.runnerLeg, suitMaterial));
  leftLeg.position.y = -0.58;
  leftLegPivot.add(leftLeg);

  const rightLeg = setMeshShadows(new THREE.Mesh(geometries.runnerLeg, suitMaterial));
  rightLeg.position.y = -0.58;
  rightLegPivot.add(rightLeg);

  const pack = new THREE.Group();
  const leftCanister = setMeshShadows(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.86, 10), materials.jetpack));
  leftCanister.rotation.z = Math.PI / 2;
  leftCanister.position.set(-0.24, 2.08, -0.38);
  pack.add(leftCanister);

  const rightCanister = setMeshShadows(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.86, 10), materials.jetpack));
  rightCanister.rotation.z = Math.PI / 2;
  rightCanister.position.set(0.24, 2.08, -0.38);
  pack.add(rightCanister);

  const leftFlame = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.65, 12), materials.flame.clone());
  leftFlame.position.set(-0.24, 1.55, -0.38);
  leftFlame.rotation.x = Math.PI;
  pack.add(leftFlame);

  const rightFlame = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.65, 12), materials.flame.clone());
  rightFlame.position.set(0.24, 1.55, -0.38);
  rightFlame.rotation.x = Math.PI;
  pack.add(rightFlame);

  pack.visible = false;
  figure.add(pack);

  const powerBarTrackMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a2330,
    roughness: 0.84,
    metalness: 0.08,
    emissive: 0x0a0f16,
    emissiveIntensity: 0.18,
  });
  const powerBarFillMaterial = new THREE.MeshStandardMaterial({
    color: 0x6ff8ff,
    roughness: 0.24,
    metalness: 0.18,
    emissive: 0x6ff8ff,
    emissiveIntensity: 0.8,
  });
  const powerBar = new THREE.Group();
  powerBar.position.set(0, 2.3, -0.56);
  powerBar.visible = false;

  const powerBarTrack = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.1, 0.06), powerBarTrackMaterial));
  powerBar.add(powerBarTrack);

  const powerBarFill = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.06, 0.05), powerBarFillMaterial));
  powerBarFill.position.z = 0.01;
  powerBar.add(powerBarFill);
  figure.add(powerBar);

  const magnetRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.05, 12, 28), materials.magnetTip);
  magnetRing.rotation.x = Math.PI / 2;
  magnetRing.position.y = 1.85;
  magnetRing.visible = false;
  root.add(magnetRing);

  const shadow = new THREE.Mesh(geometries.runnerShadow, materials.shadow.clone());
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  shadow.scale.set(1.1, 0.72, 1);
  root.add(shadow);

  return {
    root,
    figure,
    lifeOrbs,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    pack,
    powerBar,
    powerBarFill,
    leftFlame,
    rightFlame,
    magnetRing,
    shadow,
  };
}

function createPlayer(playerIndex, startLane) {
  const profile = PLAYER_PROFILES[playerIndex];
  const visuals = createRunner(profile);
  visuals.root.position.set(laneX(startLane), 0, CONFIG.playerZ);
  playerRoot.add(visuals.root);

  return {
    id: playerIndex,
    name: profile.name,
    accent: profile.accent,
    lane: startLane,
    targetLane: startLane,
    x: laneX(startLane),
    y: 0,
    verticalVelocity: 0,
    lateralVelocity: 0,
    grounded: true,
    onTrainId: null,
    lastTrainId: null,
    dropThroughTrainId: null,
    slideTimer: 0,
    score: 0,
    distance: 0,
    coins: 0,
    lives: CONFIG.startingLives,
    runPhase: 0,
    alive: true,
    invulnerableTimer: 0,
    jetpackTimer: 0,
    jetpackTargetY: CONFIG.jetpackHeight,
    magnetTimer: 0,
    visuals,
    panel: null,
  };
}

function createTrainMesh(carCount) {
  const group = new THREE.Group();
  const totalLength = carCount * CONFIG.trainCarLength + (carCount - 1) * CONFIG.trainGap;

  for (let index = 0; index < carCount; index += 1) {
    const car = new THREE.Group();
    const zOffset = -totalLength * 0.5 + CONFIG.trainCarLength * 0.5 + index * (CONFIG.trainCarLength + CONFIG.trainGap);

    const body = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(CONFIG.trainWidth, 2.72, CONFIG.trainCarLength), materials.trainBody), true);
    body.position.y = 1.56;
    car.add(body);

    const stripe = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(CONFIG.trainWidth + 0.02, 0.24, CONFIG.trainCarLength - 0.45), materials.trainStripe), true);
    stripe.position.set(0, 2.18, 0);
    car.add(stripe);

    const roof = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(CONFIG.trainWidth - 0.14, 0.28, CONFIG.trainCarLength - 0.15), materials.trainRoof), true);
    roof.position.y = CONFIG.trainRoofY;
    car.add(roof);

    const undercarriage = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(CONFIG.trainWidth - 0.26, 0.52, CONFIG.trainCarLength - 0.35), materials.signalPole), true);
    undercarriage.position.y = 0.42;
    car.add(undercarriage);

    for (const side of [-1, 1]) {
      for (let windowIndex = 0; windowIndex < 5; windowIndex += 1) {
        const windowBox = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.54, 0.78), materials.trainWindow), true);
        windowBox.position.set(side * (CONFIG.trainWidth * 0.5 + 0.01), 1.8, -2.7 + windowIndex * 1.36);
        car.add(windowBox);
      }
    }

    car.position.z = zOffset;
    group.add(car);
  }

  return { mesh: group, length: totalLength, width: CONFIG.trainWidth, roofY: CONFIG.trainRoofY };
}

function createRampMesh() {
  const group = new THREE.Group();
  const length = CONFIG.rampLength;
  const width = CONFIG.trainWidth - 0.24;
  const thickness = 0.26;
  const slopeAngle = Math.asin(Math.min(0.92, CONFIG.trainRoofY / length));
  const lowEdgeY = 0.05;
  const centerY = lowEdgeY - thickness * 0.5 * Math.cos(slopeAngle) + length * 0.5 * Math.sin(slopeAngle);

  const deck = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(width, thickness, length), materials.serviceRoad), true);
  deck.position.y = centerY;
  deck.rotation.x = slopeAngle;
  group.add(deck);

  const guide = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(width * 0.16, 0.05, length * 0.92), materials.gateGlow), true);
  guide.position.set(0, centerY + 0.06, 0);
  guide.rotation.x = slopeAngle;
  group.add(guide);

  return { mesh: group, length, width, roofY: CONFIG.trainRoofY };
}

function createBarrierMesh() {
  const group = new THREE.Group();
  const frame = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.9, 0.78), materials.barrier), true);
  frame.position.y = 0.48;
  group.add(frame);

  const stripe = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.18, 0.8), materials.barrierStripe), true);
  stripe.position.set(0, 0.55, 0.01);
  group.add(stripe);

  const leftCone = setMeshShadows(new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.46, 10), materials.barrier), true);
  leftCone.position.set(-0.76, 0.23, 0);
  group.add(leftCone);

  const rightCone = setMeshShadows(new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.46, 10), materials.barrier), true);
  rightCone.position.set(0.76, 0.23, 0);
  group.add(rightCone);

  return { mesh: group, length: 1.1, width: 2.1, roofY: 0.9 };
}

function createGateMesh() {
  const group = new THREE.Group();
  const leftPost = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.8, 0.24), materials.gate), true);
  leftPost.position.set(-1.03, 0.9, 0);
  group.add(leftPost);

  const rightPost = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.8, 0.24), materials.gate), true);
  rightPost.position.set(1.03, 0.9, 0);
  group.add(rightPost);

  const beam = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.26, 0.28), materials.gateGlow), true);
  beam.position.set(0, 1.58, 0);
  group.add(beam);

  return { mesh: group, length: 0.7, width: 2.3, roofY: 1.6 };
}

function createPickupMesh(type) {
  if (type === "coin") {
    return setMeshShadows(new THREE.Mesh(geometries.coin, materials.coin), true);
  }

  if (type === "magnet") {
    const group = new THREE.Group();
    const arc = setMeshShadows(new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.1, 12, 24, Math.PI), materials.magnet), true);
    arc.rotation.z = Math.PI;
    group.add(arc);

    const leftTip = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.22, 0.18), materials.magnetTip), true);
    leftTip.position.set(-0.34, -0.1, 0);
    group.add(leftTip);

    const rightTip = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.22, 0.18), materials.magnetTip), true);
    rightTip.position.set(0.34, -0.1, 0);
    group.add(rightTip);
    return group;
  }

  const group = new THREE.Group();
  const leftCanister = setMeshShadows(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.58, 10), materials.jetpack), true);
  leftCanister.position.set(-0.16, 0, 0);
  group.add(leftCanister);

  const rightCanister = setMeshShadows(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.58, 10), materials.jetpack), true);
  rightCanister.position.set(0.16, 0, 0);
  group.add(rightCanister);

  const glow = setMeshShadows(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.2), materials.jetpackGlow), true);
  glow.position.set(0, 0.18, 0);
  group.add(glow);
  return group;
}

function addObstacle(type, laneIndex, data, zPosition = CONFIG.spawnZ) {
  const obstacle = {
    id: obstacleId += 1,
    type,
    lane: laneIndex,
    mesh: data.mesh,
    x: laneX(laneIndex),
    z: zPosition,
    length: data.length,
    halfLength: data.length * 0.5,
    width: data.width,
    roofY: data.roofY,
    speedMultiplier: data.speedMultiplier ?? 1,
  };

  obstacle.mesh.position.set(obstacle.x, 0, obstacle.z);
  obstacleRoot.add(obstacle.mesh);
  obstacles.push(obstacle);
  return obstacle;
}

function spawnCoinLine(laneIndex, startZ, count, step, baseY, options = {}) {
  for (let index = 0; index < count; index += 1) {
    const mesh = createPickupMesh("coin");
    const pickup = {
      type: "coin",
      lane: laneIndex,
      x: laneX(laneIndex),
      z: startZ - index * step,
      baseY: baseY + Math.sin(index * 0.55) * 0.18,
      currentY: baseY,
      bobOffset: randomBetween(0, Math.PI * 2),
      speedMultiplier: options.speedMultiplier ?? 1,
      mesh,
    };
    mesh.position.set(pickup.x, pickup.baseY, pickup.z);
    pickupRoot.add(mesh);
    pickups.push(pickup);
  }
}

function spawnPowerup(type, laneIndex, zPosition) {
  const mesh = createPickupMesh(type);
  const pickup = {
    type,
    lane: laneIndex,
    x: laneX(laneIndex),
    z: zPosition,
    baseY: type === "jetpack" ? 1.95 : 1.55,
    currentY: type === "jetpack" ? 1.95 : 1.55,
    bobOffset: randomBetween(0, Math.PI * 2),
    mesh,
  };
  mesh.position.set(pickup.x, pickup.baseY, pickup.z);
  pickupRoot.add(mesh);
  pickups.push(pickup);
}

function spawnTrainPack(laneIndex) {
  const carCount = randomInt(CONFIG.trainCars[0], CONFIG.trainCars[1]);
  const includeRamp = Math.random() < 0.38;
  const train = createTrainMesh(carCount);
  train.speedMultiplier = includeRamp
    ? 1
    : (Math.random() < CONFIG.slowTrainChance
        ? randomBetween(CONFIG.slowTrainSpeedRange[0], CONFIG.slowTrainSpeedRange[1])
        : 1);

  let trainZ = CONFIG.spawnZ;
  if (includeRamp) {
    const ramp = addObstacle("ramp", laneIndex, createRampMesh(), CONFIG.spawnZ);
    trainZ = ramp.z - ramp.halfLength - CONFIG.rampGap - train.length * 0.5;
  }

  const obstacle = addObstacle("train", laneIndex, train, trainZ);
  spawnCoinLine(
    laneIndex,
    obstacle.z + obstacle.halfLength - 2,
    carCount * 3,
    2.9,
    train.roofY + 1.12,
    { speedMultiplier: obstacle.speedMultiplier }
  );
}

function spawnHazardPack() {
  const laneIndex = randomInt(0, game.laneCount - 1);
  const roll = Math.random();

  if (roll < 0.42) {
    spawnTrainPack(laneIndex);
    return;
  }

  if (roll < 0.74) {
    addObstacle("barrier", laneIndex, createBarrierMesh());
    const alternateLane = Math.min(game.laneCount - 1, Math.max(0, laneIndex + choose([-1, 1])));
    spawnCoinLine(alternateLane, CONFIG.spawnZ - 2, randomInt(4, 7), 2.8, 1.28);
    return;
  }

  addObstacle("gate", laneIndex, createGateMesh());
  spawnCoinLine(laneIndex, CONFIG.spawnZ - 8, randomInt(3, 5), 2.8, 0.92);
}

function spawnPickupPack() {
  const laneIndex = randomInt(0, game.laneCount - 1);
  const roll = Math.random();
  const canSpawnJetpack = !players.some((player) => player.jetpackTimer > 0) && !pickups.some((pickup) => pickup.type === "jetpack");

  if (roll < 0.7) {
    spawnCoinLine(laneIndex, CONFIG.spawnZ - 4, randomInt(5, 9), 2.8, 1.25);
    return;
  }

  if (roll < 0.92) {
    spawnPowerup("magnet", laneIndex, CONFIG.spawnZ - 2);
    spawnCoinLine(laneIndex, CONFIG.spawnZ - 8, randomInt(6, 9), 2.7, 1.3);
    return;
  }

  if (!canSpawnJetpack) {
    spawnCoinLine(laneIndex, CONFIG.spawnZ - 5, randomInt(6, 10), 2.7, 1.35);
    return;
  }

  spawnPowerup("jetpack", laneIndex, CONFIG.spawnZ - 2);
  spawnCoinLine(laneIndex, CONFIG.spawnZ - 10, randomInt(8, 12), 2.55, Math.max(4.8, CONFIG.jetpackHeight - 0.2));
}

function createScorePanel(player) {
  const panel = document.createElement("article");
  panel.className = "score-card";
  panel.style.setProperty("--accent", player.accent);
  panel.innerHTML = `
    <strong>${player.name}</strong>
    <div class="lives-display" aria-label="${CONFIG.startingLives} lives"></div>
    <p class="score-value">0</p>
    <p class="score-meta">Distance 0m | Coins 0</p>
    <span class="score-status">running</span>
  `;
  scoreboard.appendChild(panel);
  player.panel = panel;
}

function refreshPanels() {
  scoreboard.innerHTML = "";
  scoreboard.classList.toggle("single", players.length === 1);
  players.forEach((player) => createScorePanel(player));
}

function updateLivesDisplay(player) {
  if (!player.panel) {
    return;
  }

  const livesDisplay = player.panel.querySelector(".lives-display");
  if (!livesDisplay) {
    return;
  }

  const maxLivesShown = Math.max(CONFIG.startingLives, ...players.map((entry) => entry.lives));
  const filledHearts = Array.from(
    { length: player.lives },
    () => '<span class="heart full" aria-hidden="true">&#10084;</span>'
  ).join("");
  const emptyHearts = Array.from(
    { length: Math.max(0, maxLivesShown - player.lives) },
    () => '<span class="heart empty" aria-hidden="true">&#10084;</span>'
  ).join("");

  livesDisplay.innerHTML = filledHearts + emptyHearts;
  livesDisplay.setAttribute("aria-label", `${player.lives} ${player.lives === 1 ? "life" : "lives"}`);
}

function getRespawnLane(player) {
  return chooseStartingLanes()[player.id] ?? player.targetLane ?? player.lane ?? Math.floor(game.laneCount / 2);
}

function clearPlayerEffects(player) {
  player.slideTimer = 0;
  player.jetpackTimer = 0;
  player.jetpackTargetY = CONFIG.jetpackHeight;
  player.magnetTimer = 0;
  player.verticalVelocity = 0;
  player.lateralVelocity = 0;
  player.onTrainId = null;
  player.lastTrainId = null;
  player.dropThroughTrainId = null;
}

function respawnPlayer(player) {
  const respawnLane = getRespawnLane(player);
  clearPlayerEffects(player);
  player.alive = true;
  player.lane = respawnLane;
  player.targetLane = respawnLane;
  player.x = laneX(respawnLane);
  player.y = 0;
  player.grounded = true;
  player.invulnerableTimer = CONFIG.respawnInvulnerability;
}

function defeatPlayer(player) {
  clearPlayerEffects(player);
  player.alive = false;
  player.lives = 0;
  player.grounded = false;
  player.invulnerableTimer = 0;
}

function getOpponent(player) {
  return players.find((entry) => entry.id !== player.id && entry.lives > 0);
}

function stealLifeForScore(player) {
  const opponent = getOpponent(player);
  if (!opponent) {
    return;
  }

  player.score = 0;
  player.lives += 1;
  opponent.lives = Math.max(0, opponent.lives - 1);

  if (opponent.lives === 0) {
    defeatPlayer(opponent);
    finishRun(opponent);
  }
}

function addScore(player, amount) {
  if (!player.alive || amount <= 0 || !Number.isFinite(amount)) {
    return;
  }

  player.score += amount;
  if (players.length > 1 && game.running && player.score >= CONFIG.scoreStealThreshold) {
    stealLifeForScore(player);
  }
}

function nudgeJetpackHeight(player, direction, amount = CONFIG.jetpackTouchStep) {
  if (!player || !player.alive || player.jetpackTimer <= 0 || direction === 0) {
    return;
  }

  player.jetpackTargetY = THREE.MathUtils.clamp(
    player.jetpackTargetY + direction * amount,
    CONFIG.jetpackMinHeight,
    CONFIG.jetpackMaxHeight
  );
}

function getJetpackInput(player) {
  if (!player || !player.alive || player.jetpackTimer <= 0 || game.isTouchMode) {
    return 0;
  }

  if (player.id === 0) {
    return Number(pressed.has("KeyW")) - Number(pressed.has("KeyS"));
  }

  return Number(pressed.has("ArrowUp")) - Number(pressed.has("ArrowDown"));
}

function getDisplayedPowerState(player) {
  if (player.jetpackTimer > 0) {
    return {
      ratio: THREE.MathUtils.clamp(player.jetpackTimer / CONFIG.jetpackDuration, 0, 1),
      color: 0x6ff8ff,
    };
  }

  if (player.magnetTimer > 0) {
    return {
      ratio: THREE.MathUtils.clamp(player.magnetTimer / CONFIG.magnetDuration, 0, 1),
      color: 0xf85656,
    };
  }

  return null;
}

function updatePanel(player) {
  if (!player.panel) {
    return;
  }

  updateLivesDisplay(player);
  player.panel.querySelector(".score-value").textContent = String(Math.floor(player.score));
  player.panel.querySelector(".score-meta").textContent = `Distance ${Math.floor(player.distance)}m | Coins ${player.coins}`;

  const status = player.panel.querySelector(".score-status");
  if (!player.alive) {
    status.textContent = "out of hearts";
    status.classList.add("out");
    return;
  }

  if (player.invulnerableTimer > 0) {
    status.textContent = `shield ${player.invulnerableTimer.toFixed(1)}s`;
    status.classList.remove("out");
    return;
  }

  const powerUps = [];
  if (player.jetpackTimer > 0) {
    powerUps.push(`jetpack ${player.jetpackTimer.toFixed(1)}s`);
  }
  if (player.magnetTimer > 0) {
    powerUps.push(`magnet ${player.magnetTimer.toFixed(1)}s`);
  }

  if (powerUps.length > 0) {
    status.textContent = powerUps.join(" | ");
  } else if (player.slideTimer > 0) {
    status.textContent = "sliding";
  } else if (player.onTrainId) {
    status.textContent = "riding train";
  } else if (player.grounded) {
    status.textContent = "running";
  } else {
    status.textContent = "airborne";
  }
  status.classList.remove("out");
}

function updateHudCopy() {
  if (game.isTouchMode) {
    modeLabel.textContent = "Outdoor solo run. Three hearts, quick respawns, and easier train roofs.";
    controlHint.textContent = "Swipe left or right to switch tracks. Swipe up to jump, down to slide, and while jetpacking swipe up or down to change height. Some trains arrive with ramps or drift more slowly.";
    touchPrompt.textContent = "Swipe left or right to change lanes. Swipe up to jump, swipe down to slide, and while jetpacking swipe up or down to change height.";
    touchPrompt.classList.remove("hidden");
  } else {
    modeLabel.textContent = "Shared duel. Three hearts each, 10,000 points steals one heart, and train roofs are easier to ride.";
    controlHint.textContent = "Player 1 uses W A S D. Player 2 uses the arrow keys. Hold up or down while jetpacking to change height, use ramps onto trains, and just step off roofs to fall back down.";
    touchPrompt.classList.add("hidden");
  }
}

function chooseStartingLanes() {
  if (game.isTouchMode) {
    return [Math.floor((game.laneCount - 1) / 2)];
  }
  return [1, 2];
}

function resetPlayers() {
  removeAllChildren(playerRoot);
  players.length = 0;
  chooseStartingLanes().forEach((laneIndex, index) => {
    players.push(createPlayer(index, laneIndex));
  });
  refreshPanels();
}

function clearGameplayObjects() {
  obstacles.splice(0, obstacles.length).forEach((obstacle) => obstacleRoot.remove(obstacle.mesh));
  pickups.splice(0, pickups.length).forEach((pickup) => pickupRoot.remove(pickup.mesh));
}

function resetWorldDecor() {
  removeAllChildren(trackRoot);
  removeAllChildren(sceneryRoot);
  trackSegments.length = 0;
  scenerySegments.length = 0;

  game.laneCount = game.isTouchMode ? CONFIG.touchLaneCount : CONFIG.desktopLaneCount;
  game.laneOffsets = buildLaneOffsets(game.laneCount);
  game.trackHalfWidth = Math.abs(game.laneOffsets[game.laneOffsets.length - 1]) + CONFIG.laneGap * 0.65;

  const totalTrackLength = CONFIG.segmentLength * CONFIG.trackSegmentCount;
  for (let index = 0; index < CONFIG.trackSegmentCount; index += 1) {
    const zPosition = -index * CONFIG.segmentLength + CONFIG.segmentLength * 0.5;
    const segment = createTrackSegment(zPosition);
    trackRoot.add(segment);
    trackSegments.push({ mesh: segment, totalLength: totalTrackLength });
  }

  const totalSceneryLength = CONFIG.segmentLength * CONFIG.scenerySegmentCount;
  for (let index = 0; index < CONFIG.scenerySegmentCount; index += 1) {
    const zPosition = -index * CONFIG.segmentLength + CONFIG.segmentLength * 0.5;
    const segment = createScenerySegment(zPosition);
    sceneryRoot.add(segment);
    scenerySegments.push({ mesh: segment, totalLength: totalSceneryLength });
  }

  configureSky();
}

function resetGame() {
  game.isTouchMode = detectTouchMode();
  game.running = true;
  game.time = 0;
  game.speed = CONFIG.baseSpeed;
  game.nextHazardDistance = randomBetween(CONFIG.spawnHazardRange[0] * 0.65, CONFIG.spawnHazardRange[1] * 0.75);
  game.nextPickupDistance = randomBetween(CONFIG.spawnPickupRange[0] * 0.6, CONFIG.spawnPickupRange[1] * 0.8);

  overlay.classList.add("hidden");
  resetWorldDecor();
  clearGameplayObjects();
  resetPlayers();
  updateHudCopy();

  players.forEach((player) => updatePanel(player));
  lastFrame = 0;
}

function triggerJump(player) {
  if (!player || !player.alive || player.jetpackTimer > 0 || !player.grounded) {
    return;
  }

  player.grounded = false;
  player.onTrainId = null;
  player.verticalVelocity = CONFIG.jumpVelocity;
  player.slideTimer = 0;
}

function triggerSlide(player) {
  if (!player || !player.alive || player.jetpackTimer > 0 || !player.grounded) {
    return;
  }
  player.slideTimer = CONFIG.slideDuration;
}

function shiftLane(player, direction) {
  if (!player || !player.alive) {
    return;
  }
  player.targetLane = THREE.MathUtils.clamp(player.targetLane + direction, 0, game.laneCount - 1);
}

function handleDesktopKey(event) {
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
    event.preventDefault();
  }

  if (pressed.has(event.code) || event.repeat) {
    return;
  }
  pressed.add(event.code);

  if (!game.running && ["KeyR", "Enter", "Space"].includes(event.code)) {
    resetGame();
    return;
  }
  if (event.code === "KeyR") {
    resetGame();
    return;
  }
  if (event.code === "KeyA") {
    shiftLane(players[0], -1);
  }
  if (event.code === "KeyD") {
    shiftLane(players[0], 1);
  }
  if (event.code === "KeyW") {
    if (players[0]?.jetpackTimer > 0) {
      nudgeJetpackHeight(players[0], 1, CONFIG.jetpackTouchStep * 0.7);
    } else {
      triggerJump(players[0]);
    }
  }
  if (event.code === "KeyS") {
    if (players[0]?.jetpackTimer > 0) {
      nudgeJetpackHeight(players[0], -1, CONFIG.jetpackTouchStep * 0.7);
    } else {
      triggerSlide(players[0]);
    }
  }

  if (!game.isTouchMode && players[1]) {
    if (event.code === "ArrowLeft") {
      shiftLane(players[1], -1);
    }
    if (event.code === "ArrowRight") {
      shiftLane(players[1], 1);
    }
    if (event.code === "ArrowUp") {
      if (players[1].jetpackTimer > 0) {
        nudgeJetpackHeight(players[1], 1, CONFIG.jetpackTouchStep * 0.7);
      } else {
        triggerJump(players[1]);
      }
    }
    if (event.code === "ArrowDown") {
      if (players[1].jetpackTimer > 0) {
        nudgeJetpackHeight(players[1], -1, CONFIG.jetpackTouchStep * 0.7);
      } else {
        triggerSlide(players[1]);
      }
    }
  }
}

function handleKeyUp(event) {
  pressed.delete(event.code);
}

function registerTouchControls() {
  window.addEventListener("pointerdown", (event) => {
    if (!game.isTouchMode || event.pointerType === "mouse") {
      return;
    }
    touchState = { x: event.clientX, y: event.clientY, time: performance.now() };
  });

  window.addEventListener("pointerup", (event) => {
    if (!game.isTouchMode || !touchState || event.pointerType === "mouse") {
      touchState = null;
      return;
    }

    const elapsed = performance.now() - touchState.time;
    const dx = event.clientX - touchState.x;
    const dy = event.clientY - touchState.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (elapsed <= CONFIG.swipeWindow && Math.max(absX, absY) >= CONFIG.swipeThreshold) {
      const player = players[0];
      if (!player) {
        touchState = null;
        return;
      }

      if (absX > absY) {
        shiftLane(player, dx < 0 ? -1 : 1);
      } else if (player.jetpackTimer > 0) {
        nudgeJetpackHeight(player, dy < 0 ? 1 : -1);
      } else if (dy < 0) {
        triggerJump(player);
      } else {
        triggerSlide(player);
      }
    }
    touchState = null;
  });
}

function updateWorld(delta) {
  trackSegments.forEach((segment) => {
    segment.mesh.position.z += game.speed * delta;
    if (segment.mesh.position.z > CONFIG.segmentLength * 1.25) {
      segment.mesh.position.z -= segment.totalLength;
    }
  });

  scenerySegments.forEach((segment) => {
    segment.mesh.position.z += game.speed * delta;
    if (segment.mesh.position.z > CONFIG.segmentLength * 1.25) {
      segment.mesh.position.z -= segment.totalLength;
    }
  });
}

function updateSpawning(delta) {
  game.nextHazardDistance -= game.speed * delta;
  if (game.nextHazardDistance <= 0) {
    spawnHazardPack();
    game.nextHazardDistance = randomBetween(CONFIG.spawnHazardRange[0], CONFIG.spawnHazardRange[1]);
  }

  game.nextPickupDistance -= game.speed * delta;
  if (game.nextPickupDistance <= 0) {
    spawnPickupPack();
    game.nextPickupDistance = randomBetween(CONFIG.spawnPickupRange[0], CONFIG.spawnPickupRange[1]);
  }
}

function moveObstacles(delta) {
  for (let index = obstacles.length - 1; index >= 0; index -= 1) {
    const obstacle = obstacles[index];
    obstacle.z += game.speed * obstacle.speedMultiplier * delta;
    obstacle.mesh.position.z = obstacle.z;
    if (obstacle.z - obstacle.halfLength > CONFIG.cleanupZ) {
      obstacleRoot.remove(obstacle.mesh);
      obstacles.splice(index, 1);
    }
  }
}

function advancePlayers(delta) {
  const laneMin = game.laneOffsets[0] - CONFIG.laneGap * 0.6;
  const laneMax = game.laneOffsets[game.laneOffsets.length - 1] + CONFIG.laneGap * 0.6;

  players.forEach((player) => {
    if (!player.alive) {
      return;
    }

    if (player.slideTimer > 0) {
      player.slideTimer = Math.max(0, player.slideTimer - delta);
    }
    if (player.invulnerableTimer > 0) {
      player.invulnerableTimer = Math.max(0, player.invulnerableTimer - delta);
    }
    if (player.jetpackTimer > 0) {
      player.jetpackTimer = Math.max(0, player.jetpackTimer - delta);
    }
    if (player.magnetTimer > 0) {
      player.magnetTimer = Math.max(0, player.magnetTimer - delta);
    }

    player.x = THREE.MathUtils.damp(player.x, laneX(player.targetLane), 12, delta);
    player.x += player.lateralVelocity * delta;
    player.lateralVelocity = THREE.MathUtils.damp(player.lateralVelocity, 0, 8, delta);
    player.x = THREE.MathUtils.clamp(player.x, laneMin, laneMax);

    if (player.jetpackTimer > 0) {
      const jetpackInput = getJetpackInput(player);
      if (jetpackInput !== 0) {
        nudgeJetpackHeight(player, jetpackInput, CONFIG.jetpackVerticalSpeed * delta);
      }
      player.y = THREE.MathUtils.damp(player.y, player.jetpackTargetY, 8.5, delta);
      player.verticalVelocity = 0;
      player.grounded = false;
      player.onTrainId = null;
      player.lastTrainId = null;
      player.dropThroughTrainId = null;
      player.slideTimer = 0;
    } else {
      player.lastTrainId = player.onTrainId;
      player.verticalVelocity -= CONFIG.gravity * delta;
      player.y += player.verticalVelocity * delta;
      player.grounded = false;
      player.onTrainId = null;
      player.jetpackTargetY = CONFIG.jetpackHeight;
    }

    const distanceGain = game.speed * delta * 0.94;
    player.distance += distanceGain;
    addScore(player, distanceGain * CONFIG.scoreRate);
    player.runPhase += delta * (6.1 + game.speed * 0.09);
  });
}

function resolvePlayerBumping(delta) {
  if (players.length < 2) {
    return;
  }
  const [first, second] = players;
  if (!first.alive || !second.alive) {
    return;
  }

  const verticalGap = Math.abs(first.y - second.y);
  const dx = second.x - first.x;
  const distance = Math.abs(dx);
  if (verticalGap > 2.3 || distance >= CONFIG.bumpRadius) {
    return;
  }

  const overlap = CONFIG.bumpRadius - distance;
  const direction = distance > 0.02 ? Math.sign(dx) : (first.targetLane <= second.targetLane ? 1 : -1);
  const impulse = overlap * CONFIG.bumpForce * delta;

  first.lateralVelocity -= direction * impulse * 1.55;
  second.lateralVelocity += direction * impulse * 1.55;
  first.x -= direction * overlap * 0.16;
  second.x += direction * overlap * 0.16;

  if (first.targetLane === second.targetLane && overlap > CONFIG.bumpRadius * 0.35) {
    if (first.targetLane > 0) {
      first.targetLane -= 1;
    }
    if (second.targetLane < game.laneCount - 1) {
      second.targetLane += 1;
    }
  }
}

function findSupportingTrain(player) {
  return obstacles.find((obstacle) => {
    if (obstacle.type !== "train") {
      return false;
    }
    const withinZ = Math.abs(obstacle.z - CONFIG.playerZ) < obstacle.halfLength - 0.45;
    const withinX = Math.abs(obstacle.x - player.x) < obstacle.width * 0.58;
    const landingWindow = player.y <= obstacle.roofY + CONFIG.trainLandingAssistHeight && player.verticalVelocity <= 5.5;
    return withinZ && withinX && landingWindow;
  });
}

function getRampSupportY(ramp) {
  const localZ = CONFIG.playerZ - ramp.z;
  const progress = THREE.MathUtils.clamp((ramp.halfLength - localZ) / (ramp.halfLength * 2), 0, 1);
  return progress * ramp.roofY;
}

function findSupportingRamp(player) {
  return obstacles.find((obstacle) => {
    if (obstacle.type !== "ramp") {
      return false;
    }

    const withinZ = Math.abs(obstacle.z - CONFIG.playerZ) < obstacle.halfLength + 0.2;
    const withinX = Math.abs(obstacle.x - player.x) < obstacle.width * 0.5;
    const supportY = getRampSupportY(obstacle);
    const landingWindow = player.y <= supportY + 0.75 && player.verticalVelocity <= 6.2;
    return withinZ && withinX && landingWindow;
  });
}

function loseLife(player) {
  if (!player.alive || player.invulnerableTimer > 0) {
    return;
  }

  player.lives = Math.max(0, player.lives - 1);

  if (player.lives === 0) {
    defeatPlayer(player);
    finishRun(player);
    return;
  }

  respawnPlayer(player);
}

function resolveSupportsAndHazards() {
  players.forEach((player) => {
    if (!player.alive) {
      return;
    }

    let supportingRamp = null;

    if (player.jetpackTimer <= 0) {
      const train = findSupportingTrain(player);
      if (train) {
        player.y = train.roofY;
        player.verticalVelocity = 0;
        player.grounded = true;
        player.onTrainId = train.id;
        player.dropThroughTrainId = null;
      } else {
        supportingRamp = findSupportingRamp(player);
        if (supportingRamp) {
          player.y = getRampSupportY(supportingRamp);
          player.verticalVelocity = 0;
          player.grounded = true;
          player.dropThroughTrainId = null;
        } else if (player.lastTrainId && player.y > 0.05) {
          player.dropThroughTrainId = player.lastTrainId;
        } else if (player.y <= 0) {
          player.y = 0;
          player.verticalVelocity = 0;
          player.grounded = true;
          player.dropThroughTrainId = null;
        }
      }
    }

    if (player.jetpackTimer > 0 || player.invulnerableTimer > 0) {
      return;
    }

    for (const obstacle of obstacles) {
      const withinX = Math.abs(obstacle.x - player.x) < obstacle.width * 0.5 + CONFIG.playerCollisionRadius * 0.35;
      if (!withinX) {
        continue;
      }

      if (obstacle.type === "train") {
        const withinTrain = Math.abs(obstacle.z - CONFIG.playerZ) < obstacle.halfLength + 0.45;
        const safelyOnRamp = Boolean(supportingRamp) && player.y >= getRampSupportY(supportingRamp) - 0.1;
        const safelyAbove = player.y >= obstacle.roofY - 0.18 || player.onTrainId === obstacle.id || player.dropThroughTrainId === obstacle.id || safelyOnRamp;
        if (withinTrain && !safelyAbove) {
          loseLife(player);
        }
      }

      if (obstacle.type === "barrier") {
        const withinBarrier = Math.abs(obstacle.z - CONFIG.playerZ) < obstacle.halfLength + 0.58;
        if (withinBarrier && player.y < 1.18) {
          loseLife(player);
        }
      }

      if (obstacle.type === "gate") {
        const withinGate = Math.abs(obstacle.z - CONFIG.playerZ) < obstacle.halfLength + 0.48;
        if (withinGate && player.slideTimer <= 0 && player.y < 1.42) {
          loseLife(player);
        }
      }

      if (!player.alive) {
        break;
      }
    }
  });
}

function applyPickup(player, pickup) {
  if (pickup.type === "coin") {
    player.coins += 1;
    addScore(player, CONFIG.coinScore);
    return;
  }
  if (pickup.type === "magnet") {
    player.magnetTimer = Math.max(player.magnetTimer, CONFIG.magnetDuration);
    return;
  }
  player.jetpackTimer = Math.max(player.jetpackTimer, CONFIG.jetpackDuration);
  player.jetpackTargetY = THREE.MathUtils.clamp(Math.max(player.y + 1.2, CONFIG.jetpackHeight), CONFIG.jetpackMinHeight, CONFIG.jetpackMaxHeight);
}

function canCollectPickup(player, pickup) {
  const overlapZ = Math.abs(pickup.z - CONFIG.playerZ) < 1.05;
  const overlapX = Math.abs(pickup.x - player.x) < (player.jetpackTimer > 0 ? 0.96 : 0.8);
  const relativeY = pickup.currentY - player.y;
  const minY = player.jetpackTimer > 0 ? -0.45 : 0.05;
  const maxY = player.jetpackTimer > 0
    ? (pickup.type === "coin" ? 3.7 : 3.2)
    : (pickup.type === "coin" ? 2.4 : 2.8);
  const overlapY = relativeY >= minY && relativeY <= maxY;

  return overlapZ && overlapX && overlapY;
}

function updatePickups(delta) {
  for (let index = pickups.length - 1; index >= 0; index -= 1) {
    const pickup = pickups[index];
    pickup.z += game.speed * (pickup.speedMultiplier ?? 1) * delta;
    pickup.currentY = pickup.baseY + Math.sin(game.time * 4.2 + pickup.bobOffset) * (pickup.type === "coin" ? 0.18 : 0.12);

    let magnetTarget = null;
    if (pickup.type === "coin") {
      magnetTarget = players.find((player) => player.alive && player.magnetTimer > 0 && Math.hypot(pickup.x - player.x, pickup.z - CONFIG.playerZ) <= CONFIG.magnetRange);
    }

    if (magnetTarget) {
      pickup.x = THREE.MathUtils.damp(pickup.x, magnetTarget.x, 7.5, delta);
      pickup.z = THREE.MathUtils.damp(pickup.z, CONFIG.playerZ, 8.5, delta);
      pickup.currentY = THREE.MathUtils.damp(pickup.currentY, magnetTarget.y + 1.4, 6.5, delta);
    }

    pickup.mesh.position.set(pickup.x, pickup.currentY, pickup.z);
    pickup.mesh.rotation.y += delta * (pickup.type === "coin" ? 5 : 2.6);
    if (pickup.type === "magnet") {
      pickup.mesh.rotation.z += delta * 1.2;
    }
    if (pickup.type === "jetpack") {
      pickup.mesh.rotation.x += delta * 1.05;
    }

    const collector = players.find((player) => player.alive && canCollectPickup(player, pickup));

    if (collector) {
      applyPickup(collector, pickup);
      pickupRoot.remove(pickup.mesh);
      pickups.splice(index, 1);
      continue;
    }

    if (pickup.z > CONFIG.cleanupZ) {
      pickupRoot.remove(pickup.mesh);
      pickups.splice(index, 1);
    }
  }
}

function syncPlayerVisuals(delta) {
  players.forEach((player) => {
    const visuals = player.visuals;
    if (!player.alive) {
      visuals.figure.visible = true;
      visuals.root.position.x = player.x;
      visuals.root.position.y = Math.max(player.y, -0.35);
      visuals.figure.rotation.z = THREE.MathUtils.damp(visuals.figure.rotation.z, 1.3, 5, delta);
      visuals.figure.rotation.x = THREE.MathUtils.damp(visuals.figure.rotation.x, 0.35, 5, delta);
      visuals.shadow.scale.setScalar(0.84);
      visuals.pack.visible = false;
      visuals.powerBar.visible = false;
      visuals.magnetRing.visible = false;
      visuals.lifeOrbs.forEach((orb) => {
        orb.visible = false;
      });
      updatePanel(player);
      return;
    }

    const swingBase = player.jetpackTimer > 0 ? Math.sin(game.time * 12 + player.id) * 0.18 : Math.sin(player.runPhase) * (player.grounded ? 0.82 : 0.22);
    const slideBlend = player.slideTimer > 0 ? 1 : 0;

    visuals.leftArmPivot.rotation.x = swingBase * 0.9 - slideBlend * 0.92;
    visuals.rightArmPivot.rotation.x = -swingBase * 0.9 - slideBlend * 0.92;
    visuals.leftLegPivot.rotation.x = -swingBase * 0.95 + slideBlend * 0.72;
    visuals.rightLegPivot.rotation.x = swingBase * 0.95 + slideBlend * 0.72;

    visuals.figure.position.y = THREE.MathUtils.damp(visuals.figure.position.y, player.slideTimer > 0 ? 0.74 : 0, 12, delta);
    visuals.figure.rotation.x = THREE.MathUtils.damp(visuals.figure.rotation.x, player.jetpackTimer > 0 ? -0.18 : player.slideTimer > 0 ? -1.02 : 0, 10, delta);
    visuals.figure.scale.y = THREE.MathUtils.damp(visuals.figure.scale.y, player.slideTimer > 0 ? 0.7 : 1, 12, delta);
    visuals.root.position.set(player.x, player.y, CONFIG.playerZ);

    const visibleWhileInvulnerable = player.invulnerableTimer <= 0 || Math.floor(game.time * 16 + player.id) % 2 === 0;
    visuals.figure.visible = visibleWhileInvulnerable;
    visuals.lifeOrbs.forEach((orb, index) => {
      orb.visible = index < Math.min(player.lives, visuals.lifeOrbs.length) && visibleWhileInvulnerable;
      orb.scale.setScalar(1 + Math.sin(game.time * 5.5 + player.id + index * 0.35) * 0.04);
    });

    visuals.leftFlame.scale.y = 0.75 + Math.sin(game.time * 16 + player.id) * 0.18;
    visuals.rightFlame.scale.y = 0.75 + Math.cos(game.time * 16 + player.id) * 0.18;
    visuals.leftFlame.material.opacity = 0.62 + Math.sin(game.time * 14 + player.id) * 0.12;
    visuals.rightFlame.material.opacity = 0.62 + Math.cos(game.time * 14 + player.id) * 0.12;

    visuals.pack.visible = player.jetpackTimer > 0 && visibleWhileInvulnerable;
    visuals.magnetRing.visible = player.magnetTimer > 0 && visibleWhileInvulnerable;
    visuals.magnetRing.rotation.z += delta * 2.2;
    visuals.magnetRing.scale.setScalar(1 + Math.sin(game.time * 6 + player.id) * 0.04);

    const displayedPower = getDisplayedPowerState(player);
    visuals.powerBar.visible = Boolean(displayedPower) && visibleWhileInvulnerable;
    if (displayedPower) {
      visuals.powerBarFill.scale.x = Math.max(0.001, displayedPower.ratio);
      visuals.powerBarFill.position.x = -0.41 * (1 - displayedPower.ratio);
      visuals.powerBarFill.material.color.setHex(displayedPower.color);
      visuals.powerBarFill.material.emissive.setHex(displayedPower.color);
    }

    visuals.shadow.material.opacity = player.jetpackTimer > 0 ? 0.08 : 0.18;
    visuals.shadow.scale.set(1.15 - player.y * 0.05, 0.74 - player.y * 0.026, 1);
    updatePanel(player);
  });
}

function finishRun(loser = null) {
  game.running = false;
  overlay.classList.remove("hidden");

  if (players.length === 1) {
    overlayTitle.textContent = `Run score: ${Math.floor(players[0].score)}`;
    overlaySummary.textContent = `You ran out of hearts after ${Math.floor(players[0].distance)} meters and ${players[0].coins} coins.`;
    return;
  }

  const defeated = loser ?? players.find((player) => player.lives <= 0 || !player.alive) ?? players[1];
  const winner = players.find((player) => player !== defeated) ?? players[0];

  overlayTitle.textContent = `${winner.name} wins`;
  overlaySummary.textContent = `${defeated.name} ran out of hearts. ${winner.name} finished with ${winner.lives} ${winner.lives === 1 ? "life" : "lives"} and ${Math.floor(winner.score)} points.`;
}

function updateCamera(delta) {
  const activePlayers = players.filter((player) => player.alive);
  const followSet = activePlayers.length > 0 ? activePlayers : players;
  const averageX = followSet.reduce((sum, player) => sum + player.x, 0) / Math.max(followSet.length, 1);
  const highestY = followSet.reduce((highest, player) => Math.max(highest, player.y), 0);

  if (game.isTouchMode) {
    cameraPosition.set(averageX * 0.28, 7.1 + highestY * 0.18, 18.8);
    cameraTarget.set(averageX * 0.16, 1.9 + highestY * 0.14, -24);
  } else {
    cameraPosition.set(averageX * 0.22, 8.8 + highestY * 0.18, 22.5);
    cameraTarget.set(averageX * 0.14, 2.2 + highestY * 0.14, -25.5);
  }

  camera.position.lerp(cameraPosition, 1 - Math.exp(-delta * 4.8));
  camera.lookAt(cameraTarget);
}

function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate(timestamp) {
  if (!lastFrame) {
    lastFrame = timestamp;
  }
  const delta = Math.min((timestamp - lastFrame) / 1000, 0.05);
  lastFrame = timestamp;

  if (game.running) {
    game.time += delta;
    game.speed = Math.min(CONFIG.maxSpeed, CONFIG.baseSpeed + game.time * CONFIG.acceleration);

    updateWorld(delta);
    updateSpawning(delta);
    moveObstacles(delta);
    advancePlayers(delta);
    resolvePlayerBumping(delta);
    resolveSupportsAndHazards();
    updatePickups(delta);
  }

  syncPlayerVisuals(delta);
  updateCamera(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("keydown", handleDesktopKey);
window.addEventListener("keyup", handleKeyUp);
window.addEventListener("blur", () => pressed.clear());
window.addEventListener("resize", handleResize);

restartInline.addEventListener("click", resetGame);
restartOverlay.addEventListener("click", resetGame);

registerTouchControls();
resetGame();
handleResize();
requestAnimationFrame(animate);