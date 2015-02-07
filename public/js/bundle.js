(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\prog\\webglstudy\\lessons\\lesson04\\main.js":[function(require,module,exports){
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////Antud osa tegeleb WebGL konteksti loomisega ja meile vajaliku WebGLProgram objekti loomisega ///////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ShaderProgramLoader = require("./../utils/shaderprogramloader");
var Looper = require("./../utils/looper");

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
//////////////////////////////////////////////////////// LESSON04 - LIIKUMINE //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var APP = {};

APP.looper = new Looper(canvas, loop);

//Kutsutakse kui varjundajad on laetud
function shadersLoaded() {
    setup();

    APP.looper.loop();
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




    //Tippude andmed
    APP.myVerticesData = [
        -1.0, -1.0,  0.0,
        1.0, -1.0,  0.0,
        1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0
    ];

    //Loome puhvri, kuhu tipuandmed viia. Seome ka antud puhvri kontekstiga, et temale käske edasi anda
    APP.vertexBuffer = GL.createBuffer();

    GL.bindBuffer(GL.ARRAY_BUFFER, APP.vertexBuffer);

    //Anname loodud puhvrile andmed
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(APP.myVerticesData), GL.STATIC_DRAW);

    //Tippude indeksid
    APP.myIndicesData = [
        0,  1,  2,
        0,  2,  3
    ];

    //Loome puhvri, kuhu indeksid viia. Seome ka antud puhvri kontekstiga, et temale käske edasi anda
    APP.indexBuffer = GL.createBuffer();
    APP.indexBuffer.numberOfIndexes = 6;
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, APP.indexBuffer);

    //Anname loodud puhvrile andmed
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(APP.myIndicesData), GL.STATIC_DRAW);

    //Tippude värvid
    APP.myVerticesColor = [
        1.0,  0.0,  0.0,   // Tipp 1 punane
        0.0,  1.0,  0.0,   // Tipp 2 roheline
        0.0,  0.0,  1.0,   // Tipp 3 sinine
        1.0,  1.0,  0.0    //Tipp 4 kollane
    ];

    //Loome puhvri ja seome kontekstiga
    APP.colorBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, APP.colorBuffer);

    //Anname kontekstiga seotud puhvrile andmed
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(APP.myVerticesColor), GL.STATIC_DRAW);

    //Määrame programmi, mida me renderdamisel kasutada tahame
    GL.useProgram(shaderProgram);

    //Saame indeksi, mis näitab kus asub meie programmis kasutatavas tipuvarjundajas
    //olev tipuatribuut nimega a_VertexPosition
    APP.a_Position = GL.getAttribLocation(shaderProgram, "a_Position");

    //Saame värviatribuudi asukoha
    APP.a_Color = GL.getAttribLocation(shaderProgram, "a_Color");

    //Saame ühtsete muutujate asukohad
    APP.u_ModelMatrix = GL.getUniformLocation(shaderProgram, "u_ModelMatrix");
    APP.u_ViewMatrix = GL.getUniformLocation(shaderProgram, "u_ViewMatrix");
    APP.u_ProjectionMatrix = GL.getUniformLocation(shaderProgram, "u_ProjectionMatrix");
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
    var radius = 10;
    var cameraHeight = 5;

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

    //Seekord enne renderdamist puhastame ka värvi- ja sügavuspuhvrid, ning määrame uue puhastuvärvuse.
    //Hetkel puhastamine midagi ei tee, sest me renderdame vaid ühe korra, kuid kui me tsükklis seda tegema
    //on näha ka, mida nad teevad.
    GL.clearColor(0.0, 0.0, 0.0, 1.0);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    //Seome tipupuhvri ja määrame, kus antud tipuatribuut asub antud massiivis.
    GL.bindBuffer(GL.ARRAY_BUFFER, APP.vertexBuffer);
    GL.vertexAttribPointer(APP.a_Position, 3, GL.FLOAT, false, 0, 0);

    //Seome värvipuhvri ja määrame, kus antud atribuut asub antud massiivis.
    GL.bindBuffer(GL.ARRAY_BUFFER, APP.colorBuffer);
    GL.vertexAttribPointer(APP.a_Color, 3, GL.FLOAT, false, 0, 0);

    //Aktiveerime atribuudid
    GL.enableVertexAttribArray(APP.a_Position);
    GL.enableVertexAttribArray(APP.a_Color);

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
},{}]},{},["C:\\prog\\webglstudy\\lessons\\lesson04\\main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibGVzc29ucy9sZXNzb24wNC9tYWluLmpzIiwibGVzc29ucy91dGlscy9sb29wZXIuanMiLCJsZXNzb25zL3V0aWxzL3NoYWRlcnByb2dyYW1sb2FkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vL0FudHVkIG9zYSB0ZWdlbGViIFdlYkdMIGtvbnRla3N0aSBsb29taXNlZ2EgamEgbWVpbGUgdmFqYWxpa3UgV2ViR0xQcm9ncmFtIG9iamVrdGkgbG9vbWlzZWdhIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbnZhciBTaGFkZXJQcm9ncmFtTG9hZGVyID0gcmVxdWlyZShcIi4vLi4vdXRpbHMvc2hhZGVycHJvZ3JhbWxvYWRlclwiKTtcclxudmFyIExvb3BlciA9IHJlcXVpcmUoXCIuLy4uL3V0aWxzL2xvb3BlclwiKTtcclxuXHJcbi8vVmFyanVuZGFqYXRlIGthdGFsb29nXHJcbnZhciBTSEFERVJfUEFUSCA9IFwic2hhZGVycy9sZXNzb24wMy9cIjtcclxuXHJcbi8vRWxlbWVudCwga3VodSByZW5kZXJkYW1lXHJcbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxuXHJcbi8vTG9vbWUgZ2xvYmFhbHNlIFdlYkdMIGtvbnRla3N0aVxyXG5HTCA9IGluaXRXZWJHTChjYW52YXMpO1xyXG5cclxuLy9TZWFkaXN0YW1lIHJlbmRlcmRhbWlzcmVzb2x1dHNpb29uaVxyXG5HTC52aWV3cG9ydCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG5HTC52aWV3cG9ydFdpZHRoID0gY2FudmFzLndpZHRoO1xyXG5HTC52aWV3cG9ydEhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XHJcblxyXG4vL0xvb21lIHV1ZSBwcm9ncmFtbWkgc3BldHNpZml0c2Vlcml0dWQgdmFyanVuZGFqYXRlZ2EuIEt1bmEgbGFhZGltaW5lIG9uIGFzw7xua3Jvb25uZSwgc2lpcyBhbm5hbWUga2Fhc2Ega2FcclxuLy9tZWV0b2RpLCBtaXMga3V0c3V0YWtzZSB2w6RsamEga3VpIHZhcmp1bmRhamFkIG9uIGxhZXR1ZFxyXG52YXIgc2hhZGVyUHJvZ3JhbUxvYWRlciA9IG5ldyBTaGFkZXJQcm9ncmFtTG9hZGVyKCk7XHJcbnZhciBzaGFkZXJQcm9ncmFtID0gc2hhZGVyUHJvZ3JhbUxvYWRlci5nZXRQcm9ncmFtKFNIQURFUl9QQVRIICsgXCJ2ZXJ0ZXguc2hhZGVyXCIsIFNIQURFUl9QQVRIICsgXCJmcmFnbWVudC5zaGFkZXJcIiwgc2hhZGVyc0xvYWRlZCk7XHJcblxyXG5cclxuLy/DnHJpdGFtZSBsdXVhIFdlYkdMIGtvbnRla3N0aVxyXG5mdW5jdGlvbiBpbml0V2ViR0woY2FudmFzKSB7XHJcbiAgICB2YXIgZ2wgPSBudWxsO1xyXG5cclxuICAgIHRyeSB7XHJcblxyXG4gICAgICAgIC8vw5xyaXRhbWUgbHV1YSB0YXZhbGlzdCBrb250ZWtzdGksIGt1aSBzZWUgZWJhw7VubmVzdHViIMO8cml0YW1lIGx1dWEgZWtzcGVyaW1lbnRhYWxzZXQsXHJcbiAgICAgICAgLy9NaWRhIGthc3V0YXRha3NlIHNwZXRzaWZpa2F0c2lvb25pIGFyZW5kYW1pc2Vrc1xyXG4gICAgICAgIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKSB8fCBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiKTtcclxuXHJcbiAgICB9IGNhdGNoIChlKSB7fVxyXG5cclxuICAgIGlmKCFnbCkge1xyXG4gICAgICAgIGFsZXJ0KFwiVW5hYmxlIHRvIGluaXRpbGl6ZSBXZWJHTC4gWW91ciBicm93c2VyIG1heSBub3Qgc3VwcG9ydCBpdC5cIik7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJFeGVjdXRpb24gdGVybWluYXRlZC4gTm8gV2ViR0wgY29udGV4dFwiKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZ2w7XHJcbn1cclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBMRVNTT04wNCAtIExJSUtVTUlORSAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbnZhciBBUFAgPSB7fTtcclxuXHJcbkFQUC5sb29wZXIgPSBuZXcgTG9vcGVyKGNhbnZhcywgbG9vcCk7XHJcblxyXG4vL0t1dHN1dGFrc2Uga3VpIHZhcmp1bmRhamFkIG9uIGxhZXR1ZFxyXG5mdW5jdGlvbiBzaGFkZXJzTG9hZGVkKCkge1xyXG4gICAgc2V0dXAoKTtcclxuXHJcbiAgICBBUFAubG9vcGVyLmxvb3AoKTtcclxufVxyXG5cclxuLy9Mb29iIHB1aHZyaWQgamEgbWFhdHJpa3NpZC4gVMOkaWRhYiBwdWh2cmlkIGFuZG1ldGVnYS5cclxuZnVuY3Rpb24gc2V0dXAoKSB7XHJcbiAgICAvL1RlZW1lIG11dXR1amEsIGt1aHUgc2FsdmVzdGFkYSBhZWdhLCBldCBrYWFtZXJhdCBhamEgbcO2w7ZkdWRlcyDDvG1iZXIgb2JqZWt0aSBww7bDtnJhdGFcclxuICAgIEFQUC50aW1lID0gMDtcclxuXHJcbiAgICAvL011ZGVsbWFhdHJpa3MsIG1pbGxlZ2Egb2JqZWt0aXJ1dW1pc3QgbWFhaWxtYXJ1dW1pIHNhYWRhXHJcbiAgICBBUFAubW9kZWxNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vUHVua3QsIGt1cyBvYmpla3QgaGV0a2VsIGFzdWJcclxuICAgIEFQUC5vYmplY3RBdCA9IFswLjAsIDAuMCwgLTUuMF07XHJcblxyXG4gICAgLy9LYXN1dGFkZXMgdHJhbnNsYXRzaW9vbmksIHNhYW1lIG11ZGVsbWFhdHJpa3NpZ2Egb2JqZWt0aSBsaWlndXRhZGFcclxuICAgIG1hdDQudHJhbnNsYXRlKEFQUC5tb2RlbE1hdHJpeCwgQVBQLm1vZGVsTWF0cml4LCBBUFAub2JqZWN0QXQpO1xyXG5cclxuICAgIC8vS2FhbWVyYW1hYXRyaWtzLCBtaWxsZWdhIG1hYWlsbWFydXVtaXN0IGthYW1lcmFydXVtaSBzYWFkYVxyXG4gICAgQVBQLnZpZXdNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vRGVmaW5lZXJpbWUgdmVrdG9yaWQsIG1pbGxlIGFiaWwgb24gdsO1aW1hbGlrIGthYW1lcmFydXVtaSBiYWFzdmVrdG9yaWQgYXJ2dXRhZGFcclxuICAgIEFQUC5jYW1lcmFBdCA9IFswLCAwLCA1XTsgICAgICAgICAgICAvL0FzdWIgbWFhaWxtYXJ1dW1pcyBuZW5kZWwga29vcmRpbmFhdGlkZWxcclxuICAgIEFQUC5sb29rQXQgPSBbMCwgMCwgLTFdOyAgICAgICAgICAgICAvL01pcyBzdXVuYXMga2FhbWVyYSB2YWF0YWIuIFBhcmVtYWvDpGUga29vcmRpbmFhdHPDvHN0ZWVtaXMgb24gLXogZWtyYWFuaSBzaXNzZVxyXG4gICAgQVBQLnVwID0gWzAsIDEsIDBdOyAgICAgICAgICAgICAgICAgIC8vVmVrdG9yLCBtaXMgbsOkaXRhYiwga3VzIG9uIGthYW1lcmEgw7xsZXNzZSBzdXVuZGEgbsOkaXRhdiB2ZWt0b3JcclxuXHJcbiAgICAvL0thbGt1bGVlcmltZSBhbnR1ZCBrb29yZGluYWF0aWRlIGrDpHJnaSBrYWFtZXJhbWFhdHJpa3NpXHJcbiAgICBtYXQ0Lmxvb2tBdChBUFAudmlld01hdHJpeCwgQVBQLmNhbWVyYUF0LEFQUC5sb29rQXQsIEFQUC51cCk7XHJcblxyXG4gICAgLy9Qcm9qZWt0c2lvb25pbWFhdHJpa3MsIGV0IHDDvGdhbWlzcnV1bWkgc2FhZGEuIEthc3V0YWRlcyBnbE1hdHJpeCB0ZWVraSBnZW5lcmVlcmltZSBrYSBww7xyYW1paWRpLCBrdWh1IHNpc3NlIG9iamVrdGlkIGzDpGhldmFkLlxyXG4gICAgQVBQLnByb2plY3Rpb25NYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG4gICAgbWF0NC5wZXJzcGVjdGl2ZShBUFAucHJvamVjdGlvbk1hdHJpeCwgNDUuMCwgR0wudmlld3BvcnRXaWR0aCAvIEdMLnZpZXdwb3J0SGVpZ2h0LCAxLjAsIDEwMDAuMCk7XHJcblxyXG5cclxuXHJcblxyXG4gICAgLy9UaXBwdWRlIGFuZG1lZFxyXG4gICAgQVBQLm15VmVydGljZXNEYXRhID0gW1xyXG4gICAgICAgIC0xLjAsIC0xLjAsICAwLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAgMC4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgIDAuMCxcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMC4wXHJcbiAgICBdO1xyXG5cclxuICAgIC8vTG9vbWUgcHVodnJpLCBrdWh1IHRpcHVhbmRtZWQgdmlpYS4gU2VvbWUga2EgYW50dWQgcHVodnJpIGtvbnRla3N0aWdhLCBldCB0ZW1hbGUga8Okc2tlIGVkYXNpIGFuZGFcclxuICAgIEFQUC52ZXJ0ZXhCdWZmZXIgPSBHTC5jcmVhdGVCdWZmZXIoKTtcclxuXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkFSUkFZX0JVRkZFUiwgQVBQLnZlcnRleEJ1ZmZlcik7XHJcblxyXG4gICAgLy9Bbm5hbWUgbG9vZHVkIHB1aHZyaWxlIGFuZG1lZFxyXG4gICAgR0wuYnVmZmVyRGF0YShHTC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoQVBQLm15VmVydGljZXNEYXRhKSwgR0wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgIC8vVGlwcHVkZSBpbmRla3NpZFxyXG4gICAgQVBQLm15SW5kaWNlc0RhdGEgPSBbXHJcbiAgICAgICAgMCwgIDEsICAyLFxyXG4gICAgICAgIDAsICAyLCAgM1xyXG4gICAgXTtcclxuXHJcbiAgICAvL0xvb21lIHB1aHZyaSwga3VodSBpbmRla3NpZCB2aWlhLiBTZW9tZSBrYSBhbnR1ZCBwdWh2cmkga29udGVrc3RpZ2EsIGV0IHRlbWFsZSBrw6Rza2UgZWRhc2kgYW5kYVxyXG4gICAgQVBQLmluZGV4QnVmZmVyID0gR0wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBBUFAuaW5kZXhCdWZmZXIubnVtYmVyT2ZJbmRleGVzID0gNjtcclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIEFQUC5pbmRleEJ1ZmZlcik7XHJcblxyXG4gICAgLy9Bbm5hbWUgbG9vZHVkIHB1aHZyaWxlIGFuZG1lZFxyXG4gICAgR0wuYnVmZmVyRGF0YShHTC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IFVpbnQxNkFycmF5KEFQUC5teUluZGljZXNEYXRhKSwgR0wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgIC8vVGlwcHVkZSB2w6RydmlkXHJcbiAgICBBUFAubXlWZXJ0aWNlc0NvbG9yID0gW1xyXG4gICAgICAgIDEuMCwgIDAuMCwgIDAuMCwgICAvLyBUaXBwIDEgcHVuYW5lXHJcbiAgICAgICAgMC4wLCAgMS4wLCAgMC4wLCAgIC8vIFRpcHAgMiByb2hlbGluZVxyXG4gICAgICAgIDAuMCwgIDAuMCwgIDEuMCwgICAvLyBUaXBwIDMgc2luaW5lXHJcbiAgICAgICAgMS4wLCAgMS4wLCAgMC4wICAgIC8vVGlwcCA0IGtvbGxhbmVcclxuICAgIF07XHJcblxyXG4gICAgLy9Mb29tZSBwdWh2cmkgamEgc2VvbWUga29udGVrc3RpZ2FcclxuICAgIEFQUC5jb2xvckJ1ZmZlciA9IEdMLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgR0wuYmluZEJ1ZmZlcihHTC5BUlJBWV9CVUZGRVIsIEFQUC5jb2xvckJ1ZmZlcik7XHJcblxyXG4gICAgLy9Bbm5hbWUga29udGVrc3RpZ2Egc2VvdHVkIHB1aHZyaWxlIGFuZG1lZFxyXG4gICAgR0wuYnVmZmVyRGF0YShHTC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoQVBQLm15VmVydGljZXNDb2xvciksIEdMLlNUQVRJQ19EUkFXKTtcclxuXHJcbiAgICAvL03DpMOkcmFtZSBwcm9ncmFtbWksIG1pZGEgbWUgcmVuZGVyZGFtaXNlbCBrYXN1dGFkYSB0YWhhbWVcclxuICAgIEdMLnVzZVByb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XHJcblxyXG4gICAgLy9TYWFtZSBpbmRla3NpLCBtaXMgbsOkaXRhYiBrdXMgYXN1YiBtZWllIHByb2dyYW1taXMga2FzdXRhdGF2YXMgdGlwdXZhcmp1bmRhamFzXHJcbiAgICAvL29sZXYgdGlwdWF0cmlidXV0IG5pbWVnYSBhX1ZlcnRleFBvc2l0aW9uXHJcbiAgICBBUFAuYV9Qb3NpdGlvbiA9IEdMLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYV9Qb3NpdGlvblwiKTtcclxuXHJcbiAgICAvL1NhYW1lIHbDpHJ2aWF0cmlidXVkaSBhc3Vrb2hhXHJcbiAgICBBUFAuYV9Db2xvciA9IEdMLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYV9Db2xvclwiKTtcclxuXHJcbiAgICAvL1NhYW1lIMO8aHRzZXRlIG11dXR1amF0ZSBhc3Vrb2hhZFxyXG4gICAgQVBQLnVfTW9kZWxNYXRyaXggPSBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X01vZGVsTWF0cml4XCIpO1xyXG4gICAgQVBQLnVfVmlld01hdHJpeCA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfVmlld01hdHJpeFwiKTtcclxuICAgIEFQUC51X1Byb2plY3Rpb25NYXRyaXggPSBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X1Byb2plY3Rpb25NYXRyaXhcIik7XHJcbn1cclxuXHJcbi8vS3V0c3V0YWtzZSB2w6RsamEgTG9vcGVyIG9iamVrdGlzIGlnYSBrYWFkZXJcclxuZnVuY3Rpb24gbG9vcChkZWx0YVRpbWUpIHtcclxuICAgIHVwZGF0ZShkZWx0YVRpbWUpO1xyXG5cclxuICAgIHJlbmRlcigpO1xyXG59XHJcblxyXG4vL1V1ZW5kYWIgYW5kbWVpZCwgZXQgb2xla3MgdsO1aW1hbGlrIHN0c2VlbiBsaWlrdW1hIHBhbm5hXHJcbmZ1bmN0aW9uIHVwZGF0ZShkZWx0YVRpbWUpIHtcclxuICAgIEFQUC50aW1lICs9IGRlbHRhVGltZSAvIDEwMDtcclxuXHJcbiAgICB1cGRhdGVDYW1lcmEoKTtcclxuICAgIHVwZGF0ZU9iamVjdCgpO1xyXG59XHJcblxyXG4vL1V1ZW5kYWIga2FhbWVyYXQsIGV0IHNlZGEgb2xla3MgdsO1aW1hbGlrIMO8bWJlciBvYmpla3RpIHDDtsO2cmF0YVxyXG5mdW5jdGlvbiB1cGRhdGVDYW1lcmEoKSB7XHJcbiAgICB2YXIgcmFkaXVzID0gMTA7XHJcbiAgICB2YXIgY2FtZXJhSGVpZ2h0ID0gNTtcclxuXHJcbiAgICAvL0xlaWFtZSB1dWUgcG9zaXRzaW9vbmksIG1pcyBhamFzIGxpaWd1YiBwb2xhYXJzZXMga29vcmRpbmFhdHPDvHN0ZWVtaXMgamEgbWlsbGUgdGVpc2VuZGFtZSByaXN0a29vcmRpbmFhdHPDvHN0ZWVtaVxyXG4gICAgQVBQLmNhbWVyYUF0ID0gW0FQUC5vYmplY3RBdFswXSArIHJhZGl1cyAqIE1hdGguY29zKEFQUC50aW1lKSwgICAgICAgLy8gWFxyXG4gICAgICAgICAgICAgICAgICAgICBjYW1lcmFIZWlnaHQgKyBBUFAub2JqZWN0QXRbMV0sICAgICAgICAgICAgICAgICAgICAgLy8gWVxyXG4gICAgICAgICAgICAgICAgICAgICBBUFAub2JqZWN0QXRbMl0gKyByYWRpdXMgKiBNYXRoLnNpbihBUFAudGltZSldOyAgICAgLy8gWlxyXG5cclxuICAgIC8vTGVpYW1lIHN1dW5hdmVrdG9yaSwga2FhbWVyYXN0IG9iamVrdGluaVxyXG4gICAgdmFyIGxvb2tEaXJlY3Rpb24gPSBbQVBQLm9iamVjdEF0WzBdIC0gQVBQLmNhbWVyYUF0WzBdLCAgICAgICAgICAgICAgIC8vIFhcclxuICAgICAgICAgICAgICAgICAgICAgICAgIEFQUC5vYmplY3RBdFsxXSAtIEFQUC5jYW1lcmFBdFsxXSwgICAgICAgICAgICAgICAvLyBZXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBBUFAub2JqZWN0QXRbMl0gLSBBUFAuY2FtZXJhQXRbMl1dOyAgICAgICAgICAgICAgLy8gWlxyXG5cclxuICAgIC8vTGVpYW1lIHB1bmt0aSwgbWlkYSBrYWFtZXJhIHZhYXRhYlxyXG4gICAgdmVjMy5hZGQoQVBQLmxvb2tBdCwgQVBQLmNhbWVyYUF0LCBsb29rRGlyZWN0aW9uKTtcclxuXHJcblxyXG4gICAgLy9VdWVuZGFtZSBrYWFtZXJhbWFhdHJpa3NpdFxyXG4gICAgbWF0NC5sb29rQXQoQVBQLnZpZXdNYXRyaXgsIEFQUC5jYW1lcmFBdCwgQVBQLmxvb2tBdCwgQVBQLnVwKTtcclxuXHJcblxyXG59XHJcblxyXG4vL3V1ZW5kYW1lIG9iamVrdGlcclxuZnVuY3Rpb24gdXBkYXRlT2JqZWN0KCkge1xyXG4gICAgbWF0NC5yb3RhdGVYKEFQUC5tb2RlbE1hdHJpeCwgQVBQLm1vZGVsTWF0cml4LCAwLjAwNSk7XHJcbn1cclxuXHJcbi8vUmVuZGVyZGFtaW5lXHJcbmZ1bmN0aW9uIHJlbmRlcigpIHtcclxuXHJcbiAgICAvL1NlZWtvcmQgZW5uZSByZW5kZXJkYW1pc3QgcHVoYXN0YW1lIGthIHbDpHJ2aS0gamEgc8O8Z2F2dXNwdWh2cmlkLCBuaW5nIG3DpMOkcmFtZSB1dWUgcHVoYXN0dXbDpHJ2dXNlLlxyXG4gICAgLy9IZXRrZWwgcHVoYXN0YW1pbmUgbWlkYWdpIGVpIHRlZSwgc2VzdCBtZSByZW5kZXJkYW1lIHZhaWQgw7xoZSBrb3JyYSwga3VpZCBrdWkgbWUgdHPDvGtrbGlzIHNlZGEgdGVnZW1hXHJcbiAgICAvL29uIG7DpGhhIGthLCBtaWRhIG5hZCB0ZWV2YWQuXHJcbiAgICBHTC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjAsIDEuMCk7XHJcbiAgICBHTC5jbGVhcihHTC5DT0xPUl9CVUZGRVJfQklUIHwgR0wuREVQVEhfQlVGRkVSX0JJVCk7XHJcblxyXG4gICAgLy9TZW9tZSB0aXB1cHVodnJpIGphIG3DpMOkcmFtZSwga3VzIGFudHVkIHRpcHVhdHJpYnV1dCBhc3ViIGFudHVkIG1hc3NpaXZpcy5cclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuQVJSQVlfQlVGRkVSLCBBUFAudmVydGV4QnVmZmVyKTtcclxuICAgIEdMLnZlcnRleEF0dHJpYlBvaW50ZXIoQVBQLmFfUG9zaXRpb24sIDMsIEdMLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcblxyXG4gICAgLy9TZW9tZSB2w6RydmlwdWh2cmkgamEgbcOkw6RyYW1lLCBrdXMgYW50dWQgYXRyaWJ1dXQgYXN1YiBhbnR1ZCBtYXNzaWl2aXMuXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkFSUkFZX0JVRkZFUiwgQVBQLmNvbG9yQnVmZmVyKTtcclxuICAgIEdMLnZlcnRleEF0dHJpYlBvaW50ZXIoQVBQLmFfQ29sb3IsIDMsIEdMLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcblxyXG4gICAgLy9Ba3RpdmVlcmltZSBhdHJpYnV1ZGlkXHJcbiAgICBHTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShBUFAuYV9Qb3NpdGlvbik7XHJcbiAgICBHTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShBUFAuYV9Db2xvcik7XHJcblxyXG4gICAgLy9TYWFkYW1lIG1laWUgbWFhdHJpa3NpZCBrYSB2YXJqdW5kYWphc3NlXHJcbiAgICBHTC51bmlmb3JtTWF0cml4NGZ2KEFQUC51X01vZGVsTWF0cml4LCBmYWxzZSwgQVBQLm1vZGVsTWF0cml4KTtcclxuICAgIEdMLnVuaWZvcm1NYXRyaXg0ZnYoQVBQLnVfVmlld01hdHJpeCwgZmFsc2UsIEFQUC52aWV3TWF0cml4KTtcclxuICAgIEdMLnVuaWZvcm1NYXRyaXg0ZnYoQVBQLnVfUHJvamVjdGlvbk1hdHJpeCwgZmFsc2UsIEFQUC5wcm9qZWN0aW9uTWF0cml4KTtcclxuXHJcbiAgICAvL1JlbmRlcmRhbWUga29sbW51cmdhZCBpbmRla3NpdGUgasOkcmdpXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBBUFAuaW5kZXhCdWZmZXIpO1xyXG4gICAgR0wuZHJhd0VsZW1lbnRzKEdMLlRSSUFOR0xFUywgQVBQLmluZGV4QnVmZmVyLm51bWJlck9mSW5kZXhlcywgR0wuVU5TSUdORURfU0hPUlQsIDApO1xyXG59XHJcblxyXG4iLCJMb29wZXIgPSBmdW5jdGlvbihkb21FbGVtZW50LCBjYWxsYmFjaykge1xyXG4gICAgdGhpcy5kb21FbGVtZW50ID0gZG9tRWxlbWVudDtcclxuXHJcbiAgICB0aGlzLmxhc3RUaW1lID0gMDtcclxuICAgIHRoaXMuZGVsdGFUaW1lID0gMDtcclxuXHJcbiAgICB0aGlzLnJlcXVlc3RJZDtcclxuXHJcbiAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XHJcblxyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG4gICAgICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xyXG5cclxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWU7XHJcbn07XHJcblxyXG5Mb29wZXIucHJvdG90eXBlID0ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yOiBMb29wZXIsXHJcblxyXG4gICAgY2FsY3VsYXRlRGVsdGFUaW1lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgdGltZU5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cclxuICAgICAgICBpZih0aGlzLmxhc3RUaW1lICE9IDApXHJcbiAgICAgICAgICAgIHRoaXMuZGVsdGFUaW1lID0gKHRpbWVOb3cgLSB0aGlzLmxhc3RUaW1lKSAvIDE2O1xyXG5cclxuICAgICAgICB0aGlzLmxhc3RUaW1lID0gdGltZU5vdztcclxuICAgIH0sXHJcblxyXG4gICAgbG9vcDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5yZXF1ZXN0SWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5sb29wLmJpbmQodGhpcyksIHRoaXMuZG9tRWxlbWVudCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlRGVsdGFUaW1lKCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5kZWx0YVRpbWUpO1xyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTG9vcGVyOyIsIi8qKlxyXG4gKiBIb2lhYiBlbmRhcyBXZWJHTFByb2dyYW0gb2JqZWt0aSBqYSBXZWJHTFNoYWRlciB0aXB1dmFyanVuZGFqYXQgamEgcGlrc2xpdmFyanVuZGFqYXRcclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleFNoYWRlclBhdGhcclxuICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50U2hhZGVyUGF0aFxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBvbkxpbmtlZCBNZWV0b2QsIG1pcyBrdXRzdXRha3NlIHbDpGxqYSwga3VpIHZhcmp1bmRhamFkIG9uIGxhZXR1ZFxyXG4gKiBAY2xhc3NcclxuICovXHJcbnZhciBQcm9ncmFtT2JqZWN0ID0gZnVuY3Rpb24odmVydGV4U2hhZGVyUGF0aCwgZnJhZ21lbnRTaGFkZXJQYXRoLCBvbkxpbmtlZCkge1xyXG4gICAgdGhpcy5wcm9ncmFtID0gR0wuY3JlYXRlUHJvZ3JhbSgpO1xyXG5cclxuICAgIHRoaXMub25MaW5rZWQgPSBvbkxpbmtlZDtcclxuXHJcbiAgICB0aGlzLnZlcnRleFNoYWRlciA9IHtcclxuICAgICAgICBcInNoYWRlclwiOiBHTC5jcmVhdGVTaGFkZXIoR0wuVkVSVEVYX1NIQURFUiksXHJcbiAgICAgICAgXCJwYXRoXCI6IHZlcnRleFNoYWRlclBhdGgsXHJcbiAgICAgICAgXCJzcmNcIjogXCJcIixcclxuICAgICAgICBcImNvbXBsZXRlZFwiOiBmYWxzZVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmZyYWdtZW50U2hhZGVyID0ge1xyXG4gICAgICAgIFwic2hhZGVyXCI6IEdMLmNyZWF0ZVNoYWRlcihHTC5GUkFHTUVOVF9TSEFERVIpLFxyXG4gICAgICAgIFwicGF0aFwiOiBmcmFnbWVudFNoYWRlclBhdGgsXHJcbiAgICAgICAgXCJzcmNcIjogXCJcIixcclxuICAgICAgICBcImNvbXBsZXRlZFwiOiBmYWxzZVxyXG4gICAgfTtcclxufTtcclxuXHJcblByb2dyYW1PYmplY3QucHJvdG90eXBlID0ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yOiBQcm9ncmFtT2JqZWN0LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGJhY2sgbWVldG9kLCBtaXMga29tcGlsZWVyaWIgamEgc8OkdGVzdGFiIHZhcmp1bmRhamFkLCBrdWkgbcO1bGVtYWQgb24gYXPDvG5rcm9vbnNlbHQgbGFldHVkXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNyYyBMw6RodGVrb29kLCBtaXMgQUpBWCdpIGFiaWwgbGFldGlcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFRlZSwgbWlsbGUgYWJpbCB0dXZhc3RhZGEsIGt1bW1hIHZhcmp1bmRhamEgbMOkaHRla29vZCBvbiBsYWV0dWRcclxuICAgICAqL1xyXG4gICAgb25jb21wbGV0ZTogZnVuY3Rpb24oc3JjLCBwYXRoKSB7XHJcbiAgICAgICAgaWYocGF0aCA9PT0gdGhpcy52ZXJ0ZXhTaGFkZXIucGF0aCkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRleFNoYWRlci5jb21wbGV0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRleFNoYWRlci5zcmMgPSBzcmM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYocGF0aCA9PT0gdGhpcy5mcmFnbWVudFNoYWRlci5wYXRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIuY29tcGxldGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5mcmFnbWVudFNoYWRlci5zcmMgPSBzcmM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih0aGlzLnZlcnRleFNoYWRlci5jb21wbGV0ZWQgJiYgdGhpcy5mcmFnbWVudFNoYWRlci5jb21wbGV0ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21waWxlU2hhZGVyKHRoaXMudmVydGV4U2hhZGVyLnNoYWRlciwgdGhpcy52ZXJ0ZXhTaGFkZXIuc3JjKTtcclxuICAgICAgICAgICAgdGhpcy5jb21waWxlU2hhZGVyKHRoaXMuZnJhZ21lbnRTaGFkZXIuc2hhZGVyLCB0aGlzLmZyYWdtZW50U2hhZGVyLnNyYyk7XHJcblxyXG4gICAgICAgICAgICBHTC5hdHRhY2hTaGFkZXIodGhpcy5wcm9ncmFtLCB0aGlzLnZlcnRleFNoYWRlci5zaGFkZXIpO1xyXG4gICAgICAgICAgICBHTC5hdHRhY2hTaGFkZXIodGhpcy5wcm9ncmFtLCB0aGlzLmZyYWdtZW50U2hhZGVyLnNoYWRlcik7XHJcblxyXG4gICAgICAgICAgICBHTC5saW5rUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xyXG5cclxuICAgICAgICAgICAgaWYoIUdMLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5wcm9ncmFtLCBHTC5MSU5LX1NUQVRVUykpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRXJyb3IgbGlua2luZyBzaGFkZXIgcHJvZ3JhbTogXFxcIlwiICsgR0wuZ2V0UHJvZ3JhbUluZm9Mb2codGhpcy5wcm9ncmFtKSArIFwiXFxcIlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYodHlwZW9mIHRoaXMub25MaW5rZWQgIT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgICAgIHRoaXMub25MaW5rZWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogw5xyaXRhYiBrb21waWxlZXJpZGEgdmFyanVuZGFqYVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7V2ViR0xTaGFkZXJ9IHNoYWRlciBWYXJqdW5kYWphIG1pZGEga29tcGlsZWVyaWRhXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIEzDpGh0ZWtvb2QsIG1pZGEga29tcGlsZWVyaWRhXHJcbiAgICAgKi9cclxuICAgIGNvbXBpbGVTaGFkZXI6IGZ1bmN0aW9uKHNoYWRlciwgc291cmNlKSB7XHJcbiAgICAgICAgR0wuc2hhZGVyU291cmNlKHNoYWRlciwgc291cmNlKTtcclxuICAgICAgICBHTC5jb21waWxlU2hhZGVyKHNoYWRlcik7XHJcblxyXG4gICAgICAgIGlmICghR0wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgR0wuQ09NUElMRV9TVEFUVVMpKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiU2hhZGVyIGNvbXBpbGF0aW9uIGZhaWxlZC4gRXJyb3I6IFxcXCJcIiArIEdMLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKSArIFwiXFxcIlwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQW50dWQga2xhc3NpIGFiaWwgb24gdsO1aW1hbGlrIHByb2dyYW1taSBsYWFkaWRhIGphIGFzw7xua3Jvb25zZWx0IHRhZ2FwaWxkaWwgc3BldHNpZml0c2Vlcml0dWQgdmFyanVuZGFqYWRcclxuICogdGFnYXN0YXR1ZCBwcm9ncmFtbWlnYSBzaWR1ZGFcclxuICpcclxuICogQGNsYXNzIFNoYWRlclByb2dyYW1Mb2FkZXJcclxuICovXHJcbnZhciBTaGFkZXJQcm9ncmFtTG9hZGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmNvbnRhaW5lciA9IFtdO1xyXG4gICAgdGhpcy5jb3VudGVyID0gLTE7XHJcbn07XHJcblxyXG5TaGFkZXJQcm9ncmFtTG9hZGVyLnByb3RvdHlwZSA9IHtcclxuICAgIGNvbnN0cnVjdG9yOiBTaGFkZXJQcm9ncmFtTG9hZGVyLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGFnYXN0YWIgcHJvZ3JhbW0gb2JqZWt0aS4gQXPDvG5rcm9vbnNlbHQgdGFnYXBsYWFuaWwgbGFldGFrc2UgamEga29tcGlsZWVyaXRha3NlIHZhcmp1bmRhamFkLiBFbm5lIGt1aVxyXG4gICAgICogcHJvZ3JhbW1pIGthc3V0YWRhIHR1bGViIGtvbnRyb2xsaWRhLCBldCB2YXJqdW5kYWphZCBvbiBrb21waWxlZXJpdHVkIGphIHByb2dyYW1taWdhIHNlb3R1ZC4gVsO1aW1hbGlrIG9uXHJcbiAgICAgKiBwYXJhbWVldHJpa3MgYW5kYSBrYSBDYWxsYmFjayBmdW5rdHNpb29uLCBtaXMgdGVhZGEgYW5uYWIsIGt1aSB2YXJqdW5kYWphZCBvbiBzZW90dWQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleFNoYWRlclBhdGggVGVlLCB0aXB1dmFyanVuZGFqYSBqdXVyZGVcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmcmFnbWVudFNoYWRlclBhdGggVGVlLCBwaWtzbGl2YXJqdW5kYWphIGp1dXJkZVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlua2VkQ2FsbGJhY2sgRnVua3RzaW9vbiwgbWlzIGt1dHN1dGFrc2UgdsOkbGphLCBrdWkgdmFyanVuZGFqYWQgb24ga29tcGlsZWVyaXR1ZCBqYSBzZW90dWQgcHJvZ3JhbW1pZ2FcclxuICAgICAqIEByZXR1cm5zIHtleHBvcnRzLmRlZmF1bHRPcHRpb25zLnByb2dyYW18KnxXZWJHTFByb2dyYW18UHJvZ3JhbU9iamVjdC5wcm9ncmFtfVxyXG4gICAgICovXHJcbiAgICBnZXRQcm9ncmFtOiBmdW5jdGlvbih2ZXJ0ZXhTaGFkZXJQYXRoLCBmcmFnbWVudFNoYWRlclBhdGgsIGxpbmtlZENhbGxiYWNrKSB7XHJcbiAgICAgICAgdGhpcy5jb3VudGVyKys7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXJbdGhpcy5jb3VudGVyXSA9IG5ldyBQcm9ncmFtT2JqZWN0KHZlcnRleFNoYWRlclBhdGgsIGZyYWdtZW50U2hhZGVyUGF0aCwgbGlua2VkQ2FsbGJhY2spO1xyXG4gICAgICAgIHZhciBwcm9ncmFtID0gdGhpcy5jb250YWluZXJbdGhpcy5jb3VudGVyXTtcclxuXHJcbiAgICAgICAgdGhpcy5sb2FkQXN5bmNTaGFkZXJTb3VyY2UodmVydGV4U2hhZGVyUGF0aCwgcHJvZ3JhbS5vbmNvbXBsZXRlLmJpbmQocHJvZ3JhbSkpO1xyXG4gICAgICAgIHRoaXMubG9hZEFzeW5jU2hhZGVyU291cmNlKGZyYWdtZW50U2hhZGVyUGF0aCwgcHJvZ3JhbS5vbmNvbXBsZXRlLmJpbmQocHJvZ3JhbSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gcHJvZ3JhbS5wcm9ncmFtO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIExhZWIgYXPDvG5rcm9vbnNlbHRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2hhZGVyUGF0aCBUZWUsIGt1cyBhc3ViIHZhcmp1bmRhamFcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIEZ1bmt0c2lvb24sIG1pcyBrw6Rpdml0YXRha3NlLCBrdWkgbMOkaHRla29vZCBvbiBrw6R0dGUgc2FhZHVkLiBTYWFkZXRha3NlIHZhc3R1cyBqYSB0ZWUuXHJcbiAgICAgKi9cclxuICAgIGxvYWRBc3luY1NoYWRlclNvdXJjZTogZnVuY3Rpb24oc2hhZGVyUGF0aCwgY2FsbGJhY2spIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICBhc3luYzogdHJ1ZSxcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICB1cmw6IHNoYWRlclBhdGgsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVzdWx0LCBzaGFkZXJQYXRoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvZ3JhbU9iamVjdDtcclxubW9kdWxlLmV4cG9ydHMgPSBTaGFkZXJQcm9ncmFtTG9hZGVyOyJdfQ==
