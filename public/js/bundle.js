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
},{}]},{},["C:\\prog\\webglstudy\\lessons\\lesson05\\main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibGVzc29ucy9sZXNzb24wNS9tYWluLmpzIiwibGVzc29ucy91dGlscy9sb29wZXIuanMiLCJsZXNzb25zL3V0aWxzL3NoYWRlcnByb2dyYW1sb2FkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vQW50dWQgb3NhIHRlZ2VsZWIgV2ViR0wga29udGVrc3RpIGxvb21pc2VnYSBqYSBtZWlsZSB2YWphbGlrdSBXZWJHTFByb2dyYW0gb2JqZWt0aSBsb29taXNlZ2EgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxudmFyIFNoYWRlclByb2dyYW1Mb2FkZXIgPSByZXF1aXJlKFwiLi8uLi91dGlscy9zaGFkZXJwcm9ncmFtbG9hZGVyXCIpO1xyXG52YXIgTG9vcGVyID0gcmVxdWlyZShcIi4vLi4vdXRpbHMvbG9vcGVyXCIpO1xyXG5cclxuLy9WYXJqdW5kYWphdGUga2F0YWxvb2dcclxudmFyIFNIQURFUl9QQVRIID0gXCJzaGFkZXJzL2xlc3NvbjA1L1wiO1xyXG5cclxuLy9UZWtzdHV1cmkgYXN1a29odFxyXG52YXIgVEVYVFVSRV9QQVRIID0gXCJhc3NldHMvdGV4dHVyZS5qcGdcIjtcclxuXHJcbi8vRWxlbWVudCwga3VodSByZW5kZXJkYW1lXHJcbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxuXHJcbi8vTG9vbWUgZ2xvYmFhbHNlIFdlYkdMIGtvbnRla3N0aVxyXG5HTCA9IGluaXRXZWJHTChjYW52YXMpO1xyXG5cclxuLy9TZWFkaXN0YW1lIHJlbmRlcmRhbWlzcmVzb2x1dHNpb29uaVxyXG5HTC52aWV3cG9ydCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG5HTC52aWV3cG9ydFdpZHRoID0gY2FudmFzLndpZHRoO1xyXG5HTC52aWV3cG9ydEhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XHJcblxyXG4vL0xvb21lIHV1ZSBwcm9ncmFtbWkgc3BldHNpZml0c2Vlcml0dWQgdmFyanVuZGFqYXRlZ2EuIEt1bmEgbGFhZGltaW5lIG9uIGFzw7xua3Jvb25uZSwgc2lpcyBhbm5hbWUga2Fhc2Ega2FcclxuLy9tZWV0b2RpLCBtaXMga3V0c3V0YWtzZSB2w6RsamEga3VpIHZhcmp1bmRhamFkIG9uIGxhZXR1ZFxyXG52YXIgc2hhZGVyUHJvZ3JhbUxvYWRlciA9IG5ldyBTaGFkZXJQcm9ncmFtTG9hZGVyKCk7XHJcbnZhciBzaGFkZXJQcm9ncmFtID0gc2hhZGVyUHJvZ3JhbUxvYWRlci5nZXRQcm9ncmFtKFNIQURFUl9QQVRIICsgXCJ2ZXJ0ZXguc2hhZGVyXCIsIFNIQURFUl9QQVRIICsgXCJmcmFnbWVudC5zaGFkZXJcIiwgc2hhZGVyc0xvYWRlZCk7XHJcblxyXG5cclxuLy/DnHJpdGFtZSBsdXVhIFdlYkdMIGtvbnRla3N0aVxyXG5mdW5jdGlvbiBpbml0V2ViR0woY2FudmFzKSB7XHJcbiAgICB2YXIgZ2wgPSBudWxsO1xyXG5cclxuICAgIHRyeSB7XHJcblxyXG4gICAgICAgIC8vw5xyaXRhbWUgbHV1YSB0YXZhbGlzdCBrb250ZWtzdGksIGt1aSBzZWUgZWJhw7VubmVzdHViIMO8cml0YW1lIGx1dWEgZWtzcGVyaW1lbnRhYWxzZXQsXHJcbiAgICAgICAgLy9NaWRhIGthc3V0YXRha3NlIHNwZXRzaWZpa2F0c2lvb25pIGFyZW5kYW1pc2Vrc1xyXG4gICAgICAgIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKSB8fCBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiKTtcclxuXHJcbiAgICB9IGNhdGNoIChlKSB7fVxyXG5cclxuICAgIGlmKCFnbCkge1xyXG4gICAgICAgIGFsZXJ0KFwiVW5hYmxlIHRvIGluaXRpbGl6ZSBXZWJHTC4gWW91ciBicm93c2VyIG1heSBub3Qgc3VwcG9ydCBpdC5cIik7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJFeGVjdXRpb24gdGVybWluYXRlZC4gTm8gV2ViR0wgY29udGV4dFwiKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZ2w7XHJcbn1cclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBMRVNTT04wNSAtIFRFS1NUVVVSLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbnZhciBBUFAgPSB7fTtcclxuXHJcbkFQUC5sb29wZXIgPSBuZXcgTG9vcGVyKGNhbnZhcywgbG9vcCk7XHJcblxyXG4vL0t1dHN1dGFrc2Uga3VpIHZhcmp1bmRhamFkIG9uIGxhZXR1ZFxyXG5mdW5jdGlvbiBzaGFkZXJzTG9hZGVkKCkge1xyXG4gICAgc2V0dXBBbmRMb2FkVGV4dHVyZSgpO1xyXG4gICAgc2V0dXAoKTtcclxuXHJcbiAgICBBUFAubG9vcGVyLmxvb3AoKTtcclxufVxyXG5cclxuLy9UZWtzdHV1cmkgaW5pdHNpYWxpc2VlcmltaW5lIGphIGxhYWRpbWluZVxyXG5mdW5jdGlvbiBzZXR1cEFuZExvYWRUZXh0dXJlKCkge1xyXG5cclxuICAgIC8vTG9vbWUgdXVlIHRla3N0dXVyaSBqYSBrb29zIHNlbGxlZ2EgMXgxIHBpa3NsaXNlIHBpbGRpLCBtaXMga3V2YXRha3NlIHNlbmlrYXVhLCBrdW5pIHRla3N0dXVyIHNhYWIgbGFldHVkXHJcbiAgICBBUFAudGV4dHVyZSA9IEdMLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIEFQUC50ZXh0dXJlKTtcclxuICAgIEdMLnRleEltYWdlMkQoR0wuVEVYVFVSRV8yRCwgMCwgR0wuUkdCQSwgMSwgMSwgMCwgR0wuUkdCQSwgIEdMLlVOU0lHTkVEX0JZVEUsIG5ldyBVaW50OEFycmF5KFsxLCAxLCAxLCAxXSkpO1xyXG4gICAgR0wudGV4UGFyYW1ldGVyZihHTC5URVhUVVJFXzJELCBHTC5URVhUVVJFX1dSQVBfUywgR0wuUkVQRUFUKTtcclxuICAgIEdMLnRleFBhcmFtZXRlcmYoR0wuVEVYVFVSRV8yRCwgR0wuVEVYVFVSRV9XUkFQX1QsIEdMLlJFUEVBVCk7XHJcbiAgICBHTC50ZXhQYXJhbWV0ZXJpKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgR0wuTkVBUkVTVCk7XHJcbiAgICBHTC50ZXhQYXJhbWV0ZXJpKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgR0wuTkVBUkVTVCk7XHJcblxyXG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XHJcblxyXG4gICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgQVBQLnRleHR1cmUpO1xyXG4gICAgICAgIEdMLnRleEltYWdlMkQoR0wuVEVYVFVSRV8yRCwgMCwgR0wuUkdCLCBHTC5SR0IsICBHTC5VTlNJR05FRF9CWVRFLCBpbWFnZSk7XHJcbiAgICAgICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICB9O1xyXG4gICAgaW1hZ2Uuc3JjID0gVEVYVFVSRV9QQVRIO1xyXG5cclxufVxyXG5cclxuLy9Mb29iIHB1aHZyaWQgamEgbWFhdHJpa3NpZC4gVMOkaWRhYiBwdWh2cmlkIGFuZG1ldGVnYS5cclxuZnVuY3Rpb24gc2V0dXAoKSB7XHJcbiAgICAvL1RlZW1lIG11dXR1amEsIGt1aHUgc2FsdmVzdGFkYSBhZWdhLCBldCBrYWFtZXJhdCBhamEgbcO2w7ZkdWRlcyDDvG1iZXIgb2JqZWt0aSBww7bDtnJhdGFcclxuICAgIEFQUC50aW1lID0gMDtcclxuXHJcbiAgICAvL011ZGVsbWFhdHJpa3MsIG1pbGxlZ2Egb2JqZWt0aXJ1dW1pc3QgbWFhaWxtYXJ1dW1pIHNhYWRhXHJcbiAgICBBUFAubW9kZWxNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vUHVua3QsIGt1cyBvYmpla3QgaGV0a2VsIGFzdWJcclxuICAgIEFQUC5vYmplY3RBdCA9IFswLjAsIDAuMCwgLTUuMF07XHJcblxyXG4gICAgLy9LYXN1dGFkZXMgdHJhbnNsYXRzaW9vbmksIHNhYW1lIG11ZGVsbWFhdHJpa3NpZ2Egb2JqZWt0aSBsaWlndXRhZGFcclxuICAgIG1hdDQudHJhbnNsYXRlKEFQUC5tb2RlbE1hdHJpeCwgQVBQLm1vZGVsTWF0cml4LCBBUFAub2JqZWN0QXQpO1xyXG5cclxuICAgIC8vS2FhbWVyYW1hYXRyaWtzLCBtaWxsZWdhIG1hYWlsbWFydXVtaXN0IGthYW1lcmFydXVtaSBzYWFkYVxyXG4gICAgQVBQLnZpZXdNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vRGVmaW5lZXJpbWUgdmVrdG9yaWQsIG1pbGxlIGFiaWwgb24gdsO1aW1hbGlrIGthYW1lcmFydXVtaSBiYWFzdmVrdG9yaWQgYXJ2dXRhZGFcclxuICAgIEFQUC5jYW1lcmFBdCA9IFswLCAwLCA1XTsgICAgICAgICAgICAvL0FzdWIgbWFhaWxtYXJ1dW1pcyBuZW5kZWwga29vcmRpbmFhdGlkZWxcclxuICAgIEFQUC5sb29rQXQgPSBbMCwgMCwgLTFdOyAgICAgICAgICAgICAvL01pcyBzdXVuYXMga2FhbWVyYSB2YWF0YWIuIFBhcmVtYWvDpGUga29vcmRpbmFhdHPDvHN0ZWVtaXMgb24gLXogZWtyYWFuaSBzaXNzZVxyXG4gICAgQVBQLnVwID0gWzAsIDEsIDBdOyAgICAgICAgICAgICAgICAgIC8vVmVrdG9yLCBtaXMgbsOkaXRhYiwga3VzIG9uIGthYW1lcmEgw7xsZXNzZSBzdXVuZGEgbsOkaXRhdiB2ZWt0b3JcclxuXHJcbiAgICAvL0thbGt1bGVlcmltZSBhbnR1ZCBrb29yZGluYWF0aWRlIGrDpHJnaSBrYWFtZXJhbWFhdHJpa3NpXHJcbiAgICBtYXQ0Lmxvb2tBdChBUFAudmlld01hdHJpeCwgQVBQLmNhbWVyYUF0LEFQUC5sb29rQXQsIEFQUC51cCk7XHJcblxyXG4gICAgLy9Qcm9qZWt0c2lvb25pbWFhdHJpa3MsIGV0IHDDvGdhbWlzcnV1bWkgc2FhZGEuIEthc3V0YWRlcyBnbE1hdHJpeCB0ZWVraSBnZW5lcmVlcmltZSBrYSBww7xyYW1paWRpLCBrdWh1IHNpc3NlIG9iamVrdGlkIGzDpGhldmFkLlxyXG4gICAgQVBQLnByb2plY3Rpb25NYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG4gICAgbWF0NC5wZXJzcGVjdGl2ZShBUFAucHJvamVjdGlvbk1hdHJpeCwgNDUuMCwgR0wudmlld3BvcnRXaWR0aCAvIEdMLnZpZXdwb3J0SGVpZ2h0LCAxLjAsIDEwMDAuMCk7XHJcblxyXG5cclxuXHJcblxyXG4gICAgLy9UaXBwdWRlIGFuZG1lZC4gVGlwdSBrb29yZGluYWFkaWQgeCwgeSwgeiBqYSB0ZWtzdHV1cmkga29vcmRpbmFhZGlkIHUsIHZcclxuICAgIEFQUC5teVZlcnRpY2VzRGF0YSA9IFtcclxuICAgICAgICAvL0VzaW1lbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAgMS4wLCAgMC4wLCAxLjAsICAgICAgICAgICAgLy9BTFVNSU5FIFZBU0FLIE5VUktcclxuICAgICAgICAgMS4wLCAtMS4wLCAgMS4wLCAgMS4wLCAxLjAsICAgICAgICAgICAgLy9BTFVNSU5FIFBBUkVNIE5VUktcclxuICAgICAgICAgMS4wLCAgMS4wLCAgMS4wLCAgMS4wLCAwLjAsICAgICAgICAgICAgLy/DnExFTUlORSBQQVJFTSBOVVJLXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgIDEuMCwgIDAuMCwgMC4wLCAgICAgICAgICAgIC8vw5xMRU1JTkUgVkFTQUsgTlVSS1xyXG5cclxuICAgICAgICAvL1RhZ3VtaW5lIGvDvGxnXHJcbiAgICAgICAgLTEuMCwgLTEuMCwgLTEuMCwgIDAuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsICAxLjAsIC0xLjAsICAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsICAxLjAsIC0xLjAsICAgMS4wLCAwLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAtMS4wLCAgIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL8OcbGVtaW5lIGvDvGxnXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgLTEuMCwgIDAuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsICAxLjAsICAxLjAsICAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsICAxLjAsICAxLjAsICAgIDEuMCwgMC4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgLTEuMCwgIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL0FsdW1pbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsIC0xLjAsIC0xLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgLTEuMCwgIDEuMCwgIDEuMCwgMC4wLFxyXG4gICAgICAgIC0xLjAsIC0xLjAsICAxLjAsIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL1BhcmVtIGvDvGxnXHJcbiAgICAgICAgMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsICAxLjAsIC0xLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgIDEuMCwgIDEuMCwgMC4wLFxyXG4gICAgICAgIDEuMCwgLTEuMCwgIDEuMCwgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vVmFzYWsga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDEuMCxcclxuICAgICAgICAtMS4wLCAtMS4wLCAgMS4wLCAxLjAsIDEuMCxcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMS4wLCAgMS4wLCAwLjAsXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgLTEuMCwgMC4wLCAwLjAsXHJcbiAgICBdO1xyXG4gICAgQVBQLnZlcnRleFNpemUgPSA1O1xyXG5cclxuICAgIC8vTG9vbWUgcHVodnJpLCBrdWh1IHRpcHVhbmRtZWQgdmlpYS4gU2VvbWUga2EgYW50dWQgcHVodnJpIGtvbnRla3N0aWdhLCBldCB0ZW1hbGUga8Okc2tlIGVkYXNpIGFuZGFcclxuICAgIEFQUC52ZXJ0ZXhCdWZmZXIgPSBHTC5jcmVhdGVCdWZmZXIoKTtcclxuXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkFSUkFZX0JVRkZFUiwgQVBQLnZlcnRleEJ1ZmZlcik7XHJcblxyXG4gICAgLy9Bbm5hbWUgbG9vZHVkIHB1aHZyaWxlIGFuZG1lZFxyXG4gICAgR0wuYnVmZmVyRGF0YShHTC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoQVBQLm15VmVydGljZXNEYXRhKSwgR0wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgIC8vVGlwcHVkZSBpbmRla3NpZFxyXG4gICAgQVBQLm15SW5kaWNlc0RhdGEgPSBbXHJcbiAgICAgICAgMCwgMSwgMiwgICAgICAwLCAyLCAzLCAgICAvLyBFc2ltZW5lIGvDvGxnXHJcbiAgICAgICAgNCwgNSwgNiwgICAgICA0LCA2LCA3LCAgICAvLyBUYWd1bWluZSBrw7xsZ1xyXG4gICAgICAgIDgsIDksIDEwLCAgICAgOCwgMTAsIDExLCAgLy8gw5xsZW1pbmUga8O8bGdcclxuICAgICAgICAxMiwgMTMsIDE0LCAgIDEyLCAxNCwgMTUsIC8vIEFsdW1pbmUga8O8bGdcclxuICAgICAgICAxNiwgMTcsIDE4LCAgIDE2LCAxOCwgMTksIC8vIFBhcmVtIGvDvGxnXHJcbiAgICAgICAgMjAsIDIxLCAyMiwgICAyMCwgMjIsIDIzICAvLyBWYXNhayBrw7xsZ1xyXG4gICAgXTtcclxuXHJcbiAgICAvL0xvb21lIHB1aHZyaSwga3VodSBpbmRla3NpZCB2aWlhLiBTZW9tZSBrYSBhbnR1ZCBwdWh2cmkga29udGVrc3RpZ2EsIGV0IHRlbWFsZSBrw6Rza2UgZWRhc2kgYW5kYVxyXG4gICAgQVBQLmluZGV4QnVmZmVyID0gR0wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBBUFAuaW5kZXhCdWZmZXIubnVtYmVyT2ZJbmRleGVzID0gMzY7XHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBBUFAuaW5kZXhCdWZmZXIpO1xyXG5cclxuICAgIC8vQW5uYW1lIGxvb2R1ZCBwdWh2cmlsZSBhbmRtZWRcclxuICAgIEdMLmJ1ZmZlckRhdGEoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG5ldyBVaW50MTZBcnJheShBUFAubXlJbmRpY2VzRGF0YSksIEdMLlNUQVRJQ19EUkFXKTtcclxuXHJcbiAgICAvL03DpMOkcmFtZSBwcm9ncmFtbWksIG1pZGEgbWUgcmVuZGVyZGFtaXNlbCBrYXN1dGFkYSB0YWhhbWVcclxuICAgIEdMLnVzZVByb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XHJcblxyXG4gICAgLy9TYWFtZSBpbmRla3NpLCBtaXMgbsOkaXRhYiBrdXMgYXN1YiBtZWllIHByb2dyYW1taXMga2FzdXRhdGF2YXMgdGlwdXZhcmp1bmRhamFzXHJcbiAgICAvL29sZXYgdGlwdWF0cmlidXV0IG5pbWVnYSBhX1ZlcnRleFBvc2l0aW9uXHJcbiAgICBBUFAuYV9Qb3NpdGlvbiA9IEdMLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYV9Qb3NpdGlvblwiKTtcclxuXHJcbiAgICAvL1NhYW1lIHbDpHJ2aWF0cmlidXVkaSBhc3Vrb2hhXHJcbiAgICBBUFAuYV9UZXh0dXJlQ29vcmQgPSBHTC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcImFfVGV4dHVyZUNvb3JkXCIpO1xyXG5cclxuICAgIC8vU2FhbWUgw7xodHNldGUgbXV1dHVqYXRlIGFzdWtvaGFkXHJcbiAgICBBUFAudV9Nb2RlbE1hdHJpeCA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfTW9kZWxNYXRyaXhcIik7XHJcbiAgICBBUFAudV9WaWV3TWF0cml4ID0gR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9WaWV3TWF0cml4XCIpO1xyXG4gICAgQVBQLnVfUHJvamVjdGlvbk1hdHJpeCA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfUHJvamVjdGlvbk1hdHJpeFwiKTtcclxuICAgIEFQUC51X1RleHR1cmUgPSBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X1RleHR1cmVcIik7XHJcbn1cclxuXHJcbi8vS3V0c3V0YWtzZSB2w6RsamEgTG9vcGVyIG9iamVrdGlzIGlnYSBrYWFkZXJcclxuZnVuY3Rpb24gbG9vcChkZWx0YVRpbWUpIHtcclxuICAgIHVwZGF0ZShkZWx0YVRpbWUpO1xyXG5cclxuICAgIHJlbmRlcigpO1xyXG59XHJcblxyXG4vL1V1ZW5kYWIgYW5kbWVpZCwgZXQgb2xla3MgdsO1aW1hbGlrIHN0c2VlbiBsaWlrdW1hIHBhbm5hXHJcbmZ1bmN0aW9uIHVwZGF0ZShkZWx0YVRpbWUpIHtcclxuICAgIEFQUC50aW1lICs9IGRlbHRhVGltZSAvIDEwMDtcclxuXHJcbiAgIHVwZGF0ZUNhbWVyYSgpO1xyXG4gICB1cGRhdGVPYmplY3QoKTtcclxufVxyXG5cclxuLy9VdWVuZGFiIGthYW1lcmF0LCBldCBzZWRhIG9sZWtzIHbDtWltYWxpayDDvG1iZXIgb2JqZWt0aSBww7bDtnJhdGFcclxuZnVuY3Rpb24gdXBkYXRlQ2FtZXJhKCkge1xyXG4gICAgdmFyIHJhZGl1cyA9IDU7XHJcbiAgICB2YXIgY2FtZXJhSGVpZ2h0ID0gMDtcclxuXHJcbiAgICAvL0xlaWFtZSB1dWUgcG9zaXRzaW9vbmksIG1pcyBhamFzIGxpaWd1YiBwb2xhYXJzZXMga29vcmRpbmFhdHPDvHN0ZWVtaXMgamEgbWlsbGUgdGVpc2VuZGFtZSByaXN0a29vcmRpbmFhdHPDvHN0ZWVtaVxyXG4gICAgQVBQLmNhbWVyYUF0ID0gW0FQUC5vYmplY3RBdFswXSArIHJhZGl1cyAqIE1hdGguY29zKEFQUC50aW1lKSwgICAgICAgLy8gWFxyXG4gICAgICAgICAgICAgICAgICAgICBjYW1lcmFIZWlnaHQgKyBBUFAub2JqZWN0QXRbMV0sICAgICAgICAgICAgICAgICAgICAgLy8gWVxyXG4gICAgICAgICAgICAgICAgICAgICBBUFAub2JqZWN0QXRbMl0gKyByYWRpdXMgKiBNYXRoLnNpbihBUFAudGltZSldOyAgICAgLy8gWlxyXG5cclxuICAgIC8vTGVpYW1lIHN1dW5hdmVrdG9yaSwga2FhbWVyYXN0IG9iamVrdGluaVxyXG4gICAgdmFyIGxvb2tEaXJlY3Rpb24gPSBbQVBQLm9iamVjdEF0WzBdIC0gQVBQLmNhbWVyYUF0WzBdLCAgICAgICAgICAgICAgIC8vIFhcclxuICAgICAgICAgICAgICAgICAgICAgICAgIEFQUC5vYmplY3RBdFsxXSAtIEFQUC5jYW1lcmFBdFsxXSwgICAgICAgICAgICAgICAvLyBZXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBBUFAub2JqZWN0QXRbMl0gLSBBUFAuY2FtZXJhQXRbMl1dOyAgICAgICAgICAgICAgLy8gWlxyXG5cclxuICAgIC8vTGVpYW1lIHB1bmt0aSwgbWlkYSBrYWFtZXJhIHZhYXRhYlxyXG4gICAgdmVjMy5hZGQoQVBQLmxvb2tBdCwgQVBQLmNhbWVyYUF0LCBsb29rRGlyZWN0aW9uKTtcclxuXHJcblxyXG4gICAgLy9VdWVuZGFtZSBrYWFtZXJhbWFhdHJpa3NpdFxyXG4gICAgbWF0NC5sb29rQXQoQVBQLnZpZXdNYXRyaXgsIEFQUC5jYW1lcmFBdCwgQVBQLmxvb2tBdCwgQVBQLnVwKTtcclxuXHJcblxyXG59XHJcblxyXG4vL3V1ZW5kYW1lIG9iamVrdGlcclxuZnVuY3Rpb24gdXBkYXRlT2JqZWN0KCkge1xyXG4gICAgbWF0NC5yb3RhdGVYKEFQUC5tb2RlbE1hdHJpeCwgQVBQLm1vZGVsTWF0cml4LCAwLjAwNSk7XHJcbn1cclxuXHJcbi8vUmVuZGVyZGFtaW5lXHJcbmZ1bmN0aW9uIHJlbmRlcigpIHtcclxuXHJcbiAgICAvL1BwdWhhc3RhbWUga2EgdsOkcnZpLSBqYSBzw7xnYXZ1c3B1aHZyaWQsIG5pbmcgbcOkw6RyYW1lIHV1ZSBwdWhhc3R1dsOkcnZ1c2UuXHJcbiAgICAvL0hldGtlbCBwdWhhc3RhbWluZSBtaWRhZ2kgZWkgdGVlLCBzZXN0IG1lIHJlbmRlcmRhbWUgdmFpZCDDvGhlIGtvcnJhLCBrdWlkIGt1aSBtZSB0c8O8a2tsaXMgc2VkYSB0ZWdlbWFcclxuICAgIC8vb24gbsOkaGEga2EsIG1pZGEgbmFkIHRlZXZhZC5cclxuICAgIEdMLmNsZWFyQ29sb3IoMC41LCAwLjUsIDAuNSwgMS4wKTtcclxuICAgIEdMLmNsZWFyKEdMLkNPTE9SX0JVRkZFUl9CSVQgfCBHTC5ERVBUSF9CVUZGRVJfQklUKTtcclxuXHJcbiAgICAvL0zDvGxpdGFtZSBzaXNzZSBzw7xnYXZ1c3Rlc3RpXHJcbiAgICBHTC5lbmFibGUoR0wuREVQVEhfVEVTVCk7XHJcbiAgICBHTC5kZXB0aEZ1bmMoR0wuTEVTUyk7XHJcblxyXG4gICAgLy9TZW9tZSB0aXB1cHVodnJpIGphIG3DpMOkcmFtZSwga3VzIGFudHVkIHRpcHVhdHJpYnV1dCBhc3ViIGFudHVkIG1hc3NpaXZpcy5cclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuQVJSQVlfQlVGRkVSLCBBUFAudmVydGV4QnVmZmVyKTtcclxuICAgIEdMLnZlcnRleEF0dHJpYlBvaW50ZXIoQVBQLmFfUG9zaXRpb24sIDMsIEdMLkZMT0FULCBmYWxzZSwgQVBQLnZlcnRleFNpemUgKiA0LCAwKTtcclxuICAgIEdMLnZlcnRleEF0dHJpYlBvaW50ZXIoQVBQLmFfVGV4dHVyZUNvb3JkLCAyLCBHTC5GTE9BVCwgZmFsc2UsIEFQUC52ZXJ0ZXhTaXplICogNCwgQVBQLnZlcnRleFNpemUgKiA0IC0gMiAqIDQpO1xyXG5cclxuICAgIC8vQWt0aXZlZXJpbWUgYXRyaWJ1dWRpZFxyXG4gICAgR0wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoQVBQLmFfUG9zaXRpb24pO1xyXG4gICAgR0wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoQVBQLmFfVGV4dHVyZUNvb3JkKTtcclxuXHJcbiAgICAvL0FrdGl2ZWVyaW1lIGphIG3DpMOkcmFtZSB0ZWtzdHV1cmlcclxuICAgIEdMLmFjdGl2ZVRleHR1cmUoR0wuVEVYVFVSRTApO1xyXG4gICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgQVBQLnRleHR1cmUpO1xyXG4gICAgR0wudW5pZm9ybTFpKEFQUC51X1RleHR1cmUsIDApO1xyXG5cclxuICAgIC8vU2FhZGFtZSBtZWllIG1hYXRyaWtzaWQga2EgdmFyanVuZGFqYXNzZVxyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9Nb2RlbE1hdHJpeCwgZmFsc2UsIEFQUC5tb2RlbE1hdHJpeCk7XHJcbiAgICBHTC51bmlmb3JtTWF0cml4NGZ2KEFQUC51X1ZpZXdNYXRyaXgsIGZhbHNlLCBBUFAudmlld01hdHJpeCk7XHJcbiAgICBHTC51bmlmb3JtTWF0cml4NGZ2KEFQUC51X1Byb2plY3Rpb25NYXRyaXgsIGZhbHNlLCBBUFAucHJvamVjdGlvbk1hdHJpeCk7XHJcblxyXG4gICAgLy9SZW5kZXJkYW1lIGtvbG1udXJnYWQgaW5kZWtzaXRlIGrDpHJnaVxyXG4gICAgR0wuYmluZEJ1ZmZlcihHTC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgQVBQLmluZGV4QnVmZmVyKTtcclxuICAgIEdMLmRyYXdFbGVtZW50cyhHTC5UUklBTkdMRVMsIEFQUC5pbmRleEJ1ZmZlci5udW1iZXJPZkluZGV4ZXMsIEdMLlVOU0lHTkVEX1NIT1JULCAwKTtcclxufVxyXG5cclxuIiwiTG9vcGVyID0gZnVuY3Rpb24oZG9tRWxlbWVudCwgY2FsbGJhY2spIHtcclxuICAgIHRoaXMuZG9tRWxlbWVudCA9IGRvbUVsZW1lbnQ7XHJcblxyXG4gICAgdGhpcy5sYXN0VGltZSA9IDA7XHJcbiAgICB0aGlzLmRlbHRhVGltZSA9IDA7XHJcblxyXG4gICAgdGhpcy5yZXF1ZXN0SWQ7XHJcblxyXG4gICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xyXG5cclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuICAgICAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZTtcclxuXHJcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lO1xyXG59O1xyXG5cclxuTG9vcGVyLnByb3RvdHlwZSA9IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcjogTG9vcGVyLFxyXG5cclxuICAgIGNhbGN1bGF0ZURlbHRhVGltZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHRpbWVOb3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHJcbiAgICAgICAgaWYodGhpcy5sYXN0VGltZSAhPSAwKVxyXG4gICAgICAgICAgICB0aGlzLmRlbHRhVGltZSA9ICh0aW1lTm93IC0gdGhpcy5sYXN0VGltZSkgLyAxNjtcclxuXHJcbiAgICAgICAgdGhpcy5sYXN0VGltZSA9IHRpbWVOb3c7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvb3A6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMucmVxdWVzdElkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMubG9vcC5iaW5kKHRoaXMpLCB0aGlzLmRvbUVsZW1lbnQpO1xyXG5cclxuICAgICAgICB0aGlzLmNhbGN1bGF0ZURlbHRhVGltZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMuZGVsdGFUaW1lKTtcclxuICAgIH1cclxuXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExvb3BlcjsiLCIvKipcclxuICogSG9pYWIgZW5kYXMgV2ViR0xQcm9ncmFtIG9iamVrdGkgamEgV2ViR0xTaGFkZXIgdGlwdXZhcmp1bmRhamF0IGphIHBpa3NsaXZhcmp1bmRhamF0XHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJ0ZXhTaGFkZXJQYXRoXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmcmFnbWVudFNoYWRlclBhdGhcclxuICogQHBhcmFtIHtmdW5jdGlvbn0gb25MaW5rZWQgTWVldG9kLCBtaXMga3V0c3V0YWtzZSB2w6RsamEsIGt1aSB2YXJqdW5kYWphZCBvbiBsYWV0dWRcclxuICogQGNsYXNzXHJcbiAqL1xyXG52YXIgUHJvZ3JhbU9iamVjdCA9IGZ1bmN0aW9uKHZlcnRleFNoYWRlclBhdGgsIGZyYWdtZW50U2hhZGVyUGF0aCwgb25MaW5rZWQpIHtcclxuICAgIHRoaXMucHJvZ3JhbSA9IEdMLmNyZWF0ZVByb2dyYW0oKTtcclxuXHJcbiAgICB0aGlzLm9uTGlua2VkID0gb25MaW5rZWQ7XHJcblxyXG4gICAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB7XHJcbiAgICAgICAgXCJzaGFkZXJcIjogR0wuY3JlYXRlU2hhZGVyKEdMLlZFUlRFWF9TSEFERVIpLFxyXG4gICAgICAgIFwicGF0aFwiOiB2ZXJ0ZXhTaGFkZXJQYXRoLFxyXG4gICAgICAgIFwic3JjXCI6IFwiXCIsXHJcbiAgICAgICAgXCJjb21wbGV0ZWRcIjogZmFsc2VcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHtcclxuICAgICAgICBcInNoYWRlclwiOiBHTC5jcmVhdGVTaGFkZXIoR0wuRlJBR01FTlRfU0hBREVSKSxcclxuICAgICAgICBcInBhdGhcIjogZnJhZ21lbnRTaGFkZXJQYXRoLFxyXG4gICAgICAgIFwic3JjXCI6IFwiXCIsXHJcbiAgICAgICAgXCJjb21wbGV0ZWRcIjogZmFsc2VcclxuICAgIH07XHJcbn07XHJcblxyXG5Qcm9ncmFtT2JqZWN0LnByb3RvdHlwZSA9IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcjogUHJvZ3JhbU9iamVjdCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxiYWNrIG1lZXRvZCwgbWlzIGtvbXBpbGVlcmliIGphIHPDpHRlc3RhYiB2YXJqdW5kYWphZCwga3VpIG3DtWxlbWFkIG9uIGFzw7xua3Jvb25zZWx0IGxhZXR1ZFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcmMgTMOkaHRla29vZCwgbWlzIEFKQVgnaSBhYmlsIGxhZXRpXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUZWUsIG1pbGxlIGFiaWwgdHV2YXN0YWRhLCBrdW1tYSB2YXJqdW5kYWphIGzDpGh0ZWtvb2Qgb24gbGFldHVkXHJcbiAgICAgKi9cclxuICAgIG9uY29tcGxldGU6IGZ1bmN0aW9uKHNyYywgcGF0aCkge1xyXG4gICAgICAgIGlmKHBhdGggPT09IHRoaXMudmVydGV4U2hhZGVyLnBhdGgpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhTaGFkZXIuY29tcGxldGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhTaGFkZXIuc3JjID0gc3JjO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKHBhdGggPT09IHRoaXMuZnJhZ21lbnRTaGFkZXIucGF0aCkge1xyXG4gICAgICAgICAgICB0aGlzLmZyYWdtZW50U2hhZGVyLmNvbXBsZXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIuc3JjID0gc3JjO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodGhpcy52ZXJ0ZXhTaGFkZXIuY29tcGxldGVkICYmIHRoaXMuZnJhZ21lbnRTaGFkZXIuY29tcGxldGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZVNoYWRlcih0aGlzLnZlcnRleFNoYWRlci5zaGFkZXIsIHRoaXMudmVydGV4U2hhZGVyLnNyYyk7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZVNoYWRlcih0aGlzLmZyYWdtZW50U2hhZGVyLnNoYWRlciwgdGhpcy5mcmFnbWVudFNoYWRlci5zcmMpO1xyXG5cclxuICAgICAgICAgICAgR0wuYXR0YWNoU2hhZGVyKHRoaXMucHJvZ3JhbSwgdGhpcy52ZXJ0ZXhTaGFkZXIuc2hhZGVyKTtcclxuICAgICAgICAgICAgR0wuYXR0YWNoU2hhZGVyKHRoaXMucHJvZ3JhbSwgdGhpcy5mcmFnbWVudFNoYWRlci5zaGFkZXIpO1xyXG5cclxuICAgICAgICAgICAgR0wubGlua1Byb2dyYW0odGhpcy5wcm9ncmFtKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCFHTC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMucHJvZ3JhbSwgR0wuTElOS19TVEFUVVMpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVycm9yIGxpbmtpbmcgc2hhZGVyIHByb2dyYW06IFxcXCJcIiArIEdMLmdldFByb2dyYW1JbmZvTG9nKHRoaXMucHJvZ3JhbSkgKyBcIlxcXCJcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmKHR5cGVvZiB0aGlzLm9uTGlua2VkICE9IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uTGlua2VkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIMOccml0YWIga29tcGlsZWVyaWRhIHZhcmp1bmRhamFcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1dlYkdMU2hhZGVyfSBzaGFkZXIgVmFyanVuZGFqYSBtaWRhIGtvbXBpbGVlcmlkYVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSBMw6RodGVrb29kLCBtaWRhIGtvbXBpbGVlcmlkYVxyXG4gICAgICovXHJcbiAgICBjb21waWxlU2hhZGVyOiBmdW5jdGlvbihzaGFkZXIsIHNvdXJjZSkge1xyXG4gICAgICAgIEdMLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XHJcbiAgICAgICAgR0wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xyXG5cclxuICAgICAgICBpZiAoIUdMLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIEdMLkNPTVBJTEVfU1RBVFVTKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIlNoYWRlciBjb21waWxhdGlvbiBmYWlsZWQuIEVycm9yOiBcXFwiXCIgKyBHTC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikgKyBcIlxcXCJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFudHVkIGtsYXNzaSBhYmlsIG9uIHbDtWltYWxpayBwcm9ncmFtbWkgbGFhZGlkYSBqYSBhc8O8bmtyb29uc2VsdCB0YWdhcGlsZGlsIHNwZXRzaWZpdHNlZXJpdHVkIHZhcmp1bmRhamFkXHJcbiAqIHRhZ2FzdGF0dWQgcHJvZ3JhbW1pZ2Egc2lkdWRhXHJcbiAqXHJcbiAqIEBjbGFzcyBTaGFkZXJQcm9ncmFtTG9hZGVyXHJcbiAqL1xyXG52YXIgU2hhZGVyUHJvZ3JhbUxvYWRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5jb250YWluZXIgPSBbXTtcclxuICAgIHRoaXMuY291bnRlciA9IC0xO1xyXG59O1xyXG5cclxuU2hhZGVyUHJvZ3JhbUxvYWRlci5wcm90b3R5cGUgPSB7XHJcbiAgICBjb25zdHJ1Y3RvcjogU2hhZGVyUHJvZ3JhbUxvYWRlcixcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRhZ2FzdGFiIHByb2dyYW1tIG9iamVrdGkuIEFzw7xua3Jvb25zZWx0IHRhZ2FwbGFhbmlsIGxhZXRha3NlIGphIGtvbXBpbGVlcml0YWtzZSB2YXJqdW5kYWphZC4gRW5uZSBrdWlcclxuICAgICAqIHByb2dyYW1taSBrYXN1dGFkYSB0dWxlYiBrb250cm9sbGlkYSwgZXQgdmFyanVuZGFqYWQgb24ga29tcGlsZWVyaXR1ZCBqYSBwcm9ncmFtbWlnYSBzZW90dWQuIFbDtWltYWxpayBvblxyXG4gICAgICogcGFyYW1lZXRyaWtzIGFuZGEga2EgQ2FsbGJhY2sgZnVua3RzaW9vbiwgbWlzIHRlYWRhIGFubmFiLCBrdWkgdmFyanVuZGFqYWQgb24gc2VvdHVkLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJ0ZXhTaGFkZXJQYXRoIFRlZSwgdGlwdXZhcmp1bmRhamEganV1cmRlXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRTaGFkZXJQYXRoIFRlZSwgcGlrc2xpdmFyanVuZGFqYSBqdXVyZGVcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpbmtlZENhbGxiYWNrIEZ1bmt0c2lvb24sIG1pcyBrdXRzdXRha3NlIHbDpGxqYSwga3VpIHZhcmp1bmRhamFkIG9uIGtvbXBpbGVlcml0dWQgamEgc2VvdHVkIHByb2dyYW1taWdhXHJcbiAgICAgKiBAcmV0dXJucyB7ZXhwb3J0cy5kZWZhdWx0T3B0aW9ucy5wcm9ncmFtfCp8V2ViR0xQcm9ncmFtfFByb2dyYW1PYmplY3QucHJvZ3JhbX1cclxuICAgICAqL1xyXG4gICAgZ2V0UHJvZ3JhbTogZnVuY3Rpb24odmVydGV4U2hhZGVyUGF0aCwgZnJhZ21lbnRTaGFkZXJQYXRoLCBsaW5rZWRDYWxsYmFjaykge1xyXG4gICAgICAgIHRoaXMuY291bnRlcisrO1xyXG4gICAgICAgIHRoaXMuY29udGFpbmVyW3RoaXMuY291bnRlcl0gPSBuZXcgUHJvZ3JhbU9iamVjdCh2ZXJ0ZXhTaGFkZXJQYXRoLCBmcmFnbWVudFNoYWRlclBhdGgsIGxpbmtlZENhbGxiYWNrKTtcclxuICAgICAgICB2YXIgcHJvZ3JhbSA9IHRoaXMuY29udGFpbmVyW3RoaXMuY291bnRlcl07XHJcblxyXG4gICAgICAgIHRoaXMubG9hZEFzeW5jU2hhZGVyU291cmNlKHZlcnRleFNoYWRlclBhdGgsIHByb2dyYW0ub25jb21wbGV0ZS5iaW5kKHByb2dyYW0pKTtcclxuICAgICAgICB0aGlzLmxvYWRBc3luY1NoYWRlclNvdXJjZShmcmFnbWVudFNoYWRlclBhdGgsIHByb2dyYW0ub25jb21wbGV0ZS5iaW5kKHByb2dyYW0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2dyYW0ucHJvZ3JhbTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMYWViIGFzw7xua3Jvb25zZWx0IGzDpGh0ZWtvb2RpXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNoYWRlclBhdGggVGVlLCBrdXMgYXN1YiB2YXJqdW5kYWphXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBGdW5rdHNpb29uLCBtaXMga8OkaXZpdGF0YWtzZSwga3VpIGzDpGh0ZWtvb2Qgb24ga8OkdHRlIHNhYWR1ZC4gU2FhZGV0YWtzZSB2YXN0dXMgamEgdGVlLlxyXG4gICAgICovXHJcbiAgICBsb2FkQXN5bmNTaGFkZXJTb3VyY2U6IGZ1bmN0aW9uKHNoYWRlclBhdGgsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgYXN5bmM6IHRydWUsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcInRleHRcIixcclxuICAgICAgICAgICAgdXJsOiBzaGFkZXJQYXRoLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlc3VsdCwgc2hhZGVyUGF0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb2dyYW1PYmplY3Q7XHJcbm1vZHVsZS5leHBvcnRzID0gU2hhZGVyUHJvZ3JhbUxvYWRlcjsiXX0=
