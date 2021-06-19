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
    var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-3d", "fragment-shader-3d"]);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var colorLocation = gl.getAttribLocation(program, "a_color");
    var matrixLocation = gl.getUniformLocation(program, "u_matrix");

    // Create a buffer to put positions in
    var positionBuffer = gl.createBuffer();

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // 将几何数据存到缓冲
    setGeometry(gl);

    // 给颜色创建一个缓冲
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    // 将颜色值传入缓冲
    setColors(gl);

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    var fieldOfViewRadians = degToRad(60);

    var cubetranslation = [-200, 0, -360];
    var linetranslation = [0, 0, -360];
    var fivetranslation = [0, 0, -360];
    var spheretranslation = [200, 0, -360];

    requestAnimationFrame(drawScene);

    // Setup a ui.
    webglLessonsUI.setupSlider("#fieldOfView", { value: radToDeg(fieldOfViewRadians), slide: updateFieldOfView, min: 1, max: 179 });

    function updateFieldOfView(event, ui) {
        fieldOfViewRadians = degToRad(ui.value);
        drawScene();
    }

    // 绘制场景
    function drawScene(time) {
        time *= 0.0005;

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // 告诉WebGL如何从裁剪空间对应到像素
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // 清空画布
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        var cuberotation = [-time, time, 0];
        var linerotation = [0, time, 0];
        var fiverotation = [0, time, 0];
        var sphererotation = [-time, time, -time];

        // ---绘制立方体--- BEGIN
        // 使用我们的程序
        gl.useProgram(program);

        // 启用属性
        gl.enableVertexAttribArray(positionLocation);

        // 绑定位置缓冲
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);


        // 告诉属性怎么从positionBuffer中读取数据 (ARRAY_BUFFER)
        var size = 3;          // 每次迭代运行提取两个单位数据
        var type = gl.FLOAT;   // 每个单位的数据类型是32位浮点型
        var normalize = false; // 不需要归一化数据
        var stride = 0;        // 0 = 移动单位数量 * 每个单位占用内存（sizeof(type)）
        var offset = 0;        // 从缓冲起始位置开始读取
        gl.vertexAttribPointer(
            positionLocation, size, type, normalize, stride, offset)

        // 启用颜色属性
        gl.enableVertexAttribArray(colorLocation);

        // 绑定颜色缓冲
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        // 告诉颜色属性怎么从 colorBuffer (ARRAY_BUFFER) 中读取颜色值
        var size = 3;                 // 每次迭代使用3个单位的数据
        var type = gl.UNSIGNED_BYTE;  // 单位数据类型是无符号 8 位整数
        var normalize = true;         // 标准化数据 (从 0-255 转换到 0.0-1.0)
        var stride = 0;               // 0 = 移动距离 * 单位距离长度sizeof(type)  每次迭代跳多少距离到下一个数据
        var offset = 0;               // 从绑定缓冲的起始处开始
        gl.vertexAttribPointer(
            colorLocation, size, type, normalize, stride, offset)

        // 计算矩阵
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        var zNear = 1;
        var zFar = 2000;
        // 创建一个矩阵，可以将原点移动到立方体的中心
        var moveOriginMatrix = m4.translation(-50, -50, -50);
        var matrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
        matrix = m4.translate(matrix, cubetranslation[0], cubetranslation[1], cubetranslation[2]);
        matrix = m4.xRotate(matrix, cuberotation[0]);
        matrix = m4.yRotate(matrix, cuberotation[1]);
        matrix = m4.multiply(matrix, moveOriginMatrix);

        // 设置矩阵
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        // 绘制几何体
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6 * 6;
        gl.drawArrays(primitiveType, offset, count);
        // ---绘制立方体--- END

        // ---绘制五角星--- BEGIN
        // 计算矩阵
        var matrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
        matrix = m4.translate(matrix, linetranslation[0], linetranslation[1], linetranslation[2]);
        matrix = m4.yRotate(matrix, linerotation[1]);

        // 设置矩阵
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        // 绘制几何体
        var primitiveType = gl.LINE_LOOP;
        var offset = 6 * 6;
        var count = 5;
        gl.drawArrays(primitiveType, offset, count);

        // 计算矩阵
        var matrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
        matrix = m4.translate(matrix, fivetranslation[0], fivetranslation[1], fivetranslation[2]);
        matrix = m4.yRotate(matrix, fiverotation[1]);

        // 设置矩阵
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        // 绘制几何体
        var primitiveType = gl.TRIANGLE_FAN;
        var offset = 6 * 6 + 5;
        var count = 5;
        gl.drawArrays(primitiveType, offset, count);
        // ---绘制五角星--- END

        // ---绘制球体--- BEGIN
        var matrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
        matrix = m4.translate(matrix, spheretranslation[0], spheretranslation[1], spheretranslation[2]);
        matrix = m4.xRotate(matrix, sphererotation[0]);
        matrix = m4.yRotate(matrix, sphererotation[1]);
        matrix = m4.yRotate(matrix, sphererotation[1]);
        matrix = m4.scale(matrix, 100, 100, 100);

        // 设置矩阵
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        // 绘制几何体
        var primitiveType = gl.TRIANGLES;
        var offset = 6 * 6 + 10;
        var count = index;
        gl.drawArrays(primitiveType, offset, count);
        // ---绘制球体--- END

        requestAnimationFrame(drawScene);
    }
}

