(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\prog\\webglstudy\\lessons\\lesson06\\main.js":[function(require,module,exports){
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////Antud osa tegeleb WebGL konteksti loomisega ja meile vajaliku WebGLProgram objekti loomisega ///////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ShaderProgramLoader = require("./../utils/shaderprogramloader");
var Looper = require("./../utils/looper");

//Varjundajate kataloog
var SHADER_PATH = "shaders/lesson07/";

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
        delta = -e.detail / 3;

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


    APP.cameraX += x * 0.002;
    APP.cameraY += y * 0.002;

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

    render();
}

//Uuendab andmeid, et oleks võimalik stseen liikuma panna
function update(deltaTime) {
    APP.time += deltaTime * 0.01;

}

//Uuendab kaamerat, et seda oleks võimalik ümber objekti pöörata.
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
        Math.sin(APP.cameraX - 3.14 / 2),
        0,
        Math.cos(APP.cameraX - 3.14 / 2)
    ];

    vec3.normalize(APP.right, APP.right);
    vec3.normalize(APP.lookDirection, APP.lookDirection);
    vec3.cross(APP.up, APP.lookDirection, APP.right);


    //Uuendame kaameramaatriksit
    mat4.lookAt(APP.viewMatrix, APP.cameraAt, APP.lookAt, APP.up);

    var z = vec3.dot(APP.lookDirection, APP.up);
    var x = vec3.dot(APP.right, APP.up);
    var c = vec3.dot(APP.right, APP.lookDirection);

}

