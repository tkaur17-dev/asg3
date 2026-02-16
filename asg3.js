const VSHADER = `
attribute vec3 a_Position;
attribute vec2 a_UV;

uniform mat4 u_Model;
uniform mat4 u_View;
uniform mat4 u_Proj;

varying vec2 v_UV;

void main() {
  gl_Position = u_Proj * u_View * u_Model * vec4(a_Position, 1.0);
  v_UV = a_UV;
}
`;

const FSHADER = `
precision mediump float;

uniform sampler2D u_Sampler;
uniform bool u_UseTexture;
uniform vec4 u_SolidColor;

varying vec2 v_UV;

void main() {
  if (u_UseTexture) {
    gl_FragColor = texture2D(u_Sampler, v_UV);
  } else {
    gl_FragColor = u_SolidColor;
  }
}
`;

let gl;
let canvas;

let a_Position;
let a_UV;

let u_Model;
let u_View;
let u_Proj;

let u_Sampler;
let u_UseTexture;
let u_SolidColor;

let cube;

const WORLD_W = 32;
const WORLD_D = 32;
const WORLD_H_MAX = 4;

const keys = Object.create(null);

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function degToRad(d) { return d * Math.PI / 180; }

const camera = {
  x: 0,
  y: 1.2,
  z: 10,
  yaw: 180,
  pitch: 0
};

function forwardVector() {
  const yaw = degToRad(camera.yaw);
  const pitch = degToRad(camera.pitch);
  const cp = Math.cos(pitch);
  return {
    x: Math.sin(yaw) * cp,
    y: Math.sin(pitch),
    z: Math.cos(yaw) * cp
  };
}

function rightVectorXZ() {
  const f = forwardVector();
  const len = Math.hypot(f.x, f.z) || 1;
  const fx = f.x / len;
  const fz = f.z / len;
  return { x: fz, z: -fx };
}

function makeWorldHeightsAndTypes() {
  const h = [];
  const t = [];
  for (let z = 0; z < WORLD_D; z++) {
    const hr = [];
    const tr = [];
    for (let x = 0; x < WORLD_W; x++) {
      hr.push(0);
      tr.push(0);
    }
    h.push(hr);
    t.push(tr);
  }

  // border walls
  for (let i = 0; i < WORLD_W; i++) {
    h[0][i] = 3; t[0][i] = 0;
    h[WORLD_D - 1][i] = 3; t[WORLD_D - 1][i] = 0;
    h[i][0] = 3; t[i][0] = 0;
    h[i][WORLD_W - 1] = 3; t[i][WORLD_W - 1] = 0;
  }

  // inside layout
  for (let x = 4; x <= 27; x++) { h[6][x] = 2; t[6][x] = 1; }
  for (let z = 6; z <= 22; z++) { h[z][12] = 2; t[z][12] = 1; }
  for (let x = 12; x <= 24; x++) { h[22][x] = 1; t[22][x] = 1; }
  for (let z = 10; z <= 26; z++) { h[z][22] = 2; t[z][22] = 1; }

  // towers
  h[10][10] = 4; t[10][10] = 0;
  h[18][16] = 4; t[18][16] = 0;
  h[24][24] = 4; t[24][24] = 0;

  // EXIT: both the border cell and the inside cell start blocked
  const exitX = 16;
  const exitZ = WORLD_D - 1;

  h[exitZ][exitX] = 1;       t[exitZ][exitX] = 0;
  h[exitZ - 1][exitX] = 1;   t[exitZ - 1][exitX] = 0;

  // marker
  h[exitZ - 2][exitX] = 2;   t[exitZ - 2][exitX] = 1;

  return { h, t, exitX, exitZ };
}

const world = makeWorldHeightsAndTypes();
const worldHeights = world.h;
const worldTypes = world.t;

let texBrick;
let texStone;

