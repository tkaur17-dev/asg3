class Matrix4 {
  constructor(src) {
    this.elements = new Float32Array(16);
    if (src && src.elements) this.elements.set(src.elements);
    else this.setIdentity();
  }

  setIdentity() {
    const e = this.elements;
    e[0]=1; e[4]=0; e[8]=0;  e[12]=0;
    e[1]=0; e[5]=1; e[9]=0;  e[13]=0;
    e[2]=0; e[6]=0; e[10]=1; e[14]=0;
    e[3]=0; e[7]=0; e[11]=0; e[15]=1;
    return this;
  }

  setTranslate(x,y,z) {
    this.setIdentity();
    const e = this.elements;
    e[12]=x; e[13]=y; e[14]=z;
    return this;
  }

  translate(x,y,z) {
    const t = new Matrix4().setTranslate(x,y,z);
    return this.multiply(t);
  }

  setScale(x,y,z) {
    this.setIdentity();
    const e = this.elements;
    e[0]=x; e[5]=y; e[10]=z;
    return this;
  }

  scale(x,y,z) {
    const s = new Matrix4().setScale(x,y,z);
    return this.multiply(s);
  }

  setRotate(angle, x, y, z) {
    const e = this.elements;
    let rad = angle * Math.PI / 180;
    let s = Math.sin(rad);
    let c = Math.cos(rad);

    // normalize axis
    let len = Math.hypot(x,y,z);
    if (len === 0) return this.setIdentity();
    x /= len; y /= len; z /= len;

    const nc = 1 - c;

    e[0]  = x*x*nc + c;
    e[1]  = y*x*nc + z*s;
    e[2]  = z*x*nc - y*s;
    e[3]  = 0;

    e[4]  = x*y*nc - z*s;
    e[5]  = y*y*nc + c;
    e[6]  = z*y*nc + x*s;
    e[7]  = 0;

    e[8]  = x*z*nc + y*s;
    e[9]  = y*z*nc - x*s;
    e[10] = z*z*nc + c;
    e[11] = 0;

    e[12] = 0;
    e[13] = 0;
    e[14] = 0;
    e[15] = 1;

    return this;
  }

  rotate(angle, x, y, z) {
    const r = new Matrix4().setRotate(angle, x, y, z);
    return this.multiply(r);
  }

  multiply(other) {
    const a = this.elements;
    const b = other.elements;
    const r = new Float32Array(16);

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        r[col*4 + row] =
          a[0*4 + row] * b[col*4 + 0] +
          a[1*4 + row] * b[col*4 + 1] +
          a[2*4 + row] * b[col*4 + 2] +
          a[3*4 + row] * b[col*4 + 3];
      }
    }

    this.elements = r;
    return this;
  }

  setPerspective(fovy, aspect, near, far) {
    const e = this.elements;
    const f = 1.0 / Math.tan((fovy * Math.PI / 180) / 2);
    this.setIdentity();

    e[0] = f / aspect;
    e[5] = f;
    e[10] = (far + near) / (near - far);
    e[11] = -1;
    e[14] = (2 * far * near) / (near - far);
    e[15] = 0;
    return this;
  }

  setLookAt(ex, ey, ez, ax, ay, az, ux, uy, uz) {
    let fx = ax - ex, fy = ay - ey, fz = az - ez;
    let rlf = 1 / (Math.hypot(fx,fy,fz) || 1);
    fx*=rlf; fy*=rlf; fz*=rlf;

    // s = f x up
    let sx = fy*uz - fz*uy;
    let sy = fz*ux - fx*uz;
    let sz = fx*uy - fy*ux;
    let rls = 1 / (Math.hypot(sx,sy,sz) || 1);
    sx*=rls; sy*=rls; sz*=rls;

    // u = s x f
    let ux2 = sy*fz - sz*fy;
    let uy2 = sz*fx - sx*fz;
    let uz2 = sx*fy - sy*fx;

    const e = this.elements;
    e[0]=sx;  e[4]=sy;  e[8]=sz;   e[12]=0;
    e[1]=ux2; e[5]=uy2; e[9]=uz2;  e[13]=0;
    e[2]=-fx; e[6]=-fy; e[10]=-fz; e[14]=0;
    e[3]=0;   e[7]=0;   e[11]=0;   e[15]=1;

    this.translate(-ex, -ey, -ez);
    return this;
  }
}

window.Matrix4 = Matrix4;
