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
//////////////////////////////////////////////////////// LESSON08 - Valgus /////////////// /////////////////////////////
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
    //Valgusallikas
    APP.directionalLight = {
        "color": new Float32Array([1.0, 1.0, 1.0]),
        "direction": new Float32Array([-1.0, -1.0, 1.0])
    };

    APP.textureDirectionalLight = {
        "color": new Float32Array([1.0, 1.0, 0.0]),
        "direction": new Float32Array([1.0, 0.0, 0.0])
    };

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibGVzc29ucy9sZXNzb24wOC9tYWluLmpzIiwibGVzc29ucy91dGlscy9sb29wZXIuanMiLCJsZXNzb25zL3V0aWxzL3NoYWRlcnByb2dyYW1sb2FkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNybEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy9BbnR1ZCBvc2EgdGVnZWxlYiBXZWJHTCBrb250ZWtzdGkgbG9vbWlzZWdhIGphIG1laWxlIHZhamFsaWt1IFdlYkdMUHJvZ3JhbSBvYmpla3RpIGxvb21pc2VnYSAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG52YXIgU2hhZGVyUHJvZ3JhbUxvYWRlciA9IHJlcXVpcmUoXCIuLy4uL3V0aWxzL3NoYWRlcnByb2dyYW1sb2FkZXJcIik7XHJcbnZhciBMb29wZXIgPSByZXF1aXJlKFwiLi8uLi91dGlscy9sb29wZXJcIik7XHJcblxyXG4vL1Zhcmp1bmRhamF0ZSBrYXRhbG9vZ1xyXG52YXIgU0hBREVSX1BBVEggPSBcInNoYWRlcnMvbGVzc29uMDgvXCI7XHJcblxyXG4vL1Rla3N0dXVyaSBhc3Vrb2h0XHJcbnZhciBURVhUVVJFX1BBVEggPSBcImFzc2V0cy90ZXh0dXJlLmpwZ1wiO1xyXG5cclxuLy9FbGVtZW50LCBrdWh1IHJlbmRlcmRhbWVcclxudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG5cclxuLy9Mb29tZSBnbG9iYWFsc2UgV2ViR0wga29udGVrc3RpXHJcbkdMID0gaW5pdFdlYkdMKGNhbnZhcyk7XHJcblxyXG4vL1NlYWRpc3RhbWUgcmVuZGVyZGFtaXNyZXNvbHV0c2lvb25pXHJcbkdMLnZpZXdwb3J0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcbkdMLnZpZXdwb3J0V2lkdGggPSBjYW52YXMud2lkdGg7XHJcbkdMLnZpZXdwb3J0SGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcclxuXHJcbi8vTG9vbWUgdXVlIHByb2dyYW1taSBzcGV0c2lmaXRzZWVyaXR1ZCB2YXJqdW5kYWphdGVnYS4gS3VuYSBsYWFkaW1pbmUgb24gYXPDvG5rcm9vbm5lLCBzaWlzIGFubmFtZSBrYWFzYSBrYVxyXG4vL21lZXRvZGksIG1pcyBrdXRzdXRha3NlIHbDpGxqYSBrdWkgdmFyanVuZGFqYWQgb24gbGFldHVkXHJcbnZhciBzaGFkZXJQcm9ncmFtTG9hZGVyID0gbmV3IFNoYWRlclByb2dyYW1Mb2FkZXIoKTtcclxudmFyIHNoYWRlclByb2dyYW0gPSBzaGFkZXJQcm9ncmFtTG9hZGVyLmdldFByb2dyYW0oU0hBREVSX1BBVEggKyBcInZlcnRleC5zaGFkZXJcIiwgU0hBREVSX1BBVEggKyBcImZyYWdtZW50LnNoYWRlclwiLCBzaGFkZXJzTG9hZGVkKTtcclxuXHJcblxyXG4vL8Occml0YW1lIGx1dWEgV2ViR0wga29udGVrc3RpXHJcbmZ1bmN0aW9uIGluaXRXZWJHTChjYW52YXMpIHtcclxuICAgIHZhciBnbCA9IG51bGw7XHJcblxyXG4gICAgdHJ5IHtcclxuXHJcbiAgICAgICAgLy/DnHJpdGFtZSBsdXVhIHRhdmFsaXN0IGtvbnRla3N0aSwga3VpIHNlZSBlYmHDtW5uZXN0dWIgw7xyaXRhbWUgbHV1YSBla3NwZXJpbWVudGFhbHNldCxcclxuICAgICAgICAvL01pZGEga2FzdXRhdGFrc2Ugc3BldHNpZmlrYXRzaW9vbmkgYXJlbmRhbWlzZWtzXHJcbiAgICAgICAgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpIHx8IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIpO1xyXG5cclxuICAgIH0gY2F0Y2ggKGUpIHt9XHJcblxyXG4gICAgaWYoIWdsKSB7XHJcbiAgICAgICAgYWxlcnQoXCJVbmFibGUgdG8gaW5pdGlsaXplIFdlYkdMLiBZb3VyIGJyb3dzZXIgbWF5IG5vdCBzdXBwb3J0IGl0LlwiKTtcclxuICAgICAgICB0aHJvdyBFcnJvcihcIkV4ZWN1dGlvbiB0ZXJtaW5hdGVkLiBObyBXZWJHTCBjb250ZXh0XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBnbDtcclxufVxyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIExFU1NPTjA4IC0gVmFsZ3VzIC8vLy8vLy8vLy8vLy8vLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbi8vS8O8c2ltZSB2ZWViaWxlaGl0c2VqYWx0IHPDvGdhdnVzdGVrc3R1dXJpIGxhaWVuZHVzdFxyXG52YXIgZXh0RGVwdGggPSBHTC5nZXRFeHRlbnNpb24oXCJXRUJHTF9kZXB0aF90ZXh0dXJlXCIpIHx8XHJcbiAgICAgICAgICAgICAgIEdMLmdldEV4dGVuc2lvbihcIldFQkdLSVRfV0VCR0xfZGVwdGhfdGV4dHVyZVwiKXx8XHJcbiAgICAgICAgICAgICAgIEdMLmdldEV4dGVuc2lvbihcIk1PWl9XRUJHTF9kZXB0aF90ZXh0dXJlXCIpO1xyXG5pZighZXh0RGVwdGgpIHtcclxuICAgIGFsZXJ0KFwiQnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGRlcHRoIHRleHR1cmUgZXh0ZW5zaW9uLiBTZWUgd2ViZ2xyZXBvcnQuY29tIGZvciBtb3JlIGluZm9ybWF0aW9uLlwiKTtcclxuICAgIHRocm93IGVycm9yKFwiTm8gZGVwdGggdGV4dHVyZSBleHRlbnNpb25cIik7XHJcbn1cclxuXHJcbnZhciBBUFAgPSB7fTtcclxuXHJcbkFQUC5sb29wZXIgPSBuZXcgTG9vcGVyKGNhbnZhcywgbG9vcCk7XHJcblxyXG5BUFAuaXNNb3VzZURvd24gPSBmYWxzZTtcclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBtb3VzZUNsaWNrSGFuZGxlciwgZmFsc2UpO1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBtb3VzZUNsaWNrSGFuZGxlciwgZmFsc2UpO1xyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNld2hlZWxcIiwgbW91c2VTY3JvbGxIYW5kbGVyLCBmYWxzZSk7XHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Nb3VzZVNjcm9sbFwiLCBtb3VzZVNjcm9sbEhhbmRsZXIsIGZhbHNlKTtcclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm9ubW91c2V3aGVlbFwiLCBtb3VzZVNjcm9sbEhhbmRsZXIsIGZhbHNlKTtcclxuXHJcbi8vS09OU1RBTkRJRCBLQUFNRVJBIEpBT0tTXHJcblxyXG4vLzM2MCBrcmFhZGlcclxuQVBQLlRXT1BJID0gMi4wICogTWF0aC5QSTtcclxuXHJcbi8vOTAga3JhYWRpXHJcbkFQUC5QSU9WRVJUV08gPSBNYXRoLlBJIC8gMi4wO1xyXG5cclxuLy9NYWtzaW1hYWxuZSB2ZXJ0aWthYWxudXJrXHJcbkFQUC5NQVhfVkVSVElDQUwgPSBBUFAuUElPVkVSVFdPIC0gQVBQLlBJT1ZFUlRXTyAvIDg7XHJcblxyXG4vL1JhYWRpdXMsIG1pbGxlc3QgbMOkaGVtYWxlIGthYW1lcmEgbWlubmEgZWkgc2FhXHJcbkFQUC5NSU5fUkFESVVTID0gMS4wO1xyXG5cclxuLy9TdXVtaW1pc2tvbnN0YW50XHJcbkFQUC5aT09NX1ZBTFVFID0gMS4wO1xyXG5cclxuLy9LdXRzdXRha3NlIGt1aSB2YXJqdW5kYWphZCBvbiBsYWV0dWRcclxuZnVuY3Rpb24gc2hhZGVyc0xvYWRlZCgpIHtcclxuICAgIHNldHVwQW5kTG9hZFRleHR1cmUoKTtcclxuICAgIHNldHVwRnJhbWVCdWZmZXIoKTtcclxuICAgIHNldHVwKCk7XHJcblxyXG4gICAgQVBQLmxvb3Blci5sb29wKCk7XHJcbn1cclxuXHJcbi8vVGVrc3R1dXJpIGluaXRzaWFsaXNlZXJpbWluZSBqYSBsYWFkaW1pbmVcclxuZnVuY3Rpb24gc2V0dXBBbmRMb2FkVGV4dHVyZSgpIHtcclxuXHJcbiAgICAvL0xvb21lIHV1ZSB0ZWtzdHV1cmkgamEga29vcyBzZWxsZWdhIDF4MSBwaWtzbGlzZSBwaWxkaSwgbWlzIGt1dmF0YWtzZSBzZW5pa2F1YSwga3VuaSB0ZWtzdHV1ciBzYWFiIGxhZXR1ZFxyXG4gICAgQVBQLnRleHR1cmUgPSBHTC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBBUFAudGV4dHVyZSk7XHJcbiAgICBHTC50ZXhJbWFnZTJEKEdMLlRFWFRVUkVfMkQsIDAsIEdMLlJHQkEsIDEsIDEsIDAsIEdMLlJHQkEsICBHTC5VTlNJR05FRF9CWVRFLCBuZXcgVWludDhBcnJheShbMSwgMSwgMSwgMV0pKTtcclxuICAgIEdMLnRleFBhcmFtZXRlcmYoR0wuVEVYVFVSRV8yRCwgR0wuVEVYVFVSRV9XUkFQX1MsIEdMLlJFUEVBVCk7XHJcbiAgICBHTC50ZXhQYXJhbWV0ZXJmKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfV1JBUF9ULCBHTC5SRVBFQVQpO1xyXG4gICAgR0wudGV4UGFyYW1ldGVyaShHTC5URVhUVVJFXzJELCBHTC5URVhUVVJFX01BR19GSUxURVIsIEdMLk5FQVJFU1QpO1xyXG4gICAgR0wudGV4UGFyYW1ldGVyaShHTC5URVhUVVJFXzJELCBHTC5URVhUVVJFX01JTl9GSUxURVIsIEdMLk5FQVJFU1QpO1xyXG5cclxuICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG5cclxuICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIEFQUC50ZXh0dXJlKTtcclxuICAgICAgICBHTC50ZXhJbWFnZTJEKEdMLlRFWFRVUkVfMkQsIDAsIEdMLlJHQiwgR0wuUkdCLCAgR0wuVU5TSUdORURfQllURSwgaW1hZ2UpO1xyXG4gICAgICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgfTtcclxuICAgIGltYWdlLnNyYyA9IFRFWFRVUkVfUEFUSDtcclxuXHJcbn1cclxuXHJcbi8vVmFsbWlzdGFiZSBldHRlIGthYWRyaXB1aHZyaSwga3VodSBzdHNlZW4gcmVuZGVyZGFkYVxyXG5mdW5jdGlvbiBzZXR1cEZyYW1lQnVmZmVyKCkge1xyXG5cclxuICAgIC8vTG9vbWUga2FhZHJpcHVodnJpLCBrdWh1IHNhYW1lIHJlbmRlcmRhbWlzZSBqw6RyamVrb3JyYXMgc3RzZWVuaSByZW5kZXJkYWRhLlxyXG4gICAgQVBQLmZyYW1lQnVmZmVyID0gR0wuY3JlYXRlRnJhbWVidWZmZXIoKTtcclxuICAgIEdMLmJpbmRGcmFtZWJ1ZmZlcihHTC5GUkFNRUJVRkZFUiwgQVBQLmZyYW1lQnVmZmVyKTtcclxuICAgIEFQUC5mcmFtZUJ1ZmZlci53aWR0aCA9IDUxMjtcclxuICAgIEFQUC5mcmFtZUJ1ZmZlci5oZWlnaHQgPSA1MTI7XHJcblxyXG4gICAgLy9Mb29tZSB2w6RydnVzcHVodnJpLCBtaXMgaG9pYWIgcGlrc2xlaWRcclxuICAgIEFQUC5GQkNvbG9yVGV4dHVyZSA9IEdMLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIEFQUC5GQkNvbG9yVGV4dHVyZSk7XHJcbiAgICBHTC50ZXhJbWFnZTJEKEdMLlRFWFRVUkVfMkQsIDAsIEdMLlJHQkEsIEFQUC5mcmFtZUJ1ZmZlci53aWR0aCwgQVBQLmZyYW1lQnVmZmVyLmhlaWdodCwgMCwgR0wuUkdCQSwgR0wuVU5TSUdORURfQllURSwgbnVsbCk7XHJcbiAgICBHTC50ZXhQYXJhbWV0ZXJpKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgR0wuTElORUFSKTtcclxuICAgIEdMLnRleFBhcmFtZXRlcmkoR0wuVEVYVFVSRV8yRCwgR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBHTC5MSU5FQVJfTUlQTUFQX05FQVJFU1QpO1xyXG4gICAgR0wuZ2VuZXJhdGVNaXBtYXAoR0wuVEVYVFVSRV8yRCk7XHJcblxyXG4gICAgLy9Mb29tZSBzw7xnYXZ1c3B1aHZyaSwgbWlzIGhvaWFiIHBpa3NsaXRlIHPDvGdhdnVzaVxyXG4gICAgQVBQLkZCRGVwdGhCdWZmZXIgPSBHTC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcclxuICAgIEdMLmJpbmRSZW5kZXJidWZmZXIoR0wuUkVOREVSQlVGRkVSLCBBUFAuRkJEZXB0aEJ1ZmZlcik7XHJcbiAgICBHTC5yZW5kZXJidWZmZXJTdG9yYWdlKEdMLlJFTkRFUkJVRkZFUiwgR0wuREVQVEhfQ09NUE9ORU5UMTYsIEFQUC5mcmFtZUJ1ZmZlci53aWR0aCwgQVBQLmZyYW1lQnVmZmVyLmhlaWdodCk7XHJcblxyXG4gICAgLy9TZW9tZSB2w6RydmktIGphIHPDvGdhdnVzcHVodnJpIGFudHVkIGthYWRyaXB1aHZyaWdhXHJcbiAgICBHTC5mcmFtZWJ1ZmZlclRleHR1cmUyRChHTC5GUkFNRUJVRkZFUiwgR0wuQ09MT1JfQVRUQUNITUVOVDAsIEdMLlRFWFRVUkVfMkQsIEFQUC5GQkNvbG9yVGV4dHVyZSwgMCk7XHJcbiAgICBHTC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihHTC5GUkFNRUJVRkZFUiwgR0wuREVQVEhfQVRUQUNITUVOVCwgR0wuUkVOREVSQlVGRkVSLCBBUFAuRkJEZXB0aEJ1ZmZlcik7XHJcblxyXG4gICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICBHTC5iaW5kUmVuZGVyYnVmZmVyKEdMLlJFTkRFUkJVRkZFUiwgbnVsbCk7XHJcbiAgICBHTC5iaW5kRnJhbWVidWZmZXIoR0wuRlJBTUVCVUZGRVIsIG51bGwpO1xyXG59XHJcblxyXG4vL0xvb2IgcHVodnJpZCBqYSBtYWF0cmlrc2lkLiBUw6RpZGFiIHB1aHZyaWQgYW5kbWV0ZWdhLlxyXG5mdW5jdGlvbiBzZXR1cCgpIHtcclxuICAgIC8vVmFsZ3VzYWxsaWthc1xyXG4gICAgQVBQLmRpcmVjdGlvbmFsTGlnaHQgPSB7XHJcbiAgICAgICAgXCJjb2xvclwiOiBuZXcgRmxvYXQzMkFycmF5KFsxLjAsIDEuMCwgMS4wXSksXHJcbiAgICAgICAgXCJkaXJlY3Rpb25cIjogbmV3IEZsb2F0MzJBcnJheShbLTEuMCwgLTEuMCwgMS4wXSlcclxuICAgIH07XHJcblxyXG4gICAgQVBQLnRleHR1cmVEaXJlY3Rpb25hbExpZ2h0ID0ge1xyXG4gICAgICAgIFwiY29sb3JcIjogbmV3IEZsb2F0MzJBcnJheShbMS4wLCAxLjAsIDAuMF0pLFxyXG4gICAgICAgIFwiZGlyZWN0aW9uXCI6IG5ldyBGbG9hdDMyQXJyYXkoWzEuMCwgMC4wLCAwLjBdKVxyXG4gICAgfTtcclxuXHJcbiAgICBBUFAubWF0ZXJpYWwgPSB7XHJcbiAgICAgICAgXCJhbWJpZW50Q29sb3JcIjogbmV3IEZsb2F0MzJBcnJheShbMC4zLCAwLjMsIDAuM10pLFxyXG4gICAgICAgIFwiZGlmZnVzZUNvbG9yXCI6IG5ldyBGbG9hdDMyQXJyYXkoWzAuNSwgMC41LCAwLjVdKSxcclxuICAgICAgICBcInNwZWN1bGFyQ29sb3JcIjogbmV3IEZsb2F0MzJBcnJheShbMC43LCAwLjcsIDAuN10pLFxyXG4gICAgICAgIFwic2hpbmluZXNzXCI6IDEyOC4wXHJcbiAgICB9O1xyXG5cclxuICAgIC8vVGVlbWUgbXV1dHVqYSwga3VodSBzYWx2ZXN0YWRhIGFlZ2EsIGV0IGthYW1lcmF0IGFqYSBtw7bDtmR1ZGVzIMO8bWJlciBvYmpla3RpIHDDtsO2cmF0YVxyXG4gICAgQVBQLnRpbWUgPSAwO1xyXG5cclxuICAgIEFQUC5jYW1lcmFYID0gLTAuNztcclxuICAgIEFQUC5jYW1lcmFZID0gLTAuNztcclxuICAgIEFQUC5yYWRpdXMgPSA1O1xyXG5cclxuICAgIC8vTXVkZWxtYWF0cmlrcywgbWlsbGVnYSBvYmpla3RpcnV1bWlzdCBtYWFpbG1hcnV1bWkgc2FhZGFcclxuICAgIEFQUC5tb2RlbE1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcblxyXG4gICAgLy9NdWRlbG1hYXRyaWtzLCBtaWRhIGthc3V0YW1lIHRla3N0dXVyaWxlIHJlbmRlcmRhbWlzZWtzXHJcbiAgICBBUFAudGV4dHVyZU1vZGVsTWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuXHJcbiAgICAvL1B1bmt0LCBrdXMgb2JqZWt0IGhldGtlbCBhc3ViXHJcbiAgICBBUFAub2JqZWN0QXQgPSBbMC4wLCAwLjAsIC01LjBdO1xyXG5cclxuICAgIC8vS2FzdXRhZGVzIHRyYW5zbGF0c2lvb25pLCBzYWFtZSBtdWRlbG1hYXRyaWtzaWdhIG9iamVrdGkgbGlpZ3V0YWRhXHJcbiAgICBtYXQ0LnRyYW5zbGF0ZShBUFAubW9kZWxNYXRyaXgsIEFQUC5tb2RlbE1hdHJpeCwgQVBQLm9iamVjdEF0KTtcclxuICAgIG1hdDQudHJhbnNsYXRlKEFQUC50ZXh0dXJlTW9kZWxNYXRyaXgsIEFQUC50ZXh0dXJlTW9kZWxNYXRyaXgsIFswLjAsIDAuMCwgLTQuMF0pO1xyXG5cclxuICAgIC8vS2FhbWVyYW1hYXRyaWtzLCBtaWxsZWdhIG1hYWlsbWFydXVtaXN0IGthYW1lcmFydXVtaSBzYWFkYVxyXG4gICAgQVBQLnZpZXdNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vS2FhbWVyYW1hYXRyaWtzLCBtaWRhIGthc3V0YW1lIHRla3N0dXVyaWxlIHJlbmRlcmRhbWlzZWtzXHJcbiAgICBBUFAudGV4dHVyZVZpZXdNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG4gICAgbWF0NC5sb29rQXQoQVBQLnRleHR1cmVWaWV3TWF0cml4LCBbMCwgMCwgMF0sIFswLCAwLCAtNV0sIFswLCAxLCAwXSk7XHJcblxyXG4gICAgLy9EZWZpbmVlcmltZSB2ZWt0b3JpZCwgbWlsbGUgYWJpbCBvbiB2w7VpbWFsaWsga2FhbWVyYXJ1dW1pIGJhYXN2ZWt0b3JpZCBhcnZ1dGFkYVxyXG4gICAgQVBQLmNhbWVyYUF0ID0gdmVjMy5jcmVhdGUoKTsgICAgICAgICAgICAvL0FzdWIgbWFhaWxtYXJ1dW1pcyBuZW5kZWwga29vcmRpbmFhdGlkZWxcclxuICAgIEFQUC5sb29rQXQgPSB2ZWMzLmNyZWF0ZSgpOyAgICAgICAgICAgICAvL01pcyBzdXVuYXMga2FhbWVyYSB2YWF0YWIuIFBhcmVtYWvDpGUga29vcmRpbmFhdHPDvHN0ZWVtaXMgb24gLXogZWtyYWFuaSBzaXNzZVxyXG4gICAgQVBQLnVwID0gdmVjMy5jcmVhdGUoKTsgICAgICAgICAgICAgICAgICAvL1Zla3RvciwgbWlzIG7DpGl0YWIsIGt1cyBvbiBrYWFtZXJhIMO8bGVzc2Ugc3V1bmRhIG7DpGl0YXYgdmVrdG9yXHJcbiAgICB1cGRhdGVDYW1lcmEoKTtcclxuXHJcbiAgICAvL1Byb2pla3RzaW9vbmltYWF0cmlrcywgZXQgcMO8Z2FtaXNydXVtaSBzYWFkYS4gS2FzdXRhZGVzIGdsTWF0cml4IHRlZWtpIGdlbmVyZWVyaW1lIGthIHDDvHJhbWlpZGksIGt1aHUgc2lzc2Ugb2JqZWt0aWQgbMOkaGV2YWQuXHJcbiAgICBBUFAucHJvamVjdGlvbk1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgICBtYXQ0LnBlcnNwZWN0aXZlKEFQUC5wcm9qZWN0aW9uTWF0cml4LCA0NS4wLCBHTC52aWV3cG9ydFdpZHRoIC8gR0wudmlld3BvcnRIZWlnaHQsIDEuMCwgMTAwMC4wKTtcclxuXHJcbiAgICAvL1Byb2pla3RzaW9vbmltYWF0cmlrcywgbWlkYSBrYXN1dGFtZSB0ZWtzdHV1cmlsZSByZW5kZXJkYW1pc2Vrc1xyXG4gICAgQVBQLnRleHR1cmVQcm9qZWN0aW9uTWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuICAgIG1hdDQucGVyc3BlY3RpdmUoQVBQLnRleHR1cmVQcm9qZWN0aW9uTWF0cml4LCA0NS4wLCAxLCAwLjEsIDEwMC4wKTtcclxuXHJcbiAgICAvL1RpcHB1ZGUgYW5kbWVkLiBUaXB1IGtvb3JkaW5hYWRpZCB4LCB5LCB6LCBOb3JtYWFsdmVrdG9yaSBrb29yZGluYWFpZCB4LCB5LCB6IGphIHRla3N0dXVyaSBrb29yZGluYWFkaWQgdSwgdlxyXG4gICAgQVBQLm15VmVydGljZXNEYXRhID0gW1xyXG4gICAgICAgIC8vRXNpbWVuZSBrw7xsZ1xyXG4gICAgICAgIC0xLjAsIC0xLjAsICAxLjAsIDAuMCwgMC4wLCAxLjAsICAwLjAsIDEuMCwgICAgICAgICAgICAvL0FMVU1JTkUgVkFTQUsgTlVSS1xyXG4gICAgICAgICAxLjAsIC0xLjAsICAxLjAsIDAuMCwgMC4wLCAxLjAsICAxLjAsIDEuMCwgICAgICAgICAgICAvL0FMVU1JTkUgUEFSRU0gTlVSS1xyXG4gICAgICAgICAxLjAsICAxLjAsICAxLjAsIDAuMCwgMC4wLCAxLjAsICAxLjAsIDAuMCwgICAgICAgICAgICAvL8OcTEVNSU5FIFBBUkVNIE5VUktcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMS4wLCAwLjAsIDAuMCwgMS4wLCAgMC4wLCAwLjAsICAgICAgICAgICAgLy/DnExFTUlORSBWQVNBSyBOVVJLXHJcblxyXG4gICAgICAgIC8vVGFndW1pbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDAuMCwgLTEuMCwgMC4wLCAxLjAsXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgLTEuMCwgMC4wLCAwLjAsIC0xLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgLTEuMCwgMC4wLCAwLjAsIC0xLjAsIDEuMCwgMC4wLFxyXG4gICAgICAgIDEuMCwgLTEuMCwgLTEuMCwgMC4wLCAwLjAsIC0xLjAsIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL8OcbGVtaW5lIGvDvGxnXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgLTEuMCwgMC4wLCAxLjAsIDAuMCwgMC4wLCAxLjAsXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgIDEuMCwgMC4wLCAxLjAsIDAuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAgMS4wLCAgMS4wLCAwLjAsIDEuMCwgMC4wLCAxLjAsIDAuMCxcclxuICAgICAgICAxLjAsICAxLjAsIC0xLjAsIDAuMCwgMS4wLCAwLjAsICAwLjAsIDAuMCxcclxuXHJcbiAgICAgICAgLy9BbHVtaW5lIGvDvGxnXHJcbiAgICAgICAgLTEuMCwgLTEuMCwgLTEuMCwgMC4wLCAtMS4wLCAwLjAsIDAuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgLTEuMCwgLTEuMCwgMC4wLCAtMS4wLCAwLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgLTEuMCwgIDEuMCwgMC4wLCAtMS4wLCAwLjAsICAxLjAsIDAuMCxcclxuICAgICAgICAtMS4wLCAtMS4wLCAgMS4wLCAwLjAsIC0xLjAsIDAuMCwgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vUGFyZW0ga8O8bGdcclxuICAgICAgICAxLjAsIC0xLjAsIC0xLjAsIDEuMCwgMC4wLCAwLjAsIDAuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgLTEuMCwgMS4wLCAwLjAsIDAuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAgMS4wLCAgMS4wLCAxLjAsIDAuMCwgMC4wLCAgMS4wLCAwLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAgMS4wLCAxLjAsIDAuMCwgMC4wLCAwLjAsIDAuMCxcclxuXHJcbiAgICAgICAgLy9WYXNhayBrw7xsZ1xyXG4gICAgICAgIC0xLjAsIC0xLjAsIC0xLjAsIC0xLjAsIDAuMCwgMC4wLCAwLjAsIDEuMCxcclxuICAgICAgICAtMS4wLCAtMS4wLCAgMS4wLCAtMS4wLCAwLjAsIDAuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgIDEuMCwgLTEuMCwgMC4wLCAwLjAsICAxLjAsIDAuMCxcclxuICAgICAgICAtMS4wLCAgMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDAuMCwgMC4wLCAwLjAsXHJcbiAgICBdO1xyXG4gICAgQVBQLnZlcnRleFNpemUgPSA4O1xyXG5cclxuICAgIC8vTG9vbWUgcHVodnJpLCBrdWh1IHRpcHVhbmRtZWQgdmlpYS4gU2VvbWUga2EgYW50dWQgcHVodnJpIGtvbnRla3N0aWdhLCBldCB0ZW1hbGUga8Okc2tlIGVkYXNpIGFuZGFcclxuICAgIEFQUC52ZXJ0ZXhCdWZmZXIgPSBHTC5jcmVhdGVCdWZmZXIoKTtcclxuXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkFSUkFZX0JVRkZFUiwgQVBQLnZlcnRleEJ1ZmZlcik7XHJcblxyXG4gICAgLy9Bbm5hbWUgbG9vZHVkIHB1aHZyaWxlIGFuZG1lZFxyXG4gICAgR0wuYnVmZmVyRGF0YShHTC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoQVBQLm15VmVydGljZXNEYXRhKSwgR0wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgIC8vVGlwcHVkZSBpbmRla3NpZFxyXG4gICAgQVBQLm15SW5kaWNlc0RhdGEgPSBbXHJcbiAgICAgICAgMCwgMSwgMiwgICAgICAwLCAyLCAzLCAgICAvLyBFc2ltZW5lIGvDvGxnXHJcbiAgICAgICAgNCwgNSwgNiwgICAgICA0LCA2LCA3LCAgICAvLyBUYWd1bWluZSBrw7xsZ1xyXG4gICAgICAgIDgsIDksIDEwLCAgICAgOCwgMTAsIDExLCAgLy8gw5xsZW1pbmUga8O8bGdcclxuICAgICAgICAxMiwgMTMsIDE0LCAgIDEyLCAxNCwgMTUsIC8vIEFsdW1pbmUga8O8bGdcclxuICAgICAgICAxNiwgMTcsIDE4LCAgIDE2LCAxOCwgMTksIC8vIFBhcmVtIGvDvGxnXHJcbiAgICAgICAgMjAsIDIxLCAyMiwgICAyMCwgMjIsIDIzICAvLyBWYXNhayBrw7xsZ1xyXG4gICAgXTtcclxuXHJcbiAgICAvL0xvb21lIHB1aHZyaSwga3VodSBpbmRla3NpZCB2aWlhLiBTZW9tZSBrYSBhbnR1ZCBwdWh2cmkga29udGVrc3RpZ2EsIGV0IHRlbWFsZSBrw6Rza2UgZWRhc2kgYW5kYVxyXG4gICAgQVBQLmluZGV4QnVmZmVyID0gR0wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBBUFAuaW5kZXhCdWZmZXIubnVtYmVyT2ZJbmRleGVzID0gMzY7XHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBBUFAuaW5kZXhCdWZmZXIpO1xyXG5cclxuICAgIC8vQW5uYW1lIGxvb2R1ZCBwdWh2cmlsZSBhbmRtZWRcclxuICAgIEdMLmJ1ZmZlckRhdGEoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG5ldyBVaW50MTZBcnJheShBUFAubXlJbmRpY2VzRGF0YSksIEdMLlNUQVRJQ19EUkFXKTtcclxuXHJcbiAgICAvL03DpMOkcmFtZSBwcm9ncmFtbWksIG1pZGEgbWUgcmVuZGVyZGFtaXNlbCBrYXN1dGFkYSB0YWhhbWVcclxuICAgIEdMLnVzZVByb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XHJcblxyXG4gICAgLy9TYWFtZSBpbmRla3NpLCBtaXMgbsOkaXRhYiBrdXMgYXN1YiBtZWllIHByb2dyYW1taXMga2FzdXRhdGF2YXMgdGlwdXZhcmp1bmRhamFzXHJcbiAgICAvL29sZXYgdGlwdWF0cmlidXV0IG5pbWVnYSBhX1ZlcnRleFBvc2l0aW9uXHJcbiAgICBBUFAuYV9Qb3NpdGlvbiA9IEdMLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYV9Qb3NpdGlvblwiKTtcclxuXHJcbiAgICAvL1NhYW1lIHRpcHUgbm9ybWFhbHZla3RvcmlcclxuICAgIEFQUC5hX05vcm1hbCA9IEdMLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYV9Ob3JtYWxcIik7XHJcblxyXG4gICAgLy9TYWFtZSB2w6RydmlhdHJpYnV1ZGkgYXN1a29oYVxyXG4gICAgQVBQLmFfVGV4dHVyZUNvb3JkID0gR0wuZ2V0QXR0cmliTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJhX1RleHR1cmVDb29yZFwiKTtcclxuXHJcbiAgICAvL1NhYW1lIMO8aHRzZXRlIG11dXR1amF0ZSBhc3Vrb2hhZFxyXG4gICAgQVBQLnVfTW9kZWxNYXRyaXggPSBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X01vZGVsTWF0cml4XCIpO1xyXG4gICAgQVBQLnVfVmlld01hdHJpeCA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfVmlld01hdHJpeFwiKTtcclxuICAgIEFQUC51X1Byb2plY3Rpb25NYXRyaXggPSBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X1Byb2plY3Rpb25NYXRyaXhcIik7XHJcbiAgICBBUFAudV9UZXh0dXJlID0gR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9UZXh0dXJlXCIpO1xyXG5cclxuICAgIC8vVmFsZ3VzYWxsaWthIMO8aHRzZXRlIG11dXR1amF0ZSBhc3Vrb2hhZFxyXG4gICAgQVBQLnVfRGlyZWN0aW9uYWxMaWdodCA9IHtcclxuICAgICAgICBcImNvbG9yXCI6IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfRGlyZWN0aW9uYWxMaWdodENvbG9yXCIpLFxyXG4gICAgICAgIFwiZGlyZWN0aW9uXCI6IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfRGlyZWN0aW9uYWxMaWdodERpcmVjdGlvblwiKVxyXG4gICAgfTtcclxuXHJcbiAgICAvL01hdGVyaWFsaSDDvGh0c2V0ZSBtdXV0dWphdGUgYXN1a29oYWRcclxuICAgIEFQUC51X01hdGVyaWFsID0ge1xyXG4gICAgICAgIFwiYW1iaWVudENvbG9yXCI6IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfTWF0ZXJpYWxBbWJpZW50Q29sb3JcIiksXHJcbiAgICAgICAgXCJkaWZmdXNlQ29sb3JcIjogR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9NYXRlcmlhbERpZmZ1c2VDb2xvclwiKSxcclxuICAgICAgICBcInNwZWN1bGFyQ29sb3JcIjogR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9NYXRlcmlhbFNwZWN1bGFyQ29sb3JcIiksXHJcbiAgICAgICAgXCJzaGluaW5lc3NcIjogR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9NYXRlcmlhbFNoaW5pbmVzc1wiKVxyXG4gICAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gbW91c2VDbGlja0hhbmRsZXIoKSB7XHJcbiAgICBBUFAuaXNNb3VzZURvd24gPSAhQVBQLmlzTW91c2VEb3duO1xyXG5cclxuICAgIGlmKEFQUC5pc01vdXNlRG93bilcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG1vdXNlTW92ZSwgZmFsc2UpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgbW91c2VNb3ZlLCBmYWxzZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdXNlU2Nyb2xsSGFuZGxlcihlKSB7XHJcbiAgICB2YXIgZGVsdGEgPSAwO1xyXG5cclxuICAgIGlmKCFlKVxyXG4gICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XHJcblxyXG4gICAgaWYoZS53aGVlbERlbHRhKSAgICAgICAgICAgICAgICAgICAgLyoqIEludGVybmV0IEV4cGxvcmVyL09wZXJhL0dvb2dsZSBDaHJvbWUgKiovXHJcbiAgICAgICAgZGVsdGEgPSBlLndoZWVsRGVsdGEgLyAxMjA7XHJcblxyXG4gICAgZWxzZSBpZihlLmRldGFpbCkgICAgICAgICAgICAgICAgICAgLyoqIE1vemlsbGEgRmlyZWZveCAqKi9cclxuICAgICAgICBkZWx0YSA9IC1lLmRldGFpbC8zO1xyXG5cclxuICAgIGlmKGRlbHRhKSB7XHJcbiAgICAgICAgaWYoZGVsdGEgPiAwICYmIEFQUC5yYWRpdXMgPiBBUFAuTUlOX1JBRElVUylcclxuICAgICAgICAgICAgQVBQLnJhZGl1cyAtPSBBUFAuWk9PTV9WQUxVRTtcclxuICAgICAgICBlbHNlIGlmKGRlbHRhIDwgMClcclxuICAgICAgICAgICAgQVBQLnJhZGl1cyArPSBBUFAuWk9PTV9WQUxVRTtcclxuICAgIH1cclxuXHJcbiAgICAgICAgaWYoZS5wcmV2ZW50RGVmYXVsdClcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcclxuXHJcbiAgICB0b0Nhbm9uaWNhbCgpO1xyXG4gICAgdXBkYXRlQ2FtZXJhKCk7XHJcbn1cclxuXHJcbi8vSGlpcmUgYWxsaG9pZG1pc2VsIGphIGxpaWd1dGFtaXNlbCBrw6Rpdml0dWIgYW50dWQgZnVua3RzaW9vblxyXG5mdW5jdGlvbiBtb3VzZU1vdmUoZSkge1xyXG4gICAgdmFyIHggPSBlLndlYmtpdE1vdmVtZW50WCB8fCBlLm1vek1vdmVtZW50WDtcclxuICAgIHZhciB5ID0gZS53ZWJraXRNb3ZlbWVudFkgfHwgZS5tb3pNb3ZlbWVudFk7XHJcblxyXG4gICAgaWYodHlwZW9mIHggPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgeCA9IDA7XHJcbiAgICBpZih0eXBlb2YgeSA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICB5ID0gMDtcclxuXHJcblxyXG4gICAgQVBQLmNhbWVyYVggKz0geCAvIDUwMDtcclxuICAgIEFQUC5jYW1lcmFZICs9IHkgLyA1MDA7XHJcblxyXG4gICAgcmVzdHJpY3RDYW1lcmFZKCk7XHJcbiAgICB0b0Nhbm9uaWNhbCgpO1xyXG5cclxuICAgIHVwZGF0ZUNhbWVyYSgpO1xyXG59XHJcblxyXG4vL0Z1bmt0c2lvb24sIGV0IHZpaWEgaG9yaXNvbnRhYWxuZSBqYSB2ZXJ0aWthYWxuZSBudXJrIGthbm9vbmlsaXNzZSB2b3JtaVxyXG4vL0ltcGxlbWVudGVlcml0dWQgM0QgTWF0aCBQcmltZXIgZm9yIEdyYXBoaWNzIGFuZCBHYW1lIERldmVsb3BtZW50IGp1aGVuZGkgasOkcmdpXHJcbmZ1bmN0aW9uIHRvQ2Fub25pY2FsKCkge1xyXG5cclxuICAgIC8vS3VpIG9sZW1lIDAga29vcmRpbmFhdGlkZWxcclxuICAgIGlmKEFQUC5yYWRpdXMgPT0gMC4wKSB7XHJcbiAgICAgICAgQVBQLmNhbWVyYVggPSBBUFAuY2FtZXJhWSA9IDAuMDtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvL0t1aSByYWFkaXVzIG9uIG5lZ2F0aWl2bmUuXHJcbiAgICAgICAgaWYoQVBQLnJhZGl1cyA8IDAuMCkge1xyXG4gICAgICAgICAgICBBUFAucmFkaXVzID0gLUFQUC5yYWRpdXM7XHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFYICs9IE1hdGguUEk7XHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFZID0gLUFQUC5jYW1lcmFZO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9WZXJ0aWthYWxuZSBudXJrIMO8bGVtaXNlc3QgcGlpcmlzdCB2w6RsamFcclxuICAgICAgICBpZihNYXRoLmFicyhBUFAuY2FtZXJhWSkgPiBBUFAuUElPVkVSVFdPKSB7XHJcblxyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWSArPSBBUFAuUElPVkVSVFdPO1xyXG5cclxuICAgICAgICAgICAgQVBQLmNhbWVyYVkgLT0gTWF0aC5mbG9vcihBUFAuY2FtZXJhWSAvIEFQUC5UV09QSSkgKiBBUFAuVFdPUEk7XHJcblxyXG4gICAgICAgICAgICBpZihBUFAuY2FtZXJhWSA+IE1hdGguUEkpIHtcclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFYICs9IE1hdGguUEk7XHJcblxyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVkgPSAzLjAgKiBNYXRoLlBJLzIuMCAtIEFQUC5jYW1lcmFZO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVkgLT0gQVBQLlBJT1ZFUlRXTztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9HSU1CQUwgTE9DS1xyXG4gICAgICAgIGlmKE1hdGguYWJzKEFQUC5jYW1lcmFZKSA+PSBBUFAuUElPVkVSVFdPICogMC45OTk5KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR0lNQkFMTE9DS1wiKTtcclxuICAgICAgICAgICAgQVBQLmNhbWVyYVggPSAwLjA7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmKE1hdGguYWJzKEFQUC5jYW1lcmFYKSA+IE1hdGguUEkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBBUFAuY2FtZXJhWCArPSBNYXRoLlBJO1xyXG5cclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFYIC09IE1hdGguZmxvb3IoQVBQLmNhbWVyYVggLyBBUFAuVFdPUEkpICogQVBQLlRXT1BJO1xyXG5cclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFYIC09IE1hdGguUEk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiByZXN0cmljdENhbWVyYVkoKSB7XHJcbiAgICBpZihNYXRoLmFicyhBUFAuY2FtZXJhWSkgPiBBUFAuTUFYX1ZFUlRJQ0FMKSB7XHJcbiAgICAgICAgaWYoQVBQLmNhbWVyYVkgPCAwKVxyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWSA9IC1BUFAuTUFYX1ZFUlRJQ0FMO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgQVBQLmNhbWVyYVkgPSBBUFAuTUFYX1ZFUlRJQ0FMO1xyXG4gICAgfVxyXG59XHJcblxyXG4vL0t1dHN1dGFrc2UgdsOkbGphIExvb3BlciBvYmpla3RpcyBpZ2Ega2FhZGVyXHJcbmZ1bmN0aW9uIGxvb3AoZGVsdGFUaW1lKSB7XHJcbiAgICB1cGRhdGUoZGVsdGFUaW1lKTtcclxuXHJcbiAgICAvL03DpMOkcmFtZSBrYWFkcmlwdWh2cmlrcyBtZWllIGVuZGEgbG9vZHVkIGthYWRyaXB1aHZyaVxyXG4gICAgR0wuYmluZEZyYW1lYnVmZmVyKEdMLkZSQU1FQlVGRkVSLCBBUFAuZnJhbWVCdWZmZXIpO1xyXG5cclxuICAgIC8vUmVuZGVyZGFtZSBzdHNlZW5pIHRla3N0dXVyaWxlXHJcbiAgICByZW5kZXJUb1RleHR1cmUoKTtcclxuXHJcbiAgICAvL1Nlb21lIGxhaHRpIGVlbG1pc2Uga2FhZHJpcHVodnJpLiBQw6RyYXN0IHNlZGEgb24ga2FzdXR1c2VsIHRhdmFsaW5lIHB1aHZlciwgbWlkYSBrYXN1dGF0YWtzZSBjYW52YXMgZWxlbWVuZGkgamFva3MuXHJcbiAgICBHTC5iaW5kRnJhbWVidWZmZXIoR0wuRlJBTUVCVUZGRVIsIG51bGwpO1xyXG5cclxuICAgIHJlbmRlcigpO1xyXG59XHJcblxyXG4vL1V1ZW5kYWIgYW5kbWVpZCwgZXQgb2xla3MgdsO1aW1hbGlrIHN0c2VlbiBsaWlrdW1hIHBhbm5hXHJcbmZ1bmN0aW9uIHVwZGF0ZShkZWx0YVRpbWUpIHtcclxuICAgIEFQUC50aW1lICs9IGRlbHRhVGltZSAvIDEwMDtcclxuXHJcbiAgIHVwZGF0ZU9iamVjdCgpO1xyXG59XHJcblxyXG4vL1V1ZW5kYWIga2FhbWVyYXQsIGV0IHNlZGEgb2xla3MgdsO1aW1hbGlrIMO8bWJlciBvYmpla3RpIHDDtsO2cmF0YVxyXG5mdW5jdGlvbiB1cGRhdGVDYW1lcmEoKSB7XHJcblxyXG4gICAgLy9MZWlhbWUgdXVlIHBvc2l0c2lvb25pLCBtaXMgYWphcyBsaWlndWIgcG9sYWFyc2VzIGtvb3JkaW5hYXRzw7xzdGVlbWlzIGphIG1pbGxlIHRlaXNlbmRhbWUgcmlzdGtvb3JkaW5hYXRzw7xzdGVlbWlcclxuICAgIEFQUC5jYW1lcmFBdCA9IFtBUFAub2JqZWN0QXRbMF0gKyBBUFAucmFkaXVzICogTWF0aC5jb3MoQVBQLmNhbWVyYVkpICogTWF0aC5zaW4oQVBQLmNhbWVyYVgpLCAgICAgICAvLyBYXHJcbiAgICAgICAgICAgICAgICAgICAgIEFQUC5vYmplY3RBdFsxXSArIEFQUC5yYWRpdXMgKiAtTWF0aC5zaW4oQVBQLmNhbWVyYVkpLCAgICAgICAgICAgICAgICAgICAgIC8vIFlcclxuICAgICAgICAgICAgICAgICAgICAgQVBQLm9iamVjdEF0WzJdICsgQVBQLnJhZGl1cyAqIE1hdGguY29zKEFQUC5jYW1lcmFZKSAqIE1hdGguY29zKEFQUC5jYW1lcmFYKV07ICAgICAvLyBaXHJcblxyXG5cclxuICAgIC8vTGVpYW1lIHN1dW5hdmVrdG9yaSwga2FhbWVyYXN0IG9iamVrdGluaVxyXG4gICAgQVBQLmxvb2tEaXJlY3Rpb24gPSBbQVBQLm9iamVjdEF0WzBdIC0gQVBQLmNhbWVyYUF0WzBdLCAgICAgICAgICAgICAgIC8vIFhcclxuICAgICAgICAgICAgICAgICAgICAgICAgIEFQUC5vYmplY3RBdFsxXSAtIEFQUC5jYW1lcmFBdFsxXSwgICAgICAgICAgICAgICAvLyBZXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBBUFAub2JqZWN0QXRbMl0gLSBBUFAuY2FtZXJhQXRbMl1dOyAgICAgICAgICAgICAgLy8gWlxyXG5cclxuICAgIC8vTGVpYW1lIHB1bmt0aSwgbWlkYSBrYWFtZXJhIHZhYXRhYlxyXG4gICAgdmVjMy5hZGQoQVBQLmxvb2tBdCwgQVBQLmNhbWVyYUF0LCBBUFAubG9va0RpcmVjdGlvbik7XHJcblxyXG4gICAgQVBQLnJpZ2h0ID0gW1xyXG4gICAgICAgIE1hdGguc2luKEFQUC5jYW1lcmFYIC0gTWF0aC5QSSAvIDIpLFxyXG4gICAgICAgIDAsXHJcbiAgICAgICAgTWF0aC5jb3MoQVBQLmNhbWVyYVggLSBNYXRoLlBJIC8gMilcclxuICAgIF07XHJcblxyXG4gICAgdmVjMy5ub3JtYWxpemUoQVBQLnJpZ2h0LCBBUFAucmlnaHQpO1xyXG4gICAgdmVjMy5ub3JtYWxpemUoQVBQLmxvb2tEaXJlY3Rpb24sIEFQUC5sb29rRGlyZWN0aW9uKTtcclxuICAgIHZlYzMuY3Jvc3MoQVBQLnVwLCBBUFAubG9va0RpcmVjdGlvbiwgQVBQLnJpZ2h0KTtcclxuXHJcbiAgICAvL1V1ZW5kYW1lIGthYW1lcmFtYWF0cmlrc2l0XHJcbiAgICBtYXQ0Lmxvb2tBdChBUFAudmlld01hdHJpeCwgQVBQLmNhbWVyYUF0LCBBUFAubG9va0F0LCBBUFAudXApO1xyXG5cclxuXHJcbn1cclxuXHJcbi8vdXVlbmRhbWUgb2JqZWt0aVxyXG5mdW5jdGlvbiB1cGRhdGVPYmplY3QoKSB7XHJcbiAgICBtYXQ0LnJvdGF0ZVkoQVBQLnRleHR1cmVNb2RlbE1hdHJpeCwgQVBQLnRleHR1cmVNb2RlbE1hdHJpeCwgMC4wMDUpO1xyXG59XHJcblxyXG4vL03DpMOkcmFtZSB2YWxndXNhcnZ1dHVzdGUgamFva3Mgw7xodHNlZCBtdXV0dWphZFxyXG5mdW5jdGlvbiBzZXRNYXRlcmlhbFVuaWZvcm1zKCkge1xyXG5cclxuICAgIC8vT2JqZWt0aSBtYXRlcmphbGkgbXV1dHVqYWRcclxuICAgIEdMLnVuaWZvcm0zZnYoQVBQLnVfTWF0ZXJpYWwuYW1iaWVudENvbG9yLCBBUFAubWF0ZXJpYWwuYW1iaWVudENvbG9yKTtcclxuICAgIEdMLnVuaWZvcm0zZnYoQVBQLnVfTWF0ZXJpYWwuZGlmZnVzZUNvbG9yLCBBUFAubWF0ZXJpYWwuZGlmZnVzZUNvbG9yKTtcclxuICAgIEdMLnVuaWZvcm0zZnYoQVBQLnVfTWF0ZXJpYWwuc3BlY3VsYXJDb2xvciwgQVBQLm1hdGVyaWFsLnNwZWN1bGFyQ29sb3IpO1xyXG4gICAgR0wudW5pZm9ybTFmKEFQUC51X01hdGVyaWFsLnNoaW5pbmVzcywgQVBQLm1hdGVyaWFsLnNoaW5pbmVzcyk7XHJcbn1cclxuXHJcblxyXG4vL1JlbmRlcmRhbWUgdGVrc3R1dXJpbGVcclxuZnVuY3Rpb24gcmVuZGVyVG9UZXh0dXJlKCkge1xyXG4gICAgR0wudmlld3BvcnQoMCwgMCwgQVBQLmZyYW1lQnVmZmVyLndpZHRoLCBBUFAuZnJhbWVCdWZmZXIuaGVpZ2h0KTtcclxuICAgIEdMLmNsZWFyQ29sb3IoMS4wLCAxLjAsIDEuMCwgMS4wKTtcclxuICAgIEdMLmNsZWFyKEdMLkNPTE9SX0JVRkZFUl9CSVQgfCBHTC5ERVBUSF9CVUZGRVJfQklUKTtcclxuXHJcbiAgICAvL0zDvGxpdGFtZSBzaXNzZSBzw7xnYXZ1c3Rlc3RpXHJcbiAgICBHTC5lbmFibGUoR0wuREVQVEhfVEVTVCk7XHJcbiAgICBHTC5kZXB0aEZ1bmMoR0wuTEVTUyk7XHJcblxyXG4gICAgLy9TZW9tZSB0aXB1cHVodnJpIGphIG3DpMOkcmFtZSwga3VzIGFudHVkIHRpcHVhdHJpYnV1dCBhc3ViIGFudHVkIG1hc3NpaXZpcy5cclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuQVJSQVlfQlVGRkVSLCBBUFAudmVydGV4QnVmZmVyKTtcclxuICAgIEdMLnZlcnRleEF0dHJpYlBvaW50ZXIoQVBQLmFfUG9zaXRpb24sIDMsIEdMLkZMT0FULCBmYWxzZSwgQVBQLnZlcnRleFNpemUgKiA0LCAwKTtcclxuICAgIEdMLnZlcnRleEF0dHJpYlBvaW50ZXIoQVBQLmFfTm9ybWFsLCAzLCBHTC5GTE9BVCwgZmFsc2UsIEFQUC52ZXJ0ZXhTaXplICogNCwgMyAqIDQpO1xyXG4gICAgR0wudmVydGV4QXR0cmliUG9pbnRlcihBUFAuYV9UZXh0dXJlQ29vcmQsIDIsIEdMLkZMT0FULCBmYWxzZSwgQVBQLnZlcnRleFNpemUgKiA0LCBBUFAudmVydGV4U2l6ZSAqIDQgLSAyICogNCk7XHJcblxyXG4gICAgLy9Ba3RpdmVlcmltZSBhdHJpYnV1ZGlkXHJcbiAgICBHTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShBUFAuYV9Qb3NpdGlvbik7XHJcbiAgICBHTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShBUFAuYV9Ob3JtYWwpO1xyXG4gICAgR0wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoQVBQLmFfVGV4dHVyZUNvb3JkKTtcclxuXHJcbiAgICAvL0FrdGl2ZWVyaW1lIGphIG3DpMOkcmFtZSB0ZWtzdHV1cmlcclxuICAgIEdMLmFjdGl2ZVRleHR1cmUoR0wuVEVYVFVSRTApO1xyXG4gICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgQVBQLnRleHR1cmUpO1xyXG4gICAgR0wudW5pZm9ybTFpKEFQUC51X1RleHR1cmUsIDApO1xyXG5cclxuICAgIHNldE1hdGVyaWFsVW5pZm9ybXMoKTtcclxuXHJcbiAgICAvL1ZhbGd1c2FsbGlrYSBtdXV0dWphZFxyXG4gICAgR0wudW5pZm9ybTNmdihBUFAudV9EaXJlY3Rpb25hbExpZ2h0LmNvbG9yLCBBUFAudGV4dHVyZURpcmVjdGlvbmFsTGlnaHQuY29sb3IpO1xyXG4gICAgR0wudW5pZm9ybTNmdihBUFAudV9EaXJlY3Rpb25hbExpZ2h0LmRpcmVjdGlvbiwgQVBQLnRleHR1cmVEaXJlY3Rpb25hbExpZ2h0LmRpcmVjdGlvbik7XHJcblxyXG4gICAgLy9TYWFkYW1lIG1laWUgdGVrc3R1dXJpIG1hYXRyaWtzaWQga2EgdmFyanVuZGFqYXNzZVxyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9Nb2RlbE1hdHJpeCwgZmFsc2UsIEFQUC50ZXh0dXJlTW9kZWxNYXRyaXgpO1xyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9WaWV3TWF0cml4LCBmYWxzZSwgQVBQLnRleHR1cmVWaWV3TWF0cml4KTtcclxuICAgIEdMLnVuaWZvcm1NYXRyaXg0ZnYoQVBQLnVfUHJvamVjdGlvbk1hdHJpeCwgZmFsc2UsIEFQUC50ZXh0dXJlUHJvamVjdGlvbk1hdHJpeCk7XHJcblxyXG4gICAgLy9SZW5kZXJkYW1lIGtvbG1udXJnYWQgaW5kZWtzaXRlIGrDpHJnaVxyXG4gICAgR0wuYmluZEJ1ZmZlcihHTC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgQVBQLmluZGV4QnVmZmVyKTtcclxuICAgIEdMLmRyYXdFbGVtZW50cyhHTC5UUklBTkdMRVMsIEFQUC5pbmRleEJ1ZmZlci5udW1iZXJPZkluZGV4ZXMsIEdMLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuXHJcbiAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBBUFAuRkJDb2xvclRleHR1cmUpO1xyXG4gICAgR0wuZ2VuZXJhdGVNaXBtYXAoR0wuVEVYVFVSRV8yRCk7XHJcbiAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBudWxsKTtcclxuXHJcbn1cclxuXHJcbi8vUmVuZGVyZGFtaW5lXHJcbmZ1bmN0aW9uIHJlbmRlcigpIHtcclxuXHJcbiAgICAvL1B1aGFzdGFtZSBrYSB2w6RydmktIGphIHPDvGdhdnVzcHVodnJpZCwgbmluZyBtw6TDpHJhbWUgdXVlIHB1aGFzdHV2w6RydnVzZS5cclxuICAgIC8vSGV0a2VsIHB1aGFzdGFtaW5lIG1pZGFnaSBlaSB0ZWUsIHNlc3QgbWUgcmVuZGVyZGFtZSB2YWlkIMO8aGUga29ycmEsIGt1aWQga3VpIG1lIHRzw7xra2xpcyBzZWRhIHRlZ2VtYVxyXG4gICAgLy9vbiBuw6RoYSBrYSwgbWlkYSBuYWQgdGVldmFkLlxyXG4gICAgR0wudmlld3BvcnQoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuICAgIEdMLmNsZWFyQ29sb3IoMC4wLCAwLjAsIDAuMCwgMS4wKTtcclxuICAgIEdMLmNsZWFyKEdMLkNPTE9SX0JVRkZFUl9CSVQgfCBHTC5ERVBUSF9CVUZGRVJfQklUKTtcclxuXHJcbiAgICAvL0zDvGxpdGFtZSBzaXNzZSBzw7xnYXZ1c3Rlc3RpXHJcbiAgICBHTC5lbmFibGUoR0wuREVQVEhfVEVTVCk7XHJcbiAgICBHTC5kZXB0aEZ1bmMoR0wuTEVTUyk7XHJcblxyXG4gICAgLy9TZW9tZSB0aXB1cHVodnJpIGphIG3DpMOkcmFtZSwga3VzIGFudHVkIHRpcHVhdHJpYnV1dCBhc3ViIGFudHVkIG1hc3NpaXZpcy5cclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuQVJSQVlfQlVGRkVSLCBBUFAudmVydGV4QnVmZmVyKTtcclxuICAgIEdMLnZlcnRleEF0dHJpYlBvaW50ZXIoQVBQLmFfUG9zaXRpb24sIDMsIEdMLkZMT0FULCBmYWxzZSwgQVBQLnZlcnRleFNpemUgKiA0LCAwKTtcclxuICAgIEdMLnZlcnRleEF0dHJpYlBvaW50ZXIoQVBQLmFfVGV4dHVyZUNvb3JkLCAyLCBHTC5GTE9BVCwgZmFsc2UsIEFQUC52ZXJ0ZXhTaXplICogNCwgQVBQLnZlcnRleFNpemUgKiA0IC0gMiAqIDQpO1xyXG5cclxuICAgIC8vQWt0aXZlZXJpbWUgYXRyaWJ1dWRpZFxyXG4gICAgR0wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoQVBQLmFfUG9zaXRpb24pO1xyXG4gICAgR0wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoQVBQLmFfVGV4dHVyZUNvb3JkKTtcclxuXHJcbiAgICAvL0FrdGl2ZWVyaW1lIGphIG3DpMOkcmFtZSB0ZWtzdHV1cmlcclxuICAgIEdMLmFjdGl2ZVRleHR1cmUoR0wuVEVYVFVSRTApO1xyXG4gICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgQVBQLkZCQ29sb3JUZXh0dXJlKTtcclxuICAgIEdMLnVuaWZvcm0xaShBUFAudV9UZXh0dXJlLCAwKTtcclxuXHJcbiAgICBzZXRNYXRlcmlhbFVuaWZvcm1zKCk7XHJcblxyXG4gICAgLy9WYWxndXNhbGxpa2EgbXV1dHVqYWRcclxuICAgIEdMLnVuaWZvcm0zZnYoQVBQLnVfRGlyZWN0aW9uYWxMaWdodC5jb2xvciwgQVBQLmRpcmVjdGlvbmFsTGlnaHQuY29sb3IpO1xyXG4gICAgR0wudW5pZm9ybTNmdihBUFAudV9EaXJlY3Rpb25hbExpZ2h0LmRpcmVjdGlvbiwgQVBQLmRpcmVjdGlvbmFsTGlnaHQuZGlyZWN0aW9uKTtcclxuXHJcbiAgICAvL1NhYWRhbWUgbWVpZSBtYWF0cmlrc2lkIGthIHZhcmp1bmRhamFzc2VcclxuICAgIEdMLnVuaWZvcm1NYXRyaXg0ZnYoQVBQLnVfTW9kZWxNYXRyaXgsIGZhbHNlLCBBUFAubW9kZWxNYXRyaXgpO1xyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9WaWV3TWF0cml4LCBmYWxzZSwgQVBQLnZpZXdNYXRyaXgpO1xyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9Qcm9qZWN0aW9uTWF0cml4LCBmYWxzZSwgQVBQLnByb2plY3Rpb25NYXRyaXgpO1xyXG5cclxuICAgIC8vUmVuZGVyZGFtZSBrb2xtbnVyZ2FkIGluZGVrc2l0ZSBqw6RyZ2lcclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIEFQUC5pbmRleEJ1ZmZlcik7XHJcbiAgICBHTC5kcmF3RWxlbWVudHMoR0wuVFJJQU5HTEVTLCBBUFAuaW5kZXhCdWZmZXIubnVtYmVyT2ZJbmRleGVzLCBHTC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcbn1cclxuXHJcbiIsIkxvb3BlciA9IGZ1bmN0aW9uKGRvbUVsZW1lbnQsIGNhbGxiYWNrKSB7XHJcbiAgICB0aGlzLmRvbUVsZW1lbnQgPSBkb21FbGVtZW50O1xyXG5cclxuICAgIHRoaXMubGFzdFRpbWUgPSAwO1xyXG4gICAgdGhpcy5kZWx0YVRpbWUgPSAwO1xyXG5cclxuICAgIHRoaXMucmVxdWVzdElkO1xyXG5cclxuICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcclxuXHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcbiAgICAgICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XHJcblxyXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZTtcclxufTtcclxuXHJcbkxvb3Blci5wcm90b3R5cGUgPSB7XHJcblxyXG4gICAgY29uc3RydWN0b3I6IExvb3BlcixcclxuXHJcbiAgICBjYWxjdWxhdGVEZWx0YVRpbWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciB0aW1lTm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgICAgIGlmKHRoaXMubGFzdFRpbWUgIT0gMClcclxuICAgICAgICAgICAgdGhpcy5kZWx0YVRpbWUgPSAodGltZU5vdyAtIHRoaXMubGFzdFRpbWUpIC8gMTY7XHJcblxyXG4gICAgICAgIHRoaXMubGFzdFRpbWUgPSB0aW1lTm93O1xyXG4gICAgfSxcclxuXHJcbiAgICBsb29wOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnJlcXVlc3RJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmxvb3AuYmluZCh0aGlzKSwgdGhpcy5kb21FbGVtZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVEZWx0YVRpbWUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLmRlbHRhVGltZSk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb29wZXI7IiwiLyoqXHJcbiAqIEhvaWFiIGVuZGFzIFdlYkdMUHJvZ3JhbSBvYmpla3RpIGphIFdlYkdMU2hhZGVyIHRpcHV2YXJqdW5kYWphdCBqYSBwaWtzbGl2YXJqdW5kYWphdFxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gdmVydGV4U2hhZGVyUGF0aFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRTaGFkZXJQYXRoXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG9uTGlua2VkIE1lZXRvZCwgbWlzIGt1dHN1dGFrc2UgdsOkbGphLCBrdWkgdmFyanVuZGFqYWQgb24gbGFldHVkXHJcbiAqIEBjbGFzc1xyXG4gKi9cclxudmFyIFByb2dyYW1PYmplY3QgPSBmdW5jdGlvbih2ZXJ0ZXhTaGFkZXJQYXRoLCBmcmFnbWVudFNoYWRlclBhdGgsIG9uTGlua2VkKSB7XHJcbiAgICB0aGlzLnByb2dyYW0gPSBHTC5jcmVhdGVQcm9ncmFtKCk7XHJcblxyXG4gICAgdGhpcy5vbkxpbmtlZCA9IG9uTGlua2VkO1xyXG5cclxuICAgIHRoaXMudmVydGV4U2hhZGVyID0ge1xyXG4gICAgICAgIFwic2hhZGVyXCI6IEdMLmNyZWF0ZVNoYWRlcihHTC5WRVJURVhfU0hBREVSKSxcclxuICAgICAgICBcInBhdGhcIjogdmVydGV4U2hhZGVyUGF0aCxcclxuICAgICAgICBcInNyY1wiOiBcIlwiLFxyXG4gICAgICAgIFwiY29tcGxldGVkXCI6IGZhbHNlXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB7XHJcbiAgICAgICAgXCJzaGFkZXJcIjogR0wuY3JlYXRlU2hhZGVyKEdMLkZSQUdNRU5UX1NIQURFUiksXHJcbiAgICAgICAgXCJwYXRoXCI6IGZyYWdtZW50U2hhZGVyUGF0aCxcclxuICAgICAgICBcInNyY1wiOiBcIlwiLFxyXG4gICAgICAgIFwiY29tcGxldGVkXCI6IGZhbHNlXHJcbiAgICB9O1xyXG59O1xyXG5cclxuUHJvZ3JhbU9iamVjdC5wcm90b3R5cGUgPSB7XHJcblxyXG4gICAgY29uc3RydWN0b3I6IFByb2dyYW1PYmplY3QsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsYmFjayBtZWV0b2QsIG1pcyBrb21waWxlZXJpYiBqYSBzw6R0ZXN0YWIgdmFyanVuZGFqYWQsIGt1aSBtw7VsZW1hZCBvbiBhc8O8bmtyb29uc2VsdCBsYWV0dWRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3JjIEzDpGh0ZWtvb2QsIG1pcyBBSkFYJ2kgYWJpbCBsYWV0aVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggVGVlLCBtaWxsZSBhYmlsIHR1dmFzdGFkYSwga3VtbWEgdmFyanVuZGFqYSBsw6RodGVrb29kIG9uIGxhZXR1ZFxyXG4gICAgICovXHJcbiAgICBvbmNvbXBsZXRlOiBmdW5jdGlvbihzcmMsIHBhdGgpIHtcclxuICAgICAgICBpZihwYXRoID09PSB0aGlzLnZlcnRleFNoYWRlci5wYXRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVydGV4U2hhZGVyLmNvbXBsZXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMudmVydGV4U2hhZGVyLnNyYyA9IHNyYztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZihwYXRoID09PSB0aGlzLmZyYWdtZW50U2hhZGVyLnBhdGgpIHtcclxuICAgICAgICAgICAgdGhpcy5mcmFnbWVudFNoYWRlci5jb21wbGV0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmZyYWdtZW50U2hhZGVyLnNyYyA9IHNyYztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHRoaXMudmVydGV4U2hhZGVyLmNvbXBsZXRlZCAmJiB0aGlzLmZyYWdtZW50U2hhZGVyLmNvbXBsZXRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBpbGVTaGFkZXIodGhpcy52ZXJ0ZXhTaGFkZXIuc2hhZGVyLCB0aGlzLnZlcnRleFNoYWRlci5zcmMpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBpbGVTaGFkZXIodGhpcy5mcmFnbWVudFNoYWRlci5zaGFkZXIsIHRoaXMuZnJhZ21lbnRTaGFkZXIuc3JjKTtcclxuXHJcbiAgICAgICAgICAgIEdMLmF0dGFjaFNoYWRlcih0aGlzLnByb2dyYW0sIHRoaXMudmVydGV4U2hhZGVyLnNoYWRlcik7XHJcbiAgICAgICAgICAgIEdMLmF0dGFjaFNoYWRlcih0aGlzLnByb2dyYW0sIHRoaXMuZnJhZ21lbnRTaGFkZXIuc2hhZGVyKTtcclxuXHJcbiAgICAgICAgICAgIEdMLmxpbmtQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XHJcblxyXG4gICAgICAgICAgICBpZighR0wuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLnByb2dyYW0sIEdMLkxJTktfU1RBVFVTKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFcnJvciBsaW5raW5nIHNoYWRlciBwcm9ncmFtOiBcXFwiXCIgKyBHTC5nZXRQcm9ncmFtSW5mb0xvZyh0aGlzLnByb2dyYW0pICsgXCJcXFwiXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZih0eXBlb2YgdGhpcy5vbkxpbmtlZCAhPSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5vbkxpbmtlZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDDnHJpdGFiIGtvbXBpbGVlcmlkYSB2YXJqdW5kYWphXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtXZWJHTFNoYWRlcn0gc2hhZGVyIFZhcmp1bmRhamEgbWlkYSBrb21waWxlZXJpZGFcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2UgTMOkaHRla29vZCwgbWlkYSBrb21waWxlZXJpZGFcclxuICAgICAqL1xyXG4gICAgY29tcGlsZVNoYWRlcjogZnVuY3Rpb24oc2hhZGVyLCBzb3VyY2UpIHtcclxuICAgICAgICBHTC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzb3VyY2UpO1xyXG4gICAgICAgIEdMLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcclxuXHJcbiAgICAgICAgaWYgKCFHTC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBHTC5DT01QSUxFX1NUQVRVUykpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJTaGFkZXIgY29tcGlsYXRpb24gZmFpbGVkLiBFcnJvcjogXFxcIlwiICsgR0wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpICsgXCJcXFwiXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBBbnR1ZCBrbGFzc2kgYWJpbCBvbiB2w7VpbWFsaWsgcHJvZ3JhbW1pIGxhYWRpZGEgamEgYXPDvG5rcm9vbnNlbHQgdGFnYXBpbGRpbCBzcGV0c2lmaXRzZWVyaXR1ZCB2YXJqdW5kYWphZFxyXG4gKiB0YWdhc3RhdHVkIHByb2dyYW1taWdhIHNpZHVkYVxyXG4gKlxyXG4gKiBAY2xhc3MgU2hhZGVyUHJvZ3JhbUxvYWRlclxyXG4gKi9cclxudmFyIFNoYWRlclByb2dyYW1Mb2FkZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuY29udGFpbmVyID0gW107XHJcbiAgICB0aGlzLmNvdW50ZXIgPSAtMTtcclxufTtcclxuXHJcblNoYWRlclByb2dyYW1Mb2FkZXIucHJvdG90eXBlID0ge1xyXG4gICAgY29uc3RydWN0b3I6IFNoYWRlclByb2dyYW1Mb2FkZXIsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUYWdhc3RhYiBwcm9ncmFtbSBvYmpla3RpLiBBc8O8bmtyb29uc2VsdCB0YWdhcGxhYW5pbCBsYWV0YWtzZSBqYSBrb21waWxlZXJpdGFrc2UgdmFyanVuZGFqYWQuIEVubmUga3VpXHJcbiAgICAgKiBwcm9ncmFtbWkga2FzdXRhZGEgdHVsZWIga29udHJvbGxpZGEsIGV0IHZhcmp1bmRhamFkIG9uIGtvbXBpbGVlcml0dWQgamEgcHJvZ3JhbW1pZ2Egc2VvdHVkLiBWw7VpbWFsaWsgb25cclxuICAgICAqIHBhcmFtZWV0cmlrcyBhbmRhIGthIENhbGxiYWNrIGZ1bmt0c2lvb24sIG1pcyB0ZWFkYSBhbm5hYiwga3VpIHZhcmp1bmRhamFkIG9uIHNlb3R1ZC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdmVydGV4U2hhZGVyUGF0aCBUZWUsIHRpcHV2YXJqdW5kYWphIGp1dXJkZVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50U2hhZGVyUGF0aCBUZWUsIHBpa3NsaXZhcmp1bmRhamEganV1cmRlXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsaW5rZWRDYWxsYmFjayBGdW5rdHNpb29uLCBtaXMga3V0c3V0YWtzZSB2w6RsamEsIGt1aSB2YXJqdW5kYWphZCBvbiBrb21waWxlZXJpdHVkIGphIHNlb3R1ZCBwcm9ncmFtbWlnYVxyXG4gICAgICogQHJldHVybnMge2V4cG9ydHMuZGVmYXVsdE9wdGlvbnMucHJvZ3JhbXwqfFdlYkdMUHJvZ3JhbXxQcm9ncmFtT2JqZWN0LnByb2dyYW19XHJcbiAgICAgKi9cclxuICAgIGdldFByb2dyYW06IGZ1bmN0aW9uKHZlcnRleFNoYWRlclBhdGgsIGZyYWdtZW50U2hhZGVyUGF0aCwgbGlua2VkQ2FsbGJhY2spIHtcclxuICAgICAgICB0aGlzLmNvdW50ZXIrKztcclxuICAgICAgICB0aGlzLmNvbnRhaW5lclt0aGlzLmNvdW50ZXJdID0gbmV3IFByb2dyYW1PYmplY3QodmVydGV4U2hhZGVyUGF0aCwgZnJhZ21lbnRTaGFkZXJQYXRoLCBsaW5rZWRDYWxsYmFjayk7XHJcbiAgICAgICAgdmFyIHByb2dyYW0gPSB0aGlzLmNvbnRhaW5lclt0aGlzLmNvdW50ZXJdO1xyXG5cclxuICAgICAgICB0aGlzLmxvYWRBc3luY1NoYWRlclNvdXJjZSh2ZXJ0ZXhTaGFkZXJQYXRoLCBwcm9ncmFtLm9uY29tcGxldGUuYmluZChwcm9ncmFtKSk7XHJcbiAgICAgICAgdGhpcy5sb2FkQXN5bmNTaGFkZXJTb3VyY2UoZnJhZ21lbnRTaGFkZXJQYXRoLCBwcm9ncmFtLm9uY29tcGxldGUuYmluZChwcm9ncmFtKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9ncmFtLnByb2dyYW07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTGFlYiBhc8O8bmtyb29uc2VsdCBsw6RodGVrb29kaVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzaGFkZXJQYXRoIFRlZSwga3VzIGFzdWIgdmFyanVuZGFqYVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgRnVua3RzaW9vbiwgbWlzIGvDpGl2aXRhdGFrc2UsIGt1aSBsw6RodGVrb29kIG9uIGvDpHR0ZSBzYWFkdWQuIFNhYWRldGFrc2UgdmFzdHVzIGphIHRlZS5cclxuICAgICAqL1xyXG4gICAgbG9hZEFzeW5jU2hhZGVyU291cmNlOiBmdW5jdGlvbihzaGFkZXJQYXRoLCBjYWxsYmFjaykge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIGFzeW5jOiB0cnVlLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJ0ZXh0XCIsXHJcbiAgICAgICAgICAgIHVybDogc2hhZGVyUGF0aCxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZXN1bHQsIHNoYWRlclBhdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQcm9ncmFtT2JqZWN0O1xyXG5tb2R1bGUuZXhwb3J0cyA9IFNoYWRlclByb2dyYW1Mb2FkZXI7Il19
