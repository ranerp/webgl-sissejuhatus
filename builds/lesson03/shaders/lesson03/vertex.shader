precision mediump float;

attribute vec3 a_Position;
attribute vec3 a_Color;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

varying vec3 v_Color;

void main(void) {
  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * vec4(a_Position, 1.0);

  v_Color = a_Color;
}