(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\prog\\webglstudy\\lessons\\lesson00\\main.js":[function(require,module,exports){
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////Antud osa tegeleb WebGL konteksti loomisega ja meile vajaliku WebGLProgram objekti loomisega ///////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ShaderProgramLoader = require("./../utils/shaderprogramloader");

//Varjundajate kataloog
var SHADER_PATH = "shaders/lesson00/";

//Element, kuhu renderdame
var canvas = document.getElementById("canvas");

//Loome globaalse WebGL konteksti
GL = initWebGL(canvas);

//Seadistame renderdamisresolutsiooni
GL.viewport(0, 0, canvas.width, canvas.height);

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
//////////////////////////////////////////////////////// LESSON00 //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function render() {

    //Tippude andmed, mis moodustavad ühe kolmnurga
    var myVerticesData = [
        0.0,   1.0,  0.0,   // Tipp 1
       -1.0,  -1.0,  0.0,   // Tipp 2
        1.0,  -1.0,  0.0    // Tipp 3
    ];

    //Loome puhvri, kuhu tipuandmed viia. Seome ka antud puhvri kontekstiga, et temale käske edasi anda
    var vertexBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, vertexBuffer);

    //Anname loodud puhvrile andmed
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(myVerticesData), GL.STATIC_DRAW);

    //Määrame programmi, mida me renderdamisel kasutada tahame
     GL.useProgram(shaderProgram);

    //Saame indeksi, mis näitab kus asub meie programmis kasutatavas tipuvarjundajas
    //olev tipuatribuut nimega a_VertexPosition
    var a_Position = GL.getAttribLocation(shaderProgram, "a_Position");

    //Määrame, kus antud tipuatribuut meie poolt kontekstiga seotud puhvris asub.
    GL.vertexAttribPointer(a_Position, 3, GL.FLOAT, false, 0, 0);

    //Aktiveerime eelpool küsitud atribuudi
    GL.enableVertexAttribArray(a_Position);


    //Renderdame Kolmnurgad
    GL.drawArrays(GL.TRIANGLES, 0, 3);
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
},{}]},{},["C:\\prog\\webglstudy\\lessons\\lesson00\\main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibGVzc29ucy9sZXNzb24wMC9tYWluLmpzIiwibGVzc29ucy91dGlscy9zaGFkZXJwcm9ncmFtbG9hZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vQW50dWQgb3NhIHRlZ2VsZWIgV2ViR0wga29udGVrc3RpIGxvb21pc2VnYSBqYSBtZWlsZSB2YWphbGlrdSBXZWJHTFByb2dyYW0gb2JqZWt0aSBsb29taXNlZ2EgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxudmFyIFNoYWRlclByb2dyYW1Mb2FkZXIgPSByZXF1aXJlKFwiLi8uLi91dGlscy9zaGFkZXJwcm9ncmFtbG9hZGVyXCIpO1xyXG5cclxuLy9WYXJqdW5kYWphdGUga2F0YWxvb2dcclxudmFyIFNIQURFUl9QQVRIID0gXCJzaGFkZXJzL2xlc3NvbjAwL1wiO1xyXG5cclxuLy9FbGVtZW50LCBrdWh1IHJlbmRlcmRhbWVcclxudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG5cclxuLy9Mb29tZSBnbG9iYWFsc2UgV2ViR0wga29udGVrc3RpXHJcbkdMID0gaW5pdFdlYkdMKGNhbnZhcyk7XHJcblxyXG4vL1NlYWRpc3RhbWUgcmVuZGVyZGFtaXNyZXNvbHV0c2lvb25pXHJcbkdMLnZpZXdwb3J0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcblxyXG4vL0xvb21lIHV1ZSBwcm9ncmFtbWkgc3BldHNpZml0c2Vlcml0dWQgdmFyanVuZGFqYXRlZ2EuIEt1bmEgbGFhZGltaW5lIG9uIGFzw7xua3Jvb25uZSwgc2lpcyBhbm5hbWUga2Fhc2Ega2FcclxuLy9tZWV0b2RpLCBtaXMga3V0c3V0YWtzZSB2w6RsamEga3VpIHZhcmp1bmRhamFkIG9uIGxhZXR1ZFxyXG52YXIgc2hhZGVyUHJvZ3JhbUxvYWRlciA9IG5ldyBTaGFkZXJQcm9ncmFtTG9hZGVyKCk7XHJcbnZhciBzaGFkZXJQcm9ncmFtID0gc2hhZGVyUHJvZ3JhbUxvYWRlci5nZXRQcm9ncmFtKFNIQURFUl9QQVRIICsgXCJ2ZXJ0ZXguc2hhZGVyXCIsIFNIQURFUl9QQVRIICsgXCJmcmFnbWVudC5zaGFkZXJcIiwgcmVuZGVyKTtcclxuXHJcblxyXG4vL8Occml0YW1lIGx1dWEgV2ViR0wga29udGVrc3RpXHJcbmZ1bmN0aW9uIGluaXRXZWJHTChjYW52YXMpIHtcclxuICAgIHZhciBnbCA9IG51bGw7XHJcblxyXG4gICAgdHJ5IHtcclxuXHJcbiAgICAgICAgLy/DnHJpdGFtZSBsdXVhIHRhdmFsaXN0IGtvbnRla3N0aSwga3VpIHNlZSBlYmHDtW5uZXN0dWIgw7xyaXRhbWUgbHV1YSBla3NwZXJpbWVudGFhbHNldCxcclxuICAgICAgICAvL01pZGEga2FzdXRhdGFrc2Ugc3BldHNpZmlrYXRzaW9vbmkgYXJlbmRhbWlzZWtzXHJcbiAgICAgICAgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpIHx8IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIpO1xyXG5cclxuICAgIH0gY2F0Y2ggKGUpIHt9XHJcblxyXG4gICAgaWYoIWdsKSB7XHJcbiAgICAgICAgYWxlcnQoXCJVbmFibGUgdG8gaW5pdGlsaXplIFdlYkdMLiBZb3VyIGJyb3dzZXIgbWF5IG5vdCBzdXBwb3J0IGl0LlwiKTtcclxuICAgICAgICB0aHJvdyBFcnJvcihcIkV4ZWN1dGlvbiB0ZXJtaW5hdGVkLiBObyBXZWJHTCBjb250ZXh0XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBnbDtcclxufVxyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIExFU1NPTjAwIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuZnVuY3Rpb24gcmVuZGVyKCkge1xyXG5cclxuICAgIC8vVGlwcHVkZSBhbmRtZWQsIG1pcyBtb29kdXN0YXZhZCDDvGhlIGtvbG1udXJnYVxyXG4gICAgdmFyIG15VmVydGljZXNEYXRhID0gW1xyXG4gICAgICAgIDAuMCwgICAxLjAsICAwLjAsICAgLy8gVGlwcCAxXHJcbiAgICAgICAtMS4wLCAgLTEuMCwgIDAuMCwgICAvLyBUaXBwIDJcclxuICAgICAgICAxLjAsICAtMS4wLCAgMC4wICAgIC8vIFRpcHAgM1xyXG4gICAgXTtcclxuXHJcbiAgICAvL0xvb21lIHB1aHZyaSwga3VodSB0aXB1YW5kbWVkIHZpaWEuIFNlb21lIGthIGFudHVkIHB1aHZyaSBrb250ZWtzdGlnYSwgZXQgdGVtYWxlIGvDpHNrZSBlZGFzaSBhbmRhXHJcbiAgICB2YXIgdmVydGV4QnVmZmVyID0gR0wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkFSUkFZX0JVRkZFUiwgdmVydGV4QnVmZmVyKTtcclxuXHJcbiAgICAvL0FubmFtZSBsb29kdWQgcHVodnJpbGUgYW5kbWVkXHJcbiAgICBHTC5idWZmZXJEYXRhKEdMLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShteVZlcnRpY2VzRGF0YSksIEdMLlNUQVRJQ19EUkFXKTtcclxuXHJcbiAgICAvL03DpMOkcmFtZSBwcm9ncmFtbWksIG1pZGEgbWUgcmVuZGVyZGFtaXNlbCBrYXN1dGFkYSB0YWhhbWVcclxuICAgICBHTC51c2VQcm9ncmFtKHNoYWRlclByb2dyYW0pO1xyXG5cclxuICAgIC8vU2FhbWUgaW5kZWtzaSwgbWlzIG7DpGl0YWIga3VzIGFzdWIgbWVpZSBwcm9ncmFtbWlzIGthc3V0YXRhdmFzIHRpcHV2YXJqdW5kYWphc1xyXG4gICAgLy9vbGV2IHRpcHVhdHJpYnV1dCBuaW1lZ2EgYV9WZXJ0ZXhQb3NpdGlvblxyXG4gICAgdmFyIGFfUG9zaXRpb24gPSBHTC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcImFfUG9zaXRpb25cIik7XHJcblxyXG4gICAgLy9Nw6TDpHJhbWUsIGt1cyBhbnR1ZCB0aXB1YXRyaWJ1dXQgbWVpZSBwb29sdCBrb250ZWtzdGlnYSBzZW90dWQgcHVodnJpcyBhc3ViLlxyXG4gICAgR0wudmVydGV4QXR0cmliUG9pbnRlcihhX1Bvc2l0aW9uLCAzLCBHTC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG5cclxuICAgIC8vQWt0aXZlZXJpbWUgZWVscG9vbCBrw7xzaXR1ZCBhdHJpYnV1ZGlcclxuICAgIEdMLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGFfUG9zaXRpb24pO1xyXG5cclxuXHJcbiAgICAvL1JlbmRlcmRhbWUgS29sbW51cmdhZFxyXG4gICAgR0wuZHJhd0FycmF5cyhHTC5UUklBTkdMRVMsIDAsIDMpO1xyXG59XHJcblxyXG4iLCIvKipcclxuICogSG9pYWIgZW5kYXMgV2ViR0xQcm9ncmFtIG9iamVrdGkgamEgV2ViR0xTaGFkZXIgdGlwdXZhcmp1bmRhamF0IGphIHBpa3NsaXZhcmp1bmRhamF0XHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJ0ZXhTaGFkZXJQYXRoXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmcmFnbWVudFNoYWRlclBhdGhcclxuICogQHBhcmFtIHtmdW5jdGlvbn0gb25MaW5rZWQgTWVldG9kLCBtaXMga3V0c3V0YWtzZSB2w6RsamEsIGt1aSB2YXJqdW5kYWphZCBvbiBsYWV0dWRcclxuICogQGNsYXNzXHJcbiAqL1xyXG52YXIgUHJvZ3JhbU9iamVjdCA9IGZ1bmN0aW9uKHZlcnRleFNoYWRlclBhdGgsIGZyYWdtZW50U2hhZGVyUGF0aCwgb25MaW5rZWQpIHtcclxuICAgIHRoaXMucHJvZ3JhbSA9IEdMLmNyZWF0ZVByb2dyYW0oKTtcclxuXHJcbiAgICB0aGlzLm9uTGlua2VkID0gb25MaW5rZWQ7XHJcblxyXG4gICAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB7XHJcbiAgICAgICAgXCJzaGFkZXJcIjogR0wuY3JlYXRlU2hhZGVyKEdMLlZFUlRFWF9TSEFERVIpLFxyXG4gICAgICAgIFwicGF0aFwiOiB2ZXJ0ZXhTaGFkZXJQYXRoLFxyXG4gICAgICAgIFwic3JjXCI6IFwiXCIsXHJcbiAgICAgICAgXCJjb21wbGV0ZWRcIjogZmFsc2VcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHtcclxuICAgICAgICBcInNoYWRlclwiOiBHTC5jcmVhdGVTaGFkZXIoR0wuRlJBR01FTlRfU0hBREVSKSxcclxuICAgICAgICBcInBhdGhcIjogZnJhZ21lbnRTaGFkZXJQYXRoLFxyXG4gICAgICAgIFwic3JjXCI6IFwiXCIsXHJcbiAgICAgICAgXCJjb21wbGV0ZWRcIjogZmFsc2VcclxuICAgIH07XHJcbn07XHJcblxyXG5Qcm9ncmFtT2JqZWN0LnByb3RvdHlwZSA9IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcjogUHJvZ3JhbU9iamVjdCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxiYWNrIG1lZXRvZCwgbWlzIGtvbXBpbGVlcmliIGphIHPDpHRlc3RhYiB2YXJqdW5kYWphZCwga3VpIG3DtWxlbWFkIG9uIGFzw7xua3Jvb25zZWx0IGxhZXR1ZFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcmMgTMOkaHRla29vZCwgbWlzIEFKQVgnaSBhYmlsIGxhZXRpXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUZWUsIG1pbGxlIGFiaWwgdHV2YXN0YWRhLCBrdW1tYSB2YXJqdW5kYWphIGzDpGh0ZWtvb2Qgb24gbGFldHVkXHJcbiAgICAgKi9cclxuICAgIG9uY29tcGxldGU6IGZ1bmN0aW9uKHNyYywgcGF0aCkge1xyXG4gICAgICAgIGlmKHBhdGggPT09IHRoaXMudmVydGV4U2hhZGVyLnBhdGgpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhTaGFkZXIuY29tcGxldGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhTaGFkZXIuc3JjID0gc3JjO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKHBhdGggPT09IHRoaXMuZnJhZ21lbnRTaGFkZXIucGF0aCkge1xyXG4gICAgICAgICAgICB0aGlzLmZyYWdtZW50U2hhZGVyLmNvbXBsZXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIuc3JjID0gc3JjO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodGhpcy52ZXJ0ZXhTaGFkZXIuY29tcGxldGVkICYmIHRoaXMuZnJhZ21lbnRTaGFkZXIuY29tcGxldGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZVNoYWRlcih0aGlzLnZlcnRleFNoYWRlci5zaGFkZXIsIHRoaXMudmVydGV4U2hhZGVyLnNyYyk7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZVNoYWRlcih0aGlzLmZyYWdtZW50U2hhZGVyLnNoYWRlciwgdGhpcy5mcmFnbWVudFNoYWRlci5zcmMpO1xyXG5cclxuICAgICAgICAgICAgR0wuYXR0YWNoU2hhZGVyKHRoaXMucHJvZ3JhbSwgdGhpcy52ZXJ0ZXhTaGFkZXIuc2hhZGVyKTtcclxuICAgICAgICAgICAgR0wuYXR0YWNoU2hhZGVyKHRoaXMucHJvZ3JhbSwgdGhpcy5mcmFnbWVudFNoYWRlci5zaGFkZXIpO1xyXG5cclxuICAgICAgICAgICAgR0wubGlua1Byb2dyYW0odGhpcy5wcm9ncmFtKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCFHTC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMucHJvZ3JhbSwgR0wuTElOS19TVEFUVVMpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVycm9yIGxpbmtpbmcgc2hhZGVyIHByb2dyYW06IFxcXCJcIiArIEdMLmdldFByb2dyYW1JbmZvTG9nKHRoaXMucHJvZ3JhbSkgKyBcIlxcXCJcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmKHR5cGVvZiB0aGlzLm9uTGlua2VkICE9IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uTGlua2VkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIMOccml0YWIga29tcGlsZWVyaWRhIHZhcmp1bmRhamFcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1dlYkdMU2hhZGVyfSBzaGFkZXIgVmFyanVuZGFqYSBtaWRhIGtvbXBpbGVlcmlkYVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSBMw6RodGVrb29kLCBtaWRhIGtvbXBpbGVlcmlkYVxyXG4gICAgICovXHJcbiAgICBjb21waWxlU2hhZGVyOiBmdW5jdGlvbihzaGFkZXIsIHNvdXJjZSkge1xyXG4gICAgICAgIEdMLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XHJcbiAgICAgICAgR0wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xyXG5cclxuICAgICAgICBpZiAoIUdMLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIEdMLkNPTVBJTEVfU1RBVFVTKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIlNoYWRlciBjb21waWxhdGlvbiBmYWlsZWQuIEVycm9yOiBcXFwiXCIgKyBHTC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikgKyBcIlxcXCJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFudHVkIGtsYXNzaSBhYmlsIG9uIHbDtWltYWxpayBwcm9ncmFtbWkgbGFhZGlkYSBqYSBhc8O8bmtyb29uc2VsdCB0YWdhcGlsZGlsIHNwZXRzaWZpdHNlZXJpdHVkIHZhcmp1bmRhamFkXHJcbiAqIHRhZ2FzdGF0dWQgcHJvZ3JhbW1pZ2Egc2lkdWRhXHJcbiAqXHJcbiAqIEBjbGFzcyBTaGFkZXJQcm9ncmFtTG9hZGVyXHJcbiAqL1xyXG52YXIgU2hhZGVyUHJvZ3JhbUxvYWRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5jb250YWluZXIgPSBbXTtcclxuICAgIHRoaXMuY291bnRlciA9IC0xO1xyXG59O1xyXG5cclxuU2hhZGVyUHJvZ3JhbUxvYWRlci5wcm90b3R5cGUgPSB7XHJcbiAgICBjb25zdHJ1Y3RvcjogU2hhZGVyUHJvZ3JhbUxvYWRlcixcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRhZ2FzdGFiIHByb2dyYW1tIG9iamVrdGkuIEFzw7xua3Jvb25zZWx0IHRhZ2FwbGFhbmlsIGxhZXRha3NlIGphIGtvbXBpbGVlcml0YWtzZSB2YXJqdW5kYWphZC4gRW5uZSBrdWlcclxuICAgICAqIHByb2dyYW1taSBrYXN1dGFkYSB0dWxlYiBrb250cm9sbGlkYSwgZXQgdmFyanVuZGFqYWQgb24ga29tcGlsZWVyaXR1ZCBqYSBwcm9ncmFtbWlnYSBzZW90dWQuIFbDtWltYWxpayBvblxyXG4gICAgICogcGFyYW1lZXRyaWtzIGFuZGEga2EgQ2FsbGJhY2sgZnVua3RzaW9vbiwgbWlzIHRlYWRhIGFubmFiLCBrdWkgdmFyanVuZGFqYWQgb24gc2VvdHVkLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJ0ZXhTaGFkZXJQYXRoIFRlZSwgdGlwdXZhcmp1bmRhamEganV1cmRlXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRTaGFkZXJQYXRoIFRlZSwgcGlrc2xpdmFyanVuZGFqYSBqdXVyZGVcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpbmtlZENhbGxiYWNrIEZ1bmt0c2lvb24sIG1pcyBrdXRzdXRha3NlIHbDpGxqYSwga3VpIHZhcmp1bmRhamFkIG9uIGtvbXBpbGVlcml0dWQgamEgc2VvdHVkIHByb2dyYW1taWdhXHJcbiAgICAgKiBAcmV0dXJucyB7ZXhwb3J0cy5kZWZhdWx0T3B0aW9ucy5wcm9ncmFtfCp8V2ViR0xQcm9ncmFtfFByb2dyYW1PYmplY3QucHJvZ3JhbX1cclxuICAgICAqL1xyXG4gICAgZ2V0UHJvZ3JhbTogZnVuY3Rpb24odmVydGV4U2hhZGVyUGF0aCwgZnJhZ21lbnRTaGFkZXJQYXRoLCBsaW5rZWRDYWxsYmFjaykge1xyXG4gICAgICAgIHRoaXMuY291bnRlcisrO1xyXG4gICAgICAgIHRoaXMuY29udGFpbmVyW3RoaXMuY291bnRlcl0gPSBuZXcgUHJvZ3JhbU9iamVjdCh2ZXJ0ZXhTaGFkZXJQYXRoLCBmcmFnbWVudFNoYWRlclBhdGgsIGxpbmtlZENhbGxiYWNrKTtcclxuICAgICAgICB2YXIgcHJvZ3JhbSA9IHRoaXMuY29udGFpbmVyW3RoaXMuY291bnRlcl07XHJcblxyXG4gICAgICAgIHRoaXMubG9hZEFzeW5jU2hhZGVyU291cmNlKHZlcnRleFNoYWRlclBhdGgsIHByb2dyYW0ub25jb21wbGV0ZS5iaW5kKHByb2dyYW0pKTtcclxuICAgICAgICB0aGlzLmxvYWRBc3luY1NoYWRlclNvdXJjZShmcmFnbWVudFNoYWRlclBhdGgsIHByb2dyYW0ub25jb21wbGV0ZS5iaW5kKHByb2dyYW0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2dyYW0ucHJvZ3JhbTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMYWViIGFzw7xua3Jvb25zZWx0XHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNoYWRlclBhdGggVGVlLCBrdXMgYXN1YiB2YXJqdW5kYWphXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBGdW5rdHNpb29uLCBtaXMga8OkaXZpdGF0YWtzZSwga3VpIGzDpGh0ZWtvb2Qgb24ga8OkdHRlIHNhYWR1ZC4gU2FhZGV0YWtzZSB2YXN0dXMgamEgdGVlLlxyXG4gICAgICovXHJcbiAgICBsb2FkQXN5bmNTaGFkZXJTb3VyY2U6IGZ1bmN0aW9uKHNoYWRlclBhdGgsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgYXN5bmM6IHRydWUsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcInRleHRcIixcclxuICAgICAgICAgICAgdXJsOiBzaGFkZXJQYXRoLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlc3VsdCwgc2hhZGVyUGF0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb2dyYW1PYmplY3Q7XHJcbm1vZHVsZS5leHBvcnRzID0gU2hhZGVyUHJvZ3JhbUxvYWRlcjsiXX0=
