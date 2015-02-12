(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\prog\\webglstudy\\lessons\\lesson07\\main.js":[function(require,module,exports){
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////Antud osa tegeleb WebGL konteksti loomisega ja meile vajaliku WebGLProgram objekti loomisega ///////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ShaderProgramLoader = require("./../utils/shaderprogramloader");
var Looper = require("./../utils/looper");

//Varjundajate kataloog
var SHADER_PATH = "shaders/lesson07/";

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
//////////////////////////////////////////////////////// LESSON07 - RENDERDAMINE TEKSTUURILE /////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Küsime veebilehitsejalt sügavustekstuuri laiendust
var extDepth = GL.getExtension("WEBGL_depth_texture") ||
               GL.getExtension("WEBGKIT_WEBGL_depth_texture")||
               GL.getExtension("MOZ_WEBGL_depth_texture");
if(!extDepth) {
    alert("Browser does not support depth texture extension. See webglreport.com for more information.");
    throw error("No depth texture extension");
}

var APP = {};

APP.looper = new Looper(canvas, loop);

APP.isMouseDown = false;
document.addEventListener("mousedown", mouseClickHandler, false);
document.addEventListener("mouseup", mouseClickHandler, false);

document.addEventListener("mousewheel", mouseScrollHandler, false);
document.addEventListener("DOMMouseScroll", mouseScrollHandler, false);
document.addEventListener("onmousewheel", mouseScrollHandler, false);

//KONSTANDID KAAMERA JAOKS

//360 kraadi
APP.TWOPI = 2.0 * Math.PI;

//90 kraadi
APP.PIOVERTWO = Math.PI / 2.0;

//Maksimaalne vertikaalnurk
APP.MAX_VERTICAL = APP.PIOVERTWO - APP.PIOVERTWO / 8;

//Raadius, millest lähemale kaamera minna ei saa
APP.MIN_RADIUS = 1;

//Suumimiskonstant
APP.ZOOM_VALUE = 0.5;

//Kutsutakse kui varjundajad on laetud
function shadersLoaded() {
    setupAndLoadTexture();
    setupFrameBuffer();
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

//Valmistabe ette kaadripuhvri, kuhu stseen renderdada
function setupFrameBuffer() {

    //Loome kaadripuhvri, kuhu saame renderdamise järjekorras stseeni renderdada.
    APP.frameBuffer = GL.createFramebuffer();
    GL.bindFramebuffer(GL.FRAMEBUFFER, APP.frameBuffer);
    APP.frameBuffer.width = 512;
    APP.frameBuffer.height = 512;

    //Loome värvuspuhvri, mis hoiab piksleid
    APP.FBColorTexture = GL.createTexture();
    GL.bindTexture(GL.TEXTURE_2D, APP.FBColorTexture);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, APP.frameBuffer.width, APP.frameBuffer.height, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR_MIPMAP_NEAREST);
    GL.generateMipmap(GL.TEXTURE_2D);

    //Loome sügavuspuhvri, mis hoiab pikslite sügavusi
    APP.FBDepthBuffer = GL.createRenderbuffer();
    GL.bindRenderbuffer(GL.RENDERBUFFER, APP.FBDepthBuffer);
    GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, APP.frameBuffer.width, APP.frameBuffer.height);

    //Seome värvi- ja sügavuspuhvri antud kaadripuhvriga
    GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, APP.FBColorTexture, 0);
    GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, APP.FBDepthBuffer);

    GL.bindTexture(GL.TEXTURE_2D, null);
    GL.bindRenderbuffer(GL.RENDERBUFFER, null);
    GL.bindFramebuffer(GL.FRAMEBUFFER, null);
}

//Loob puhvrid ja maatriksid. Täidab puhvrid andmetega.
function setup() {
    //Teeme muutuja, kuhu salvestada aega, et kaamerat aja möödudes ümber objekti pöörata
    APP.time = 0;

    APP.cameraX = 0;
    APP.cameraY = 0;
    APP.radius = 5;

    //Mudelmaatriks, millega objektiruumist maailmaruumi saada
    APP.modelMatrix = mat4.create();

    //Mudelmaatriks, mida kasutame tekstuurile renderdamiseks
    APP.textureModelMatrix = mat4.create();

    //Punkt, kus objekt hetkel asub
    APP.objectAt = [0.0, 0.0, -5.0];

    //Kasutades translatsiooni, saame mudelmaatriksiga objekti liigutada
    mat4.translate(APP.modelMatrix, APP.modelMatrix, APP.objectAt);
    mat4.translate(APP.textureModelMatrix, APP.textureModelMatrix, APP.objectAt);

    //Kaameramaatriks, millega maailmaruumist kaameraruumi saada
    APP.viewMatrix = mat4.create();

    //Kaameramaatriks, mida kasutame tekstuurile renderdamiseks
    APP.textureViewMatrix = mat4.create();
    mat4.lookAt(APP.textureViewMatrix, [0, 0, 0], [0, 0, -5], [0, 1, 0]);

    //Defineerime vektorid, mille abil on võimalik kaameraruumi baasvektorid arvutada
    APP.cameraAt = vec3.create();            //Asub maailmaruumis nendel koordinaatidel
    APP.lookAt = vec3.create();             //Mis suunas kaamera vaatab. Paremakäe koordinaatsüsteemis on -z ekraani sisse
    APP.up = vec3.create();                  //Vektor, mis näitab, kus on kaamera ülesse suunda näitav vektor
    updateCamera();

    //Projektsioonimaatriks, et pügamisruumi saada. Kasutades glMatrix teeki genereerime ka püramiidi, kuhu sisse objektid lähevad.
    APP.projectionMatrix = mat4.create();
    mat4.perspective(APP.projectionMatrix, 45.0, GL.viewportWidth / GL.viewportHeight, 1.0, 1000.0);

    //Projektsioonimaatriks, mida kasutame tekstuurile renderdamiseks
    APP.textureProjectionMatrix = mat4.create();
    mat4.perspective(APP.textureProjectionMatrix, 45.0, 1, 0.1, 100.0);

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

function mouseClickHandler() {
    APP.isMouseDown = !APP.isMouseDown;

    if(APP.isMouseDown)
        document.addEventListener("mousemove", mouseMove, false);
    else
        document.removeEventListener("mousemove", mouseMove, false);
}

function mouseScrollHandler(e) {
    var delta = 0;

    if(!e)
        e = window.event;

    if(e.wheelDelta)                    /** Internet Explorer/Opera/Google Chrome **/
        delta = e.wheelDelta / 120;

    else if(e.detail)                   /** Mozilla Firefox **/
        delta = -e.detail/3;

    if(delta) {
        if(delta > 0 && APP.radius > APP.MIN_RADIUS)
            APP.radius -= APP.ZOOM_VALUE;
        else if(delta < 0)
            APP.radius += APP.ZOOM_VALUE;
    }

        if(e.preventDefault)
            e.preventDefault();
        e.returnValue = false;

    toCanonical();
    updateCamera();
}

//Hiire allhoidmisel ja liigutamisel käivitub antud funktsioon
function mouseMove(e) {
    var x = e.webkitMovementX || e.mozMovementX;
    var y = e.webkitMovementY || e.mozMovementY;

    if(typeof x === "undefined")
        x = 0;
    if(typeof y === "undefined")
        y = 0;


    APP.cameraX += x / 500;
    APP.cameraY += y / 500;

    restrictCameraY();
    toCanonical();

    updateCamera();
}

//Funktsioon, et viia horisontaalne ja vertikaalne nurk kanoonilisse vormi
//Implementeeritud 3D Math Primer for Graphics and Game Development juhendi järgi
function toCanonical() {

    //Kui oleme 0 koordinaatidel
    if(APP.radius == 0.0) {
        APP.cameraX = APP.cameraY = 0.0;

    } else {

        //Kui raadius on negatiivne.
        if(APP.radius < 0.0) {
            APP.radius = -APP.radius;
            APP.cameraX += Math.PI;
            APP.cameraY = -APP.cameraY;
        }

        //Vertikaalne nurk ülemisest piirist välja
        if(Math.abs(APP.cameraY) > APP.PIOVERTWO) {

            APP.cameraY += APP.PIOVERTWO;

            APP.cameraY -= Math.floor(APP.cameraY / APP.TWOPI) * APP.TWOPI;

            if(APP.cameraY > Math.PI) {
                APP.cameraX += Math.PI;

                APP.cameraY = 3.0 * Math.PI/2.0 - APP.cameraY;
            } else {
                APP.cameraY -= APP.PIOVERTWO;
            }
        }

        //GIMBAL LOCK
        if(Math.abs(APP.cameraY) >= APP.PIOVERTWO * 0.9999) {
            console.log("GIMBALLOCK");
            APP.cameraX = 0.0;

        } else {
            if(Math.abs(APP.cameraX) > Math.PI) {

                APP.cameraX += Math.PI;

                APP.cameraX -= Math.floor(APP.cameraX / APP.TWOPI) * APP.TWOPI;

                APP.cameraX -= Math.PI;

            }
        }
    }
}

function restrictCameraY() {
    if(Math.abs(APP.cameraY) > APP.MAX_VERTICAL) {
        if(APP.cameraY < 0)
            APP.cameraY = -APP.MAX_VERTICAL;
        else
            APP.cameraY = APP.MAX_VERTICAL;
    }
}

//Kutsutakse välja Looper objektis iga kaader
function loop(deltaTime) {
    update(deltaTime);

    //Määrame kaadripuhvriks meie enda loodud kaadripuhvri
    GL.bindFramebuffer(GL.FRAMEBUFFER, APP.frameBuffer);

    //Renderdame stseeni tekstuurile
    renderToTexture();

    //Seome lahti eelmise kaadripuhvri. Pärast seda on kasutusel tavaline puhver, mida kasutatakse canvas elemendi jaoks.
    GL.bindFramebuffer(GL.FRAMEBUFFER, null);

    render();
}

//Uuendab andmeid, et oleks võimalik stseen liikuma panna
function update(deltaTime) {
    APP.time += deltaTime / 100;

   updateObject();
}

//Uuendab kaamerat, et seda oleks võimalik ümber objekti pöörata
function updateCamera() {

    //Leiame uue positsiooni, mis ajas liigub polaarses koordinaatsüsteemis ja mille teisendame ristkoordinaatsüsteemi
    APP.cameraAt = [APP.objectAt[0] + APP.radius * Math.cos(APP.cameraY) * Math.sin(APP.cameraX),       // X
                     APP.objectAt[1] + APP.radius * -Math.sin(APP.cameraY),                     // Y
                     APP.objectAt[2] + APP.radius * Math.cos(APP.cameraY) * Math.cos(APP.cameraX)];     // Z


    //Leiame suunavektori, kaamerast objektini
    APP.lookDirection = [APP.objectAt[0] - APP.cameraAt[0],               // X
                         APP.objectAt[1] - APP.cameraAt[1],               // Y
                         APP.objectAt[2] - APP.cameraAt[2]];              // Z

    //Leiame punkti, mida kaamera vaatab
    vec3.add(APP.lookAt, APP.cameraAt, APP.lookDirection);

    APP.right = [
        Math.sin(APP.cameraX - Math.PI / 2),
        0,
        Math.cos(APP.cameraX - Math.PI / 2)
    ];

    vec3.normalize(APP.right, APP.right);
    vec3.normalize(APP.lookDirection, APP.lookDirection);
    vec3.cross(APP.up, APP.right, APP.lookDirection);

    //Uuendame kaameramaatriksit
    mat4.lookAt(APP.viewMatrix, APP.cameraAt, APP.lookAt, APP.up);


}

//uuendame objekti
function updateObject() {
    mat4.rotateX(APP.textureModelMatrix, APP.textureModelMatrix, 0.005);
}

//Renderdame tekstuurile
function renderToTexture() {
    GL.viewport(0, 0, APP.frameBuffer.width, APP.frameBuffer.height);
    GL.clearColor(1.0, 1.0, 1.0, 1.0);
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

    //Saadame meie tekstuuri maatriksid ka varjundajasse
    GL.uniformMatrix4fv(APP.u_ModelMatrix, false, APP.textureModelMatrix);
    GL.uniformMatrix4fv(APP.u_ViewMatrix, false, APP.textureViewMatrix);
    GL.uniformMatrix4fv(APP.u_ProjectionMatrix, false, APP.textureProjectionMatrix);

    //Renderdame kolmnurgad indeksite järgi
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, APP.indexBuffer);
    GL.drawElements(GL.TRIANGLES, APP.indexBuffer.numberOfIndexes, GL.UNSIGNED_SHORT, 0);

    GL.bindTexture(GL.TEXTURE_2D, APP.FBColorTexture);
    GL.generateMipmap(GL.TEXTURE_2D);
    GL.bindTexture(GL.TEXTURE_2D, null);

}


