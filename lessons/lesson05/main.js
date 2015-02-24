////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////Antud osa tegeleb WebGL konteksti loomisega ja meile vajaliku WebGLProgram objekti loomisega ///////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ShaderProgramLoader = require("./../utils/shaderprogramloader");
var Looper = require("./../utils/looper");

//Varjundajate kataloog
var SHADER_PATH = "shaders/lesson05/";

//Tekstuuri asukoht
var TEXTURE_PATH = "assets/texture.jpg";

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
var shaderProgram = shaderProgramLoader.getProgram(SHADER_PATH + "vertex.shader", SHADER_PATH + "fragment.shader", shadersLoaded);


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
//////////////////////////////////////////////////////// LESSON05 - TEKSTUUR////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var APP = {};

APP.looper = new Looper(canvas, loop);

//Kutsutakse kui varjundajad on laetud
function shadersLoaded() {
    setupAndLoadTexture();
    setup();

    APP.looper.loop();
}

//Tekstuuri initsialiseerimine ja laadimine
function setupAndLoadTexture() {

    //Loome uue tekstuuri ja koos sellega 1x1 pikslise pildi, mis kuvatakse senikaua, kuni tekstuur saab laetud
    APP.texture = GL.createTexture();
    GL.bindTexture(GL.TEXTURE_2D, APP.texture);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA,  GL.UNSIGNED_BYTE, new Uint8Array([1, 1, 1, 1]));
    GL.texParameterf(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.REPEAT);
    GL.texParameterf(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.REPEAT);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);

    var image = new Image();

    image.onload = function() {
        GL.bindTexture(GL.TEXTURE_2D, APP.texture);
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGB, GL.RGB,  GL.UNSIGNED_BYTE, image);
        GL.bindTexture(GL.TEXTURE_2D, null);
    };
    image.src = TEXTURE_PATH;

}

//Loob puhvrid ja maatriksid. Täidab puhvrid andmetega.
function setup() {
    //Teeme muutuja, kuhu salvestada aega, et kaamerat aja möödudes ümber objekti pöörata
    APP.time = 0;

    //Mudelmaatriks, millega objektiruumist maailmaruumi saada
    APP.modelMatrix = mat4.create();

    //Punkt, kus objekt hetkel asub
    APP.objectAt = [0.0, 0.0, -5.0];

    //Kasutades translatsiooni, saame mudelmaatriksiga objekti liigutada
    mat4.translate(APP.modelMatrix, APP.modelMatrix, APP.objectAt);

    //Kaameramaatriks, millega maailmaruumist kaameraruumi saada
    APP.viewMatrix = mat4.create();

    //Defineerime vektorid, mille abil on võimalik kaameraruumi baasvektorid arvutada
    APP.cameraAt = [0, 0, 5];            //Asub maailmaruumis nendel koordinaatidel
    APP.lookAt = [0, 0, -1];             //Mis suunas kaamera vaatab. Paremakäe koordinaatsüsteemis on -z ekraani sisse
    APP.up = [0, 1, 0];                  //Vektor, mis näitab, kus on kaamera ülesse suunda näitav vektor

    //Kalkuleerime antud koordinaatide järgi kaameramaatriksi
    mat4.lookAt(APP.viewMatrix, APP.cameraAt,APP.lookAt, APP.up);

    //Projektsioonimaatriks, et pügamisruumi saada. Kasutades glMatrix teeki genereerime ka püramiidi, kuhu sisse objektid lähevad.
    APP.projectionMatrix = mat4.create();
    mat4.perspective(APP.projectionMatrix, 45.0, GL.viewportWidth / GL.viewportHeight, 1.0, 1000.0);




    //Tippude andmed. Tipu koordinaadid x, y, z ja tekstuuri koordinaadid u, v
    APP.myVerticesData = [
        //Esimene külg
        -1.0, -1.0,  1.0,  0.0, 1.0,            //ALUMINE VASAK NURK
         1.0, -1.0,  1.0,  1.0, 1.0,            //ALUMINE PAREM NURK
         1.0,  1.0,  1.0,  1.0, 0.0,            //ÜLEMINE PAREM NURK
        -1.0,  1.0,  1.0,  0.0, 0.0,            //ÜLEMINE VASAK NURK

        //Tagumine külg
        -1.0, -1.0, -1.0,  0.0, 1.0,
        -1.0,  1.0, -1.0,  1.0, 1.0,
        1.0,  1.0, -1.0,   1.0, 0.0,
        1.0, -1.0, -1.0,   0.0, 0.0,

        //Ülemine külg
        -1.0,  1.0, -1.0,  0.0, 1.0,
        -1.0,  1.0,  1.0,  1.0, 1.0,
        1.0,  1.0,  1.0,    1.0, 0.0,
        1.0,  1.0, -1.0,  0.0, 0.0,

        //Alumine külg
        -1.0, -1.0, -1.0, 0.0, 1.0,
        1.0, -1.0, -1.0, 1.0, 1.0,
        1.0, -1.0,  1.0,  1.0, 0.0,
        -1.0, -1.0,  1.0, 0.0, 0.0,

        //Parem külg
        1.0, -1.0, -1.0, 0.0, 1.0,
        1.0,  1.0, -1.0, 1.0, 1.0,
        1.0,  1.0,  1.0,  1.0, 0.0,
        1.0, -1.0,  1.0, 0.0, 0.0,

        //Vasak külg
        -1.0, -1.0, -1.0, 0.0, 1.0,
        -1.0, -1.0,  1.0, 1.0, 1.0,
        -1.0,  1.0,  1.0,  1.0, 0.0,
        -1.0,  1.0, -1.0, 0.0, 0.0,
    ];
    APP.vertexSize = 5;

    //Loome puhvri, kuhu tipuandmed viia. Seome ka antud puhvri kontekstiga, et temale käske edasi anda
    APP.vertexBuffer = GL.createBuffer();

    GL.bindBuffer(GL.ARRAY_BUFFER, APP.vertexBuffer);

    //Anname loodud puhvrile andmed
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(APP.myVerticesData), GL.STATIC_DRAW);

    //Tippude indeksid
    APP.myIndicesData = [
        0, 1, 2,      0, 2, 3,    // Esimene külg
        4, 5, 6,      4, 6, 7,    // Tagumine külg
        8, 9, 10,     8, 10, 11,  // Ülemine külg
        12, 13, 14,   12, 14, 15, // Alumine külg
        16, 17, 18,   16, 18, 19, // Parem külg
        20, 21, 22,   20, 22, 23  // Vasak külg
    ];

    //Loome puhvri, kuhu indeksid viia. Seome ka antud puhvri kontekstiga, et temale käske edasi anda
    APP.indexBuffer = GL.createBuffer();
    APP.indexBuffer.numberOfIndexes = 36;
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, APP.indexBuffer);

    //Anname loodud puhvrile andmed
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(APP.myIndicesData), GL.STATIC_DRAW);

    //Määrame programmi, mida me renderdamisel kasutada tahame
    GL.useProgram(shaderProgram);

    //Saame indeksi, mis näitab kus asub meie programmis kasutatavas tipuvarjundajas
    //olev tipuatribuut nimega a_VertexPosition
    APP.a_Position = GL.getAttribLocation(shaderProgram, "a_Position");

    //Saame värviatribuudi asukoha
    APP.a_TextureCoord = GL.getAttribLocation(shaderProgram, "a_TextureCoord");

    //Saame ühtsete muutujate asukohad
    APP.u_ModelMatrix = GL.getUniformLocation(shaderProgram, "u_ModelMatrix");
    APP.u_ViewMatrix = GL.getUniformLocation(shaderProgram, "u_ViewMatrix");
    APP.u_ProjectionMatrix = GL.getUniformLocation(shaderProgram, "u_ProjectionMatrix");
    APP.u_Texture = GL.getUniformLocation(shaderProgram, "u_Texture");
}

