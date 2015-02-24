(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////Antud osa tegeleb WebGL konteksti loomisega ja meile vajaliku WebGLProgram objekti loomisega ///////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ShaderProgramLoader = require("./../utils/shaderprogramloader");
var Looper = require("./../utils/looper");

//Varjundajate kataloog
var SHADER_PATH = "shaders/lesson08/";

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
//////////////////////////////////////////////////////// LESSON08 - VALGUS /////////////////////////////////////////////
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
APP.MIN_RADIUS = 1.0;

//Suumimiskonstant
APP.ZOOM_VALUE = 1.0;

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
    //Valgusallikas, mida kasutame stseeni renderdamisel
    APP.directionalLight = {
        "color": new Float32Array([1.0, 1.0, 1.0]),
        "direction": new Float32Array([-1.0, -1.0, 1.0])
    };

    //Valgusallikas, mida kasutame tekstuuri renderdamisel
    APP.textureDirectionalLight = {
        "color": new Float32Array([1.0, 1.0, 0.0]),
        "direction": new Float32Array([1.0, 0.0, 0.0])
    };

    //Materjal, mida kasutame mõlemas renderdamisetapis
    APP.material = {
        "ambientColor": new Float32Array([0.3, 0.3, 0.3]),
        "diffuseColor": new Float32Array([0.5, 0.5, 0.5]),
        "specularColor": new Float32Array([0.7, 0.7, 0.7]),
        "shininess": 128.0
    };

    //Teeme muutuja, kuhu salvestada aega, et kaamerat aja möödudes ümber objekti pöörata
    APP.time = 0;

    APP.cameraX = -0.7;
    APP.cameraY = -0.7;
    APP.radius = 5;

    //Mudelmaatriks, millega objektiruumist maailmaruumi saada
    APP.modelMatrix = mat4.create();

    //Mudelmaatriks, mida kasutame tekstuurile renderdamiseks
    APP.textureModelMatrix = mat4.create();

    //Punkt, kus objekt hetkel asub
    APP.objectAt = [0.0, 0.0, -5.0];

    //Kasutades translatsiooni, saame mudelmaatriksiga objekti liigutada
    mat4.translate(APP.modelMatrix, APP.modelMatrix, APP.objectAt);
    mat4.translate(APP.textureModelMatrix, APP.textureModelMatrix, [0.0, 0.0, -4.0]);

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

    //Tippude andmed. Tipu koordinaadid x, y, z, Normaalvektori koordinaaid x, y, z ja tekstuuri koordinaadid u, v
    APP.myVerticesData = [
        //Esimene külg
        -1.0, -1.0,  1.0, 0.0, 0.0, 1.0,  0.0, 1.0,            //ALUMINE VASAK NURK
         1.0, -1.0,  1.0, 0.0, 0.0, 1.0,  1.0, 1.0,            //ALUMINE PAREM NURK
         1.0,  1.0,  1.0, 0.0, 0.0, 1.0,  1.0, 0.0,            //ÜLEMINE PAREM NURK
        -1.0,  1.0,  1.0, 0.0, 0.0, 1.0,  0.0, 0.0,            //ÜLEMINE VASAK NURK

        //Tagumine külg
        -1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0,
        -1.0,  1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 1.0,
        1.0,  1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 0.0,
        1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,

        //Ülemine külg
        -1.0,  1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0,
        -1.0,  1.0,  1.0, 0.0, 1.0, 0.0, 1.0, 1.0,
        1.0,  1.0,  1.0, 0.0, 1.0, 0.0, 1.0, 0.0,
        1.0,  1.0, -1.0, 0.0, 1.0, 0.0,  0.0, 0.0,

        //Alumine külg
        -1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 0.0, 1.0,
        1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 1.0, 1.0,
        1.0, -1.0,  1.0, 0.0, -1.0, 0.0,  1.0, 0.0,
        -1.0, -1.0,  1.0, 0.0, -1.0, 0.0, 0.0, 0.0,

        //Parem külg
        1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 0.0, 1.0,
        1.0,  1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0,
        1.0,  1.0,  1.0, 1.0, 0.0, 0.0,  1.0, 0.0,
        1.0, -1.0,  1.0, 1.0, 0.0, 0.0, 0.0, 0.0,

        //Vasak külg
        -1.0, -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0,
        -1.0, -1.0,  1.0, -1.0, 0.0, 0.0, 1.0, 1.0,
        -1.0,  1.0,  1.0, -1.0, 0.0, 0.0,  1.0, 0.0,
        -1.0,  1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 0.0,
    ];
    APP.vertexSize = 8;

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

    //Saame tipu normaalvektori
    APP.a_Normal = GL.getAttribLocation(shaderProgram, "a_Normal");

    //Saame värviatribuudi asukoha
    APP.a_TextureCoord = GL.getAttribLocation(shaderProgram, "a_TextureCoord");

    //Saame ühtsete muutujate asukohad
    APP.u_ModelMatrix = GL.getUniformLocation(shaderProgram, "u_ModelMatrix");
    APP.u_ViewMatrix = GL.getUniformLocation(shaderProgram, "u_ViewMatrix");
    APP.u_ProjectionMatrix = GL.getUniformLocation(shaderProgram, "u_ProjectionMatrix");
    APP.u_Texture = GL.getUniformLocation(shaderProgram, "u_Texture");

    //Valgusallika ühtsete muutujate asukohad
    APP.u_DirectionalLight = {
        "color": GL.getUniformLocation(shaderProgram, "u_DirectionalLightColor"),
        "direction": GL.getUniformLocation(shaderProgram, "u_DirectionalLightDirection")
    };

    //Materiali ühtsete muutujate asukohad
    APP.u_Material = {
        "ambientColor": GL.getUniformLocation(shaderProgram, "u_MaterialAmbientColor"),
        "diffuseColor": GL.getUniformLocation(shaderProgram, "u_MaterialDiffuseColor"),
        "specularColor": GL.getUniformLocation(shaderProgram, "u_MaterialSpecularColor"),
        "shininess": GL.getUniformLocation(shaderProgram, "u_MaterialShininess")
    };
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
    vec3.cross(APP.up, APP.lookDirection, APP.right);

    //Uuendame kaameramaatriksit
    mat4.lookAt(APP.viewMatrix, APP.cameraAt, APP.lookAt, APP.up);


}