function normalize(v) {
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // 确定不会除以 0
    if (length > 0.00001) {
        return [v[0] / length, v[1] / length, v[2] / length];
    } else {
        return [0, 0, 0];
    }
}

function mix(x, y, num) {
    return [(x[0] + y[0]) * num, (x[1] + y[1]) * num, (x[2] + y[2]) * num];
}

var m4 = {
    perspective: function (fieldOfViewInRadians, aspect, near, far) {
        var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
        var rangeInv = 1.0 / (near - far);

        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ];
    },

    translation: function (tx, ty, tz) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            tx, ty, tz, 1,
        ];
    },

    xRotation: function (angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1,
        ];
    },

    yRotation: function (angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1,
        ];
    },

    zRotation: function (angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    },

    scaling: function (sx, sy, sz) {
        return [
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1,
        ];
    },

    translate: function (m, tx, ty, tz) {
        return m4.multiply(m, m4.translation(tx, ty, tz));
    },

    xRotate: function (m, angleInRadians) {
        return m4.multiply(m, m4.xRotation(angleInRadians));
    },

    yRotate: function (m, angleInRadians) {
        return m4.multiply(m, m4.yRotation(angleInRadians));
    },

    zRotate: function (m, angleInRadians) {
        return m4.multiply(m, m4.zRotation(angleInRadians));
    },

    scale: function (m, sx, sy, sz) {
        return m4.multiply(m, m4.scaling(sx, sy, sz));
    },

    orthographic: function (left, right, bottom, top, near, far) {
        return [
            2 / (right - left), 0, 0, 0,
            0, 2 / (top - bottom), 0, 0,
            0, 0, 2 / (near - far), 0,

            (left + right) / (left - right),
            (bottom + top) / (bottom - top),
            (near + far) / (near - far),
            1,
        ];
    },

    multiply: function (a, b) {
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];
        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];
        return [
            b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
            b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
            b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
            b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
            b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
            b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
            b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
            b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
            b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
            b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
            b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
            b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
            b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
            b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
            b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
    },
};

var index = 0;
var spherePointsArray = new Array();
var sphereColorsArray = new Array();


