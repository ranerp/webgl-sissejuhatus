precision mediump float;

attribute vec3 a_Position;
attribute vec3 a_Color;

varying vec3 v_Color;

void main(void) {
  gl_Position = vec4(a_Position, 1.0);

  v_Color = a_Color;
}