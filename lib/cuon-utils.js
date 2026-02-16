function getWebGLContext(canvas) {
    return canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  }
  
  function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
  
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log("Shader compile failed:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  
  function initShaders(gl, vshaderSource, fshaderSource) {
    const vshader = loadShader(gl, gl.VERTEX_SHADER, vshaderSource);
    const fshader = loadShader(gl, gl.FRAGMENT_SHADER, fshaderSource);
    if (!vshader || !fshader) return false;
  
    const program = gl.createProgram();
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
  
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.log("Program link failed:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return false;
    }
  
    gl.useProgram(program);
    gl.program = program;
    return true;
  }
  