precision mediump float;

varying vec2 v_TextureCoord;

uniform sampler2D u_Texture;

void main(void) {
  vec4 color = texture2D(u_Texture, vec2(v_TextureCoord.s, v_TextureCoord.t));
  gl_FragColor = color;
}