function initGL() {
  canvas = document.getElementById("webgl");
  gl = getWebGLContext(canvas);
  if (!gl) throw new Error("WebGL not supported");

  if (!initShaders(gl, VSHADER, FSHADER)) throw new Error("Shader init failed");

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  a_UV = gl.getAttribLocation(gl.program, "a_UV");

  u_Model = gl.getUniformLocation(gl.program, "u_Model");
  u_View = gl.getUniformLocation(gl.program, "u_View");
  u_Proj = gl.getUniformLocation(gl.program, "u_Proj");

  u_Sampler = gl.getUniformLocation(gl.program, "u_Sampler");
  u_UseTexture = gl.getUniformLocation(gl.program, "u_UseTexture");
  u_SolidColor = gl.getUniformLocation(gl.program, "u_SolidColor");

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  cube = new CubeMesh(gl);
  cube.bind(a_Position, a_UV);

  const proj = new Matrix4();
  proj.setPerspective(60, canvas.width / canvas.height, 0.1, 200);
  gl.uniformMatrix4fv(u_Proj, false, proj.elements);
}

function createTexture(url) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);

  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
    gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255])
  );

  const img = new Image();
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };
  img.src = url;

  return tex;
}

function bindTexture(tex) {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(u_Sampler, 0);
}

function installControls() {
  window.addEventListener("keydown", (e) => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

  canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
  });

  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement !== canvas) return;

    const sens = 0.12;
    camera.yaw += e.movementX * sens;
    camera.pitch -= e.movementY * sens;
    camera.pitch = clamp(camera.pitch, -85, 85);
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  canvas.addEventListener("mousedown", (e) => {
    if (document.pointerLockElement !== canvas) return;

    if (e.button === 0) tryEditBlock(true);
    if (e.button === 2) tryEditBlock(false);
  });
}

function update(dt) {
  const move = 6.0 * dt;
  const turn = 120.0 * dt;

  const f3 = forwardVector();
  const r = rightVectorXZ();

  if (keys["q"]) camera.yaw -= turn;
  if (keys["e"]) camera.yaw += turn;

  if (keys["w"]) { camera.x += f3.x * move; camera.z += f3.z * move; }
  if (keys["s"]) { camera.x -= f3.x * move; camera.z -= f3.z * move; }
  if (keys["a"]) { camera.x -= r.x * move; camera.z -= r.z * move; }
  if (keys["d"]) { camera.x += r.x * move; camera.z += r.z * move; }

  camera.y = 1.2;
}

function setView() {
  const f = forwardVector();
  const eye = [camera.x, camera.y, camera.z];
  const at = [camera.x + f.x, camera.y + f.y, camera.z + f.z];

  const view = new Matrix4();
  view.setLookAt(
    eye[0], eye[1], eye[2],
    at[0], at[1], at[2],
    0, 1, 0
  );
  gl.uniformMatrix4fv(u_View, false, view.elements);
}

function drawCubeModel(model, useTex, colorRGBA) {
  gl.uniformMatrix4fv(u_Model, false, model.elements);
  gl.uniform1i(u_UseTexture, useTex ? 1 : 0);
  gl.uniform4f(u_SolidColor, colorRGBA[0], colorRGBA[1], colorRGBA[2], colorRGBA[3]);
  cube.draw();
}

function drawSky() {
  const m = new Matrix4();
  m.setTranslate(camera.x, camera.y, camera.z);
  m.scale(150, 150, 150);

  gl.disable(gl.CULL_FACE);
  gl.disable(gl.DEPTH_TEST);

  drawCubeModel(m, false, [0.35, 0.45, 0.9, 1.0]);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
}

function drawGround() {
  const m = new Matrix4();
  m.setTranslate(0, -0.51, 0);
  m.scale(WORLD_W, 1, WORLD_D);
  drawCubeModel(m, false, [0.55, 0.75, 0.35, 1.0]);
}

function drawWalls() {
  const halfW = WORLD_W / 2;
  const halfD = WORLD_D / 2;

  for (let z = 0; z < WORLD_D; z++) {
    for (let x = 0; x < WORLD_W; x++) {
      const height = worldHeights[z][x];
      if (height <= 0) continue;

      const type = worldTypes[z][x];
      bindTexture(type === 0 ? texBrick : texStone);

      for (let y = 0; y < height; y++) {
        const m = new Matrix4();
        m.setTranslate(x - halfW + 0.5, y + 0.0, z - halfD + 0.5);
        drawCubeModel(m, true, [1, 1, 1, 1]);
      }
    }
  }
}

