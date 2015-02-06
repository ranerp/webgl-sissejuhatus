MatrixStack = function() {
    this.stack = [];
    this.matrix = mat4.create();
};

MatrixStack.prototype = {

    constructor: MatrixStack,

    push: function() {
        var copy = mat4.clone(this.matrix);
        this.stack.push(copy);
    },

    pop: function() {
        if(this.stack.length === 0)
            throw "Invalid pop. Stack is empty.";

        this.matrix = this.stack.pop();
    },

    scale: function(vector) {
        mat4.scale(this.matrix, this.matrix, vector);
    },

    rotate: function(quaternion) {
        var quat = mat4.create();
        mat4.fromQuat(quat, quaternion);
        mat4.multiply(this.matrix, this.matrix, quat);
    },

    translate: function(vector) {
        mat4.translate(this.matrix, this.matrix, vector);
    },

    rotateTranslate: function(quaternion, vector) {
        var rotTrans = mat4.create();
        mat4.fromRotationTranslation(rotTrans, quaternion, vector);
        this.multiply(rotTrans);
    },

    multiply: function(matrix) {
        mat4.multiply(this.matrix, this.matrix, matrix);
    },

    clone: function() {
        return mat4.clone(this.matrix);
    },

    getMatrix: function() {
        return this.matrix;
    }
};

module.exports = MatrixStack;