//uuendame objekti
function updateObject() {
    mat4.rotateY(APP.textureModelMatrix, APP.textureModelMatrix, 0.005);
}

//Määrame valgusarvutuste jaoks ühtsed muutujad
function setMaterialUniforms() {

    //Objekti materjali muutujad
    GL.uniform3fv(APP.u_Material.ambientColor, APP.material.ambientColor);
    GL.uniform3fv(APP.u_Material.diffuseColor, APP.material.diffuseColor);
    GL.uniform3fv(APP.u_Material.specularColor, APP.material.specularColor);
    GL.uniform1f(APP.u_Material.shininess, APP.material.shininess);
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
    GL.vertexAttribPointer(APP.a_Normal, 3, GL.FLOAT, false, APP.vertexSize * 4, 3 * 4);
    GL.vertexAttribPointer(APP.a_TextureCoord, 2, GL.FLOAT, false, APP.vertexSize * 4, APP.vertexSize * 4 - 2 * 4);

    //Aktiveerime atribuudid
    GL.enableVertexAttribArray(APP.a_Position);
    GL.enableVertexAttribArray(APP.a_Normal);
    GL.enableVertexAttribArray(APP.a_TextureCoord);

    //Aktiveerime ja määrame tekstuuri
    GL.activeTexture(GL.TEXTURE0);
    GL.bindTexture(GL.TEXTURE_2D, APP.texture);
    GL.uniform1i(APP.u_Texture, 0);

    setMaterialUniforms();

    //Valgusallika muutujad
    GL.uniform3fv(APP.u_DirectionalLight.color, APP.textureDirectionalLight.color);
    GL.uniform3fv(APP.u_DirectionalLight.direction, APP.textureDirectionalLight.direction);

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

    setMaterialUniforms();

    //Valgusallika muutujad
    GL.uniform3fv(APP.u_DirectionalLight.color, APP.directionalLight.color);
    GL.uniform3fv(APP.u_DirectionalLight.direction, APP.directionalLight.direction);

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


},{"./../utils/looper":2,"./../utils/shaderprogramloader":3}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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
},{}]},{},[1]);