//Renderdamine
function render() {

    //Ppuhastame ka värvi- ja sügavuspuhvrid, ning määrame uue puhastuvärvuse.
    //Hetkel puhastamine midagi ei tee, sest me renderdame vaid ühe korra, kuid kui me tsükklis seda tegema
    //on näha ka, mida nad teevad.
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
},{}]},{},["C:\\prog\\webglstudy\\lessons\\lesson06\\main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibGVzc29ucy9sZXNzb24wNi9tYWluLmpzIiwibGVzc29ucy91dGlscy9sb29wZXIuanMiLCJsZXNzb25zL3V0aWxzL3NoYWRlcnByb2dyYW1sb2FkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy9BbnR1ZCBvc2EgdGVnZWxlYiBXZWJHTCBrb250ZWtzdGkgbG9vbWlzZWdhIGphIG1laWxlIHZhamFsaWt1IFdlYkdMUHJvZ3JhbSBvYmpla3RpIGxvb21pc2VnYSAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG52YXIgU2hhZGVyUHJvZ3JhbUxvYWRlciA9IHJlcXVpcmUoXCIuLy4uL3V0aWxzL3NoYWRlcnByb2dyYW1sb2FkZXJcIik7XHJcbnZhciBMb29wZXIgPSByZXF1aXJlKFwiLi8uLi91dGlscy9sb29wZXJcIik7XHJcblxyXG4vL1Zhcmp1bmRhamF0ZSBrYXRhbG9vZ1xyXG52YXIgU0hBREVSX1BBVEggPSBcInNoYWRlcnMvbGVzc29uMDcvXCI7XHJcblxyXG4vL1Rla3N0dXVyaSBhc3Vrb2h0XHJcbnZhciBURVhUVVJFX1BBVEggPSBcImFzc2V0cy90ZXh0dXJlLmpwZ1wiO1xyXG5cclxuLy9FbGVtZW50LCBrdWh1IHJlbmRlcmRhbWVcclxudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG5cclxuLy9Mb29tZSBnbG9iYWFsc2UgV2ViR0wga29udGVrc3RpXHJcbkdMID0gaW5pdFdlYkdMKGNhbnZhcyk7XHJcblxyXG4vL1NlYWRpc3RhbWUgcmVuZGVyZGFtaXNyZXNvbHV0c2lvb25pXHJcbkdMLnZpZXdwb3J0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcbkdMLnZpZXdwb3J0V2lkdGggPSBjYW52YXMud2lkdGg7XHJcbkdMLnZpZXdwb3J0SGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcclxuXHJcbi8vTG9vbWUgdXVlIHByb2dyYW1taSBzcGV0c2lmaXRzZWVyaXR1ZCB2YXJqdW5kYWphdGVnYS4gS3VuYSBsYWFkaW1pbmUgb24gYXPDvG5rcm9vbm5lLCBzaWlzIGFubmFtZSBrYWFzYSBrYVxyXG4vL21lZXRvZGksIG1pcyBrdXRzdXRha3NlIHbDpGxqYSBrdWkgdmFyanVuZGFqYWQgb24gbGFldHVkXHJcbnZhciBzaGFkZXJQcm9ncmFtTG9hZGVyID0gbmV3IFNoYWRlclByb2dyYW1Mb2FkZXIoKTtcclxudmFyIHNoYWRlclByb2dyYW0gPSBzaGFkZXJQcm9ncmFtTG9hZGVyLmdldFByb2dyYW0oU0hBREVSX1BBVEggKyBcInZlcnRleC5zaGFkZXJcIiwgU0hBREVSX1BBVEggKyBcImZyYWdtZW50LnNoYWRlclwiLCBzaGFkZXJzTG9hZGVkKTtcclxuXHJcblxyXG4vL8Occml0YW1lIGx1dWEgV2ViR0wga29udGVrc3RpXHJcbmZ1bmN0aW9uIGluaXRXZWJHTChjYW52YXMpIHtcclxuICAgIHZhciBnbCA9IG51bGw7XHJcblxyXG4gICAgdHJ5IHtcclxuXHJcbiAgICAgICAgLy/DnHJpdGFtZSBsdXVhIHRhdmFsaXN0IGtvbnRla3N0aSwga3VpIHNlZSBlYmHDtW5uZXN0dWIgw7xyaXRhbWUgbHV1YSBla3NwZXJpbWVudGFhbHNldCxcclxuICAgICAgICAvL01pZGEga2FzdXRhdGFrc2Ugc3BldHNpZmlrYXRzaW9vbmkgYXJlbmRhbWlzZWtzXHJcbiAgICAgICAgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpIHx8IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIpO1xyXG5cclxuICAgIH0gY2F0Y2ggKGUpIHt9XHJcblxyXG4gICAgaWYoIWdsKSB7XHJcbiAgICAgICAgYWxlcnQoXCJVbmFibGUgdG8gaW5pdGlsaXplIFdlYkdMLiBZb3VyIGJyb3dzZXIgbWF5IG5vdCBzdXBwb3J0IGl0LlwiKTtcclxuICAgICAgICB0aHJvdyBFcnJvcihcIkV4ZWN1dGlvbiB0ZXJtaW5hdGVkLiBObyBXZWJHTCBjb250ZXh0XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBnbDtcclxufVxyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIExFU1NPTjA2IC0gSElJUiAuLi4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxudmFyIEFQUCA9IHt9O1xyXG5cclxuQVBQLmxvb3BlciA9IG5ldyBMb29wZXIoY2FudmFzLCBsb29wKTtcclxuXHJcbkFQUC5pc01vdXNlRG93biA9IGZhbHNlO1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIG1vdXNlQ2xpY2tIYW5kbGVyLCBmYWxzZSk7XHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG1vdXNlQ2xpY2tIYW5kbGVyLCBmYWxzZSk7XHJcblxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V3aGVlbFwiLCBtb3VzZVNjcm9sbEhhbmRsZXIsIGZhbHNlKTtcclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTU1vdXNlU2Nyb2xsXCIsIG1vdXNlU2Nyb2xsSGFuZGxlciwgZmFsc2UpO1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwib25tb3VzZXdoZWVsXCIsIG1vdXNlU2Nyb2xsSGFuZGxlciwgZmFsc2UpO1xyXG5cclxuLy9LT05TVEFORElEIEtBQU1FUkEgSkFPS1NcclxuXHJcbi8vMzYwIGtyYWFkaVxyXG5BUFAuVFdPUEkgPSAyLjAgKiBNYXRoLlBJO1xyXG5cclxuLy85MCBrcmFhZGlcclxuQVBQLlBJT1ZFUlRXTyA9IE1hdGguUEkgLyAyLjA7XHJcblxyXG4vL01ha3NpbWFhbG5lIHZlcnRpa2FhbG51cmtcclxuQVBQLk1BWF9WRVJUSUNBTCA9IEFQUC5QSU9WRVJUV08gLSBBUFAuUElPVkVSVFdPIC8gODtcclxuXHJcbi8vUmFhZGl1cywgbWlsbGVzdCBsw6RoZW1hbGUga2FhbWVyYSBtaW5uYSBlaSBzYWFcclxuQVBQLk1JTl9SQURJVVMgPSAxO1xyXG5cclxuLy9TdXVtaW1pc2tvbnN0YW50XHJcbkFQUC5aT09NX1ZBTFVFID0gMC41O1xyXG5cclxuLy9LdXRzdXRha3NlIGt1aSB2YXJqdW5kYWphZCBvbiBsYWV0dWRcclxuZnVuY3Rpb24gc2hhZGVyc0xvYWRlZCgpIHtcclxuICAgIHNldHVwQW5kTG9hZFRleHR1cmUoKTtcclxuICAgIHNldHVwKCk7XHJcblxyXG4gICAgQVBQLmxvb3Blci5sb29wKCk7XHJcbn1cclxuXHJcbi8vVGVrc3R1dXJpIGluaXRzaWFsaXNlZXJpbWluZSBqYSBsYWFkaW1pbmVcclxuZnVuY3Rpb24gc2V0dXBBbmRMb2FkVGV4dHVyZSgpIHtcclxuXHJcbiAgICAvL0xvb21lIHV1ZSB0ZWtzdHV1cmkgamEga29vcyBzZWxsZWdhIDF4MSBwaWtzbGlzZSBwaWxkaSwgbWlzIGt1dmF0YWtzZSBzZW5pa2F1YSwga3VuaSB0ZWtzdHV1ciBzYWFiIGxhZXR1ZFxyXG4gICAgQVBQLnRleHR1cmUgPSBHTC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBBUFAudGV4dHVyZSk7XHJcbiAgICBHTC50ZXhJbWFnZTJEKEdMLlRFWFRVUkVfMkQsIDAsIEdMLlJHQkEsIDEsIDEsIDAsIEdMLlJHQkEsICBHTC5VTlNJR05FRF9CWVRFLCBuZXcgVWludDhBcnJheShbMSwgMSwgMSwgMV0pKTtcclxuICAgIEdMLnRleFBhcmFtZXRlcmYoR0wuVEVYVFVSRV8yRCwgR0wuVEVYVFVSRV9XUkFQX1MsIEdMLlJFUEVBVCk7XHJcbiAgICBHTC50ZXhQYXJhbWV0ZXJmKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfV1JBUF9ULCBHTC5SRVBFQVQpO1xyXG4gICAgR0wudGV4UGFyYW1ldGVyaShHTC5URVhUVVJFXzJELCBHTC5URVhUVVJFX01BR19GSUxURVIsIEdMLk5FQVJFU1QpO1xyXG4gICAgR0wudGV4UGFyYW1ldGVyaShHTC5URVhUVVJFXzJELCBHTC5URVhUVVJFX01JTl9GSUxURVIsIEdMLk5FQVJFU1QpO1xyXG5cclxuICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG5cclxuICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIEFQUC50ZXh0dXJlKTtcclxuICAgICAgICBHTC50ZXhJbWFnZTJEKEdMLlRFWFRVUkVfMkQsIDAsIEdMLlJHQiwgR0wuUkdCLCAgR0wuVU5TSUdORURfQllURSwgaW1hZ2UpO1xyXG4gICAgICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgfTtcclxuICAgIGltYWdlLnNyYyA9IFRFWFRVUkVfUEFUSDtcclxuXHJcbn1cclxuXHJcbi8vTG9vYiBwdWh2cmlkIGphIG1hYXRyaWtzaWQuIFTDpGlkYWIgcHVodnJpZCBhbmRtZXRlZ2EuXHJcbmZ1bmN0aW9uIHNldHVwKCkge1xyXG4gICAgLy9UZWVtZSBtdXV0dWphLCBrdWh1IHNhbHZlc3RhZGEgYWVnYSwgZXQga2FhbWVyYXQgYWphIG3DtsO2ZHVkZXMgw7xtYmVyIG9iamVrdGkgcMO2w7ZyYXRhXHJcbiAgICBBUFAudGltZSA9IDA7XHJcblxyXG4gICAgQVBQLmNhbWVyYVggPSAwO1xyXG4gICAgQVBQLmNhbWVyYVkgPSAwO1xyXG4gICAgQVBQLnJhZGl1cyA9IDU7XHJcblxyXG4gICAgLy9NdWRlbG1hYXRyaWtzLCBtaWxsZWdhIG9iamVrdGlydXVtaXN0IG1hYWlsbWFydXVtaSBzYWFkYVxyXG4gICAgQVBQLm1vZGVsTWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuXHJcbiAgICAvL1B1bmt0LCBrdXMgb2JqZWt0IGhldGtlbCBhc3ViXHJcbiAgICBBUFAub2JqZWN0QXQgPSBbMC4wLCAwLjAsIC01LjBdO1xyXG5cclxuICAgIC8vS2FzdXRhZGVzIHRyYW5zbGF0c2lvb25pLCBzYWFtZSBtdWRlbG1hYXRyaWtzaWdhIG9iamVrdGkgbGlpZ3V0YWRhXHJcbiAgICBtYXQ0LnRyYW5zbGF0ZShBUFAubW9kZWxNYXRyaXgsIEFQUC5tb2RlbE1hdHJpeCwgQVBQLm9iamVjdEF0KTtcclxuXHJcbiAgICAvL0thYW1lcmFtYWF0cmlrcywgbWlsbGVnYSBtYWFpbG1hcnV1bWlzdCBrYWFtZXJhcnV1bWkgc2FhZGFcclxuICAgIEFQUC52aWV3TWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuXHJcbiAgICAvL0RlZmluZWVyaW1lIHZla3RvcmlkLCBtaWxsZSBhYmlsIG9uIHbDtWltYWxpayBrYWFtZXJhcnV1bWkgYmFhc3Zla3RvcmlkIGFydnV0YWRhXHJcbiAgICBBUFAuY2FtZXJhQXQgPSBbMCwgMCwgNV07ICAgICAgICAgICAgLy9Bc3ViIG1hYWlsbWFydXVtaXMgbmVuZGVsIGtvb3JkaW5hYXRpZGVsXHJcbiAgICBBUFAubG9va0F0ID0gdmVjMy5jcmVhdGUoKTsgICAgICAgICAgICAgLy9NaXMgc3V1bmFzIGthYW1lcmEgdmFhdGFiLiBQYXJlbWFrw6RlIGtvb3JkaW5hYXRzw7xzdGVlbWlzIG9uIC16IGVrcmFhbmkgc2lzc2VcclxuICAgIEFQUC51cCA9IHZlYzMuY3JlYXRlKCk7ICAgICAgICAgICAgICAgICAgLy9WZWt0b3IsIG1pcyBuw6RpdGFiLCBrdXMgb24ga2FhbWVyYSDDvGxlc3NlIHN1dW5kYSBuw6RpdGF2IHZla3RvclxyXG4gICAgdXBkYXRlQ2FtZXJhKCk7XHJcblxyXG4gICAgLy9Qcm9qZWt0c2lvb25pbWFhdHJpa3MsIGV0IHDDvGdhbWlzcnV1bWkgc2FhZGEuIEthc3V0YWRlcyBnbE1hdHJpeCB0ZWVraSBnZW5lcmVlcmltZSBrYSBww7xyYW1paWRpLCBrdWh1IHNpc3NlIG9iamVrdGlkIGzDpGhldmFkLlxyXG4gICAgQVBQLnByb2plY3Rpb25NYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG4gICAgbWF0NC5wZXJzcGVjdGl2ZShBUFAucHJvamVjdGlvbk1hdHJpeCwgNDUuMCwgR0wudmlld3BvcnRXaWR0aCAvIEdMLnZpZXdwb3J0SGVpZ2h0LCAxLjAsIDEwMDAuMCk7XHJcblxyXG5cclxuXHJcblxyXG4gICAgLy9UaXBwdWRlIGFuZG1lZC4gVGlwdSBrb29yZGluYWFkaWQgeCwgeSwgeiBqYSB0ZWtzdHV1cmkga29vcmRpbmFhZGlkIHUsIHZcclxuICAgIEFQUC5teVZlcnRpY2VzRGF0YSA9IFtcclxuICAgICAgICAvL0VzaW1lbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAgMS4wLCAgMC4wLCAxLjAsICAgICAgICAgICAgLy9BTFVNSU5FIFZBU0FLIE5VUktcclxuICAgICAgICAgMS4wLCAtMS4wLCAgMS4wLCAgMS4wLCAxLjAsICAgICAgICAgICAgLy9BTFVNSU5FIFBBUkVNIE5VUktcclxuICAgICAgICAgMS4wLCAgMS4wLCAgMS4wLCAgMS4wLCAwLjAsICAgICAgICAgICAgLy/DnExFTUlORSBQQVJFTSBOVVJLXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgIDEuMCwgIDAuMCwgMC4wLCAgICAgICAgICAgIC8vw5xMRU1JTkUgVkFTQUsgTlVSS1xyXG5cclxuICAgICAgICAvL1RhZ3VtaW5lIGvDvGxnXHJcbiAgICAgICAgLTEuMCwgLTEuMCwgLTEuMCwgIDAuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsICAxLjAsIC0xLjAsICAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsICAxLjAsIC0xLjAsICAgMS4wLCAwLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAtMS4wLCAgIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL8OcbGVtaW5lIGvDvGxnXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgLTEuMCwgIDAuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsICAxLjAsICAxLjAsICAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsICAxLjAsICAxLjAsICAgIDEuMCwgMC4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgLTEuMCwgIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL0FsdW1pbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsIC0xLjAsIC0xLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgLTEuMCwgIDEuMCwgIDEuMCwgMC4wLFxyXG4gICAgICAgIC0xLjAsIC0xLjAsICAxLjAsIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL1BhcmVtIGvDvGxnXHJcbiAgICAgICAgMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsICAxLjAsIC0xLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgIDEuMCwgIDEuMCwgMC4wLFxyXG4gICAgICAgIDEuMCwgLTEuMCwgIDEuMCwgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vVmFzYWsga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDEuMCxcclxuICAgICAgICAtMS4wLCAtMS4wLCAgMS4wLCAxLjAsIDEuMCxcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMS4wLCAgMS4wLCAwLjAsXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgLTEuMCwgMC4wLCAwLjAsXHJcbiAgICBdO1xyXG4gICAgQVBQLnZlcnRleFNpemUgPSA1O1xyXG5cclxuICAgIC8vTG9vbWUgcHVodnJpLCBrdWh1IHRpcHVhbmRtZWQgdmlpYS4gU2VvbWUga2EgYW50dWQgcHVodnJpIGtvbnRla3N0aWdhLCBldCB0ZW1hbGUga8Okc2tlIGVkYXNpIGFuZGFcclxuICAgIEFQUC52ZXJ0ZXhCdWZmZXIgPSBHTC5jcmVhdGVCdWZmZXIoKTtcclxuXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkFSUkFZX0JVRkZFUiwgQVBQLnZlcnRleEJ1ZmZlcik7XHJcblxyXG4gICAgLy9Bbm5hbWUgbG9vZHVkIHB1aHZyaWxlIGFuZG1lZFxyXG4gICAgR0wuYnVmZmVyRGF0YShHTC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoQVBQLm15VmVydGljZXNEYXRhKSwgR0wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgIC8vVGlwcHVkZSBpbmRla3NpZFxyXG4gICAgQVBQLm15SW5kaWNlc0RhdGEgPSBbXHJcbiAgICAgICAgMCwgMSwgMiwgICAgICAwLCAyLCAzLCAgICAvLyBFc2ltZW5lIGvDvGxnXHJcbiAgICAgICAgNCwgNSwgNiwgICAgICA0LCA2LCA3LCAgICAvLyBUYWd1bWluZSBrw7xsZ1xyXG4gICAgICAgIDgsIDksIDEwLCAgICAgOCwgMTAsIDExLCAgLy8gw5xsZW1pbmUga8O8bGdcclxuICAgICAgICAxMiwgMTMsIDE0LCAgIDEyLCAxNCwgMTUsIC8vIEFsdW1pbmUga8O8bGdcclxuICAgICAgICAxNiwgMTcsIDE4LCAgIDE2LCAxOCwgMTksIC8vIFBhcmVtIGvDvGxnXHJcbiAgICAgICAgMjAsIDIxLCAyMiwgICAyMCwgMjIsIDIzICAvLyBWYXNhayBrw7xsZ1xyXG4gICAgXTtcclxuXHJcbiAgICAvL0xvb21lIHB1aHZyaSwga3VodSBpbmRla3NpZCB2aWlhLiBTZW9tZSBrYSBhbnR1ZCBwdWh2cmkga29udGVrc3RpZ2EsIGV0IHRlbWFsZSBrw6Rza2UgZWRhc2kgYW5kYVxyXG4gICAgQVBQLmluZGV4QnVmZmVyID0gR0wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBBUFAuaW5kZXhCdWZmZXIubnVtYmVyT2ZJbmRleGVzID0gMzY7XHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBBUFAuaW5kZXhCdWZmZXIpO1xyXG5cclxuICAgIC8vQW5uYW1lIGxvb2R1ZCBwdWh2cmlsZSBhbmRtZWRcclxuICAgIEdMLmJ1ZmZlckRhdGEoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG5ldyBVaW50MTZBcnJheShBUFAubXlJbmRpY2VzRGF0YSksIEdMLlNUQVRJQ19EUkFXKTtcclxuXHJcbiAgICAvL03DpMOkcmFtZSBwcm9ncmFtbWksIG1pZGEgbWUgcmVuZGVyZGFtaXNlbCBrYXN1dGFkYSB0YWhhbWVcclxuICAgIEdMLnVzZVByb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XHJcblxyXG4gICAgLy9TYWFtZSBpbmRla3NpLCBtaXMgbsOkaXRhYiBrdXMgYXN1YiBtZWllIHByb2dyYW1taXMga2FzdXRhdGF2YXMgdGlwdXZhcmp1bmRhamFzXHJcbiAgICAvL29sZXYgdGlwdWF0cmlidXV0IG5pbWVnYSBhX1ZlcnRleFBvc2l0aW9uXHJcbiAgICBBUFAuYV9Qb3NpdGlvbiA9IEdMLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYV9Qb3NpdGlvblwiKTtcclxuXHJcbiAgICAvL1NhYW1lIHbDpHJ2aWF0cmlidXVkaSBhc3Vrb2hhXHJcbiAgICBBUFAuYV9UZXh0dXJlQ29vcmQgPSBHTC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcImFfVGV4dHVyZUNvb3JkXCIpO1xyXG5cclxuICAgIC8vU2FhbWUgw7xodHNldGUgbXV1dHVqYXRlIGFzdWtvaGFkXHJcbiAgICBBUFAudV9Nb2RlbE1hdHJpeCA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfTW9kZWxNYXRyaXhcIik7XHJcbiAgICBBUFAudV9WaWV3TWF0cml4ID0gR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9WaWV3TWF0cml4XCIpO1xyXG4gICAgQVBQLnVfUHJvamVjdGlvbk1hdHJpeCA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfUHJvamVjdGlvbk1hdHJpeFwiKTtcclxuICAgIEFQUC51X1RleHR1cmUgPSBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X1RleHR1cmVcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdXNlQ2xpY2tIYW5kbGVyKCkge1xyXG4gICAgQVBQLmlzTW91c2VEb3duID0gIUFQUC5pc01vdXNlRG93bjtcclxuXHJcbiAgICBpZihBUFAuaXNNb3VzZURvd24pXHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBtb3VzZU1vdmUsIGZhbHNlKTtcclxuICAgIGVsc2VcclxuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG1vdXNlTW92ZSwgZmFsc2UpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb3VzZVNjcm9sbEhhbmRsZXIoZSkge1xyXG4gICAgdmFyIGRlbHRhID0gMDtcclxuXHJcbiAgICBpZighZSlcclxuICAgICAgICBlID0gd2luZG93LmV2ZW50O1xyXG5cclxuICAgIGlmKGUud2hlZWxEZWx0YSkgICAgICAgICAgICAgICAgICAgIC8qKiBJbnRlcm5ldCBFeHBsb3Jlci9PcGVyYS9Hb29nbGUgQ2hyb21lICoqL1xyXG4gICAgICAgIGRlbHRhID0gZS53aGVlbERlbHRhIC8gMTIwO1xyXG4gICAgZWxzZSBpZihlLmRldGFpbCkgICAgICAgICAgICAgICAgICAgLyoqIE1vemlsbGEgRmlyZWZveCAqKi9cclxuICAgICAgICBkZWx0YSA9IC1lLmRldGFpbCAvIDM7XHJcblxyXG4gICAgaWYoZGVsdGEpIHtcclxuICAgICAgICBpZihkZWx0YSA+IDAgJiYgQVBQLnJhZGl1cyA+IEFQUC5NSU5fUkFESVVTKVxyXG4gICAgICAgICAgICBBUFAucmFkaXVzIC09IEFQUC5aT09NX1ZBTFVFO1xyXG4gICAgICAgIGVsc2UgaWYoZGVsdGEgPCAwKVxyXG4gICAgICAgICAgICBBUFAucmFkaXVzICs9IEFQUC5aT09NX1ZBTFVFO1xyXG4gICAgfVxyXG5cclxuICAgICAgICBpZihlLnByZXZlbnREZWZhdWx0KVxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xyXG5cclxuICAgIHRvQ2Fub25pY2FsKCk7XHJcbiAgICB1cGRhdGVDYW1lcmEoKTtcclxufVxyXG5cclxuLy9IaWlyZSBhbGxob2lkbWlzZWwgamEgbGlpZ3V0YW1pc2VsIGvDpGl2aXR1YiBhbnR1ZCBmdW5rdHNpb29uXHJcbmZ1bmN0aW9uIG1vdXNlTW92ZShlKSB7XHJcbiAgICB2YXIgeCA9IGUud2Via2l0TW92ZW1lbnRYIHx8IGUubW96TW92ZW1lbnRYO1xyXG4gICAgdmFyIHkgPSBlLndlYmtpdE1vdmVtZW50WSB8fCBlLm1vek1vdmVtZW50WTtcclxuXHJcbiAgICBpZih0eXBlb2YgeCA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICB4ID0gMDtcclxuICAgIGlmKHR5cGVvZiB5ID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgIHkgPSAwO1xyXG5cclxuXHJcbiAgICBBUFAuY2FtZXJhWCArPSB4ICogMC4wMDI7XHJcbiAgICBBUFAuY2FtZXJhWSArPSB5ICogMC4wMDI7XHJcblxyXG4gICAgcmVzdHJpY3RDYW1lcmFZKCk7XHJcbiAgICB0b0Nhbm9uaWNhbCgpO1xyXG5cclxuICAgIHVwZGF0ZUNhbWVyYSgpO1xyXG59XHJcblxyXG4vL0Z1bmt0c2lvb24sIGV0IHZpaWEgaG9yaXNvbnRhYWxuZSBqYSB2ZXJ0aWthYWxuZSBudXJrIGthbm9vbmlsaXNzZSB2b3JtaVxyXG4vL0ltcGxlbWVudGVlcml0dWQgM0QgTWF0aCBQcmltZXIgZm9yIEdyYXBoaWNzIGFuZCBHYW1lIERldmVsb3BtZW50IGp1aGVuZGkgasOkcmdpXHJcbmZ1bmN0aW9uIHRvQ2Fub25pY2FsKCkge1xyXG5cclxuICAgIC8vS3VpIG9sZW1lIDAga29vcmRpbmFhdGlkZWxcclxuICAgIGlmKEFQUC5yYWRpdXMgPT0gMC4wKSB7XHJcbiAgICAgICAgQVBQLmNhbWVyYVggPSBBUFAuY2FtZXJhWSA9IDAuMDtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvL0t1aSByYWFkaXVzIG9uIG5lZ2F0aWl2bmUuXHJcbiAgICAgICAgaWYoQVBQLnJhZGl1cyA8IDAuMCkge1xyXG4gICAgICAgICAgICBBUFAucmFkaXVzID0gLUFQUC5yYWRpdXM7XHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFYICs9IE1hdGguUEk7XHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFZID0gLUFQUC5jYW1lcmFZO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9WZXJ0aWthYWxuZSBudXJrIMO8bGVtaXNlc3QgcGlpcmlzdCB2w6RsamFcclxuICAgICAgICBpZihNYXRoLmFicyhBUFAuY2FtZXJhWSkgPiBBUFAuUElPVkVSVFdPKSB7XHJcblxyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWSArPSBBUFAuUElPVkVSVFdPO1xyXG5cclxuICAgICAgICAgICAgQVBQLmNhbWVyYVkgLT0gTWF0aC5mbG9vcihBUFAuY2FtZXJhWSAvIEFQUC5UV09QSSkgKiBBUFAuVFdPUEk7XHJcblxyXG4gICAgICAgICAgICBpZihBUFAuY2FtZXJhWSA+IE1hdGguUEkpIHtcclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFYICs9IE1hdGguUEk7XHJcblxyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVkgPSAzLjAgKiBNYXRoLlBJLzIuMCAtIEFQUC5jYW1lcmFZO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVkgLT0gQVBQLlBJT1ZFUlRXTztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9HSU1CQUwgTE9DS1xyXG4gICAgICAgIGlmKE1hdGguYWJzKEFQUC5jYW1lcmFZKSA+PSBBUFAuUElPVkVSVFdPICogMC45OTk5KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR0lNQkFMTE9DS1wiKTtcclxuICAgICAgICAgICAgQVBQLmNhbWVyYVggPSAwLjA7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmKE1hdGguYWJzKEFQUC5jYW1lcmFYKSA+IE1hdGguUEkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBBUFAuY2FtZXJhWCArPSBNYXRoLlBJO1xyXG5cclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFYIC09IE1hdGguZmxvb3IoQVBQLmNhbWVyYVggLyBBUFAuVFdPUEkpICogQVBQLlRXT1BJO1xyXG5cclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFYIC09IE1hdGguUEk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiByZXN0cmljdENhbWVyYVkoKSB7XHJcbiAgICBpZihNYXRoLmFicyhBUFAuY2FtZXJhWSkgPiBBUFAuTUFYX1ZFUlRJQ0FMKSB7XHJcbiAgICAgICAgaWYoQVBQLmNhbWVyYVkgPCAwKVxyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWSA9IC1BUFAuTUFYX1ZFUlRJQ0FMO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgQVBQLmNhbWVyYVkgPSBBUFAuTUFYX1ZFUlRJQ0FMO1xyXG4gICAgfVxyXG59XHJcblxyXG4vL0t1dHN1dGFrc2UgdsOkbGphIExvb3BlciBvYmpla3RpcyBpZ2Ega2FhZGVyXHJcbmZ1bmN0aW9uIGxvb3AoZGVsdGFUaW1lKSB7XHJcbiAgICB1cGRhdGUoZGVsdGFUaW1lKTtcclxuXHJcbiAgICByZW5kZXIoKTtcclxufVxyXG5cclxuLy9VdWVuZGFiIGFuZG1laWQsIGV0IG9sZWtzIHbDtWltYWxpayBzdHNlZW4gbGlpa3VtYSBwYW5uYVxyXG5mdW5jdGlvbiB1cGRhdGUoZGVsdGFUaW1lKSB7XHJcbiAgICBBUFAudGltZSArPSBkZWx0YVRpbWUgKiAwLjAxO1xyXG5cclxufVxyXG5cclxuLy9VdWVuZGFiIGthYW1lcmF0LCBldCBzZWRhIG9sZWtzIHbDtWltYWxpayDDvG1iZXIgb2JqZWt0aSBww7bDtnJhdGEuXHJcbmZ1bmN0aW9uIHVwZGF0ZUNhbWVyYSgpIHtcclxuXHJcbiAgICAvL0xlaWFtZSB1dWUgcG9zaXRzaW9vbmksIG1pcyBhamFzIGxpaWd1YiBwb2xhYXJzZXMga29vcmRpbmFhdHPDvHN0ZWVtaXMgamEgbWlsbGUgdGVpc2VuZGFtZSByaXN0a29vcmRpbmFhdHPDvHN0ZWVtaVxyXG4gICAgQVBQLmNhbWVyYUF0ID0gW0FQUC5vYmplY3RBdFswXSArIEFQUC5yYWRpdXMgKiBNYXRoLmNvcyhBUFAuY2FtZXJhWSkgKiBNYXRoLnNpbihBUFAuY2FtZXJhWCksICAgICAgIC8vIFhcclxuICAgICAgICAgICAgICAgICAgICAgQVBQLm9iamVjdEF0WzFdICsgQVBQLnJhZGl1cyAqIC1NYXRoLnNpbihBUFAuY2FtZXJhWSksICAgICAgICAgICAgICAgICAgICAgLy8gWVxyXG4gICAgICAgICAgICAgICAgICAgICBBUFAub2JqZWN0QXRbMl0gKyBBUFAucmFkaXVzICogTWF0aC5jb3MoQVBQLmNhbWVyYVkpICogTWF0aC5jb3MoQVBQLmNhbWVyYVgpXTsgICAgIC8vIFpcclxuXHJcblxyXG4gICAgLy9MZWlhbWUgc3V1bmF2ZWt0b3JpLCBrYWFtZXJhc3Qgb2JqZWt0aW5pXHJcbiAgICBBUFAubG9va0RpcmVjdGlvbiA9IFtBUFAub2JqZWN0QXRbMF0gLSBBUFAuY2FtZXJhQXRbMF0sICAgICAgICAgICAgICAgLy8gWFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgQVBQLm9iamVjdEF0WzFdIC0gQVBQLmNhbWVyYUF0WzFdLCAgICAgICAgICAgICAgIC8vIFlcclxuICAgICAgICAgICAgICAgICAgICAgICAgIEFQUC5vYmplY3RBdFsyXSAtIEFQUC5jYW1lcmFBdFsyXV07ICAgICAgICAgICAgICAvLyBaXHJcblxyXG4gICAgLy9MZWlhbWUgcHVua3RpLCBtaWRhIGthYW1lcmEgdmFhdGFiXHJcbiAgICB2ZWMzLmFkZChBUFAubG9va0F0LCBBUFAuY2FtZXJhQXQsIEFQUC5sb29rRGlyZWN0aW9uKTtcclxuXHJcbiAgICBBUFAucmlnaHQgPSBbXHJcbiAgICAgICAgTWF0aC5zaW4oQVBQLmNhbWVyYVggLSAzLjE0IC8gMiksXHJcbiAgICAgICAgMCxcclxuICAgICAgICBNYXRoLmNvcyhBUFAuY2FtZXJhWCAtIDMuMTQgLyAyKVxyXG4gICAgXTtcclxuXHJcbiAgICB2ZWMzLm5vcm1hbGl6ZShBUFAucmlnaHQsIEFQUC5yaWdodCk7XHJcbiAgICB2ZWMzLm5vcm1hbGl6ZShBUFAubG9va0RpcmVjdGlvbiwgQVBQLmxvb2tEaXJlY3Rpb24pO1xyXG4gICAgdmVjMy5jcm9zcyhBUFAudXAsIEFQUC5sb29rRGlyZWN0aW9uLCBBUFAucmlnaHQpO1xyXG5cclxuXHJcbiAgICAvL1V1ZW5kYW1lIGthYW1lcmFtYWF0cmlrc2l0XHJcbiAgICBtYXQ0Lmxvb2tBdChBUFAudmlld01hdHJpeCwgQVBQLmNhbWVyYUF0LCBBUFAubG9va0F0LCBBUFAudXApO1xyXG5cclxuICAgIHZhciB6ID0gdmVjMy5kb3QoQVBQLmxvb2tEaXJlY3Rpb24sIEFQUC51cCk7XHJcbiAgICB2YXIgeCA9IHZlYzMuZG90KEFQUC5yaWdodCwgQVBQLnVwKTtcclxuICAgIHZhciBjID0gdmVjMy5kb3QoQVBQLnJpZ2h0LCBBUFAubG9va0RpcmVjdGlvbik7XHJcblxyXG59XHJcblxyXG4vL1JlbmRlcmRhbWluZVxyXG5mdW5jdGlvbiByZW5kZXIoKSB7XHJcblxyXG4gICAgLy9QcHVoYXN0YW1lIGthIHbDpHJ2aS0gamEgc8O8Z2F2dXNwdWh2cmlkLCBuaW5nIG3DpMOkcmFtZSB1dWUgcHVoYXN0dXbDpHJ2dXNlLlxyXG4gICAgLy9IZXRrZWwgcHVoYXN0YW1pbmUgbWlkYWdpIGVpIHRlZSwgc2VzdCBtZSByZW5kZXJkYW1lIHZhaWQgw7xoZSBrb3JyYSwga3VpZCBrdWkgbWUgdHPDvGtrbGlzIHNlZGEgdGVnZW1hXHJcbiAgICAvL29uIG7DpGhhIGthLCBtaWRhIG5hZCB0ZWV2YWQuXHJcbiAgICBHTC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjAsIDEuMCk7XHJcbiAgICBHTC5jbGVhcihHTC5DT0xPUl9CVUZGRVJfQklUIHwgR0wuREVQVEhfQlVGRkVSX0JJVCk7XHJcblxyXG4gICAgLy9Mw7xsaXRhbWUgc2lzc2Ugc8O8Z2F2dXN0ZXN0aVxyXG4gICAgR0wuZW5hYmxlKEdMLkRFUFRIX1RFU1QpO1xyXG4gICAgR0wuZGVwdGhGdW5jKEdMLkxFU1MpO1xyXG5cclxuICAgIC8vU2VvbWUgdGlwdXB1aHZyaSBqYSBtw6TDpHJhbWUsIGt1cyBhbnR1ZCB0aXB1YXRyaWJ1dXQgYXN1YiBhbnR1ZCBtYXNzaWl2aXMuXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkFSUkFZX0JVRkZFUiwgQVBQLnZlcnRleEJ1ZmZlcik7XHJcbiAgICBHTC52ZXJ0ZXhBdHRyaWJQb2ludGVyKEFQUC5hX1Bvc2l0aW9uLCAzLCBHTC5GTE9BVCwgZmFsc2UsIEFQUC52ZXJ0ZXhTaXplICogNCwgMCk7XHJcbiAgICBHTC52ZXJ0ZXhBdHRyaWJQb2ludGVyKEFQUC5hX1RleHR1cmVDb29yZCwgMiwgR0wuRkxPQVQsIGZhbHNlLCBBUFAudmVydGV4U2l6ZSAqIDQsIEFQUC52ZXJ0ZXhTaXplICogNCAtIDIgKiA0KTtcclxuXHJcbiAgICAvL0FrdGl2ZWVyaW1lIGF0cmlidXVkaWRcclxuICAgIEdMLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KEFQUC5hX1Bvc2l0aW9uKTtcclxuICAgIEdMLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KEFQUC5hX1RleHR1cmVDb29yZCk7XHJcblxyXG4gICAgLy9Ba3RpdmVlcmltZSBqYSBtw6TDpHJhbWUgdGVrc3R1dXJpXHJcbiAgICBHTC5hY3RpdmVUZXh0dXJlKEdMLlRFWFRVUkUwKTtcclxuICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIEFQUC50ZXh0dXJlKTtcclxuICAgIEdMLnVuaWZvcm0xaShBUFAudV9UZXh0dXJlLCAwKTtcclxuXHJcbiAgICAvL1NhYWRhbWUgbWVpZSBtYWF0cmlrc2lkIGthIHZhcmp1bmRhamFzc2VcclxuICAgIEdMLnVuaWZvcm1NYXRyaXg0ZnYoQVBQLnVfTW9kZWxNYXRyaXgsIGZhbHNlLCBBUFAubW9kZWxNYXRyaXgpO1xyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9WaWV3TWF0cml4LCBmYWxzZSwgQVBQLnZpZXdNYXRyaXgpO1xyXG4gICAgR0wudW5pZm9ybU1hdHJpeDRmdihBUFAudV9Qcm9qZWN0aW9uTWF0cml4LCBmYWxzZSwgQVBQLnByb2plY3Rpb25NYXRyaXgpO1xyXG5cclxuICAgIC8vUmVuZGVyZGFtZSBrb2xtbnVyZ2FkIGluZGVrc2l0ZSBqw6RyZ2lcclxuICAgIEdMLmJpbmRCdWZmZXIoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIEFQUC5pbmRleEJ1ZmZlcik7XHJcbiAgICBHTC5kcmF3RWxlbWVudHMoR0wuVFJJQU5HTEVTLCBBUFAuaW5kZXhCdWZmZXIubnVtYmVyT2ZJbmRleGVzLCBHTC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcbn1cclxuXHJcbiIsIkxvb3BlciA9IGZ1bmN0aW9uKGRvbUVsZW1lbnQsIGNhbGxiYWNrKSB7XHJcbiAgICB0aGlzLmRvbUVsZW1lbnQgPSBkb21FbGVtZW50O1xyXG5cclxuICAgIHRoaXMubGFzdFRpbWUgPSAwO1xyXG4gICAgdGhpcy5kZWx0YVRpbWUgPSAwO1xyXG5cclxuICAgIHRoaXMucmVxdWVzdElkO1xyXG5cclxuICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcclxuXHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcbiAgICAgICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XHJcblxyXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZTtcclxufTtcclxuXHJcbkxvb3Blci5wcm90b3R5cGUgPSB7XHJcblxyXG4gICAgY29uc3RydWN0b3I6IExvb3BlcixcclxuXHJcbiAgICBjYWxjdWxhdGVEZWx0YVRpbWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciB0aW1lTm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgICAgIGlmKHRoaXMubGFzdFRpbWUgIT0gMClcclxuICAgICAgICAgICAgdGhpcy5kZWx0YVRpbWUgPSAodGltZU5vdyAtIHRoaXMubGFzdFRpbWUpIC8gMTY7XHJcblxyXG4gICAgICAgIHRoaXMubGFzdFRpbWUgPSB0aW1lTm93O1xyXG4gICAgfSxcclxuXHJcbiAgICBsb29wOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnJlcXVlc3RJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmxvb3AuYmluZCh0aGlzKSwgdGhpcy5kb21FbGVtZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVEZWx0YVRpbWUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLmRlbHRhVGltZSk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb29wZXI7IiwiLyoqXHJcbiAqIEhvaWFiIGVuZGFzIFdlYkdMUHJvZ3JhbSBvYmpla3RpIGphIFdlYkdMU2hhZGVyIHRpcHV2YXJqdW5kYWphdCBqYSBwaWtzbGl2YXJqdW5kYWphdFxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gdmVydGV4U2hhZGVyUGF0aFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRTaGFkZXJQYXRoXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG9uTGlua2VkIE1lZXRvZCwgbWlzIGt1dHN1dGFrc2UgdsOkbGphLCBrdWkgdmFyanVuZGFqYWQgb24gbGFldHVkXHJcbiAqIEBjbGFzc1xyXG4gKi9cclxudmFyIFByb2dyYW1PYmplY3QgPSBmdW5jdGlvbih2ZXJ0ZXhTaGFkZXJQYXRoLCBmcmFnbWVudFNoYWRlclBhdGgsIG9uTGlua2VkKSB7XHJcbiAgICB0aGlzLnByb2dyYW0gPSBHTC5jcmVhdGVQcm9ncmFtKCk7XHJcblxyXG4gICAgdGhpcy5vbkxpbmtlZCA9IG9uTGlua2VkO1xyXG5cclxuICAgIHRoaXMudmVydGV4U2hhZGVyID0ge1xyXG4gICAgICAgIFwic2hhZGVyXCI6IEdMLmNyZWF0ZVNoYWRlcihHTC5WRVJURVhfU0hBREVSKSxcclxuICAgICAgICBcInBhdGhcIjogdmVydGV4U2hhZGVyUGF0aCxcclxuICAgICAgICBcInNyY1wiOiBcIlwiLFxyXG4gICAgICAgIFwiY29tcGxldGVkXCI6IGZhbHNlXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB7XHJcbiAgICAgICAgXCJzaGFkZXJcIjogR0wuY3JlYXRlU2hhZGVyKEdMLkZSQUdNRU5UX1NIQURFUiksXHJcbiAgICAgICAgXCJwYXRoXCI6IGZyYWdtZW50U2hhZGVyUGF0aCxcclxuICAgICAgICBcInNyY1wiOiBcIlwiLFxyXG4gICAgICAgIFwiY29tcGxldGVkXCI6IGZhbHNlXHJcbiAgICB9O1xyXG59O1xyXG5cclxuUHJvZ3JhbU9iamVjdC5wcm90b3R5cGUgPSB7XHJcblxyXG4gICAgY29uc3RydWN0b3I6IFByb2dyYW1PYmplY3QsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsYmFjayBtZWV0b2QsIG1pcyBrb21waWxlZXJpYiBqYSBzw6R0ZXN0YWIgdmFyanVuZGFqYWQsIGt1aSBtw7VsZW1hZCBvbiBhc8O8bmtyb29uc2VsdCBsYWV0dWRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3JjIEzDpGh0ZWtvb2QsIG1pcyBBSkFYJ2kgYWJpbCBsYWV0aVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggVGVlLCBtaWxsZSBhYmlsIHR1dmFzdGFkYSwga3VtbWEgdmFyanVuZGFqYSBsw6RodGVrb29kIG9uIGxhZXR1ZFxyXG4gICAgICovXHJcbiAgICBvbmNvbXBsZXRlOiBmdW5jdGlvbihzcmMsIHBhdGgpIHtcclxuICAgICAgICBpZihwYXRoID09PSB0aGlzLnZlcnRleFNoYWRlci5wYXRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVydGV4U2hhZGVyLmNvbXBsZXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMudmVydGV4U2hhZGVyLnNyYyA9IHNyYztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZihwYXRoID09PSB0aGlzLmZyYWdtZW50U2hhZGVyLnBhdGgpIHtcclxuICAgICAgICAgICAgdGhpcy5mcmFnbWVudFNoYWRlci5jb21wbGV0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmZyYWdtZW50U2hhZGVyLnNyYyA9IHNyYztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHRoaXMudmVydGV4U2hhZGVyLmNvbXBsZXRlZCAmJiB0aGlzLmZyYWdtZW50U2hhZGVyLmNvbXBsZXRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBpbGVTaGFkZXIodGhpcy52ZXJ0ZXhTaGFkZXIuc2hhZGVyLCB0aGlzLnZlcnRleFNoYWRlci5zcmMpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBpbGVTaGFkZXIodGhpcy5mcmFnbWVudFNoYWRlci5zaGFkZXIsIHRoaXMuZnJhZ21lbnRTaGFkZXIuc3JjKTtcclxuXHJcbiAgICAgICAgICAgIEdMLmF0dGFjaFNoYWRlcih0aGlzLnByb2dyYW0sIHRoaXMudmVydGV4U2hhZGVyLnNoYWRlcik7XHJcbiAgICAgICAgICAgIEdMLmF0dGFjaFNoYWRlcih0aGlzLnByb2dyYW0sIHRoaXMuZnJhZ21lbnRTaGFkZXIuc2hhZGVyKTtcclxuXHJcbiAgICAgICAgICAgIEdMLmxpbmtQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XHJcblxyXG4gICAgICAgICAgICBpZighR0wuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLnByb2dyYW0sIEdMLkxJTktfU1RBVFVTKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFcnJvciBsaW5raW5nIHNoYWRlciBwcm9ncmFtOiBcXFwiXCIgKyBHTC5nZXRQcm9ncmFtSW5mb0xvZyh0aGlzLnByb2dyYW0pICsgXCJcXFwiXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZih0eXBlb2YgdGhpcy5vbkxpbmtlZCAhPSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5vbkxpbmtlZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDDnHJpdGFiIGtvbXBpbGVlcmlkYSB2YXJqdW5kYWphXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtXZWJHTFNoYWRlcn0gc2hhZGVyIFZhcmp1bmRhamEgbWlkYSBrb21waWxlZXJpZGFcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2UgTMOkaHRla29vZCwgbWlkYSBrb21waWxlZXJpZGFcclxuICAgICAqL1xyXG4gICAgY29tcGlsZVNoYWRlcjogZnVuY3Rpb24oc2hhZGVyLCBzb3VyY2UpIHtcclxuICAgICAgICBHTC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzb3VyY2UpO1xyXG4gICAgICAgIEdMLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcclxuXHJcbiAgICAgICAgaWYgKCFHTC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBHTC5DT01QSUxFX1NUQVRVUykpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJTaGFkZXIgY29tcGlsYXRpb24gZmFpbGVkLiBFcnJvcjogXFxcIlwiICsgR0wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpICsgXCJcXFwiXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBBbnR1ZCBrbGFzc2kgYWJpbCBvbiB2w7VpbWFsaWsgcHJvZ3JhbW1pIGxhYWRpZGEgamEgYXPDvG5rcm9vbnNlbHQgdGFnYXBpbGRpbCBzcGV0c2lmaXRzZWVyaXR1ZCB2YXJqdW5kYWphZFxyXG4gKiB0YWdhc3RhdHVkIHByb2dyYW1taWdhIHNpZHVkYVxyXG4gKlxyXG4gKiBAY2xhc3MgU2hhZGVyUHJvZ3JhbUxvYWRlclxyXG4gKi9cclxudmFyIFNoYWRlclByb2dyYW1Mb2FkZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuY29udGFpbmVyID0gW107XHJcbiAgICB0aGlzLmNvdW50ZXIgPSAtMTtcclxufTtcclxuXHJcblNoYWRlclByb2dyYW1Mb2FkZXIucHJvdG90eXBlID0ge1xyXG4gICAgY29uc3RydWN0b3I6IFNoYWRlclByb2dyYW1Mb2FkZXIsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUYWdhc3RhYiBwcm9ncmFtbSBvYmpla3RpLiBBc8O8bmtyb29uc2VsdCB0YWdhcGxhYW5pbCBsYWV0YWtzZSBqYSBrb21waWxlZXJpdGFrc2UgdmFyanVuZGFqYWQuIEVubmUga3VpXHJcbiAgICAgKiBwcm9ncmFtbWkga2FzdXRhZGEgdHVsZWIga29udHJvbGxpZGEsIGV0IHZhcmp1bmRhamFkIG9uIGtvbXBpbGVlcml0dWQgamEgcHJvZ3JhbW1pZ2Egc2VvdHVkLiBWw7VpbWFsaWsgb25cclxuICAgICAqIHBhcmFtZWV0cmlrcyBhbmRhIGthIENhbGxiYWNrIGZ1bmt0c2lvb24sIG1pcyB0ZWFkYSBhbm5hYiwga3VpIHZhcmp1bmRhamFkIG9uIHNlb3R1ZC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdmVydGV4U2hhZGVyUGF0aCBUZWUsIHRpcHV2YXJqdW5kYWphIGp1dXJkZVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50U2hhZGVyUGF0aCBUZWUsIHBpa3NsaXZhcmp1bmRhamEganV1cmRlXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsaW5rZWRDYWxsYmFjayBGdW5rdHNpb29uLCBtaXMga3V0c3V0YWtzZSB2w6RsamEsIGt1aSB2YXJqdW5kYWphZCBvbiBrb21waWxlZXJpdHVkIGphIHNlb3R1ZCBwcm9ncmFtbWlnYVxyXG4gICAgICogQHJldHVybnMge2V4cG9ydHMuZGVmYXVsdE9wdGlvbnMucHJvZ3JhbXwqfFdlYkdMUHJvZ3JhbXxQcm9ncmFtT2JqZWN0LnByb2dyYW19XHJcbiAgICAgKi9cclxuICAgIGdldFByb2dyYW06IGZ1bmN0aW9uKHZlcnRleFNoYWRlclBhdGgsIGZyYWdtZW50U2hhZGVyUGF0aCwgbGlua2VkQ2FsbGJhY2spIHtcclxuICAgICAgICB0aGlzLmNvdW50ZXIrKztcclxuICAgICAgICB0aGlzLmNvbnRhaW5lclt0aGlzLmNvdW50ZXJdID0gbmV3IFByb2dyYW1PYmplY3QodmVydGV4U2hhZGVyUGF0aCwgZnJhZ21lbnRTaGFkZXJQYXRoLCBsaW5rZWRDYWxsYmFjayk7XHJcbiAgICAgICAgdmFyIHByb2dyYW0gPSB0aGlzLmNvbnRhaW5lclt0aGlzLmNvdW50ZXJdO1xyXG5cclxuICAgICAgICB0aGlzLmxvYWRBc3luY1NoYWRlclNvdXJjZSh2ZXJ0ZXhTaGFkZXJQYXRoLCBwcm9ncmFtLm9uY29tcGxldGUuYmluZChwcm9ncmFtKSk7XHJcbiAgICAgICAgdGhpcy5sb2FkQXN5bmNTaGFkZXJTb3VyY2UoZnJhZ21lbnRTaGFkZXJQYXRoLCBwcm9ncmFtLm9uY29tcGxldGUuYmluZChwcm9ncmFtKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9ncmFtLnByb2dyYW07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTGFlYiBhc8O8bmtyb29uc2VsdCBsw6RodGVrb29kaVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzaGFkZXJQYXRoIFRlZSwga3VzIGFzdWIgdmFyanVuZGFqYVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgRnVua3RzaW9vbiwgbWlzIGvDpGl2aXRhdGFrc2UsIGt1aSBsw6RodGVrb29kIG9uIGvDpHR0ZSBzYWFkdWQuIFNhYWRldGFrc2UgdmFzdHVzIGphIHRlZS5cclxuICAgICAqL1xyXG4gICAgbG9hZEFzeW5jU2hhZGVyU291cmNlOiBmdW5jdGlvbihzaGFkZXJQYXRoLCBjYWxsYmFjaykge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIGFzeW5jOiB0cnVlLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJ0ZXh0XCIsXHJcbiAgICAgICAgICAgIHVybDogc2hhZGVyUGF0aCxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZXN1bHQsIHNoYWRlclBhdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQcm9ncmFtT2JqZWN0O1xyXG5tb2R1bGUuZXhwb3J0cyA9IFNoYWRlclByb2dyYW1Mb2FkZXI7Il19
