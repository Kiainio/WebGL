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
    //var colorLocation = gl.getAttribLocation(program, "a_color");
    var normalLocation = gl.getAttribLocation(program, "a_normal");

    // var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    // 寻找全局变量
    var worldViewProjectionLocation =
        gl.getUniformLocation(program, "u_worldViewProjection");
    var worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
    var colorLocation = gl.getUniformLocation(program, "u_color");
    // var reverseLightDirectionLocation = gl.getUniformLocation(program, "u_reverseLightDirection");
    var lightWorldPositionLocation =
        gl.getUniformLocation(program, "u_lightWorldPosition");
    var viewWorldPositionLocation =
        gl.getUniformLocation(program, "u_viewWorldPosition");
    var worldLocation =
        gl.getUniformLocation(program, "u_world");
    var shininessLocation = gl.getUniformLocation(program, "u_shininess");

    // Create a buffer to put positions in
    var positionBuffer = gl.createBuffer();

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // 将几何数据存到缓冲
    setGeometry(gl);

    // // 给颜色创建一个缓冲
    // var colorBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    // // 将颜色值传入缓冲
    // setColors(gl);

    // 创建缓冲存储法向量
    var normalBuffer = gl.createBuffer();
    // 绑定到 ARRAY_BUFFER (可以看作 ARRAY_BUFFER = normalBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    // 将法向量存入缓冲
    setNormals(gl);

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    var fieldOfViewRadians = degToRad(60);
    var fRotationRadians = 0;
    var shininess = 150;

    drawScene();

    // Setup a ui.
    webglLessonsUI.setupSlider("#fRotation", { value: radToDeg(fRotationRadians), slide: updateRotation, min: -360, max: 360 });

    function updateRotation(event, ui) {
        fRotationRadians = degToRad(ui.value);
        drawScene();
    }

    // 绘制场景
    function drawScene() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // 告诉WebGL如何从裁剪空间对应到像素
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // 清空画布
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

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

        // // 启用颜色属性
        // gl.enableVertexAttribArray(colorLocation);

        // // 绑定颜色缓冲
        // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        // // 告诉颜色属性怎么从 colorBuffer (ARRAY_BUFFER) 中读取颜色值
        // var size = 3;                 // 每次迭代使用3个单位的数据
        // var type = gl.UNSIGNED_BYTE;  // 单位数据类型是无符号 8 位整数
        // var normalize = true;         // 标准化数据 (从 0-255 转换到 0.0-1.0)
        // var stride = 0;               // 0 = 移动距离 * 单位距离长度sizeof(type)  每次迭代跳多少距离到下一个数据
        // var offset = 0;               // 从绑定缓冲的起始处开始
        // gl.vertexAttribPointer(
        //     colorLocation, size, type, normalize, stride, offset)

        // 启用法向量属性
        gl.enableVertexAttribArray(normalLocation);

        // 绑定法向量缓冲
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

        // 告诉法向量属性怎么从 normalBuffer (ARRAY_BUFFER) 中读取值
        var size = 3;          // 每次迭代使用3个单位的数据
        var type = gl.FLOAT;   // 单位数据类型是 32 位浮点型
        var normalize = false; // 单位化 (从 0-255 转换到 0-1)
        var stride = 0;        // 0 = 移动距离 * 单位距离长度sizeof(type)  每次迭代跳多少距离到下一个数据
        var offset = 0;        // 从绑定缓冲的起始处开始
        gl.vertexAttribPointer(
            normalLocation, size, type, normalize, stride, offset)

        // 计算投影矩阵
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        var zNear = 1;
        var zFar = 2000;
        var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        // 获得矩阵中相机的位置
        var camera = [100, 150, 200];
        var target = [0, 35, 0];
        var up = [0, 1, 0];

        // 计算相机的朝向矩阵
        var cameraMatrix = m4.lookAt(camera, target, up);

        // 通过相机矩阵获得视图矩阵
        var viewMatrix = m4.inverse(cameraMatrix);

        // 计算组合矩阵
        var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        // Draw a F at the origin
        var worldMatrix = m4.yRotation(fRotationRadians);

        // Multiply the matrices.
        var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
        var worldInverseMatrix = m4.inverse(worldMatrix);
        var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

        // 设置矩阵
        // 设置相机位置
        gl.uniform3fv(viewWorldPositionLocation, camera);
        gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
        gl.uniformMatrix4fv(
            worldViewProjectionLocation, false, worldViewProjectionMatrix);
        gl.uniformMatrix4fv(
            worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
        // Set the color to use
        gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green

        // set the light direction.
        // gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));
        // 设置光源位置
        gl.uniform3fv(lightWorldPositionLocation, [20, 30, 50]);

        // 设置亮度
        gl.uniform1f(shininessLocation, shininess);

        // Draw the geometry.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 16 * 6;
        gl.drawArrays(primitiveType, offset, count);
    }
}

