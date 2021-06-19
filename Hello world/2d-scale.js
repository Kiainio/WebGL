"use strict";

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.querySelector("#canvas");
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // setup GLSL program
    var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-2d", "fragment-shader-2d"]);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    var colorLocation = gl.getUniformLocation(program, "u_color");
    var translationLocation = gl.getUniformLocation(program, "u_translation");
    var rotationLocation = gl.getUniformLocation(program, "u_rotation");
    var scaleLocation = gl.getUniformLocation(program, "u_scale");

    // Create a buffer to put positions in
    var positionBuffer = gl.createBuffer();

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // 将几何数据存到缓冲
    setGeometry(gl);

    var translation = [0, 0];
    var rotation = [0, 1];
    var scale = [1, 1];
    var color = [Math.random(), Math.random(), Math.random(), 1];

    drawScene();

    // Setup a ui.
    webglLessonsUI.setupSlider("#x", {slide: updatePosition(0), max: gl.canvas.width });
    webglLessonsUI.setupSlider("#y", { slide: updatePosition(1), max: gl.canvas.height });
    webglLessonsUI.setupSlider("#angle", { slide: updateAngle, max: 360 });
    webglLessonsUI.setupSlider("#scaleX", {value: scale[0], slide: updateScale(0), min: -5, max: 5, step: 0.01, precision: 2});
    webglLessonsUI.setupSlider("#scaleY", {value: scale[1], slide: updateScale(1), min: -5, max: 5, step: 0.01, precision: 2});

    function updatePosition(index) {
        return function(event, ui) {
            translation[index] = ui.value;
            drawScene();
        };
    }

    function updateAngle(event, ui) {
        var angleInDegrees = 360 - ui.value;
        var angleInRadians = angleInDegrees * Math.PI / 180;
        rotation[0] = Math.sin(angleInRadians);
        rotation[1] = Math.cos(angleInRadians);
        drawScene();
    }

    function updateScale(index) {
        return function(event, ui) {
          scale[index] = ui.value;
          drawScene();
        };
    }

    // 绘制场景
    function drawScene() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    
        // 告诉WebGL如何从裁剪空间对应到像素
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
        // 清空画布
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        // 使用我们的程序
        gl.useProgram(program);
    
        // 启用属性
        gl.enableVertexAttribArray(positionLocation);
    
        // 绑定位置缓冲
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    
        // 告诉属性怎么从positionBuffer中读取数据 (ARRAY_BUFFER)
        var size = 2;          // 每次迭代运行提取两个单位数据
        var type = gl.FLOAT;   // 每个单位的数据类型是32位浮点型
        var normalize = false; // 不需要归一化数据
        var stride = 0;        // 0 = 移动单位数量 * 每个单位占用内存（sizeof(type)）
        var offset = 0;        // 从缓冲起始位置开始读取
        gl.vertexAttribPointer(
            positionLocation, size, type, normalize, stride, offset)
    
        // 设置分辨率
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    
        // 设置颜色
        gl.uniform4fv(colorLocation, color);

        // 设置平移
        gl.uniform2fv(translationLocation, translation);

        // 设置旋转
        gl.uniform2fv(rotationLocation, rotation);

        // 设置缩放
        gl.uniform2fv(scaleLocation, scale);
    
        // 绘制矩形
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 18;
        gl.drawArrays(primitiveType, offset, count);
    }
}

// 在缓冲存储构成 'F' 的值
function setGeometry(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            // 左竖
            0, 0,
            30, 0,
            0, 150,
            0, 150,
            30, 0,
            30, 150,
   
            // 上横
            30, 0,
            100, 0,
            30, 30,
            30, 30,
            100, 0,
            100, 30,
   
            // 中横
            30, 60,
            67, 60,
            30, 90,
            30, 90,
            67, 60,
            67, 90,
        ]),
        gl.STATIC_DRAW);
}

main();
