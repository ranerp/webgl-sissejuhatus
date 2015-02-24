////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////Antud osa tegeleb WebGL konteksti loomisega ja meile vajaliku WebGLProgram objekti loomisega ///////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ShaderProgramLoader = require("./../utils/shaderprogramloader");

//Varjundajate kataloog
var SHADER_PATH = "shaders/lesson01/";

//Element, kuhu renderdame
var canvas = document.getElementById("canvas");

//Loome globaalse WebGL konteksti
GL = initWebGL(canvas);

//Seadistame renderdamisresolutsiooni
GL.viewport(0, 0, canvas.width, canvas.height);

//Loome uue programmi spetsifitseeritud varjundajatega. Kuna laadimine on asünkroonne, siis anname kaasa ka
//meetodi, mis kutsutakse välja kui varjundajad on laetud
var shaderProgramLoader = new ShaderProgramLoader();
var shaderProgram = shaderProgramLoader.getProgram(SHADER_PATH + "vertex.shader", SHADER_PATH + "fragment.shader", render);


//Üritame luua WebGL konteksti
function initWebGL(canvas) {
    var gl = null;

    try {

        //Üritame luua tavalist konteksti, kui see ebaõnnestub üritame luua eksperimentaalset,
        //Mida kasutatakse spetsifikatsiooni arendamiseks
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    } catch (e) {}

    if(!gl) {
        alert("Unable to initilize WebGL. Your browser may not support it.");
        throw Error("Execution terminated. No WebGL context");
    }

    return gl;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////// LESSON01 - VÄRV /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function render() {

    //Tippude andmed, mis moodustavad ühe kolmnurga
    var myVerticesData = [
        0.0,   1.0,  0.0,   // Tipp 1
       -1.0,  -1.0,  0.0,   // Tipp 2
        1.0,  -1.0,  0.0    // Tipp 3
    ];

    //Loome puhvri, kuhu tipuandmed viia. Seome ka antud puhvri kontekstiga, et temale käske edasi anda
    var vertexBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, vertexBuffer);

    //Anname loodud puhvrile andmed
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(myVerticesData), GL.STATIC_DRAW);

    //Tippude värvid
    var myVerticesColor = [
        1.0,  0.0,  0.0,   // Tipp 1 punane
        0.0,  1.0,  0.0,   // Tipp 2 roheline
        0.0,  0.0,  1.0    // Tipp 3 sinine
    ];

    //Loome puhvri ja seome kontekstiga
    var colorBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, colorBuffer);

    //Anname kontekstiga seotud puhvrile andmed
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(myVerticesColor), GL.STATIC_DRAW);

    //Määrame programmi, mida me renderdamisel kasutada tahame
    GL.useProgram(shaderProgram);

    //Saame indeksi, mis näitab kus asub meie programmis kasutatavas tipuvarjundajas
    //olev tipuatribuut nimega a_VertexPosition
    var a_Position = GL.getAttribLocation(shaderProgram, "a_Position");

    //Saame värviatribuudi asukoha
    var a_Color = GL.getAttribLocation(shaderProgram, "a_Color");


    //Seome tipupuhvri ja määrame, kus antud tipuatribuut asub.
    GL.bindBuffer(GL.ARRAY_BUFFER, vertexBuffer);
    GL.vertexAttribPointer(a_Position, 3, GL.FLOAT, false, 0, 0);

    //Seome värvipuhvri ja määrame, kus antud atribuut asub.
    GL.bindBuffer(GL.ARRAY_BUFFER, colorBuffer);
    GL.vertexAttribPointer(a_Color, 3, GL.FLOAT, false, 0, 0);

    //Aktiveerime atribuudid
    GL.enableVertexAttribArray(a_Position);
    GL.enableVertexAttribArray(a_Color);

    //Renderdame Kolmnurgad
    GL.drawArrays(GL.TRIANGLES, 0, 3);


}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////   LÕPP  /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