var m4 = {
    transpose: function (m) {
        return [
            m[0], m[4], m[8], m[12],
            m[1], m[5], m[9], m[13],
            m[2], m[6], m[10], m[14],
            m[3], m[7], m[11], m[15],
        ];
    },

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

    inverse: function (m) {
        var m00 = m[0 * 4 + 0];
        var m01 = m[0 * 4 + 1];
        var m02 = m[0 * 4 + 2];
        var m03 = m[0 * 4 + 3];
        var m10 = m[1 * 4 + 0];
        var m11 = m[1 * 4 + 1];
        var m12 = m[1 * 4 + 2];
        var m13 = m[1 * 4 + 3];
        var m20 = m[2 * 4 + 0];
        var m21 = m[2 * 4 + 1];
        var m22 = m[2 * 4 + 2];
        var m23 = m[2 * 4 + 3];
        var m30 = m[3 * 4 + 0];
        var m31 = m[3 * 4 + 1];
        var m32 = m[3 * 4 + 2];
        var m33 = m[3 * 4 + 3];
        var tmp_0 = m22 * m33;
        var tmp_1 = m32 * m23;
        var tmp_2 = m12 * m33;
        var tmp_3 = m32 * m13;
        var tmp_4 = m12 * m23;
        var tmp_5 = m22 * m13;
        var tmp_6 = m02 * m33;
        var tmp_7 = m32 * m03;
        var tmp_8 = m02 * m23;
        var tmp_9 = m22 * m03;
        var tmp_10 = m02 * m13;
        var tmp_11 = m12 * m03;
        var tmp_12 = m20 * m31;
        var tmp_13 = m30 * m21;
        var tmp_14 = m10 * m31;
        var tmp_15 = m30 * m11;
        var tmp_16 = m10 * m21;
        var tmp_17 = m20 * m11;
        var tmp_18 = m00 * m31;
        var tmp_19 = m30 * m01;
        var tmp_20 = m00 * m21;
        var tmp_21 = m20 * m01;
        var tmp_22 = m00 * m11;
        var tmp_23 = m10 * m01;

        var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
            (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
        var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
            (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
        var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
            (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
        var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
            (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

        var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

        return [
            d * t0,
            d * t1,
            d * t2,
            d * t3,
            d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
                (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
            d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
                (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
            d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
                (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
            d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
                (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
            d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
                (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
            d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
                (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
            d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
                (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
            d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
                (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
            d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
                (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
            d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
                (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
            d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
                (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
            d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
                (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02))
        ];
    },

    vectorMultiply: function (v, m) {
        var dst = [];
        for (var i = 0; i < 4; ++i) {
            dst[i] = 0.0;
            for (var j = 0; j < 4; ++j) {
                dst[i] += v[j] * m[j * 4 + i];
            }
        }
        return dst;
    },

    lookAt: function (cameraPosition, target, up) {
        var zAxis = m4.normalize(
            m4.subtractVectors(cameraPosition, target));
        var xAxis = m4.normalize(m4.cross(up, zAxis));
        var yAxis = m4.normalize(m4.cross(zAxis, xAxis));

        return [
            xAxis[0], xAxis[1], xAxis[2], 0,
            yAxis[0], yAxis[1], yAxis[2], 0,
            zAxis[0], zAxis[1], zAxis[2], 0,
            cameraPosition[0],
            cameraPosition[1],
            cameraPosition[2],
            1,
        ];
    },

    subtractVectors: function (a, b) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    },

    normalize: function (v) {
        var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        // 确定不会除以 0
        if (length > 0.00001) {
            return [v[0] / length, v[1] / length, v[2] / length];
        } else {
            return [0, 0, 0];
        }
    },

    cross: function (a, b) {
        return [a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]];
    },
};

// 在缓冲存储构成 'F' 的值
function setGeometry(gl) {
    var positions = new Float32Array([
        // left column front
        0, 0, 0,
        0, 150, 0,
        30, 0, 0,
        0, 150, 0,
        30, 150, 0,
        30, 0, 0,

        // top rung front
        30, 0, 0,
        30, 30, 0,
        100, 0, 0,
        30, 30, 0,
        100, 30, 0,
        100, 0, 0,

        // middle rung front
        30, 60, 0,
        30, 90, 0,
        67, 60, 0,
        30, 90, 0,
        67, 90, 0,
        67, 60, 0,

        // left column back
        0, 0, 30,
        30, 0, 30,
        0, 150, 30,
        0, 150, 30,
        30, 0, 30,
        30, 150, 30,

        // top rung back
        30, 0, 30,
        100, 0, 30,
        30, 30, 30,
        30, 30, 30,
        100, 0, 30,
        100, 30, 30,

        // middle rung back
        30, 60, 30,
        67, 60, 30,
        30, 90, 30,
        30, 90, 30,
        67, 60, 30,
        67, 90, 30,

        // top
        0, 0, 0,
        100, 0, 0,
        100, 0, 30,
        0, 0, 0,
        100, 0, 30,
        0, 0, 30,

        // top rung right
        100, 0, 0,
        100, 30, 0,
        100, 30, 30,
        100, 0, 0,
        100, 30, 30,
        100, 0, 30,

        // under top rung
        30, 30, 0,
        30, 30, 30,
        100, 30, 30,
        30, 30, 0,
        100, 30, 30,
        100, 30, 0,

        // between top rung and middle
        30, 30, 0,
        30, 60, 30,
        30, 30, 30,
        30, 30, 0,
        30, 60, 0,
        30, 60, 30,

        // top of middle rung
        30, 60, 0,
        67, 60, 30,
        30, 60, 30,
        30, 60, 0,
        67, 60, 0,
        67, 60, 30,

        // right of middle rung
        67, 60, 0,
        67, 90, 30,
        67, 60, 30,
        67, 60, 0,
        67, 90, 0,
        67, 90, 30,

        // bottom of middle rung.
        30, 90, 0,
        30, 90, 30,
        67, 90, 30,
        30, 90, 0,
        67, 90, 30,
        67, 90, 0,

        // right of bottom
        30, 90, 0,
        30, 150, 30,
        30, 90, 30,
        30, 90, 0,
        30, 150, 0,
        30, 150, 30,

        // bottom
        0, 150, 0,
        0, 150, 30,
        30, 150, 30,
        0, 150, 0,
        30, 150, 30,
        30, 150, 0,

        // left side
        0, 0, 0,
        0, 0, 30,
        0, 150, 30,
        0, 0, 0,
        0, 150, 30,
        0, 150, 0]);

    // Center the F around the origin and Flip it around. We do this because
    // we're in 3D now with and +Y is up where as before when we started with 2D
    // we had +Y as down.

    // We could do by changing all the values above but I'm lazy.
    // We could also do it with a matrix at draw time but you should
    // never do stuff at draw time if you can do it at init time.
    var matrix = m4.xRotation(Math.PI);
    matrix = m4.translate(matrix, -50, -75, -15);

    for (var ii = 0; ii < positions.length; ii += 3) {
        var vector = m4.vectorMultiply([positions[ii + 0], positions[ii + 1], positions[ii + 2], 1], matrix);
        positions[ii + 0] = vector[0];
        positions[ii + 1] = vector[1];
        positions[ii + 2] = vector[2];
    }

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// 向缓冲传入'F'的颜色值
function setColors(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Uint8Array([
            // left column front
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,

            // top rung front
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,

            // middle rung front
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,

            // left column back
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,

            // top rung back
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,

            // middle rung back
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,

            // top
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,

            // top rung right
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,

            // under top rung
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,

            // between top rung and middle
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,

            // top of middle rung
            70, 180, 210,
            70, 180, 210,
            70, 180, 210,
            70, 180, 210,
            70, 180, 210,
            70, 180, 210,

            // right of middle rung
            100, 70, 210,
            100, 70, 210,
            100, 70, 210,
            100, 70, 210,
            100, 70, 210,
            100, 70, 210,

            // bottom of middle rung.
            76, 210, 100,
            76, 210, 100,
            76, 210, 100,
            76, 210, 100,
            76, 210, 100,
            76, 210, 100,

            // right of bottom
            140, 210, 80,
            140, 210, 80,
            140, 210, 80,
            140, 210, 80,
            140, 210, 80,
            140, 210, 80,

            // bottom
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,

            // left side
            160, 160, 220,
            160, 160, 220,
            160, 160, 220,
            160, 160, 220,
            160, 160, 220,
            160, 160, 220]),
        gl.STATIC_DRAW);
}

function setNormals(gl) {
    var normals = new Float32Array([
        // 正面左竖
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // 正面上横
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // 正面中横
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // 背面左竖
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // 背面上横
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // 背面中横
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // 顶部
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // 上横右面
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,

        // 上横下面
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // 上横和中横之间
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,

        // 中横上面
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // 中横右面
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,

        // 中横底面
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // 底部右侧
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,

        // 底面
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // 左面
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0]);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}

main();
