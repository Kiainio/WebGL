"use strict";

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.querySelector("#canvas");
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    const ext = gl.getExtension('WEBGL_depth_texture');
    if (!ext) {
        return;
    }

    // setup GLSL program
    const textureProgram = webglUtils.createProgramFromScripts(gl, ["vertex-shader-3d", "fragment-shader-3d"]);
    const colorProgram = webglUtils.createProgramFromScripts(gl, ["color-vertex-shader", "color-fragment-shader"]);

    const colorProgramInfo = webglUtils.createProgramInfo(gl, ['color-vertex-shader', 'color-fragment-shader']);
    const cubeLinesBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
        position: [
            -1, -1, -1,
            1, -1, -1,
            -1, 1, -1,
            1, 1, -1,
            -1, -1, 1,
            1, -1, 1,
            -1, 1, 1,
            1, 1, 1,
        ],
        indices: [
            0, 1,
            1, 3,
            3, 2,
            2, 0,

            4, 5,
            5, 7,
            7, 6,
            6, 4,

            0, 4,
            1, 5,
            3, 7,
            2, 6,
        ],
    });

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(textureProgram, "a_position");
    var colorLocation = gl.getAttribLocation(textureProgram, "a_color");
    //var matrixLocation = gl.getUniformLocation(textureProgram, "u_matrix");
    var viewLocation = gl.getUniformLocation(textureProgram, "u_view");
    var worldLocation = gl.getUniformLocation(textureProgram, "u_world");
    var projectionLocation = gl.getUniformLocation(textureProgram, "u_projection");
    var textureMatrixLocation = gl.getUniformLocation(textureProgram, "u_textureMatrix");
    var projectedTextureLocation = gl.getUniformLocation(textureProgram, "u_projectedTexture");
    var biasLocation = gl.getUniformLocation(textureProgram, "u_bias");

    var CpositionLocation = gl.getAttribLocation(colorProgram, "a_position");
    var CcolorLocation = gl.getUniformLocation(colorProgram, "u_color");
    var CprojectionLocation = gl.getUniformLocation(colorProgram, "u_projection");
    var CviewLocation = gl.getUniformLocation(colorProgram, "u_view");
    var CworldLocation = gl.getUniformLocation(colorProgram, "u_world");


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

    // Create a buffer to put positions in
    var CpositionBuffer = gl.createBuffer();

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, CpositionBuffer);

    // 将几何数据存到缓冲
    CsetGeometry(gl);

    gl.activeTexture(gl.TEXTURE0);

    const depthTexture = gl.createTexture();
    const depthTextureSize = 512;
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,      // target
        0,                  // mip level
        gl.DEPTH_COMPONENT, // internal format
        depthTextureSize,   // width
        depthTextureSize,   // height
        0,                  // border
        gl.DEPTH_COMPONENT, // format
        gl.UNSIGNED_INT,    // type
        null);              // data
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const depthFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,       // target
        gl.DEPTH_ATTACHMENT,  // attachment point
        gl.TEXTURE_2D,        // texture target
        depthTexture,         // texture
        0);                   // mip level

    gl.activeTexture(gl.TEXTURE1);
    // 创建一个和深度纹理相同尺寸的颜色纹理
    const unusedTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, unusedTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        depthTextureSize,
        depthTextureSize,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 把它附加到该帧缓冲上
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,        // target
        gl.COLOR_ATTACHMENT0,  // attachment point
        gl.TEXTURE_2D,         // texture target
        unusedTexture,         // texture
        0);                    // mip level

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    const settings = {
        targetX: -200,
        projWidth: 1,
        projHeight: 1,
    };
    webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
        { type: 'slider', key: 'targetX', min: -400, max: 10, change: render, precision: 2, step: 0.001, },
        { type: 'slider', key: 'projWidth', min: 0, max: 2, change: render, precision: 2, step: 0.001, },
        { type: 'slider', key: 'projHeight', min: 0, max: 2, change: render, precision: 2, step: 0.001, },
    ]);

    var fieldOfViewRadians = degToRad(60);

    var cubetranslation = [-200, 0, 0];
    var linetranslation = [0, 0, 0];
    var fivetranslation = [0, 0, 0];
    var spheretranslation = [200, 0, 0];

    function render(time) {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        const lightWorldMatrix = m4.lookAt(
            [-150, 200, 0],          // position
            [settings.targetX, 0, 0], // target
            [0, 1, 0],                                              // up
        );

        const lightProjectionMatrix = m4.perspective(degToRad(45), settings.projWidth / settings.projHeight, 100, 1000);

        // 绘制到深度纹理
        gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, depthTextureSize, depthTextureSize);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), colorProgram, time);

        // 现在绘制场景到画布，把深度纹理投影到场景内
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let textureMatrix = m4.identity();
        textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
        textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
        textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);

        textureMatrix = m4.multiply(textureMatrix, m4.inverse(lightWorldMatrix));

        // 计算矩阵
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        var zNear = 1;
        var zFar = 2000;
        var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        var camera = [100, 200, 200];
        var target = [0, 35, 0];
        var up = [0, 1, 0];
        var cameraMatrix = m4.lookAt(camera, target, up);

        drawScene(projectionMatrix, cameraMatrix, textureMatrix, textureProgram, time);

        // ------ Draw the frustum ------
        {
            const viewMatrix = m4.inverse(cameraMatrix);

            gl.useProgram(colorProgramInfo.program);

            // Setup all the needed attributes.
            webglUtils.setBuffersAndAttributes(gl, colorProgramInfo, cubeLinesBufferInfo);

            // scale the cube in Z so it's really long
            // to represent the texture is being projected to
            // infinity
            var mat = m4.multiply(
                lightWorldMatrix, m4.inverse(lightProjectionMatrix));

            // Set the uniforms we just computed
            webglUtils.setUniforms(colorProgramInfo, {
                u_color: [0, 0, 0, 1],
                u_view: viewMatrix,
                u_projection: projectionMatrix,
                u_world: mat,
            });

            // calls gl.drawArrays or gl.drawElements
            webglUtils.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);
        }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    // 绘制场景
    function drawScene(projectionMatrix, cameraMatrix, textureMatrix, program, time) {
        time *= 0.0005;

        //var cuberotation = [-time, time, 0];
        var cuberotation = [-time, time, -time];
        var linerotation = [0, time, 0];
        var fiverotation = [0, time, 0];
        var sphererotation = [-time, time, -time];

        // Make a view matrix from the camera matrix.
        var viewMatrix = m4.inverse(cameraMatrix);

        // ---绘制立方体--- BEGIN
        // 使用我们的程序
        gl.useProgram(program);
        if (program == textureProgram) {

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

            // 创建一个矩阵，可以将原点移动到立方体的中心
            var moveOriginMatrix = m4.translation(-50, -50, -50);

            var worldMatrix = m4.translation(cubetranslation[0], cubetranslation[1], cubetranslation[2]);
            worldMatrix = m4.xRotate(worldMatrix, cuberotation[0]);
            worldMatrix = m4.yRotate(worldMatrix, cuberotation[1]);
            worldMatrix = m4.zRotate(worldMatrix, cuberotation[2]);
            worldMatrix = m4.multiply(worldMatrix, moveOriginMatrix);

            // 设置矩阵
            gl.uniform1f(biasLocation, -0.01);
            gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
            gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
            gl.uniformMatrix4fv(textureMatrixLocation, false, textureMatrix);
            gl.uniform1i(projectedTextureLocation, 0);
            gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

            // 绘制几何体
            var primitiveType = gl.TRIANGLES;
            var offset = 0;
            var count = 6 * 6;
            gl.drawArrays(primitiveType, offset, count);
            // ---绘制立方体--- END

            // ---绘制五角星--- BEGIN
            // 计算矩阵
            var worldMatrix = m4.translation(linetranslation[0], linetranslation[1], linetranslation[2]);
            worldMatrix = m4.yRotate(worldMatrix, linerotation[1]);

            gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

            // 绘制几何体
            var primitiveType = gl.LINE_LOOP;
            var offset = 6 * 6;
            var count = 5;
            gl.drawArrays(primitiveType, offset, count);

            // 计算矩阵
            var worldMatrix = m4.translation(fivetranslation[0], fivetranslation[1], fivetranslation[2]);
            worldMatrix = m4.yRotate(worldMatrix, fiverotation[1]);

            // 设置矩阵
            gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

            // 绘制几何体
            var primitiveType = gl.TRIANGLE_FAN;
            var offset = 6 * 6 + 5;
            var count = 5;
            gl.drawArrays(primitiveType, offset, count);
            // ---绘制五角星--- END

            // ---绘制平面--- BEGIN
            // 计算矩阵
            var worldMatrix = m4.translation(0, 0, 0);

            gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

            // 绘制几何体
            var primitiveType = gl.TRIANGLES;
            var offset = 6 * 6 + 10;
            var count = 6;
            gl.drawArrays(primitiveType, offset, count);
            // ---绘制平面--- END

            // ---绘制球体--- BEGIN
            var worldMatrix = m4.translation(spheretranslation[0], spheretranslation[1], spheretranslation[2]);
            worldMatrix = m4.xRotate(worldMatrix, sphererotation[0]);
            worldMatrix = m4.yRotate(worldMatrix, sphererotation[1]);
            worldMatrix = m4.zRotate(worldMatrix, sphererotation[2]);
            worldMatrix = m4.scale(worldMatrix, 80, 80, 80);

            // 设置矩阵
            gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

            // 绘制几何体
            var primitiveType = gl.TRIANGLES;
            var offset = 6 * 6 + 10 + 6;
            var count = index;
            gl.drawArrays(primitiveType, offset, count);
            // ---绘制球体--- END
        }
        else {
            // 启用属性
            gl.enableVertexAttribArray(CpositionLocation);

            // 绑定位置缓冲
            gl.bindBuffer(gl.ARRAY_BUFFER, CpositionBuffer);

            // 告诉属性怎么从CpositionBuffer中读取数据 (ARRAY_BUFFER)
            var size = 3;          // 每次迭代运行提取两个单位数据
            var type = gl.FLOAT;   // 每个单位的数据类型是32位浮点型
            var normalize = false; // 不需要归一化数据
            var stride = 0;        // 0 = 移动单位数量 * 每个单位占用内存（sizeof(type)）
            var offset = 0;        // 从缓冲起始位置开始读取
            gl.vertexAttribPointer(
                CpositionLocation, size, type, normalize, stride, offset)

            // 创建一个矩阵，可以将原点移动到立方体的中心
            var moveOriginMatrix = m4.translation(-50, -50, -50);

            var worldMatrix = m4.translation(cubetranslation[0], cubetranslation[1], cubetranslation[2]);
            worldMatrix = m4.xRotate(worldMatrix, cuberotation[0]);
            worldMatrix = m4.yRotate(worldMatrix, cuberotation[1]);
            worldMatrix = m4.zRotate(worldMatrix, cuberotation[2]);
            worldMatrix = m4.multiply(worldMatrix, moveOriginMatrix);

            // 设置矩阵
            gl.uniform4fv(CcolorLocation, [0, 0, 1, 1]);
            gl.uniformMatrix4fv(CworldLocation, false, worldMatrix);
            gl.uniformMatrix4fv(CviewLocation, false, viewMatrix);
            gl.uniformMatrix4fv(CprojectionLocation, false, projectionMatrix);

            // 绘制几何体
            var primitiveType = gl.TRIANGLES;
            var offset = 0;
            var count = 6 * 6;
            gl.drawArrays(primitiveType, offset, count);
            // ---绘制立方体--- END

            // ---绘制平面--- BEGIN
            // 计算矩阵
            var worldMatrix = m4.translation(0, 0, 0);

            gl.uniform4fv(CcolorLocation, [1, 0, 0, 1]);
            gl.uniformMatrix4fv(CworldLocation, false, worldMatrix);

            // 绘制几何体
            var primitiveType = gl.TRIANGLES;
            var offset = 6 * 6;
            var count = 6;
            gl.drawArrays(primitiveType, offset, count);
            // ---绘制平面--- END
        }
    }
}

