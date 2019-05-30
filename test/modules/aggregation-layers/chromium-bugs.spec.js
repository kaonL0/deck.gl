import {gl} from '@deck.gl/test-utils';
import test from 'tape-catch';

const VS = `\
attribute vec2 positions;
void main(void) {
  gl_Position = vec4(positions, 0., 1.);
}
`;
const FS = `\
precision highp float;
uniform vec4 color;
void main(void) {
  gl_FragColor = color;
}
`;
const MAX_32_BIT_FLOAT = 3.402823466e38;
// test('EXT_float_blend availability', t => {
//   const ext = gl.getExtension('EXT_float_blend');
//   t.ok(ext !== null, 'EXT_float_blend should be available');
//   t.end();
// });

/* eslint-disable max-statements */

// function logAnyCompileErrors(shader, source, type) {
//   if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
//       console.error(`${type} compilation failed`)
//       console.error(gl.getShaderInfoLog(shader));
//       const lines = source.split("\n");
//       for (let i = 0; i < lines.length; ++i) {
//           console.error(`${i + 1}: ${lines[i]}`);
//       }
//   } else {
//     console.log(`${type} succefully compiled`)
//   }
// }

test(`Float blending (WebGL API)`, t => {
  if (gl.getExtension('EXT_color_buffer_float') === null) {
    t.comment('EXT_color_buffer_float not supported skipping');
    t.end();
    return;
  }
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const drawColor1 = [1.0, 11.0, 111.0, 1111.0];
  // const drawColor2 = [2.0, 2.0, 222.0, 2222.0];

  // set up Program
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(vs, VS);
  gl.compileShader(vs);
  // logAnyCompileErrors(vs, VS, 'Vertex Shader');

  gl.shaderSource(fs, FS);
  gl.compileShader(fs);
  // logAnyCompileErrors(fs, FS, 'Fragment Shader');

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);

  const colorLocation = gl.getUniformLocation(program, 'color');

  // set up Framebuffer
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.activeTexture(gl.TEXTURE0);
  const colorTarget = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, colorTarget);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTarget, 0);

  // GEOMETRY
  const quadArray = gl.createVertexArray();
  gl.bindVertexArray(quadArray);
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);

  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  gl.viewport(0, 0, width, height);
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
  gl.clearColor(0, 0, 0, MAX_32_BIT_FLOAT);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.blendEquationSeparate(gl.MAX, gl.MIN);

  gl.uniform4fv(colorLocation, drawColor1);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  const data = new Float32Array(4 * width * height);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, data);

  t.equal(data[0], drawColor1[0], 'red channel should match');
  t.equal(data[1], drawColor1[1], 'green channel should match');
  t.equal(data[2], drawColor1[2], 'blue channel should match');
  t.equal(data[3], drawColor1[3], 'alpha channel should match');

  // gl.uniform4fv(colorLocation, drawColor2);
  // gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  //
  // gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, data);
  //
  // const expected = drawColor1.map(
  //   (one, index) => (one > drawColor2[index] ? one : drawColor2[index])
  // );
  // expected[3] = drawColor1[3] < drawColor2[3] ? drawColor1[3] : drawColor2[3];
  // // expected
  // t.equal(data[0], expected[0], `red channel should match ${expected[0]}`);
  // t.equal(data[1], expected[1], `green channel should match ${expected[1]}`);
  // t.equal(data[2], expected[2], `blue channel should match ${expected[2]}`);
  // t.equal(data[3], expected[3], `alpha channel should match ${expected[3]}`);
  t.end();
});
