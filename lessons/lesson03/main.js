////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////Antud osa tegeleb WebGL konteksti loomisega ja meile vajaliku WebGLProgram objekti loomisega ///////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ShaderProgramLoader = require("./../utils/shaderprogramloader");

//Varjundajate kataloog
var SHADER_PATH = "shaders/lesson03/";

//Element, kuhu renderdame
var canvas = document.getElementById("canvas");

//Loome globaalse WebGL konteksti
GL = initWebGL(canvas);

//Seadistame renderdamisresolutsiooni
GL.viewport(0, 0, canvas.width, canvas.height);
GL.viewportWidth = canvas.width;
GL.viewportHeight = canvas.height;

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
//////////////////////////////////////////////////////// LESSON03 - MAATRIKSID /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function render() {

    //Mudelmaatriks, millega objektiruumist maailmaruumi saada
    var modelMatrix = mat4.create();

    //Punkt, kus objekt hetkel asub
    var objectAt = [0.0, 0.0, -5.0];

    //Kasutades translatsiooni, saame mudelmaatriksiga objekti liigutada
    mat4.translate(modelMatrix, modelMatrix, objectAt);

    //Kaameramaatriks, millega maailmaruumist kaameraruumi saada
    var viewMatrix = mat4.create();

    //Defineerime vektorid, mille abil on võimalik kaameraruumi baasvektorid arvutada
    var cameraAt = [0, 0, 5];            //Asub maailmaruu mis nendel koordinaatidel
    var lookAt = [0, 0, -1];             //Mis suunas kaamera vaatab. Paremakäe koordinaatsüsteemis on -z ekraani sisse
    var up = [0, 1, 0];                  //Vektor, mis näitab, kus on kaamera ülesse suunda näitav vektor

    //Kalkuleerime antud koordinaatide järgi kaameramaatriksi
    mat4.lookAt(viewMatrix, cameraAt, lookAt, up);

    //Projektsioonimaatriks, et pügamisruumi saada. Kasutades glMatrix teeki genereerime ka püramiidi, kuhu sisse objektid lähevad.
    var projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45.0, GL.viewportWidth / GL.viewportHeight, 1.0, 1000.0);




    //Tippude andmed
    var myVerticesData = [
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0
    ];

    //Loome puhvri, kuhu tipuandmed viia. Seome ka antud puhvri kontekstiga, et temale käske edasi anda
    var vertexBuffer = GL.createBuffer();

    GL.bindBuffer(GL.ARRAY_BUFFER, vertexBuffer);

    //Anname loodud puhvrile andmed
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(myVerticesData), GL.STATIC_DRAW);

    //Tippude indeksid
    var myIndicesData = [
        0,  1,  2,
        0,  2,  3
    ];

    //Loome puhvri, kuhu indeksid viia. Seome ka antud puhvri kontekstiga, et temale käske edasi anda
    var indexBuffer = GL.createBuffer();
    indexBuffer.numberOfIndexes = 6;
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, indexBuffer);

    //Anname loodud puhvrile andmed
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(myIndicesData), GL.STATIC_DRAW);

    //Tippude värvid
    var myVerticesColor = [
        1.0,  0.0,  0.0,   // Tipp 1 punane
        0.0,  1.0,  0.0,   // Tipp 2 roheline
        0.0,  0.0,  1.0,   // Tipp 3 sinine
        1.0,  1.0,  0.0    //Tipp 4 kollane
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

    //Saame ühtsete muutujate asukohad
    var u_ModelMatrix = GL.getUniformLocation(shaderProgram, "u_ModelMatrix");
    var u_ViewMatrix = GL.getUniformLocation(shaderProgram, "u_ViewMatrix");
    var u_ProjectionMatrix = GL.getUniformLocation(shaderProgram, "u_ProjectionMatrix");

    //Seekord enne renderdamist puhastame ka värvi- ja sügavuspuhvrid, ning määrame uue puhastuvärvuse.
    //Hetkel puhastamine midagi ei tee, sest me renderdame vaid ühe korra, kuid kui me tsükklis seda tegema
    //on näha ka, mida nad teevad.
    GL.clearColor(0.0, 0.0, 0.0, 1.0);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    //Seome tipupuhvri ja määrame, kus antud tipuatribuut asub antud massiivis.
    GL.bindBuffer(GL.ARRAY_BUFFER, vertexBuffer);
    GL.vertexAttribPointer(a_Position, 3, GL.FLOAT, false, 0, 0);

    //Seome värvipuhvri ja määrame, kus antud atribuut asub antud massiivis.
    GL.bindBuffer(GL.ARRAY_BUFFER, colorBuffer);
    GL.vertexAttribPointer(a_Color, 3, GL.FLOAT, false, 0, 0);

    //Aktiveerime atribuudid
    GL.enableVertexAttribArray(a_Position);
    GL.enableVertexAttribArray(a_Color);

    //Saadame meie maatriksid ka varjundajasse
    GL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix);
    GL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix);
    GL.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix);

    //Renderdame kolmnurgad indeksite järgi
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, indexBuffer);
    GL.drawElements(GL.TRIANGLES, indexBuffer.numberOfIndexes, GL.UNSIGNED_SHORT, 0);


}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////   LÕPP  /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

