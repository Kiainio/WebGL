"use strict";

// 创建着色器方法，输入参数：渲染上下文，着色器类型，数据源
function createShader(gl, type, source) {
    var shader = gl.createShader(type); // 创建着色器对象
    gl.shaderSource(shader, source); // 提供数据源
    gl.compileShader(shader); // 编译 -> 生成着色器
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}


function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}


function main() {
    // ----初始化---- BEGIN
    var canvas = document.querySelector("#c");
    canvas.width = 400;
    canvas.height = 300;
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
    var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    var program = createProgram(gl, vertexShader, fragmentShader);

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

    var colorUniformLocation = gl.getUniformLocation(program, "u_color");

    var t = (1 + Math.tan(Math.PI / 10) * Math.tan(Math.PI / 10)) / (3 - Math.tan(Math.PI / 10) * Math.tan(Math.PI / 10));

    // 10个二维点坐标
    var positions = [
        200 + 100 * 0, 150 + 100 * 1,//A
        200 + 100 * Math.cos(Math.PI * 3 / 10), 150 + 100 * -1 * Math.sin(Math.PI * 3 / 10),//C
        200 + 100 * -1 * Math.cos(Math.PI / 10), 150 + 100 * Math.sin(Math.PI / 10),//E
        200 + 100 * Math.cos(Math.PI / 10), 150 + 100 * Math.sin(Math.PI / 10),//B
        200 + 100 * -1 * Math.cos(Math.PI * 3 / 10), 150 + 100 * -1 * Math.sin(Math.PI * 3 / 10),//D

        200 + 100 * 0, 150 + 100 * -t,
        200 + 100 * -1 * t * Math.cos(Math.PI / 10), 150 + 100 * -1 * t * Math.sin(Math.PI / 10),
        200 + 100 * -1 * t * Math.cos(Math.PI * 3 / 10), 150 + 100 * t * Math.sin(Math.PI * 3 / 10),
        200 + 100 * t * Math.cos(Math.PI * 3 / 10), 150 + 100 * t * Math.sin(Math.PI * 3 / 10),
        200 + 100 * t * Math.cos(Math.PI / 10), 150 + 100 * -1 * t * Math.sin(Math.PI / 10),
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // ----初始化---- END

    // ----渲染---- BEGIN
    // 清空画布
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // ---绘制线框--- BEGIN
    // 告诉它用我们之前写好的着色程序（一个着色器对）
    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);

    // 将绑定点绑定到缓冲数据（positionBuffer）
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // 告诉属性怎么从positionBuffer中读取数据 (ARRAY_BUFFER)
    var size = 2;          // 每次迭代运行提取两个单位数据
    var type = gl.FLOAT;   // 每个单位的数据类型是32位浮点型
    var normalize = false; // 不需要归一化数据
    var stride = 0;        // 0 = 移动单位数量 * 每个单位占用内存（sizeof(type)）
    // 每次迭代运行运动多少内存到下一个数据开始点
    var offset = 0;        // 从缓冲起始位置开始读取
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform4f(colorUniformLocation, 0, 0, 0, 1);

    var primitiveType = gl.LINE_LOOP;
    var offset = 0;
    var count = 5;
    gl.drawArrays(primitiveType, offset, count);
    // ---绘制线框--- END

    // ---填充内部--- BEGIN
    // 告诉它用我们之前写好的着色程序（一个着色器对）
    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);

    // 将绑定点绑定到缓冲数据（positionBuffer）
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // 告诉属性怎么从positionBuffer中读取数据 (ARRAY_BUFFER)
    var size = 2;          // 每次迭代运行提取两个单位数据
    var type = gl.FLOAT;   // 每个单位的数据类型是32位浮点型
    var normalize = false; // 不需要归一化数据
    var stride = 0;        // 0 = 移动单位数量 * 每个单位占用内存（sizeof(type)）
    // 每次迭代运行运动多少内存到下一个数据开始点
    var offset = 0;        // 从缓冲起始位置开始读取
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);

    gl.uniform4f(colorUniformLocation, 1, 1, 0, 1);

    var primitiveType = gl.TRIANGLE_FAN;
    var offset = 5;
    var count = 5;
    gl.drawArrays(primitiveType, offset, count);
    // ---填充内部--- END
    // ----渲染---- END
}

main();