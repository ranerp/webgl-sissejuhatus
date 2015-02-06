(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\prog\\webglstudy\\tund00\\main.js":[function(require,module,exports){
var SHADER_PATH = "shaders/tund00/";
var canvas = document.getElementById("canvas");

GL = initWebGL(canvas);

//Seadistame konteksti renderdamisresolutsiooni
GL.viewport(0, 0, canvas.width, canvas.height);

var ShaderProgramLoader = require("./shaderprogramloader");

var shaderProgramLoader = new ShaderProgramLoader();
var shaderProgram = shaderProgramLoader.getProgram(SHADER_PATH + "vertex.shader", SHADER_PATH + "fragment.shader");


//Üritame luua WebGL konteksti
function initWebGL(canvas) {
    GL = null;

    try {

        //Üritame luua tavalist konteksti, kui see ebaõnnestub üritame luua eksperimentaalset,
        //Mida kasutatakse spetsifikatsiooni arendamiseks
        GL = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    } catch (e) {}

    if(!GL) {
        alert("Unable to initilize WebGL. Your browser may not support it.");
    }

    return GL;
}
},{"./shaderprogramloader":"C:\\prog\\webglstudy\\tund00\\shaderprogramloader.js"}],"C:\\prog\\webglstudy\\tund00\\shaderprogramloader.js":[function(require,module,exports){
/**
 * Hoiab endas WebGLProgram objekti ja WebGLShader tipuvarjundajat ja pikslivarjundajat
 *
 * @param {String} vertexShaderPath
 * @param {String} fragmentShaderPath
 * @class
 */
var ProgramObject = function(vertexShaderPath, fragmentShaderPath) {
    this.program = GL.createProgram();

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
        console.log(this);
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
                throw Error("Could not initialize shaders");
            }
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

        if (null == GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
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
    this.programContainer = [];
    this.counter = -1;
};

ShaderProgramLoader.prototype = {
    constructor: ShaderProgramLoader,

    getProgram: function(vertexShaderPath, fragmentShaderPath) {
        this.counter++;
        this.programContainer[this.counter] = new ProgramObject(vertexShaderPath, fragmentShaderPath);
        var program = this.programContainer[this.counter];

        this.loadAsyncShaderSource(vertexShaderPath, program.oncomplete.bind(program));
        this.loadAsyncShaderSource(fragmentShaderPath, program.oncomplete.bind(program));

        return program.program;
    },

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
},{}]},{},["C:\\prog\\webglstudy\\tund00\\main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwidHVuZDAwL21haW4uanMiLCJ0dW5kMDAvc2hhZGVycHJvZ3JhbWxvYWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgU0hBREVSX1BBVEggPSBcInNoYWRlcnMvdHVuZDAwL1wiO1xyXG52YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIik7XHJcblxyXG5HTCA9IGluaXRXZWJHTChjYW52YXMpO1xyXG5cclxuLy9TZWFkaXN0YW1lIGtvbnRla3N0aSByZW5kZXJkYW1pc3Jlc29sdXRzaW9vbmlcclxuR0wudmlld3BvcnQoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuXHJcbnZhciBTaGFkZXJQcm9ncmFtTG9hZGVyID0gcmVxdWlyZShcIi4vc2hhZGVycHJvZ3JhbWxvYWRlclwiKTtcclxuXHJcbnZhciBzaGFkZXJQcm9ncmFtTG9hZGVyID0gbmV3IFNoYWRlclByb2dyYW1Mb2FkZXIoKTtcclxudmFyIHNoYWRlclByb2dyYW0gPSBzaGFkZXJQcm9ncmFtTG9hZGVyLmdldFByb2dyYW0oU0hBREVSX1BBVEggKyBcInZlcnRleC5zaGFkZXJcIiwgU0hBREVSX1BBVEggKyBcImZyYWdtZW50LnNoYWRlclwiKTtcclxuXHJcblxyXG4vL8Occml0YW1lIGx1dWEgV2ViR0wga29udGVrc3RpXHJcbmZ1bmN0aW9uIGluaXRXZWJHTChjYW52YXMpIHtcclxuICAgIEdMID0gbnVsbDtcclxuXHJcbiAgICB0cnkge1xyXG5cclxuICAgICAgICAvL8Occml0YW1lIGx1dWEgdGF2YWxpc3Qga29udGVrc3RpLCBrdWkgc2VlIGViYcO1bm5lc3R1YiDDvHJpdGFtZSBsdXVhIGVrc3BlcmltZW50YWFsc2V0LFxyXG4gICAgICAgIC8vTWlkYSBrYXN1dGF0YWtzZSBzcGV0c2lmaWthdHNpb29uaSBhcmVuZGFtaXNla3NcclxuICAgICAgICBHTCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIikgfHwgY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIik7XHJcblxyXG4gICAgfSBjYXRjaCAoZSkge31cclxuXHJcbiAgICBpZighR0wpIHtcclxuICAgICAgICBhbGVydChcIlVuYWJsZSB0byBpbml0aWxpemUgV2ViR0wuIFlvdXIgYnJvd3NlciBtYXkgbm90IHN1cHBvcnQgaXQuXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBHTDtcclxufSIsIi8qKlxyXG4gKiBIb2lhYiBlbmRhcyBXZWJHTFByb2dyYW0gb2JqZWt0aSBqYSBXZWJHTFNoYWRlciB0aXB1dmFyanVuZGFqYXQgamEgcGlrc2xpdmFyanVuZGFqYXRcclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleFNoYWRlclBhdGhcclxuICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50U2hhZGVyUGF0aFxyXG4gKiBAY2xhc3NcclxuICovXHJcbnZhciBQcm9ncmFtT2JqZWN0ID0gZnVuY3Rpb24odmVydGV4U2hhZGVyUGF0aCwgZnJhZ21lbnRTaGFkZXJQYXRoKSB7XHJcbiAgICB0aGlzLnByb2dyYW0gPSBHTC5jcmVhdGVQcm9ncmFtKCk7XHJcblxyXG4gICAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB7XHJcbiAgICAgICAgXCJzaGFkZXJcIjogR0wuY3JlYXRlU2hhZGVyKEdMLlZFUlRFWF9TSEFERVIpLFxyXG4gICAgICAgIFwicGF0aFwiOiB2ZXJ0ZXhTaGFkZXJQYXRoLFxyXG4gICAgICAgIFwic3JjXCI6IFwiXCIsXHJcbiAgICAgICAgXCJjb21wbGV0ZWRcIjogZmFsc2VcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHtcclxuICAgICAgICBcInNoYWRlclwiOiBHTC5jcmVhdGVTaGFkZXIoR0wuRlJBR01FTlRfU0hBREVSKSxcclxuICAgICAgICBcInBhdGhcIjogZnJhZ21lbnRTaGFkZXJQYXRoLFxyXG4gICAgICAgIFwic3JjXCI6IFwiXCIsXHJcbiAgICAgICAgXCJjb21wbGV0ZWRcIjogZmFsc2VcclxuICAgIH07XHJcbn07XHJcblxyXG5Qcm9ncmFtT2JqZWN0LnByb3RvdHlwZSA9IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcjogUHJvZ3JhbU9iamVjdCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxiYWNrIG1lZXRvZCwgbWlzIGtvbXBpbGVlcmliIGphIHPDpHRlc3RhYiB2YXJqdW5kYWphZCwga3VpIG3DtWxlbWFkIG9uIGFzw7xua3Jvb25zZWx0IGxhZXR1ZFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcmMgTMOkaHRla29vZCwgbWlzIEFKQVgnaSBhYmlsIGxhZXRpXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUZWUsIG1pbGxlIGFiaWwgdHV2YXN0YWRhLCBrdW1tYSB2YXJqdW5kYWphIGzDpGh0ZWtvb2Qgb24gbGFldHVkXHJcbiAgICAgKi9cclxuICAgIG9uY29tcGxldGU6IGZ1bmN0aW9uKHNyYywgcGF0aCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xyXG4gICAgICAgIGlmKHBhdGggPT09IHRoaXMudmVydGV4U2hhZGVyLnBhdGgpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhTaGFkZXIuY29tcGxldGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhTaGFkZXIuc3JjID0gc3JjO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKHBhdGggPT09IHRoaXMuZnJhZ21lbnRTaGFkZXIucGF0aCkge1xyXG4gICAgICAgICAgICB0aGlzLmZyYWdtZW50U2hhZGVyLmNvbXBsZXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIuc3JjID0gc3JjO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodGhpcy52ZXJ0ZXhTaGFkZXIuY29tcGxldGVkICYmIHRoaXMuZnJhZ21lbnRTaGFkZXIuY29tcGxldGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZVNoYWRlcih0aGlzLnZlcnRleFNoYWRlci5zaGFkZXIsIHRoaXMudmVydGV4U2hhZGVyLnNyYyk7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZVNoYWRlcih0aGlzLmZyYWdtZW50U2hhZGVyLnNoYWRlciwgdGhpcy5mcmFnbWVudFNoYWRlci5zcmMpO1xyXG5cclxuXHJcbiAgICAgICAgICAgIEdMLmF0dGFjaFNoYWRlcih0aGlzLnByb2dyYW0sIHRoaXMudmVydGV4U2hhZGVyLnNoYWRlcik7XHJcbiAgICAgICAgICAgIEdMLmF0dGFjaFNoYWRlcih0aGlzLnByb2dyYW0sIHRoaXMuZnJhZ21lbnRTaGFkZXIuc2hhZGVyKTtcclxuXHJcbiAgICAgICAgICAgIEdMLmxpbmtQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XHJcbiAgICAgICAgICAgIGlmKCFHTC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMucHJvZ3JhbSwgR0wuTElOS19TVEFUVVMpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkNvdWxkIG5vdCBpbml0aWFsaXplIHNoYWRlcnNcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogw5xyaXRhYiBrb21waWxlZXJpZGEgdmFyanVuZGFqYVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7V2ViR0xTaGFkZXJ9IHNoYWRlciBWYXJqdW5kYWphIG1pZGEga29tcGlsZWVyaWRhXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIEzDpGh0ZWtvb2QsIG1pZGEga29tcGlsZWVyaWRhXHJcbiAgICAgKi9cclxuICAgIGNvbXBpbGVTaGFkZXI6IGZ1bmN0aW9uKHNoYWRlciwgc291cmNlKSB7XHJcbiAgICAgICAgR0wuc2hhZGVyU291cmNlKHNoYWRlciwgc291cmNlKTtcclxuICAgICAgICBHTC5jb21waWxlU2hhZGVyKHNoYWRlcik7XHJcblxyXG4gICAgICAgIGlmIChudWxsID09IEdMLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIEdMLkNPTVBJTEVfU1RBVFVTKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIlNoYWRlciBjb21waWxhdGlvbiBmYWlsZWQuIEVycm9yOiBcXFwiXCIgKyBHTC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikgKyBcIlxcXCJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFudHVkIGtsYXNzaSBhYmlsIG9uIHbDtWltYWxpayBwcm9ncmFtbWkgbGFhZGlkYSBqYSBhc8O8bmtyb29uc2VsdCB0YWdhcGlsZGlsIHNwZXRzaWZpdHNlZXJpdHVkIHZhcmp1bmRhamFkXHJcbiAqIHRhZ2FzdGF0dWQgcHJvZ3JhbW1pZ2Egc2lkdWRhXHJcbiAqXHJcbiAqIEBjbGFzcyBTaGFkZXJQcm9ncmFtTG9hZGVyXHJcbiAqL1xyXG52YXIgU2hhZGVyUHJvZ3JhbUxvYWRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5wcm9ncmFtQ29udGFpbmVyID0gW107XHJcbiAgICB0aGlzLmNvdW50ZXIgPSAtMTtcclxufTtcclxuXHJcblNoYWRlclByb2dyYW1Mb2FkZXIucHJvdG90eXBlID0ge1xyXG4gICAgY29uc3RydWN0b3I6IFNoYWRlclByb2dyYW1Mb2FkZXIsXHJcblxyXG4gICAgZ2V0UHJvZ3JhbTogZnVuY3Rpb24odmVydGV4U2hhZGVyUGF0aCwgZnJhZ21lbnRTaGFkZXJQYXRoKSB7XHJcbiAgICAgICAgdGhpcy5jb3VudGVyKys7XHJcbiAgICAgICAgdGhpcy5wcm9ncmFtQ29udGFpbmVyW3RoaXMuY291bnRlcl0gPSBuZXcgUHJvZ3JhbU9iamVjdCh2ZXJ0ZXhTaGFkZXJQYXRoLCBmcmFnbWVudFNoYWRlclBhdGgpO1xyXG4gICAgICAgIHZhciBwcm9ncmFtID0gdGhpcy5wcm9ncmFtQ29udGFpbmVyW3RoaXMuY291bnRlcl07XHJcblxyXG4gICAgICAgIHRoaXMubG9hZEFzeW5jU2hhZGVyU291cmNlKHZlcnRleFNoYWRlclBhdGgsIHByb2dyYW0ub25jb21wbGV0ZS5iaW5kKHByb2dyYW0pKTtcclxuICAgICAgICB0aGlzLmxvYWRBc3luY1NoYWRlclNvdXJjZShmcmFnbWVudFNoYWRlclBhdGgsIHByb2dyYW0ub25jb21wbGV0ZS5iaW5kKHByb2dyYW0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2dyYW0ucHJvZ3JhbTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9hZEFzeW5jU2hhZGVyU291cmNlOiBmdW5jdGlvbihzaGFkZXJQYXRoLCBjYWxsYmFjaykge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIGFzeW5jOiB0cnVlLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJ0ZXh0XCIsXHJcbiAgICAgICAgICAgIHVybDogc2hhZGVyUGF0aCxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZXN1bHQsIHNoYWRlclBhdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQcm9ncmFtT2JqZWN0O1xyXG5tb2R1bGUuZXhwb3J0cyA9IFNoYWRlclByb2dyYW1Mb2FkZXI7Il19