// 在缓冲存储顶点的值
function setGeometry(gl) {
    var t = (1 + Math.tan(Math.PI / 10) * Math.tan(Math.PI / 10)) / (3 - Math.tan(Math.PI / 10) * Math.tan(Math.PI / 10));

    var va = [0, 0, -1];
    var vb = [0, 0.942809, 0.333333];
    var vc = [-0.816497, -0.471405, 0.333333];
    var vd = [0.816497, -0.471405, 0.333333];

    tetrahedron(va, vb, vc, vd, 4);

    function tetrahedron(a, b, c, d, n) {
        devideTriangle(a, b, c, n);
        devideTriangle(d, c, b, n);
        devideTriangle(a, d, b, n);
        devideTriangle(a, c, d, n);
    }

    function devideTriangle(a, b, c, count) {
        if (count > 0) {
            var ab = normalize(mix(a, b, 0.5));
            var ac = normalize(mix(a, c, 0.5));
            var bc = normalize(mix(b, c, 0.5));

            devideTriangle(a, ab, ac, count - 1);
            devideTriangle(ab, b, bc, count - 1);
            devideTriangle(bc, c, ac, count - 1);
            devideTriangle(ab, bc, ac, count - 1);
        }
        else {
            spherePointsArray = spherePointsArray.concat(a);
            spherePointsArray = spherePointsArray.concat(b);
            spherePointsArray = spherePointsArray.concat(c);
            sphereColorsArray.push(Math.sqrt(a[0] * a[0]) * 256, Math.sqrt(a[1] * a[1]) * 256, Math.sqrt(a[2] * a[2]) * 256);
            sphereColorsArray.push(Math.sqrt(b[0] * b[0]) * 256, Math.sqrt(b[1] * b[1]) * 256, Math.sqrt(b[2] * b[2]) * 256);
            sphereColorsArray.push(Math.sqrt(c[0] * c[0]) * 256, Math.sqrt(c[1] * c[1]) * 256, Math.sqrt(c[2] * c[2]) * 256);
            index += 3;
        }
    }

    gl.bufferData(
        gl.ARRAY_BUFFER,
        //(new Float32Array([
        Float32Array.from((new Array(
            // 正面
            0, 0, 0,
            0, 100, 0,
            100, 0, 0,
            0, 100, 0,
            100, 100, 0,
            100, 0, 0,

            // 背面
            0, 0, 100,
            100, 0, 100,
            0, 100, 100,
            0, 100, 100,
            100, 0, 100,
            100, 100, 100,

            // 顶面
            0, 0, 0,
            100, 0, 0,
            100, 0, 100,
            0, 0, 0,
            100, 0, 100,
            0, 0, 100,

            // 右侧
            100, 0, 0,
            100, 100, 0,
            100, 100, 100,
            100, 0, 0,
            100, 100, 100,
            100, 0, 100,

            // 底面
            0, 100, 0,
            0, 100, 100,
            100, 100, 100,
            0, 100, 0,
            100, 100, 100,
            100, 100, 0,

            // 左侧
            0, 0, 0,
            0, 0, 100,
            0, 100, 100,
            0, 0, 0,
            0, 100, 100,
            0, 100, 0,

            100 * 0, 100 * 1, 0,//A
            100 * Math.cos(Math.PI * 3 / 10), 100 * -1 * Math.sin(Math.PI * 3 / 10), 0,//C
            100 * -1 * Math.cos(Math.PI / 10), 100 * Math.sin(Math.PI / 10), 0,//E
            100 * Math.cos(Math.PI / 10), 100 * Math.sin(Math.PI / 10), 0,//B
            100 * -1 * Math.cos(Math.PI * 3 / 10), 100 * -1 * Math.sin(Math.PI * 3 / 10), 0,//D

            100 * 0, 100 * -t, 0,
            100 * -1 * t * Math.cos(Math.PI / 10), 100 * -1 * t * Math.sin(Math.PI / 10), 0,
            100 * -1 * t * Math.cos(Math.PI * 3 / 10), 100 * t * Math.sin(Math.PI * 3 / 10), 0,
            100 * t * Math.cos(Math.PI * 3 / 10), 100 * t * Math.sin(Math.PI * 3 / 10), 0,
            100 * t * Math.cos(Math.PI / 10), 100 * -1 * t * Math.sin(Math.PI / 10), 0)).concat(spherePointsArray)),
        gl.STATIC_DRAW);
}

// 向缓冲传入顶点的颜色值
function setColors(gl) {
    for (var ii = 0; ii < index; ii++) {
        sphereColorsArray.push(255);
        sphereColorsArray.push(0);
        sphereColorsArray.push(0);
    }

    gl.bufferData(
        gl.ARRAY_BUFFER,
        //(new Uint8Array([
        Uint8Array.from((new Array(
            // 正面
            0, 0, 0,
            0, 255, 0,
            255, 0, 0,
            0, 255, 0,
            255, 255, 0,
            255, 0, 0,

            // 背面
            0, 0, 255,
            255, 0, 255,
            0, 255, 255,
            0, 255, 255,
            255, 0, 255,
            255, 255, 255,

            // 顶面
            0, 0, 0,
            255, 0, 0,
            255, 0, 255,
            0, 0, 0,
            255, 0, 255,
            0, 0, 255,

            // 右侧
            255, 0, 0,
            255, 255, 0,
            255, 255, 255,
            255, 0, 0,
            255, 255, 255,
            255, 0, 255,

            // 底面
            0, 255, 0,
            0, 255, 255,
            255, 255, 255,
            0, 255, 0,
            255, 255, 255,
            255, 255, 0,

            // 左侧
            0, 0, 0,
            0, 0, 255,
            0, 255, 255,
            0, 0, 0,
            0, 255, 255,
            0, 255, 0,

            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,

            255, 255, 0,
            255, 255, 0,
            255, 255, 0,
            255, 255, 0,
            255, 255, 0,
        )).concat(sphereColorsArray)),
        gl.STATIC_DRAW);
}

main();