//Renderdamine
function render() {

    //Puhastame ka värvi- ja sügavuspuhvrid, ning määrame uue puhastuvärvuse.
    //Hetkel puhastamine midagi ei tee, sest me renderdame vaid ühe korra, kuid kui me tsükklis seda tegema
    //on näha ka, mida nad teevad.
    GL.viewport(0, 0, canvas.width, canvas.height);
    GL.clearColor(0.0, 0.0, 0.0, 1.0);
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
    GL.bindTexture(GL.TEXTURE_2D, APP.FBColorTexture);
    GL.uniform1i(APP.u_Texture, 0);

    //Saadame meie maatriksid ka varjundajasse
    GL.uniformMatrix4fv(APP.u_ModelMatrix, false, APP.modelMatrix);
    GL.uniformMatrix4fv(APP.u_ViewMatrix, false, APP.viewMatrix);
    GL.uniformMatrix4fv(APP.u_ProjectionMatrix, false, APP.projectionMatrix);

    //Renderdame kolmnurgad indeksite järgi
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, APP.indexBuffer);
    GL.drawElements(GL.TRIANGLES, APP.indexBuffer.numberOfIndexes, GL.UNSIGNED_SHORT, 0);
}


},{"./../utils/looper":"C:\\prog\\webglstudy\\lessons\\utils\\looper.js","./../utils/shaderprogramloader":"C:\\prog\\webglstudy\\lessons\\utils\\shaderprogramloader.js"}],"C:\\prog\\webglstudy\\lessons\\utils\\looper.js":[function(require,module,exports){
Looper = function(domElement, callback) {
    this.domElement = domElement;

    this.lastTime = 0;
    this.deltaTime = 0;

    this.requestId;

    this.callback = callback;

    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

    window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
};

Looper.prototype = {

    constructor: Looper,

    calculateDeltaTime: function() {
        var timeNow = new Date().getTime();

        if(this.lastTime != 0)
            this.deltaTime = (timeNow - this.lastTime) / 16;

        this.lastTime = timeNow;
    },

    loop: function() {
        this.requestId = requestAnimationFrame(this.loop.bind(this), this.domElement);

        this.calculateDeltaTime();

        this.callback(this.deltaTime);
    }

};

module.exports = Looper;
},{}],"C:\\prog\\webglstudy\\lessons\\utils\\shaderprogramloader.js":[function(require,module,exports){
/**
 * Hoiab endas WebGLProgram objekti ja WebGLShader tipuvarjundajat ja pikslivarjundajat
 *
 * @param {String} vertexShaderPath
 * @param {String} fragmentShaderPath
 * @param {function} onLinked Meetod, mis kutsutakse välja, kui varjundajad on laetud
 * @class
 */
var ProgramObject = function(vertexShaderPath, fragmentShaderPath, onLinked) {
    this.program = GL.createProgram();

    this.onLinked = onLinked;

    this.vertexShader = {
        "shader": GL.createShader(GL.VERTEX_SHADER),
        "path": vertexShaderPath,
        "src": "",
        "completed": false
    };

    this.fragmentShader = {
        "shader": GL.createShader(GL.FRAGMENT_SHADER),
        "path": fragmentShaderPath,
        "src": "",
        "completed": false
    };
};

ProgramObject.prototype = {

    constructor: ProgramObject,

    /**
     * Callback meetod, mis kompileerib ja sätestab varjundajad, kui mõlemad on asünkroonselt laetud
     *
     * @param {String} src Lähtekood, mis AJAX'i abil laeti
     * @param {String} path Tee, mille abil tuvastada, kumma varjundaja lähtekood on laetud
     */
    oncomplete: function(src, path) {
        if(path === this.vertexShader.path) {
            this.vertexShader.completed = true;
            this.vertexShader.src = src;
        }
        else if(path === this.fragmentShader.path) {
            this.fragmentShader.completed = true;
            this.fragmentShader.src = src;
        }

        if(this.vertexShader.completed && this.fragmentShader.completed) {
            this.compileShader(this.vertexShader.shader, this.vertexShader.src);
            this.compileShader(this.fragmentShader.shader, this.fragmentShader.src);

            GL.attachShader(this.program, this.vertexShader.shader);
            GL.attachShader(this.program, this.fragmentShader.shader);

            GL.linkProgram(this.program);

            if(!GL.getProgramParameter(this.program, GL.LINK_STATUS)) {
                throw Error("Error linking shader program: \"" + GL.getProgramInfoLog(this.program) + "\"");
            }

            if(typeof this.onLinked != "undefined")
                this.onLinked();
        }
    },

    /**
     * Üritab kompileerida varjundaja
     *
     * @param {WebGLShader} shader Varjundaja mida kompileerida
     * @param {String} source Lähtekood, mida kompileerida
     */
    compileShader: function(shader, source) {
        GL.shaderSource(shader, source);
        GL.compileShader(shader);

        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            throw Error("Shader compilation failed. Error: \"" + GL.getShaderInfoLog(shader) + "\"");
        }
    }
};

/**
 * Antud klassi abil on võimalik programmi laadida ja asünkroonselt tagapildil spetsifitseeritud varjundajad
 * tagastatud programmiga siduda
 *
 * @class ShaderProgramLoader
 */
var ShaderProgramLoader = function() {
    this.container = [];
    this.counter = -1;
};

ShaderProgramLoader.prototype = {
    constructor: ShaderProgramLoader,

    /**
     * Tagastab programm objekti. Asünkroonselt tagaplaanil laetakse ja kompileeritakse varjundajad. Enne kui
     * programmi kasutada tuleb kontrollida, et varjundajad on kompileeritud ja programmiga seotud. Võimalik on
     * parameetriks anda ka Callback funktsioon, mis teada annab, kui varjundajad on seotud.
     *
     * @param {String} vertexShaderPath Tee, tipuvarjundaja juurde
     * @param {String} fragmentShaderPath Tee, pikslivarjundaja juurde
     * @param {function} linkedCallback Funktsioon, mis kutsutakse välja, kui varjundajad on kompileeritud ja seotud programmiga
     * @returns {exports.defaultOptions.program|*|WebGLProgram|ProgramObject.program}
     */
    getProgram: function(vertexShaderPath, fragmentShaderPath, linkedCallback) {
        this.counter++;
        this.container[this.counter] = new ProgramObject(vertexShaderPath, fragmentShaderPath, linkedCallback);
        var program = this.container[this.counter];

        this.loadAsyncShaderSource(vertexShaderPath, program.oncomplete.bind(program));
        this.loadAsyncShaderSource(fragmentShaderPath, program.oncomplete.bind(program));

        return program.program;
    },

    /**
     * Laeb asünkroonselt lähtekoodi
     *
     * @param {String} shaderPath Tee, kus asub varjundaja
     * @param {function} callback Funktsioon, mis käivitatakse, kui lähtekood on kätte saadud. Saadetakse vastus ja tee.
     */
    loadAsyncShaderSource: function(shaderPath, callback) {
        $.ajax({
            async: true,
            dataType: "text",
            url: shaderPath,
            success: function(result) {
                callback(result, shaderPath);
            }
        });
    }

};

module.exports = ProgramObject;
module.exports = ShaderProgramLoader;
},{}]},{},["C:\\prog\\webglstudy\\lessons\\lesson07\\main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibGVzc29ucy9sZXNzb24wNy9tYWluLmpzIiwibGVzc29ucy91dGlscy9sb29wZXIuanMiLCJsZXNzb25zL3V0aWxzL3NoYWRlcnByb2dyYW1sb2FkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vL0FudHVkIG9zYSB0ZWdlbGViIFdlYkdMIGtvbnRla3N0aSBsb29taXNlZ2EgamEgbWVpbGUgdmFqYWxpa3UgV2ViR0xQcm9ncmFtIG9iamVrdGkgbG9vbWlzZWdhIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbnZhciBTaGFkZXJQcm9ncmFtTG9hZGVyID0gcmVxdWlyZShcIi4vLi4vdXRpbHMvc2hhZGVycHJvZ3JhbWxvYWRlclwiKTtcclxudmFyIExvb3BlciA9IHJlcXVpcmUoXCIuLy4uL3V0aWxzL2xvb3BlclwiKTtcclxuXHJcbi8vVmFyanVuZGFqYXRlIGthdGFsb29nXHJcbnZhciBTSEFERVJfUEFUSCA9IFwic2hhZGVycy9sZXNzb24wNy9cIjtcclxuXHJcbi8vVGVrc3R1dXJpIGFzdWtvaHRcclxudmFyIFRFWFRVUkVfUEFUSCA9IFwiYXNzZXRzL3RleHR1cmUuanBnXCI7XHJcblxyXG4vL0VsZW1lbnQsIGt1aHUgcmVuZGVyZGFtZVxyXG52YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIik7XHJcblxyXG4vL0xvb21lIGdsb2JhYWxzZSBXZWJHTCBrb250ZWtzdGlcclxuR0wgPSBpbml0V2ViR0woY2FudmFzKTtcclxuXHJcbi8vU2VhZGlzdGFtZSByZW5kZXJkYW1pc3Jlc29sdXRzaW9vbmlcclxuR0wudmlld3BvcnQoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuR0wudmlld3BvcnRXaWR0aCA9IGNhbnZhcy53aWR0aDtcclxuR0wudmlld3BvcnRIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xyXG5cclxuLy9Mb29tZSB1dWUgcHJvZ3JhbW1pIHNwZXRzaWZpdHNlZXJpdHVkIHZhcmp1bmRhamF0ZWdhLiBLdW5hIGxhYWRpbWluZSBvbiBhc8O8bmtyb29ubmUsIHNpaXMgYW5uYW1lIGthYXNhIGthXHJcbi8vbWVldG9kaSwgbWlzIGt1dHN1dGFrc2UgdsOkbGphIGt1aSB2YXJqdW5kYWphZCBvbiBsYWV0dWRcclxudmFyIHNoYWRlclByb2dyYW1Mb2FkZXIgPSBuZXcgU2hhZGVyUHJvZ3JhbUxvYWRlcigpO1xyXG52YXIgc2hhZGVyUHJvZ3JhbSA9IHNoYWRlclByb2dyYW1Mb2FkZXIuZ2V0UHJvZ3JhbShTSEFERVJfUEFUSCArIFwidmVydGV4LnNoYWRlclwiLCBTSEFERVJfUEFUSCArIFwiZnJhZ21lbnQuc2hhZGVyXCIsIHNoYWRlcnNMb2FkZWQpO1xyXG5cclxuXHJcbi8vw5xyaXRhbWUgbHV1YSBXZWJHTCBrb250ZWtzdGlcclxuZnVuY3Rpb24gaW5pdFdlYkdMKGNhbnZhcykge1xyXG4gICAgdmFyIGdsID0gbnVsbDtcclxuXHJcbiAgICB0cnkge1xyXG5cclxuICAgICAgICAvL8Occml0YW1lIGx1dWEgdGF2YWxpc3Qga29udGVrc3RpLCBrdWkgc2VlIGViYcO1bm5lc3R1YiDDvHJpdGFtZSBsdXVhIGVrc3BlcmltZW50YWFsc2V0LFxyXG4gICAgICAgIC8vTWlkYSBrYXN1dGF0YWtzZSBzcGV0c2lmaWthdHNpb29uaSBhcmVuZGFtaXNla3NcclxuICAgICAgICBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIikgfHwgY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIik7XHJcblxyXG4gICAgfSBjYXRjaCAoZSkge31cclxuXHJcbiAgICBpZighZ2wpIHtcclxuICAgICAgICBhbGVydChcIlVuYWJsZSB0byBpbml0aWxpemUgV2ViR0wuIFlvdXIgYnJvd3NlciBtYXkgbm90IHN1cHBvcnQgaXQuXCIpO1xyXG4gICAgICAgIHRocm93IEVycm9yKFwiRXhlY3V0aW9uIHRlcm1pbmF0ZWQuIE5vIFdlYkdMIGNvbnRleHRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGdsO1xyXG59XHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gTEVTU09OMDcgLSBSRU5ERVJEQU1JTkUgVEVLU1RVVVJJTEUgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4vL0vDvHNpbWUgdmVlYmlsZWhpdHNlamFsdCBzw7xnYXZ1c3Rla3N0dXVyaSBsYWllbmR1c3RcclxudmFyIGV4dERlcHRoID0gR0wuZ2V0RXh0ZW5zaW9uKFwiV0VCR0xfZGVwdGhfdGV4dHVyZVwiKSB8fFxyXG4gICAgICAgICAgICAgICBHTC5nZXRFeHRlbnNpb24oXCJXRUJHS0lUX1dFQkdMX2RlcHRoX3RleHR1cmVcIil8fFxyXG4gICAgICAgICAgICAgICBHTC5nZXRFeHRlbnNpb24oXCJNT1pfV0VCR0xfZGVwdGhfdGV4dHVyZVwiKTtcclxuaWYoIWV4dERlcHRoKSB7XHJcbiAgICBhbGVydChcIkJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBkZXB0aCB0ZXh0dXJlIGV4dGVuc2lvbi4gU2VlIHdlYmdscmVwb3J0LmNvbSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cIik7XHJcbiAgICB0aHJvdyBlcnJvcihcIk5vIGRlcHRoIHRleHR1cmUgZXh0ZW5zaW9uXCIpO1xyXG59XHJcblxyXG52YXIgQVBQID0ge307XHJcblxyXG5BUFAubG9vcGVyID0gbmV3IExvb3BlcihjYW52YXMsIGxvb3ApO1xyXG5cclxuQVBQLmlzTW91c2VEb3duID0gZmFsc2U7XHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgbW91c2VDbGlja0hhbmRsZXIsIGZhbHNlKTtcclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgbW91c2VDbGlja0hhbmRsZXIsIGZhbHNlKTtcclxuXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXdoZWVsXCIsIG1vdXNlU2Nyb2xsSGFuZGxlciwgZmFsc2UpO1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NTW91c2VTY3JvbGxcIiwgbW91c2VTY3JvbGxIYW5kbGVyLCBmYWxzZSk7XHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJvbm1vdXNld2hlZWxcIiwgbW91c2VTY3JvbGxIYW5kbGVyLCBmYWxzZSk7XHJcblxyXG4vL0tPTlNUQU5ESUQgS0FBTUVSQSBKQU9LU1xyXG5cclxuLy8zNjAga3JhYWRpXHJcbkFQUC5UV09QSSA9IDIuMCAqIE1hdGguUEk7XHJcblxyXG4vLzkwIGtyYWFkaVxyXG5BUFAuUElPVkVSVFdPID0gTWF0aC5QSSAvIDIuMDtcclxuXHJcbi8vTWFrc2ltYWFsbmUgdmVydGlrYWFsbnVya1xyXG5BUFAuTUFYX1ZFUlRJQ0FMID0gQVBQLlBJT1ZFUlRXTyAtIEFQUC5QSU9WRVJUV08gLyA4O1xyXG5cclxuLy9SYWFkaXVzLCBtaWxsZXN0IGzDpGhlbWFsZSBrYWFtZXJhIG1pbm5hIGVpIHNhYVxyXG5BUFAuTUlOX1JBRElVUyA9IDE7XHJcblxyXG4vL1N1dW1pbWlza29uc3RhbnRcclxuQVBQLlpPT01fVkFMVUUgPSAwLjU7XHJcblxyXG4vL0t1dHN1dGFrc2Uga3VpIHZhcmp1bmRhamFkIG9uIGxhZXR1ZFxyXG5mdW5jdGlvbiBzaGFkZXJzTG9hZGVkKCkge1xyXG4gICAgc2V0dXBBbmRMb2FkVGV4dHVyZSgpO1xyXG4gICAgc2V0dXBGcmFtZUJ1ZmZlcigpO1xyXG4gICAgc2V0dXAoKTtcclxuXHJcbiAgICBBUFAubG9vcGVyLmxvb3AoKTtcclxufVxyXG5cclxuLy9UZWtzdHV1cmkgaW5pdHNpYWxpc2VlcmltaW5lIGphIGxhYWRpbWluZVxyXG5mdW5jdGlvbiBzZXR1cEFuZExvYWRUZXh0dXJlKCkge1xyXG5cclxuICAgIC8vTG9vbWUgdXVlIHRla3N0dXVyaSBqYSBrb29zIHNlbGxlZ2EgMXgxIHBpa3NsaXNlIHBpbGRpLCBtaXMga3V2YXRha3NlIHNlbmlrYXVhLCBrdW5pIHRla3N0dXVyIHNhYWIgbGFldHVkXHJcbiAgICBBUFAudGV4dHVyZSA9IEdMLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIEFQUC50ZXh0dXJlKTtcclxuICAgIEdMLnRleEltYWdlMkQoR0wuVEVYVFVSRV8yRCwgMCwgR0wuUkdCQSwgMSwgMSwgMCwgR0wuUkdCQSwgIEdMLlVOU0lHTkVEX0JZVEUsIG5ldyBVaW50OEFycmF5KFsxLCAxLCAxLCAxXSkpO1xyXG4gICAgR0wudGV4UGFyYW1ldGVyZihHTC5URVhUVVJFXzJELCBHTC5URVhUVVJFX1dSQVBfUywgR0wuUkVQRUFUKTtcclxuICAgIEdMLnRleFBhcmFtZXRlcmYoR0wuVEVYVFVSRV8yRCwgR0wuVEVYVFVSRV9XUkFQX1QsIEdMLlJFUEVBVCk7XHJcbiAgICBHTC50ZXhQYXJhbWV0ZXJpKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgR0wuTkVBUkVTVCk7XHJcbiAgICBHTC50ZXhQYXJhbWV0ZXJpKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgR0wuTkVBUkVTVCk7XHJcblxyXG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XHJcblxyXG4gICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgQVBQLnRleHR1cmUpO1xyXG4gICAgICAgIEdMLnRleEltYWdlMkQoR0wuVEVYVFVSRV8yRCwgMCwgR0wuUkdCLCBHTC5SR0IsICBHTC5VTlNJR05FRF9CWVRFLCBpbWFnZSk7XHJcbiAgICAgICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICB9O1xyXG4gICAgaW1hZ2Uuc3JjID0gVEVYVFVSRV9QQVRIO1xyXG5cclxufVxyXG5cclxuLy9WYWxtaXN0YWJlIGV0dGUga2FhZHJpcHVodnJpLCBrdWh1IHN0c2VlbiByZW5kZXJkYWRhXHJcbmZ1bmN0aW9uIHNldHVwRnJhbWVCdWZmZXIoKSB7XHJcblxyXG4gICAgLy9Mb29tZSBrYWFkcmlwdWh2cmksIGt1aHUgc2FhbWUgcmVuZGVyZGFtaXNlIGrDpHJqZWtvcnJhcyBzdHNlZW5pIHJlbmRlcmRhZGEuXHJcbiAgICBBUFAuZnJhbWVCdWZmZXIgPSBHTC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xyXG4gICAgR0wuYmluZEZyYW1lYnVmZmVyKEdMLkZSQU1FQlVGRkVSLCBBUFAuZnJhbWVCdWZmZXIpO1xyXG4gICAgQVBQLmZyYW1lQnVmZmVyLndpZHRoID0gNTEyO1xyXG4gICAgQVBQLmZyYW1lQnVmZmVyLmhlaWdodCA9IDUxMjtcclxuXHJcbiAgICAvL0xvb21lIHbDpHJ2dXNwdWh2cmksIG1pcyBob2lhYiBwaWtzbGVpZFxyXG4gICAgQVBQLkZCQ29sb3JUZXh0dXJlID0gR0wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgQVBQLkZCQ29sb3JUZXh0dXJlKTtcclxuICAgIEdMLnRleEltYWdlMkQoR0wuVEVYVFVSRV8yRCwgMCwgR0wuUkdCQSwgQVBQLmZyYW1lQnVmZmVyLndpZHRoLCBBUFAuZnJhbWVCdWZmZXIuaGVpZ2h0LCAwLCBHTC5SR0JBLCBHTC5VTlNJR05FRF9CWVRFLCBudWxsKTtcclxuICAgIEdMLnRleFBhcmFtZXRlcmkoR0wuVEVYVFVSRV8yRCwgR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBHTC5MSU5FQVIpO1xyXG4gICAgR0wudGV4UGFyYW1ldGVyaShHTC5URVhUVVJFXzJELCBHTC5URVhUVVJFX01JTl9GSUxURVIsIEdMLkxJTkVBUl9NSVBNQVBfTkVBUkVTVCk7XHJcbiAgICBHTC5nZW5lcmF0ZU1pcG1hcChHTC5URVhUVVJFXzJEKTtcclxuXHJcbiAgICAvL0xvb21lIHPDvGdhdnVzcHVodnJpLCBtaXMgaG9pYWIgcGlrc2xpdGUgc8O8Z2F2dXNpXHJcbiAgICBBUFAuRkJEZXB0aEJ1ZmZlciA9IEdMLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xyXG4gICAgR0wuYmluZFJlbmRlcmJ1ZmZlcihHTC5SRU5ERVJCVUZGRVIsIEFQUC5GQkRlcHRoQnVmZmVyKTtcclxuICAgIEdMLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoR0wuUkVOREVSQlVGRkVSLCBHTC5ERVBUSF9DT01QT05FTlQxNiwgQVBQLmZyYW1lQnVmZmVyLndpZHRoLCBBUFAuZnJhbWVCdWZmZXIuaGVpZ2h0KTtcclxuXHJcbiAgICAvL1Nlb21lIHbDpHJ2aS0gamEgc8O8Z2F2dXNwdWh2cmkgYW50dWQga2FhZHJpcHVodnJpZ2FcclxuICAgIEdMLmZyYW1lYnVmZmVyVGV4dHVyZTJEKEdMLkZSQU1FQlVGRkVSLCBHTC5DT0xPUl9BVFRBQ0hNRU5UMCwgR0wuVEVYVFVSRV8yRCwgQVBQLkZCQ29sb3JUZXh0dXJlLCAwKTtcclxuICAgIEdMLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKEdMLkZSQU1FQlVGRkVSLCBHTC5ERVBUSF9BVFRBQ0hNRU5ULCBHTC5SRU5ERVJCVUZGRVIsIEFQUC5GQkRlcHRoQnVmZmVyKTtcclxuXHJcbiAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBudWxsKTtcclxuICAgIEdMLmJpbmRSZW5kZXJidWZmZXIoR0wuUkVOREVSQlVGRkVSLCBudWxsKTtcclxuICAgIEdMLmJpbmRGcmFtZWJ1ZmZlcihHTC5GUkFNRUJVRkZFUiwgbnVsbCk7XHJcbn1cclxuXHJcbi8vTG9vYiBwdWh2cmlkIGphIG1hYXRyaWtzaWQuIFTDpGlkYWIgcHVodnJpZCBhbmRtZXRlZ2EuXHJcbmZ1bmN0aW9uIHNldHVwKCkge1xyXG4gICAgLy9UZWVtZSBtdXV0dWphLCBrdWh1IHNhbHZlc3RhZGEgYWVnYSwgZXQga2FhbWVyYXQgYWphIG3DtsO2ZHVkZXMgw7xtYmVyIG9iamVrdGkgcMO2w7ZyYXRhXHJcbiAgICBBUFAudGltZSA9IDA7XHJcblxyXG4gICAgQVBQLmNhbWVyYVggPSAwO1xyXG4gICAgQVBQLmNhbWVyYVkgPSAwO1xyXG4gICAgQVBQLnJhZGl1cyA9IDU7XHJcblxyXG4gICAgLy9NdWRlbG1hYXRyaWtzLCBtaWxsZWdhIG9iamVrdGlydXVtaXN0IG1hYWlsbWFydXVtaSBzYWFkYVxyXG4gICAgQVBQLm1vZGVsTWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuXHJcbiAgICAvL011ZGVsbWFhdHJpa3MsIG1pZGEga2FzdXRhbWUgdGVrc3R1dXJpbGUgcmVuZGVyZGFtaXNla3NcclxuICAgIEFQUC50ZXh0dXJlTW9kZWxNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vUHVua3QsIGt1cyBvYmpla3QgaGV0a2VsIGFzdWJcclxuICAgIEFQUC5vYmplY3RBdCA9IFswLjAsIDAuMCwgLTUuMF07XHJcblxyXG4gICAgLy9LYXN1dGFkZXMgdHJhbnNsYXRzaW9vbmksIHNhYW1lIG11ZGVsbWFhdHJpa3NpZ2Egb2JqZWt0aSBsaWlndXRhZGFcclxuICAgIG1hdDQudHJhbnNsYXRlKEFQUC5tb2RlbE1hdHJpeCwgQVBQLm1vZGVsTWF0cml4LCBBUFAub2JqZWN0QXQpO1xyXG4gICAgbWF0NC50cmFuc2xhdGUoQVBQLnRleHR1cmVNb2RlbE1hdHJpeCwgQVBQLnRleHR1cmVNb2RlbE1hdHJpeCwgQVBQLm9iamVjdEF0KTtcclxuXHJcbiAgICAvL0thYW1lcmFtYWF0cmlrcywgbWlsbGVnYSBtYWFpbG1hcnV1bWlzdCBrYWFtZXJhcnV1bWkgc2FhZGFcclxuICAgIEFQUC52aWV3TWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuXHJcbiAgICAvL0thYW1lcmFtYWF0cmlrcywgbWlkYSBrYXN1dGFtZSB0ZWtzdHV1cmlsZSByZW5kZXJkYW1pc2Vrc1xyXG4gICAgQVBQLnRleHR1cmVWaWV3TWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuICAgIG1hdDQubG9va0F0KEFQUC50ZXh0dXJlVmlld01hdHJpeCwgWzAsIDAsIDBdLCBbMCwgMCwgLTVdLCBbMCwgMSwgMF0pO1xyXG5cclxuICAgIC8vRGVmaW5lZXJpbWUgdmVrdG9yaWQsIG1pbGxlIGFiaWwgb24gdsO1aW1hbGlrIGthYW1lcmFydXVtaSBiYWFzdmVrdG9yaWQgYXJ2dXRhZGFcclxuICAgIEFQUC5jYW1lcmFBdCA9IHZlYzMuY3JlYXRlKCk7ICAgICAgICAgICAgLy9Bc3ViIG1hYWlsbWFydXVtaXMgbmVuZGVsIGtvb3JkaW5hYXRpZGVsXHJcbiAgICBBUFAubG9va0F0ID0gdmVjMy5jcmVhdGUoKTsgICAgICAgICAgICAgLy9NaXMgc3V1bmFzIGthYW1lcmEgdmFhdGFiLiBQYXJlbWFrw6RlIGtvb3JkaW5hYXRzw7xzdGVlbWlzIG9uIC16IGVrcmFhbmkgc2lzc2VcclxuICAgIEFQUC51cCA9IHZlYzMuY3JlYXRlKCk7ICAgICAgICAgICAgICAgICAgLy9WZWt0b3IsIG1pcyBuw6RpdGFiLCBrdXMgb24ga2FhbWVyYSDDvGxlc3NlIHN1dW5kYSBuw6RpdGF2IHZla3RvclxyXG4gICAgdXBkYXRlQ2FtZXJhKCk7XHJcblxyXG4gICAgLy9Qcm9qZWt0c2lvb25pbWFhdHJpa3MsIGV0IHDDvGdhbWlzcnV1bWkgc2FhZGEuIEthc3V0YWRlcyBnbE1hdHJpeCB0ZWVraSBnZW5lcmVlcmltZSBrYSBww7xyYW1paWRpLCBrdWh1IHNpc3NlIG9iamVrdGlkIGzDpGhldmFkLlxyXG4gICAgQVBQLnByb2plY3Rpb25NYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG4gICAgbWF0NC5wZXJzcGVjdGl2ZShBUFAucHJvamVjdGlvbk1hdHJpeCwgNDUuMCwgR0wudmlld3BvcnRXaWR0aCAvIEdMLnZpZXdwb3J0SGVpZ2h0LCAxLjAsIDEwMDAuMCk7XHJcblxyXG4gICAgLy9Qcm9qZWt0c2lvb25pbWFhdHJpa3MsIG1pZGEga2FzdXRhbWUgdGVrc3R1dXJpbGUgcmVuZGVyZGFtaXNla3NcclxuICAgIEFQUC50ZXh0dXJlUHJvamVjdGlvbk1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgICBtYXQ0LnBlcnNwZWN0aXZlKEFQUC50ZXh0dXJlUHJvamVjdGlvbk1hdHJpeCwgNDUuMCwgMSwgMC4xLCAxMDAuMCk7XHJcblxyXG4gICAgLy9UaXBwdWRlIGFuZG1lZC4gVGlwdSBrb29yZGluYWFkaWQgeCwgeSwgeiBqYSB0ZWtzdHV1cmkga29vcmRpbmFhZGlkIHUsIHZcclxuICAgIEFQUC5teVZlcnRpY2VzRGF0YSA9IFtcclxuICAgICAgICAvL0VzaW1lbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAgMS4wLCAgMC4wLCAxLjAsICAgICAgICAgICAgLy9BTFVNSU5FIFZBU0FLIE5VUktcclxuICAgICAgICAgMS4wLCAtMS4wLCAgMS4wLCAgMS4wLCAxLjAsICAgICAgICAgICAgLy9BTFVNSU5FIFBBUkVNIE5VUktcclxuICAgICAgICAgMS4wLCAgMS4wLCAgMS4wLCAgMS4wLCAwLjAsICAgICAgICAgICAgLy/DnExFTUlORSBQQVJFTSBOVVJLXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgIDEuMCwgIDAuMCwgMC4wLCAgICAgICAgICAgIC8vw5xMRU1JTkUgVkFTQUsgTlVSS1xyXG5cclxuICAgICAgICAvL1RhZ3VtaW5lIGvDvGxnXHJcbiAgICAgICAgLTEuMCwgLTEuMCwgLTEuMCwgIDAuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsICAxLjAsIC0xLjAsICAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsICAxLjAsIC0xLjAsICAgMS4wLCAwLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAtMS4wLCAgIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL8OcbGVtaW5lIGvDvGxnXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgLTEuMCwgIDAuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsICAxLjAsICAxLjAsICAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsICAxLjAsICAxLjAsICAgIDEuMCwgMC4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgLTEuMCwgIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL0FsdW1pbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsIC0xLjAsIC0xLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgLTEuMCwgIDEuMCwgIDEuMCwgMC4wLFxyXG4gICAgICAgIC0xLjAsIC0xLjAsICAxLjAsIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL1BhcmVtIGvDvGxnXHJcbiAgICAgICAgMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsICAxLjAsIC0xLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgIDEuMCwgIDEuMCwgMC4wLFxyXG4gICAgICAgIDEuMCwgLTEuMCwgIDEuMCwgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vVmFzYWsga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDEuMCxcclxuICAgICAgICAtMS4wLCAtMS4wLCAgMS4wLCAxLjAsIDEuMCxcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMS4wLCAgMS4wLCAwLjAsXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgLTEuMCwgMC4wLCAwLjAsXHJcbiAgICBdO1xyXG4gICAgQVBQLnZlcnRleFNpemUgPSA1O1xyXG5cclxuICAgIC8vTG9vbWUgcHVodnJpLCBrdWh1IHRpcHVhbmRtZWQgdmlpYS4gU2VvbWUga2EgYW50dWQgcHVodnJpIGtvbnRla3N0aWdhLCBldCB0ZW1hbGUga8Okc2tlIGVkYXNpIGFuZGFcclxuICAgIEFQUC52ZXJ0ZXhCdWZmZXIgPSBHTC5jcmVhdGVCdWZmZXIoKTtcclxuXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkFSUkFZX0JVRkZFUiwgQVBQLnZlcnRleEJ1ZmZlcik7XHJcblxyXG4gICAgLy9Bbm5hbWUgbG9vZHVkIHB1aHZyaWxlIGFuZG1lZFxyXG4gICAgR0wuYnVmZmVyRGF0YShHTC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoQVBQLm15VmVydGljZXNEYXRhKSwgR0wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgIC8vVGlwcHVkZSBpbmRla3NpZFxyXG4gICAgQVBQLm15SW5kaWNlc0RhdGEgPSBbXHJcbiAgICAgICAgMCwgMSwgMiwgICAgICAwLCAyLCAzLCAgICAvLyBFc2ltZW5lIGvDvGxnXHJcbiAgICAgICAgNCwgNSwgNiwgICAgICA0LCA2LCA3LCAgICAvLyBUYWd1bWluZSBrw7xsZ1xyXG4gICAgICAgIDgsIDksIDEwLCAgICAgOCwgMTAsIDExLCAgLy8gw5xsZW1pbmUga8O8bGdcclxuICAgICAgICAxMiwgMTMsIDE0LCAgIDEyLCAxNCwgMTUsIC8vIEFsdW1pbmUga8O8bGdcclxuICAgICAgICAxNiwgMTcsIDE4LCAgIDE2LCAxOCwgMTksIC8vIFBhcmVtIGvDvGxnXHJcbiAgICAgICAgMjAsIDIxLCAyMiwgICAyMCwgMjIsIDIzICAvLyBWYXNhayBrw7xsZ1xyXG4gICAgXTtcclxuXHJcbiAgICAvL0xvb21lIHB1aHZyaSwga3VodSBpbmRla3NpZCB2aWlhLiBTZW9tZSBrYSBhbnR1ZCBwdWh2cmkga29udGVrc3RpZ2EsIGV0IHRlbWFsZSBrw6Rza2UgZWRhc2kgYW5kYVxyXG4gICAgQVBQLmluZGV4QnVmZmVyID0gR0wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBBUFAuaW5kZXhCdWZmZXIubnVtYmVyT2ZJbmRleGVzID0gMzY7XHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBBUFAuaW5kZXhCdWZmZXIpO1xyXG5cclxuICAgIC8vQW5uYW1lIGxvb2R1ZCBwdWh2cmlsZSBhbmRtZWRcclxuICAgIEdMLmJ1ZmZlckRhdGEoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG5ldyBVaW50MTZBcnJheShBUFAubXlJbmRpY2VzRGF0YSksIEdMLlNUQVRJQ19EUkFXKTtcclxuXHJcbiAgICAvL03DpMOkcmFtZSBwcm9ncmFtbWksIG1pZGEgbWUgcmVuZGVyZGFtaXNlbCBrYXN1dGFkYSB0YWhhbWVcclxuICAgIEdMLnVzZVByb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XHJcblxyXG4gICAgLy9TYWFtZSBpbmRla3NpLCBtaXMgbsOkaXRhYiBrdXMgYXN1YiBtZWllIHByb2dyYW1taXMga2FzdXRhdGF2YXMgdGlwdXZhcmp1bmRhamFzXHJcbiAgICAvL29sZXYgdGlwdWF0cmlidXV0IG5pbWVnYSBhX1ZlcnRleFBvc2l0aW9uXHJcbiAgICBBUFAuYV9Qb3NpdGlvbiA9IEdMLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYV9Qb3NpdGlvblwiKTtcclxuXHJcbiAgICAvL1NhYW1lIHbDpHJ2aWF0cmlidXVkaSBhc3Vrb2hhXHJcbiAgICBBUFAuYV9UZXh0dXJlQ29vcmQgPSBHTC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcImFfVGV4dHVyZUNvb3JkXCIpO1xyXG5cclxuICAgIC8vU2FhbWUgw7xodHNldGUgbXV1dHVqYXRlIGFzdWtvaGFkXHJcbiAgICBBUFAudV9Nb2RlbE1hdHJpeCA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfTW9kZWxNYXRyaXhcIik7XHJcbiAgICBBUFAudV9WaWV3TWF0cml4ID0gR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9WaWV3TWF0cml4XCIpO1xyXG4gICAgQVBQLnVfUHJvamVjdGlvbk1hdHJpeCA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfUHJvamVjdGlvbk1hdHJpeFwiKTtcclxuICAgIEFQUC51X1RleHR1cmUgPSBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X1RleHR1cmVcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdXNlQ2xpY2tIYW5kbGVyKCkge1xyXG4gICAgQVBQLmlzTW91c2VEb3duID0gIUFQUC5pc01vdXNlRG93bjtcclxuXHJcbiAgICBpZihBUFAuaXNNb3VzZURvd24pXHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBtb3VzZU1vdmUsIGZhbHNlKTtcclxuICAgIGVsc2VcclxuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG1vdXNlTW92ZSwgZmFsc2UpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb3VzZVNjcm9sbEhhbmRsZXIoZSkge1xyXG4gICAgdmFyIGRlbHRhID0gMDtcclxuXHJcbiAgICBpZighZSlcclxuICAgICAgICBlID0gd2luZG93LmV2ZW50O1xyXG5cclxuICAgIGlmKGUud2hlZWxEZWx0YSkgICAgICAgICAgICAgICAgICAgIC8qKiBJbnRlcm5ldCBFeHBsb3Jlci9PcGVyYS9Hb29nbGUgQ2hyb21lICoqL1xyXG4gICAgICAgIGRlbHRhID0gZS53aGVlbERlbHRhIC8gMTIwO1xyXG5cclxuICAgIGVsc2UgaWYoZS5kZXRhaWwpICAgICAgICAgICAgICAgICAgIC8qKiBNb3ppbGxhIEZpcmVmb3ggKiovXHJcbiAgICAgICAgZGVsdGEgPSAtZS5kZXRhaWwvMztcclxuXHJcbiAgICBpZihkZWx0YSkge1xyXG4gICAgICAgIGlmKGRlbHRhID4gMCAmJiBBUFAucmFkaXVzID4gQVBQLk1JTl9SQURJVVMpXHJcbiAgICAgICAgICAgIEFQUC5yYWRpdXMgLT0gQVBQLlpPT01fVkFMVUU7XHJcbiAgICAgICAgZWxzZSBpZihkZWx0YSA8IDApXHJcbiAgICAgICAgICAgIEFQUC5yYWRpdXMgKz0gQVBQLlpPT01fVkFMVUU7XHJcbiAgICB9XHJcblxyXG4gICAgICAgIGlmKGUucHJldmVudERlZmF1bHQpXHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XHJcblxyXG4gICAgdG9DYW5vbmljYWwoKTtcclxuICAgIHVwZGF0ZUNhbWVyYSgpO1xyXG59XHJcblxyXG4vL0hpaXJlIGFsbGhvaWRtaXNlbCBqYSBsaWlndXRhbWlzZWwga8OkaXZpdHViIGFudHVkIGZ1bmt0c2lvb25cclxuZnVuY3Rpb24gbW91c2VNb3ZlKGUpIHtcclxuICAgIHZhciB4ID0gZS53ZWJraXRNb3ZlbWVudFggfHwgZS5tb3pNb3ZlbWVudFg7XHJcbiAgICB2YXIgeSA9IGUud2Via2l0TW92ZW1lbnRZIHx8IGUubW96TW92ZW1lbnRZO1xyXG5cclxuICAgIGlmKHR5cGVvZiB4ID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgIHggPSAwO1xyXG4gICAgaWYodHlwZW9mIHkgPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgeSA9IDA7XHJcblxyXG5cclxuICAgIEFQUC5jYW1lcmFYICs9IHggLyA1MDA7XHJcbiAgICBBUFAuY2FtZXJhWSArPSB5IC8gNTAwO1xyXG5cclxuICAgIHJlc3RyaWN0Q2FtZXJhWSgpO1xyXG4gICAgdG9DYW5vbmljYWwoKTtcclxuXHJcbiAgICB1cGRhdGVDYW1lcmEoKTtcclxufVxyXG5cclxuLy9GdW5rdHNpb29uLCBldCB2aWlhIGhvcmlzb250YWFsbmUgamEgdmVydGlrYWFsbmUgbnVyayBrYW5vb25pbGlzc2Ugdm9ybWlcclxuLy9JbXBsZW1lbnRlZXJpdHVkIDNEIE1hdGggUHJpbWVyIGZvciBHcmFwaGljcyBhbmQgR2FtZSBEZXZlbG9wbWVudCBqdWhlbmRpIGrDpHJnaVxyXG5mdW5jdGlvbiB0b0Nhbm9uaWNhbCgpIHtcclxuXHJcbiAgICAvL0t1aSBvbGVtZSAwIGtvb3JkaW5hYXRpZGVsXHJcbiAgICBpZihBUFAucmFkaXVzID09IDAuMCkge1xyXG4gICAgICAgIEFQUC5jYW1lcmFYID0gQVBQLmNhbWVyYVkgPSAwLjA7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgLy9LdWkgcmFhZGl1cyBvbiBuZWdhdGlpdm5lLlxyXG4gICAgICAgIGlmKEFQUC5yYWRpdXMgPCAwLjApIHtcclxuICAgICAgICAgICAgQVBQLnJhZGl1cyA9IC1BUFAucmFkaXVzO1xyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWCArPSBNYXRoLlBJO1xyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWSA9IC1BUFAuY2FtZXJhWTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vVmVydGlrYWFsbmUgbnVyayDDvGxlbWlzZXN0IHBpaXJpc3QgdsOkbGphXHJcbiAgICAgICAgaWYoTWF0aC5hYnMoQVBQLmNhbWVyYVkpID4gQVBQLlBJT1ZFUlRXTykge1xyXG5cclxuICAgICAgICAgICAgQVBQLmNhbWVyYVkgKz0gQVBQLlBJT1ZFUlRXTztcclxuXHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFZIC09IE1hdGguZmxvb3IoQVBQLmNhbWVyYVkgLyBBUFAuVFdPUEkpICogQVBQLlRXT1BJO1xyXG5cclxuICAgICAgICAgICAgaWYoQVBQLmNhbWVyYVkgPiBNYXRoLlBJKSB7XHJcbiAgICAgICAgICAgICAgICBBUFAuY2FtZXJhWCArPSBNYXRoLlBJO1xyXG5cclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFZID0gMy4wICogTWF0aC5QSS8yLjAgLSBBUFAuY2FtZXJhWTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFZIC09IEFQUC5QSU9WRVJUV087XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vR0lNQkFMIExPQ0tcclxuICAgICAgICBpZihNYXRoLmFicyhBUFAuY2FtZXJhWSkgPj0gQVBQLlBJT1ZFUlRXTyAqIDAuOTk5OSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkdJTUJBTExPQ0tcIik7XHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFYID0gMC4wO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZihNYXRoLmFicyhBUFAuY2FtZXJhWCkgPiBNYXRoLlBJKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVggKz0gTWF0aC5QSTtcclxuXHJcbiAgICAgICAgICAgICAgICBBUFAuY2FtZXJhWCAtPSBNYXRoLmZsb29yKEFQUC5jYW1lcmFYIC8gQVBQLlRXT1BJKSAqIEFQUC5UV09QSTtcclxuXHJcbiAgICAgICAgICAgICAgICBBUFAuY2FtZXJhWCAtPSBNYXRoLlBJO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVzdHJpY3RDYW1lcmFZKCkge1xyXG4gICAgaWYoTWF0aC5hYnMoQVBQLmNhbWVyYVkpID4gQVBQLk1BWF9WRVJUSUNBTCkge1xyXG4gICAgICAgIGlmKEFQUC5jYW1lcmFZIDwgMClcclxuICAgICAgICAgICAgQVBQLmNhbWVyYVkgPSAtQVBQLk1BWF9WRVJUSUNBTDtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFZID0gQVBQLk1BWF9WRVJUSUNBTDtcclxuICAgIH1cclxufVxyXG5cclxuLy9LdXRzdXRha3NlIHbDpGxqYSBMb29wZXIgb2JqZWt0aXMgaWdhIGthYWRlclxyXG5mdW5jdGlvbiBsb29wKGRlbHRhVGltZSkge1xyXG4gICAgdXBkYXRlKGRlbHRhVGltZSk7XHJcblxyXG4gICAgLy9Nw6TDpHJhbWUga2FhZHJpcHVodnJpa3MgbWVpZSBlbmRhIGxvb2R1ZCBrYWFkcmlwdWh2cmlcclxuICAgIEdMLmJpbmRGcmFtZWJ1ZmZlcihHTC5GUkFNRUJVRkZFUiwgQVBQLmZyYW1lQnVmZmVyKTtcclxuXHJcbiAgICAvL1JlbmRlcmRhbWUgc3RzZWVuaSB0ZWtzdHV1cmlsZVxyXG4gICAgcmVuZGVyVG9UZXh0dXJlKCk7XHJcblxyXG4gICAgLy9TZW9tZSBsYWh0aSBlZWxtaXNlIGthYWRyaXB1aHZyaS4gUMOkcmFzdCBzZWRhIG9uIGthc3V0dXNlbCB0YXZhbGluZSBwdWh2ZXIsIG1pZGEga2FzdXRhdGFrc2UgY2FudmFzIGVsZW1lbmRpIGphb2tzLlxyXG4gICAgR0wuYmluZEZyYW1lYnVmZmVyKEdMLkZSQU1FQlVGRkVSLCBudWxsKTtcclxuXHJcbiAgICByZW5kZXIoKTtcclxufVxyXG5cclxuLy9VdWVuZGFiIGFuZG1laWQsIGV0IG9sZWtzIHbDtWltYWxpayBzdHNlZW4gbGlpa3VtYSBwYW5uYVxyXG5mdW5jdGlvbiB1cGRhdGUoZGVsdGFUaW1lKSB7XHJcbiAgICBBUFAudGltZSArPSBkZWx0YVRpbWUgLyAxMDA7XHJcblxyXG4gICB1cGRhdGVPYmplY3QoKTtcclxufVxyXG5cclxuLy9VdWVuZGFiIGthYW1lcmF0LCBldCBzZWRhIG9sZWtzIHbDtWltYWxpayDDvG1iZXIgb2JqZWt0aSBww7bDtnJhdGFcclxuZnVuY3Rpb24gdXBkYXRlQ2FtZXJhKCkge1xyXG5cclxuICAgIC8vTGVpYW1lIHV1ZSBwb3NpdHNpb29uaSwgbWlzIGFqYXMgbGlpZ3ViIHBvbGFhcnNlcyBrb29yZGluYWF0c8O8c3RlZW1pcyBqYSBtaWxsZSB0ZWlzZW5kYW1lIHJpc3Rrb29yZGluYWF0c8O8c3RlZW1pXHJcbiAgICBBUFAuY2FtZXJhQXQgPSBbQVBQLm9iamVjdEF0WzBdICsgQVBQLnJhZGl1cyAqIE1hdGguY29zKEFQUC5jYW1lcmFZKSAqIE1hdGguc2luKEFQUC5jYW1lcmFYKSwgICAgICAgLy8gWFxyXG4gICAgICAgICAgICAgICAgICAgICBBUFAub2JqZWN0QXRbMV0gKyBBUFAucmFkaXVzICogLU1hdGguc2luKEFQUC5jYW1lcmFZKSwgICAgICAgICAgICAgICAgICAgICAvLyBZXHJcbiAgICAgICAgICAgICAgICAgICAgIEFQUC5vYmplY3RBdFsyXSArIEFQUC5yYWRpdXMgKiBNYXRoLmNvcyhBUFAuY2FtZXJhWSkgKiBNYXRoLmNvcyhBUFAuY2FtZXJhWCldOyAgICAgLy8gWlxyXG5cclxuXHJcbiAgICAvL0xlaWFtZSBzdXVuYXZla3RvcmksIGthYW1lcmFzdCBvYmpla3RpbmlcclxuICAgIEFQUC5sb29rRGlyZWN0aW9uID0gW0FQUC5vYmplY3RBdFswXSAtIEFQUC5jYW1lcmFBdFswXSwgICAgICAgICAgICAgICAvLyBYXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBBUFAub2JqZWN0QXRbMV0gLSBBUFAuY2FtZXJhQXRbMV0sICAgICAgICAgICAgICAgLy8gWVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgQVBQLm9iamVjdEF0WzJdIC0gQVBQLmNhbWVyYUF0WzJdXTsgICAgICAgICAgICAgIC8vIFpcclxuXHJcbiAgICAvL0xlaWFtZSBwdW5rdGksIG1pZGEga2FhbWVyYSB2YWF0YWJcclxuICAgIHZlYzMuYWRkKEFQUC5sb29rQXQsIEFQUC5jYW1lcmFBdCwgQVBQLmxvb2tEaXJlY3Rpb24pO1xyXG5cclxuICAgIEFQUC5yaWdodCA9IFtcclxuICAgICAgICBNYXRoLnNpbihBUFAuY2FtZXJhWCAtIE1hdGguUEkgLyAyKSxcclxuICAgICAgICAwLFxyXG4gICAgICAgIE1hdGguY29zKEFQUC5jYW1lcmFYIC0gTWF0aC5QSSAvIDIpXHJcbiAgICBdO1xyXG5cclxuICAgIHZlYzMubm9ybWFsaXplKEFQUC5yaWdodCwgQVBQLnJpZ2h0KTtcclxuICAgIHZlYzMubm9ybWFsaXplKEFQUC5sb29rRGlyZWN0aW9uLCBBUFAubG9va0RpcmVjdGlvbik7XHJcbiAgICB2ZWMzLmNyb3NzKEFQUC51cCwgQVBQLnJpZ2h0LCBBUFAubG9va0RpcmVjdGlvbik7XHJcblxyXG4gICAgLy9VdWVuZGFtZSBrYWFtZXJhbWFhdHJpa3NpdFxyXG4gICAgbWF0NC5sb29rQXQoQVBQLnZpZXdNYXRyaXgsIEFQUC5jYW1lcmFBdCwgQVBQLmxvb2tBdCwgQVBQLnVwKTtcclxuXHJcblxyXG59XHJcblxyXG4vL3V1ZW5kYW1lIG9iamVrdGlcclxuZnVuY3Rpb24gdXBkYXRlT2JqZWN0KCkge1xyXG4gICAgbWF0NC5yb3RhdGVYKEFQUC50ZXh0dXJlTW9kZWxNYXRyaXgsIEFQUC50ZXh0dXJlTW9kZWxNYXRyaXgsIDAuMDA1KTtcclxufVxyXG5cclxuLy9SZW5kZXJkYW1lIHRla3N0dXVyaWxlXHJcbmZ1bmN0aW9uIHJlbmRlclRvVGV4dHVyZSgpIHtcclxuICAgIEdMLnZpZXdwb3J0KDAsIDAsIEFQUC5mcmFtZUJ1ZmZlci53aWR0aCwgQVBQLmZyYW1lQnVmZmVyLmhlaWdodCk7XHJcbiAgICBHTC5jbGVhckNvbG9yKDEuMCwgMS4wLCAxLjAsIDEuMCk7XHJcbiAgICBHTC5jbGVhcihHTC5DT0xPUl9CVUZGRVJfQklUIHwgR0wuREVQVEhfQlVGRkVSX0JJVCk7XHJcblxyXG4gICAgLy9Mw7xsaXRhbWUgc2lzc2Ugc8O8Z2F2dXN0ZXN0aVxyXG4gICAgR0wuZW5hYmxlKEdMLkRFUFRIX1RFU1QpO1xyXG4gICAgR0wuZGVwdGhGdW5jKEdMLkxFU1MpO1xyXG5cclxuICAgIC8vU2VvbWUgdGlwdXB1aHZyaSBqYSBtw6TDpHJhbWUsIGt1cyBhbnR1ZCB0aXB1YXRyaWJ1dXQgYXN1YiBhbnR1ZCBtYXNzaWl2aXMuXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkFSUkFZX0JVRkZFUiwgQVBQLnZlcnRleEJ1ZmZlcik7XHJcbiAgICBHTC52ZXJ0ZXhBdHRyaWJQb2ludGVyKEFQUC5hX1Bvc2l0aW9uLCAzLCBHTC5GTE9BVCwgZmFsc2UsIEFQUC52ZXJ0ZXhTaXplICogNCwgMCk7XHJcbiAgICBHTC52ZXJ0ZXhBdHRyaWJQb2ludGVyKEFQUC5hX1RleHR1cmVDb29yZCwgMiwgR0wuRkxPQVQsIGZhbHNlLCBBUFAudmVydGV4U2l6ZSAqIDQsIEFQUC52ZXJ0ZXhTaXplICogNCAtIDIgKiA0KTtcclxuXHJcbiAgICAvL0FrdGl2ZWVyaW1lIGF0cmlidXVkaWRcclxuICAgIEdMLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KEFQUC5hX1Bvc2l0aW9uKTtcclxuICAgIEdMLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KEFQUC5hX1RleHR1cmVDb29yZCk7XHJcblxyXG4gICAgLy9Ba3RpdmVlcmltZSBqYSBtw6TDpHJhbWUgdGVrc3R1dXJpXHJcbiAgICBHTC5hY3RpdmVUZXh0dXJlKEdMLlRFWFRVUkUwKTtcclxuICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIEFQUC50ZXh0dXJlKTtcclxuICAgIEdMLnVuaWZvcm0xaShBUFAudV9UZXh0dXJlLCAwKTtcclxuXHJcbiAgICAvL1NhYWRhbWUgbWVpZSB0ZWtzdHV1cmkgbWFhdHJpa3NpZCBrYSB2YXJqdW5kYWphc3NlXHJcbiAgICBHTC51bmlmb3JtTWF0cml4NGZ2KEFQUC51X01vZGVsTWF0cml4LCBmYWxzZSwgQVBQLnRleHR1cmVNb2RlbE1hdHJpeCk7XHJcbiAgICBHTC51bmlmb3JtTWF0cml4NGZ2KEFQUC51X1ZpZXdNYXRyaXgsIGZhbHNlLCBBUFAudGV4dHVyZVZpZXdNYXRyaXgpO1xyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9Qcm9qZWN0aW9uTWF0cml4LCBmYWxzZSwgQVBQLnRleHR1cmVQcm9qZWN0aW9uTWF0cml4KTtcclxuXHJcbiAgICAvL1JlbmRlcmRhbWUga29sbW51cmdhZCBpbmRla3NpdGUgasOkcmdpXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBBUFAuaW5kZXhCdWZmZXIpO1xyXG4gICAgR0wuZHJhd0VsZW1lbnRzKEdMLlRSSUFOR0xFUywgQVBQLmluZGV4QnVmZmVyLm51bWJlck9mSW5kZXhlcywgR0wuVU5TSUdORURfU0hPUlQsIDApO1xyXG5cclxuICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIEFQUC5GQkNvbG9yVGV4dHVyZSk7XHJcbiAgICBHTC5nZW5lcmF0ZU1pcG1hcChHTC5URVhUVVJFXzJEKTtcclxuICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIG51bGwpO1xyXG5cclxufVxyXG5cclxuXHJcbi8vUmVuZGVyZGFtaW5lXHJcbmZ1bmN0aW9uIHJlbmRlcigpIHtcclxuXHJcbiAgICAvL1B1aGFzdGFtZSBrYSB2w6RydmktIGphIHPDvGdhdnVzcHVodnJpZCwgbmluZyBtw6TDpHJhbWUgdXVlIHB1aGFzdHV2w6RydnVzZS5cclxuICAgIC8vSGV0a2VsIHB1aGFzdGFtaW5lIG1pZGFnaSBlaSB0ZWUsIHNlc3QgbWUgcmVuZGVyZGFtZSB2YWlkIMO8aGUga29ycmEsIGt1aWQga3VpIG1lIHRzw7xra2xpcyBzZWRhIHRlZ2VtYVxyXG4gICAgLy9vbiBuw6RoYSBrYSwgbWlkYSBuYWQgdGVldmFkLlxyXG4gICAgR0wudmlld3BvcnQoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuICAgIEdMLmNsZWFyQ29sb3IoMC4wLCAwLjAsIDAuMCwgMS4wKTtcclxuICAgIEdMLmNsZWFyKEdMLkNPTE9SX0JVRkZFUl9CSVQgfCBHTC5ERVBUSF9CVUZGRVJfQklUKTtcclxuXHJcbiAgICAvL0zDvGxpdGFtZSBzaXNzZSBzw7xnYXZ1c3Rlc3RpXHJcbiAgICBHTC5lbmFibGUoR0wuREVQVEhfVEVTVCk7XHJcbiAgICBHTC5kZXB0aEZ1bmMoR0wuTEVTUyk7XHJcblxyXG4gICAgLy9TZW9tZSB0aXB1cHVodnJpIGphIG3DpMOkcmFtZSwga3VzIGFudHVkIHRpcHVhdHJpYnV1dCBhc3ViIGFudHVkIG1hc3NpaXZpcy5cclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuQVJSQVlfQlVGRkVSLCBBUFAudmVydGV4QnVmZmVyKTtcclxuICAgIEdMLnZlcnRleEF0dHJpYlBvaW50ZXIoQVBQLmFfUG9zaXRpb24sIDMsIEdMLkZMT0FULCBmYWxzZSwgQVBQLnZlcnRleFNpemUgKiA0LCAwKTtcclxuICAgIEdMLnZlcnRleEF0dHJpYlBvaW50ZXIoQVBQLmFfVGV4dHVyZUNvb3JkLCAyLCBHTC5GTE9BVCwgZmFsc2UsIEFQUC52ZXJ0ZXhTaXplICogNCwgQVBQLnZlcnRleFNpemUgKiA0IC0gMiAqIDQpO1xyXG5cclxuICAgIC8vQWt0aXZlZXJpbWUgYXRyaWJ1dWRpZFxyXG4gICAgR0wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoQVBQLmFfUG9zaXRpb24pO1xyXG4gICAgR0wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoQVBQLmFfVGV4dHVyZUNvb3JkKTtcclxuXHJcbiAgICAvL0FrdGl2ZWVyaW1lIGphIG3DpMOkcmFtZSB0ZWtzdHV1cmlcclxuICAgIEdMLmFjdGl2ZVRleHR1cmUoR0wuVEVYVFVSRTApO1xyXG4gICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgQVBQLkZCQ29sb3JUZXh0dXJlKTtcclxuICAgIEdMLnVuaWZvcm0xaShBUFAudV9UZXh0dXJlLCAwKTtcclxuXHJcbiAgICAvL1NhYWRhbWUgbWVpZSBtYWF0cmlrc2lkIGthIHZhcmp1bmRhamFzc2VcclxuICAgIEdMLnVuaWZvcm1NYXRyaXg0ZnYoQVBQLnVfTW9kZWxNYXRyaXgsIGZhbHNlLCBBUFAubW9kZWxNYXRyaXgpO1xyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9WaWV3TWF0cml4LCBmYWxzZSwgQVBQLnZpZXdNYXRyaXgpO1xyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9Qcm9qZWN0aW9uTWF0cml4LCBmYWxzZSwgQVBQLnByb2plY3Rpb25NYXRyaXgpO1xyXG5cclxuICAgIC8vUmVuZGVyZGFtZSBrb2xtbnVyZ2FkIGluZGVrc2l0ZSBqw6RyZ2lcclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIEFQUC5pbmRleEJ1ZmZlcik7XHJcbiAgICBHTC5kcmF3RWxlbWVudHMoR0wuVFJJQU5HTEVTLCBBUFAuaW5kZXhCdWZmZXIubnVtYmVyT2ZJbmRleGVzLCBHTC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcbn1cclxuXHJcbiIsIkxvb3BlciA9IGZ1bmN0aW9uKGRvbUVsZW1lbnQsIGNhbGxiYWNrKSB7XHJcbiAgICB0aGlzLmRvbUVsZW1lbnQgPSBkb21FbGVtZW50O1xyXG5cclxuICAgIHRoaXMubGFzdFRpbWUgPSAwO1xyXG4gICAgdGhpcy5kZWx0YVRpbWUgPSAwO1xyXG5cclxuICAgIHRoaXMucmVxdWVzdElkO1xyXG5cclxuICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcclxuXHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcbiAgICAgICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XHJcblxyXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZTtcclxufTtcclxuXHJcbkxvb3Blci5wcm90b3R5cGUgPSB7XHJcblxyXG4gICAgY29uc3RydWN0b3I6IExvb3BlcixcclxuXHJcbiAgICBjYWxjdWxhdGVEZWx0YVRpbWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciB0aW1lTm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgICAgIGlmKHRoaXMubGFzdFRpbWUgIT0gMClcclxuICAgICAgICAgICAgdGhpcy5kZWx0YVRpbWUgPSAodGltZU5vdyAtIHRoaXMubGFzdFRpbWUpIC8gMTY7XHJcblxyXG4gICAgICAgIHRoaXMubGFzdFRpbWUgPSB0aW1lTm93O1xyXG4gICAgfSxcclxuXHJcbiAgICBsb29wOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnJlcXVlc3RJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmxvb3AuYmluZCh0aGlzKSwgdGhpcy5kb21FbGVtZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVEZWx0YVRpbWUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLmRlbHRhVGltZSk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb29wZXI7IiwiLyoqXHJcbiAqIEhvaWFiIGVuZGFzIFdlYkdMUHJvZ3JhbSBvYmpla3RpIGphIFdlYkdMU2hhZGVyIHRpcHV2YXJqdW5kYWphdCBqYSBwaWtzbGl2YXJqdW5kYWphdFxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gdmVydGV4U2hhZGVyUGF0aFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRTaGFkZXJQYXRoXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG9uTGlua2VkIE1lZXRvZCwgbWlzIGt1dHN1dGFrc2UgdsOkbGphLCBrdWkgdmFyanVuZGFqYWQgb24gbGFldHVkXHJcbiAqIEBjbGFzc1xyXG4gKi9cclxudmFyIFByb2dyYW1PYmplY3QgPSBmdW5jdGlvbih2ZXJ0ZXhTaGFkZXJQYXRoLCBmcmFnbWVudFNoYWRlclBhdGgsIG9uTGlua2VkKSB7XHJcbiAgICB0aGlzLnByb2dyYW0gPSBHTC5jcmVhdGVQcm9ncmFtKCk7XHJcblxyXG4gICAgdGhpcy5vbkxpbmtlZCA9IG9uTGlua2VkO1xyXG5cclxuICAgIHRoaXMudmVydGV4U2hhZGVyID0ge1xyXG4gICAgICAgIFwic2hhZGVyXCI6IEdMLmNyZWF0ZVNoYWRlcihHTC5WRVJURVhfU0hBREVSKSxcclxuICAgICAgICBcInBhdGhcIjogdmVydGV4U2hhZGVyUGF0aCxcclxuICAgICAgICBcInNyY1wiOiBcIlwiLFxyXG4gICAgICAgIFwiY29tcGxldGVkXCI6IGZhbHNlXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB7XHJcbiAgICAgICAgXCJzaGFkZXJcIjogR0wuY3JlYXRlU2hhZGVyKEdMLkZSQUdNRU5UX1NIQURFUiksXHJcbiAgICAgICAgXCJwYXRoXCI6IGZyYWdtZW50U2hhZGVyUGF0aCxcclxuICAgICAgICBcInNyY1wiOiBcIlwiLFxyXG4gICAgICAgIFwiY29tcGxldGVkXCI6IGZhbHNlXHJcbiAgICB9O1xyXG59O1xyXG5cclxuUHJvZ3JhbU9iamVjdC5wcm90b3R5cGUgPSB7XHJcblxyXG4gICAgY29uc3RydWN0b3I6IFByb2dyYW1PYmplY3QsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsYmFjayBtZWV0b2QsIG1pcyBrb21waWxlZXJpYiBqYSBzw6R0ZXN0YWIgdmFyanVuZGFqYWQsIGt1aSBtw7VsZW1hZCBvbiBhc8O8bmtyb29uc2VsdCBsYWV0dWRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3JjIEzDpGh0ZWtvb2QsIG1pcyBBSkFYJ2kgYWJpbCBsYWV0aVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggVGVlLCBtaWxsZSBhYmlsIHR1dmFzdGFkYSwga3VtbWEgdmFyanVuZGFqYSBsw6RodGVrb29kIG9uIGxhZXR1ZFxyXG4gICAgICovXHJcbiAgICBvbmNvbXBsZXRlOiBmdW5jdGlvbihzcmMsIHBhdGgpIHtcclxuICAgICAgICBpZihwYXRoID09PSB0aGlzLnZlcnRleFNoYWRlci5wYXRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVydGV4U2hhZGVyLmNvbXBsZXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMudmVydGV4U2hhZGVyLnNyYyA9IHNyYztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZihwYXRoID09PSB0aGlzLmZyYWdtZW50U2hhZGVyLnBhdGgpIHtcclxuICAgICAgICAgICAgdGhpcy5mcmFnbWVudFNoYWRlci5jb21wbGV0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmZyYWdtZW50U2hhZGVyLnNyYyA9IHNyYztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHRoaXMudmVydGV4U2hhZGVyLmNvbXBsZXRlZCAmJiB0aGlzLmZyYWdtZW50U2hhZGVyLmNvbXBsZXRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBpbGVTaGFkZXIodGhpcy52ZXJ0ZXhTaGFkZXIuc2hhZGVyLCB0aGlzLnZlcnRleFNoYWRlci5zcmMpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBpbGVTaGFkZXIodGhpcy5mcmFnbWVudFNoYWRlci5zaGFkZXIsIHRoaXMuZnJhZ21lbnRTaGFkZXIuc3JjKTtcclxuXHJcbiAgICAgICAgICAgIEdMLmF0dGFjaFNoYWRlcih0aGlzLnByb2dyYW0sIHRoaXMudmVydGV4U2hhZGVyLnNoYWRlcik7XHJcbiAgICAgICAgICAgIEdMLmF0dGFjaFNoYWRlcih0aGlzLnByb2dyYW0sIHRoaXMuZnJhZ21lbnRTaGFkZXIuc2hhZGVyKTtcclxuXHJcbiAgICAgICAgICAgIEdMLmxpbmtQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XHJcblxyXG4gICAgICAgICAgICBpZighR0wuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLnByb2dyYW0sIEdMLkxJTktfU1RBVFVTKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFcnJvciBsaW5raW5nIHNoYWRlciBwcm9ncmFtOiBcXFwiXCIgKyBHTC5nZXRQcm9ncmFtSW5mb0xvZyh0aGlzLnByb2dyYW0pICsgXCJcXFwiXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZih0eXBlb2YgdGhpcy5vbkxpbmtlZCAhPSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5vbkxpbmtlZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDDnHJpdGFiIGtvbXBpbGVlcmlkYSB2YXJqdW5kYWphXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtXZWJHTFNoYWRlcn0gc2hhZGVyIFZhcmp1bmRhamEgbWlkYSBrb21waWxlZXJpZGFcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2UgTMOkaHRla29vZCwgbWlkYSBrb21waWxlZXJpZGFcclxuICAgICAqL1xyXG4gICAgY29tcGlsZVNoYWRlcjogZnVuY3Rpb24oc2hhZGVyLCBzb3VyY2UpIHtcclxuICAgICAgICBHTC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzb3VyY2UpO1xyXG4gICAgICAgIEdMLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcclxuXHJcbiAgICAgICAgaWYgKCFHTC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBHTC5DT01QSUxFX1NUQVRVUykpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJTaGFkZXIgY29tcGlsYXRpb24gZmFpbGVkLiBFcnJvcjogXFxcIlwiICsgR0wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpICsgXCJcXFwiXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBBbnR1ZCBrbGFzc2kgYWJpbCBvbiB2w7VpbWFsaWsgcHJvZ3JhbW1pIGxhYWRpZGEgamEgYXPDvG5rcm9vbnNlbHQgdGFnYXBpbGRpbCBzcGV0c2lmaXRzZWVyaXR1ZCB2YXJqdW5kYWphZFxyXG4gKiB0YWdhc3RhdHVkIHByb2dyYW1taWdhIHNpZHVkYVxyXG4gKlxyXG4gKiBAY2xhc3MgU2hhZGVyUHJvZ3JhbUxvYWRlclxyXG4gKi9cclxudmFyIFNoYWRlclByb2dyYW1Mb2FkZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuY29udGFpbmVyID0gW107XHJcbiAgICB0aGlzLmNvdW50ZXIgPSAtMTtcclxufTtcclxuXHJcblNoYWRlclByb2dyYW1Mb2FkZXIucHJvdG90eXBlID0ge1xyXG4gICAgY29uc3RydWN0b3I6IFNoYWRlclByb2dyYW1Mb2FkZXIsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUYWdhc3RhYiBwcm9ncmFtbSBvYmpla3RpLiBBc8O8bmtyb29uc2VsdCB0YWdhcGxhYW5pbCBsYWV0YWtzZSBqYSBrb21waWxlZXJpdGFrc2UgdmFyanVuZGFqYWQuIEVubmUga3VpXHJcbiAgICAgKiBwcm9ncmFtbWkga2FzdXRhZGEgdHVsZWIga29udHJvbGxpZGEsIGV0IHZhcmp1bmRhamFkIG9uIGtvbXBpbGVlcml0dWQgamEgcHJvZ3JhbW1pZ2Egc2VvdHVkLiBWw7VpbWFsaWsgb25cclxuICAgICAqIHBhcmFtZWV0cmlrcyBhbmRhIGthIENhbGxiYWNrIGZ1bmt0c2lvb24sIG1pcyB0ZWFkYSBhbm5hYiwga3VpIHZhcmp1bmRhamFkIG9uIHNlb3R1ZC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdmVydGV4U2hhZGVyUGF0aCBUZWUsIHRpcHV2YXJqdW5kYWphIGp1dXJkZVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50U2hhZGVyUGF0aCBUZWUsIHBpa3NsaXZhcmp1bmRhamEganV1cmRlXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsaW5rZWRDYWxsYmFjayBGdW5rdHNpb29uLCBtaXMga3V0c3V0YWtzZSB2w6RsamEsIGt1aSB2YXJqdW5kYWphZCBvbiBrb21waWxlZXJpdHVkIGphIHNlb3R1ZCBwcm9ncmFtbWlnYVxyXG4gICAgICogQHJldHVybnMge2V4cG9ydHMuZGVmYXVsdE9wdGlvbnMucHJvZ3JhbXwqfFdlYkdMUHJvZ3JhbXxQcm9ncmFtT2JqZWN0LnByb2dyYW19XHJcbiAgICAgKi9cclxuICAgIGdldFByb2dyYW06IGZ1bmN0aW9uKHZlcnRleFNoYWRlclBhdGgsIGZyYWdtZW50U2hhZGVyUGF0aCwgbGlua2VkQ2FsbGJhY2spIHtcclxuICAgICAgICB0aGlzLmNvdW50ZXIrKztcclxuICAgICAgICB0aGlzLmNvbnRhaW5lclt0aGlzLmNvdW50ZXJdID0gbmV3IFByb2dyYW1PYmplY3QodmVydGV4U2hhZGVyUGF0aCwgZnJhZ21lbnRTaGFkZXJQYXRoLCBsaW5rZWRDYWxsYmFjayk7XHJcbiAgICAgICAgdmFyIHByb2dyYW0gPSB0aGlzLmNvbnRhaW5lclt0aGlzLmNvdW50ZXJdO1xyXG5cclxuICAgICAgICB0aGlzLmxvYWRBc3luY1NoYWRlclNvdXJjZSh2ZXJ0ZXhTaGFkZXJQYXRoLCBwcm9ncmFtLm9uY29tcGxldGUuYmluZChwcm9ncmFtKSk7XHJcbiAgICAgICAgdGhpcy5sb2FkQXN5bmNTaGFkZXJTb3VyY2UoZnJhZ21lbnRTaGFkZXJQYXRoLCBwcm9ncmFtLm9uY29tcGxldGUuYmluZChwcm9ncmFtKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9ncmFtLnByb2dyYW07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTGFlYiBhc8O8bmtyb29uc2VsdCBsw6RodGVrb29kaVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzaGFkZXJQYXRoIFRlZSwga3VzIGFzdWIgdmFyanVuZGFqYVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgRnVua3RzaW9vbiwgbWlzIGvDpGl2aXRhdGFrc2UsIGt1aSBsw6RodGVrb29kIG9uIGvDpHR0ZSBzYWFkdWQuIFNhYWRldGFrc2UgdmFzdHVzIGphIHRlZS5cclxuICAgICAqL1xyXG4gICAgbG9hZEFzeW5jU2hhZGVyU291cmNlOiBmdW5jdGlvbihzaGFkZXJQYXRoLCBjYWxsYmFjaykge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIGFzeW5jOiB0cnVlLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJ0ZXh0XCIsXHJcbiAgICAgICAgICAgIHVybDogc2hhZGVyUGF0aCxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZXN1bHQsIHNoYWRlclBhdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQcm9ncmFtT2JqZWN0O1xyXG5tb2R1bGUuZXhwb3J0cyA9IFNoYWRlclByb2dyYW1Mb2FkZXI7Il19
