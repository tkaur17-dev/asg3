"use strict";

// Interleaved format: x, y, z, u, v

class Triangle {
  constructor() {
    // nice centered roof triangle, UV fits the texture
    this.verts = new Float32Array([
      // left, bottom
      -0.6, -0.4, 0.0,   0.0, 0.0,
      // right, bottom
       0.6, -0.4, 0.0,   1.0, 0.0,
      // top
       0.0,  0.8, 0.0,   0.5, 1.0
    ]);
    this.count = 3;
  }
}

class Square {
  constructor() {
    // centered square body made from 2 triangles
    // UV covers full texture
    const x0 = -0.6, x1 = 0.6;
    const y0 = -0.8, y1 = 0.6;

    this.verts = new Float32Array([
      // tri 1
      x0, y0, 0.0,   0.0, 0.0,
      x1, y0, 0.0,   1.0, 0.0,
      x1, y1, 0.0,   1.0, 1.0,

      // tri 2
      x0, y0, 0.0,   0.0, 0.0,
      x1, y1, 0.0,   1.0, 1.0,
      x0, y1, 0.0,   0.0, 1.0,
    ]);
    this.count = 6;
  }
}

window.Triangle = Triangle;
window.Square = Square;