function worldCellInFront(dist) {
  const f3 = forwardVector();
  const px = camera.x + f3.x * dist;
  const pz = camera.z + f3.z * dist;

  const halfW = WORLD_W / 2;
  const halfD = WORLD_D / 2;

  const gx = Math.floor(px + halfW);
  const gz = Math.floor(pz + halfD);

  if (gx < 0 || gx >= WORLD_W || gz < 0 || gz >= WORLD_D) return null;
  return { gx, gz };
}

function tryEditBlock(add) {
  const cell = worldCellInFront(1.5);
  if (!cell) return;

  const gx = cell.gx;
  const gz = cell.gz;

  if (add) {
    if (worldHeights[gz][gx] < WORLD_H_MAX) {
      worldHeights[gz][gx] += 1;
      worldTypes[gz][gx] = 1;
    }
  } else {
    if (worldHeights[gz][gx] > 0) {
      worldHeights[gz][gx] -= 1;
    }
  }
}

let birdFreed = false;
let birdT = 0;

function isExitOpen() {
  const ex = world.exitX;
  const ez = world.exitZ;

  const borderOpen = worldHeights[ez][ex] === 0;
  const insideOpen = worldHeights[ez - 1][ex] === 0;

  return borderOpen && insideOpen;
}

function drawBird(dt) {
  if (!birdFreed && isExitOpen()) {
    birdFreed = true;
    birdT = 0;
  }

  birdT += dt;

  const halfW = WORLD_W / 2;
  const halfD = WORLD_D / 2;

  const bx = world.exitX;

  // Spawn one more cell inside so it is never inside the border wall stack
  const bz = world.exitZ - 2;

  const bob = Math.sin(birdT * 3.5) * 0.05;
  const flap = Math.sin(birdT * 9.0) * 0.10;

  let flyY = 0.7 + bob;
  let flyZOff = 0;

  if (birdFreed) {
    flyY = 0.7 + birdT * 1.6 + bob;
    flyZOff = birdT * 3.0;
  }

  const baseX = bx - halfW + 0.5;
  const baseZ = (bz - halfD + 0.5) + flyZOff;

  // solid color bird

  // body
  {
    const m = new Matrix4();
    m.setTranslate(baseX, flyY, baseZ);
    m.scale(0.50, 0.38, 0.38);
    drawCubeModel(m, false, [0.95, 0.95, 0.95, 1.0]);
  }

  // head
  {
    const m = new Matrix4();
    m.setTranslate(baseX + 0.26, flyY + 0.22, baseZ);
    m.scale(0.23, 0.23, 0.23);
    drawCubeModel(m, false, [1.0, 0.95, 0.25, 1.0]);
  }

  // beak
  {
    const m = new Matrix4();
    m.setTranslate(baseX + 0.40, flyY + 0.20, baseZ);
    m.scale(0.12, 0.08, 0.08);
    drawCubeModel(m, false, [1.0, 0.55, 0.1, 1.0]);
  }

  // left wing
  {
    const m = new Matrix4();
    m.setTranslate(baseX - 0.05, flyY + flap, baseZ - 0.26);
    m.scale(0.42, 0.07, 0.22);
    drawCubeModel(m, false, [0.95, 0.85, 0.18, 1.0]);
  }

  // right wing
  {
    const m = new Matrix4();
    m.setTranslate(baseX - 0.05, flyY - flap, baseZ + 0.26);
    m.scale(0.42, 0.07, 0.22);
    drawCubeModel(m, false, [0.95, 0.85, 0.18, 1.0]);
  }

  // tail
  {
    const m = new Matrix4();
    m.setTranslate(baseX - 0.28, flyY + 0.05, baseZ);
    m.scale(0.14, 0.10, 0.14);
    drawCubeModel(m, false, [0.9, 0.8, 0.15, 1.0]);
  }
}

let lastT = 0;

function tick(t) {
  const now = t * 0.001;
  const dt = Math.min(0.03, now - lastT);
  lastT = now;

  update(dt);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  setView();
  drawSky();
  drawGround();
  drawWalls();
  drawBird(dt);

  requestAnimationFrame(tick);
}

function main() {
  initGL();
  installControls();

  texBrick = createTexture("texture/brick.jpg");
  texStone = createTexture("texture/stone.jpg");

  requestAnimationFrame(tick);
}

main();
