var ShaderProgram = function(gl, vertexShaderPath, fragmentShaderPath) {
    this.vertexShaderPath = vertexShaderPath;
    this.fragmentShaderPath = fragmentShaderPath;

    this.program;

    this.initialize();
};

ShaderProgram.prototype = {
    constructor: ShaderProgram,

    initialize: function() {

    }


};

module.exports = ShaderProgram;