(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\prog\\webglstudy\\lessons\\lesson08\\main.js":[function(require,module,exports){
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
},{}]},{},["C:\\prog\\webglstudy\\lessons\\lesson08\\main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibGVzc29ucy9sZXNzb24wOC9tYWluLmpzIiwibGVzc29ucy91dGlscy9sb29wZXIuanMiLCJsZXNzb25zL3V0aWxzL3NoYWRlcnByb2dyYW1sb2FkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vL0FudHVkIG9zYSB0ZWdlbGViIFdlYkdMIGtvbnRla3N0aSBsb29taXNlZ2EgamEgbWVpbGUgdmFqYWxpa3UgV2ViR0xQcm9ncmFtIG9iamVrdGkgbG9vbWlzZWdhIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbnZhciBTaGFkZXJQcm9ncmFtTG9hZGVyID0gcmVxdWlyZShcIi4vLi4vdXRpbHMvc2hhZGVycHJvZ3JhbWxvYWRlclwiKTtcclxudmFyIExvb3BlciA9IHJlcXVpcmUoXCIuLy4uL3V0aWxzL2xvb3BlclwiKTtcclxuXHJcbi8vVmFyanVuZGFqYXRlIGthdGFsb29nXHJcbnZhciBTSEFERVJfUEFUSCA9IFwic2hhZGVycy9sZXNzb24wOC9cIjtcclxuXHJcbi8vVGVrc3R1dXJpIGFzdWtvaHRcclxudmFyIFRFWFRVUkVfUEFUSCA9IFwiYXNzZXRzL3RleHR1cmUuanBnXCI7XHJcblxyXG4vL0VsZW1lbnQsIGt1aHUgcmVuZGVyZGFtZVxyXG52YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIik7XHJcblxyXG4vL0xvb21lIGdsb2JhYWxzZSBXZWJHTCBrb250ZWtzdGlcclxuR0wgPSBpbml0V2ViR0woY2FudmFzKTtcclxuXHJcbi8vU2VhZGlzdGFtZSByZW5kZXJkYW1pc3Jlc29sdXRzaW9vbmlcclxuR0wudmlld3BvcnQoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuR0wudmlld3BvcnRXaWR0aCA9IGNhbnZhcy53aWR0aDtcclxuR0wudmlld3BvcnRIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xyXG5cclxuLy9Mb29tZSB1dWUgcHJvZ3JhbW1pIHNwZXRzaWZpdHNlZXJpdHVkIHZhcmp1bmRhamF0ZWdhLiBLdW5hIGxhYWRpbWluZSBvbiBhc8O8bmtyb29ubmUsIHNpaXMgYW5uYW1lIGthYXNhIGthXHJcbi8vbWVldG9kaSwgbWlzIGt1dHN1dGFrc2UgdsOkbGphIGt1aSB2YXJqdW5kYWphZCBvbiBsYWV0dWRcclxudmFyIHNoYWRlclByb2dyYW1Mb2FkZXIgPSBuZXcgU2hhZGVyUHJvZ3JhbUxvYWRlcigpO1xyXG52YXIgc2hhZGVyUHJvZ3JhbSA9IHNoYWRlclByb2dyYW1Mb2FkZXIuZ2V0UHJvZ3JhbShTSEFERVJfUEFUSCArIFwidmVydGV4LnNoYWRlclwiLCBTSEFERVJfUEFUSCArIFwiZnJhZ21lbnQuc2hhZGVyXCIsIHNoYWRlcnNMb2FkZWQpO1xyXG5cclxuXHJcbi8vw5xyaXRhbWUgbHV1YSBXZWJHTCBrb250ZWtzdGlcclxuZnVuY3Rpb24gaW5pdFdlYkdMKGNhbnZhcykge1xyXG4gICAgdmFyIGdsID0gbnVsbDtcclxuXHJcbiAgICB0cnkge1xyXG5cclxuICAgICAgICAvL8Occml0YW1lIGx1dWEgdGF2YWxpc3Qga29udGVrc3RpLCBrdWkgc2VlIGViYcO1bm5lc3R1YiDDvHJpdGFtZSBsdXVhIGVrc3BlcmltZW50YWFsc2V0LFxyXG4gICAgICAgIC8vTWlkYSBrYXN1dGF0YWtzZSBzcGV0c2lmaWthdHNpb29uaSBhcmVuZGFtaXNla3NcclxuICAgICAgICBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIikgfHwgY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIik7XHJcblxyXG4gICAgfSBjYXRjaCAoZSkge31cclxuXHJcbiAgICBpZighZ2wpIHtcclxuICAgICAgICBhbGVydChcIlVuYWJsZSB0byBpbml0aWxpemUgV2ViR0wuIFlvdXIgYnJvd3NlciBtYXkgbm90IHN1cHBvcnQgaXQuXCIpO1xyXG4gICAgICAgIHRocm93IEVycm9yKFwiRXhlY3V0aW9uIHRlcm1pbmF0ZWQuIE5vIFdlYkdMIGNvbnRleHRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGdsO1xyXG59XHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gTEVTU09OMDggLSBWQUxHVVMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuLy9Lw7xzaW1lIHZlZWJpbGVoaXRzZWphbHQgc8O8Z2F2dXN0ZWtzdHV1cmkgbGFpZW5kdXN0XHJcbnZhciBleHREZXB0aCA9IEdMLmdldEV4dGVuc2lvbihcIldFQkdMX2RlcHRoX3RleHR1cmVcIikgfHxcclxuICAgICAgICAgICAgICAgR0wuZ2V0RXh0ZW5zaW9uKFwiV0VCR0tJVF9XRUJHTF9kZXB0aF90ZXh0dXJlXCIpfHxcclxuICAgICAgICAgICAgICAgR0wuZ2V0RXh0ZW5zaW9uKFwiTU9aX1dFQkdMX2RlcHRoX3RleHR1cmVcIik7XHJcbmlmKCFleHREZXB0aCkge1xyXG4gICAgYWxlcnQoXCJCcm93c2VyIGRvZXMgbm90IHN1cHBvcnQgZGVwdGggdGV4dHVyZSBleHRlbnNpb24uIFNlZSB3ZWJnbHJlcG9ydC5jb20gZm9yIG1vcmUgaW5mb3JtYXRpb24uXCIpO1xyXG4gICAgdGhyb3cgZXJyb3IoXCJObyBkZXB0aCB0ZXh0dXJlIGV4dGVuc2lvblwiKTtcclxufVxyXG5cclxudmFyIEFQUCA9IHt9O1xyXG5cclxuQVBQLmxvb3BlciA9IG5ldyBMb29wZXIoY2FudmFzLCBsb29wKTtcclxuXHJcbkFQUC5pc01vdXNlRG93biA9IGZhbHNlO1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIG1vdXNlQ2xpY2tIYW5kbGVyLCBmYWxzZSk7XHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG1vdXNlQ2xpY2tIYW5kbGVyLCBmYWxzZSk7XHJcblxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V3aGVlbFwiLCBtb3VzZVNjcm9sbEhhbmRsZXIsIGZhbHNlKTtcclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTU1vdXNlU2Nyb2xsXCIsIG1vdXNlU2Nyb2xsSGFuZGxlciwgZmFsc2UpO1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwib25tb3VzZXdoZWVsXCIsIG1vdXNlU2Nyb2xsSGFuZGxlciwgZmFsc2UpO1xyXG5cclxuLy9LT05TVEFORElEIEtBQU1FUkEgSkFPS1NcclxuXHJcbi8vMzYwIGtyYWFkaVxyXG5BUFAuVFdPUEkgPSAyLjAgKiBNYXRoLlBJO1xyXG5cclxuLy85MCBrcmFhZGlcclxuQVBQLlBJT1ZFUlRXTyA9IE1hdGguUEkgLyAyLjA7XHJcblxyXG4vL01ha3NpbWFhbG5lIHZlcnRpa2FhbG51cmtcclxuQVBQLk1BWF9WRVJUSUNBTCA9IEFQUC5QSU9WRVJUV08gLSBBUFAuUElPVkVSVFdPIC8gODtcclxuXHJcbi8vUmFhZGl1cywgbWlsbGVzdCBsw6RoZW1hbGUga2FhbWVyYSBtaW5uYSBlaSBzYWFcclxuQVBQLk1JTl9SQURJVVMgPSAxLjA7XHJcblxyXG4vL1N1dW1pbWlza29uc3RhbnRcclxuQVBQLlpPT01fVkFMVUUgPSAxLjA7XHJcblxyXG4vL0t1dHN1dGFrc2Uga3VpIHZhcmp1bmRhamFkIG9uIGxhZXR1ZFxyXG5mdW5jdGlvbiBzaGFkZXJzTG9hZGVkKCkge1xyXG4gICAgc2V0dXBBbmRMb2FkVGV4dHVyZSgpO1xyXG4gICAgc2V0dXBGcmFtZUJ1ZmZlcigpO1xyXG4gICAgc2V0dXAoKTtcclxuXHJcbiAgICBBUFAubG9vcGVyLmxvb3AoKTtcclxufVxyXG5cclxuLy9UZWtzdHV1cmkgaW5pdHNpYWxpc2VlcmltaW5lIGphIGxhYWRpbWluZVxyXG5mdW5jdGlvbiBzZXR1cEFuZExvYWRUZXh0dXJlKCkge1xyXG5cclxuICAgIC8vTG9vbWUgdXVlIHRla3N0dXVyaSBqYSBrb29zIHNlbGxlZ2EgMXgxIHBpa3NsaXNlIHBpbGRpLCBtaXMga3V2YXRha3NlIHNlbmlrYXVhLCBrdW5pIHRla3N0dXVyIHNhYWIgbGFldHVkXHJcbiAgICBBUFAudGV4dHVyZSA9IEdMLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIEFQUC50ZXh0dXJlKTtcclxuICAgIEdMLnRleEltYWdlMkQoR0wuVEVYVFVSRV8yRCwgMCwgR0wuUkdCQSwgMSwgMSwgMCwgR0wuUkdCQSwgIEdMLlVOU0lHTkVEX0JZVEUsIG5ldyBVaW50OEFycmF5KFsxLCAxLCAxLCAxXSkpO1xyXG4gICAgR0wudGV4UGFyYW1ldGVyZihHTC5URVhUVVJFXzJELCBHTC5URVhUVVJFX1dSQVBfUywgR0wuUkVQRUFUKTtcclxuICAgIEdMLnRleFBhcmFtZXRlcmYoR0wuVEVYVFVSRV8yRCwgR0wuVEVYVFVSRV9XUkFQX1QsIEdMLlJFUEVBVCk7XHJcbiAgICBHTC50ZXhQYXJhbWV0ZXJpKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgR0wuTkVBUkVTVCk7XHJcbiAgICBHTC50ZXhQYXJhbWV0ZXJpKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgR0wuTkVBUkVTVCk7XHJcblxyXG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XHJcblxyXG4gICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgQVBQLnRleHR1cmUpO1xyXG4gICAgICAgIEdMLnRleEltYWdlMkQoR0wuVEVYVFVSRV8yRCwgMCwgR0wuUkdCLCBHTC5SR0IsICBHTC5VTlNJR05FRF9CWVRFLCBpbWFnZSk7XHJcbiAgICAgICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICB9O1xyXG4gICAgaW1hZ2Uuc3JjID0gVEVYVFVSRV9QQVRIO1xyXG5cclxufVxyXG5cclxuLy9WYWxtaXN0YWJlIGV0dGUga2FhZHJpcHVodnJpLCBrdWh1IHN0c2VlbiByZW5kZXJkYWRhXHJcbmZ1bmN0aW9uIHNldHVwRnJhbWVCdWZmZXIoKSB7XHJcblxyXG4gICAgLy9Mb29tZSBrYWFkcmlwdWh2cmksIGt1aHUgc2FhbWUgcmVuZGVyZGFtaXNlIGrDpHJqZWtvcnJhcyBzdHNlZW5pIHJlbmRlcmRhZGEuXHJcbiAgICBBUFAuZnJhbWVCdWZmZXIgPSBHTC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xyXG4gICAgR0wuYmluZEZyYW1lYnVmZmVyKEdMLkZSQU1FQlVGRkVSLCBBUFAuZnJhbWVCdWZmZXIpO1xyXG4gICAgQVBQLmZyYW1lQnVmZmVyLndpZHRoID0gNTEyO1xyXG4gICAgQVBQLmZyYW1lQnVmZmVyLmhlaWdodCA9IDUxMjtcclxuXHJcbiAgICAvL0xvb21lIHbDpHJ2dXNwdWh2cmksIG1pcyBob2lhYiBwaWtzbGVpZFxyXG4gICAgQVBQLkZCQ29sb3JUZXh0dXJlID0gR0wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgQVBQLkZCQ29sb3JUZXh0dXJlKTtcclxuICAgIEdMLnRleEltYWdlMkQoR0wuVEVYVFVSRV8yRCwgMCwgR0wuUkdCQSwgQVBQLmZyYW1lQnVmZmVyLndpZHRoLCBBUFAuZnJhbWVCdWZmZXIuaGVpZ2h0LCAwLCBHTC5SR0JBLCBHTC5VTlNJR05FRF9CWVRFLCBudWxsKTtcclxuICAgIEdMLnRleFBhcmFtZXRlcmkoR0wuVEVYVFVSRV8yRCwgR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBHTC5MSU5FQVIpO1xyXG4gICAgR0wudGV4UGFyYW1ldGVyaShHTC5URVhUVVJFXzJELCBHTC5URVhUVVJFX01JTl9GSUxURVIsIEdMLkxJTkVBUl9NSVBNQVBfTkVBUkVTVCk7XHJcbiAgICBHTC5nZW5lcmF0ZU1pcG1hcChHTC5URVhUVVJFXzJEKTtcclxuXHJcbiAgICAvL0xvb21lIHPDvGdhdnVzcHVodnJpLCBtaXMgaG9pYWIgcGlrc2xpdGUgc8O8Z2F2dXNpXHJcbiAgICBBUFAuRkJEZXB0aEJ1ZmZlciA9IEdMLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xyXG4gICAgR0wuYmluZFJlbmRlcmJ1ZmZlcihHTC5SRU5ERVJCVUZGRVIsIEFQUC5GQkRlcHRoQnVmZmVyKTtcclxuICAgIEdMLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoR0wuUkVOREVSQlVGRkVSLCBHTC5ERVBUSF9DT01QT05FTlQxNiwgQVBQLmZyYW1lQnVmZmVyLndpZHRoLCBBUFAuZnJhbWVCdWZmZXIuaGVpZ2h0KTtcclxuXHJcbiAgICAvL1Nlb21lIHbDpHJ2aS0gamEgc8O8Z2F2dXNwdWh2cmkgYW50dWQga2FhZHJpcHVodnJpZ2FcclxuICAgIEdMLmZyYW1lYnVmZmVyVGV4dHVyZTJEKEdMLkZSQU1FQlVGRkVSLCBHTC5DT0xPUl9BVFRBQ0hNRU5UMCwgR0wuVEVYVFVSRV8yRCwgQVBQLkZCQ29sb3JUZXh0dXJlLCAwKTtcclxuICAgIEdMLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKEdMLkZSQU1FQlVGRkVSLCBHTC5ERVBUSF9BVFRBQ0hNRU5ULCBHTC5SRU5ERVJCVUZGRVIsIEFQUC5GQkRlcHRoQnVmZmVyKTtcclxuXHJcbiAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBudWxsKTtcclxuICAgIEdMLmJpbmRSZW5kZXJidWZmZXIoR0wuUkVOREVSQlVGRkVSLCBudWxsKTtcclxuICAgIEdMLmJpbmRGcmFtZWJ1ZmZlcihHTC5GUkFNRUJVRkZFUiwgbnVsbCk7XHJcbn1cclxuXHJcbi8vTG9vYiBwdWh2cmlkIGphIG1hYXRyaWtzaWQuIFTDpGlkYWIgcHVodnJpZCBhbmRtZXRlZ2EuXHJcbmZ1bmN0aW9uIHNldHVwKCkge1xyXG4gICAgLy9WYWxndXNhbGxpa2FzLCBtaWRhIGthc3V0YW1lIHN0c2VlbmkgcmVuZGVyZGFtaXNlbFxyXG4gICAgQVBQLmRpcmVjdGlvbmFsTGlnaHQgPSB7XHJcbiAgICAgICAgXCJjb2xvclwiOiBuZXcgRmxvYXQzMkFycmF5KFsxLjAsIDEuMCwgMS4wXSksXHJcbiAgICAgICAgXCJkaXJlY3Rpb25cIjogbmV3IEZsb2F0MzJBcnJheShbLTEuMCwgLTEuMCwgMS4wXSlcclxuICAgIH07XHJcblxyXG4gICAgLy9WYWxndXNhbGxpa2FzLCBtaWRhIGthc3V0YW1lIHRla3N0dXVyaSByZW5kZXJkYW1pc2VsXHJcbiAgICBBUFAudGV4dHVyZURpcmVjdGlvbmFsTGlnaHQgPSB7XHJcbiAgICAgICAgXCJjb2xvclwiOiBuZXcgRmxvYXQzMkFycmF5KFsxLjAsIDEuMCwgMC4wXSksXHJcbiAgICAgICAgXCJkaXJlY3Rpb25cIjogbmV3IEZsb2F0MzJBcnJheShbMS4wLCAwLjAsIDAuMF0pXHJcbiAgICB9O1xyXG5cclxuICAgIC8vTWF0ZXJqYWwsIG1pZGEga2FzdXRhbWUgbcO1bGVtYXMgcmVuZGVyZGFtaXNldGFwaXNcclxuICAgIEFQUC5tYXRlcmlhbCA9IHtcclxuICAgICAgICBcImFtYmllbnRDb2xvclwiOiBuZXcgRmxvYXQzMkFycmF5KFswLjMsIDAuMywgMC4zXSksXHJcbiAgICAgICAgXCJkaWZmdXNlQ29sb3JcIjogbmV3IEZsb2F0MzJBcnJheShbMC41LCAwLjUsIDAuNV0pLFxyXG4gICAgICAgIFwic3BlY3VsYXJDb2xvclwiOiBuZXcgRmxvYXQzMkFycmF5KFswLjcsIDAuNywgMC43XSksXHJcbiAgICAgICAgXCJzaGluaW5lc3NcIjogMTI4LjBcclxuICAgIH07XHJcblxyXG4gICAgLy9UZWVtZSBtdXV0dWphLCBrdWh1IHNhbHZlc3RhZGEgYWVnYSwgZXQga2FhbWVyYXQgYWphIG3DtsO2ZHVkZXMgw7xtYmVyIG9iamVrdGkgcMO2w7ZyYXRhXHJcbiAgICBBUFAudGltZSA9IDA7XHJcblxyXG4gICAgQVBQLmNhbWVyYVggPSAtMC43O1xyXG4gICAgQVBQLmNhbWVyYVkgPSAtMC43O1xyXG4gICAgQVBQLnJhZGl1cyA9IDU7XHJcblxyXG4gICAgLy9NdWRlbG1hYXRyaWtzLCBtaWxsZWdhIG9iamVrdGlydXVtaXN0IG1hYWlsbWFydXVtaSBzYWFkYVxyXG4gICAgQVBQLm1vZGVsTWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuXHJcbiAgICAvL011ZGVsbWFhdHJpa3MsIG1pZGEga2FzdXRhbWUgdGVrc3R1dXJpbGUgcmVuZGVyZGFtaXNla3NcclxuICAgIEFQUC50ZXh0dXJlTW9kZWxNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vUHVua3QsIGt1cyBvYmpla3QgaGV0a2VsIGFzdWJcclxuICAgIEFQUC5vYmplY3RBdCA9IFswLjAsIDAuMCwgLTUuMF07XHJcblxyXG4gICAgLy9LYXN1dGFkZXMgdHJhbnNsYXRzaW9vbmksIHNhYW1lIG11ZGVsbWFhdHJpa3NpZ2Egb2JqZWt0aSBsaWlndXRhZGFcclxuICAgIG1hdDQudHJhbnNsYXRlKEFQUC5tb2RlbE1hdHJpeCwgQVBQLm1vZGVsTWF0cml4LCBBUFAub2JqZWN0QXQpO1xyXG4gICAgbWF0NC50cmFuc2xhdGUoQVBQLnRleHR1cmVNb2RlbE1hdHJpeCwgQVBQLnRleHR1cmVNb2RlbE1hdHJpeCwgWzAuMCwgMC4wLCAtNC4wXSk7XHJcblxyXG4gICAgLy9LYWFtZXJhbWFhdHJpa3MsIG1pbGxlZ2EgbWFhaWxtYXJ1dW1pc3Qga2FhbWVyYXJ1dW1pIHNhYWRhXHJcbiAgICBBUFAudmlld01hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcblxyXG4gICAgLy9LYWFtZXJhbWFhdHJpa3MsIG1pZGEga2FzdXRhbWUgdGVrc3R1dXJpbGUgcmVuZGVyZGFtaXNla3NcclxuICAgIEFQUC50ZXh0dXJlVmlld01hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgICBtYXQ0Lmxvb2tBdChBUFAudGV4dHVyZVZpZXdNYXRyaXgsIFswLCAwLCAwXSwgWzAsIDAsIC01XSwgWzAsIDEsIDBdKTtcclxuXHJcbiAgICAvL0RlZmluZWVyaW1lIHZla3RvcmlkLCBtaWxsZSBhYmlsIG9uIHbDtWltYWxpayBrYWFtZXJhcnV1bWkgYmFhc3Zla3RvcmlkIGFydnV0YWRhXHJcbiAgICBBUFAuY2FtZXJhQXQgPSB2ZWMzLmNyZWF0ZSgpOyAgICAgICAgICAgIC8vQXN1YiBtYWFpbG1hcnV1bWlzIG5lbmRlbCBrb29yZGluYWF0aWRlbFxyXG4gICAgQVBQLmxvb2tBdCA9IHZlYzMuY3JlYXRlKCk7ICAgICAgICAgICAgIC8vTWlzIHN1dW5hcyBrYWFtZXJhIHZhYXRhYi4gUGFyZW1ha8OkZSBrb29yZGluYWF0c8O8c3RlZW1pcyBvbiAteiBla3JhYW5pIHNpc3NlXHJcbiAgICBBUFAudXAgPSB2ZWMzLmNyZWF0ZSgpOyAgICAgICAgICAgICAgICAgIC8vVmVrdG9yLCBtaXMgbsOkaXRhYiwga3VzIG9uIGthYW1lcmEgw7xsZXNzZSBzdXVuZGEgbsOkaXRhdiB2ZWt0b3JcclxuICAgIHVwZGF0ZUNhbWVyYSgpO1xyXG5cclxuICAgIC8vUHJvamVrdHNpb29uaW1hYXRyaWtzLCBldCBww7xnYW1pc3J1dW1pIHNhYWRhLiBLYXN1dGFkZXMgZ2xNYXRyaXggdGVla2kgZ2VuZXJlZXJpbWUga2EgcMO8cmFtaWlkaSwga3VodSBzaXNzZSBvYmpla3RpZCBsw6RoZXZhZC5cclxuICAgIEFQUC5wcm9qZWN0aW9uTWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuICAgIG1hdDQucGVyc3BlY3RpdmUoQVBQLnByb2plY3Rpb25NYXRyaXgsIDQ1LjAsIEdMLnZpZXdwb3J0V2lkdGggLyBHTC52aWV3cG9ydEhlaWdodCwgMS4wLCAxMDAwLjApO1xyXG5cclxuICAgIC8vUHJvamVrdHNpb29uaW1hYXRyaWtzLCBtaWRhIGthc3V0YW1lIHRla3N0dXVyaWxlIHJlbmRlcmRhbWlzZWtzXHJcbiAgICBBUFAudGV4dHVyZVByb2plY3Rpb25NYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG4gICAgbWF0NC5wZXJzcGVjdGl2ZShBUFAudGV4dHVyZVByb2plY3Rpb25NYXRyaXgsIDQ1LjAsIDEsIDAuMSwgMTAwLjApO1xyXG5cclxuICAgIC8vVGlwcHVkZSBhbmRtZWQuIFRpcHUga29vcmRpbmFhZGlkIHgsIHksIHosIE5vcm1hYWx2ZWt0b3JpIGtvb3JkaW5hYWlkIHgsIHksIHogamEgdGVrc3R1dXJpIGtvb3JkaW5hYWRpZCB1LCB2XHJcbiAgICBBUFAubXlWZXJ0aWNlc0RhdGEgPSBbXHJcbiAgICAgICAgLy9Fc2ltZW5lIGvDvGxnXHJcbiAgICAgICAgLTEuMCwgLTEuMCwgIDEuMCwgMC4wLCAwLjAsIDEuMCwgIDAuMCwgMS4wLCAgICAgICAgICAgIC8vQUxVTUlORSBWQVNBSyBOVVJLXHJcbiAgICAgICAgIDEuMCwgLTEuMCwgIDEuMCwgMC4wLCAwLjAsIDEuMCwgIDEuMCwgMS4wLCAgICAgICAgICAgIC8vQUxVTUlORSBQQVJFTSBOVVJLXHJcbiAgICAgICAgIDEuMCwgIDEuMCwgIDEuMCwgMC4wLCAwLjAsIDEuMCwgIDEuMCwgMC4wLCAgICAgICAgICAgIC8vw5xMRU1JTkUgUEFSRU0gTlVSS1xyXG4gICAgICAgIC0xLjAsICAxLjAsICAxLjAsIDAuMCwgMC4wLCAxLjAsICAwLjAsIDAuMCwgICAgICAgICAgICAvL8OcTEVNSU5FIFZBU0FLIE5VUktcclxuXHJcbiAgICAgICAgLy9UYWd1bWluZSBrw7xsZ1xyXG4gICAgICAgIC0xLjAsIC0xLjAsIC0xLjAsIDAuMCwgMC4wLCAtMS4wLCAwLjAsIDEuMCxcclxuICAgICAgICAtMS4wLCAgMS4wLCAtMS4wLCAwLjAsIDAuMCwgLTEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAgMS4wLCAtMS4wLCAwLjAsIDAuMCwgLTEuMCwgMS4wLCAwLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDAuMCwgLTEuMCwgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vw5xsZW1pbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAgMS4wLCAtMS4wLCAwLjAsIDEuMCwgMC4wLCAwLjAsIDEuMCxcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMS4wLCAwLjAsIDEuMCwgMC4wLCAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsICAxLjAsICAxLjAsIDAuMCwgMS4wLCAwLjAsIDEuMCwgMC4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgLTEuMCwgMC4wLCAxLjAsIDAuMCwgIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL0FsdW1pbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAtMS4wLCAwLjAsIC0xLjAsIDAuMCwgMC4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAtMS4wLCAwLjAsIC0xLjAsIDAuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAgMS4wLCAwLjAsIC0xLjAsIDAuMCwgIDEuMCwgMC4wLFxyXG4gICAgICAgIC0xLjAsIC0xLjAsICAxLjAsIDAuMCwgLTEuMCwgMC4wLCAwLjAsIDAuMCxcclxuXHJcbiAgICAgICAgLy9QYXJlbSBrw7xsZ1xyXG4gICAgICAgIDEuMCwgLTEuMCwgLTEuMCwgMS4wLCAwLjAsIDAuMCwgMC4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAgMS4wLCAtMS4wLCAxLjAsIDAuMCwgMC4wLCAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsICAxLjAsICAxLjAsIDEuMCwgMC4wLCAwLjAsICAxLjAsIDAuMCxcclxuICAgICAgICAxLjAsIC0xLjAsICAxLjAsIDEuMCwgMC4wLCAwLjAsIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL1Zhc2FrIGvDvGxnXHJcbiAgICAgICAgLTEuMCwgLTEuMCwgLTEuMCwgLTEuMCwgMC4wLCAwLjAsIDAuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsIC0xLjAsICAxLjAsIC0xLjAsIDAuMCwgMC4wLCAxLjAsIDEuMCxcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMS4wLCAtMS4wLCAwLjAsIDAuMCwgIDEuMCwgMC4wLFxyXG4gICAgICAgIC0xLjAsICAxLjAsIC0xLjAsIC0xLjAsIDAuMCwgMC4wLCAwLjAsIDAuMCxcclxuICAgIF07XHJcbiAgICBBUFAudmVydGV4U2l6ZSA9IDg7XHJcblxyXG4gICAgLy9Mb29tZSBwdWh2cmksIGt1aHUgdGlwdWFuZG1lZCB2aWlhLiBTZW9tZSBrYSBhbnR1ZCBwdWh2cmkga29udGVrc3RpZ2EsIGV0IHRlbWFsZSBrw6Rza2UgZWRhc2kgYW5kYVxyXG4gICAgQVBQLnZlcnRleEJ1ZmZlciA9IEdMLmNyZWF0ZUJ1ZmZlcigpO1xyXG5cclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuQVJSQVlfQlVGRkVSLCBBUFAudmVydGV4QnVmZmVyKTtcclxuXHJcbiAgICAvL0FubmFtZSBsb29kdWQgcHVodnJpbGUgYW5kbWVkXHJcbiAgICBHTC5idWZmZXJEYXRhKEdMLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShBUFAubXlWZXJ0aWNlc0RhdGEpLCBHTC5TVEFUSUNfRFJBVyk7XHJcblxyXG4gICAgLy9UaXBwdWRlIGluZGVrc2lkXHJcbiAgICBBUFAubXlJbmRpY2VzRGF0YSA9IFtcclxuICAgICAgICAwLCAxLCAyLCAgICAgIDAsIDIsIDMsICAgIC8vIEVzaW1lbmUga8O8bGdcclxuICAgICAgICA0LCA1LCA2LCAgICAgIDQsIDYsIDcsICAgIC8vIFRhZ3VtaW5lIGvDvGxnXHJcbiAgICAgICAgOCwgOSwgMTAsICAgICA4LCAxMCwgMTEsICAvLyDDnGxlbWluZSBrw7xsZ1xyXG4gICAgICAgIDEyLCAxMywgMTQsICAgMTIsIDE0LCAxNSwgLy8gQWx1bWluZSBrw7xsZ1xyXG4gICAgICAgIDE2LCAxNywgMTgsICAgMTYsIDE4LCAxOSwgLy8gUGFyZW0ga8O8bGdcclxuICAgICAgICAyMCwgMjEsIDIyLCAgIDIwLCAyMiwgMjMgIC8vIFZhc2FrIGvDvGxnXHJcbiAgICBdO1xyXG5cclxuICAgIC8vTG9vbWUgcHVodnJpLCBrdWh1IGluZGVrc2lkIHZpaWEuIFNlb21lIGthIGFudHVkIHB1aHZyaSBrb250ZWtzdGlnYSwgZXQgdGVtYWxlIGvDpHNrZSBlZGFzaSBhbmRhXHJcbiAgICBBUFAuaW5kZXhCdWZmZXIgPSBHTC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIEFQUC5pbmRleEJ1ZmZlci5udW1iZXJPZkluZGV4ZXMgPSAzNjtcclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIEFQUC5pbmRleEJ1ZmZlcik7XHJcblxyXG4gICAgLy9Bbm5hbWUgbG9vZHVkIHB1aHZyaWxlIGFuZG1lZFxyXG4gICAgR0wuYnVmZmVyRGF0YShHTC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IFVpbnQxNkFycmF5KEFQUC5teUluZGljZXNEYXRhKSwgR0wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgIC8vTcOkw6RyYW1lIHByb2dyYW1taSwgbWlkYSBtZSByZW5kZXJkYW1pc2VsIGthc3V0YWRhIHRhaGFtZVxyXG4gICAgR0wudXNlUHJvZ3JhbShzaGFkZXJQcm9ncmFtKTtcclxuXHJcbiAgICAvL1NhYW1lIGluZGVrc2ksIG1pcyBuw6RpdGFiIGt1cyBhc3ViIG1laWUgcHJvZ3JhbW1pcyBrYXN1dGF0YXZhcyB0aXB1dmFyanVuZGFqYXNcclxuICAgIC8vb2xldiB0aXB1YXRyaWJ1dXQgbmltZWdhIGFfVmVydGV4UG9zaXRpb25cclxuICAgIEFQUC5hX1Bvc2l0aW9uID0gR0wuZ2V0QXR0cmliTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJhX1Bvc2l0aW9uXCIpO1xyXG5cclxuICAgIC8vU2FhbWUgdGlwdSBub3JtYWFsdmVrdG9yaVxyXG4gICAgQVBQLmFfTm9ybWFsID0gR0wuZ2V0QXR0cmliTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJhX05vcm1hbFwiKTtcclxuXHJcbiAgICAvL1NhYW1lIHbDpHJ2aWF0cmlidXVkaSBhc3Vrb2hhXHJcbiAgICBBUFAuYV9UZXh0dXJlQ29vcmQgPSBHTC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcImFfVGV4dHVyZUNvb3JkXCIpO1xyXG5cclxuICAgIC8vU2FhbWUgw7xodHNldGUgbXV1dHVqYXRlIGFzdWtvaGFkXHJcbiAgICBBUFAudV9Nb2RlbE1hdHJpeCA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfTW9kZWxNYXRyaXhcIik7XHJcbiAgICBBUFAudV9WaWV3TWF0cml4ID0gR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9WaWV3TWF0cml4XCIpO1xyXG4gICAgQVBQLnVfUHJvamVjdGlvbk1hdHJpeCA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfUHJvamVjdGlvbk1hdHJpeFwiKTtcclxuICAgIEFQUC51X1RleHR1cmUgPSBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X1RleHR1cmVcIik7XHJcblxyXG4gICAgLy9WYWxndXNhbGxpa2Egw7xodHNldGUgbXV1dHVqYXRlIGFzdWtvaGFkXHJcbiAgICBBUFAudV9EaXJlY3Rpb25hbExpZ2h0ID0ge1xyXG4gICAgICAgIFwiY29sb3JcIjogR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9EaXJlY3Rpb25hbExpZ2h0Q29sb3JcIiksXHJcbiAgICAgICAgXCJkaXJlY3Rpb25cIjogR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9EaXJlY3Rpb25hbExpZ2h0RGlyZWN0aW9uXCIpXHJcbiAgICB9O1xyXG5cclxuICAgIC8vTWF0ZXJpYWxpIMO8aHRzZXRlIG11dXR1amF0ZSBhc3Vrb2hhZFxyXG4gICAgQVBQLnVfTWF0ZXJpYWwgPSB7XHJcbiAgICAgICAgXCJhbWJpZW50Q29sb3JcIjogR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9NYXRlcmlhbEFtYmllbnRDb2xvclwiKSxcclxuICAgICAgICBcImRpZmZ1c2VDb2xvclwiOiBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X01hdGVyaWFsRGlmZnVzZUNvbG9yXCIpLFxyXG4gICAgICAgIFwic3BlY3VsYXJDb2xvclwiOiBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X01hdGVyaWFsU3BlY3VsYXJDb2xvclwiKSxcclxuICAgICAgICBcInNoaW5pbmVzc1wiOiBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X01hdGVyaWFsU2hpbmluZXNzXCIpXHJcbiAgICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb3VzZUNsaWNrSGFuZGxlcigpIHtcclxuICAgIEFQUC5pc01vdXNlRG93biA9ICFBUFAuaXNNb3VzZURvd247XHJcblxyXG4gICAgaWYoQVBQLmlzTW91c2VEb3duKVxyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgbW91c2VNb3ZlLCBmYWxzZSk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBtb3VzZU1vdmUsIGZhbHNlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbW91c2VTY3JvbGxIYW5kbGVyKGUpIHtcclxuICAgIHZhciBkZWx0YSA9IDA7XHJcblxyXG4gICAgaWYoIWUpXHJcbiAgICAgICAgZSA9IHdpbmRvdy5ldmVudDtcclxuXHJcbiAgICBpZihlLndoZWVsRGVsdGEpICAgICAgICAgICAgICAgICAgICAvKiogSW50ZXJuZXQgRXhwbG9yZXIvT3BlcmEvR29vZ2xlIENocm9tZSAqKi9cclxuICAgICAgICBkZWx0YSA9IGUud2hlZWxEZWx0YSAvIDEyMDtcclxuXHJcbiAgICBlbHNlIGlmKGUuZGV0YWlsKSAgICAgICAgICAgICAgICAgICAvKiogTW96aWxsYSBGaXJlZm94ICoqL1xyXG4gICAgICAgIGRlbHRhID0gLWUuZGV0YWlsLzM7XHJcblxyXG4gICAgaWYoZGVsdGEpIHtcclxuICAgICAgICBpZihkZWx0YSA+IDAgJiYgQVBQLnJhZGl1cyA+IEFQUC5NSU5fUkFESVVTKVxyXG4gICAgICAgICAgICBBUFAucmFkaXVzIC09IEFQUC5aT09NX1ZBTFVFO1xyXG4gICAgICAgIGVsc2UgaWYoZGVsdGEgPCAwKVxyXG4gICAgICAgICAgICBBUFAucmFkaXVzICs9IEFQUC5aT09NX1ZBTFVFO1xyXG4gICAgfVxyXG5cclxuICAgICAgICBpZihlLnByZXZlbnREZWZhdWx0KVxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xyXG5cclxuICAgIHRvQ2Fub25pY2FsKCk7XHJcbiAgICB1cGRhdGVDYW1lcmEoKTtcclxufVxyXG5cclxuLy9IaWlyZSBhbGxob2lkbWlzZWwgamEgbGlpZ3V0YW1pc2VsIGvDpGl2aXR1YiBhbnR1ZCBmdW5rdHNpb29uXHJcbmZ1bmN0aW9uIG1vdXNlTW92ZShlKSB7XHJcbiAgICB2YXIgeCA9IGUud2Via2l0TW92ZW1lbnRYIHx8IGUubW96TW92ZW1lbnRYO1xyXG4gICAgdmFyIHkgPSBlLndlYmtpdE1vdmVtZW50WSB8fCBlLm1vek1vdmVtZW50WTtcclxuXHJcbiAgICBpZih0eXBlb2YgeCA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICB4ID0gMDtcclxuICAgIGlmKHR5cGVvZiB5ID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgIHkgPSAwO1xyXG5cclxuXHJcbiAgICBBUFAuY2FtZXJhWCArPSB4IC8gNTAwO1xyXG4gICAgQVBQLmNhbWVyYVkgKz0geSAvIDUwMDtcclxuXHJcbiAgICByZXN0cmljdENhbWVyYVkoKTtcclxuICAgIHRvQ2Fub25pY2FsKCk7XHJcblxyXG4gICAgdXBkYXRlQ2FtZXJhKCk7XHJcbn1cclxuXHJcbi8vRnVua3RzaW9vbiwgZXQgdmlpYSBob3Jpc29udGFhbG5lIGphIHZlcnRpa2FhbG5lIG51cmsga2Fub29uaWxpc3NlIHZvcm1pXHJcbi8vSW1wbGVtZW50ZWVyaXR1ZCAzRCBNYXRoIFByaW1lciBmb3IgR3JhcGhpY3MgYW5kIEdhbWUgRGV2ZWxvcG1lbnQganVoZW5kaSBqw6RyZ2lcclxuZnVuY3Rpb24gdG9DYW5vbmljYWwoKSB7XHJcblxyXG4gICAgLy9LdWkgb2xlbWUgMCBrb29yZGluYWF0aWRlbFxyXG4gICAgaWYoQVBQLnJhZGl1cyA9PSAwLjApIHtcclxuICAgICAgICBBUFAuY2FtZXJhWCA9IEFQUC5jYW1lcmFZID0gMC4wO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgIC8vS3VpIHJhYWRpdXMgb24gbmVnYXRpaXZuZS5cclxuICAgICAgICBpZihBUFAucmFkaXVzIDwgMC4wKSB7XHJcbiAgICAgICAgICAgIEFQUC5yYWRpdXMgPSAtQVBQLnJhZGl1cztcclxuICAgICAgICAgICAgQVBQLmNhbWVyYVggKz0gTWF0aC5QSTtcclxuICAgICAgICAgICAgQVBQLmNhbWVyYVkgPSAtQVBQLmNhbWVyYVk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL1ZlcnRpa2FhbG5lIG51cmsgw7xsZW1pc2VzdCBwaWlyaXN0IHbDpGxqYVxyXG4gICAgICAgIGlmKE1hdGguYWJzKEFQUC5jYW1lcmFZKSA+IEFQUC5QSU9WRVJUV08pIHtcclxuXHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFZICs9IEFQUC5QSU9WRVJUV087XHJcblxyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWSAtPSBNYXRoLmZsb29yKEFQUC5jYW1lcmFZIC8gQVBQLlRXT1BJKSAqIEFQUC5UV09QSTtcclxuXHJcbiAgICAgICAgICAgIGlmKEFQUC5jYW1lcmFZID4gTWF0aC5QSSkge1xyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVggKz0gTWF0aC5QSTtcclxuXHJcbiAgICAgICAgICAgICAgICBBUFAuY2FtZXJhWSA9IDMuMCAqIE1hdGguUEkvMi4wIC0gQVBQLmNhbWVyYVk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBBUFAuY2FtZXJhWSAtPSBBUFAuUElPVkVSVFdPO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL0dJTUJBTCBMT0NLXHJcbiAgICAgICAgaWYoTWF0aC5hYnMoQVBQLmNhbWVyYVkpID49IEFQUC5QSU9WRVJUV08gKiAwLjk5OTkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJHSU1CQUxMT0NLXCIpO1xyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWCA9IDAuMDtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYoTWF0aC5hYnMoQVBQLmNhbWVyYVgpID4gTWF0aC5QSSkge1xyXG5cclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFYICs9IE1hdGguUEk7XHJcblxyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVggLT0gTWF0aC5mbG9vcihBUFAuY2FtZXJhWCAvIEFQUC5UV09QSSkgKiBBUFAuVFdPUEk7XHJcblxyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVggLT0gTWF0aC5QSTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlc3RyaWN0Q2FtZXJhWSgpIHtcclxuICAgIGlmKE1hdGguYWJzKEFQUC5jYW1lcmFZKSA+IEFQUC5NQVhfVkVSVElDQUwpIHtcclxuICAgICAgICBpZihBUFAuY2FtZXJhWSA8IDApXHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFZID0gLUFQUC5NQVhfVkVSVElDQUw7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWSA9IEFQUC5NQVhfVkVSVElDQUw7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vS3V0c3V0YWtzZSB2w6RsamEgTG9vcGVyIG9iamVrdGlzIGlnYSBrYWFkZXJcclxuZnVuY3Rpb24gbG9vcChkZWx0YVRpbWUpIHtcclxuICAgIHVwZGF0ZShkZWx0YVRpbWUpO1xyXG5cclxuICAgIC8vTcOkw6RyYW1lIGthYWRyaXB1aHZyaWtzIG1laWUgZW5kYSBsb29kdWQga2FhZHJpcHVodnJpXHJcbiAgICBHTC5iaW5kRnJhbWVidWZmZXIoR0wuRlJBTUVCVUZGRVIsIEFQUC5mcmFtZUJ1ZmZlcik7XHJcblxyXG4gICAgLy9SZW5kZXJkYW1lIHN0c2VlbmkgdGVrc3R1dXJpbGVcclxuICAgIHJlbmRlclRvVGV4dHVyZSgpO1xyXG5cclxuICAgIC8vU2VvbWUgbGFodGkgZWVsbWlzZSBrYWFkcmlwdWh2cmkuIFDDpHJhc3Qgc2VkYSBvbiBrYXN1dHVzZWwgdGF2YWxpbmUgcHVodmVyLCBtaWRhIGthc3V0YXRha3NlIGNhbnZhcyBlbGVtZW5kaSBqYW9rcy5cclxuICAgIEdMLmJpbmRGcmFtZWJ1ZmZlcihHTC5GUkFNRUJVRkZFUiwgbnVsbCk7XHJcblxyXG4gICAgcmVuZGVyKCk7XHJcbn1cclxuXHJcbi8vVXVlbmRhYiBhbmRtZWlkLCBldCBvbGVrcyB2w7VpbWFsaWsgc3RzZWVuIGxpaWt1bWEgcGFubmFcclxuZnVuY3Rpb24gdXBkYXRlKGRlbHRhVGltZSkge1xyXG4gICAgQVBQLnRpbWUgKz0gZGVsdGFUaW1lIC8gMTAwO1xyXG5cclxuICAgdXBkYXRlT2JqZWN0KCk7XHJcbn1cclxuXHJcbi8vVXVlbmRhYiBrYWFtZXJhdCwgZXQgc2VkYSBvbGVrcyB2w7VpbWFsaWsgw7xtYmVyIG9iamVrdGkgcMO2w7ZyYXRhXHJcbmZ1bmN0aW9uIHVwZGF0ZUNhbWVyYSgpIHtcclxuXHJcbiAgICAvL0xlaWFtZSB1dWUgcG9zaXRzaW9vbmksIG1pcyBhamFzIGxpaWd1YiBwb2xhYXJzZXMga29vcmRpbmFhdHPDvHN0ZWVtaXMgamEgbWlsbGUgdGVpc2VuZGFtZSByaXN0a29vcmRpbmFhdHPDvHN0ZWVtaVxyXG4gICAgQVBQLmNhbWVyYUF0ID0gW0FQUC5vYmplY3RBdFswXSArIEFQUC5yYWRpdXMgKiBNYXRoLmNvcyhBUFAuY2FtZXJhWSkgKiBNYXRoLnNpbihBUFAuY2FtZXJhWCksICAgICAgIC8vIFhcclxuICAgICAgICAgICAgICAgICAgICAgQVBQLm9iamVjdEF0WzFdICsgQVBQLnJhZGl1cyAqIC1NYXRoLnNpbihBUFAuY2FtZXJhWSksICAgICAgICAgICAgICAgICAgICAgLy8gWVxyXG4gICAgICAgICAgICAgICAgICAgICBBUFAub2JqZWN0QXRbMl0gKyBBUFAucmFkaXVzICogTWF0aC5jb3MoQVBQLmNhbWVyYVkpICogTWF0aC5jb3MoQVBQLmNhbWVyYVgpXTsgICAgIC8vIFpcclxuXHJcblxyXG4gICAgLy9MZWlhbWUgc3V1bmF2ZWt0b3JpLCBrYWFtZXJhc3Qgb2JqZWt0aW5pXHJcbiAgICBBUFAubG9va0RpcmVjdGlvbiA9IFtBUFAub2JqZWN0QXRbMF0gLSBBUFAuY2FtZXJhQXRbMF0sICAgICAgICAgICAgICAgLy8gWFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgQVBQLm9iamVjdEF0WzFdIC0gQVBQLmNhbWVyYUF0WzFdLCAgICAgICAgICAgICAgIC8vIFlcclxuICAgICAgICAgICAgICAgICAgICAgICAgIEFQUC5vYmplY3RBdFsyXSAtIEFQUC5jYW1lcmFBdFsyXV07ICAgICAgICAgICAgICAvLyBaXHJcblxyXG4gICAgLy9MZWlhbWUgcHVua3RpLCBtaWRhIGthYW1lcmEgdmFhdGFiXHJcbiAgICB2ZWMzLmFkZChBUFAubG9va0F0LCBBUFAuY2FtZXJhQXQsIEFQUC5sb29rRGlyZWN0aW9uKTtcclxuXHJcbiAgICBBUFAucmlnaHQgPSBbXHJcbiAgICAgICAgTWF0aC5zaW4oQVBQLmNhbWVyYVggLSBNYXRoLlBJIC8gMiksXHJcbiAgICAgICAgMCxcclxuICAgICAgICBNYXRoLmNvcyhBUFAuY2FtZXJhWCAtIE1hdGguUEkgLyAyKVxyXG4gICAgXTtcclxuXHJcbiAgICB2ZWMzLm5vcm1hbGl6ZShBUFAucmlnaHQsIEFQUC5yaWdodCk7XHJcbiAgICB2ZWMzLm5vcm1hbGl6ZShBUFAubG9va0RpcmVjdGlvbiwgQVBQLmxvb2tEaXJlY3Rpb24pO1xyXG4gICAgdmVjMy5jcm9zcyhBUFAudXAsIEFQUC5sb29rRGlyZWN0aW9uLCBBUFAucmlnaHQpO1xyXG5cclxuICAgIC8vVXVlbmRhbWUga2FhbWVyYW1hYXRyaWtzaXRcclxuICAgIG1hdDQubG9va0F0KEFQUC52aWV3TWF0cml4LCBBUFAuY2FtZXJhQXQsIEFQUC5sb29rQXQsIEFQUC51cCk7XHJcblxyXG5cclxufVxyXG5cclxuLy91dWVuZGFtZSBvYmpla3RpXHJcbmZ1bmN0aW9uIHVwZGF0ZU9iamVjdCgpIHtcclxuICAgIG1hdDQucm90YXRlWShBUFAudGV4dHVyZU1vZGVsTWF0cml4LCBBUFAudGV4dHVyZU1vZGVsTWF0cml4LCAwLjAwNSk7XHJcbn1cclxuXHJcbi8vTcOkw6RyYW1lIHZhbGd1c2FydnV0dXN0ZSBqYW9rcyDDvGh0c2VkIG11dXR1amFkXHJcbmZ1bmN0aW9uIHNldE1hdGVyaWFsVW5pZm9ybXMoKSB7XHJcblxyXG4gICAgLy9PYmpla3RpIG1hdGVyamFsaSBtdXV0dWphZFxyXG4gICAgR0wudW5pZm9ybTNmdihBUFAudV9NYXRlcmlhbC5hbWJpZW50Q29sb3IsIEFQUC5tYXRlcmlhbC5hbWJpZW50Q29sb3IpO1xyXG4gICAgR0wudW5pZm9ybTNmdihBUFAudV9NYXRlcmlhbC5kaWZmdXNlQ29sb3IsIEFQUC5tYXRlcmlhbC5kaWZmdXNlQ29sb3IpO1xyXG4gICAgR0wudW5pZm9ybTNmdihBUFAudV9NYXRlcmlhbC5zcGVjdWxhckNvbG9yLCBBUFAubWF0ZXJpYWwuc3BlY3VsYXJDb2xvcik7XHJcbiAgICBHTC51bmlmb3JtMWYoQVBQLnVfTWF0ZXJpYWwuc2hpbmluZXNzLCBBUFAubWF0ZXJpYWwuc2hpbmluZXNzKTtcclxufVxyXG5cclxuXHJcbi8vUmVuZGVyZGFtZSB0ZWtzdHV1cmlsZVxyXG5mdW5jdGlvbiByZW5kZXJUb1RleHR1cmUoKSB7XHJcbiAgICBHTC52aWV3cG9ydCgwLCAwLCBBUFAuZnJhbWVCdWZmZXIud2lkdGgsIEFQUC5mcmFtZUJ1ZmZlci5oZWlnaHQpO1xyXG4gICAgR0wuY2xlYXJDb2xvcigxLjAsIDEuMCwgMS4wLCAxLjApO1xyXG4gICAgR0wuY2xlYXIoR0wuQ09MT1JfQlVGRkVSX0JJVCB8IEdMLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgIC8vTMO8bGl0YW1lIHNpc3NlIHPDvGdhdnVzdGVzdGlcclxuICAgIEdMLmVuYWJsZShHTC5ERVBUSF9URVNUKTtcclxuICAgIEdMLmRlcHRoRnVuYyhHTC5MRVNTKTtcclxuXHJcbiAgICAvL1Nlb21lIHRpcHVwdWh2cmkgamEgbcOkw6RyYW1lLCBrdXMgYW50dWQgdGlwdWF0cmlidXV0IGFzdWIgYW50dWQgbWFzc2lpdmlzLlxyXG4gICAgR0wuYmluZEJ1ZmZlcihHTC5BUlJBWV9CVUZGRVIsIEFQUC52ZXJ0ZXhCdWZmZXIpO1xyXG4gICAgR0wudmVydGV4QXR0cmliUG9pbnRlcihBUFAuYV9Qb3NpdGlvbiwgMywgR0wuRkxPQVQsIGZhbHNlLCBBUFAudmVydGV4U2l6ZSAqIDQsIDApO1xyXG4gICAgR0wudmVydGV4QXR0cmliUG9pbnRlcihBUFAuYV9Ob3JtYWwsIDMsIEdMLkZMT0FULCBmYWxzZSwgQVBQLnZlcnRleFNpemUgKiA0LCAzICogNCk7XHJcbiAgICBHTC52ZXJ0ZXhBdHRyaWJQb2ludGVyKEFQUC5hX1RleHR1cmVDb29yZCwgMiwgR0wuRkxPQVQsIGZhbHNlLCBBUFAudmVydGV4U2l6ZSAqIDQsIEFQUC52ZXJ0ZXhTaXplICogNCAtIDIgKiA0KTtcclxuXHJcbiAgICAvL0FrdGl2ZWVyaW1lIGF0cmlidXVkaWRcclxuICAgIEdMLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KEFQUC5hX1Bvc2l0aW9uKTtcclxuICAgIEdMLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KEFQUC5hX05vcm1hbCk7XHJcbiAgICBHTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShBUFAuYV9UZXh0dXJlQ29vcmQpO1xyXG5cclxuICAgIC8vQWt0aXZlZXJpbWUgamEgbcOkw6RyYW1lIHRla3N0dXVyaVxyXG4gICAgR0wuYWN0aXZlVGV4dHVyZShHTC5URVhUVVJFMCk7XHJcbiAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBBUFAudGV4dHVyZSk7XHJcbiAgICBHTC51bmlmb3JtMWkoQVBQLnVfVGV4dHVyZSwgMCk7XHJcblxyXG4gICAgc2V0TWF0ZXJpYWxVbmlmb3JtcygpO1xyXG5cclxuICAgIC8vVmFsZ3VzYWxsaWthIG11dXR1amFkXHJcbiAgICBHTC51bmlmb3JtM2Z2KEFQUC51X0RpcmVjdGlvbmFsTGlnaHQuY29sb3IsIEFQUC50ZXh0dXJlRGlyZWN0aW9uYWxMaWdodC5jb2xvcik7XHJcbiAgICBHTC51bmlmb3JtM2Z2KEFQUC51X0RpcmVjdGlvbmFsTGlnaHQuZGlyZWN0aW9uLCBBUFAudGV4dHVyZURpcmVjdGlvbmFsTGlnaHQuZGlyZWN0aW9uKTtcclxuXHJcbiAgICAvL1NhYWRhbWUgbWVpZSB0ZWtzdHV1cmkgbWFhdHJpa3NpZCBrYSB2YXJqdW5kYWphc3NlXHJcbiAgICBHTC51bmlmb3JtTWF0cml4NGZ2KEFQUC51X01vZGVsTWF0cml4LCBmYWxzZSwgQVBQLnRleHR1cmVNb2RlbE1hdHJpeCk7XHJcbiAgICBHTC51bmlmb3JtTWF0cml4NGZ2KEFQUC51X1ZpZXdNYXRyaXgsIGZhbHNlLCBBUFAudGV4dHVyZVZpZXdNYXRyaXgpO1xyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9Qcm9qZWN0aW9uTWF0cml4LCBmYWxzZSwgQVBQLnRleHR1cmVQcm9qZWN0aW9uTWF0cml4KTtcclxuXHJcbiAgICAvL1JlbmRlcmRhbWUga29sbW51cmdhZCBpbmRla3NpdGUgasOkcmdpXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBBUFAuaW5kZXhCdWZmZXIpO1xyXG4gICAgR0wuZHJhd0VsZW1lbnRzKEdMLlRSSUFOR0xFUywgQVBQLmluZGV4QnVmZmVyLm51bWJlck9mSW5kZXhlcywgR0wuVU5TSUdORURfU0hPUlQsIDApO1xyXG5cclxuICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIEFQUC5GQkNvbG9yVGV4dHVyZSk7XHJcbiAgICBHTC5nZW5lcmF0ZU1pcG1hcChHTC5URVhUVVJFXzJEKTtcclxuICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIG51bGwpO1xyXG5cclxufVxyXG5cclxuLy9SZW5kZXJkYW1pbmVcclxuZnVuY3Rpb24gcmVuZGVyKCkge1xyXG5cclxuICAgIC8vUHVoYXN0YW1lIGthIHbDpHJ2aS0gamEgc8O8Z2F2dXNwdWh2cmlkLCBuaW5nIG3DpMOkcmFtZSB1dWUgcHVoYXN0dXbDpHJ2dXNlLlxyXG4gICAgLy9IZXRrZWwgcHVoYXN0YW1pbmUgbWlkYWdpIGVpIHRlZSwgc2VzdCBtZSByZW5kZXJkYW1lIHZhaWQgw7xoZSBrb3JyYSwga3VpZCBrdWkgbWUgdHPDvGtrbGlzIHNlZGEgdGVnZW1hXHJcbiAgICAvL29uIG7DpGhhIGthLCBtaWRhIG5hZCB0ZWV2YWQuXHJcbiAgICBHTC52aWV3cG9ydCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG4gICAgR0wuY2xlYXJDb2xvcigwLjAsIDAuMCwgMC4wLCAxLjApO1xyXG4gICAgR0wuY2xlYXIoR0wuQ09MT1JfQlVGRkVSX0JJVCB8IEdMLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgIC8vTMO8bGl0YW1lIHNpc3NlIHPDvGdhdnVzdGVzdGlcclxuICAgIEdMLmVuYWJsZShHTC5ERVBUSF9URVNUKTtcclxuICAgIEdMLmRlcHRoRnVuYyhHTC5MRVNTKTtcclxuXHJcbiAgICAvL1Nlb21lIHRpcHVwdWh2cmkgamEgbcOkw6RyYW1lLCBrdXMgYW50dWQgdGlwdWF0cmlidXV0IGFzdWIgYW50dWQgbWFzc2lpdmlzLlxyXG4gICAgR0wuYmluZEJ1ZmZlcihHTC5BUlJBWV9CVUZGRVIsIEFQUC52ZXJ0ZXhCdWZmZXIpO1xyXG4gICAgR0wudmVydGV4QXR0cmliUG9pbnRlcihBUFAuYV9Qb3NpdGlvbiwgMywgR0wuRkxPQVQsIGZhbHNlLCBBUFAudmVydGV4U2l6ZSAqIDQsIDApO1xyXG4gICAgR0wudmVydGV4QXR0cmliUG9pbnRlcihBUFAuYV9UZXh0dXJlQ29vcmQsIDIsIEdMLkZMT0FULCBmYWxzZSwgQVBQLnZlcnRleFNpemUgKiA0LCBBUFAudmVydGV4U2l6ZSAqIDQgLSAyICogNCk7XHJcblxyXG4gICAgLy9Ba3RpdmVlcmltZSBhdHJpYnV1ZGlkXHJcbiAgICBHTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShBUFAuYV9Qb3NpdGlvbik7XHJcbiAgICBHTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShBUFAuYV9UZXh0dXJlQ29vcmQpO1xyXG5cclxuICAgIC8vQWt0aXZlZXJpbWUgamEgbcOkw6RyYW1lIHRla3N0dXVyaVxyXG4gICAgR0wuYWN0aXZlVGV4dHVyZShHTC5URVhUVVJFMCk7XHJcbiAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBBUFAuRkJDb2xvclRleHR1cmUpO1xyXG4gICAgR0wudW5pZm9ybTFpKEFQUC51X1RleHR1cmUsIDApO1xyXG5cclxuICAgIHNldE1hdGVyaWFsVW5pZm9ybXMoKTtcclxuXHJcbiAgICAvL1ZhbGd1c2FsbGlrYSBtdXV0dWphZFxyXG4gICAgR0wudW5pZm9ybTNmdihBUFAudV9EaXJlY3Rpb25hbExpZ2h0LmNvbG9yLCBBUFAuZGlyZWN0aW9uYWxMaWdodC5jb2xvcik7XHJcbiAgICBHTC51bmlmb3JtM2Z2KEFQUC51X0RpcmVjdGlvbmFsTGlnaHQuZGlyZWN0aW9uLCBBUFAuZGlyZWN0aW9uYWxMaWdodC5kaXJlY3Rpb24pO1xyXG5cclxuICAgIC8vU2FhZGFtZSBtZWllIG1hYXRyaWtzaWQga2EgdmFyanVuZGFqYXNzZVxyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9Nb2RlbE1hdHJpeCwgZmFsc2UsIEFQUC5tb2RlbE1hdHJpeCk7XHJcbiAgICBHTC51bmlmb3JtTWF0cml4NGZ2KEFQUC51X1ZpZXdNYXRyaXgsIGZhbHNlLCBBUFAudmlld01hdHJpeCk7XHJcbiAgICBHTC51bmlmb3JtTWF0cml4NGZ2KEFQUC51X1Byb2plY3Rpb25NYXRyaXgsIGZhbHNlLCBBUFAucHJvamVjdGlvbk1hdHJpeCk7XHJcblxyXG4gICAgLy9SZW5kZXJkYW1lIGtvbG1udXJnYWQgaW5kZWtzaXRlIGrDpHJnaVxyXG4gICAgR0wuYmluZEJ1ZmZlcihHTC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgQVBQLmluZGV4QnVmZmVyKTtcclxuICAgIEdMLmRyYXdFbGVtZW50cyhHTC5UUklBTkdMRVMsIEFQUC5pbmRleEJ1ZmZlci5udW1iZXJPZkluZGV4ZXMsIEdMLlVOU0lHTkVEX1NIT1JULCAwKTtcclxufVxyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vICAgTMOVUFAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuIiwiTG9vcGVyID0gZnVuY3Rpb24oZG9tRWxlbWVudCwgY2FsbGJhY2spIHtcclxuICAgIHRoaXMuZG9tRWxlbWVudCA9IGRvbUVsZW1lbnQ7XHJcblxyXG4gICAgdGhpcy5sYXN0VGltZSA9IDA7XHJcbiAgICB0aGlzLmRlbHRhVGltZSA9IDA7XHJcblxyXG4gICAgdGhpcy5yZXF1ZXN0SWQ7XHJcblxyXG4gICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xyXG5cclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuICAgICAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZTtcclxuXHJcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lO1xyXG59O1xyXG5cclxuTG9vcGVyLnByb3RvdHlwZSA9IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcjogTG9vcGVyLFxyXG5cclxuICAgIGNhbGN1bGF0ZURlbHRhVGltZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHRpbWVOb3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHJcbiAgICAgICAgaWYodGhpcy5sYXN0VGltZSAhPSAwKVxyXG4gICAgICAgICAgICB0aGlzLmRlbHRhVGltZSA9ICh0aW1lTm93IC0gdGhpcy5sYXN0VGltZSkgLyAxNjtcclxuXHJcbiAgICAgICAgdGhpcy5sYXN0VGltZSA9IHRpbWVOb3c7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvb3A6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMucmVxdWVzdElkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMubG9vcC5iaW5kKHRoaXMpLCB0aGlzLmRvbUVsZW1lbnQpO1xyXG5cclxuICAgICAgICB0aGlzLmNhbGN1bGF0ZURlbHRhVGltZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMuZGVsdGFUaW1lKTtcclxuICAgIH1cclxuXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExvb3BlcjsiLCIvKipcclxuICogSG9pYWIgZW5kYXMgV2ViR0xQcm9ncmFtIG9iamVrdGkgamEgV2ViR0xTaGFkZXIgdGlwdXZhcmp1bmRhamF0IGphIHBpa3NsaXZhcmp1bmRhamF0XHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJ0ZXhTaGFkZXJQYXRoXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmcmFnbWVudFNoYWRlclBhdGhcclxuICogQHBhcmFtIHtmdW5jdGlvbn0gb25MaW5rZWQgTWVldG9kLCBtaXMga3V0c3V0YWtzZSB2w6RsamEsIGt1aSB2YXJqdW5kYWphZCBvbiBsYWV0dWRcclxuICogQGNsYXNzXHJcbiAqL1xyXG52YXIgUHJvZ3JhbU9iamVjdCA9IGZ1bmN0aW9uKHZlcnRleFNoYWRlclBhdGgsIGZyYWdtZW50U2hhZGVyUGF0aCwgb25MaW5rZWQpIHtcclxuICAgIHRoaXMucHJvZ3JhbSA9IEdMLmNyZWF0ZVByb2dyYW0oKTtcclxuXHJcbiAgICB0aGlzLm9uTGlua2VkID0gb25MaW5rZWQ7XHJcblxyXG4gICAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB7XHJcbiAgICAgICAgXCJzaGFkZXJcIjogR0wuY3JlYXRlU2hhZGVyKEdMLlZFUlRFWF9TSEFERVIpLFxyXG4gICAgICAgIFwicGF0aFwiOiB2ZXJ0ZXhTaGFkZXJQYXRoLFxyXG4gICAgICAgIFwic3JjXCI6IFwiXCIsXHJcbiAgICAgICAgXCJjb21wbGV0ZWRcIjogZmFsc2VcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHtcclxuICAgICAgICBcInNoYWRlclwiOiBHTC5jcmVhdGVTaGFkZXIoR0wuRlJBR01FTlRfU0hBREVSKSxcclxuICAgICAgICBcInBhdGhcIjogZnJhZ21lbnRTaGFkZXJQYXRoLFxyXG4gICAgICAgIFwic3JjXCI6IFwiXCIsXHJcbiAgICAgICAgXCJjb21wbGV0ZWRcIjogZmFsc2VcclxuICAgIH07XHJcbn07XHJcblxyXG5Qcm9ncmFtT2JqZWN0LnByb3RvdHlwZSA9IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcjogUHJvZ3JhbU9iamVjdCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxiYWNrIG1lZXRvZCwgbWlzIGtvbXBpbGVlcmliIGphIHPDpHRlc3RhYiB2YXJqdW5kYWphZCwga3VpIG3DtWxlbWFkIG9uIGFzw7xua3Jvb25zZWx0IGxhZXR1ZFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcmMgTMOkaHRla29vZCwgbWlzIEFKQVgnaSBhYmlsIGxhZXRpXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUZWUsIG1pbGxlIGFiaWwgdHV2YXN0YWRhLCBrdW1tYSB2YXJqdW5kYWphIGzDpGh0ZWtvb2Qgb24gbGFldHVkXHJcbiAgICAgKi9cclxuICAgIG9uY29tcGxldGU6IGZ1bmN0aW9uKHNyYywgcGF0aCkge1xyXG4gICAgICAgIGlmKHBhdGggPT09IHRoaXMudmVydGV4U2hhZGVyLnBhdGgpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhTaGFkZXIuY29tcGxldGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhTaGFkZXIuc3JjID0gc3JjO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKHBhdGggPT09IHRoaXMuZnJhZ21lbnRTaGFkZXIucGF0aCkge1xyXG4gICAgICAgICAgICB0aGlzLmZyYWdtZW50U2hhZGVyLmNvbXBsZXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIuc3JjID0gc3JjO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodGhpcy52ZXJ0ZXhTaGFkZXIuY29tcGxldGVkICYmIHRoaXMuZnJhZ21lbnRTaGFkZXIuY29tcGxldGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZVNoYWRlcih0aGlzLnZlcnRleFNoYWRlci5zaGFkZXIsIHRoaXMudmVydGV4U2hhZGVyLnNyYyk7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZVNoYWRlcih0aGlzLmZyYWdtZW50U2hhZGVyLnNoYWRlciwgdGhpcy5mcmFnbWVudFNoYWRlci5zcmMpO1xyXG5cclxuICAgICAgICAgICAgR0wuYXR0YWNoU2hhZGVyKHRoaXMucHJvZ3JhbSwgdGhpcy52ZXJ0ZXhTaGFkZXIuc2hhZGVyKTtcclxuICAgICAgICAgICAgR0wuYXR0YWNoU2hhZGVyKHRoaXMucHJvZ3JhbSwgdGhpcy5mcmFnbWVudFNoYWRlci5zaGFkZXIpO1xyXG5cclxuICAgICAgICAgICAgR0wubGlua1Byb2dyYW0odGhpcy5wcm9ncmFtKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCFHTC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMucHJvZ3JhbSwgR0wuTElOS19TVEFUVVMpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVycm9yIGxpbmtpbmcgc2hhZGVyIHByb2dyYW06IFxcXCJcIiArIEdMLmdldFByb2dyYW1JbmZvTG9nKHRoaXMucHJvZ3JhbSkgKyBcIlxcXCJcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmKHR5cGVvZiB0aGlzLm9uTGlua2VkICE9IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uTGlua2VkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIMOccml0YWIga29tcGlsZWVyaWRhIHZhcmp1bmRhamFcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1dlYkdMU2hhZGVyfSBzaGFkZXIgVmFyanVuZGFqYSBtaWRhIGtvbXBpbGVlcmlkYVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSBMw6RodGVrb29kLCBtaWRhIGtvbXBpbGVlcmlkYVxyXG4gICAgICovXHJcbiAgICBjb21waWxlU2hhZGVyOiBmdW5jdGlvbihzaGFkZXIsIHNvdXJjZSkge1xyXG4gICAgICAgIEdMLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XHJcbiAgICAgICAgR0wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xyXG5cclxuICAgICAgICBpZiAoIUdMLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIEdMLkNPTVBJTEVfU1RBVFVTKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIlNoYWRlciBjb21waWxhdGlvbiBmYWlsZWQuIEVycm9yOiBcXFwiXCIgKyBHTC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikgKyBcIlxcXCJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFudHVkIGtsYXNzaSBhYmlsIG9uIHbDtWltYWxpayBwcm9ncmFtbWkgbGFhZGlkYSBqYSBhc8O8bmtyb29uc2VsdCB0YWdhcGlsZGlsIHNwZXRzaWZpdHNlZXJpdHVkIHZhcmp1bmRhamFkXHJcbiAqIHRhZ2FzdGF0dWQgcHJvZ3JhbW1pZ2Egc2lkdWRhXHJcbiAqXHJcbiAqIEBjbGFzcyBTaGFkZXJQcm9ncmFtTG9hZGVyXHJcbiAqL1xyXG52YXIgU2hhZGVyUHJvZ3JhbUxvYWRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5jb250YWluZXIgPSBbXTtcclxuICAgIHRoaXMuY291bnRlciA9IC0xO1xyXG59O1xyXG5cclxuU2hhZGVyUHJvZ3JhbUxvYWRlci5wcm90b3R5cGUgPSB7XHJcbiAgICBjb25zdHJ1Y3RvcjogU2hhZGVyUHJvZ3JhbUxvYWRlcixcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRhZ2FzdGFiIHByb2dyYW1tIG9iamVrdGkuIEFzw7xua3Jvb25zZWx0IHRhZ2FwbGFhbmlsIGxhZXRha3NlIGphIGtvbXBpbGVlcml0YWtzZSB2YXJqdW5kYWphZC4gRW5uZSBrdWlcclxuICAgICAqIHByb2dyYW1taSBrYXN1dGFkYSB0dWxlYiBrb250cm9sbGlkYSwgZXQgdmFyanVuZGFqYWQgb24ga29tcGlsZWVyaXR1ZCBqYSBwcm9ncmFtbWlnYSBzZW90dWQuIFbDtWltYWxpayBvblxyXG4gICAgICogcGFyYW1lZXRyaWtzIGFuZGEga2EgQ2FsbGJhY2sgZnVua3RzaW9vbiwgbWlzIHRlYWRhIGFubmFiLCBrdWkgdmFyanVuZGFqYWQgb24gc2VvdHVkLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJ0ZXhTaGFkZXJQYXRoIFRlZSwgdGlwdXZhcmp1bmRhamEganV1cmRlXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRTaGFkZXJQYXRoIFRlZSwgcGlrc2xpdmFyanVuZGFqYSBqdXVyZGVcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpbmtlZENhbGxiYWNrIEZ1bmt0c2lvb24sIG1pcyBrdXRzdXRha3NlIHbDpGxqYSwga3VpIHZhcmp1bmRhamFkIG9uIGtvbXBpbGVlcml0dWQgamEgc2VvdHVkIHByb2dyYW1taWdhXHJcbiAgICAgKiBAcmV0dXJucyB7ZXhwb3J0cy5kZWZhdWx0T3B0aW9ucy5wcm9ncmFtfCp8V2ViR0xQcm9ncmFtfFByb2dyYW1PYmplY3QucHJvZ3JhbX1cclxuICAgICAqL1xyXG4gICAgZ2V0UHJvZ3JhbTogZnVuY3Rpb24odmVydGV4U2hhZGVyUGF0aCwgZnJhZ21lbnRTaGFkZXJQYXRoLCBsaW5rZWRDYWxsYmFjaykge1xyXG4gICAgICAgIHRoaXMuY291bnRlcisrO1xyXG4gICAgICAgIHRoaXMuY29udGFpbmVyW3RoaXMuY291bnRlcl0gPSBuZXcgUHJvZ3JhbU9iamVjdCh2ZXJ0ZXhTaGFkZXJQYXRoLCBmcmFnbWVudFNoYWRlclBhdGgsIGxpbmtlZENhbGxiYWNrKTtcclxuICAgICAgICB2YXIgcHJvZ3JhbSA9IHRoaXMuY29udGFpbmVyW3RoaXMuY291bnRlcl07XHJcblxyXG4gICAgICAgIHRoaXMubG9hZEFzeW5jU2hhZGVyU291cmNlKHZlcnRleFNoYWRlclBhdGgsIHByb2dyYW0ub25jb21wbGV0ZS5iaW5kKHByb2dyYW0pKTtcclxuICAgICAgICB0aGlzLmxvYWRBc3luY1NoYWRlclNvdXJjZShmcmFnbWVudFNoYWRlclBhdGgsIHByb2dyYW0ub25jb21wbGV0ZS5iaW5kKHByb2dyYW0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2dyYW0ucHJvZ3JhbTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMYWViIGFzw7xua3Jvb25zZWx0IGzDpGh0ZWtvb2RpXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNoYWRlclBhdGggVGVlLCBrdXMgYXN1YiB2YXJqdW5kYWphXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBGdW5rdHNpb29uLCBtaXMga8OkaXZpdGF0YWtzZSwga3VpIGzDpGh0ZWtvb2Qgb24ga8OkdHRlIHNhYWR1ZC4gU2FhZGV0YWtzZSB2YXN0dXMgamEgdGVlLlxyXG4gICAgICovXHJcbiAgICBsb2FkQXN5bmNTaGFkZXJTb3VyY2U6IGZ1bmN0aW9uKHNoYWRlclBhdGgsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgYXN5bmM6IHRydWUsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcInRleHRcIixcclxuICAgICAgICAgICAgdXJsOiBzaGFkZXJQYXRoLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlc3VsdCwgc2hhZGVyUGF0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb2dyYW1PYmplY3Q7XHJcbm1vZHVsZS5leHBvcnRzID0gU2hhZGVyUHJvZ3JhbUxvYWRlcjsiXX0=
