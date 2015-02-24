precision mediump float;

varying vec3 v_PositionCameraSpace;
varying vec3 v_NormalCameraSpace;
varying vec2 v_TextureCoord;

uniform mat4 u_ViewMatrix;
uniform sampler2D u_Texture;

uniform vec3 u_DirectionalLightColor;
uniform vec3 u_DirectionalLightDirection;

uniform vec3 u_MaterialAmbientColor;
uniform vec3 u_MaterialDiffuseColor;
uniform vec3 u_MaterialSpecularColor;
uniform float u_MaterialShininess;

void main(void) {

  vec4 color = texture2D(u_Texture, vec2(v_TextureCoord.s, v_TextureCoord.t));

  //Leiame valguse suuna kaameraruumis, sest meil peavad kõik toimuma samas ruumis.
  vec3 lightDirectionCameraSpace = (u_ViewMatrix * vec4(u_DirectionalLightDirection, 0.0)).xyz;

  //Suunavektor alati normaliseerida
  vec3 lightDirectionNormal = normalize(lightDirectionCameraSpace);

  //Meie küllastunud valgus. Tekstuurist saadud värv koos materjali omadusega
  vec4 ambientColor = color * vec4(u_MaterialAmbientColor, 1.0);

  vec4 diffuseColor = vec4(0.0, 0.0, 0.0, 0.0);
  vec4 specularColor = vec4(0.0, 0.0, 0.0, 0.0);


  //Leiame nurga kiire ja normaalvektori vahel, et teada palju antud punkt valgust saab.
  float diffuseFactor = clamp(dot(v_NormalCameraSpace, -lightDirectionNormal), 0.0, 1.0);

  if(diffuseFactor > 0.0) {

    //Määrame hajusvalguse. Lisame juurde ka valguse värvuse, et ägedam oleks.
    diffuseColor = vec4(u_DirectionalLightColor, 0.0) * vec4(u_MaterialDiffuseColor, 0.0) * diffuseFactor;

    //Leiame suunavektori silma. Kuna kõik punktid on kaameraruumis, siis on see lihtsalt vastasuunaline punkti vektorile
    vec3 vertexToEye = normalize(-v_PositionCameraSpace);

    //Leiame peegelduse
    vec3 lightReflection = normalize(reflect(lightDirectionNormal, v_NormalCameraSpace));

    //Aeg on arvutada nurk kiire peegelduse ja meie silma vektori vahel. Clamp meetodiga viime ta piiridesse.
    float clampedVertexDotReflection = clamp(dot(vertexToEye, lightReflection), 0.0, 1.0);

    //Leiame peegeldusfaktori astendades selle läikega
    float specularFactor = pow(clampedVertexDotReflection, u_MaterialShininess);
    if(specularFactor > 0.0) {

        //Arvutame peegeldusvärvuse. Lisame ka valguse värvi, et ägedam oleks.
        specularColor =  vec4(u_DirectionalLightColor, 0.0) * vec4(u_MaterialSpecularColor, 0.0) * specularFactor;
    }

  }

  //Värv, mis kirjutatakse kaadripuhvrisse.
  gl_FragColor = ambientColor + diffuseColor + specularColor;
}