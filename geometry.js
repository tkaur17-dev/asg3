// geometry.js
// Simple Matrix4 that supports setIdentity, setTranslate, setScale, setRotateZ, multiply

class Matrix4Simple {
  constructor() {
    this.elements = new Float32Array(16);
    this.setIdentity();
  }

  setIdentity() {
    const e = this.elements;
    e[0] = 1;  e[4] = 0;  e[8]  = 0;  e[12] = 0;
    e[1] = 0;  e[5] = 1;  e[9]  = 0;  e[13] = 0;
    e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = 0;
    e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
    return this;
  }

  setTranslate(x, y, z) {
    this.setIdentity();
    const e = this.elements;
    e[12] = x;
    e[13] = y;
    e[14] = z;
    return this;
  }

  setScale(x, y, z) {
    this.setIdentity();
    const e = this.elements;
    e[0] = x;
    e[5] = y;
    e[10] = z;
    return this;
  }

  setRotateZ(rad) {
    this.setIdentity();
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const e = this.elements;
    e[0] = c;  e[4] = -s;
    e[1] = s;  e[5] =  c;
    return this;
  }

  multiply(other) {
    const a = this.elements;
    const b = other.elements;
    const r = new Float32Array(16);

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        r[i + j * 4] =
          a[i + 0 * 4] * b[0 + j * 4] +
          a[i + 1 * 4] * b[1 + j * 4] +
          a[i + 2 * 4] * b[2 + j * 4] +
          a[i + 3 * 4] * b[3 + j * 4];
      }
    }
    this.elements = r;
    return this;
  }
}

class Geometry {
  constructor(vertices) {
    this.vertices = new Float32Array(vertices); // x y z u v
    this.modelMatrix = new Matrix4Simple();

    this.translationMatrix = new Matrix4Simple();
    this.rotationMatrix = new Matrix4Simple();
    this.scaleMatrix = new Matrix4Simple();

    this.translationMatrix.setTranslate(0, 0, 0);
    this.rotationMatrix.setIdentity();
    this.scaleMatrix.setScale(1, 1, 1);
  }

  translate(x, y, z) {
    this.translationMatrix.setTranslate(x, y, z);
  }

  setRotateZ(rad) {
    this.rotationMatrix.setRotateZ(rad);
  }

  scale(x, y, z) {
    this.scaleMatrix.setScale(x, y, z);
  }

  buildModelMatrix() {
    this.modelMatrix.setIdentity();
    this.modelMatrix.multiply(this.translationMatrix);
    this.modelMatrix.multiply(this.rotationMatrix);
    this.modelMatrix.multiply(this.scaleMatrix);
  }
}
