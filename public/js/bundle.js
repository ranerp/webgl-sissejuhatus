(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\prog\\webglstudy\\lessons\\lesson05\\main.js":[function(require,module,exports){
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////Antud osa tegeleb WebGL konteksti loomisega ja meile vajaliku WebGLProgram objekti loomisega ///////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ShaderProgramLoader = require("./../utils/shaderprogramloader");
var Looper = require("./../utils/looper");

//Varjundajate kataloog
var SHADER_PATH = "shaders/lesson05/";

//Tekstuuri asukoht
var TEXTURE_PATH = "assets/download.jpg";

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

    APP.texture = GL.createTexture();
    var image = new Image();

    image.onload = function() {
        GL.bindTexture(GL.TEXTURE_2D, APP.texture);
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGB, GL.RGB,  GL.UNSIGNED_BYTE, image);
        GL.texParameterf(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.REPEAT);
        GL.texParameterf(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.REPEAT);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
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
},{}]},{},["C:\\prog\\webglstudy\\lessons\\lesson05\\main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibGVzc29ucy9sZXNzb24wNS9tYWluLmpzIiwibGVzc29ucy91dGlscy9sb29wZXIuanMiLCJsZXNzb25zL3V0aWxzL3NoYWRlcnByb2dyYW1sb2FkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vL0FudHVkIG9zYSB0ZWdlbGViIFdlYkdMIGtvbnRla3N0aSBsb29taXNlZ2EgamEgbWVpbGUgdmFqYWxpa3UgV2ViR0xQcm9ncmFtIG9iamVrdGkgbG9vbWlzZWdhIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbnZhciBTaGFkZXJQcm9ncmFtTG9hZGVyID0gcmVxdWlyZShcIi4vLi4vdXRpbHMvc2hhZGVycHJvZ3JhbWxvYWRlclwiKTtcclxudmFyIExvb3BlciA9IHJlcXVpcmUoXCIuLy4uL3V0aWxzL2xvb3BlclwiKTtcclxuXHJcbi8vVmFyanVuZGFqYXRlIGthdGFsb29nXHJcbnZhciBTSEFERVJfUEFUSCA9IFwic2hhZGVycy9sZXNzb24wNS9cIjtcclxuXHJcbi8vVGVrc3R1dXJpIGFzdWtvaHRcclxudmFyIFRFWFRVUkVfUEFUSCA9IFwiYXNzZXRzL2Rvd25sb2FkLmpwZ1wiO1xyXG5cclxuLy9FbGVtZW50LCBrdWh1IHJlbmRlcmRhbWVcclxudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG5cclxuLy9Mb29tZSBnbG9iYWFsc2UgV2ViR0wga29udGVrc3RpXHJcbkdMID0gaW5pdFdlYkdMKGNhbnZhcyk7XHJcblxyXG4vL1NlYWRpc3RhbWUgcmVuZGVyZGFtaXNyZXNvbHV0c2lvb25pXHJcbkdMLnZpZXdwb3J0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcbkdMLnZpZXdwb3J0V2lkdGggPSBjYW52YXMud2lkdGg7XHJcbkdMLnZpZXdwb3J0SGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcclxuXHJcbi8vTG9vbWUgdXVlIHByb2dyYW1taSBzcGV0c2lmaXRzZWVyaXR1ZCB2YXJqdW5kYWphdGVnYS4gS3VuYSBsYWFkaW1pbmUgb24gYXPDvG5rcm9vbm5lLCBzaWlzIGFubmFtZSBrYWFzYSBrYVxyXG4vL21lZXRvZGksIG1pcyBrdXRzdXRha3NlIHbDpGxqYSBrdWkgdmFyanVuZGFqYWQgb24gbGFldHVkXHJcbnZhciBzaGFkZXJQcm9ncmFtTG9hZGVyID0gbmV3IFNoYWRlclByb2dyYW1Mb2FkZXIoKTtcclxudmFyIHNoYWRlclByb2dyYW0gPSBzaGFkZXJQcm9ncmFtTG9hZGVyLmdldFByb2dyYW0oU0hBREVSX1BBVEggKyBcInZlcnRleC5zaGFkZXJcIiwgU0hBREVSX1BBVEggKyBcImZyYWdtZW50LnNoYWRlclwiLCBzaGFkZXJzTG9hZGVkKTtcclxuXHJcblxyXG4vL8Occml0YW1lIGx1dWEgV2ViR0wga29udGVrc3RpXHJcbmZ1bmN0aW9uIGluaXRXZWJHTChjYW52YXMpIHtcclxuICAgIHZhciBnbCA9IG51bGw7XHJcblxyXG4gICAgdHJ5IHtcclxuXHJcbiAgICAgICAgLy/DnHJpdGFtZSBsdXVhIHRhdmFsaXN0IGtvbnRla3N0aSwga3VpIHNlZSBlYmHDtW5uZXN0dWIgw7xyaXRhbWUgbHV1YSBla3NwZXJpbWVudGFhbHNldCxcclxuICAgICAgICAvL01pZGEga2FzdXRhdGFrc2Ugc3BldHNpZmlrYXRzaW9vbmkgYXJlbmRhbWlzZWtzXHJcbiAgICAgICAgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpIHx8IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIpO1xyXG5cclxuICAgIH0gY2F0Y2ggKGUpIHt9XHJcblxyXG4gICAgaWYoIWdsKSB7XHJcbiAgICAgICAgYWxlcnQoXCJVbmFibGUgdG8gaW5pdGlsaXplIFdlYkdMLiBZb3VyIGJyb3dzZXIgbWF5IG5vdCBzdXBwb3J0IGl0LlwiKTtcclxuICAgICAgICB0aHJvdyBFcnJvcihcIkV4ZWN1dGlvbiB0ZXJtaW5hdGVkLiBObyBXZWJHTCBjb250ZXh0XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBnbDtcclxufVxyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIExFU1NPTjA1IC0gVEVLU1RVVVIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxudmFyIEFQUCA9IHt9O1xyXG5cclxuQVBQLmxvb3BlciA9IG5ldyBMb29wZXIoY2FudmFzLCBsb29wKTtcclxuXHJcbi8vS3V0c3V0YWtzZSBrdWkgdmFyanVuZGFqYWQgb24gbGFldHVkXHJcbmZ1bmN0aW9uIHNoYWRlcnNMb2FkZWQoKSB7XHJcbiAgICBzZXR1cEFuZExvYWRUZXh0dXJlKCk7XHJcbiAgICBzZXR1cCgpO1xyXG5cclxuICAgIEFQUC5sb29wZXIubG9vcCgpO1xyXG59XHJcblxyXG4vL1Rla3N0dXVyaSBpbml0c2lhbGlzZWVyaW1pbmUgamEgbGFhZGltaW5lXHJcbmZ1bmN0aW9uIHNldHVwQW5kTG9hZFRleHR1cmUoKSB7XHJcblxyXG4gICAgQVBQLnRleHR1cmUgPSBHTC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuXHJcbiAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBBUFAudGV4dHVyZSk7XHJcbiAgICAgICAgR0wudGV4SW1hZ2UyRChHTC5URVhUVVJFXzJELCAwLCBHTC5SR0IsIEdMLlJHQiwgIEdMLlVOU0lHTkVEX0JZVEUsIGltYWdlKTtcclxuICAgICAgICBHTC50ZXhQYXJhbWV0ZXJmKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfV1JBUF9TLCBHTC5SRVBFQVQpO1xyXG4gICAgICAgIEdMLnRleFBhcmFtZXRlcmYoR0wuVEVYVFVSRV8yRCwgR0wuVEVYVFVSRV9XUkFQX1QsIEdMLlJFUEVBVCk7XHJcbiAgICAgICAgR0wudGV4UGFyYW1ldGVyaShHTC5URVhUVVJFXzJELCBHTC5URVhUVVJFX01BR19GSUxURVIsIEdMLk5FQVJFU1QpO1xyXG4gICAgICAgIEdMLnRleFBhcmFtZXRlcmkoR0wuVEVYVFVSRV8yRCwgR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBHTC5ORUFSRVNUKTtcclxuICAgICAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBudWxsKTtcclxuICAgIH07XHJcbiAgICBpbWFnZS5zcmMgPSBURVhUVVJFX1BBVEg7XHJcblxyXG59XHJcblxyXG4vL0xvb2IgcHVodnJpZCBqYSBtYWF0cmlrc2lkLiBUw6RpZGFiIHB1aHZyaWQgYW5kbWV0ZWdhLlxyXG5mdW5jdGlvbiBzZXR1cCgpIHtcclxuICAgIC8vVGVlbWUgbXV1dHVqYSwga3VodSBzYWx2ZXN0YWRhIGFlZ2EsIGV0IGthYW1lcmF0IGFqYSBtw7bDtmR1ZGVzIMO8bWJlciBvYmpla3RpIHDDtsO2cmF0YVxyXG4gICAgQVBQLnRpbWUgPSAwO1xyXG5cclxuICAgIC8vTXVkZWxtYWF0cmlrcywgbWlsbGVnYSBvYmpla3RpcnV1bWlzdCBtYWFpbG1hcnV1bWkgc2FhZGFcclxuICAgIEFQUC5tb2RlbE1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcblxyXG4gICAgLy9QdW5rdCwga3VzIG9iamVrdCBoZXRrZWwgYXN1YlxyXG4gICAgQVBQLm9iamVjdEF0ID0gWzAuMCwgMC4wLCAtNS4wXTtcclxuXHJcbiAgICAvL0thc3V0YWRlcyB0cmFuc2xhdHNpb29uaSwgc2FhbWUgbXVkZWxtYWF0cmlrc2lnYSBvYmpla3RpIGxpaWd1dGFkYVxyXG4gICAgbWF0NC50cmFuc2xhdGUoQVBQLm1vZGVsTWF0cml4LCBBUFAubW9kZWxNYXRyaXgsIEFQUC5vYmplY3RBdCk7XHJcblxyXG4gICAgLy9LYWFtZXJhbWFhdHJpa3MsIG1pbGxlZ2EgbWFhaWxtYXJ1dW1pc3Qga2FhbWVyYXJ1dW1pIHNhYWRhXHJcbiAgICBBUFAudmlld01hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcblxyXG4gICAgLy9EZWZpbmVlcmltZSB2ZWt0b3JpZCwgbWlsbGUgYWJpbCBvbiB2w7VpbWFsaWsga2FhbWVyYXJ1dW1pIGJhYXN2ZWt0b3JpZCBhcnZ1dGFkYVxyXG4gICAgQVBQLmNhbWVyYUF0ID0gWzAsIDAsIDVdOyAgICAgICAgICAgIC8vQXN1YiBtYWFpbG1hcnV1bWlzIG5lbmRlbCBrb29yZGluYWF0aWRlbFxyXG4gICAgQVBQLmxvb2tBdCA9IFswLCAwLCAtMV07ICAgICAgICAgICAgIC8vTWlzIHN1dW5hcyBrYWFtZXJhIHZhYXRhYi4gUGFyZW1ha8OkZSBrb29yZGluYWF0c8O8c3RlZW1pcyBvbiAteiBla3JhYW5pIHNpc3NlXHJcbiAgICBBUFAudXAgPSBbMCwgMSwgMF07ICAgICAgICAgICAgICAgICAgLy9WZWt0b3IsIG1pcyBuw6RpdGFiLCBrdXMgb24ga2FhbWVyYSDDvGxlc3NlIHN1dW5kYSBuw6RpdGF2IHZla3RvclxyXG5cclxuICAgIC8vS2Fsa3VsZWVyaW1lIGFudHVkIGtvb3JkaW5hYXRpZGUgasOkcmdpIGthYW1lcmFtYWF0cmlrc2lcclxuICAgIG1hdDQubG9va0F0KEFQUC52aWV3TWF0cml4LCBBUFAuY2FtZXJhQXQsQVBQLmxvb2tBdCwgQVBQLnVwKTtcclxuXHJcbiAgICAvL1Byb2pla3RzaW9vbmltYWF0cmlrcywgZXQgcMO8Z2FtaXNydXVtaSBzYWFkYS4gS2FzdXRhZGVzIGdsTWF0cml4IHRlZWtpIGdlbmVyZWVyaW1lIGthIHDDvHJhbWlpZGksIGt1aHUgc2lzc2Ugb2JqZWt0aWQgbMOkaGV2YWQuXHJcbiAgICBBUFAucHJvamVjdGlvbk1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgICBtYXQ0LnBlcnNwZWN0aXZlKEFQUC5wcm9qZWN0aW9uTWF0cml4LCA0NS4wLCBHTC52aWV3cG9ydFdpZHRoIC8gR0wudmlld3BvcnRIZWlnaHQsIDEuMCwgMTAwMC4wKTtcclxuXHJcblxyXG5cclxuXHJcbiAgICAvL1RpcHB1ZGUgYW5kbWVkLiBUaXB1IGtvb3JkaW5hYWRpZCB4LCB5LCB6IGphIHRla3N0dXVyaSBrb29yZGluYWFkaWQgdSwgdlxyXG4gICAgQVBQLm15VmVydGljZXNEYXRhID0gW1xyXG4gICAgICAgIC8vRXNpbWVuZSBrw7xsZ1xyXG4gICAgICAgIC0xLjAsIC0xLjAsICAxLjAsICAwLjAsIDEuMCwgICAgICAgICAgICAvL0FMVU1JTkUgVkFTQUsgTlVSS1xyXG4gICAgICAgICAxLjAsIC0xLjAsICAxLjAsICAxLjAsIDEuMCwgICAgICAgICAgICAvL0FMVU1JTkUgUEFSRU0gTlVSS1xyXG4gICAgICAgICAxLjAsICAxLjAsICAxLjAsICAxLjAsIDAuMCwgICAgICAgICAgICAvL8OcTEVNSU5FIFBBUkVNIE5VUktcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMS4wLCAgMC4wLCAwLjAsICAgICAgICAgICAgLy/DnExFTUlORSBWQVNBSyBOVVJLXHJcblxyXG4gICAgICAgIC8vVGFndW1pbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAtMS4wLCAgMC4wLCAxLjAsXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgLTEuMCwgIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgLTEuMCwgICAxLjAsIDAuMCxcclxuICAgICAgICAxLjAsIC0xLjAsIC0xLjAsICAgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vw5xsZW1pbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAgMS4wLCAtMS4wLCAgMC4wLCAxLjAsXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgIDEuMCwgIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgIDEuMCwgICAgMS4wLCAwLjAsXHJcbiAgICAgICAgMS4wLCAgMS4wLCAtMS4wLCAgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vQWx1bWluZSBrw7xsZ1xyXG4gICAgICAgIC0xLjAsIC0xLjAsIC0xLjAsIDAuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgLTEuMCwgLTEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAgMS4wLCAgMS4wLCAwLjAsXHJcbiAgICAgICAgLTEuMCwgLTEuMCwgIDEuMCwgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vUGFyZW0ga8O8bGdcclxuICAgICAgICAxLjAsIC0xLjAsIC0xLjAsIDAuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgLTEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAgMS4wLCAgMS4wLCAgMS4wLCAwLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAgMS4wLCAwLjAsIDAuMCxcclxuXHJcbiAgICAgICAgLy9WYXNhayBrw7xsZ1xyXG4gICAgICAgIC0xLjAsIC0xLjAsIC0xLjAsIDAuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsIC0xLjAsICAxLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsICAxLjAsICAxLjAsICAxLjAsIDAuMCxcclxuICAgICAgICAtMS4wLCAgMS4wLCAtMS4wLCAwLjAsIDAuMCxcclxuICAgIF07XHJcbiAgICBBUFAudmVydGV4U2l6ZSA9IDU7XHJcblxyXG4gICAgLy9Mb29tZSBwdWh2cmksIGt1aHUgdGlwdWFuZG1lZCB2aWlhLiBTZW9tZSBrYSBhbnR1ZCBwdWh2cmkga29udGVrc3RpZ2EsIGV0IHRlbWFsZSBrw6Rza2UgZWRhc2kgYW5kYVxyXG4gICAgQVBQLnZlcnRleEJ1ZmZlciA9IEdMLmNyZWF0ZUJ1ZmZlcigpO1xyXG5cclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuQVJSQVlfQlVGRkVSLCBBUFAudmVydGV4QnVmZmVyKTtcclxuXHJcbiAgICAvL0FubmFtZSBsb29kdWQgcHVodnJpbGUgYW5kbWVkXHJcbiAgICBHTC5idWZmZXJEYXRhKEdMLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShBUFAubXlWZXJ0aWNlc0RhdGEpLCBHTC5TVEFUSUNfRFJBVyk7XHJcblxyXG4gICAgLy9UaXBwdWRlIGluZGVrc2lkXHJcbiAgICBBUFAubXlJbmRpY2VzRGF0YSA9IFtcclxuICAgICAgICAwLCAxLCAyLCAgICAgIDAsIDIsIDMsICAgIC8vIEVzaW1lbmUga8O8bGdcclxuICAgICAgICA0LCA1LCA2LCAgICAgIDQsIDYsIDcsICAgIC8vIFRhZ3VtaW5lIGvDvGxnXHJcbiAgICAgICAgOCwgOSwgMTAsICAgICA4LCAxMCwgMTEsICAvLyDDnGxlbWluZSBrw7xsZ1xyXG4gICAgICAgIDEyLCAxMywgMTQsICAgMTIsIDE0LCAxNSwgLy8gQWx1bWluZSBrw7xsZ1xyXG4gICAgICAgIDE2LCAxNywgMTgsICAgMTYsIDE4LCAxOSwgLy8gUGFyZW0ga8O8bGdcclxuICAgICAgICAyMCwgMjEsIDIyLCAgIDIwLCAyMiwgMjMgIC8vIFZhc2FrIGvDvGxnXHJcbiAgICBdO1xyXG5cclxuICAgIC8vTG9vbWUgcHVodnJpLCBrdWh1IGluZGVrc2lkIHZpaWEuIFNlb21lIGthIGFudHVkIHB1aHZyaSBrb250ZWtzdGlnYSwgZXQgdGVtYWxlIGvDpHNrZSBlZGFzaSBhbmRhXHJcbiAgICBBUFAuaW5kZXhCdWZmZXIgPSBHTC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIEFQUC5pbmRleEJ1ZmZlci5udW1iZXJPZkluZGV4ZXMgPSAzNjtcclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIEFQUC5pbmRleEJ1ZmZlcik7XHJcblxyXG4gICAgLy9Bbm5hbWUgbG9vZHVkIHB1aHZyaWxlIGFuZG1lZFxyXG4gICAgR0wuYnVmZmVyRGF0YShHTC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IFVpbnQxNkFycmF5KEFQUC5teUluZGljZXNEYXRhKSwgR0wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgIC8vTcOkw6RyYW1lIHByb2dyYW1taSwgbWlkYSBtZSByZW5kZXJkYW1pc2VsIGthc3V0YWRhIHRhaGFtZVxyXG4gICAgR0wudXNlUHJvZ3JhbShzaGFkZXJQcm9ncmFtKTtcclxuXHJcbiAgICAvL1NhYW1lIGluZGVrc2ksIG1pcyBuw6RpdGFiIGt1cyBhc3ViIG1laWUgcHJvZ3JhbW1pcyBrYXN1dGF0YXZhcyB0aXB1dmFyanVuZGFqYXNcclxuICAgIC8vb2xldiB0aXB1YXRyaWJ1dXQgbmltZWdhIGFfVmVydGV4UG9zaXRpb25cclxuICAgIEFQUC5hX1Bvc2l0aW9uID0gR0wuZ2V0QXR0cmliTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJhX1Bvc2l0aW9uXCIpO1xyXG5cclxuICAgIC8vU2FhbWUgdsOkcnZpYXRyaWJ1dWRpIGFzdWtvaGFcclxuICAgIEFQUC5hX1RleHR1cmVDb29yZCA9IEdMLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYV9UZXh0dXJlQ29vcmRcIik7XHJcblxyXG4gICAgLy9TYWFtZSDDvGh0c2V0ZSBtdXV0dWphdGUgYXN1a29oYWRcclxuICAgIEFQUC51X01vZGVsTWF0cml4ID0gR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9Nb2RlbE1hdHJpeFwiKTtcclxuICAgIEFQUC51X1ZpZXdNYXRyaXggPSBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X1ZpZXdNYXRyaXhcIik7XHJcbiAgICBBUFAudV9Qcm9qZWN0aW9uTWF0cml4ID0gR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9Qcm9qZWN0aW9uTWF0cml4XCIpO1xyXG4gICAgQVBQLnVfVGV4dHVyZSA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfVGV4dHVyZVwiKTtcclxufVxyXG5cclxuLy9LdXRzdXRha3NlIHbDpGxqYSBMb29wZXIgb2JqZWt0aXMgaWdhIGthYWRlclxyXG5mdW5jdGlvbiBsb29wKGRlbHRhVGltZSkge1xyXG4gICAgdXBkYXRlKGRlbHRhVGltZSk7XHJcblxyXG4gICAgcmVuZGVyKCk7XHJcbn1cclxuXHJcbi8vVXVlbmRhYiBhbmRtZWlkLCBldCBvbGVrcyB2w7VpbWFsaWsgc3RzZWVuIGxpaWt1bWEgcGFubmFcclxuZnVuY3Rpb24gdXBkYXRlKGRlbHRhVGltZSkge1xyXG4gICAgQVBQLnRpbWUgKz0gZGVsdGFUaW1lIC8gMTAwO1xyXG5cclxuICAgdXBkYXRlQ2FtZXJhKCk7XHJcbiAgIHVwZGF0ZU9iamVjdCgpO1xyXG59XHJcblxyXG4vL1V1ZW5kYWIga2FhbWVyYXQsIGV0IHNlZGEgb2xla3MgdsO1aW1hbGlrIMO8bWJlciBvYmpla3RpIHDDtsO2cmF0YVxyXG5mdW5jdGlvbiB1cGRhdGVDYW1lcmEoKSB7XHJcbiAgICB2YXIgcmFkaXVzID0gNTtcclxuICAgIHZhciBjYW1lcmFIZWlnaHQgPSAwO1xyXG5cclxuICAgIC8vTGVpYW1lIHV1ZSBwb3NpdHNpb29uaSwgbWlzIGFqYXMgbGlpZ3ViIHBvbGFhcnNlcyBrb29yZGluYWF0c8O8c3RlZW1pcyBqYSBtaWxsZSB0ZWlzZW5kYW1lIHJpc3Rrb29yZGluYWF0c8O8c3RlZW1pXHJcbiAgICBBUFAuY2FtZXJhQXQgPSBbQVBQLm9iamVjdEF0WzBdICsgcmFkaXVzICogTWF0aC5jb3MoQVBQLnRpbWUpLCAgICAgICAvLyBYXHJcbiAgICAgICAgICAgICAgICAgICAgIGNhbWVyYUhlaWdodCArIEFQUC5vYmplY3RBdFsxXSwgICAgICAgICAgICAgICAgICAgICAvLyBZXHJcbiAgICAgICAgICAgICAgICAgICAgIEFQUC5vYmplY3RBdFsyXSArIHJhZGl1cyAqIE1hdGguc2luKEFQUC50aW1lKV07ICAgICAvLyBaXHJcblxyXG4gICAgLy9MZWlhbWUgc3V1bmF2ZWt0b3JpLCBrYWFtZXJhc3Qgb2JqZWt0aW5pXHJcbiAgICB2YXIgbG9va0RpcmVjdGlvbiA9IFtBUFAub2JqZWN0QXRbMF0gLSBBUFAuY2FtZXJhQXRbMF0sICAgICAgICAgICAgICAgLy8gWFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgQVBQLm9iamVjdEF0WzFdIC0gQVBQLmNhbWVyYUF0WzFdLCAgICAgICAgICAgICAgIC8vIFlcclxuICAgICAgICAgICAgICAgICAgICAgICAgIEFQUC5vYmplY3RBdFsyXSAtIEFQUC5jYW1lcmFBdFsyXV07ICAgICAgICAgICAgICAvLyBaXHJcblxyXG4gICAgLy9MZWlhbWUgcHVua3RpLCBtaWRhIGthYW1lcmEgdmFhdGFiXHJcbiAgICB2ZWMzLmFkZChBUFAubG9va0F0LCBBUFAuY2FtZXJhQXQsIGxvb2tEaXJlY3Rpb24pO1xyXG5cclxuXHJcbiAgICAvL1V1ZW5kYW1lIGthYW1lcmFtYWF0cmlrc2l0XHJcbiAgICBtYXQ0Lmxvb2tBdChBUFAudmlld01hdHJpeCwgQVBQLmNhbWVyYUF0LCBBUFAubG9va0F0LCBBUFAudXApO1xyXG5cclxuXHJcbn1cclxuXHJcbi8vdXVlbmRhbWUgb2JqZWt0aVxyXG5mdW5jdGlvbiB1cGRhdGVPYmplY3QoKSB7XHJcbiAgICBtYXQ0LnJvdGF0ZVgoQVBQLm1vZGVsTWF0cml4LCBBUFAubW9kZWxNYXRyaXgsIDAuMDA1KTtcclxufVxyXG5cclxuLy9SZW5kZXJkYW1pbmVcclxuZnVuY3Rpb24gcmVuZGVyKCkge1xyXG5cclxuICAgIC8vUHB1aGFzdGFtZSBrYSB2w6RydmktIGphIHPDvGdhdnVzcHVodnJpZCwgbmluZyBtw6TDpHJhbWUgdXVlIHB1aGFzdHV2w6RydnVzZS5cclxuICAgIC8vSGV0a2VsIHB1aGFzdGFtaW5lIG1pZGFnaSBlaSB0ZWUsIHNlc3QgbWUgcmVuZGVyZGFtZSB2YWlkIMO8aGUga29ycmEsIGt1aWQga3VpIG1lIHRzw7xra2xpcyBzZWRhIHRlZ2VtYVxyXG4gICAgLy9vbiBuw6RoYSBrYSwgbWlkYSBuYWQgdGVldmFkLlxyXG4gICAgR0wuY2xlYXJDb2xvcigwLjUsIDAuNSwgMC41LCAxLjApO1xyXG4gICAgR0wuY2xlYXIoR0wuQ09MT1JfQlVGRkVSX0JJVCB8IEdMLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgIC8vTMO8bGl0YW1lIHNpc3NlIHPDvGdhdnVzdGVzdGlcclxuICAgIEdMLmVuYWJsZShHTC5ERVBUSF9URVNUKTtcclxuICAgIEdMLmRlcHRoRnVuYyhHTC5MRVNTKTtcclxuXHJcbiAgICAvL1Nlb21lIHRpcHVwdWh2cmkgamEgbcOkw6RyYW1lLCBrdXMgYW50dWQgdGlwdWF0cmlidXV0IGFzdWIgYW50dWQgbWFzc2lpdmlzLlxyXG4gICAgR0wuYmluZEJ1ZmZlcihHTC5BUlJBWV9CVUZGRVIsIEFQUC52ZXJ0ZXhCdWZmZXIpO1xyXG4gICAgR0wudmVydGV4QXR0cmliUG9pbnRlcihBUFAuYV9Qb3NpdGlvbiwgMywgR0wuRkxPQVQsIGZhbHNlLCBBUFAudmVydGV4U2l6ZSAqIDQsIDApO1xyXG4gICAgR0wudmVydGV4QXR0cmliUG9pbnRlcihBUFAuYV9UZXh0dXJlQ29vcmQsIDIsIEdMLkZMT0FULCBmYWxzZSwgQVBQLnZlcnRleFNpemUgKiA0LCBBUFAudmVydGV4U2l6ZSAqIDQgLSAyICogNCk7XHJcblxyXG4gICAgLy9Ba3RpdmVlcmltZSBhdHJpYnV1ZGlkXHJcbiAgICBHTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShBUFAuYV9Qb3NpdGlvbik7XHJcbiAgICBHTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShBUFAuYV9UZXh0dXJlQ29vcmQpO1xyXG5cclxuICAgIC8vQWt0aXZlZXJpbWUgamEgbcOkw6RyYW1lIHRla3N0dXVyaVxyXG4gICAgR0wuYWN0aXZlVGV4dHVyZShHTC5URVhUVVJFMCk7XHJcbiAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBBUFAudGV4dHVyZSk7XHJcbiAgICBHTC51bmlmb3JtMWkoQVBQLnVfVGV4dHVyZSwgMCk7XHJcblxyXG4gICAgLy9TYWFkYW1lIG1laWUgbWFhdHJpa3NpZCBrYSB2YXJqdW5kYWphc3NlXHJcbiAgICBHTC51bmlmb3JtTWF0cml4NGZ2KEFQUC51X01vZGVsTWF0cml4LCBmYWxzZSwgQVBQLm1vZGVsTWF0cml4KTtcclxuICAgIEdMLnVuaWZvcm1NYXRyaXg0ZnYoQVBQLnVfVmlld01hdHJpeCwgZmFsc2UsIEFQUC52aWV3TWF0cml4KTtcclxuICAgIEdMLnVuaWZvcm1NYXRyaXg0ZnYoQVBQLnVfUHJvamVjdGlvbk1hdHJpeCwgZmFsc2UsIEFQUC5wcm9qZWN0aW9uTWF0cml4KTtcclxuXHJcbiAgICAvL1JlbmRlcmRhbWUga29sbW51cmdhZCBpbmRla3NpdGUgasOkcmdpXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBBUFAuaW5kZXhCdWZmZXIpO1xyXG4gICAgR0wuZHJhd0VsZW1lbnRzKEdMLlRSSUFOR0xFUywgQVBQLmluZGV4QnVmZmVyLm51bWJlck9mSW5kZXhlcywgR0wuVU5TSUdORURfU0hPUlQsIDApO1xyXG59XHJcblxyXG4iLCJMb29wZXIgPSBmdW5jdGlvbihkb21FbGVtZW50LCBjYWxsYmFjaykge1xyXG4gICAgdGhpcy5kb21FbGVtZW50ID0gZG9tRWxlbWVudDtcclxuXHJcbiAgICB0aGlzLmxhc3RUaW1lID0gMDtcclxuICAgIHRoaXMuZGVsdGFUaW1lID0gMDtcclxuXHJcbiAgICB0aGlzLnJlcXVlc3RJZDtcclxuXHJcbiAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XHJcblxyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG4gICAgICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xyXG5cclxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWU7XHJcbn07XHJcblxyXG5Mb29wZXIucHJvdG90eXBlID0ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yOiBMb29wZXIsXHJcblxyXG4gICAgY2FsY3VsYXRlRGVsdGFUaW1lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgdGltZU5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cclxuICAgICAgICBpZih0aGlzLmxhc3RUaW1lICE9IDApXHJcbiAgICAgICAgICAgIHRoaXMuZGVsdGFUaW1lID0gKHRpbWVOb3cgLSB0aGlzLmxhc3RUaW1lKSAvIDE2O1xyXG5cclxuICAgICAgICB0aGlzLmxhc3RUaW1lID0gdGltZU5vdztcclxuICAgIH0sXHJcblxyXG4gICAgbG9vcDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5yZXF1ZXN0SWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5sb29wLmJpbmQodGhpcyksIHRoaXMuZG9tRWxlbWVudCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlRGVsdGFUaW1lKCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5kZWx0YVRpbWUpO1xyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTG9vcGVyOyIsIi8qKlxyXG4gKiBIb2lhYiBlbmRhcyBXZWJHTFByb2dyYW0gb2JqZWt0aSBqYSBXZWJHTFNoYWRlciB0aXB1dmFyanVuZGFqYXQgamEgcGlrc2xpdmFyanVuZGFqYXRcclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleFNoYWRlclBhdGhcclxuICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50U2hhZGVyUGF0aFxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBvbkxpbmtlZCBNZWV0b2QsIG1pcyBrdXRzdXRha3NlIHbDpGxqYSwga3VpIHZhcmp1bmRhamFkIG9uIGxhZXR1ZFxyXG4gKiBAY2xhc3NcclxuICovXHJcbnZhciBQcm9ncmFtT2JqZWN0ID0gZnVuY3Rpb24odmVydGV4U2hhZGVyUGF0aCwgZnJhZ21lbnRTaGFkZXJQYXRoLCBvbkxpbmtlZCkge1xyXG4gICAgdGhpcy5wcm9ncmFtID0gR0wuY3JlYXRlUHJvZ3JhbSgpO1xyXG5cclxuICAgIHRoaXMub25MaW5rZWQgPSBvbkxpbmtlZDtcclxuXHJcbiAgICB0aGlzLnZlcnRleFNoYWRlciA9IHtcclxuICAgICAgICBcInNoYWRlclwiOiBHTC5jcmVhdGVTaGFkZXIoR0wuVkVSVEVYX1NIQURFUiksXHJcbiAgICAgICAgXCJwYXRoXCI6IHZlcnRleFNoYWRlclBhdGgsXHJcbiAgICAgICAgXCJzcmNcIjogXCJcIixcclxuICAgICAgICBcImNvbXBsZXRlZFwiOiBmYWxzZVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmZyYWdtZW50U2hhZGVyID0ge1xyXG4gICAgICAgIFwic2hhZGVyXCI6IEdMLmNyZWF0ZVNoYWRlcihHTC5GUkFHTUVOVF9TSEFERVIpLFxyXG4gICAgICAgIFwicGF0aFwiOiBmcmFnbWVudFNoYWRlclBhdGgsXHJcbiAgICAgICAgXCJzcmNcIjogXCJcIixcclxuICAgICAgICBcImNvbXBsZXRlZFwiOiBmYWxzZVxyXG4gICAgfTtcclxufTtcclxuXHJcblByb2dyYW1PYmplY3QucHJvdG90eXBlID0ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yOiBQcm9ncmFtT2JqZWN0LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGJhY2sgbWVldG9kLCBtaXMga29tcGlsZWVyaWIgamEgc8OkdGVzdGFiIHZhcmp1bmRhamFkLCBrdWkgbcO1bGVtYWQgb24gYXPDvG5rcm9vbnNlbHQgbGFldHVkXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNyYyBMw6RodGVrb29kLCBtaXMgQUpBWCdpIGFiaWwgbGFldGlcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFRlZSwgbWlsbGUgYWJpbCB0dXZhc3RhZGEsIGt1bW1hIHZhcmp1bmRhamEgbMOkaHRla29vZCBvbiBsYWV0dWRcclxuICAgICAqL1xyXG4gICAgb25jb21wbGV0ZTogZnVuY3Rpb24oc3JjLCBwYXRoKSB7XHJcbiAgICAgICAgaWYocGF0aCA9PT0gdGhpcy52ZXJ0ZXhTaGFkZXIucGF0aCkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRleFNoYWRlci5jb21wbGV0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRleFNoYWRlci5zcmMgPSBzcmM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYocGF0aCA9PT0gdGhpcy5mcmFnbWVudFNoYWRlci5wYXRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIuY29tcGxldGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5mcmFnbWVudFNoYWRlci5zcmMgPSBzcmM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih0aGlzLnZlcnRleFNoYWRlci5jb21wbGV0ZWQgJiYgdGhpcy5mcmFnbWVudFNoYWRlci5jb21wbGV0ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21waWxlU2hhZGVyKHRoaXMudmVydGV4U2hhZGVyLnNoYWRlciwgdGhpcy52ZXJ0ZXhTaGFkZXIuc3JjKTtcclxuICAgICAgICAgICAgdGhpcy5jb21waWxlU2hhZGVyKHRoaXMuZnJhZ21lbnRTaGFkZXIuc2hhZGVyLCB0aGlzLmZyYWdtZW50U2hhZGVyLnNyYyk7XHJcblxyXG4gICAgICAgICAgICBHTC5hdHRhY2hTaGFkZXIodGhpcy5wcm9ncmFtLCB0aGlzLnZlcnRleFNoYWRlci5zaGFkZXIpO1xyXG4gICAgICAgICAgICBHTC5hdHRhY2hTaGFkZXIodGhpcy5wcm9ncmFtLCB0aGlzLmZyYWdtZW50U2hhZGVyLnNoYWRlcik7XHJcblxyXG4gICAgICAgICAgICBHTC5saW5rUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xyXG5cclxuICAgICAgICAgICAgaWYoIUdMLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5wcm9ncmFtLCBHTC5MSU5LX1NUQVRVUykpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRXJyb3IgbGlua2luZyBzaGFkZXIgcHJvZ3JhbTogXFxcIlwiICsgR0wuZ2V0UHJvZ3JhbUluZm9Mb2codGhpcy5wcm9ncmFtKSArIFwiXFxcIlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYodHlwZW9mIHRoaXMub25MaW5rZWQgIT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgICAgIHRoaXMub25MaW5rZWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogw5xyaXRhYiBrb21waWxlZXJpZGEgdmFyanVuZGFqYVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7V2ViR0xTaGFkZXJ9IHNoYWRlciBWYXJqdW5kYWphIG1pZGEga29tcGlsZWVyaWRhXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIEzDpGh0ZWtvb2QsIG1pZGEga29tcGlsZWVyaWRhXHJcbiAgICAgKi9cclxuICAgIGNvbXBpbGVTaGFkZXI6IGZ1bmN0aW9uKHNoYWRlciwgc291cmNlKSB7XHJcbiAgICAgICAgR0wuc2hhZGVyU291cmNlKHNoYWRlciwgc291cmNlKTtcclxuICAgICAgICBHTC5jb21waWxlU2hhZGVyKHNoYWRlcik7XHJcblxyXG4gICAgICAgIGlmICghR0wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgR0wuQ09NUElMRV9TVEFUVVMpKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiU2hhZGVyIGNvbXBpbGF0aW9uIGZhaWxlZC4gRXJyb3I6IFxcXCJcIiArIEdMLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKSArIFwiXFxcIlwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQW50dWQga2xhc3NpIGFiaWwgb24gdsO1aW1hbGlrIHByb2dyYW1taSBsYWFkaWRhIGphIGFzw7xua3Jvb25zZWx0IHRhZ2FwaWxkaWwgc3BldHNpZml0c2Vlcml0dWQgdmFyanVuZGFqYWRcclxuICogdGFnYXN0YXR1ZCBwcm9ncmFtbWlnYSBzaWR1ZGFcclxuICpcclxuICogQGNsYXNzIFNoYWRlclByb2dyYW1Mb2FkZXJcclxuICovXHJcbnZhciBTaGFkZXJQcm9ncmFtTG9hZGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmNvbnRhaW5lciA9IFtdO1xyXG4gICAgdGhpcy5jb3VudGVyID0gLTE7XHJcbn07XHJcblxyXG5TaGFkZXJQcm9ncmFtTG9hZGVyLnByb3RvdHlwZSA9IHtcclxuICAgIGNvbnN0cnVjdG9yOiBTaGFkZXJQcm9ncmFtTG9hZGVyLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGFnYXN0YWIgcHJvZ3JhbW0gb2JqZWt0aS4gQXPDvG5rcm9vbnNlbHQgdGFnYXBsYWFuaWwgbGFldGFrc2UgamEga29tcGlsZWVyaXRha3NlIHZhcmp1bmRhamFkLiBFbm5lIGt1aVxyXG4gICAgICogcHJvZ3JhbW1pIGthc3V0YWRhIHR1bGViIGtvbnRyb2xsaWRhLCBldCB2YXJqdW5kYWphZCBvbiBrb21waWxlZXJpdHVkIGphIHByb2dyYW1taWdhIHNlb3R1ZC4gVsO1aW1hbGlrIG9uXHJcbiAgICAgKiBwYXJhbWVldHJpa3MgYW5kYSBrYSBDYWxsYmFjayBmdW5rdHNpb29uLCBtaXMgdGVhZGEgYW5uYWIsIGt1aSB2YXJqdW5kYWphZCBvbiBzZW90dWQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleFNoYWRlclBhdGggVGVlLCB0aXB1dmFyanVuZGFqYSBqdXVyZGVcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmcmFnbWVudFNoYWRlclBhdGggVGVlLCBwaWtzbGl2YXJqdW5kYWphIGp1dXJkZVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlua2VkQ2FsbGJhY2sgRnVua3RzaW9vbiwgbWlzIGt1dHN1dGFrc2UgdsOkbGphLCBrdWkgdmFyanVuZGFqYWQgb24ga29tcGlsZWVyaXR1ZCBqYSBzZW90dWQgcHJvZ3JhbW1pZ2FcclxuICAgICAqIEByZXR1cm5zIHtleHBvcnRzLmRlZmF1bHRPcHRpb25zLnByb2dyYW18KnxXZWJHTFByb2dyYW18UHJvZ3JhbU9iamVjdC5wcm9ncmFtfVxyXG4gICAgICovXHJcbiAgICBnZXRQcm9ncmFtOiBmdW5jdGlvbih2ZXJ0ZXhTaGFkZXJQYXRoLCBmcmFnbWVudFNoYWRlclBhdGgsIGxpbmtlZENhbGxiYWNrKSB7XHJcbiAgICAgICAgdGhpcy5jb3VudGVyKys7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXJbdGhpcy5jb3VudGVyXSA9IG5ldyBQcm9ncmFtT2JqZWN0KHZlcnRleFNoYWRlclBhdGgsIGZyYWdtZW50U2hhZGVyUGF0aCwgbGlua2VkQ2FsbGJhY2spO1xyXG4gICAgICAgIHZhciBwcm9ncmFtID0gdGhpcy5jb250YWluZXJbdGhpcy5jb3VudGVyXTtcclxuXHJcbiAgICAgICAgdGhpcy5sb2FkQXN5bmNTaGFkZXJTb3VyY2UodmVydGV4U2hhZGVyUGF0aCwgcHJvZ3JhbS5vbmNvbXBsZXRlLmJpbmQocHJvZ3JhbSkpO1xyXG4gICAgICAgIHRoaXMubG9hZEFzeW5jU2hhZGVyU291cmNlKGZyYWdtZW50U2hhZGVyUGF0aCwgcHJvZ3JhbS5vbmNvbXBsZXRlLmJpbmQocHJvZ3JhbSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gcHJvZ3JhbS5wcm9ncmFtO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIExhZWIgYXPDvG5rcm9vbnNlbHRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2hhZGVyUGF0aCBUZWUsIGt1cyBhc3ViIHZhcmp1bmRhamFcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIEZ1bmt0c2lvb24sIG1pcyBrw6Rpdml0YXRha3NlLCBrdWkgbMOkaHRla29vZCBvbiBrw6R0dGUgc2FhZHVkLiBTYWFkZXRha3NlIHZhc3R1cyBqYSB0ZWUuXHJcbiAgICAgKi9cclxuICAgIGxvYWRBc3luY1NoYWRlclNvdXJjZTogZnVuY3Rpb24oc2hhZGVyUGF0aCwgY2FsbGJhY2spIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICBhc3luYzogdHJ1ZSxcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICB1cmw6IHNoYWRlclBhdGgsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVzdWx0LCBzaGFkZXJQYXRoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvZ3JhbU9iamVjdDtcclxubW9kdWxlLmV4cG9ydHMgPSBTaGFkZXJQcm9ncmFtTG9hZGVyOyJdfQ==