//Kutsutakse välja Looper objektis iga kaader
function loop(deltaTime) {
    update(deltaTime);

    render();
}

//Uuendab andmeid, et oleks võimalik stseen liikuma panna
function update(deltaTime) {
    APP.time += deltaTime / 100;

   updateCamera();
   updateObject();
}

//Uuendab kaamerat, et seda oleks võimalik ümber objekti pöörata
function updateCamera() {
    var radius = 5;
    var cameraHeight = 0;

    //Leiame uue positsiooni, mis ajas liigub polaarses koordinaatsüsteemis ja mille teisendame ristkoordinaatsüsteemi
    APP.cameraAt = [APP.objectAt[0] + radius * Math.cos(APP.time),       // X
                     cameraHeight + APP.objectAt[1],                     // Y
                     APP.objectAt[2] + radius * Math.sin(APP.time)];     // Z

    //Leiame suunavektori, kaamerast objektini
    var lookDirection = [APP.objectAt[0] - APP.cameraAt[0],               // X
                         APP.objectAt[1] - APP.cameraAt[1],               // Y
                         APP.objectAt[2] - APP.cameraAt[2]];              // Z

    //Leiame punkti, mida kaamera vaatab
    vec3.add(APP.lookAt, APP.cameraAt, lookDirection);


    //Uuendame kaameramaatriksit
    mat4.lookAt(APP.viewMatrix, APP.cameraAt, APP.lookAt, APP.up);


}

//uuendame objekti
function updateObject() {
    mat4.rotateX(APP.modelMatrix, APP.modelMatrix, 0.005);
}

//Renderdamine
function render() {

    //Ppuhastame ka värvi- ja sügavuspuhvrid, ning määrame uue puhastuvärvuse.
    //Hetkel puhastamine midagi ei tee, sest me renderdame vaid ühe korra, kuid kui me tsükklis seda tegema
    //on näha ka, mida nad teevad.
    GL.clearColor(0.5, 0.5, 0.5, 1.0);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    //Lülitame sisse sügavustesti
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LESS);

    //Seome tipupuhvri ja määrame, kus antud tipuatribuut asub antud massiivis.
    GL.bindBuffer(GL.ARRAY_BUFFER, APP.vertexBuffer);
    GL.vertexAttribPointer(APP.a_Position, 3, GL.FLOAT, false, APP.vertexSize * 4, 0);
    GL.vertexAttribPointer(APP.a_TextureCoord, 2, GL.FLOAT, false, APP.vertexSize * 4, APP.vertexSize * 4 - 2 * 4);

    //Aktiveerime atribuudid
    GL.enableVertexAttribArray(APP.a_Position);
    GL.enableVertexAttribArray(APP.a_TextureCoord);

    //Aktiveerime ja määrame tekstuuri
    GL.activeTexture(GL.TEXTURE0);
    GL.bindTexture(GL.TEXTURE_2D, APP.texture);
    GL.uniform1i(APP.u_Texture, 0);

    //Saadame meie maatriksid ka varjundajasse
    GL.uniformMatrix4fv(APP.u_ModelMatrix, false, APP.modelMatrix);
    GL.uniformMatrix4fv(APP.u_ViewMatrix, false, APP.viewMatrix);
    GL.uniformMatrix4fv(APP.u_ProjectionMatrix, false, APP.projectionMatrix);

    //Renderdame kolmnurgad indeksite järgi
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, APP.indexBuffer);
    GL.drawElements(GL.TRIANGLES, APP.indexBuffer.numberOfIndexes, GL.UNSIGNED_SHORT, 0);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////   LÕPP  /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

