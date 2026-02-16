class CubeMesh {
  constructor(gl) {
    this.gl = gl;

    // position xyz, uv
    const v = new Float32Array([
      // front
      -0.5,-0.5, 0.5,  0,0,
       0.5,-0.5, 0.5,  1,0,
       0.5, 0.5, 0.5,  1,1,
      -0.5,-0.5, 0.5,  0,0,
       0.5, 0.5, 0.5,  1,1,
      -0.5, 0.5, 0.5,  0,1,

      // back
       0.5,-0.5,-0.5,  0,0,
      -0.5,-0.5,-0.5,  1,0,
      -0.5, 0.5,-0.5,  1,1,
       0.5,-0.5,-0.5,  0,0,
      -0.5, 0.5,-0.5,  1,1,
       0.5, 0.5,-0.5,  0,1,

      // left
      -0.5,-0.5,-0.5,  0,0,
      -0.5,-0.5, 0.5,  1,0,
      -0.5, 0.5, 0.5,  1,1,
      -0.5,-0.5,-0.5,  0,0,
      -0.5, 0.5, 0.5,  1,1,
      -0.5, 0.5,-0.5,  0,1,

      // right
       0.5,-0.5, 0.5,  0,0,
       0.5,-0.5,-0.5,  1,0,
       0.5, 0.5,-0.5,  1,1,
       0.5,-0.5, 0.5,  0,0,
       0.5, 0.5,-0.5,  1,1,
       0.5, 0.5, 0.5,  0,1,

      // top
      -0.5, 0.5, 0.5,  0,0,
       0.5, 0.5, 0.5,  1,0,
       0.5, 0.5,-0.5,  1,1,
      -0.5, 0.5, 0.5,  0,0,
       0.5, 0.5,-0.5,  1,1,
      -0.5, 0.5,-0.5,  0,1,

      // bottom
      -0.5,-0.5,-0.5,  0,0,
       0.5,-0.5,-0.5,  1,0,
       0.5,-0.5, 0.5,  1,1,
      -0.5,-0.5,-0.5,  0,0,
       0.5,-0.5, 0.5,  1,1,
      -0.5,-0.5, 0.5,  0,1,
    ]);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);

    this.count = 36;
  }

  bind(aPos, aUV) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 5 * 4, 0);
    gl.enableVertexAttribArray(aPos);

    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 5 * 4, 3 * 4);
    gl.enableVertexAttribArray(aUV);
  }

  draw() {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.count);
  }
}

window.CubeMesh = CubeMesh;
