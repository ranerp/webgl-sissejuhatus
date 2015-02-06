var SHADER_PATH = "shaders/tund00/";
var canvas = document.getElementById("canvas");

GL = initWebGL(canvas);

//Seadistame konteksti renderdamisresolutsiooni
GL.viewport(0, 0, canvas.width, canvas.height);

var ShaderProgramLoader = require("./../utils/shaderprogramloader");

var shaderProgramLoader = new ShaderProgramLoader();
var shaderProgram = shaderProgramLoader.getProgram(SHADER_PATH + "vertex.shader", SHADER_PATH + "fragment.shader");


//Üritame luua WebGL konteksti
function initWebGL(canvas) {
    GL = null;

    try {

        //Üritame luua tavalist konteksti, kui see ebaõnnestub üritame luua eksperimentaalset,
        //Mida kasutatakse spetsifikatsiooni arendamiseks
        GL = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    } catch (e) {}

    if(!GL) {
        alert("Unable to initilize WebGL. Your browser may not support it.");
    }

    return GL;
}