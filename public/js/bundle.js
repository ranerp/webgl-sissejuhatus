(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\prog\\webglstudy\\lessons\\lesson06\\main.js":[function(require,module,exports){
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
//////////////////////////////////////////////////////// LESSON06 - HIIR ...////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

    APP.cameraX = 0;
    APP.cameraY = 0;
    APP.radius = 5;

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
    APP.lookAt = vec3.create();             //Mis suunas kaamera vaatab. Paremakäe koordinaatsüsteemis on -z ekraani sisse
    APP.up = vec3.create();                  //Vektor, mis näitab, kus on kaamera ülesse suunda näitav vektor
    updateCamera();

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

//Funktsioon, et viia horisontaalne ja vertikaalne nurk kanoonilisse vormi.
//Implementeeritud 3D Math Primer for Graphics and Game Development juhendi järgi
function toCanonical() {
    console.log("x: " + APP.cameraX);
    console.log("y: " + APP.cameraY);

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

    render();
}

//Uuendab andmeid, et oleks võimalik stseen liikuma panna
function update(deltaTime) {
    APP.time += deltaTime / 100;

   //updateObject();
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
},{}]},{},["C:\\prog\\webglstudy\\lessons\\lesson06\\main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibGVzc29ucy9sZXNzb24wNi9tYWluLmpzIiwibGVzc29ucy91dGlscy9sb29wZXIuanMiLCJsZXNzb25zL3V0aWxzL3NoYWRlcnByb2dyYW1sb2FkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2piQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vQW50dWQgb3NhIHRlZ2VsZWIgV2ViR0wga29udGVrc3RpIGxvb21pc2VnYSBqYSBtZWlsZSB2YWphbGlrdSBXZWJHTFByb2dyYW0gb2JqZWt0aSBsb29taXNlZ2EgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxudmFyIFNoYWRlclByb2dyYW1Mb2FkZXIgPSByZXF1aXJlKFwiLi8uLi91dGlscy9zaGFkZXJwcm9ncmFtbG9hZGVyXCIpO1xyXG52YXIgTG9vcGVyID0gcmVxdWlyZShcIi4vLi4vdXRpbHMvbG9vcGVyXCIpO1xyXG5cclxuLy9WYXJqdW5kYWphdGUga2F0YWxvb2dcclxudmFyIFNIQURFUl9QQVRIID0gXCJzaGFkZXJzL2xlc3NvbjA1L1wiO1xyXG5cclxuLy9UZWtzdHV1cmkgYXN1a29odFxyXG52YXIgVEVYVFVSRV9QQVRIID0gXCJhc3NldHMvZG93bmxvYWQuanBnXCI7XHJcblxyXG4vL0VsZW1lbnQsIGt1aHUgcmVuZGVyZGFtZVxyXG52YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIik7XHJcblxyXG4vL0xvb21lIGdsb2JhYWxzZSBXZWJHTCBrb250ZWtzdGlcclxuR0wgPSBpbml0V2ViR0woY2FudmFzKTtcclxuXHJcbi8vU2VhZGlzdGFtZSByZW5kZXJkYW1pc3Jlc29sdXRzaW9vbmlcclxuR0wudmlld3BvcnQoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuR0wudmlld3BvcnRXaWR0aCA9IGNhbnZhcy53aWR0aDtcclxuR0wudmlld3BvcnRIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xyXG5cclxuLy9Mb29tZSB1dWUgcHJvZ3JhbW1pIHNwZXRzaWZpdHNlZXJpdHVkIHZhcmp1bmRhamF0ZWdhLiBLdW5hIGxhYWRpbWluZSBvbiBhc8O8bmtyb29ubmUsIHNpaXMgYW5uYW1lIGthYXNhIGthXHJcbi8vbWVldG9kaSwgbWlzIGt1dHN1dGFrc2UgdsOkbGphIGt1aSB2YXJqdW5kYWphZCBvbiBsYWV0dWRcclxudmFyIHNoYWRlclByb2dyYW1Mb2FkZXIgPSBuZXcgU2hhZGVyUHJvZ3JhbUxvYWRlcigpO1xyXG52YXIgc2hhZGVyUHJvZ3JhbSA9IHNoYWRlclByb2dyYW1Mb2FkZXIuZ2V0UHJvZ3JhbShTSEFERVJfUEFUSCArIFwidmVydGV4LnNoYWRlclwiLCBTSEFERVJfUEFUSCArIFwiZnJhZ21lbnQuc2hhZGVyXCIsIHNoYWRlcnNMb2FkZWQpO1xyXG5cclxuXHJcbi8vw5xyaXRhbWUgbHV1YSBXZWJHTCBrb250ZWtzdGlcclxuZnVuY3Rpb24gaW5pdFdlYkdMKGNhbnZhcykge1xyXG4gICAgdmFyIGdsID0gbnVsbDtcclxuXHJcbiAgICB0cnkge1xyXG5cclxuICAgICAgICAvL8Occml0YW1lIGx1dWEgdGF2YWxpc3Qga29udGVrc3RpLCBrdWkgc2VlIGViYcO1bm5lc3R1YiDDvHJpdGFtZSBsdXVhIGVrc3BlcmltZW50YWFsc2V0LFxyXG4gICAgICAgIC8vTWlkYSBrYXN1dGF0YWtzZSBzcGV0c2lmaWthdHNpb29uaSBhcmVuZGFtaXNla3NcclxuICAgICAgICBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIikgfHwgY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIik7XHJcblxyXG4gICAgfSBjYXRjaCAoZSkge31cclxuXHJcbiAgICBpZighZ2wpIHtcclxuICAgICAgICBhbGVydChcIlVuYWJsZSB0byBpbml0aWxpemUgV2ViR0wuIFlvdXIgYnJvd3NlciBtYXkgbm90IHN1cHBvcnQgaXQuXCIpO1xyXG4gICAgICAgIHRocm93IEVycm9yKFwiRXhlY3V0aW9uIHRlcm1pbmF0ZWQuIE5vIFdlYkdMIGNvbnRleHRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGdsO1xyXG59XHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gTEVTU09OMDYgLSBISUlSIC4uLi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG52YXIgQVBQID0ge307XHJcblxyXG5BUFAubG9vcGVyID0gbmV3IExvb3BlcihjYW52YXMsIGxvb3ApO1xyXG5cclxuQVBQLmlzTW91c2VEb3duID0gZmFsc2U7XHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgbW91c2VDbGlja0hhbmRsZXIsIGZhbHNlKTtcclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgbW91c2VDbGlja0hhbmRsZXIsIGZhbHNlKTtcclxuXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXdoZWVsXCIsIG1vdXNlU2Nyb2xsSGFuZGxlciwgZmFsc2UpO1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NTW91c2VTY3JvbGxcIiwgbW91c2VTY3JvbGxIYW5kbGVyLCBmYWxzZSk7XHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJvbm1vdXNld2hlZWxcIiwgbW91c2VTY3JvbGxIYW5kbGVyLCBmYWxzZSk7XHJcblxyXG4vL0tPTlNUQU5ESUQgS0FBTUVSQSBKQU9LU1xyXG5cclxuLy8zNjAga3JhYWRpXHJcbkFQUC5UV09QSSA9IDIuMCAqIE1hdGguUEk7XHJcblxyXG4vLzkwIGtyYWFkaVxyXG5BUFAuUElPVkVSVFdPID0gTWF0aC5QSSAvIDIuMDtcclxuXHJcbi8vTWFrc2ltYWFsbmUgdmVydGlrYWFsbnVya1xyXG5BUFAuTUFYX1ZFUlRJQ0FMID0gQVBQLlBJT1ZFUlRXTyAtIEFQUC5QSU9WRVJUV08gLyA4O1xyXG5cclxuLy9SYWFkaXVzLCBtaWxsZXN0IGzDpGhlbWFsZSBrYWFtZXJhIG1pbm5hIGVpIHNhYVxyXG5BUFAuTUlOX1JBRElVUyA9IDE7XHJcblxyXG4vL1N1dW1pbWlza29uc3RhbnRcclxuQVBQLlpPT01fVkFMVUUgPSAwLjU7XHJcblxyXG4vL0t1dHN1dGFrc2Uga3VpIHZhcmp1bmRhamFkIG9uIGxhZXR1ZFxyXG5mdW5jdGlvbiBzaGFkZXJzTG9hZGVkKCkge1xyXG4gICAgc2V0dXBBbmRMb2FkVGV4dHVyZSgpO1xyXG4gICAgc2V0dXAoKTtcclxuXHJcbiAgICBBUFAubG9vcGVyLmxvb3AoKTtcclxufVxyXG5cclxuLy9UZWtzdHV1cmkgaW5pdHNpYWxpc2VlcmltaW5lIGphIGxhYWRpbWluZVxyXG5mdW5jdGlvbiBzZXR1cEFuZExvYWRUZXh0dXJlKCkge1xyXG5cclxuICAgIEFQUC50ZXh0dXJlID0gR0wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XHJcblxyXG4gICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgQVBQLnRleHR1cmUpO1xyXG4gICAgICAgIEdMLnRleEltYWdlMkQoR0wuVEVYVFVSRV8yRCwgMCwgR0wuUkdCLCBHTC5SR0IsICBHTC5VTlNJR05FRF9CWVRFLCBpbWFnZSk7XHJcbiAgICAgICAgR0wudGV4UGFyYW1ldGVyZihHTC5URVhUVVJFXzJELCBHTC5URVhUVVJFX1dSQVBfUywgR0wuUkVQRUFUKTtcclxuICAgICAgICBHTC50ZXhQYXJhbWV0ZXJmKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfV1JBUF9ULCBHTC5SRVBFQVQpO1xyXG4gICAgICAgIEdMLnRleFBhcmFtZXRlcmkoR0wuVEVYVFVSRV8yRCwgR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBHTC5ORUFSRVNUKTtcclxuICAgICAgICBHTC50ZXhQYXJhbWV0ZXJpKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgR0wuTkVBUkVTVCk7XHJcbiAgICAgICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICB9O1xyXG4gICAgaW1hZ2Uuc3JjID0gVEVYVFVSRV9QQVRIO1xyXG5cclxufVxyXG5cclxuLy9Mb29iIHB1aHZyaWQgamEgbWFhdHJpa3NpZC4gVMOkaWRhYiBwdWh2cmlkIGFuZG1ldGVnYS5cclxuZnVuY3Rpb24gc2V0dXAoKSB7XHJcbiAgICAvL1RlZW1lIG11dXR1amEsIGt1aHUgc2FsdmVzdGFkYSBhZWdhLCBldCBrYWFtZXJhdCBhamEgbcO2w7ZkdWRlcyDDvG1iZXIgb2JqZWt0aSBww7bDtnJhdGFcclxuICAgIEFQUC50aW1lID0gMDtcclxuXHJcbiAgICBBUFAuY2FtZXJhWCA9IDA7XHJcbiAgICBBUFAuY2FtZXJhWSA9IDA7XHJcbiAgICBBUFAucmFkaXVzID0gNTtcclxuXHJcbiAgICAvL011ZGVsbWFhdHJpa3MsIG1pbGxlZ2Egb2JqZWt0aXJ1dW1pc3QgbWFhaWxtYXJ1dW1pIHNhYWRhXHJcbiAgICBBUFAubW9kZWxNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vUHVua3QsIGt1cyBvYmpla3QgaGV0a2VsIGFzdWJcclxuICAgIEFQUC5vYmplY3RBdCA9IFswLjAsIDAuMCwgLTUuMF07XHJcblxyXG4gICAgLy9LYXN1dGFkZXMgdHJhbnNsYXRzaW9vbmksIHNhYW1lIG11ZGVsbWFhdHJpa3NpZ2Egb2JqZWt0aSBsaWlndXRhZGFcclxuICAgIG1hdDQudHJhbnNsYXRlKEFQUC5tb2RlbE1hdHJpeCwgQVBQLm1vZGVsTWF0cml4LCBBUFAub2JqZWN0QXQpO1xyXG5cclxuICAgIC8vS2FhbWVyYW1hYXRyaWtzLCBtaWxsZWdhIG1hYWlsbWFydXVtaXN0IGthYW1lcmFydXVtaSBzYWFkYVxyXG4gICAgQVBQLnZpZXdNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vRGVmaW5lZXJpbWUgdmVrdG9yaWQsIG1pbGxlIGFiaWwgb24gdsO1aW1hbGlrIGthYW1lcmFydXVtaSBiYWFzdmVrdG9yaWQgYXJ2dXRhZGFcclxuICAgIEFQUC5jYW1lcmFBdCA9IFswLCAwLCA1XTsgICAgICAgICAgICAvL0FzdWIgbWFhaWxtYXJ1dW1pcyBuZW5kZWwga29vcmRpbmFhdGlkZWxcclxuICAgIEFQUC5sb29rQXQgPSB2ZWMzLmNyZWF0ZSgpOyAgICAgICAgICAgICAvL01pcyBzdXVuYXMga2FhbWVyYSB2YWF0YWIuIFBhcmVtYWvDpGUga29vcmRpbmFhdHPDvHN0ZWVtaXMgb24gLXogZWtyYWFuaSBzaXNzZVxyXG4gICAgQVBQLnVwID0gdmVjMy5jcmVhdGUoKTsgICAgICAgICAgICAgICAgICAvL1Zla3RvciwgbWlzIG7DpGl0YWIsIGt1cyBvbiBrYWFtZXJhIMO8bGVzc2Ugc3V1bmRhIG7DpGl0YXYgdmVrdG9yXHJcbiAgICB1cGRhdGVDYW1lcmEoKTtcclxuXHJcbiAgICAvL1Byb2pla3RzaW9vbmltYWF0cmlrcywgZXQgcMO8Z2FtaXNydXVtaSBzYWFkYS4gS2FzdXRhZGVzIGdsTWF0cml4IHRlZWtpIGdlbmVyZWVyaW1lIGthIHDDvHJhbWlpZGksIGt1aHUgc2lzc2Ugb2JqZWt0aWQgbMOkaGV2YWQuXHJcbiAgICBBUFAucHJvamVjdGlvbk1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgICBtYXQ0LnBlcnNwZWN0aXZlKEFQUC5wcm9qZWN0aW9uTWF0cml4LCA0NS4wLCBHTC52aWV3cG9ydFdpZHRoIC8gR0wudmlld3BvcnRIZWlnaHQsIDEuMCwgMTAwMC4wKTtcclxuXHJcblxyXG5cclxuXHJcbiAgICAvL1RpcHB1ZGUgYW5kbWVkLiBUaXB1IGtvb3JkaW5hYWRpZCB4LCB5LCB6IGphIHRla3N0dXVyaSBrb29yZGluYWFkaWQgdSwgdlxyXG4gICAgQVBQLm15VmVydGljZXNEYXRhID0gW1xyXG4gICAgICAgIC8vRXNpbWVuZSBrw7xsZ1xyXG4gICAgICAgIC0xLjAsIC0xLjAsICAxLjAsICAwLjAsIDEuMCwgICAgICAgICAgICAvL0FMVU1JTkUgVkFTQUsgTlVSS1xyXG4gICAgICAgICAxLjAsIC0xLjAsICAxLjAsICAxLjAsIDEuMCwgICAgICAgICAgICAvL0FMVU1JTkUgUEFSRU0gTlVSS1xyXG4gICAgICAgICAxLjAsICAxLjAsICAxLjAsICAxLjAsIDAuMCwgICAgICAgICAgICAvL8OcTEVNSU5FIFBBUkVNIE5VUktcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMS4wLCAgMC4wLCAwLjAsICAgICAgICAgICAgLy/DnExFTUlORSBWQVNBSyBOVVJLXHJcblxyXG4gICAgICAgIC8vVGFndW1pbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAtMS4wLCAgMC4wLCAxLjAsXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgLTEuMCwgIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgLTEuMCwgICAxLjAsIDAuMCxcclxuICAgICAgICAxLjAsIC0xLjAsIC0xLjAsICAgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vw5xsZW1pbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAgMS4wLCAtMS4wLCAgMC4wLCAxLjAsXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgIDEuMCwgIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgIDEuMCwgICAgMS4wLCAwLjAsXHJcbiAgICAgICAgMS4wLCAgMS4wLCAtMS4wLCAgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vQWx1bWluZSBrw7xsZ1xyXG4gICAgICAgIC0xLjAsIC0xLjAsIC0xLjAsIDAuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgLTEuMCwgLTEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAgMS4wLCAgMS4wLCAwLjAsXHJcbiAgICAgICAgLTEuMCwgLTEuMCwgIDEuMCwgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vUGFyZW0ga8O8bGdcclxuICAgICAgICAxLjAsIC0xLjAsIC0xLjAsIDAuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgLTEuMCwgMS4wLCAxLjAsXHJcbiAgICAgICAgMS4wLCAgMS4wLCAgMS4wLCAgMS4wLCAwLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAgMS4wLCAwLjAsIDAuMCxcclxuXHJcbiAgICAgICAgLy9WYXNhayBrw7xsZ1xyXG4gICAgICAgIC0xLjAsIC0xLjAsIC0xLjAsIDAuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsIC0xLjAsICAxLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsICAxLjAsICAxLjAsICAxLjAsIDAuMCxcclxuICAgICAgICAtMS4wLCAgMS4wLCAtMS4wLCAwLjAsIDAuMCxcclxuICAgIF07XHJcbiAgICBBUFAudmVydGV4U2l6ZSA9IDU7XHJcblxyXG4gICAgLy9Mb29tZSBwdWh2cmksIGt1aHUgdGlwdWFuZG1lZCB2aWlhLiBTZW9tZSBrYSBhbnR1ZCBwdWh2cmkga29udGVrc3RpZ2EsIGV0IHRlbWFsZSBrw6Rza2UgZWRhc2kgYW5kYVxyXG4gICAgQVBQLnZlcnRleEJ1ZmZlciA9IEdMLmNyZWF0ZUJ1ZmZlcigpO1xyXG5cclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuQVJSQVlfQlVGRkVSLCBBUFAudmVydGV4QnVmZmVyKTtcclxuXHJcbiAgICAvL0FubmFtZSBsb29kdWQgcHVodnJpbGUgYW5kbWVkXHJcbiAgICBHTC5idWZmZXJEYXRhKEdMLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShBUFAubXlWZXJ0aWNlc0RhdGEpLCBHTC5TVEFUSUNfRFJBVyk7XHJcblxyXG4gICAgLy9UaXBwdWRlIGluZGVrc2lkXHJcbiAgICBBUFAubXlJbmRpY2VzRGF0YSA9IFtcclxuICAgICAgICAwLCAxLCAyLCAgICAgIDAsIDIsIDMsICAgIC8vIEVzaW1lbmUga8O8bGdcclxuICAgICAgICA0LCA1LCA2LCAgICAgIDQsIDYsIDcsICAgIC8vIFRhZ3VtaW5lIGvDvGxnXHJcbiAgICAgICAgOCwgOSwgMTAsICAgICA4LCAxMCwgMTEsICAvLyDDnGxlbWluZSBrw7xsZ1xyXG4gICAgICAgIDEyLCAxMywgMTQsICAgMTIsIDE0LCAxNSwgLy8gQWx1bWluZSBrw7xsZ1xyXG4gICAgICAgIDE2LCAxNywgMTgsICAgMTYsIDE4LCAxOSwgLy8gUGFyZW0ga8O8bGdcclxuICAgICAgICAyMCwgMjEsIDIyLCAgIDIwLCAyMiwgMjMgIC8vIFZhc2FrIGvDvGxnXHJcbiAgICBdO1xyXG5cclxuICAgIC8vTG9vbWUgcHVodnJpLCBrdWh1IGluZGVrc2lkIHZpaWEuIFNlb21lIGthIGFudHVkIHB1aHZyaSBrb250ZWtzdGlnYSwgZXQgdGVtYWxlIGvDpHNrZSBlZGFzaSBhbmRhXHJcbiAgICBBUFAuaW5kZXhCdWZmZXIgPSBHTC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIEFQUC5pbmRleEJ1ZmZlci5udW1iZXJPZkluZGV4ZXMgPSAzNjtcclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIEFQUC5pbmRleEJ1ZmZlcik7XHJcblxyXG4gICAgLy9Bbm5hbWUgbG9vZHVkIHB1aHZyaWxlIGFuZG1lZFxyXG4gICAgR0wuYnVmZmVyRGF0YShHTC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IFVpbnQxNkFycmF5KEFQUC5teUluZGljZXNEYXRhKSwgR0wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgIC8vTcOkw6RyYW1lIHByb2dyYW1taSwgbWlkYSBtZSByZW5kZXJkYW1pc2VsIGthc3V0YWRhIHRhaGFtZVxyXG4gICAgR0wudXNlUHJvZ3JhbShzaGFkZXJQcm9ncmFtKTtcclxuXHJcbiAgICAvL1NhYW1lIGluZGVrc2ksIG1pcyBuw6RpdGFiIGt1cyBhc3ViIG1laWUgcHJvZ3JhbW1pcyBrYXN1dGF0YXZhcyB0aXB1dmFyanVuZGFqYXNcclxuICAgIC8vb2xldiB0aXB1YXRyaWJ1dXQgbmltZWdhIGFfVmVydGV4UG9zaXRpb25cclxuICAgIEFQUC5hX1Bvc2l0aW9uID0gR0wuZ2V0QXR0cmliTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJhX1Bvc2l0aW9uXCIpO1xyXG5cclxuICAgIC8vU2FhbWUgdsOkcnZpYXRyaWJ1dWRpIGFzdWtvaGFcclxuICAgIEFQUC5hX1RleHR1cmVDb29yZCA9IEdMLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYV9UZXh0dXJlQ29vcmRcIik7XHJcblxyXG4gICAgLy9TYWFtZSDDvGh0c2V0ZSBtdXV0dWphdGUgYXN1a29oYWRcclxuICAgIEFQUC51X01vZGVsTWF0cml4ID0gR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9Nb2RlbE1hdHJpeFwiKTtcclxuICAgIEFQUC51X1ZpZXdNYXRyaXggPSBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X1ZpZXdNYXRyaXhcIik7XHJcbiAgICBBUFAudV9Qcm9qZWN0aW9uTWF0cml4ID0gR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9Qcm9qZWN0aW9uTWF0cml4XCIpO1xyXG4gICAgQVBQLnVfVGV4dHVyZSA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfVGV4dHVyZVwiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbW91c2VDbGlja0hhbmRsZXIoKSB7XHJcbiAgICBBUFAuaXNNb3VzZURvd24gPSAhQVBQLmlzTW91c2VEb3duO1xyXG5cclxuICAgIGlmKEFQUC5pc01vdXNlRG93bilcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG1vdXNlTW92ZSwgZmFsc2UpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgbW91c2VNb3ZlLCBmYWxzZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdXNlU2Nyb2xsSGFuZGxlcihlKSB7XHJcbiAgICB2YXIgZGVsdGEgPSAwO1xyXG5cclxuICAgIGlmKCFlKVxyXG4gICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XHJcblxyXG4gICAgaWYoZS53aGVlbERlbHRhKSAgICAgICAgICAgICAgICAgICAgLyoqIEludGVybmV0IEV4cGxvcmVyL09wZXJhL0dvb2dsZSBDaHJvbWUgKiovXHJcbiAgICAgICAgZGVsdGEgPSBlLndoZWVsRGVsdGEgLyAxMjA7XHJcblxyXG4gICAgZWxzZSBpZihlLmRldGFpbCkgICAgICAgICAgICAgICAgICAgLyoqIE1vemlsbGEgRmlyZWZveCAqKi9cclxuICAgICAgICBkZWx0YSA9IC1lLmRldGFpbC8zO1xyXG5cclxuICAgIGlmKGRlbHRhKSB7XHJcbiAgICAgICAgaWYoZGVsdGEgPiAwICYmIEFQUC5yYWRpdXMgPiBBUFAuTUlOX1JBRElVUylcclxuICAgICAgICAgICAgQVBQLnJhZGl1cyAtPSBBUFAuWk9PTV9WQUxVRTtcclxuICAgICAgICBlbHNlIGlmKGRlbHRhIDwgMClcclxuICAgICAgICAgICAgQVBQLnJhZGl1cyArPSBBUFAuWk9PTV9WQUxVRTtcclxuICAgIH1cclxuXHJcbiAgICAgICAgaWYoZS5wcmV2ZW50RGVmYXVsdClcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcclxuXHJcbiAgICB0b0Nhbm9uaWNhbCgpO1xyXG4gICAgdXBkYXRlQ2FtZXJhKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdXNlTW92ZShlKSB7XHJcbiAgICB2YXIgeCA9IGUud2Via2l0TW92ZW1lbnRYIHx8IGUubW96TW92ZW1lbnRYO1xyXG4gICAgdmFyIHkgPSBlLndlYmtpdE1vdmVtZW50WSB8fCBlLm1vek1vdmVtZW50WTtcclxuXHJcbiAgICBpZih0eXBlb2YgeCA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICB4ID0gMDtcclxuICAgIGlmKHR5cGVvZiB5ID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgIHkgPSAwO1xyXG5cclxuXHJcbiAgICBBUFAuY2FtZXJhWCArPSB4IC8gNTAwO1xyXG4gICAgQVBQLmNhbWVyYVkgKz0geSAvIDUwMDtcclxuXHJcbiAgICByZXN0cmljdENhbWVyYVkoKTtcclxuICAgIHRvQ2Fub25pY2FsKCk7XHJcblxyXG4gICAgdXBkYXRlQ2FtZXJhKCk7XHJcbn1cclxuXHJcbi8vRnVua3RzaW9vbiwgZXQgdmlpYSBob3Jpc29udGFhbG5lIGphIHZlcnRpa2FhbG5lIG51cmsga2Fub29uaWxpc3NlIHZvcm1pLlxyXG4vL0ltcGxlbWVudGVlcml0dWQgM0QgTWF0aCBQcmltZXIgZm9yIEdyYXBoaWNzIGFuZCBHYW1lIERldmVsb3BtZW50IGp1aGVuZGkgasOkcmdpXHJcbmZ1bmN0aW9uIHRvQ2Fub25pY2FsKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJ4OiBcIiArIEFQUC5jYW1lcmFYKTtcclxuICAgIGNvbnNvbGUubG9nKFwieTogXCIgKyBBUFAuY2FtZXJhWSk7XHJcblxyXG4gICAgLy9LdWkgb2xlbWUgMCBrb29yZGluYWF0aWRlbFxyXG4gICAgaWYoQVBQLnJhZGl1cyA9PSAwLjApIHtcclxuICAgICAgICBBUFAuY2FtZXJhWCA9IEFQUC5jYW1lcmFZID0gMC4wO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgIC8vS3VpIHJhYWRpdXMgb24gbmVnYXRpaXZuZS5cclxuICAgICAgICBpZihBUFAucmFkaXVzIDwgMC4wKSB7XHJcbiAgICAgICAgICAgIEFQUC5yYWRpdXMgPSAtQVBQLnJhZGl1cztcclxuICAgICAgICAgICAgQVBQLmNhbWVyYVggKz0gTWF0aC5QSTtcclxuICAgICAgICAgICAgQVBQLmNhbWVyYVkgPSAtQVBQLmNhbWVyYVk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL1ZlcnRpa2FhbG5lIG51cmsgw7xsZW1pc2VzdCBwaWlyaXN0IHbDpGxqYVxyXG4gICAgICAgIGlmKE1hdGguYWJzKEFQUC5jYW1lcmFZKSA+IEFQUC5QSU9WRVJUV08pIHtcclxuXHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFZICs9IEFQUC5QSU9WRVJUV087XHJcblxyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWSAtPSBNYXRoLmZsb29yKEFQUC5jYW1lcmFZIC8gQVBQLlRXT1BJKSAqIEFQUC5UV09QSTtcclxuXHJcbiAgICAgICAgICAgIGlmKEFQUC5jYW1lcmFZID4gTWF0aC5QSSkge1xyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVggKz0gTWF0aC5QSTtcclxuXHJcbiAgICAgICAgICAgICAgICBBUFAuY2FtZXJhWSA9IDMuMCAqIE1hdGguUEkvMi4wIC0gQVBQLmNhbWVyYVk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBBUFAuY2FtZXJhWSAtPSBBUFAuUElPVkVSVFdPO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL0dJTUJBTCBMT0NLXHJcbiAgICAgICAgaWYoTWF0aC5hYnMoQVBQLmNhbWVyYVkpID49IEFQUC5QSU9WRVJUV08gKiAwLjk5OTkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJHSU1CQUxMT0NLXCIpO1xyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWCA9IDAuMDtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYoTWF0aC5hYnMoQVBQLmNhbWVyYVgpID4gTWF0aC5QSSkge1xyXG5cclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFYICs9IE1hdGguUEk7XHJcblxyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVggLT0gTWF0aC5mbG9vcihBUFAuY2FtZXJhWCAvIEFQUC5UV09QSSkgKiBBUFAuVFdPUEk7XHJcblxyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVggLT0gTWF0aC5QSTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlc3RyaWN0Q2FtZXJhWSgpIHtcclxuICAgIGlmKE1hdGguYWJzKEFQUC5jYW1lcmFZKSA+IEFQUC5NQVhfVkVSVElDQUwpIHtcclxuICAgICAgICBpZihBUFAuY2FtZXJhWSA8IDApXHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFZID0gLUFQUC5NQVhfVkVSVElDQUw7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWSA9IEFQUC5NQVhfVkVSVElDQUw7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vS3V0c3V0YWtzZSB2w6RsamEgTG9vcGVyIG9iamVrdGlzIGlnYSBrYWFkZXJcclxuZnVuY3Rpb24gbG9vcChkZWx0YVRpbWUpIHtcclxuICAgIHVwZGF0ZShkZWx0YVRpbWUpO1xyXG5cclxuICAgIHJlbmRlcigpO1xyXG59XHJcblxyXG4vL1V1ZW5kYWIgYW5kbWVpZCwgZXQgb2xla3MgdsO1aW1hbGlrIHN0c2VlbiBsaWlrdW1hIHBhbm5hXHJcbmZ1bmN0aW9uIHVwZGF0ZShkZWx0YVRpbWUpIHtcclxuICAgIEFQUC50aW1lICs9IGRlbHRhVGltZSAvIDEwMDtcclxuXHJcbiAgIC8vdXBkYXRlT2JqZWN0KCk7XHJcbn1cclxuXHJcbi8vVXVlbmRhYiBrYWFtZXJhdCwgZXQgc2VkYSBvbGVrcyB2w7VpbWFsaWsgw7xtYmVyIG9iamVrdGkgcMO2w7ZyYXRhXHJcbmZ1bmN0aW9uIHVwZGF0ZUNhbWVyYSgpIHtcclxuXHJcbiAgICAvL0xlaWFtZSB1dWUgcG9zaXRzaW9vbmksIG1pcyBhamFzIGxpaWd1YiBwb2xhYXJzZXMga29vcmRpbmFhdHPDvHN0ZWVtaXMgamEgbWlsbGUgdGVpc2VuZGFtZSByaXN0a29vcmRpbmFhdHPDvHN0ZWVtaVxyXG4gICAgQVBQLmNhbWVyYUF0ID0gW0FQUC5vYmplY3RBdFswXSArIEFQUC5yYWRpdXMgKiBNYXRoLmNvcyhBUFAuY2FtZXJhWSkgKiBNYXRoLnNpbihBUFAuY2FtZXJhWCksICAgICAgIC8vIFhcclxuICAgICAgICAgICAgICAgICAgICAgQVBQLm9iamVjdEF0WzFdICsgQVBQLnJhZGl1cyAqIC1NYXRoLnNpbihBUFAuY2FtZXJhWSksICAgICAgICAgICAgICAgICAgICAgLy8gWVxyXG4gICAgICAgICAgICAgICAgICAgICBBUFAub2JqZWN0QXRbMl0gKyBBUFAucmFkaXVzICogTWF0aC5jb3MoQVBQLmNhbWVyYVkpICogTWF0aC5jb3MoQVBQLmNhbWVyYVgpXTsgICAgIC8vIFpcclxuXHJcblxyXG4gICAgLy9MZWlhbWUgc3V1bmF2ZWt0b3JpLCBrYWFtZXJhc3Qgb2JqZWt0aW5pXHJcbiAgICBBUFAubG9va0RpcmVjdGlvbiA9IFtBUFAub2JqZWN0QXRbMF0gLSBBUFAuY2FtZXJhQXRbMF0sICAgICAgICAgICAgICAgLy8gWFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgQVBQLm9iamVjdEF0WzFdIC0gQVBQLmNhbWVyYUF0WzFdLCAgICAgICAgICAgICAgIC8vIFlcclxuICAgICAgICAgICAgICAgICAgICAgICAgIEFQUC5vYmplY3RBdFsyXSAtIEFQUC5jYW1lcmFBdFsyXV07ICAgICAgICAgICAgICAvLyBaXHJcblxyXG4gICAgLy9MZWlhbWUgcHVua3RpLCBtaWRhIGthYW1lcmEgdmFhdGFiXHJcbiAgICB2ZWMzLmFkZChBUFAubG9va0F0LCBBUFAuY2FtZXJhQXQsIEFQUC5sb29rRGlyZWN0aW9uKTtcclxuXHJcbiAgICBBUFAucmlnaHQgPSBbXHJcbiAgICAgICAgTWF0aC5zaW4oQVBQLmNhbWVyYVggLSBNYXRoLlBJIC8gMiksXHJcbiAgICAgICAgMCxcclxuICAgICAgICBNYXRoLmNvcyhBUFAuY2FtZXJhWCAtIE1hdGguUEkgLyAyKVxyXG4gICAgXTtcclxuXHJcbiAgICB2ZWMzLmNyb3NzKEFQUC51cCwgQVBQLnJpZ2h0LCBBUFAubG9va0RpcmVjdGlvbik7XHJcblxyXG4gICAgLy9VdWVuZGFtZSBrYWFtZXJhbWFhdHJpa3NpdFxyXG4gICAgbWF0NC5sb29rQXQoQVBQLnZpZXdNYXRyaXgsIEFQUC5jYW1lcmFBdCwgQVBQLmxvb2tBdCwgQVBQLnVwKTtcclxuXHJcblxyXG59XHJcblxyXG4vL3V1ZW5kYW1lIG9iamVrdGlcclxuZnVuY3Rpb24gdXBkYXRlT2JqZWN0KCkge1xyXG4gICAgbWF0NC5yb3RhdGVYKEFQUC5tb2RlbE1hdHJpeCwgQVBQLm1vZGVsTWF0cml4LCAwLjAwNSk7XHJcbn1cclxuXHJcblxyXG4vL1JlbmRlcmRhbWluZVxyXG5mdW5jdGlvbiByZW5kZXIoKSB7XHJcblxyXG4gICAgLy9QcHVoYXN0YW1lIGthIHbDpHJ2aS0gamEgc8O8Z2F2dXNwdWh2cmlkLCBuaW5nIG3DpMOkcmFtZSB1dWUgcHVoYXN0dXbDpHJ2dXNlLlxyXG4gICAgLy9IZXRrZWwgcHVoYXN0YW1pbmUgbWlkYWdpIGVpIHRlZSwgc2VzdCBtZSByZW5kZXJkYW1lIHZhaWQgw7xoZSBrb3JyYSwga3VpZCBrdWkgbWUgdHPDvGtrbGlzIHNlZGEgdGVnZW1hXHJcbiAgICAvL29uIG7DpGhhIGthLCBtaWRhIG5hZCB0ZWV2YWQuXHJcbiAgICBHTC5jbGVhckNvbG9yKDAuNSwgMC41LCAwLjUsIDEuMCk7XHJcbiAgICBHTC5jbGVhcihHTC5DT0xPUl9CVUZGRVJfQklUIHwgR0wuREVQVEhfQlVGRkVSX0JJVCk7XHJcblxyXG4gICAgLy9Mw7xsaXRhbWUgc2lzc2Ugc8O8Z2F2dXN0ZXN0aVxyXG4gICAgR0wuZW5hYmxlKEdMLkRFUFRIX1RFU1QpO1xyXG4gICAgR0wuZGVwdGhGdW5jKEdMLkxFU1MpO1xyXG5cclxuICAgIC8vU2VvbWUgdGlwdXB1aHZyaSBqYSBtw6TDpHJhbWUsIGt1cyBhbnR1ZCB0aXB1YXRyaWJ1dXQgYXN1YiBhbnR1ZCBtYXNzaWl2aXMuXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkFSUkFZX0JVRkZFUiwgQVBQLnZlcnRleEJ1ZmZlcik7XHJcbiAgICBHTC52ZXJ0ZXhBdHRyaWJQb2ludGVyKEFQUC5hX1Bvc2l0aW9uLCAzLCBHTC5GTE9BVCwgZmFsc2UsIEFQUC52ZXJ0ZXhTaXplICogNCwgMCk7XHJcbiAgICBHTC52ZXJ0ZXhBdHRyaWJQb2ludGVyKEFQUC5hX1RleHR1cmVDb29yZCwgMiwgR0wuRkxPQVQsIGZhbHNlLCBBUFAudmVydGV4U2l6ZSAqIDQsIEFQUC52ZXJ0ZXhTaXplICogNCAtIDIgKiA0KTtcclxuXHJcbiAgICAvL0FrdGl2ZWVyaW1lIGF0cmlidXVkaWRcclxuICAgIEdMLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KEFQUC5hX1Bvc2l0aW9uKTtcclxuICAgIEdMLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KEFQUC5hX1RleHR1cmVDb29yZCk7XHJcblxyXG4gICAgLy9Ba3RpdmVlcmltZSBqYSBtw6TDpHJhbWUgdGVrc3R1dXJpXHJcbiAgICBHTC5hY3RpdmVUZXh0dXJlKEdMLlRFWFRVUkUwKTtcclxuICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIEFQUC50ZXh0dXJlKTtcclxuICAgIEdMLnVuaWZvcm0xaShBUFAudV9UZXh0dXJlLCAwKTtcclxuXHJcbiAgICAvL1NhYWRhbWUgbWVpZSBtYWF0cmlrc2lkIGthIHZhcmp1bmRhamFzc2VcclxuICAgIEdMLnVuaWZvcm1NYXRyaXg0ZnYoQVBQLnVfTW9kZWxNYXRyaXgsIGZhbHNlLCBBUFAubW9kZWxNYXRyaXgpO1xyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9WaWV3TWF0cml4LCBmYWxzZSwgQVBQLnZpZXdNYXRyaXgpO1xyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9Qcm9qZWN0aW9uTWF0cml4LCBmYWxzZSwgQVBQLnByb2plY3Rpb25NYXRyaXgpO1xyXG5cclxuICAgIC8vUmVuZGVyZGFtZSBrb2xtbnVyZ2FkIGluZGVrc2l0ZSBqw6RyZ2lcclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIEFQUC5pbmRleEJ1ZmZlcik7XHJcbiAgICBHTC5kcmF3RWxlbWVudHMoR0wuVFJJQU5HTEVTLCBBUFAuaW5kZXhCdWZmZXIubnVtYmVyT2ZJbmRleGVzLCBHTC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcbn1cclxuXHJcbiIsIkxvb3BlciA9IGZ1bmN0aW9uKGRvbUVsZW1lbnQsIGNhbGxiYWNrKSB7XHJcbiAgICB0aGlzLmRvbUVsZW1lbnQgPSBkb21FbGVtZW50O1xyXG5cclxuICAgIHRoaXMubGFzdFRpbWUgPSAwO1xyXG4gICAgdGhpcy5kZWx0YVRpbWUgPSAwO1xyXG5cclxuICAgIHRoaXMucmVxdWVzdElkO1xyXG5cclxuICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcclxuXHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcbiAgICAgICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XHJcblxyXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZTtcclxufTtcclxuXHJcbkxvb3Blci5wcm90b3R5cGUgPSB7XHJcblxyXG4gICAgY29uc3RydWN0b3I6IExvb3BlcixcclxuXHJcbiAgICBjYWxjdWxhdGVEZWx0YVRpbWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciB0aW1lTm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgICAgIGlmKHRoaXMubGFzdFRpbWUgIT0gMClcclxuICAgICAgICAgICAgdGhpcy5kZWx0YVRpbWUgPSAodGltZU5vdyAtIHRoaXMubGFzdFRpbWUpIC8gMTY7XHJcblxyXG4gICAgICAgIHRoaXMubGFzdFRpbWUgPSB0aW1lTm93O1xyXG4gICAgfSxcclxuXHJcbiAgICBsb29wOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnJlcXVlc3RJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmxvb3AuYmluZCh0aGlzKSwgdGhpcy5kb21FbGVtZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVEZWx0YVRpbWUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLmRlbHRhVGltZSk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb29wZXI7IiwiLyoqXHJcbiAqIEhvaWFiIGVuZGFzIFdlYkdMUHJvZ3JhbSBvYmpla3RpIGphIFdlYkdMU2hhZGVyIHRpcHV2YXJqdW5kYWphdCBqYSBwaWtzbGl2YXJqdW5kYWphdFxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gdmVydGV4U2hhZGVyUGF0aFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRTaGFkZXJQYXRoXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG9uTGlua2VkIE1lZXRvZCwgbWlzIGt1dHN1dGFrc2UgdsOkbGphLCBrdWkgdmFyanVuZGFqYWQgb24gbGFldHVkXHJcbiAqIEBjbGFzc1xyXG4gKi9cclxudmFyIFByb2dyYW1PYmplY3QgPSBmdW5jdGlvbih2ZXJ0ZXhTaGFkZXJQYXRoLCBmcmFnbWVudFNoYWRlclBhdGgsIG9uTGlua2VkKSB7XHJcbiAgICB0aGlzLnByb2dyYW0gPSBHTC5jcmVhdGVQcm9ncmFtKCk7XHJcblxyXG4gICAgdGhpcy5vbkxpbmtlZCA9IG9uTGlua2VkO1xyXG5cclxuICAgIHRoaXMudmVydGV4U2hhZGVyID0ge1xyXG4gICAgICAgIFwic2hhZGVyXCI6IEdMLmNyZWF0ZVNoYWRlcihHTC5WRVJURVhfU0hBREVSKSxcclxuICAgICAgICBcInBhdGhcIjogdmVydGV4U2hhZGVyUGF0aCxcclxuICAgICAgICBcInNyY1wiOiBcIlwiLFxyXG4gICAgICAgIFwiY29tcGxldGVkXCI6IGZhbHNlXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB7XHJcbiAgICAgICAgXCJzaGFkZXJcIjogR0wuY3JlYXRlU2hhZGVyKEdMLkZSQUdNRU5UX1NIQURFUiksXHJcbiAgICAgICAgXCJwYXRoXCI6IGZyYWdtZW50U2hhZGVyUGF0aCxcclxuICAgICAgICBcInNyY1wiOiBcIlwiLFxyXG4gICAgICAgIFwiY29tcGxldGVkXCI6IGZhbHNlXHJcbiAgICB9O1xyXG59O1xyXG5cclxuUHJvZ3JhbU9iamVjdC5wcm90b3R5cGUgPSB7XHJcblxyXG4gICAgY29uc3RydWN0b3I6IFByb2dyYW1PYmplY3QsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsYmFjayBtZWV0b2QsIG1pcyBrb21waWxlZXJpYiBqYSBzw6R0ZXN0YWIgdmFyanVuZGFqYWQsIGt1aSBtw7VsZW1hZCBvbiBhc8O8bmtyb29uc2VsdCBsYWV0dWRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3JjIEzDpGh0ZWtvb2QsIG1pcyBBSkFYJ2kgYWJpbCBsYWV0aVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggVGVlLCBtaWxsZSBhYmlsIHR1dmFzdGFkYSwga3VtbWEgdmFyanVuZGFqYSBsw6RodGVrb29kIG9uIGxhZXR1ZFxyXG4gICAgICovXHJcbiAgICBvbmNvbXBsZXRlOiBmdW5jdGlvbihzcmMsIHBhdGgpIHtcclxuICAgICAgICBpZihwYXRoID09PSB0aGlzLnZlcnRleFNoYWRlci5wYXRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVydGV4U2hhZGVyLmNvbXBsZXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMudmVydGV4U2hhZGVyLnNyYyA9IHNyYztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZihwYXRoID09PSB0aGlzLmZyYWdtZW50U2hhZGVyLnBhdGgpIHtcclxuICAgICAgICAgICAgdGhpcy5mcmFnbWVudFNoYWRlci5jb21wbGV0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmZyYWdtZW50U2hhZGVyLnNyYyA9IHNyYztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHRoaXMudmVydGV4U2hhZGVyLmNvbXBsZXRlZCAmJiB0aGlzLmZyYWdtZW50U2hhZGVyLmNvbXBsZXRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBpbGVTaGFkZXIodGhpcy52ZXJ0ZXhTaGFkZXIuc2hhZGVyLCB0aGlzLnZlcnRleFNoYWRlci5zcmMpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBpbGVTaGFkZXIodGhpcy5mcmFnbWVudFNoYWRlci5zaGFkZXIsIHRoaXMuZnJhZ21lbnRTaGFkZXIuc3JjKTtcclxuXHJcbiAgICAgICAgICAgIEdMLmF0dGFjaFNoYWRlcih0aGlzLnByb2dyYW0sIHRoaXMudmVydGV4U2hhZGVyLnNoYWRlcik7XHJcbiAgICAgICAgICAgIEdMLmF0dGFjaFNoYWRlcih0aGlzLnByb2dyYW0sIHRoaXMuZnJhZ21lbnRTaGFkZXIuc2hhZGVyKTtcclxuXHJcbiAgICAgICAgICAgIEdMLmxpbmtQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XHJcblxyXG4gICAgICAgICAgICBpZighR0wuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLnByb2dyYW0sIEdMLkxJTktfU1RBVFVTKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFcnJvciBsaW5raW5nIHNoYWRlciBwcm9ncmFtOiBcXFwiXCIgKyBHTC5nZXRQcm9ncmFtSW5mb0xvZyh0aGlzLnByb2dyYW0pICsgXCJcXFwiXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZih0eXBlb2YgdGhpcy5vbkxpbmtlZCAhPSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5vbkxpbmtlZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDDnHJpdGFiIGtvbXBpbGVlcmlkYSB2YXJqdW5kYWphXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtXZWJHTFNoYWRlcn0gc2hhZGVyIFZhcmp1bmRhamEgbWlkYSBrb21waWxlZXJpZGFcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2UgTMOkaHRla29vZCwgbWlkYSBrb21waWxlZXJpZGFcclxuICAgICAqL1xyXG4gICAgY29tcGlsZVNoYWRlcjogZnVuY3Rpb24oc2hhZGVyLCBzb3VyY2UpIHtcclxuICAgICAgICBHTC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzb3VyY2UpO1xyXG4gICAgICAgIEdMLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcclxuXHJcbiAgICAgICAgaWYgKCFHTC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBHTC5DT01QSUxFX1NUQVRVUykpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJTaGFkZXIgY29tcGlsYXRpb24gZmFpbGVkLiBFcnJvcjogXFxcIlwiICsgR0wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpICsgXCJcXFwiXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBBbnR1ZCBrbGFzc2kgYWJpbCBvbiB2w7VpbWFsaWsgcHJvZ3JhbW1pIGxhYWRpZGEgamEgYXPDvG5rcm9vbnNlbHQgdGFnYXBpbGRpbCBzcGV0c2lmaXRzZWVyaXR1ZCB2YXJqdW5kYWphZFxyXG4gKiB0YWdhc3RhdHVkIHByb2dyYW1taWdhIHNpZHVkYVxyXG4gKlxyXG4gKiBAY2xhc3MgU2hhZGVyUHJvZ3JhbUxvYWRlclxyXG4gKi9cclxudmFyIFNoYWRlclByb2dyYW1Mb2FkZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuY29udGFpbmVyID0gW107XHJcbiAgICB0aGlzLmNvdW50ZXIgPSAtMTtcclxufTtcclxuXHJcblNoYWRlclByb2dyYW1Mb2FkZXIucHJvdG90eXBlID0ge1xyXG4gICAgY29uc3RydWN0b3I6IFNoYWRlclByb2dyYW1Mb2FkZXIsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUYWdhc3RhYiBwcm9ncmFtbSBvYmpla3RpLiBBc8O8bmtyb29uc2VsdCB0YWdhcGxhYW5pbCBsYWV0YWtzZSBqYSBrb21waWxlZXJpdGFrc2UgdmFyanVuZGFqYWQuIEVubmUga3VpXHJcbiAgICAgKiBwcm9ncmFtbWkga2FzdXRhZGEgdHVsZWIga29udHJvbGxpZGEsIGV0IHZhcmp1bmRhamFkIG9uIGtvbXBpbGVlcml0dWQgamEgcHJvZ3JhbW1pZ2Egc2VvdHVkLiBWw7VpbWFsaWsgb25cclxuICAgICAqIHBhcmFtZWV0cmlrcyBhbmRhIGthIENhbGxiYWNrIGZ1bmt0c2lvb24sIG1pcyB0ZWFkYSBhbm5hYiwga3VpIHZhcmp1bmRhamFkIG9uIHNlb3R1ZC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdmVydGV4U2hhZGVyUGF0aCBUZWUsIHRpcHV2YXJqdW5kYWphIGp1dXJkZVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50U2hhZGVyUGF0aCBUZWUsIHBpa3NsaXZhcmp1bmRhamEganV1cmRlXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsaW5rZWRDYWxsYmFjayBGdW5rdHNpb29uLCBtaXMga3V0c3V0YWtzZSB2w6RsamEsIGt1aSB2YXJqdW5kYWphZCBvbiBrb21waWxlZXJpdHVkIGphIHNlb3R1ZCBwcm9ncmFtbWlnYVxyXG4gICAgICogQHJldHVybnMge2V4cG9ydHMuZGVmYXVsdE9wdGlvbnMucHJvZ3JhbXwqfFdlYkdMUHJvZ3JhbXxQcm9ncmFtT2JqZWN0LnByb2dyYW19XHJcbiAgICAgKi9cclxuICAgIGdldFByb2dyYW06IGZ1bmN0aW9uKHZlcnRleFNoYWRlclBhdGgsIGZyYWdtZW50U2hhZGVyUGF0aCwgbGlua2VkQ2FsbGJhY2spIHtcclxuICAgICAgICB0aGlzLmNvdW50ZXIrKztcclxuICAgICAgICB0aGlzLmNvbnRhaW5lclt0aGlzLmNvdW50ZXJdID0gbmV3IFByb2dyYW1PYmplY3QodmVydGV4U2hhZGVyUGF0aCwgZnJhZ21lbnRTaGFkZXJQYXRoLCBsaW5rZWRDYWxsYmFjayk7XHJcbiAgICAgICAgdmFyIHByb2dyYW0gPSB0aGlzLmNvbnRhaW5lclt0aGlzLmNvdW50ZXJdO1xyXG5cclxuICAgICAgICB0aGlzLmxvYWRBc3luY1NoYWRlclNvdXJjZSh2ZXJ0ZXhTaGFkZXJQYXRoLCBwcm9ncmFtLm9uY29tcGxldGUuYmluZChwcm9ncmFtKSk7XHJcbiAgICAgICAgdGhpcy5sb2FkQXN5bmNTaGFkZXJTb3VyY2UoZnJhZ21lbnRTaGFkZXJQYXRoLCBwcm9ncmFtLm9uY29tcGxldGUuYmluZChwcm9ncmFtKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9ncmFtLnByb2dyYW07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTGFlYiBhc8O8bmtyb29uc2VsdFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzaGFkZXJQYXRoIFRlZSwga3VzIGFzdWIgdmFyanVuZGFqYVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgRnVua3RzaW9vbiwgbWlzIGvDpGl2aXRhdGFrc2UsIGt1aSBsw6RodGVrb29kIG9uIGvDpHR0ZSBzYWFkdWQuIFNhYWRldGFrc2UgdmFzdHVzIGphIHRlZS5cclxuICAgICAqL1xyXG4gICAgbG9hZEFzeW5jU2hhZGVyU291cmNlOiBmdW5jdGlvbihzaGFkZXJQYXRoLCBjYWxsYmFjaykge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIGFzeW5jOiB0cnVlLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJ0ZXh0XCIsXHJcbiAgICAgICAgICAgIHVybDogc2hhZGVyUGF0aCxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZXN1bHQsIHNoYWRlclBhdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQcm9ncmFtT2JqZWN0O1xyXG5tb2R1bGUuZXhwb3J0cyA9IFNoYWRlclByb2dyYW1Mb2FkZXI7Il19