var m4 = {
    identity: function () {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
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

    mix: function (x, y, num) {
        return [(x[0] + y[0]) * num, (x[1] + y[1]) * num, (x[2] + y[2]) * num];
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

    transpose: function (m) {
        return [
            m[0], m[4], m[8], m[12],
            m[1], m[5], m[9], m[13],
            m[2], m[6], m[10], m[14],
            m[3], m[7], m[11], m[15],
        ];
    },
};

var index = 0;
var spherePointsArray = new Array();
var sphereColorsArray = new Array();
var sphereNormalsArray = new Array();


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
            var ab = m4.normalize(m4.mix(a, b, 0.5));
            var ac = m4.normalize(m4.mix(a, c, 0.5));
            var bc = m4.normalize(m4.mix(b, c, 0.5));

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
            // sphereColorsArray.push(0, 0, 0);
            // sphereColorsArray.push(0, 0, 0);
            // sphereColorsArray.push(0, 0, 0);
            var ab = m4.normalize(m4.subtractVectors(b, a));
            var bc = m4.normalize(m4.subtractVectors(c, b));
            var normal = m4.cross(ab, bc);
            sphereNormalsArray = sphereNormalsArray.concat(normal);
            sphereNormalsArray = sphereNormalsArray.concat(normal);
            sphereNormalsArray = sphereNormalsArray.concat(normal);
            // [(-1, 1), (-1, 1), (-1, 1)] -> [(0, 1), (0, 1)]
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
            100 * t * Math.cos(Math.PI / 10), 100 * -1 * t * Math.sin(Math.PI / 10), 0,
            100 * t * Math.cos(Math.PI * 3 / 10), 100 * t * Math.sin(Math.PI * 3 / 10), 0,
            100 * -1 * t * Math.cos(Math.PI * 3 / 10), 100 * t * Math.sin(Math.PI * 3 / 10), 0,
            100 * -1 * t * Math.cos(Math.PI / 10), 100 * -1 * t * Math.sin(Math.PI / 10), 0,

            -400, -80, -200,
            200, -80, 200,
            200, -80, -200,
            -400, -80, -200,
            -400, -80, 200,
            200, -80, 200)).concat(spherePointsArray)),
        gl.STATIC_DRAW);
}

// 向缓冲传入顶点的颜色值
function setColors(gl) {
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

            128, 128, 128,
            128, 128, 128,
            128, 128, 128,
            128, 128, 128,
            128, 128, 128,
            128, 128, 128,
        )).concat(sphereColorsArray)),
        gl.STATIC_DRAW);
}

// 在缓冲存储顶点的值
function CsetGeometry(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
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
        
            -400, -80, -200,
            200, -80, 200,
            200, -80, -200,
            -400, -80, -200,
            -400, -80, 200,
            200, -80, 200]),
        gl.STATIC_DRAW);
}

main();
