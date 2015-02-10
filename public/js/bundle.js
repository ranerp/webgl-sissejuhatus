(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\prog\\webglstudy\\lessons\\lesson03\\main.js":[function(require,module,exports){
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
    var cameraAt = [0, 0, 5];            //Asub maailmaruumis nendel koordinaatidel
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


},{"./../utils/shaderprogramloader":"C:\\prog\\webglstudy\\lessons\\utils\\shaderprogramloader.js"}],"C:\\prog\\webglstudy\\lessons\\utils\\shaderprogramloader.js":[function(require,module,exports){
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
},{}]},{},["C:\\prog\\webglstudy\\lessons\\lesson03\\main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibGVzc29ucy9sZXNzb24wMy9tYWluLmpzIiwibGVzc29ucy91dGlscy9zaGFkZXJwcm9ncmFtbG9hZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vQW50dWQgb3NhIHRlZ2VsZWIgV2ViR0wga29udGVrc3RpIGxvb21pc2VnYSBqYSBtZWlsZSB2YWphbGlrdSBXZWJHTFByb2dyYW0gb2JqZWt0aSBsb29taXNlZ2EgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxudmFyIFNoYWRlclByb2dyYW1Mb2FkZXIgPSByZXF1aXJlKFwiLi8uLi91dGlscy9zaGFkZXJwcm9ncmFtbG9hZGVyXCIpO1xyXG5cclxuLy9WYXJqdW5kYWphdGUga2F0YWxvb2dcclxudmFyIFNIQURFUl9QQVRIID0gXCJzaGFkZXJzL2xlc3NvbjAzL1wiO1xyXG5cclxuLy9FbGVtZW50LCBrdWh1IHJlbmRlcmRhbWVcclxudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG5cclxuLy9Mb29tZSBnbG9iYWFsc2UgV2ViR0wga29udGVrc3RpXHJcbkdMID0gaW5pdFdlYkdMKGNhbnZhcyk7XHJcblxyXG4vL1NlYWRpc3RhbWUgcmVuZGVyZGFtaXNyZXNvbHV0c2lvb25pXHJcbkdMLnZpZXdwb3J0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcbkdMLnZpZXdwb3J0V2lkdGggPSBjYW52YXMud2lkdGg7XHJcbkdMLnZpZXdwb3J0SGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcclxuXHJcbi8vTG9vbWUgdXVlIHByb2dyYW1taSBzcGV0c2lmaXRzZWVyaXR1ZCB2YXJqdW5kYWphdGVnYS4gS3VuYSBsYWFkaW1pbmUgb24gYXPDvG5rcm9vbm5lLCBzaWlzIGFubmFtZSBrYWFzYSBrYVxyXG4vL21lZXRvZGksIG1pcyBrdXRzdXRha3NlIHbDpGxqYSBrdWkgdmFyanVuZGFqYWQgb24gbGFldHVkXHJcbnZhciBzaGFkZXJQcm9ncmFtTG9hZGVyID0gbmV3IFNoYWRlclByb2dyYW1Mb2FkZXIoKTtcclxudmFyIHNoYWRlclByb2dyYW0gPSBzaGFkZXJQcm9ncmFtTG9hZGVyLmdldFByb2dyYW0oU0hBREVSX1BBVEggKyBcInZlcnRleC5zaGFkZXJcIiwgU0hBREVSX1BBVEggKyBcImZyYWdtZW50LnNoYWRlclwiLCByZW5kZXIpO1xyXG5cclxuXHJcbi8vw5xyaXRhbWUgbHV1YSBXZWJHTCBrb250ZWtzdGlcclxuZnVuY3Rpb24gaW5pdFdlYkdMKGNhbnZhcykge1xyXG4gICAgdmFyIGdsID0gbnVsbDtcclxuXHJcbiAgICB0cnkge1xyXG5cclxuICAgICAgICAvL8Occml0YW1lIGx1dWEgdGF2YWxpc3Qga29udGVrc3RpLCBrdWkgc2VlIGViYcO1bm5lc3R1YiDDvHJpdGFtZSBsdXVhIGVrc3BlcmltZW50YWFsc2V0LFxyXG4gICAgICAgIC8vTWlkYSBrYXN1dGF0YWtzZSBzcGV0c2lmaWthdHNpb29uaSBhcmVuZGFtaXNla3NcclxuICAgICAgICBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIikgfHwgY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIik7XHJcblxyXG4gICAgfSBjYXRjaCAoZSkge31cclxuXHJcbiAgICBpZighZ2wpIHtcclxuICAgICAgICBhbGVydChcIlVuYWJsZSB0byBpbml0aWxpemUgV2ViR0wuIFlvdXIgYnJvd3NlciBtYXkgbm90IHN1cHBvcnQgaXQuXCIpO1xyXG4gICAgICAgIHRocm93IEVycm9yKFwiRXhlY3V0aW9uIHRlcm1pbmF0ZWQuIE5vIFdlYkdMIGNvbnRleHRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGdsO1xyXG59XHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gTEVTU09OMDMgLSBNQUFUUklLU0lEIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5mdW5jdGlvbiByZW5kZXIoKSB7XHJcblxyXG4gICAgLy9NdWRlbG1hYXRyaWtzLCBtaWxsZWdhIG9iamVrdGlydXVtaXN0IG1hYWlsbWFydXVtaSBzYWFkYVxyXG4gICAgdmFyIG1vZGVsTWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuXHJcbiAgICAvL1B1bmt0LCBrdXMgb2JqZWt0IGhldGtlbCBhc3ViXHJcbiAgICB2YXIgb2JqZWN0QXQgPSBbMC4wLCAwLjAsIC01LjBdO1xyXG5cclxuICAgIC8vS2FzdXRhZGVzIHRyYW5zbGF0c2lvb25pLCBzYWFtZSBtdWRlbG1hYXRyaWtzaWdhIG9iamVrdGkgbGlpZ3V0YWRhXHJcbiAgICBtYXQ0LnRyYW5zbGF0ZShtb2RlbE1hdHJpeCwgbW9kZWxNYXRyaXgsIG9iamVjdEF0KTtcclxuXHJcbiAgICAvL0thYW1lcmFtYWF0cmlrcywgbWlsbGVnYSBtYWFpbG1hcnV1bWlzdCBrYWFtZXJhcnV1bWkgc2FhZGFcclxuICAgIHZhciB2aWV3TWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuXHJcbiAgICAvL0RlZmluZWVyaW1lIHZla3RvcmlkLCBtaWxsZSBhYmlsIG9uIHbDtWltYWxpayBrYWFtZXJhcnV1bWkgYmFhc3Zla3RvcmlkIGFydnV0YWRhXHJcbiAgICB2YXIgY2FtZXJhQXQgPSBbMCwgMCwgNV07ICAgICAgICAgICAgLy9Bc3ViIG1hYWlsbWFydXVtaXMgbmVuZGVsIGtvb3JkaW5hYXRpZGVsXHJcbiAgICB2YXIgbG9va0F0ID0gWzAsIDAsIC0xXTsgICAgICAgICAgICAgLy9NaXMgc3V1bmFzIGthYW1lcmEgdmFhdGFiLiBQYXJlbWFrw6RlIGtvb3JkaW5hYXRzw7xzdGVlbWlzIG9uIC16IGVrcmFhbmkgc2lzc2VcclxuICAgIHZhciB1cCA9IFswLCAxLCAwXTsgICAgICAgICAgICAgICAgICAvL1Zla3RvciwgbWlzIG7DpGl0YWIsIGt1cyBvbiBrYWFtZXJhIMO8bGVzc2Ugc3V1bmRhIG7DpGl0YXYgdmVrdG9yXHJcblxyXG4gICAgLy9LYWxrdWxlZXJpbWUgYW50dWQga29vcmRpbmFhdGlkZSBqw6RyZ2kga2FhbWVyYW1hYXRyaWtzaVxyXG4gICAgbWF0NC5sb29rQXQodmlld01hdHJpeCwgY2FtZXJhQXQsIGxvb2tBdCwgdXApO1xyXG5cclxuICAgIC8vUHJvamVrdHNpb29uaW1hYXRyaWtzLCBldCBww7xnYW1pc3J1dW1pIHNhYWRhLiBLYXN1dGFkZXMgZ2xNYXRyaXggdGVla2kgZ2VuZXJlZXJpbWUga2EgcMO8cmFtaWlkaSwga3VodSBzaXNzZSBvYmpla3RpZCBsw6RoZXZhZC5cclxuICAgIHZhciBwcm9qZWN0aW9uTWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuICAgIG1hdDQucGVyc3BlY3RpdmUocHJvamVjdGlvbk1hdHJpeCwgNDUuMCwgR0wudmlld3BvcnRXaWR0aCAvIEdMLnZpZXdwb3J0SGVpZ2h0LCAxLjAsIDEwMDAuMCk7XHJcblxyXG5cclxuXHJcblxyXG4gICAgLy9UaXBwdWRlIGFuZG1lZFxyXG4gICAgdmFyIG15VmVydGljZXNEYXRhID0gW1xyXG4gICAgICAgIC0xLjAsIC0xLjAsICAxLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgIDEuMCxcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMS4wXHJcbiAgICBdO1xyXG5cclxuICAgIC8vTG9vbWUgcHVodnJpLCBrdWh1IHRpcHVhbmRtZWQgdmlpYS4gU2VvbWUga2EgYW50dWQgcHVodnJpIGtvbnRla3N0aWdhLCBldCB0ZW1hbGUga8Okc2tlIGVkYXNpIGFuZGFcclxuICAgIHZhciB2ZXJ0ZXhCdWZmZXIgPSBHTC5jcmVhdGVCdWZmZXIoKTtcclxuXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkFSUkFZX0JVRkZFUiwgdmVydGV4QnVmZmVyKTtcclxuXHJcbiAgICAvL0FubmFtZSBsb29kdWQgcHVodnJpbGUgYW5kbWVkXHJcbiAgICBHTC5idWZmZXJEYXRhKEdMLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShteVZlcnRpY2VzRGF0YSksIEdMLlNUQVRJQ19EUkFXKTtcclxuXHJcbiAgICAvL1RpcHB1ZGUgaW5kZWtzaWRcclxuICAgIHZhciBteUluZGljZXNEYXRhID0gW1xyXG4gICAgICAgIDAsICAxLCAgMixcclxuICAgICAgICAwLCAgMiwgIDNcclxuICAgIF07XHJcblxyXG4gICAgLy9Mb29tZSBwdWh2cmksIGt1aHUgaW5kZWtzaWQgdmlpYS4gU2VvbWUga2EgYW50dWQgcHVodnJpIGtvbnRla3N0aWdhLCBldCB0ZW1hbGUga8Okc2tlIGVkYXNpIGFuZGFcclxuICAgIHZhciBpbmRleEJ1ZmZlciA9IEdMLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgaW5kZXhCdWZmZXIubnVtYmVyT2ZJbmRleGVzID0gNjtcclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGluZGV4QnVmZmVyKTtcclxuXHJcbiAgICAvL0FubmFtZSBsb29kdWQgcHVodnJpbGUgYW5kbWVkXHJcbiAgICBHTC5idWZmZXJEYXRhKEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBuZXcgVWludDE2QXJyYXkobXlJbmRpY2VzRGF0YSksIEdMLlNUQVRJQ19EUkFXKTtcclxuXHJcbiAgICAvL1RpcHB1ZGUgdsOkcnZpZFxyXG4gICAgdmFyIG15VmVydGljZXNDb2xvciA9IFtcclxuICAgICAgICAxLjAsICAwLjAsICAwLjAsICAgLy8gVGlwcCAxIHB1bmFuZVxyXG4gICAgICAgIDAuMCwgIDEuMCwgIDAuMCwgICAvLyBUaXBwIDIgcm9oZWxpbmVcclxuICAgICAgICAwLjAsICAwLjAsICAxLjAsICAgLy8gVGlwcCAzIHNpbmluZVxyXG4gICAgICAgIDEuMCwgIDEuMCwgIDAuMCAgICAvL1RpcHAgNCBrb2xsYW5lXHJcbiAgICBdO1xyXG5cclxuICAgIC8vTG9vbWUgcHVodnJpIGphIHNlb21lIGtvbnRla3N0aWdhXHJcbiAgICB2YXIgY29sb3JCdWZmZXIgPSBHTC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuQVJSQVlfQlVGRkVSLCBjb2xvckJ1ZmZlcik7XHJcblxyXG4gICAgLy9Bbm5hbWUga29udGVrc3RpZ2Egc2VvdHVkIHB1aHZyaWxlIGFuZG1lZFxyXG4gICAgR0wuYnVmZmVyRGF0YShHTC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkobXlWZXJ0aWNlc0NvbG9yKSwgR0wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgIC8vTcOkw6RyYW1lIHByb2dyYW1taSwgbWlkYSBtZSByZW5kZXJkYW1pc2VsIGthc3V0YWRhIHRhaGFtZVxyXG4gICAgR0wudXNlUHJvZ3JhbShzaGFkZXJQcm9ncmFtKTtcclxuXHJcbiAgICAvL1NhYW1lIGluZGVrc2ksIG1pcyBuw6RpdGFiIGt1cyBhc3ViIG1laWUgcHJvZ3JhbW1pcyBrYXN1dGF0YXZhcyB0aXB1dmFyanVuZGFqYXNcclxuICAgIC8vb2xldiB0aXB1YXRyaWJ1dXQgbmltZWdhIGFfVmVydGV4UG9zaXRpb25cclxuICAgIHZhciBhX1Bvc2l0aW9uID0gR0wuZ2V0QXR0cmliTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJhX1Bvc2l0aW9uXCIpO1xyXG5cclxuICAgIC8vU2FhbWUgdsOkcnZpYXRyaWJ1dWRpIGFzdWtvaGFcclxuICAgIHZhciBhX0NvbG9yID0gR0wuZ2V0QXR0cmliTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJhX0NvbG9yXCIpO1xyXG5cclxuICAgIC8vU2FhbWUgw7xodHNldGUgbXV1dHVqYXRlIGFzdWtvaGFkXHJcbiAgICB2YXIgdV9Nb2RlbE1hdHJpeCA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfTW9kZWxNYXRyaXhcIik7XHJcbiAgICB2YXIgdV9WaWV3TWF0cml4ID0gR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9WaWV3TWF0cml4XCIpO1xyXG4gICAgdmFyIHVfUHJvamVjdGlvbk1hdHJpeCA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfUHJvamVjdGlvbk1hdHJpeFwiKTtcclxuXHJcbiAgICAvL1NlZWtvcmQgZW5uZSByZW5kZXJkYW1pc3QgcHVoYXN0YW1lIGthIHbDpHJ2aS0gamEgc8O8Z2F2dXNwdWh2cmlkLCBuaW5nIG3DpMOkcmFtZSB1dWUgcHVoYXN0dXbDpHJ2dXNlLlxyXG4gICAgLy9IZXRrZWwgcHVoYXN0YW1pbmUgbWlkYWdpIGVpIHRlZSwgc2VzdCBtZSByZW5kZXJkYW1lIHZhaWQgw7xoZSBrb3JyYSwga3VpZCBrdWkgbWUgdHPDvGtrbGlzIHNlZGEgdGVnZW1hXHJcbiAgICAvL29uIG7DpGhhIGthLCBtaWRhIG5hZCB0ZWV2YWQuXHJcbiAgICBHTC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjAsIDEuMCk7XHJcbiAgICBHTC5jbGVhcihHTC5DT0xPUl9CVUZGRVJfQklUIHwgR0wuREVQVEhfQlVGRkVSX0JJVCk7XHJcblxyXG4gICAgLy9TZW9tZSB0aXB1cHVodnJpIGphIG3DpMOkcmFtZSwga3VzIGFudHVkIHRpcHVhdHJpYnV1dCBhc3ViIGFudHVkIG1hc3NpaXZpcy5cclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuQVJSQVlfQlVGRkVSLCB2ZXJ0ZXhCdWZmZXIpO1xyXG4gICAgR0wudmVydGV4QXR0cmliUG9pbnRlcihhX1Bvc2l0aW9uLCAzLCBHTC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG5cclxuICAgIC8vU2VvbWUgdsOkcnZpcHVodnJpIGphIG3DpMOkcmFtZSwga3VzIGFudHVkIGF0cmlidXV0IGFzdWIgYW50dWQgbWFzc2lpdmlzLlxyXG4gICAgR0wuYmluZEJ1ZmZlcihHTC5BUlJBWV9CVUZGRVIsIGNvbG9yQnVmZmVyKTtcclxuICAgIEdMLnZlcnRleEF0dHJpYlBvaW50ZXIoYV9Db2xvciwgMywgR0wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcclxuXHJcbiAgICAvL0FrdGl2ZWVyaW1lIGF0cmlidXVkaWRcclxuICAgIEdMLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGFfUG9zaXRpb24pO1xyXG4gICAgR0wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoYV9Db2xvcik7XHJcblxyXG4gICAgLy9TYWFkYW1lIG1laWUgbWFhdHJpa3NpZCBrYSB2YXJqdW5kYWphc3NlXHJcbiAgICBHTC51bmlmb3JtTWF0cml4NGZ2KHVfTW9kZWxNYXRyaXgsIGZhbHNlLCBtb2RlbE1hdHJpeCk7XHJcbiAgICBHTC51bmlmb3JtTWF0cml4NGZ2KHVfVmlld01hdHJpeCwgZmFsc2UsIHZpZXdNYXRyaXgpO1xyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdih1X1Byb2plY3Rpb25NYXRyaXgsIGZhbHNlLCBwcm9qZWN0aW9uTWF0cml4KTtcclxuXHJcbiAgICAvL1JlbmRlcmRhbWUga29sbW51cmdhZCBpbmRla3NpdGUgasOkcmdpXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpbmRleEJ1ZmZlcik7XHJcbiAgICBHTC5kcmF3RWxlbWVudHMoR0wuVFJJQU5HTEVTLCBpbmRleEJ1ZmZlci5udW1iZXJPZkluZGV4ZXMsIEdMLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuXHJcblxyXG59XHJcblxyXG4iLCIvKipcclxuICogSG9pYWIgZW5kYXMgV2ViR0xQcm9ncmFtIG9iamVrdGkgamEgV2ViR0xTaGFkZXIgdGlwdXZhcmp1bmRhamF0IGphIHBpa3NsaXZhcmp1bmRhamF0XHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJ0ZXhTaGFkZXJQYXRoXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmcmFnbWVudFNoYWRlclBhdGhcclxuICogQHBhcmFtIHtmdW5jdGlvbn0gb25MaW5rZWQgTWVldG9kLCBtaXMga3V0c3V0YWtzZSB2w6RsamEsIGt1aSB2YXJqdW5kYWphZCBvbiBsYWV0dWRcclxuICogQGNsYXNzXHJcbiAqL1xyXG52YXIgUHJvZ3JhbU9iamVjdCA9IGZ1bmN0aW9uKHZlcnRleFNoYWRlclBhdGgsIGZyYWdtZW50U2hhZGVyUGF0aCwgb25MaW5rZWQpIHtcclxuICAgIHRoaXMucHJvZ3JhbSA9IEdMLmNyZWF0ZVByb2dyYW0oKTtcclxuXHJcbiAgICB0aGlzLm9uTGlua2VkID0gb25MaW5rZWQ7XHJcblxyXG4gICAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB7XHJcbiAgICAgICAgXCJzaGFkZXJcIjogR0wuY3JlYXRlU2hhZGVyKEdMLlZFUlRFWF9TSEFERVIpLFxyXG4gICAgICAgIFwicGF0aFwiOiB2ZXJ0ZXhTaGFkZXJQYXRoLFxyXG4gICAgICAgIFwic3JjXCI6IFwiXCIsXHJcbiAgICAgICAgXCJjb21wbGV0ZWRcIjogZmFsc2VcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHtcclxuICAgICAgICBcInNoYWRlclwiOiBHTC5jcmVhdGVTaGFkZXIoR0wuRlJBR01FTlRfU0hBREVSKSxcclxuICAgICAgICBcInBhdGhcIjogZnJhZ21lbnRTaGFkZXJQYXRoLFxyXG4gICAgICAgIFwic3JjXCI6IFwiXCIsXHJcbiAgICAgICAgXCJjb21wbGV0ZWRcIjogZmFsc2VcclxuICAgIH07XHJcbn07XHJcblxyXG5Qcm9ncmFtT2JqZWN0LnByb3RvdHlwZSA9IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcjogUHJvZ3JhbU9iamVjdCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxiYWNrIG1lZXRvZCwgbWlzIGtvbXBpbGVlcmliIGphIHPDpHRlc3RhYiB2YXJqdW5kYWphZCwga3VpIG3DtWxlbWFkIG9uIGFzw7xua3Jvb25zZWx0IGxhZXR1ZFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcmMgTMOkaHRla29vZCwgbWlzIEFKQVgnaSBhYmlsIGxhZXRpXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUZWUsIG1pbGxlIGFiaWwgdHV2YXN0YWRhLCBrdW1tYSB2YXJqdW5kYWphIGzDpGh0ZWtvb2Qgb24gbGFldHVkXHJcbiAgICAgKi9cclxuICAgIG9uY29tcGxldGU6IGZ1bmN0aW9uKHNyYywgcGF0aCkge1xyXG4gICAgICAgIGlmKHBhdGggPT09IHRoaXMudmVydGV4U2hhZGVyLnBhdGgpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhTaGFkZXIuY29tcGxldGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhTaGFkZXIuc3JjID0gc3JjO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKHBhdGggPT09IHRoaXMuZnJhZ21lbnRTaGFkZXIucGF0aCkge1xyXG4gICAgICAgICAgICB0aGlzLmZyYWdtZW50U2hhZGVyLmNvbXBsZXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIuc3JjID0gc3JjO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodGhpcy52ZXJ0ZXhTaGFkZXIuY29tcGxldGVkICYmIHRoaXMuZnJhZ21lbnRTaGFkZXIuY29tcGxldGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZVNoYWRlcih0aGlzLnZlcnRleFNoYWRlci5zaGFkZXIsIHRoaXMudmVydGV4U2hhZGVyLnNyYyk7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZVNoYWRlcih0aGlzLmZyYWdtZW50U2hhZGVyLnNoYWRlciwgdGhpcy5mcmFnbWVudFNoYWRlci5zcmMpO1xyXG5cclxuICAgICAgICAgICAgR0wuYXR0YWNoU2hhZGVyKHRoaXMucHJvZ3JhbSwgdGhpcy52ZXJ0ZXhTaGFkZXIuc2hhZGVyKTtcclxuICAgICAgICAgICAgR0wuYXR0YWNoU2hhZGVyKHRoaXMucHJvZ3JhbSwgdGhpcy5mcmFnbWVudFNoYWRlci5zaGFkZXIpO1xyXG5cclxuICAgICAgICAgICAgR0wubGlua1Byb2dyYW0odGhpcy5wcm9ncmFtKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCFHTC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMucHJvZ3JhbSwgR0wuTElOS19TVEFUVVMpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVycm9yIGxpbmtpbmcgc2hhZGVyIHByb2dyYW06IFxcXCJcIiArIEdMLmdldFByb2dyYW1JbmZvTG9nKHRoaXMucHJvZ3JhbSkgKyBcIlxcXCJcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmKHR5cGVvZiB0aGlzLm9uTGlua2VkICE9IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uTGlua2VkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIMOccml0YWIga29tcGlsZWVyaWRhIHZhcmp1bmRhamFcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1dlYkdMU2hhZGVyfSBzaGFkZXIgVmFyanVuZGFqYSBtaWRhIGtvbXBpbGVlcmlkYVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSBMw6RodGVrb29kLCBtaWRhIGtvbXBpbGVlcmlkYVxyXG4gICAgICovXHJcbiAgICBjb21waWxlU2hhZGVyOiBmdW5jdGlvbihzaGFkZXIsIHNvdXJjZSkge1xyXG4gICAgICAgIEdMLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XHJcbiAgICAgICAgR0wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xyXG5cclxuICAgICAgICBpZiAoIUdMLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIEdMLkNPTVBJTEVfU1RBVFVTKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIlNoYWRlciBjb21waWxhdGlvbiBmYWlsZWQuIEVycm9yOiBcXFwiXCIgKyBHTC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikgKyBcIlxcXCJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFudHVkIGtsYXNzaSBhYmlsIG9uIHbDtWltYWxpayBwcm9ncmFtbWkgbGFhZGlkYSBqYSBhc8O8bmtyb29uc2VsdCB0YWdhcGlsZGlsIHNwZXRzaWZpdHNlZXJpdHVkIHZhcmp1bmRhamFkXHJcbiAqIHRhZ2FzdGF0dWQgcHJvZ3JhbW1pZ2Egc2lkdWRhXHJcbiAqXHJcbiAqIEBjbGFzcyBTaGFkZXJQcm9ncmFtTG9hZGVyXHJcbiAqL1xyXG52YXIgU2hhZGVyUHJvZ3JhbUxvYWRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5jb250YWluZXIgPSBbXTtcclxuICAgIHRoaXMuY291bnRlciA9IC0xO1xyXG59O1xyXG5cclxuU2hhZGVyUHJvZ3JhbUxvYWRlci5wcm90b3R5cGUgPSB7XHJcbiAgICBjb25zdHJ1Y3RvcjogU2hhZGVyUHJvZ3JhbUxvYWRlcixcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRhZ2FzdGFiIHByb2dyYW1tIG9iamVrdGkuIEFzw7xua3Jvb25zZWx0IHRhZ2FwbGFhbmlsIGxhZXRha3NlIGphIGtvbXBpbGVlcml0YWtzZSB2YXJqdW5kYWphZC4gRW5uZSBrdWlcclxuICAgICAqIHByb2dyYW1taSBrYXN1dGFkYSB0dWxlYiBrb250cm9sbGlkYSwgZXQgdmFyanVuZGFqYWQgb24ga29tcGlsZWVyaXR1ZCBqYSBwcm9ncmFtbWlnYSBzZW90dWQuIFbDtWltYWxpayBvblxyXG4gICAgICogcGFyYW1lZXRyaWtzIGFuZGEga2EgQ2FsbGJhY2sgZnVua3RzaW9vbiwgbWlzIHRlYWRhIGFubmFiLCBrdWkgdmFyanVuZGFqYWQgb24gc2VvdHVkLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJ0ZXhTaGFkZXJQYXRoIFRlZSwgdGlwdXZhcmp1bmRhamEganV1cmRlXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRTaGFkZXJQYXRoIFRlZSwgcGlrc2xpdmFyanVuZGFqYSBqdXVyZGVcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpbmtlZENhbGxiYWNrIEZ1bmt0c2lvb24sIG1pcyBrdXRzdXRha3NlIHbDpGxqYSwga3VpIHZhcmp1bmRhamFkIG9uIGtvbXBpbGVlcml0dWQgamEgc2VvdHVkIHByb2dyYW1taWdhXHJcbiAgICAgKiBAcmV0dXJucyB7ZXhwb3J0cy5kZWZhdWx0T3B0aW9ucy5wcm9ncmFtfCp8V2ViR0xQcm9ncmFtfFByb2dyYW1PYmplY3QucHJvZ3JhbX1cclxuICAgICAqL1xyXG4gICAgZ2V0UHJvZ3JhbTogZnVuY3Rpb24odmVydGV4U2hhZGVyUGF0aCwgZnJhZ21lbnRTaGFkZXJQYXRoLCBsaW5rZWRDYWxsYmFjaykge1xyXG4gICAgICAgIHRoaXMuY291bnRlcisrO1xyXG4gICAgICAgIHRoaXMuY29udGFpbmVyW3RoaXMuY291bnRlcl0gPSBuZXcgUHJvZ3JhbU9iamVjdCh2ZXJ0ZXhTaGFkZXJQYXRoLCBmcmFnbWVudFNoYWRlclBhdGgsIGxpbmtlZENhbGxiYWNrKTtcclxuICAgICAgICB2YXIgcHJvZ3JhbSA9IHRoaXMuY29udGFpbmVyW3RoaXMuY291bnRlcl07XHJcblxyXG4gICAgICAgIHRoaXMubG9hZEFzeW5jU2hhZGVyU291cmNlKHZlcnRleFNoYWRlclBhdGgsIHByb2dyYW0ub25jb21wbGV0ZS5iaW5kKHByb2dyYW0pKTtcclxuICAgICAgICB0aGlzLmxvYWRBc3luY1NoYWRlclNvdXJjZShmcmFnbWVudFNoYWRlclBhdGgsIHByb2dyYW0ub25jb21wbGV0ZS5iaW5kKHByb2dyYW0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2dyYW0ucHJvZ3JhbTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMYWViIGFzw7xua3Jvb25zZWx0IGzDpGh0ZWtvb2RpXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNoYWRlclBhdGggVGVlLCBrdXMgYXN1YiB2YXJqdW5kYWphXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBGdW5rdHNpb29uLCBtaXMga8OkaXZpdGF0YWtzZSwga3VpIGzDpGh0ZWtvb2Qgb24ga8OkdHRlIHNhYWR1ZC4gU2FhZGV0YWtzZSB2YXN0dXMgamEgdGVlLlxyXG4gICAgICovXHJcbiAgICBsb2FkQXN5bmNTaGFkZXJTb3VyY2U6IGZ1bmN0aW9uKHNoYWRlclBhdGgsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgYXN5bmM6IHRydWUsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcInRleHRcIixcclxuICAgICAgICAgICAgdXJsOiBzaGFkZXJQYXRoLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlc3VsdCwgc2hhZGVyUGF0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb2dyYW1PYmplY3Q7XHJcbm1vZHVsZS5leHBvcnRzID0gU2hhZGVyUHJvZ3JhbUxvYWRlcjsiXX0=
