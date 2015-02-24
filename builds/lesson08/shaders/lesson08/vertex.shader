precision mediump float;

attribute vec3 a_Position;
attribute vec3 a_Normal;
attribute vec2 a_TextureCoord;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

varying vec3 v_PositionCameraSpace;
varying vec3 v_NormalCameraSpace;
varying vec2 v_TextureCoord;

void main(void) {
  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * vec4(a_Position, 1.0);

  v_TextureCoord = a_TextureCoord;


  //Viime normaalvektor kaameraruumi
  v_NormalCameraSpace = (u_ViewMatrix * u_ModelMatrix * vec4(a_Normal, 0.0)).xyz;

  //Viime positsiooni kaameraruumi
  v_PositionCameraSpace = (u_ViewMatrix * u_ModelMatrix * vec4(a_Position, 1.0)).xyz;
}