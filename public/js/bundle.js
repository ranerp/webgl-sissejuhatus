(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\prog\\webglstudy\\lessons\\lesson07\\main.js":[function(require,module,exports){
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
//////////////////////////////////////////////////////// LESSON07 - RENDERDAMINE TEKSTUURI /////////////////////////////
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
    APP.cameraAt = vec3.create();            //Asub maailmaruumis nendel koordinaatidel
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
},{}]},{},["C:\\prog\\webglstudy\\lessons\\lesson07\\main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibGVzc29ucy9sZXNzb24wNy9tYWluLmpzIiwibGVzc29ucy91dGlscy9sb29wZXIuanMiLCJsZXNzb25zL3V0aWxzL3NoYWRlcnByb2dyYW1sb2FkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vL0FudHVkIG9zYSB0ZWdlbGViIFdlYkdMIGtvbnRla3N0aSBsb29taXNlZ2EgamEgbWVpbGUgdmFqYWxpa3UgV2ViR0xQcm9ncmFtIG9iamVrdGkgbG9vbWlzZWdhIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbnZhciBTaGFkZXJQcm9ncmFtTG9hZGVyID0gcmVxdWlyZShcIi4vLi4vdXRpbHMvc2hhZGVycHJvZ3JhbWxvYWRlclwiKTtcclxudmFyIExvb3BlciA9IHJlcXVpcmUoXCIuLy4uL3V0aWxzL2xvb3BlclwiKTtcclxuXHJcbi8vVmFyanVuZGFqYXRlIGthdGFsb29nXHJcbnZhciBTSEFERVJfUEFUSCA9IFwic2hhZGVycy9sZXNzb24wNS9cIjtcclxuXHJcbi8vVGVrc3R1dXJpIGFzdWtvaHRcclxudmFyIFRFWFRVUkVfUEFUSCA9IFwiYXNzZXRzL3RleHR1cmUuanBnXCI7XHJcblxyXG4vL0VsZW1lbnQsIGt1aHUgcmVuZGVyZGFtZVxyXG52YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIik7XHJcblxyXG4vL0xvb21lIGdsb2JhYWxzZSBXZWJHTCBrb250ZWtzdGlcclxuR0wgPSBpbml0V2ViR0woY2FudmFzKTtcclxuXHJcbi8vU2VhZGlzdGFtZSByZW5kZXJkYW1pc3Jlc29sdXRzaW9vbmlcclxuR0wudmlld3BvcnQoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuR0wudmlld3BvcnRXaWR0aCA9IGNhbnZhcy53aWR0aDtcclxuR0wudmlld3BvcnRIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xyXG5cclxuLy9Mb29tZSB1dWUgcHJvZ3JhbW1pIHNwZXRzaWZpdHNlZXJpdHVkIHZhcmp1bmRhamF0ZWdhLiBLdW5hIGxhYWRpbWluZSBvbiBhc8O8bmtyb29ubmUsIHNpaXMgYW5uYW1lIGthYXNhIGthXHJcbi8vbWVldG9kaSwgbWlzIGt1dHN1dGFrc2UgdsOkbGphIGt1aSB2YXJqdW5kYWphZCBvbiBsYWV0dWRcclxudmFyIHNoYWRlclByb2dyYW1Mb2FkZXIgPSBuZXcgU2hhZGVyUHJvZ3JhbUxvYWRlcigpO1xyXG52YXIgc2hhZGVyUHJvZ3JhbSA9IHNoYWRlclByb2dyYW1Mb2FkZXIuZ2V0UHJvZ3JhbShTSEFERVJfUEFUSCArIFwidmVydGV4LnNoYWRlclwiLCBTSEFERVJfUEFUSCArIFwiZnJhZ21lbnQuc2hhZGVyXCIsIHNoYWRlcnNMb2FkZWQpO1xyXG5cclxuXHJcbi8vw5xyaXRhbWUgbHV1YSBXZWJHTCBrb250ZWtzdGlcclxuZnVuY3Rpb24gaW5pdFdlYkdMKGNhbnZhcykge1xyXG4gICAgdmFyIGdsID0gbnVsbDtcclxuXHJcbiAgICB0cnkge1xyXG5cclxuICAgICAgICAvL8Occml0YW1lIGx1dWEgdGF2YWxpc3Qga29udGVrc3RpLCBrdWkgc2VlIGViYcO1bm5lc3R1YiDDvHJpdGFtZSBsdXVhIGVrc3BlcmltZW50YWFsc2V0LFxyXG4gICAgICAgIC8vTWlkYSBrYXN1dGF0YWtzZSBzcGV0c2lmaWthdHNpb29uaSBhcmVuZGFtaXNla3NcclxuICAgICAgICBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIikgfHwgY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIik7XHJcblxyXG4gICAgfSBjYXRjaCAoZSkge31cclxuXHJcbiAgICBpZighZ2wpIHtcclxuICAgICAgICBhbGVydChcIlVuYWJsZSB0byBpbml0aWxpemUgV2ViR0wuIFlvdXIgYnJvd3NlciBtYXkgbm90IHN1cHBvcnQgaXQuXCIpO1xyXG4gICAgICAgIHRocm93IEVycm9yKFwiRXhlY3V0aW9uIHRlcm1pbmF0ZWQuIE5vIFdlYkdMIGNvbnRleHRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGdsO1xyXG59XHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gTEVTU09OMDcgLSBSRU5ERVJEQU1JTkUgVEVLU1RVVVJJIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG52YXIgQVBQID0ge307XHJcblxyXG5BUFAubG9vcGVyID0gbmV3IExvb3BlcihjYW52YXMsIGxvb3ApO1xyXG5cclxuQVBQLmlzTW91c2VEb3duID0gZmFsc2U7XHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgbW91c2VDbGlja0hhbmRsZXIsIGZhbHNlKTtcclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgbW91c2VDbGlja0hhbmRsZXIsIGZhbHNlKTtcclxuXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXdoZWVsXCIsIG1vdXNlU2Nyb2xsSGFuZGxlciwgZmFsc2UpO1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NTW91c2VTY3JvbGxcIiwgbW91c2VTY3JvbGxIYW5kbGVyLCBmYWxzZSk7XHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJvbm1vdXNld2hlZWxcIiwgbW91c2VTY3JvbGxIYW5kbGVyLCBmYWxzZSk7XHJcblxyXG4vL0tPTlNUQU5ESUQgS0FBTUVSQSBKQU9LU1xyXG5cclxuLy8zNjAga3JhYWRpXHJcbkFQUC5UV09QSSA9IDIuMCAqIE1hdGguUEk7XHJcblxyXG4vLzkwIGtyYWFkaVxyXG5BUFAuUElPVkVSVFdPID0gTWF0aC5QSSAvIDIuMDtcclxuXHJcbi8vTWFrc2ltYWFsbmUgdmVydGlrYWFsbnVya1xyXG5BUFAuTUFYX1ZFUlRJQ0FMID0gQVBQLlBJT1ZFUlRXTyAtIEFQUC5QSU9WRVJUV08gLyA4O1xyXG5cclxuLy9SYWFkaXVzLCBtaWxsZXN0IGzDpGhlbWFsZSBrYWFtZXJhIG1pbm5hIGVpIHNhYVxyXG5BUFAuTUlOX1JBRElVUyA9IDE7XHJcblxyXG4vL1N1dW1pbWlza29uc3RhbnRcclxuQVBQLlpPT01fVkFMVUUgPSAwLjU7XHJcblxyXG4vL0t1dHN1dGFrc2Uga3VpIHZhcmp1bmRhamFkIG9uIGxhZXR1ZFxyXG5mdW5jdGlvbiBzaGFkZXJzTG9hZGVkKCkge1xyXG4gICAgc2V0dXBBbmRMb2FkVGV4dHVyZSgpO1xyXG4gICAgc2V0dXAoKTtcclxuXHJcbiAgICBBUFAubG9vcGVyLmxvb3AoKTtcclxufVxyXG5cclxuLy9UZWtzdHV1cmkgaW5pdHNpYWxpc2VlcmltaW5lIGphIGxhYWRpbWluZVxyXG5mdW5jdGlvbiBzZXR1cEFuZExvYWRUZXh0dXJlKCkge1xyXG5cclxuICAgIC8vTG9vbWUgdXVlIHRla3N0dXVyaSBqYSBrb29zIHNlbGxlZ2EgMXgxIHBpa3NsaXNlIHBpbGRpLCBtaXMga3V2YXRha3NlIHNlbmlrYXVhLCBrdW5pIHRla3N0dXVyIHNhYWIgbGFldHVkXHJcbiAgICBBUFAudGV4dHVyZSA9IEdMLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIEdMLmJpbmRUZXh0dXJlKEdMLlRFWFRVUkVfMkQsIEFQUC50ZXh0dXJlKTtcclxuICAgIEdMLnRleEltYWdlMkQoR0wuVEVYVFVSRV8yRCwgMCwgR0wuUkdCQSwgMSwgMSwgMCwgR0wuUkdCQSwgIEdMLlVOU0lHTkVEX0JZVEUsIG5ldyBVaW50OEFycmF5KFsxLCAxLCAxLCAxXSkpO1xyXG4gICAgR0wudGV4UGFyYW1ldGVyZihHTC5URVhUVVJFXzJELCBHTC5URVhUVVJFX1dSQVBfUywgR0wuUkVQRUFUKTtcclxuICAgIEdMLnRleFBhcmFtZXRlcmYoR0wuVEVYVFVSRV8yRCwgR0wuVEVYVFVSRV9XUkFQX1QsIEdMLlJFUEVBVCk7XHJcbiAgICBHTC50ZXhQYXJhbWV0ZXJpKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgR0wuTkVBUkVTVCk7XHJcbiAgICBHTC50ZXhQYXJhbWV0ZXJpKEdMLlRFWFRVUkVfMkQsIEdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgR0wuTkVBUkVTVCk7XHJcblxyXG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XHJcblxyXG4gICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgQVBQLnRleHR1cmUpO1xyXG4gICAgICAgIEdMLnRleEltYWdlMkQoR0wuVEVYVFVSRV8yRCwgMCwgR0wuUkdCLCBHTC5SR0IsICBHTC5VTlNJR05FRF9CWVRFLCBpbWFnZSk7XHJcbiAgICAgICAgR0wuYmluZFRleHR1cmUoR0wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICB9O1xyXG4gICAgaW1hZ2Uuc3JjID0gVEVYVFVSRV9QQVRIO1xyXG5cclxufVxyXG5cclxuLy9Mb29iIHB1aHZyaWQgamEgbWFhdHJpa3NpZC4gVMOkaWRhYiBwdWh2cmlkIGFuZG1ldGVnYS5cclxuZnVuY3Rpb24gc2V0dXAoKSB7XHJcbiAgICAvL1RlZW1lIG11dXR1amEsIGt1aHUgc2FsdmVzdGFkYSBhZWdhLCBldCBrYWFtZXJhdCBhamEgbcO2w7ZkdWRlcyDDvG1iZXIgb2JqZWt0aSBww7bDtnJhdGFcclxuICAgIEFQUC50aW1lID0gMDtcclxuXHJcbiAgICBBUFAuY2FtZXJhWCA9IDA7XHJcbiAgICBBUFAuY2FtZXJhWSA9IDA7XHJcbiAgICBBUFAucmFkaXVzID0gNTtcclxuXHJcbiAgICAvL011ZGVsbWFhdHJpa3MsIG1pbGxlZ2Egb2JqZWt0aXJ1dW1pc3QgbWFhaWxtYXJ1dW1pIHNhYWRhXHJcbiAgICBBUFAubW9kZWxNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vUHVua3QsIGt1cyBvYmpla3QgaGV0a2VsIGFzdWJcclxuICAgIEFQUC5vYmplY3RBdCA9IFswLjAsIDAuMCwgLTUuMF07XHJcblxyXG4gICAgLy9LYXN1dGFkZXMgdHJhbnNsYXRzaW9vbmksIHNhYW1lIG11ZGVsbWFhdHJpa3NpZ2Egb2JqZWt0aSBsaWlndXRhZGFcclxuICAgIG1hdDQudHJhbnNsYXRlKEFQUC5tb2RlbE1hdHJpeCwgQVBQLm1vZGVsTWF0cml4LCBBUFAub2JqZWN0QXQpO1xyXG5cclxuICAgIC8vS2FhbWVyYW1hYXRyaWtzLCBtaWxsZWdhIG1hYWlsbWFydXVtaXN0IGthYW1lcmFydXVtaSBzYWFkYVxyXG4gICAgQVBQLnZpZXdNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vRGVmaW5lZXJpbWUgdmVrdG9yaWQsIG1pbGxlIGFiaWwgb24gdsO1aW1hbGlrIGthYW1lcmFydXVtaSBiYWFzdmVrdG9yaWQgYXJ2dXRhZGFcclxuICAgIEFQUC5jYW1lcmFBdCA9IHZlYzMuY3JlYXRlKCk7ICAgICAgICAgICAgLy9Bc3ViIG1hYWlsbWFydXVtaXMgbmVuZGVsIGtvb3JkaW5hYXRpZGVsXHJcbiAgICBBUFAubG9va0F0ID0gdmVjMy5jcmVhdGUoKTsgICAgICAgICAgICAgLy9NaXMgc3V1bmFzIGthYW1lcmEgdmFhdGFiLiBQYXJlbWFrw6RlIGtvb3JkaW5hYXRzw7xzdGVlbWlzIG9uIC16IGVrcmFhbmkgc2lzc2VcclxuICAgIEFQUC51cCA9IHZlYzMuY3JlYXRlKCk7ICAgICAgICAgICAgICAgICAgLy9WZWt0b3IsIG1pcyBuw6RpdGFiLCBrdXMgb24ga2FhbWVyYSDDvGxlc3NlIHN1dW5kYSBuw6RpdGF2IHZla3RvclxyXG4gICAgdXBkYXRlQ2FtZXJhKCk7XHJcblxyXG4gICAgLy9Qcm9qZWt0c2lvb25pbWFhdHJpa3MsIGV0IHDDvGdhbWlzcnV1bWkgc2FhZGEuIEthc3V0YWRlcyBnbE1hdHJpeCB0ZWVraSBnZW5lcmVlcmltZSBrYSBww7xyYW1paWRpLCBrdWh1IHNpc3NlIG9iamVrdGlkIGzDpGhldmFkLlxyXG4gICAgQVBQLnByb2plY3Rpb25NYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG4gICAgbWF0NC5wZXJzcGVjdGl2ZShBUFAucHJvamVjdGlvbk1hdHJpeCwgNDUuMCwgR0wudmlld3BvcnRXaWR0aCAvIEdMLnZpZXdwb3J0SGVpZ2h0LCAxLjAsIDEwMDAuMCk7XHJcblxyXG4gICAgLy9UaXBwdWRlIGFuZG1lZC4gVGlwdSBrb29yZGluYWFkaWQgeCwgeSwgeiBqYSB0ZWtzdHV1cmkga29vcmRpbmFhZGlkIHUsIHZcclxuICAgIEFQUC5teVZlcnRpY2VzRGF0YSA9IFtcclxuICAgICAgICAvL0VzaW1lbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAgMS4wLCAgMC4wLCAxLjAsICAgICAgICAgICAgLy9BTFVNSU5FIFZBU0FLIE5VUktcclxuICAgICAgICAgMS4wLCAtMS4wLCAgMS4wLCAgMS4wLCAxLjAsICAgICAgICAgICAgLy9BTFVNSU5FIFBBUkVNIE5VUktcclxuICAgICAgICAgMS4wLCAgMS4wLCAgMS4wLCAgMS4wLCAwLjAsICAgICAgICAgICAgLy/DnExFTUlORSBQQVJFTSBOVVJLXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgIDEuMCwgIDAuMCwgMC4wLCAgICAgICAgICAgIC8vw5xMRU1JTkUgVkFTQUsgTlVSS1xyXG5cclxuICAgICAgICAvL1RhZ3VtaW5lIGvDvGxnXHJcbiAgICAgICAgLTEuMCwgLTEuMCwgLTEuMCwgIDAuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsICAxLjAsIC0xLjAsICAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsICAxLjAsIC0xLjAsICAgMS4wLCAwLjAsXHJcbiAgICAgICAgMS4wLCAtMS4wLCAtMS4wLCAgIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL8OcbGVtaW5lIGvDvGxnXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgLTEuMCwgIDAuMCwgMS4wLFxyXG4gICAgICAgIC0xLjAsICAxLjAsICAxLjAsICAxLjAsIDEuMCxcclxuICAgICAgICAxLjAsICAxLjAsICAxLjAsICAgIDEuMCwgMC4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgLTEuMCwgIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL0FsdW1pbmUga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsIC0xLjAsIC0xLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgLTEuMCwgIDEuMCwgIDEuMCwgMC4wLFxyXG4gICAgICAgIC0xLjAsIC0xLjAsICAxLjAsIDAuMCwgMC4wLFxyXG5cclxuICAgICAgICAvL1BhcmVtIGvDvGxnXHJcbiAgICAgICAgMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsICAxLjAsIC0xLjAsIDEuMCwgMS4wLFxyXG4gICAgICAgIDEuMCwgIDEuMCwgIDEuMCwgIDEuMCwgMC4wLFxyXG4gICAgICAgIDEuMCwgLTEuMCwgIDEuMCwgMC4wLCAwLjAsXHJcblxyXG4gICAgICAgIC8vVmFzYWsga8O8bGdcclxuICAgICAgICAtMS4wLCAtMS4wLCAtMS4wLCAwLjAsIDEuMCxcclxuICAgICAgICAtMS4wLCAtMS4wLCAgMS4wLCAxLjAsIDEuMCxcclxuICAgICAgICAtMS4wLCAgMS4wLCAgMS4wLCAgMS4wLCAwLjAsXHJcbiAgICAgICAgLTEuMCwgIDEuMCwgLTEuMCwgMC4wLCAwLjAsXHJcbiAgICBdO1xyXG4gICAgQVBQLnZlcnRleFNpemUgPSA1O1xyXG5cclxuICAgIC8vTG9vbWUgcHVodnJpLCBrdWh1IHRpcHVhbmRtZWQgdmlpYS4gU2VvbWUga2EgYW50dWQgcHVodnJpIGtvbnRla3N0aWdhLCBldCB0ZW1hbGUga8Okc2tlIGVkYXNpIGFuZGFcclxuICAgIEFQUC52ZXJ0ZXhCdWZmZXIgPSBHTC5jcmVhdGVCdWZmZXIoKTtcclxuXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkFSUkFZX0JVRkZFUiwgQVBQLnZlcnRleEJ1ZmZlcik7XHJcblxyXG4gICAgLy9Bbm5hbWUgbG9vZHVkIHB1aHZyaWxlIGFuZG1lZFxyXG4gICAgR0wuYnVmZmVyRGF0YShHTC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoQVBQLm15VmVydGljZXNEYXRhKSwgR0wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgIC8vVGlwcHVkZSBpbmRla3NpZFxyXG4gICAgQVBQLm15SW5kaWNlc0RhdGEgPSBbXHJcbiAgICAgICAgMCwgMSwgMiwgICAgICAwLCAyLCAzLCAgICAvLyBFc2ltZW5lIGvDvGxnXHJcbiAgICAgICAgNCwgNSwgNiwgICAgICA0LCA2LCA3LCAgICAvLyBUYWd1bWluZSBrw7xsZ1xyXG4gICAgICAgIDgsIDksIDEwLCAgICAgOCwgMTAsIDExLCAgLy8gw5xsZW1pbmUga8O8bGdcclxuICAgICAgICAxMiwgMTMsIDE0LCAgIDEyLCAxNCwgMTUsIC8vIEFsdW1pbmUga8O8bGdcclxuICAgICAgICAxNiwgMTcsIDE4LCAgIDE2LCAxOCwgMTksIC8vIFBhcmVtIGvDvGxnXHJcbiAgICAgICAgMjAsIDIxLCAyMiwgICAyMCwgMjIsIDIzICAvLyBWYXNhayBrw7xsZ1xyXG4gICAgXTtcclxuXHJcbiAgICAvL0xvb21lIHB1aHZyaSwga3VodSBpbmRla3NpZCB2aWlhLiBTZW9tZSBrYSBhbnR1ZCBwdWh2cmkga29udGVrc3RpZ2EsIGV0IHRlbWFsZSBrw6Rza2UgZWRhc2kgYW5kYVxyXG4gICAgQVBQLmluZGV4QnVmZmVyID0gR0wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBBUFAuaW5kZXhCdWZmZXIubnVtYmVyT2ZJbmRleGVzID0gMzY7XHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBBUFAuaW5kZXhCdWZmZXIpO1xyXG5cclxuICAgIC8vQW5uYW1lIGxvb2R1ZCBwdWh2cmlsZSBhbmRtZWRcclxuICAgIEdMLmJ1ZmZlckRhdGEoR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG5ldyBVaW50MTZBcnJheShBUFAubXlJbmRpY2VzRGF0YSksIEdMLlNUQVRJQ19EUkFXKTtcclxuXHJcbiAgICAvL03DpMOkcmFtZSBwcm9ncmFtbWksIG1pZGEgbWUgcmVuZGVyZGFtaXNlbCBrYXN1dGFkYSB0YWhhbWVcclxuICAgIEdMLnVzZVByb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XHJcblxyXG4gICAgLy9TYWFtZSBpbmRla3NpLCBtaXMgbsOkaXRhYiBrdXMgYXN1YiBtZWllIHByb2dyYW1taXMga2FzdXRhdGF2YXMgdGlwdXZhcmp1bmRhamFzXHJcbiAgICAvL29sZXYgdGlwdWF0cmlidXV0IG5pbWVnYSBhX1ZlcnRleFBvc2l0aW9uXHJcbiAgICBBUFAuYV9Qb3NpdGlvbiA9IEdMLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYV9Qb3NpdGlvblwiKTtcclxuXHJcbiAgICAvL1NhYW1lIHbDpHJ2aWF0cmlidXVkaSBhc3Vrb2hhXHJcbiAgICBBUFAuYV9UZXh0dXJlQ29vcmQgPSBHTC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcImFfVGV4dHVyZUNvb3JkXCIpO1xyXG5cclxuICAgIC8vU2FhbWUgw7xodHNldGUgbXV1dHVqYXRlIGFzdWtvaGFkXHJcbiAgICBBUFAudV9Nb2RlbE1hdHJpeCA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfTW9kZWxNYXRyaXhcIik7XHJcbiAgICBBUFAudV9WaWV3TWF0cml4ID0gR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidV9WaWV3TWF0cml4XCIpO1xyXG4gICAgQVBQLnVfUHJvamVjdGlvbk1hdHJpeCA9IEdMLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVfUHJvamVjdGlvbk1hdHJpeFwiKTtcclxuICAgIEFQUC51X1RleHR1cmUgPSBHTC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1X1RleHR1cmVcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdXNlQ2xpY2tIYW5kbGVyKCkge1xyXG4gICAgQVBQLmlzTW91c2VEb3duID0gIUFQUC5pc01vdXNlRG93bjtcclxuXHJcbiAgICBpZihBUFAuaXNNb3VzZURvd24pXHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBtb3VzZU1vdmUsIGZhbHNlKTtcclxuICAgIGVsc2VcclxuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG1vdXNlTW92ZSwgZmFsc2UpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb3VzZVNjcm9sbEhhbmRsZXIoZSkge1xyXG4gICAgdmFyIGRlbHRhID0gMDtcclxuXHJcbiAgICBpZighZSlcclxuICAgICAgICBlID0gd2luZG93LmV2ZW50O1xyXG5cclxuICAgIGlmKGUud2hlZWxEZWx0YSkgICAgICAgICAgICAgICAgICAgIC8qKiBJbnRlcm5ldCBFeHBsb3Jlci9PcGVyYS9Hb29nbGUgQ2hyb21lICoqL1xyXG4gICAgICAgIGRlbHRhID0gZS53aGVlbERlbHRhIC8gMTIwO1xyXG5cclxuICAgIGVsc2UgaWYoZS5kZXRhaWwpICAgICAgICAgICAgICAgICAgIC8qKiBNb3ppbGxhIEZpcmVmb3ggKiovXHJcbiAgICAgICAgZGVsdGEgPSAtZS5kZXRhaWwvMztcclxuXHJcbiAgICBpZihkZWx0YSkge1xyXG4gICAgICAgIGlmKGRlbHRhID4gMCAmJiBBUFAucmFkaXVzID4gQVBQLk1JTl9SQURJVVMpXHJcbiAgICAgICAgICAgIEFQUC5yYWRpdXMgLT0gQVBQLlpPT01fVkFMVUU7XHJcbiAgICAgICAgZWxzZSBpZihkZWx0YSA8IDApXHJcbiAgICAgICAgICAgIEFQUC5yYWRpdXMgKz0gQVBQLlpPT01fVkFMVUU7XHJcbiAgICB9XHJcblxyXG4gICAgICAgIGlmKGUucHJldmVudERlZmF1bHQpXHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XHJcblxyXG4gICAgdG9DYW5vbmljYWwoKTtcclxuICAgIHVwZGF0ZUNhbWVyYSgpO1xyXG59XHJcblxyXG4vL0hpaXJlIGFsbGhvaWRtaXNlbCBqYSBsaWlndXRhbWlzZWwga8OkaXZpdHViIGFudHVkIGZ1bmt0c2lvb25cclxuZnVuY3Rpb24gbW91c2VNb3ZlKGUpIHtcclxuICAgIHZhciB4ID0gZS53ZWJraXRNb3ZlbWVudFggfHwgZS5tb3pNb3ZlbWVudFg7XHJcbiAgICB2YXIgeSA9IGUud2Via2l0TW92ZW1lbnRZIHx8IGUubW96TW92ZW1lbnRZO1xyXG5cclxuICAgIGlmKHR5cGVvZiB4ID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgIHggPSAwO1xyXG4gICAgaWYodHlwZW9mIHkgPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgeSA9IDA7XHJcblxyXG5cclxuICAgIEFQUC5jYW1lcmFYICs9IHggLyA1MDA7XHJcbiAgICBBUFAuY2FtZXJhWSArPSB5IC8gNTAwO1xyXG5cclxuICAgIHJlc3RyaWN0Q2FtZXJhWSgpO1xyXG4gICAgdG9DYW5vbmljYWwoKTtcclxuXHJcbiAgICB1cGRhdGVDYW1lcmEoKTtcclxufVxyXG5cclxuLy9GdW5rdHNpb29uLCBldCB2aWlhIGhvcmlzb250YWFsbmUgamEgdmVydGlrYWFsbmUgbnVyayBrYW5vb25pbGlzc2Ugdm9ybWlcclxuLy9JbXBsZW1lbnRlZXJpdHVkIDNEIE1hdGggUHJpbWVyIGZvciBHcmFwaGljcyBhbmQgR2FtZSBEZXZlbG9wbWVudCBqdWhlbmRpIGrDpHJnaVxyXG5mdW5jdGlvbiB0b0Nhbm9uaWNhbCgpIHtcclxuICAgIGNvbnNvbGUubG9nKFwieDogXCIgKyBBUFAuY2FtZXJhWCk7XHJcbiAgICBjb25zb2xlLmxvZyhcInk6IFwiICsgQVBQLmNhbWVyYVkpO1xyXG5cclxuICAgIC8vS3VpIG9sZW1lIDAga29vcmRpbmFhdGlkZWxcclxuICAgIGlmKEFQUC5yYWRpdXMgPT0gMC4wKSB7XHJcbiAgICAgICAgQVBQLmNhbWVyYVggPSBBUFAuY2FtZXJhWSA9IDAuMDtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvL0t1aSByYWFkaXVzIG9uIG5lZ2F0aWl2bmUuXHJcbiAgICAgICAgaWYoQVBQLnJhZGl1cyA8IDAuMCkge1xyXG4gICAgICAgICAgICBBUFAucmFkaXVzID0gLUFQUC5yYWRpdXM7XHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFYICs9IE1hdGguUEk7XHJcbiAgICAgICAgICAgIEFQUC5jYW1lcmFZID0gLUFQUC5jYW1lcmFZO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9WZXJ0aWthYWxuZSBudXJrIMO8bGVtaXNlc3QgcGlpcmlzdCB2w6RsamFcclxuICAgICAgICBpZihNYXRoLmFicyhBUFAuY2FtZXJhWSkgPiBBUFAuUElPVkVSVFdPKSB7XHJcblxyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWSArPSBBUFAuUElPVkVSVFdPO1xyXG5cclxuICAgICAgICAgICAgQVBQLmNhbWVyYVkgLT0gTWF0aC5mbG9vcihBUFAuY2FtZXJhWSAvIEFQUC5UV09QSSkgKiBBUFAuVFdPUEk7XHJcblxyXG4gICAgICAgICAgICBpZihBUFAuY2FtZXJhWSA+IE1hdGguUEkpIHtcclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFYICs9IE1hdGguUEk7XHJcblxyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVkgPSAzLjAgKiBNYXRoLlBJLzIuMCAtIEFQUC5jYW1lcmFZO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgQVBQLmNhbWVyYVkgLT0gQVBQLlBJT1ZFUlRXTztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9HSU1CQUwgTE9DS1xyXG4gICAgICAgIGlmKE1hdGguYWJzKEFQUC5jYW1lcmFZKSA+PSBBUFAuUElPVkVSVFdPICogMC45OTk5KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR0lNQkFMTE9DS1wiKTtcclxuICAgICAgICAgICAgQVBQLmNhbWVyYVggPSAwLjA7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmKE1hdGguYWJzKEFQUC5jYW1lcmFYKSA+IE1hdGguUEkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBBUFAuY2FtZXJhWCArPSBNYXRoLlBJO1xyXG5cclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFYIC09IE1hdGguZmxvb3IoQVBQLmNhbWVyYVggLyBBUFAuVFdPUEkpICogQVBQLlRXT1BJO1xyXG5cclxuICAgICAgICAgICAgICAgIEFQUC5jYW1lcmFYIC09IE1hdGguUEk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiByZXN0cmljdENhbWVyYVkoKSB7XHJcbiAgICBpZihNYXRoLmFicyhBUFAuY2FtZXJhWSkgPiBBUFAuTUFYX1ZFUlRJQ0FMKSB7XHJcbiAgICAgICAgaWYoQVBQLmNhbWVyYVkgPCAwKVxyXG4gICAgICAgICAgICBBUFAuY2FtZXJhWSA9IC1BUFAuTUFYX1ZFUlRJQ0FMO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgQVBQLmNhbWVyYVkgPSBBUFAuTUFYX1ZFUlRJQ0FMO1xyXG4gICAgfVxyXG59XHJcblxyXG4vL0t1dHN1dGFrc2UgdsOkbGphIExvb3BlciBvYmpla3RpcyBpZ2Ega2FhZGVyXHJcbmZ1bmN0aW9uIGxvb3AoZGVsdGFUaW1lKSB7XHJcbiAgICB1cGRhdGUoZGVsdGFUaW1lKTtcclxuXHJcbiAgICByZW5kZXIoKTtcclxufVxyXG5cclxuLy9VdWVuZGFiIGFuZG1laWQsIGV0IG9sZWtzIHbDtWltYWxpayBzdHNlZW4gbGlpa3VtYSBwYW5uYVxyXG5mdW5jdGlvbiB1cGRhdGUoZGVsdGFUaW1lKSB7XHJcbiAgICBBUFAudGltZSArPSBkZWx0YVRpbWUgLyAxMDA7XHJcblxyXG4gICAvL3VwZGF0ZU9iamVjdCgpO1xyXG59XHJcblxyXG4vL1V1ZW5kYWIga2FhbWVyYXQsIGV0IHNlZGEgb2xla3MgdsO1aW1hbGlrIMO8bWJlciBvYmpla3RpIHDDtsO2cmF0YVxyXG5mdW5jdGlvbiB1cGRhdGVDYW1lcmEoKSB7XHJcblxyXG4gICAgLy9MZWlhbWUgdXVlIHBvc2l0c2lvb25pLCBtaXMgYWphcyBsaWlndWIgcG9sYWFyc2VzIGtvb3JkaW5hYXRzw7xzdGVlbWlzIGphIG1pbGxlIHRlaXNlbmRhbWUgcmlzdGtvb3JkaW5hYXRzw7xzdGVlbWlcclxuICAgIEFQUC5jYW1lcmFBdCA9IFtBUFAub2JqZWN0QXRbMF0gKyBBUFAucmFkaXVzICogTWF0aC5jb3MoQVBQLmNhbWVyYVkpICogTWF0aC5zaW4oQVBQLmNhbWVyYVgpLCAgICAgICAvLyBYXHJcbiAgICAgICAgICAgICAgICAgICAgIEFQUC5vYmplY3RBdFsxXSArIEFQUC5yYWRpdXMgKiAtTWF0aC5zaW4oQVBQLmNhbWVyYVkpLCAgICAgICAgICAgICAgICAgICAgIC8vIFlcclxuICAgICAgICAgICAgICAgICAgICAgQVBQLm9iamVjdEF0WzJdICsgQVBQLnJhZGl1cyAqIE1hdGguY29zKEFQUC5jYW1lcmFZKSAqIE1hdGguY29zKEFQUC5jYW1lcmFYKV07ICAgICAvLyBaXHJcblxyXG5cclxuICAgIC8vTGVpYW1lIHN1dW5hdmVrdG9yaSwga2FhbWVyYXN0IG9iamVrdGluaVxyXG4gICAgQVBQLmxvb2tEaXJlY3Rpb24gPSBbQVBQLm9iamVjdEF0WzBdIC0gQVBQLmNhbWVyYUF0WzBdLCAgICAgICAgICAgICAgIC8vIFhcclxuICAgICAgICAgICAgICAgICAgICAgICAgIEFQUC5vYmplY3RBdFsxXSAtIEFQUC5jYW1lcmFBdFsxXSwgICAgICAgICAgICAgICAvLyBZXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBBUFAub2JqZWN0QXRbMl0gLSBBUFAuY2FtZXJhQXRbMl1dOyAgICAgICAgICAgICAgLy8gWlxyXG5cclxuICAgIC8vTGVpYW1lIHB1bmt0aSwgbWlkYSBrYWFtZXJhIHZhYXRhYlxyXG4gICAgdmVjMy5hZGQoQVBQLmxvb2tBdCwgQVBQLmNhbWVyYUF0LCBBUFAubG9va0RpcmVjdGlvbik7XHJcblxyXG4gICAgQVBQLnJpZ2h0ID0gW1xyXG4gICAgICAgIE1hdGguc2luKEFQUC5jYW1lcmFYIC0gTWF0aC5QSSAvIDIpLFxyXG4gICAgICAgIDAsXHJcbiAgICAgICAgTWF0aC5jb3MoQVBQLmNhbWVyYVggLSBNYXRoLlBJIC8gMilcclxuICAgIF07XHJcblxyXG4gICAgdmVjMy5jcm9zcyhBUFAudXAsIEFQUC5yaWdodCwgQVBQLmxvb2tEaXJlY3Rpb24pO1xyXG5cclxuICAgIC8vVXVlbmRhbWUga2FhbWVyYW1hYXRyaWtzaXRcclxuICAgIG1hdDQubG9va0F0KEFQUC52aWV3TWF0cml4LCBBUFAuY2FtZXJhQXQsIEFQUC5sb29rQXQsIEFQUC51cCk7XHJcblxyXG5cclxufVxyXG5cclxuLy91dWVuZGFtZSBvYmpla3RpXHJcbmZ1bmN0aW9uIHVwZGF0ZU9iamVjdCgpIHtcclxuICAgIG1hdDQucm90YXRlWChBUFAubW9kZWxNYXRyaXgsIEFQUC5tb2RlbE1hdHJpeCwgMC4wMDUpO1xyXG59XHJcblxyXG5cclxuLy9SZW5kZXJkYW1pbmVcclxuZnVuY3Rpb24gcmVuZGVyKCkge1xyXG5cclxuICAgIC8vUHB1aGFzdGFtZSBrYSB2w6RydmktIGphIHPDvGdhdnVzcHVodnJpZCwgbmluZyBtw6TDpHJhbWUgdXVlIHB1aGFzdHV2w6RydnVzZS5cclxuICAgIC8vSGV0a2VsIHB1aGFzdGFtaW5lIG1pZGFnaSBlaSB0ZWUsIHNlc3QgbWUgcmVuZGVyZGFtZSB2YWlkIMO8aGUga29ycmEsIGt1aWQga3VpIG1lIHRzw7xra2xpcyBzZWRhIHRlZ2VtYVxyXG4gICAgLy9vbiBuw6RoYSBrYSwgbWlkYSBuYWQgdGVldmFkLlxyXG4gICAgR0wuY2xlYXJDb2xvcigwLjAsIDAuMCwgMC4wLCAxLjApO1xyXG4gICAgR0wuY2xlYXIoR0wuQ09MT1JfQlVGRkVSX0JJVCB8IEdMLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgIC8vTMO8bGl0YW1lIHNpc3NlIHPDvGdhdnVzdGVzdGlcclxuICAgIEdMLmVuYWJsZShHTC5ERVBUSF9URVNUKTtcclxuICAgIEdMLmRlcHRoRnVuYyhHTC5MRVNTKTtcclxuXHJcbiAgICAvL1Nlb21lIHRpcHVwdWh2cmkgamEgbcOkw6RyYW1lLCBrdXMgYW50dWQgdGlwdWF0cmlidXV0IGFzdWIgYW50dWQgbWFzc2lpdmlzLlxyXG4gICAgR0wuYmluZEJ1ZmZlcihHTC5BUlJBWV9CVUZGRVIsIEFQUC52ZXJ0ZXhCdWZmZXIpO1xyXG4gICAgR0wudmVydGV4QXR0cmliUG9pbnRlcihBUFAuYV9Qb3NpdGlvbiwgMywgR0wuRkxPQVQsIGZhbHNlLCBBUFAudmVydGV4U2l6ZSAqIDQsIDApO1xyXG4gICAgR0wudmVydGV4QXR0cmliUG9pbnRlcihBUFAuYV9UZXh0dXJlQ29vcmQsIDIsIEdMLkZMT0FULCBmYWxzZSwgQVBQLnZlcnRleFNpemUgKiA0LCBBUFAudmVydGV4U2l6ZSAqIDQgLSAyICogNCk7XHJcblxyXG4gICAgLy9Ba3RpdmVlcmltZSBhdHJpYnV1ZGlkXHJcbiAgICBHTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShBUFAuYV9Qb3NpdGlvbik7XHJcbiAgICBHTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShBUFAuYV9UZXh0dXJlQ29vcmQpO1xyXG5cclxuICAgIC8vQWt0aXZlZXJpbWUgamEgbcOkw6RyYW1lIHRla3N0dXVyaVxyXG4gICAgR0wuYWN0aXZlVGV4dHVyZShHTC5URVhUVVJFMCk7XHJcbiAgICBHTC5iaW5kVGV4dHVyZShHTC5URVhUVVJFXzJELCBBUFAudGV4dHVyZSk7XHJcbiAgICBHTC51bmlmb3JtMWkoQVBQLnVfVGV4dHVyZSwgMCk7XHJcblxyXG4gICAgLy9TYWFkYW1lIG1laWUgbWFhdHJpa3NpZCBrYSB2YXJqdW5kYWphc3NlXHJcbiAgICBHTC51bmlmb3JtTWF0cml4NGZ2KEFQUC51X01vZGVsTWF0cml4LCBmYWxzZSwgQVBQLm1vZGVsTWF0cml4KTtcclxuICAgIEdMLnVuaWZvcm1NYXRyaXg0ZnYoQVBQLnVfVmlld01hdHJpeCwgZmFsc2UsIEFQUC52aWV3TWF0cml4KTtcclxuICAgIEdMLnVuaWZvcm1NYXRyaXg0ZnYoQVBQLnVfUHJvamVjdGlvbk1hdHJpeCwgZmFsc2UsIEFQUC5wcm9qZWN0aW9uTWF0cml4KTtcclxuXHJcbiAgICAvL1JlbmRlcmRhbWUga29sbW51cmdhZCBpbmRla3NpdGUgasOkcmdpXHJcbiAgICBHTC5iaW5kQnVmZmVyKEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBBUFAuaW5kZXhCdWZmZXIpO1xyXG4gICAgR0wuZHJhd0VsZW1lbnRzKEdMLlRSSUFOR0xFUywgQVBQLmluZGV4QnVmZmVyLm51bWJlck9mSW5kZXhlcywgR0wuVU5TSUdORURfU0hPUlQsIDApO1xyXG59XHJcblxyXG4iLCJMb29wZXIgPSBmdW5jdGlvbihkb21FbGVtZW50LCBjYWxsYmFjaykge1xyXG4gICAgdGhpcy5kb21FbGVtZW50ID0gZG9tRWxlbWVudDtcclxuXHJcbiAgICB0aGlzLmxhc3RUaW1lID0gMDtcclxuICAgIHRoaXMuZGVsdGFUaW1lID0gMDtcclxuXHJcbiAgICB0aGlzLnJlcXVlc3RJZDtcclxuXHJcbiAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XHJcblxyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG4gICAgICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xyXG5cclxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWU7XHJcbn07XHJcblxyXG5Mb29wZXIucHJvdG90eXBlID0ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yOiBMb29wZXIsXHJcblxyXG4gICAgY2FsY3VsYXRlRGVsdGFUaW1lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgdGltZU5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cclxuICAgICAgICBpZih0aGlzLmxhc3RUaW1lICE9IDApXHJcbiAgICAgICAgICAgIHRoaXMuZGVsdGFUaW1lID0gKHRpbWVOb3cgLSB0aGlzLmxhc3RUaW1lKSAvIDE2O1xyXG5cclxuICAgICAgICB0aGlzLmxhc3RUaW1lID0gdGltZU5vdztcclxuICAgIH0sXHJcblxyXG4gICAgbG9vcDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5yZXF1ZXN0SWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5sb29wLmJpbmQodGhpcyksIHRoaXMuZG9tRWxlbWVudCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlRGVsdGFUaW1lKCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5kZWx0YVRpbWUpO1xyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTG9vcGVyOyIsIi8qKlxyXG4gKiBIb2lhYiBlbmRhcyBXZWJHTFByb2dyYW0gb2JqZWt0aSBqYSBXZWJHTFNoYWRlciB0aXB1dmFyanVuZGFqYXQgamEgcGlrc2xpdmFyanVuZGFqYXRcclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleFNoYWRlclBhdGhcclxuICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50U2hhZGVyUGF0aFxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBvbkxpbmtlZCBNZWV0b2QsIG1pcyBrdXRzdXRha3NlIHbDpGxqYSwga3VpIHZhcmp1bmRhamFkIG9uIGxhZXR1ZFxyXG4gKiBAY2xhc3NcclxuICovXHJcbnZhciBQcm9ncmFtT2JqZWN0ID0gZnVuY3Rpb24odmVydGV4U2hhZGVyUGF0aCwgZnJhZ21lbnRTaGFkZXJQYXRoLCBvbkxpbmtlZCkge1xyXG4gICAgdGhpcy5wcm9ncmFtID0gR0wuY3JlYXRlUHJvZ3JhbSgpO1xyXG5cclxuICAgIHRoaXMub25MaW5rZWQgPSBvbkxpbmtlZDtcclxuXHJcbiAgICB0aGlzLnZlcnRleFNoYWRlciA9IHtcclxuICAgICAgICBcInNoYWRlclwiOiBHTC5jcmVhdGVTaGFkZXIoR0wuVkVSVEVYX1NIQURFUiksXHJcbiAgICAgICAgXCJwYXRoXCI6IHZlcnRleFNoYWRlclBhdGgsXHJcbiAgICAgICAgXCJzcmNcIjogXCJcIixcclxuICAgICAgICBcImNvbXBsZXRlZFwiOiBmYWxzZVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmZyYWdtZW50U2hhZGVyID0ge1xyXG4gICAgICAgIFwic2hhZGVyXCI6IEdMLmNyZWF0ZVNoYWRlcihHTC5GUkFHTUVOVF9TSEFERVIpLFxyXG4gICAgICAgIFwicGF0aFwiOiBmcmFnbWVudFNoYWRlclBhdGgsXHJcbiAgICAgICAgXCJzcmNcIjogXCJcIixcclxuICAgICAgICBcImNvbXBsZXRlZFwiOiBmYWxzZVxyXG4gICAgfTtcclxufTtcclxuXHJcblByb2dyYW1PYmplY3QucHJvdG90eXBlID0ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yOiBQcm9ncmFtT2JqZWN0LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGJhY2sgbWVldG9kLCBtaXMga29tcGlsZWVyaWIgamEgc8OkdGVzdGFiIHZhcmp1bmRhamFkLCBrdWkgbcO1bGVtYWQgb24gYXPDvG5rcm9vbnNlbHQgbGFldHVkXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNyYyBMw6RodGVrb29kLCBtaXMgQUpBWCdpIGFiaWwgbGFldGlcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFRlZSwgbWlsbGUgYWJpbCB0dXZhc3RhZGEsIGt1bW1hIHZhcmp1bmRhamEgbMOkaHRla29vZCBvbiBsYWV0dWRcclxuICAgICAqL1xyXG4gICAgb25jb21wbGV0ZTogZnVuY3Rpb24oc3JjLCBwYXRoKSB7XHJcbiAgICAgICAgaWYocGF0aCA9PT0gdGhpcy52ZXJ0ZXhTaGFkZXIucGF0aCkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRleFNoYWRlci5jb21wbGV0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRleFNoYWRlci5zcmMgPSBzcmM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYocGF0aCA9PT0gdGhpcy5mcmFnbWVudFNoYWRlci5wYXRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIuY29tcGxldGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5mcmFnbWVudFNoYWRlci5zcmMgPSBzcmM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih0aGlzLnZlcnRleFNoYWRlci5jb21wbGV0ZWQgJiYgdGhpcy5mcmFnbWVudFNoYWRlci5jb21wbGV0ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21waWxlU2hhZGVyKHRoaXMudmVydGV4U2hhZGVyLnNoYWRlciwgdGhpcy52ZXJ0ZXhTaGFkZXIuc3JjKTtcclxuICAgICAgICAgICAgdGhpcy5jb21waWxlU2hhZGVyKHRoaXMuZnJhZ21lbnRTaGFkZXIuc2hhZGVyLCB0aGlzLmZyYWdtZW50U2hhZGVyLnNyYyk7XHJcblxyXG4gICAgICAgICAgICBHTC5hdHRhY2hTaGFkZXIodGhpcy5wcm9ncmFtLCB0aGlzLnZlcnRleFNoYWRlci5zaGFkZXIpO1xyXG4gICAgICAgICAgICBHTC5hdHRhY2hTaGFkZXIodGhpcy5wcm9ncmFtLCB0aGlzLmZyYWdtZW50U2hhZGVyLnNoYWRlcik7XHJcblxyXG4gICAgICAgICAgICBHTC5saW5rUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xyXG5cclxuICAgICAgICAgICAgaWYoIUdMLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5wcm9ncmFtLCBHTC5MSU5LX1NUQVRVUykpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRXJyb3IgbGlua2luZyBzaGFkZXIgcHJvZ3JhbTogXFxcIlwiICsgR0wuZ2V0UHJvZ3JhbUluZm9Mb2codGhpcy5wcm9ncmFtKSArIFwiXFxcIlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYodHlwZW9mIHRoaXMub25MaW5rZWQgIT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgICAgIHRoaXMub25MaW5rZWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogw5xyaXRhYiBrb21waWxlZXJpZGEgdmFyanVuZGFqYVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7V2ViR0xTaGFkZXJ9IHNoYWRlciBWYXJqdW5kYWphIG1pZGEga29tcGlsZWVyaWRhXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIEzDpGh0ZWtvb2QsIG1pZGEga29tcGlsZWVyaWRhXHJcbiAgICAgKi9cclxuICAgIGNvbXBpbGVTaGFkZXI6IGZ1bmN0aW9uKHNoYWRlciwgc291cmNlKSB7XHJcbiAgICAgICAgR0wuc2hhZGVyU291cmNlKHNoYWRlciwgc291cmNlKTtcclxuICAgICAgICBHTC5jb21waWxlU2hhZGVyKHNoYWRlcik7XHJcblxyXG4gICAgICAgIGlmICghR0wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgR0wuQ09NUElMRV9TVEFUVVMpKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiU2hhZGVyIGNvbXBpbGF0aW9uIGZhaWxlZC4gRXJyb3I6IFxcXCJcIiArIEdMLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKSArIFwiXFxcIlwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQW50dWQga2xhc3NpIGFiaWwgb24gdsO1aW1hbGlrIHByb2dyYW1taSBsYWFkaWRhIGphIGFzw7xua3Jvb25zZWx0IHRhZ2FwaWxkaWwgc3BldHNpZml0c2Vlcml0dWQgdmFyanVuZGFqYWRcclxuICogdGFnYXN0YXR1ZCBwcm9ncmFtbWlnYSBzaWR1ZGFcclxuICpcclxuICogQGNsYXNzIFNoYWRlclByb2dyYW1Mb2FkZXJcclxuICovXHJcbnZhciBTaGFkZXJQcm9ncmFtTG9hZGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmNvbnRhaW5lciA9IFtdO1xyXG4gICAgdGhpcy5jb3VudGVyID0gLTE7XHJcbn07XHJcblxyXG5TaGFkZXJQcm9ncmFtTG9hZGVyLnByb3RvdHlwZSA9IHtcclxuICAgIGNvbnN0cnVjdG9yOiBTaGFkZXJQcm9ncmFtTG9hZGVyLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGFnYXN0YWIgcHJvZ3JhbW0gb2JqZWt0aS4gQXPDvG5rcm9vbnNlbHQgdGFnYXBsYWFuaWwgbGFldGFrc2UgamEga29tcGlsZWVyaXRha3NlIHZhcmp1bmRhamFkLiBFbm5lIGt1aVxyXG4gICAgICogcHJvZ3JhbW1pIGthc3V0YWRhIHR1bGViIGtvbnRyb2xsaWRhLCBldCB2YXJqdW5kYWphZCBvbiBrb21waWxlZXJpdHVkIGphIHByb2dyYW1taWdhIHNlb3R1ZC4gVsO1aW1hbGlrIG9uXHJcbiAgICAgKiBwYXJhbWVldHJpa3MgYW5kYSBrYSBDYWxsYmFjayBmdW5rdHNpb29uLCBtaXMgdGVhZGEgYW5uYWIsIGt1aSB2YXJqdW5kYWphZCBvbiBzZW90dWQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleFNoYWRlclBhdGggVGVlLCB0aXB1dmFyanVuZGFqYSBqdXVyZGVcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmcmFnbWVudFNoYWRlclBhdGggVGVlLCBwaWtzbGl2YXJqdW5kYWphIGp1dXJkZVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlua2VkQ2FsbGJhY2sgRnVua3RzaW9vbiwgbWlzIGt1dHN1dGFrc2UgdsOkbGphLCBrdWkgdmFyanVuZGFqYWQgb24ga29tcGlsZWVyaXR1ZCBqYSBzZW90dWQgcHJvZ3JhbW1pZ2FcclxuICAgICAqIEByZXR1cm5zIHtleHBvcnRzLmRlZmF1bHRPcHRpb25zLnByb2dyYW18KnxXZWJHTFByb2dyYW18UHJvZ3JhbU9iamVjdC5wcm9ncmFtfVxyXG4gICAgICovXHJcbiAgICBnZXRQcm9ncmFtOiBmdW5jdGlvbih2ZXJ0ZXhTaGFkZXJQYXRoLCBmcmFnbWVudFNoYWRlclBhdGgsIGxpbmtlZENhbGxiYWNrKSB7XHJcbiAgICAgICAgdGhpcy5jb3VudGVyKys7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXJbdGhpcy5jb3VudGVyXSA9IG5ldyBQcm9ncmFtT2JqZWN0KHZlcnRleFNoYWRlclBhdGgsIGZyYWdtZW50U2hhZGVyUGF0aCwgbGlua2VkQ2FsbGJhY2spO1xyXG4gICAgICAgIHZhciBwcm9ncmFtID0gdGhpcy5jb250YWluZXJbdGhpcy5jb3VudGVyXTtcclxuXHJcbiAgICAgICAgdGhpcy5sb2FkQXN5bmNTaGFkZXJTb3VyY2UodmVydGV4U2hhZGVyUGF0aCwgcHJvZ3JhbS5vbmNvbXBsZXRlLmJpbmQocHJvZ3JhbSkpO1xyXG4gICAgICAgIHRoaXMubG9hZEFzeW5jU2hhZGVyU291cmNlKGZyYWdtZW50U2hhZGVyUGF0aCwgcHJvZ3JhbS5vbmNvbXBsZXRlLmJpbmQocHJvZ3JhbSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gcHJvZ3JhbS5wcm9ncmFtO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIExhZWIgYXPDvG5rcm9vbnNlbHRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2hhZGVyUGF0aCBUZWUsIGt1cyBhc3ViIHZhcmp1bmRhamFcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIEZ1bmt0c2lvb24sIG1pcyBrw6Rpdml0YXRha3NlLCBrdWkgbMOkaHRla29vZCBvbiBrw6R0dGUgc2FhZHVkLiBTYWFkZXRha3NlIHZhc3R1cyBqYSB0ZWUuXHJcbiAgICAgKi9cclxuICAgIGxvYWRBc3luY1NoYWRlclNvdXJjZTogZnVuY3Rpb24oc2hhZGVyUGF0aCwgY2FsbGJhY2spIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICBhc3luYzogdHJ1ZSxcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICB1cmw6IHNoYWRlclBhdGgsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVzdWx0LCBzaGFkZXJQYXRoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvZ3JhbU9iamVjdDtcclxubW9kdWxlLmV4cG9ydHMgPSBTaGFkZXJQcm9ncmFtTG9hZGVyOyJdfQ==
