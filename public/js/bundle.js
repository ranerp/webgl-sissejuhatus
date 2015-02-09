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
     * Laeb asünkroonselt
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibGVzc29ucy9sZXNzb24wNy9tYWluLmpzIiwibGVzc29ucy91dGlscy9sb29wZXIuanMiLCJsZXNzb25zL3V0aWxzL3NoYWRlcnByb2dyYW1sb2FkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vQW50dWQgb3NhIHRlZ2VsZWIgV2ViR0wga29udGVrc3RpIGxvb21pc2VnYSBqYSBtZWlsZSB2YWphbGlrdSBXZWJHTFByb2dyYW0gb2JqZWt0aSBsb29taXNlZ2EgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxudmFyIFNoYWRlclByb2dyYW1Mb2FkZXIgPSByZXF1aXJlKFwiLi8uLi91dGlscy9zaGFkZXJwcm9ncmFtbG9hZGVyXCIpO1xyXG52YXIgTG9vcGVyID0gcmVxdWlyZShcIi4vLi4vdXRpbHMvbG9vcGVyXCIpO1xyXG5cclxuLy9WYXJqdW5kYWphdGUga2F0YWxvb2dcclxudmFyIFNIQURFUl9QQVRIID0gXCJzaGFkZXJzL2xlc3NvbjA3L1wiO1xyXG5cclxuLy9UZWtzdHV1cmkgYXN1a29odFxyXG52YXIgVEVYVFVSRV9QQVRIID0gXCJhc3NldHMvdGV4dHVyZS5qcGdcIjtcclxuXHJcbi8vRWxlbWVudCwga3VodSByZW5kZXJkYW1lXHJcbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxuXHJcbi8vTG9vbWUgZ2xvYmFhbHNlIFdlYkdMIGtvbnRla3N0aVxyXG5HTCA9IGluaXRXZWJHTChjYW52YXMpO1xyXG5cclxuLy9TZWFkaXN0YW1lIHJlbmRlcmRhbWlzcmVzb2x1dHNpb29uaVxyXG5HTC52aWV3cG9ydCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG5HTC52aWV3cG9ydFdpZHRoID0gY2FudmFzLndpZHRoO1xyXG5HTC52aWV3cG9ydEhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XHJcblxyXG4vL0xvb21lIHV1ZSBwcm9ncmFtbWkgc3BldHNpZml0c2Vlcml0dWQgdmFyanVuZGFqYXRlZ2EuIEt1bmEgbGFhZGltaW5lIG9uIGFzw7xua3Jvb25uZSwgc2lpcyBhbm5hbWUga2Fhc2Ega2FcclxuLy9tZWV0b2RpLCBtaXMga3V0c3V0YWtzZSB2w6RsamEga3VpIHZhcmp1bmRhamFkIG9uIGxhZXR1ZFxyXG52YXIgc2hhZGVyUHJvZ3JhbUxvYWRlciA9IG5ldyBTaGFkZXJQcm9ncmFtTG9hZGVyKCk7XHJcbnZhciBzaGFkZXJQcm9ncmFtID0gc2hhZGVyUHJvZ3JhbUxvYWRlci5nZXRQcm9ncmFtKFNIQURFUl9QQVRIICsgXCJ2ZXJ0ZXguc2hhZGVyXCIsIFNIQURFUl9QQVRIICsgXCJmcmFnbWVudC5zaGFkZXJcIiwgc2hhZGVyc0xvYWRlZCk7XHJcblxyXG5cclxuLy/DnHJpdGFtZSBsdXVhIFdlYkdMIGtvbnRla3N0aVxyXG5mdW5jdGlvbiBpbml0V2ViR0woY2FudmFzKSB7XHJcbiAgICB2YXIgZ2wgPSBudWxsO1xyXG5cclxuICAgIHRyeSB7XHJcblxyXG4gICAgICAgIC8vw5xyaXRhbWUgbHV1YSB0YXZhbGlzdCBrb250ZWtzdGksIGt1aSBzZWUgZWJhw7VubmVzdHViIMO8cml0YW1lIGx1dWEgZWtzcGVyaW1lbnRhYWxzZXQsXHJcbiAgICAgICAgLy9NaWRhIGthc3V0YXRha3NlIHNwZXRzaWZpa2F0c2lvb25pIGFyZW5kYW1pc2Vrc1xyXG4gICAgICAgIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKSB8fCBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiKTtcclxuXHJcbiAgICB9IGNhdGNoIChlKSB7fVxyXG5cclxuICAgIGlmKCFnbCkge1xyXG4gICAgICAgIGFsZXJ0KFwiVW5hYmxlIHRvIGluaXRpbGl6ZSBXZWJHTC4gWW91ciBicm93c2VyIG1heSBub3Qgc3VwcG9ydCBpdC5cIik7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJFeGVjdXRpb24gdGVybWluYXRlZC4gTm8gV2ViR0wgY29udGV4dFwiKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZ2w7XHJcbn1cclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBMRVNTT04wNyAtIFJFTkRFUkRBTUlORSBURUtTVFVVUklMRSAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbi8vS8O8c2ltZSB2ZWViaWxlaGl0c2VqYWx0IHPDvGdhdnVzdGVrc3R1dXJpIGxhaWVuZHVzdFxyXG52YXIgZXh0RGVwdGggPSBHTC5nZXRFeHRlbnNpb24oXCJXRUJHTF9kZXB0aF90ZXh0dXJlXCIpIHx8XHJcbiAgICAgICAgICAgICAgIEdMLmdldEV4dGVuc2lvbihcIldFQkdLSVRfV0VCR0xfZGVwdGhfdGV4dHVyZVwiKXx8XHJcbiAgICAgICAgICAgICAgIEdMLmdldEV4dGVuc2lvbihcIk1PWl9XRUJHTF9kZXB0aF90ZXh0dXJlXCIpO1xyXG5pZighZXh0RGVwdGgpIHtcclxuICAgIGFsZXJ0KFwiQnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGRlcHRoIHRleHR1cmUgZXh0ZW5zaW9uLiBTZWUgd2ViZ2xyZXBvcnQuY29tIGZvciBtb3JlIGluZm9ybWF0aW9uLlwiKTtcclxuICAgIHRocm93IGVycm9yKFwiTm8gZGVwdGggdGV4dHVyZSBleHRlbnNpb25cIik7XHJcbn1cclxuXHJcbnZhciBBUFAgPSB7fTtcclxuXHJcbkFQUC5sb29wZXIgPSBuZXcgTG9vcGVyKGNhbnZhcywgbG9vcCk7XHJcblxyXG5BUFAuaXNNb3VzZURvd24gPSBmYWxzZTtcclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBtb3VzZUNsaWNrSGFuZGxlciwgZmFsc2UpO1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBtb3VzZUNsaWNrSGFuZGxlciwgZmFsc2UpO1xyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNld2hlZWxcIiwgbW91c2VTY3JvbGxIYW5kbGVyLCBmYWxzZSk7XHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Nb3VzZVNjcm9sbFwiLCBtb3VzZVNjcm9sbEhhbmRsZXIsIGZhbHNlKTtcclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm9ubW91c2V3aGVlbFwiLCBtb3VzZVNjcm9sbEhhbmRsZXIsIGZhbHNlKTtcclxuXHJcbi8vS09OU1RBTkRJRCBLQUFNRVJBIEpBT0tTXHJcblxyXG4vLzM2MCBrcmFhZGlcclxuQVBQLlRXT1BJID0gMi4wICogTWF0aC5QSTtcclxuXHJcbi8vOTAga3JhYWRpXHJcbkFQUC5QSU9WRVJUV08gPSBNYXRoLlBJIC8gMi4wO1xyXG5cclxuLy9NYWtzaW1hYWxuZSB2ZXJ0aWthYWxudXJrXHJcbkFQUC5NQVhfVkVSVElDQUwgPSBBUFAuUElPVkVSVFdPIC0gQVBQLlBJT1ZFUlRXTyAvIDg7XHJcblxyXG4vL1JhYWRpdXMsIG1pbGxlc3QgbMOkaGVtYWxlIGthYW1lcmEgbWlubmEgZWkgc2FhXHJcbkFQUC5NSU5fUkFESVVTID0gMTtcclxuXHJcbi8vU3V1bWltaXNrb25zdGFudFxyXG5BUFAuWk9PTV9WQUxVRSA9IDAuNTtcclxuXHJcbi8vS3V0c3V0YWtzZSBrdWkgdmFyanVuZGFqYWQgb24gbGFldHVkXHJcbmZ1bmN0aW9uIHNoYWRlcnNMb2FkZWQoKSB7XHJcbiAgICBzZXR1cEFuZExvYWRUZXh0dXJlKCk7XHJcbiAgICBzZXR1cEZyYW1lQnVmZmVyKCk7XHJcbiAgICBzZXR1cCgpO1xyXG5cclxuICAgIEFQUC5sb29wZXIubG9vcCgpO1xyXG59XHJcblxyXG4vL1Rla3N0dXVyaSBpbml0c2lhbGlzZWVyaW1pbmUgamEgbGFhZGltaW5lXHJcbmZ1bmN0aW9uIHNldHVwQW5kTG9hZFRleHR1cmUoKSB7XHJcblxyXG4gICAgLy9Mb29tZSB1dWUgdGVrc3R1dXJpIGphIGtvb3Mgc2VsbGVnYSAxeDEgcGlrc2xpc2UgcGlsZGksIG1pcyBrdXZhdGFrc2Ugc2VuaWthdWEsIGt1bmkgdGVrc3R1dXIgc2FhYiBsYWV0dWRcclxuICAgIEFQUC50ZXh0dXJlID0gR0wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgQVBQLnRleHR1cmUpO1xyXG4gICAgR0wudGV4SW1hZ2UyRChHTC5URVhUVVJFXzJELCAwLCBHTC5SR0JBLCAxLCAxLCAwLCBHTC5SR0JBLCAgR0wuVU5TSUdORURfQllURSwgbmV3IFVpbnQ4QXJyYXkoWzEsIDEsIDEsIDFdKSk7XHJcbiAgICBHTC50ZXhQYXJhbWV0ZXJmKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfV1JBUF9TLCBHTC5SRVBFQVQpO1xyXG4gICAgR0wudGV4UGFyYW1ldGVyZihHTC5URVhUVVJFXzJELCBHTC5URVhUVVJFX1dSQVBfVCwgR0wuUkVQRUFUKTtcclxuICAgIEdMLnRleFBhcmFtZXRlcmkoR0wuVEVYVFVSRV8yRCwgR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBHTC5ORUFSRVNUKTtcclxuICAgIEdMLnRleFBhcmFtZXRlcmkoR0wuVEVYVFVSRV8yRCwgR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBHTC5ORUFSRVNUKTtcclxuXHJcbiAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuXHJcbiAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBBUFAudGV4dHVyZSk7XHJcbiAgICAgICAgR0wudGV4SW1hZ2UyRChHTC5URVhUVVJFXzJELCAwLCBHTC5SR0IsIEdMLlJHQiwgIEdMLlVOU0lHTkVEX0JZVEUsIGltYWdlKTtcclxuICAgICAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBudWxsKTtcclxuICAgIH07XHJcbiAgICBpbWFnZS5zcmMgPSBURVhUVVJFX1BBVEg7XHJcblxyXG59XHJcblxyXG4vL1ZhbG1pc3RhYmUgZXR0ZSBrYWFkcmlwdWh2cmksIGt1aHUgc3RzZWVuIHJlbmRlcmRhZGFcclxuZnVuY3Rpb24gc2V0dXBGcmFtZUJ1ZmZlcigpIHtcclxuXHJcbiAgICAvL0xvb21lIGthYWRyaXB1aHZyaSwga3VodSBzYWFtZSByZW5kZXJkYW1pc2UgasOkcmpla29ycmFzIHN0c2VlbmkgcmVuZGVyZGFkYS5cclxuICAgIEFQUC5mcmFtZUJ1ZmZlciA9IEdMLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XHJcbiAgICBHTC5iaW5kRnJhbWVidWZmZXIoR0wuRlJBTUVCVUZGRVIsIEFQUC5mcmFtZUJ1ZmZlcik7XHJcbiAgICBBUFAuZnJhbWVCdWZmZXIud2lkdGggPSA1MTI7XHJcbiAgICBBUFAuZnJhbWVCdWZmZXIuaGVpZ2h0ID0gNTEyO1xyXG5cclxuICAgIC8vTG9vbWUgdsOkcnZ1c3B1aHZyaSwgbWlzIGhvaWFiIHBpa3NsZWlkXHJcbiAgICBBUFAuRkJDb2xvclRleHR1cmUgPSBHTC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBBUFAuRkJDb2xvclRleHR1cmUpO1xyXG4gICAgR0wudGV4SW1hZ2UyRChHTC5URVhUVVJFXzJELCAwLCBHTC5SR0JBLCBBUFAuZnJhbWVCdWZmZXIud2lkdGgsIEFQUC5mcmFtZUJ1ZmZlci5oZWlnaHQsIDAsIEdMLlJHQkEsIEdMLlVOU0lHTkVEX0JZVEUsIG51bGwpO1xyXG4gICAgR0wudGV4UGFyYW1ldGVyaShHTC5URVhUVVJFXzJELCBHTC5URVhUVVJFX01BR19GSUxURVIsIEdMLkxJTkVBUik7XHJcbiAgICBHTC50ZXhQYXJhbWV0ZXJpKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgR0wuTElORUFSX01JUE1BUF9ORUFSRVNUKTtcclxuICAgIEdMLmdlbmVyYXRlTWlwbWFwKEdMLlRFWFRVUkVfMkQpO1xyXG5cclxuICAgIC8vTG9vbWUgc8O8Z2F2dXNwdWh2cmksIG1pcyBob2lhYiBwaWtzbGl0ZSBzw7xnYXZ1c2lcclxuICAgIEFQUC5GQkRlcHRoQnVmZmVyID0gR0wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XHJcbiAgICBHTC5iaW5kUmVuZGVyYnVmZmVyKEdMLlJFTkRFUkJVRkZFUiwgQVBQLkZCRGVwdGhCdWZmZXIpO1xyXG4gICAgR0wucmVuZGVyYnVmZmVyU3RvcmFnZShHTC5SRU5ERVJCVUZGRVIsIEdMLkRFUFRIX0NPTVBPTkVOVDE2LCBBUFAuZnJhbWVCdWZmZXIud2lkdGgsIEFQUC5mcmFtZUJ1ZmZlci5oZWlnaHQpO1xyXG5cclxuICAgIC8vU2VvbWUgdsOkcnZpLSBqYSBzw7xnYXZ1c3B1aHZyaSBhbnR1ZCBrYWFkcmlwdWh2cmlnYVxyXG4gICAgR0wuZnJhbWVidWZmZXJUZXh0dXJlMkQoR0wuRlJBTUVCVUZGRVIsIEdMLkNPTE9SX0FUVEFDSE1FTlQwLCBHTC5URVhUVVJFXzJELCBBUFAuRkJDb2xvclRleHR1cmUsIDApO1xyXG4gICAgR0wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoR0wuRlJBTUVCVUZGRVIsIEdMLkRFUFRIX0FUVEFDSE1FTlQsIEdMLlJFTkRFUkJVRkZFUiwgQVBQLkZCRGVwdGhCdWZmZXIpO1xyXG5cclxuICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgR0wuYmluZFJlbmRlcmJ1ZmZlcihHTC5SRU5ERVJCVUZGRVIsIG51bGwpO1xyXG4gICAgR0wuYmluZEZyYW1lYnVmZmVyKEdMLkZSQU1FQlVGRkVSLCBudWxsKTtcclxufVxyXG5cclxuLy9Mb29iIHB1aHZyaWQgamEgbWFhdHJpa3NpZC4gVMOkaWRhYiBwdWh2cmlkIGFuZG1ldGVnYS5cclxuZnVuY3Rpb24gc2V0dXAoKSB7XHJcbiAgICAvL1RlZW1lIG11dXR1amEsIGt1aHUgc2FsdmVzdGFkYSBhZWdhLCBldCBrYWFtZXJhdCBhamEgbcO2w7ZkdWRlcyDDvG1iZXIgb2JqZWt0aSBww7bDtnJhdGFcclxuICAgIEFQUC50aW1lID0gMDtcclxuXHJcbiAgICBBUFAuY2FtZXJhWCA9IDA7XHJcbiAgICBBUFAuY2FtZXJhWSA9IDA7XHJcbiAgICBBUFAucmFkaXVzID0gNTtcclxuXHJcbiAgICAvL011ZGVsbWFhdHJpa3MsIG1pbGxlZ2Egb2JqZWt0aXJ1dW1pc3QgbWFhaWxtYXJ1dW1pIHNhYWRhXHJcbiAgICBBUFAubW9kZWxNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vTXVkZWxtYWF0cmlrcywgbWlkYSBrYXN1dGFtZSB0ZWtzdHV1cmlsZSByZW5kZXJkYW1pc2Vrc1xyXG4gICAgQVBQLnRleHR1cmVNb2RlbE1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcblxyXG4gICAgLy9QdW5rdCwga3VzIG9iamVrdCBoZXRrZWwgYXN1YlxyXG4gICAgQVBQLm9iamVjdEF0ID0gWzAuMCwgMC4wLCAtNS4wXTtcclxuXHJcbiAgICAvL0thc3V0YWRlcyB0cmFuc2xhdHNpb29uaSwgc2FhbWUgbXVkZWxtYWF0cmlrc2lnYSBvYmpla3RpIGxpaWd1dGFkYVxyXG4gICAgbWF0NC50cmFuc2xhdGUoQVBQLm1vZGVsTWF0cml4LCBBUFAubW9kZWxNYXRyaXgsIEFQUC5vYmplY3RBdCk7XHJcbiAgICBtYXQ0LnRyYW5zbGF0ZShBUFAudGV4dHVyZU1vZGVsTWF0cml4LCBBUFAudGV4dHVyZU1vZGVsTWF0cml4LCBBUFAub2JqZWN0QXQpO1xyXG5cclxuICAgIC8vS2FhbWVyYW1hYXRyaWtzLCBtaWxsZWdhIG1hYWlsbWFydXVtaXN0IGthYW1lcmFydXVtaSBzYWFkYVxyXG4gICAgQVBQLnZpZXdNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vS2FhbWVyYW1hYXRyaWtzLCBtaWRhIGthc3V0YW1lIHRla3N0dXVyaWxlIHJlbmRlcmRhbWlzZWtzXHJcbiAgICBBUFAudGV4dHVyZVZpZXdNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG4gICAgbWF0NC5sb29rQXQoQVBQLnRleHR1cmVWaWV3TWF0cml4LCBbMCwgMCwgMF0sIFswLCAwLCAtNV0sIFswLCAxLCAwXSk7XHJcblxyXG4gICAgLy9EZWZpbmVlcmltZSB2ZWt0b3JpZCwgbWlsbGUgYWJpbCBvbiB2w7VpbWFsaWsga2FhbWVyYXJ1dW1pIGJhYXN2ZWt0b3JpZCBhcnZ1dGFkYVxyXG4gICAgQVBQLmNhbWVyYUF0ID0gdmVjMy5jcmVhdGUoKTsgICAgICAgICAgICAvL0FzdWIgbWFhaWxtYXJ1dW1pcyBuZW5kZWwga29vcmRpbmFhdGlkZWxcclxuICAgIEFQUC5sb29rQXQgPSB2ZWMzLmNyZWF0ZSgpOyAgICAgICAgICAgICAvL01pcyBzdXVuYXMga2FhbWVyYSB2YWF0YWIuIFBhcmVtYWvDpGUga29vcmRpbmFhdHPDvHN0ZWVtaXMgb24gLXogZWtyYWFuaSBzaXNzZVxyXG4gICAgQVBQLnVwID0gdmVjMy5jcmVhdGUoKTsgICAgICAgICAgICAgICAgICAvL1Zla3RvciwgbWlzIG7DpGl0YWIsIGt1cyBvbiBrYWFtZXJhIMO8bGVzc2Ugc3V1bmRhIG7DpGl0YXYgdmVrdG9yXHJcbiAgICB1cGRhdGVDYW1lcmEoKTtcclxuXHJcbiAgICAvL1Byb2pla3RzaW9vbmltYWF0cmlrcywgZXQgcMO8Z2FtaXNydXVtaSBzYWFkYS4gS2FzdXRhZGVzIGdsTWF0cml4IHRlZWtpIGdlbmVyZWVyaW1lIGthIHDDvHJhbWlpZGksIGt1aHUgc2lzc2Ugb2JqZWt0aWQgbMOkaGV2YWQuXHJcbiAgICBBUFAucHJvamVjdGlvbk1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgICBtYXQ0LnBlcnNwZWN0aXZlKEFQUC5wcm9qZWN0aW9uTWF0cml4LCA0NS4wLCBHTC52aWV3cG9ydFdpZHRoIC8gR0wudmlld3BvcnRIZWlnaHQsIDEuMCwgMTAwMC4wKTtcclxuXHJcbiAgICAvL1Byb2pla3RzaW9vbmltYWF0cmlrcywgbWlkYSBrYXN1dGFtZSB0ZWtzdHV1cmlsZSByZW5kZXJkYW1pc2Vrc1xyXG4gICAgQVBQLnRleHR1cmVQcm9qZWN0aW9uTWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuICAgIG1hdDQucGVyc3BlY3RpdmUoQVBQLnRleHR1cmVQcm9qZWN0aW9uTWF0cml4LCA0NS4wLCAxLCAwLjEsIDEwMC4wKTtcclxuXHJcbiAgICAvL1RpcHB1ZGUgYW5kbWVkLiBUaXB1IGtvb3JkaW5hYWRpZCB4LCB5LCB6IGphIHRla3N0dXVyaSBrb29yZGluYWFkaWQgdSwgdlxyXG4gICAgQVBQLm15VmVydGljZXNEYXRhID0gW1xyXG4gICAgICAgIC8vRXNpbWVuZSBrw7xsZ1xyXG4gICAgICAgIC0xLjAsIC0xLjAsICAxLjAsICAwLjAsIDEuMCwgICAgICAgICAgICAvL0FMVU1JTkUgVkFTQUsgTlVSS1xyXG4gICAgICAgICAxLjAsIC0xLjAsICAxLjAsICAxLjAsIDEuMCwgICAgICAgICAgICAvL0FMVU1JTkUgUEFSRU0gTlVSS1xyXG4gICAgICAgICAxLjAsICAxLjAsICAxLjAsICAxLjAsIDAuMCwgICAgICAgICAgICAvL8OcTEVNSU5FIFBBUkVNIE5VUktcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMS4wLCAgMC4wLCAwLjAsICAgICAgICAgICAgLy/DnExFTUlORSBWQVNBSyBOVVJLXHJcblxyXG4gICAgICAgIC8vVGFndW1pbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAtMS4wLCAgMC4wLCAxLjAsXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgLTEuMCwgIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgLTEuMCwgICAxLjAsIDAuMCxcclxuICAgICAgICAxLjAsIC0xLjAsIC0xLjAsICAgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vw5xsZW1pbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAgMS4wLCAtMS4wLCAgMC4wLCAxLjAsXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgIDEuMCwgIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgIDEuMCwgICAgMS4wLCAwLjAsXHJcbiAgICAgICAgMS4wLCAgMS4wLCAtMS4wLCAgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vQWx1bWluZSBrw7xsZ1xyXG4gICAgICAgIC0xLjAsIC0xLjAsIC0xLjAsIDAuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgLTEuMCwgLTEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAgMS4wLCAgMS4wLCAwLjAsXHJcbiAgICAgICAgLTEuMCwgLTEuMCwgIDEuMCwgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vUGFyZW0ga8O8bGdcclxuICAgICAgICAxLjAsIC0xLjAsIC0xLjAsIDAuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgLTEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAgMS4wLCAgMS4wLCAgMS4wLCAwLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAgMS4wLCAwLjAsIDAuMCxcclxuXHJcbiAgICAgICAgLy9WYXNhayBrw7xsZ1xyXG4gICAgICAgIC0xLjAsIC0xLjAsIC0xLjAsIDAuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsIC0xLjAsICAxLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsICAxLjAsICAxLjAsICAxLjAsIDAuMCxcclxuICAgICAgICAtMS4wLCAgMS4wLCAtMS4wLCAwLjAsIDAuMCxcclxuICAgIF07XHJcbiAgICBBUFAudmVydGV4U2l6ZSA9IDU7XHJcblxyXG4gICAgLy9Mb29tZSBwdWh2cmksIGt1aHUgdGlwdWFuZG1lZCB2aWlhLiBTZW9tZSBrYSBhbnR1ZCBwdWh2cmkga29udGVrc3RpZ2EsIGV0IHRlbWFsZSBrw6Rza2UgZWRhc2kgYW5kYVxyXG4gICAgQVBQLnZlcnRleEJ1ZmZlciA9IEdMLmNyZWF0ZUJ1ZmZlcigpO1xyXG5cclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuQVJSQVlfQlVGRkVSLCBBUFAudmVydGV4QnVmZmVyKTtcclxuXHJcbiAgICAvL0FubmFtZSBsb29kdWQgcHVodnJpbGUgYW5kbWVkXHJcbiAgICBHTC5idWZmZXJEYXRhKEdMLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShBUFAubXlWZXJ0aWNlc0RhdGEpLCBHTC5TVEFUSUNfRFJBVyk7XHJcblxyXG4gICAgLy9UaXBwdWRlIGluZGVrc2lkXHJcbiAgICBBUFAubXlJbmRpY2VzRGF0YSA9IFtcclxuICAgICAgICAwLCAxLCAyLCAgICAgIDAsIDIsIDMsICAgIC8vIEVzaW1lbmUga8O8bGdcclxuICAgICAgICA0LCA1LCA2LCAgICAgIDQsIDYsIDcsICAgIC8vIFRhZ3VtaW5lIGvDvGxnXHJcbiAgICAgICAgOCwgOSwgMTAsICAgICA4LCAxMCwgMTEsICAvLyDDnGxlbWluZSBrw7xsZ1xyXG4gICAgICAgIDEyLCAxMywgMTQsICAgMTIsIDE0LCAxNSwgLy8gQWx1bWluZSBrw7xsZ1xyXG4gICAgICAgIDE2LCAxNywgMTgsICAgMTYsIDE4LCAxOSwgLy8gUGFyZW0ga8O8bGdcclxuICAgICAgICAyMCwgMjEsIDIyLCAgIDIwLCAyMiwgMjMgIC8vIFZhc2FrIGvDvGxnXHJcbiAgICBdO1xyXG5cclxuICAgIC8vTG9vbWUgcHVodnJpLCBrdWh1IGluZGVrc2lkIHZpaWEuIFNlb21lIGthIGFudHVkIHB1aHZyaSBrb250ZWtzdGlnYSwgZXQgdGVtYWxlIGvDpHNrZSBlZGFzaSBhbmRhXHJcbiAgICBBUFAuaW5kZXhCdWZmZXIgPSBHTC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIEFQUC5pbmRleEJ1ZmZlci5udW1iZXJPZkluZGV4ZXMgPSAzNjtcclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIEFQUC5pbmRleEJ1ZmZlcik7XHJcblxyXG4gICAgLy9Bbm5hbWUgbG9vZHVkIHB1aHZyaWxlIGFuZG1lZFxyXG4gICAgR0wuYnVmZmVyRGF0YShHTC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IFVpbnQxNkFycmF5KEFQUC5teUluZGljZXNEYXRhKSwgR0wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgIC8vTcOkw6RyYW1lIHByb2dyYW1taSwgbWlkYSBtZSByZW5kZXJkYW1pc2VsIGthc3V0YWRhIHRhaGFtZVxyXG4gICAgR0wudXNlUHJvZ3JhbShzaGFkZXJQcm9ncmFtKTtcclxuXHJcbiAgICAvL1NhYW1lIGluZGVrc2ksIG1pcyBuw6RpdGFiIGt1cyBhc3ViIG1laWUgcHJvZ3JhbW1pcyBrYXN1dGF0YXZhcyB0aXB1dmFyanVuZGFqYXNcclxuICAgIC8vb2xldiB0aXB1YXRyaWJ1dXQgbmltZWdhIGFfVmVydGV4UG9zaXRpb25cclxuICAgIEFQUC5hX1Bvc2l0aW9uID0gR0wuZ2V0QXR0cmliTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJhX1Bvc2l0aW9uXCIpO1xyXG5cclxuICAgIC8vU2FhbWUgdsOkcnZpYXRyaWJ1dWRpIGFzdWtvaGFcclxuICAgIEFQUC5hX1RleHR1cmVDb29yZCA9IEdMLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYV9UZXh0dXJlQ29vcmRcIik7XHJcblxyXG4gICAgLy9TYWFtZSDDvGh0c2V0ZSBtdXV0dWphdGUgYXN1a29oYWRcclxuICAgIEFQUC51X01vZGVsTWF0cml4ID0gR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9Nb2RlbE1hdHJpeFwiKTtcclxuICAgIEFQUC51X1ZpZXdNYXRyaXggPSBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X1ZpZXdNYXRyaXhcIik7XHJcbiAgICBBUFAudV9Qcm9qZWN0aW9uTWF0cml4ID0gR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9Qcm9qZWN0aW9uTWF0cml4XCIpO1xyXG4gICAgQVBQLnVfVGV4dHVyZSA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfVGV4dHVyZVwiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbW91c2VDbGlja0hhbmRsZXIoKSB7XHJcbiAgICBBUFAuaXNNb3VzZURvd24gPSAhQVBQLmlzTW91c2VEb3duO1xyXG5cclxuICAgIGlmKEFQUC5pc01vdXNlRG93bilcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG1vdXNlTW92ZSwgZmFsc2UpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgbW91c2VNb3ZlLCBmYWxzZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdXNlU2Nyb2xsSGFuZGxlcihlKSB7XHJcbiAgICB2YXIgZGVsdGEgPSAwO1xyXG5cclxuICAgIGlmKCFlKVxyXG4gICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XHJcblxyXG4gICAgaWYoZS53aGVlbERlbHRhKSAgICAgICAgICAgICAgICAgICAgLyoqIEludGVybmV0IEV4cGxvcmVyL09wZXJhL0dvb2dsZSBDaHJvbWUgKiovXHJcbiAgICAgICAgZGVsdGEgPSBlLndoZWVsRGVsdGEgLyAxMjA7XHJcblxyXG4gICAgZWxzZSBpZihlLmRldGFpbCkgICAgICAgICAgICAgICAgICAgLyoqIE1vemlsbGEgRmlyZWZveCAqKi9cclxuICAgICAgICBkZWx0YSA9IC1lLmRldGFpbC8zO1xyXG5cclxuICAgIGlmKGRlbHRhKSB7XHJcbiAgICAgICAgaWYoZGVsdGEgPiAwICYmIEFQUC5yYWRpdXMgPiBBUFAuTUlOX1JBRElVUylcclxuICAgICAgICAgICAgQVBQLnJhZGl1cyAtPSBBUFAuWk9PTV9WQUxVRTtcclxuICAgICAgICBlbHNlIGlmKGRlbHRhIDwgMClcclxuICAgICAgICAgICAgQVBQLnJhZGl1cyArPSBBUFAuWk9PTV9WQUxVRTtcclxuICAgIH1cclxuXHJcbiAgICAgICAgaWYoZS5wcmV2ZW50RGVmYXVsdClcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcclxuXHJcbiAgICB0b0Nhbm9uaWNhbCgpO1xyXG4gICAgdXBkYXRlQ2FtZXJhKCk7XHJcbn1cclxuXHJcbi8vSGlpcmUgYWxsaG9pZG1pc2VsIGphIGxpaWd1dGFtaXNlbCBrw6Rpdml0dWIgYW50dWQgZnVua3RzaW9vblxyXG5mdW5jdGlvbiBtb3VzZU1vdmUoZSkge1xyXG4gICAgdmFyIHggPSBlLndlYmtpdE1vdmVtZW50WCB8fCBlLm1vek1vdmVtZW50WDtcclxuICAgIHZhciB5ID0gZS53ZWJraXRNb3ZlbWVudFkgfHwgZS5tb3pNb3ZlbWVudFk7XHJcblxyXG4gICAgaWYodHlwZW9mIHggPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgeCA9IDA7XHJcbiAgICBpZih0eXBlb2YgeSA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICB5ID0gMDtcclxuXHJcblxyXG4gICAgQVBQLmNhbWVyYVggKz0geCAvIDUwMDtcclxuICAgIEFQUC5jYW1lcmFZICs9IHkgLyA1MDA7XHJcblxyXG4gICAgcmVzdHJpY3RDYW1lcmFZKCk7XHJcbiAgICB0b0Nhbm9uaWNhbCgpO1xyXG5cclxuICAgIHVwZGF0ZUNhbWVyYSgpO1xyXG59XHJcblxyXG4vL0Z1bmt0c2lvb24sIGV0IHZpaWEgaG9yaXNvbnRhYWxuZSBqYSB2ZXJ0aWthYWxuZSBudXJrIGthbm9vbmlsaXNzZSB2b3JtaVxyXG4vL0ltcGxlbWVudGVlcml0dWQgM0QgTWF0aCBQcmltZXIgZm9yIEdyYXBoaWNzIGFuZCBHYW1lIERldmVsb3BtZW50IGp1aGVuZGkgasOkcmdpXHJcbmZ1bmN0aW9uIHRvQ2Fub25pY2FsKCkge1xyXG5cclxuICAgIC8vS3VpIG9sZW1lIDAga29vcmRpbmFhdGlkZWxcclxuICAgIGlmKEFQUC5yYWRpdXMgPT0gMC4wKSB7XHJcbiAgICAgICAgQVBQLmNhbWVyYVggPSBBUFAuY2FtZXJhWSA9IDAuMDtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvL0t1aSByYWFkaXVzIG9uIG5lZ2F0aWl2bmUuXHJcbiAgICAgICAgaWYoQVBQLnJhZGl1cyA8IDAuMCkge1xyXG4gICAgICAgICAgICBBUFAucmFkaXVzID0gLUFQUC5yYWRpdXM7XHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFYICs9IE1hdGguUEk7XHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFZID0gLUFQUC5jYW1lcmFZO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9WZXJ0aWthYWxuZSBudXJrIMO8bGVtaXNlc3QgcGlpcmlzdCB2w6RsamFcclxuICAgICAgICBpZihNYXRoLmFicyhBUFAuY2FtZXJhWSkgPiBBUFAuUElPVkVSVFdPKSB7XHJcblxyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWSArPSBBUFAuUElPVkVSVFdPO1xyXG5cclxuICAgICAgICAgICAgQVBQLmNhbWVyYVkgLT0gTWF0aC5mbG9vcihBUFAuY2FtZXJhWSAvIEFQUC5UV09QSSkgKiBBUFAuVFdPUEk7XHJcblxyXG4gICAgICAgICAgICBpZihBUFAuY2FtZXJhWSA+IE1hdGguUEkpIHtcclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFYICs9IE1hdGguUEk7XHJcblxyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVkgPSAzLjAgKiBNYXRoLlBJLzIuMCAtIEFQUC5jYW1lcmFZO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVkgLT0gQVBQLlBJT1ZFUlRXTztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9HSU1CQUwgTE9DS1xyXG4gICAgICAgIGlmKE1hdGguYWJzKEFQUC5jYW1lcmFZKSA+PSBBUFAuUElPVkVSVFdPICogMC45OTk5KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR0lNQkFMTE9DS1wiKTtcclxuICAgICAgICAgICAgQVBQLmNhbWVyYVggPSAwLjA7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmKE1hdGguYWJzKEFQUC5jYW1lcmFYKSA+IE1hdGguUEkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBBUFAuY2FtZXJhWCArPSBNYXRoLlBJO1xyXG5cclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFYIC09IE1hdGguZmxvb3IoQVBQLmNhbWVyYVggLyBBUFAuVFdPUEkpICogQVBQLlRXT1BJO1xyXG5cclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFYIC09IE1hdGguUEk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiByZXN0cmljdENhbWVyYVkoKSB7XHJcbiAgICBpZihNYXRoLmFicyhBUFAuY2FtZXJhWSkgPiBBUFAuTUFYX1ZFUlRJQ0FMKSB7XHJcbiAgICAgICAgaWYoQVBQLmNhbWVyYVkgPCAwKVxyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWSA9IC1BUFAuTUFYX1ZFUlRJQ0FMO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgQVBQLmNhbWVyYVkgPSBBUFAuTUFYX1ZFUlRJQ0FMO1xyXG4gICAgfVxyXG59XHJcblxyXG4vL0t1dHN1dGFrc2UgdsOkbGphIExvb3BlciBvYmpla3RpcyBpZ2Ega2FhZGVyXHJcbmZ1bmN0aW9uIGxvb3AoZGVsdGFUaW1lKSB7XHJcbiAgICB1cGRhdGUoZGVsdGFUaW1lKTtcclxuXHJcbiAgICAvL03DpMOkcmFtZSBrYWFkcmlwdWh2cmlrcyBtZWllIGVuZGEgbG9vZHVkIGthYWRyaXB1aHZyaVxyXG4gICAgR0wuYmluZEZyYW1lYnVmZmVyKEdMLkZSQU1FQlVGRkVSLCBBUFAuZnJhbWVCdWZmZXIpO1xyXG5cclxuICAgIC8vUmVuZGVyZGFtZSBzdHNlZW5pIHRla3N0dXVyaWxlXHJcbiAgICByZW5kZXJUb1RleHR1cmUoKTtcclxuXHJcbiAgICAvL1Nlb21lIGxhaHRpIGVlbG1pc2Uga2FhZHJpcHVodnJpLiBQw6RyYXN0IHNlZGEgb24ga2FzdXR1c2VsIHRhdmFsaW5lIHB1aHZlciwgbWlkYSBrYXN1dGF0YWtzZSBjYW52YXMgZWxlbWVuZGkgamFva3MuXHJcbiAgICBHTC5iaW5kRnJhbWVidWZmZXIoR0wuRlJBTUVCVUZGRVIsIG51bGwpO1xyXG5cclxuICAgIHJlbmRlcigpO1xyXG59XHJcblxyXG4vL1V1ZW5kYWIgYW5kbWVpZCwgZXQgb2xla3MgdsO1aW1hbGlrIHN0c2VlbiBsaWlrdW1hIHBhbm5hXHJcbmZ1bmN0aW9uIHVwZGF0ZShkZWx0YVRpbWUpIHtcclxuICAgIEFQUC50aW1lICs9IGRlbHRhVGltZSAvIDEwMDtcclxuXHJcbiAgIHVwZGF0ZU9iamVjdCgpO1xyXG59XHJcblxyXG4vL1V1ZW5kYWIga2FhbWVyYXQsIGV0IHNlZGEgb2xla3MgdsO1aW1hbGlrIMO8bWJlciBvYmpla3RpIHDDtsO2cmF0YVxyXG5mdW5jdGlvbiB1cGRhdGVDYW1lcmEoKSB7XHJcblxyXG4gICAgLy9MZWlhbWUgdXVlIHBvc2l0c2lvb25pLCBtaXMgYWphcyBsaWlndWIgcG9sYWFyc2VzIGtvb3JkaW5hYXRzw7xzdGVlbWlzIGphIG1pbGxlIHRlaXNlbmRhbWUgcmlzdGtvb3JkaW5hYXRzw7xzdGVlbWlcclxuICAgIEFQUC5jYW1lcmFBdCA9IFtBUFAub2JqZWN0QXRbMF0gKyBBUFAucmFkaXVzICogTWF0aC5jb3MoQVBQLmNhbWVyYVkpICogTWF0aC5zaW4oQVBQLmNhbWVyYVgpLCAgICAgICAvLyBYXHJcbiAgICAgICAgICAgICAgICAgICAgIEFQUC5vYmplY3RBdFsxXSArIEFQUC5yYWRpdXMgKiAtTWF0aC5zaW4oQVBQLmNhbWVyYVkpLCAgICAgICAgICAgICAgICAgICAgIC8vIFlcclxuICAgICAgICAgICAgICAgICAgICAgQVBQLm9iamVjdEF0WzJdICsgQVBQLnJhZGl1cyAqIE1hdGguY29zKEFQUC5jYW1lcmFZKSAqIE1hdGguY29zKEFQUC5jYW1lcmFYKV07ICAgICAvLyBaXHJcblxyXG5cclxuICAgIC8vTGVpYW1lIHN1dW5hdmVrdG9yaSwga2FhbWVyYXN0IG9iamVrdGluaVxyXG4gICAgQVBQLmxvb2tEaXJlY3Rpb24gPSBbQVBQLm9iamVjdEF0WzBdIC0gQVBQLmNhbWVyYUF0WzBdLCAgICAgICAgICAgICAgIC8vIFhcclxuICAgICAgICAgICAgICAgICAgICAgICAgIEFQUC5vYmplY3RBdFsxXSAtIEFQUC5jYW1lcmFBdFsxXSwgICAgICAgICAgICAgICAvLyBZXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBBUFAub2JqZWN0QXRbMl0gLSBBUFAuY2FtZXJhQXRbMl1dOyAgICAgICAgICAgICAgLy8gWlxyXG5cclxuICAgIC8vTGVpYW1lIHB1bmt0aSwgbWlkYSBrYWFtZXJhIHZhYXRhYlxyXG4gICAgdmVjMy5hZGQoQVBQLmxvb2tBdCwgQVBQLmNhbWVyYUF0LCBBUFAubG9va0RpcmVjdGlvbik7XHJcblxyXG4gICAgQVBQLnJpZ2h0ID0gW1xyXG4gICAgICAgIE1hdGguc2luKEFQUC5jYW1lcmFYIC0gTWF0aC5QSSAvIDIpLFxyXG4gICAgICAgIDAsXHJcbiAgICAgICAgTWF0aC5jb3MoQVBQLmNhbWVyYVggLSBNYXRoLlBJIC8gMilcclxuICAgIF07XHJcblxyXG4gICAgdmVjMy5jcm9zcyhBUFAudXAsIEFQUC5yaWdodCwgQVBQLmxvb2tEaXJlY3Rpb24pO1xyXG5cclxuICAgIC8vVXVlbmRhbWUga2FhbWVyYW1hYXRyaWtzaXRcclxuICAgIG1hdDQubG9va0F0KEFQUC52aWV3TWF0cml4LCBBUFAuY2FtZXJhQXQsIEFQUC5sb29rQXQsIEFQUC51cCk7XHJcblxyXG5cclxufVxyXG5cclxuLy91dWVuZGFtZSBvYmpla3RpXHJcbmZ1bmN0aW9uIHVwZGF0ZU9iamVjdCgpIHtcclxuICAgIG1hdDQucm90YXRlWChBUFAudGV4dHVyZU1vZGVsTWF0cml4LCBBUFAudGV4dHVyZU1vZGVsTWF0cml4LCAwLjAwNSk7XHJcbn1cclxuXHJcbi8vUmVuZGVyZGFtZSB0ZWtzdHV1cmlsZVxyXG5mdW5jdGlvbiByZW5kZXJUb1RleHR1cmUoKSB7XHJcbiAgICBHTC52aWV3cG9ydCgwLCAwLCBBUFAuZnJhbWVCdWZmZXIud2lkdGgsIEFQUC5mcmFtZUJ1ZmZlci5oZWlnaHQpO1xyXG4gICAgR0wuY2xlYXJDb2xvcigxLjAsIDEuMCwgMS4wLCAxLjApO1xyXG4gICAgR0wuY2xlYXIoR0wuQ09MT1JfQlVGRkVSX0JJVCB8IEdMLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgIC8vTMO8bGl0YW1lIHNpc3NlIHPDvGdhdnVzdGVzdGlcclxuICAgIEdMLmVuYWJsZShHTC5ERVBUSF9URVNUKTtcclxuICAgIEdMLmRlcHRoRnVuYyhHTC5MRVNTKTtcclxuXHJcbiAgICAvL1Nlb21lIHRpcHVwdWh2cmkgamEgbcOkw6RyYW1lLCBrdXMgYW50dWQgdGlwdWF0cmlidXV0IGFzdWIgYW50dWQgbWFzc2lpdmlzLlxyXG4gICAgR0wuYmluZEJ1ZmZlcihHTC5BUlJBWV9CVUZGRVIsIEFQUC52ZXJ0ZXhCdWZmZXIpO1xyXG4gICAgR0wudmVydGV4QXR0cmliUG9pbnRlcihBUFAuYV9Qb3NpdGlvbiwgMywgR0wuRkxPQVQsIGZhbHNlLCBBUFAudmVydGV4U2l6ZSAqIDQsIDApO1xyXG4gICAgR0wudmVydGV4QXR0cmliUG9pbnRlcihBUFAuYV9UZXh0dXJlQ29vcmQsIDIsIEdMLkZMT0FULCBmYWxzZSwgQVBQLnZlcnRleFNpemUgKiA0LCBBUFAudmVydGV4U2l6ZSAqIDQgLSAyICogNCk7XHJcblxyXG4gICAgLy9Ba3RpdmVlcmltZSBhdHJpYnV1ZGlkXHJcbiAgICBHTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShBUFAuYV9Qb3NpdGlvbik7XHJcbiAgICBHTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShBUFAuYV9UZXh0dXJlQ29vcmQpO1xyXG5cclxuICAgIC8vQWt0aXZlZXJpbWUgamEgbcOkw6RyYW1lIHRla3N0dXVyaVxyXG4gICAgR0wuYWN0aXZlVGV4dHVyZShHTC5URVhUVVJFMCk7XHJcbiAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBBUFAudGV4dHVyZSk7XHJcbiAgICBHTC51bmlmb3JtMWkoQVBQLnVfVGV4dHVyZSwgMCk7XHJcblxyXG4gICAgLy9TYWFkYW1lIG1laWUgdGVrc3R1dXJpIG1hYXRyaWtzaWQga2EgdmFyanVuZGFqYXNzZVxyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9Nb2RlbE1hdHJpeCwgZmFsc2UsIEFQUC50ZXh0dXJlTW9kZWxNYXRyaXgpO1xyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9WaWV3TWF0cml4LCBmYWxzZSwgQVBQLnRleHR1cmVWaWV3TWF0cml4KTtcclxuICAgIEdMLnVuaWZvcm1NYXRyaXg0ZnYoQVBQLnVfUHJvamVjdGlvbk1hdHJpeCwgZmFsc2UsIEFQUC50ZXh0dXJlUHJvamVjdGlvbk1hdHJpeCk7XHJcblxyXG4gICAgLy9SZW5kZXJkYW1lIGtvbG1udXJnYWQgaW5kZWtzaXRlIGrDpHJnaVxyXG4gICAgR0wuYmluZEJ1ZmZlcihHTC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgQVBQLmluZGV4QnVmZmVyKTtcclxuICAgIEdMLmRyYXdFbGVtZW50cyhHTC5UUklBTkdMRVMsIEFQUC5pbmRleEJ1ZmZlci5udW1iZXJPZkluZGV4ZXMsIEdMLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuXHJcbiAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBBUFAuRkJDb2xvclRleHR1cmUpO1xyXG4gICAgR0wuZ2VuZXJhdGVNaXBtYXAoR0wuVEVYVFVSRV8yRCk7XHJcbiAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBudWxsKTtcclxuXHJcbn1cclxuXHJcblxyXG4vL1JlbmRlcmRhbWluZVxyXG5mdW5jdGlvbiByZW5kZXIoKSB7XHJcblxyXG4gICAgLy9QdWhhc3RhbWUga2EgdsOkcnZpLSBqYSBzw7xnYXZ1c3B1aHZyaWQsIG5pbmcgbcOkw6RyYW1lIHV1ZSBwdWhhc3R1dsOkcnZ1c2UuXHJcbiAgICAvL0hldGtlbCBwdWhhc3RhbWluZSBtaWRhZ2kgZWkgdGVlLCBzZXN0IG1lIHJlbmRlcmRhbWUgdmFpZCDDvGhlIGtvcnJhLCBrdWlkIGt1aSBtZSB0c8O8a2tsaXMgc2VkYSB0ZWdlbWFcclxuICAgIC8vb24gbsOkaGEga2EsIG1pZGEgbmFkIHRlZXZhZC5cclxuICAgIEdMLnZpZXdwb3J0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcbiAgICBHTC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjAsIDEuMCk7XHJcbiAgICBHTC5jbGVhcihHTC5DT0xPUl9CVUZGRVJfQklUIHwgR0wuREVQVEhfQlVGRkVSX0JJVCk7XHJcblxyXG4gICAgLy9Mw7xsaXRhbWUgc2lzc2Ugc8O8Z2F2dXN0ZXN0aVxyXG4gICAgR0wuZW5hYmxlKEdMLkRFUFRIX1RFU1QpO1xyXG4gICAgR0wuZGVwdGhGdW5jKEdMLkxFU1MpO1xyXG5cclxuICAgIC8vU2VvbWUgdGlwdXB1aHZyaSBqYSBtw6TDpHJhbWUsIGt1cyBhbnR1ZCB0aXB1YXRyaWJ1dXQgYXN1YiBhbnR1ZCBtYXNzaWl2aXMuXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkFSUkFZX0JVRkZFUiwgQVBQLnZlcnRleEJ1ZmZlcik7XHJcbiAgICBHTC52ZXJ0ZXhBdHRyaWJQb2ludGVyKEFQUC5hX1Bvc2l0aW9uLCAzLCBHTC5GTE9BVCwgZmFsc2UsIEFQUC52ZXJ0ZXhTaXplICogNCwgMCk7XHJcbiAgICBHTC52ZXJ0ZXhBdHRyaWJQb2ludGVyKEFQUC5hX1RleHR1cmVDb29yZCwgMiwgR0wuRkxPQVQsIGZhbHNlLCBBUFAudmVydGV4U2l6ZSAqIDQsIEFQUC52ZXJ0ZXhTaXplICogNCAtIDIgKiA0KTtcclxuXHJcbiAgICAvL0FrdGl2ZWVyaW1lIGF0cmlidXVkaWRcclxuICAgIEdMLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KEFQUC5hX1Bvc2l0aW9uKTtcclxuICAgIEdMLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KEFQUC5hX1RleHR1cmVDb29yZCk7XHJcblxyXG4gICAgLy9Ba3RpdmVlcmltZSBqYSBtw6TDpHJhbWUgdGVrc3R1dXJpXHJcbiAgICBHTC5hY3RpdmVUZXh0dXJlKEdMLlRFWFRVUkUwKTtcclxuICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIEFQUC5GQkNvbG9yVGV4dHVyZSk7XHJcbiAgICBHTC51bmlmb3JtMWkoQVBQLnVfVGV4dHVyZSwgMCk7XHJcblxyXG4gICAgLy9TYWFkYW1lIG1laWUgbWFhdHJpa3NpZCBrYSB2YXJqdW5kYWphc3NlXHJcbiAgICBHTC51bmlmb3JtTWF0cml4NGZ2KEFQUC51X01vZGVsTWF0cml4LCBmYWxzZSwgQVBQLm1vZGVsTWF0cml4KTtcclxuICAgIEdMLnVuaWZvcm1NYXRyaXg0ZnYoQVBQLnVfVmlld01hdHJpeCwgZmFsc2UsIEFQUC52aWV3TWF0cml4KTtcclxuICAgIEdMLnVuaWZvcm1NYXRyaXg0ZnYoQVBQLnVfUHJvamVjdGlvbk1hdHJpeCwgZmFsc2UsIEFQUC5wcm9qZWN0aW9uTWF0cml4KTtcclxuXHJcbiAgICAvL1JlbmRlcmRhbWUga29sbW51cmdhZCBpbmRla3NpdGUgasOkcmdpXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBBUFAuaW5kZXhCdWZmZXIpO1xyXG4gICAgR0wuZHJhd0VsZW1lbnRzKEdMLlRSSUFOR0xFUywgQVBQLmluZGV4QnVmZmVyLm51bWJlck9mSW5kZXhlcywgR0wuVU5TSUdORURfU0hPUlQsIDApO1xyXG59XHJcblxyXG4iLCJMb29wZXIgPSBmdW5jdGlvbihkb21FbGVtZW50LCBjYWxsYmFjaykge1xyXG4gICAgdGhpcy5kb21FbGVtZW50ID0gZG9tRWxlbWVudDtcclxuXHJcbiAgICB0aGlzLmxhc3RUaW1lID0gMDtcclxuICAgIHRoaXMuZGVsdGFUaW1lID0gMDtcclxuXHJcbiAgICB0aGlzLnJlcXVlc3RJZDtcclxuXHJcbiAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XHJcblxyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG4gICAgICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xyXG5cclxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWU7XHJcbn07XHJcblxyXG5Mb29wZXIucHJvdG90eXBlID0ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yOiBMb29wZXIsXHJcblxyXG4gICAgY2FsY3VsYXRlRGVsdGFUaW1lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgdGltZU5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cclxuICAgICAgICBpZih0aGlzLmxhc3RUaW1lICE9IDApXHJcbiAgICAgICAgICAgIHRoaXMuZGVsdGFUaW1lID0gKHRpbWVOb3cgLSB0aGlzLmxhc3RUaW1lKSAvIDE2O1xyXG5cclxuICAgICAgICB0aGlzLmxhc3RUaW1lID0gdGltZU5vdztcclxuICAgIH0sXHJcblxyXG4gICAgbG9vcDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5yZXF1ZXN0SWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5sb29wLmJpbmQodGhpcyksIHRoaXMuZG9tRWxlbWVudCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlRGVsdGFUaW1lKCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5kZWx0YVRpbWUpO1xyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTG9vcGVyOyIsIi8qKlxyXG4gKiBIb2lhYiBlbmRhcyBXZWJHTFByb2dyYW0gb2JqZWt0aSBqYSBXZWJHTFNoYWRlciB0aXB1dmFyanVuZGFqYXQgamEgcGlrc2xpdmFyanVuZGFqYXRcclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleFNoYWRlclBhdGhcclxuICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50U2hhZGVyUGF0aFxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBvbkxpbmtlZCBNZWV0b2QsIG1pcyBrdXRzdXRha3NlIHbDpGxqYSwga3VpIHZhcmp1bmRhamFkIG9uIGxhZXR1ZFxyXG4gKiBAY2xhc3NcclxuICovXHJcbnZhciBQcm9ncmFtT2JqZWN0ID0gZnVuY3Rpb24odmVydGV4U2hhZGVyUGF0aCwgZnJhZ21lbnRTaGFkZXJQYXRoLCBvbkxpbmtlZCkge1xyXG4gICAgdGhpcy5wcm9ncmFtID0gR0wuY3JlYXRlUHJvZ3JhbSgpO1xyXG5cclxuICAgIHRoaXMub25MaW5rZWQgPSBvbkxpbmtlZDtcclxuXHJcbiAgICB0aGlzLnZlcnRleFNoYWRlciA9IHtcclxuICAgICAgICBcInNoYWRlclwiOiBHTC5jcmVhdGVTaGFkZXIoR0wuVkVSVEVYX1NIQURFUiksXHJcbiAgICAgICAgXCJwYXRoXCI6IHZlcnRleFNoYWRlclBhdGgsXHJcbiAgICAgICAgXCJzcmNcIjogXCJcIixcclxuICAgICAgICBcImNvbXBsZXRlZFwiOiBmYWxzZVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmZyYWdtZW50U2hhZGVyID0ge1xyXG4gICAgICAgIFwic2hhZGVyXCI6IEdMLmNyZWF0ZVNoYWRlcihHTC5GUkFHTUVOVF9TSEFERVIpLFxyXG4gICAgICAgIFwicGF0aFwiOiBmcmFnbWVudFNoYWRlclBhdGgsXHJcbiAgICAgICAgXCJzcmNcIjogXCJcIixcclxuICAgICAgICBcImNvbXBsZXRlZFwiOiBmYWxzZVxyXG4gICAgfTtcclxufTtcclxuXHJcblByb2dyYW1PYmplY3QucHJvdG90eXBlID0ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yOiBQcm9ncmFtT2JqZWN0LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGJhY2sgbWVldG9kLCBtaXMga29tcGlsZWVyaWIgamEgc8OkdGVzdGFiIHZhcmp1bmRhamFkLCBrdWkgbcO1bGVtYWQgb24gYXPDvG5rcm9vbnNlbHQgbGFldHVkXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNyYyBMw6RodGVrb29kLCBtaXMgQUpBWCdpIGFiaWwgbGFldGlcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFRlZSwgbWlsbGUgYWJpbCB0dXZhc3RhZGEsIGt1bW1hIHZhcmp1bmRhamEgbMOkaHRla29vZCBvbiBsYWV0dWRcclxuICAgICAqL1xyXG4gICAgb25jb21wbGV0ZTogZnVuY3Rpb24oc3JjLCBwYXRoKSB7XHJcbiAgICAgICAgaWYocGF0aCA9PT0gdGhpcy52ZXJ0ZXhTaGFkZXIucGF0aCkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRleFNoYWRlci5jb21wbGV0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRleFNoYWRlci5zcmMgPSBzcmM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYocGF0aCA9PT0gdGhpcy5mcmFnbWVudFNoYWRlci5wYXRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIuY29tcGxldGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5mcmFnbWVudFNoYWRlci5zcmMgPSBzcmM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih0aGlzLnZlcnRleFNoYWRlci5jb21wbGV0ZWQgJiYgdGhpcy5mcmFnbWVudFNoYWRlci5jb21wbGV0ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21waWxlU2hhZGVyKHRoaXMudmVydGV4U2hhZGVyLnNoYWRlciwgdGhpcy52ZXJ0ZXhTaGFkZXIuc3JjKTtcclxuICAgICAgICAgICAgdGhpcy5jb21waWxlU2hhZGVyKHRoaXMuZnJhZ21lbnRTaGFkZXIuc2hhZGVyLCB0aGlzLmZyYWdtZW50U2hhZGVyLnNyYyk7XHJcblxyXG4gICAgICAgICAgICBHTC5hdHRhY2hTaGFkZXIodGhpcy5wcm9ncmFtLCB0aGlzLnZlcnRleFNoYWRlci5zaGFkZXIpO1xyXG4gICAgICAgICAgICBHTC5hdHRhY2hTaGFkZXIodGhpcy5wcm9ncmFtLCB0aGlzLmZyYWdtZW50U2hhZGVyLnNoYWRlcik7XHJcblxyXG4gICAgICAgICAgICBHTC5saW5rUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xyXG5cclxuICAgICAgICAgICAgaWYoIUdMLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5wcm9ncmFtLCBHTC5MSU5LX1NUQVRVUykpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRXJyb3IgbGlua2luZyBzaGFkZXIgcHJvZ3JhbTogXFxcIlwiICsgR0wuZ2V0UHJvZ3JhbUluZm9Mb2codGhpcy5wcm9ncmFtKSArIFwiXFxcIlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYodHlwZW9mIHRoaXMub25MaW5rZWQgIT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgICAgIHRoaXMub25MaW5rZWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogw5xyaXRhYiBrb21waWxlZXJpZGEgdmFyanVuZGFqYVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7V2ViR0xTaGFkZXJ9IHNoYWRlciBWYXJqdW5kYWphIG1pZGEga29tcGlsZWVyaWRhXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIEzDpGh0ZWtvb2QsIG1pZGEga29tcGlsZWVyaWRhXHJcbiAgICAgKi9cclxuICAgIGNvbXBpbGVTaGFkZXI6IGZ1bmN0aW9uKHNoYWRlciwgc291cmNlKSB7XHJcbiAgICAgICAgR0wuc2hhZGVyU291cmNlKHNoYWRlciwgc291cmNlKTtcclxuICAgICAgICBHTC5jb21waWxlU2hhZGVyKHNoYWRlcik7XHJcblxyXG4gICAgICAgIGlmICghR0wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgR0wuQ09NUElMRV9TVEFUVVMpKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiU2hhZGVyIGNvbXBpbGF0aW9uIGZhaWxlZC4gRXJyb3I6IFxcXCJcIiArIEdMLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKSArIFwiXFxcIlwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQW50dWQga2xhc3NpIGFiaWwgb24gdsO1aW1hbGlrIHByb2dyYW1taSBsYWFkaWRhIGphIGFzw7xua3Jvb25zZWx0IHRhZ2FwaWxkaWwgc3BldHNpZml0c2Vlcml0dWQgdmFyanVuZGFqYWRcclxuICogdGFnYXN0YXR1ZCBwcm9ncmFtbWlnYSBzaWR1ZGFcclxuICpcclxuICogQGNsYXNzIFNoYWRlclByb2dyYW1Mb2FkZXJcclxuICovXHJcbnZhciBTaGFkZXJQcm9ncmFtTG9hZGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmNvbnRhaW5lciA9IFtdO1xyXG4gICAgdGhpcy5jb3VudGVyID0gLTE7XHJcbn07XHJcblxyXG5TaGFkZXJQcm9ncmFtTG9hZGVyLnByb3RvdHlwZSA9IHtcclxuICAgIGNvbnN0cnVjdG9yOiBTaGFkZXJQcm9ncmFtTG9hZGVyLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGFnYXN0YWIgcHJvZ3JhbW0gb2JqZWt0aS4gQXPDvG5rcm9vbnNlbHQgdGFnYXBsYWFuaWwgbGFldGFrc2UgamEga29tcGlsZWVyaXRha3NlIHZhcmp1bmRhamFkLiBFbm5lIGt1aVxyXG4gICAgICogcHJvZ3JhbW1pIGthc3V0YWRhIHR1bGViIGtvbnRyb2xsaWRhLCBldCB2YXJqdW5kYWphZCBvbiBrb21waWxlZXJpdHVkIGphIHByb2dyYW1taWdhIHNlb3R1ZC4gVsO1aW1hbGlrIG9uXHJcbiAgICAgKiBwYXJhbWVldHJpa3MgYW5kYSBrYSBDYWxsYmFjayBmdW5rdHNpb29uLCBtaXMgdGVhZGEgYW5uYWIsIGt1aSB2YXJqdW5kYWphZCBvbiBzZW90dWQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleFNoYWRlclBhdGggVGVlLCB0aXB1dmFyanVuZGFqYSBqdXVyZGVcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmcmFnbWVudFNoYWRlclBhdGggVGVlLCBwaWtzbGl2YXJqdW5kYWphIGp1dXJkZVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlua2VkQ2FsbGJhY2sgRnVua3RzaW9vbiwgbWlzIGt1dHN1dGFrc2UgdsOkbGphLCBrdWkgdmFyanVuZGFqYWQgb24ga29tcGlsZWVyaXR1ZCBqYSBzZW90dWQgcHJvZ3JhbW1pZ2FcclxuICAgICAqIEByZXR1cm5zIHtleHBvcnRzLmRlZmF1bHRPcHRpb25zLnByb2dyYW18KnxXZWJHTFByb2dyYW18UHJvZ3JhbU9iamVjdC5wcm9ncmFtfVxyXG4gICAgICovXHJcbiAgICBnZXRQcm9ncmFtOiBmdW5jdGlvbih2ZXJ0ZXhTaGFkZXJQYXRoLCBmcmFnbWVudFNoYWRlclBhdGgsIGxpbmtlZENhbGxiYWNrKSB7XHJcbiAgICAgICAgdGhpcy5jb3VudGVyKys7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXJbdGhpcy5jb3VudGVyXSA9IG5ldyBQcm9ncmFtT2JqZWN0KHZlcnRleFNoYWRlclBhdGgsIGZyYWdtZW50U2hhZGVyUGF0aCwgbGlua2VkQ2FsbGJhY2spO1xyXG4gICAgICAgIHZhciBwcm9ncmFtID0gdGhpcy5jb250YWluZXJbdGhpcy5jb3VudGVyXTtcclxuXHJcbiAgICAgICAgdGhpcy5sb2FkQXN5bmNTaGFkZXJTb3VyY2UodmVydGV4U2hhZGVyUGF0aCwgcHJvZ3JhbS5vbmNvbXBsZXRlLmJpbmQocHJvZ3JhbSkpO1xyXG4gICAgICAgIHRoaXMubG9hZEFzeW5jU2hhZGVyU291cmNlKGZyYWdtZW50U2hhZGVyUGF0aCwgcHJvZ3JhbS5vbmNvbXBsZXRlLmJpbmQocHJvZ3JhbSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gcHJvZ3JhbS5wcm9ncmFtO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIExhZWIgYXPDvG5rcm9vbnNlbHRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2hhZGVyUGF0aCBUZWUsIGt1cyBhc3ViIHZhcmp1bmRhamFcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIEZ1bmt0c2lvb24sIG1pcyBrw6Rpdml0YXRha3NlLCBrdWkgbMOkaHRla29vZCBvbiBrw6R0dGUgc2FhZHVkLiBTYWFkZXRha3NlIHZhc3R1cyBqYSB0ZWUuXHJcbiAgICAgKi9cclxuICAgIGxvYWRBc3luY1NoYWRlclNvdXJjZTogZnVuY3Rpb24oc2hhZGVyUGF0aCwgY2FsbGJhY2spIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICBhc3luYzogdHJ1ZSxcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICB1cmw6IHNoYWRlclBhdGgsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVzdWx0LCBzaGFkZXJQYXRoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvZ3JhbU9iamVjdDtcclxubW9kdWxlLmV4cG9ydHMgPSBTaGFkZXJQcm9ncmFtTG9hZGVyOyJdfQ==
