
var App = function ()
{
    window.onerror = this.onError.bind(this);
    this.debugText = "";

    this.canvas = document.getElementById("canvas");
    //this.ctx = this.canvas.getContext("2d");
    this.gl = this.canvas.getContext("webgl");

    if (!this.gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    this.initWebGL();

    this.stage = new Stage(this.canvas);
    this.stage.enable();

    this.fps = 30;
    this.intervalId = setInterval(this.update.bind(this), 1000 / this.fps);

    var top = 10;
    var left = 10;
    var json;
    var jsonStr = window.localStorage.getItem("breadboard");
    if (jsonStr)
    {
        try
        {
            json = JSON.parse(jsonStr);
        }
        catch (e)
        {}
    }
    if (json)
    {
        this.breadboard = Breadboard.createFromJson(this.stage, top, left, json);
    }
    else
    {
        var rows = 1001;
        var cols = 1001;
        this.breadboard = new Breadboard(this.stage, top, left, cols, rows);
        this.breadboard.addWire(0, 0, cols - 1, 0, false);
    }

    this.nextTick = 0;
    this.gameTick = 0;

    var that = this;
    var fileDropButton = document.getElementById("fileDropButton");
    fileDropButton.onclick = function ()
    {
        document.getElementById("fileDrop").classList.toggle("show");
    };
    // Close the dropdown if the user clicks outside of it
    window.onclick = function(e) {
        if (!e.target.matches('.dropbtn')) {
            var myDropdown = document.getElementById("fileDrop");
            if (myDropdown.classList.contains('show')) {
                myDropdown.classList.remove('show');
            }
        }
    };
    document.getElementById("clearBoardButton").onclick = function ()
    {
        document.getElementById("fileDrop").classList.remove("show");
        that.breadboard.clear();
        that.breadboard.addWire(0, 0, that.breadboard.cols - 1, 0, false);
    };

    // disable mouse scroll on middle click
    document.body.onmousedown = function(e) { if (e.button === 1) return false; };

    this.loading = true;
    TextureManager.request("jack-plug.png");
    TextureManager.request("jack-plug-enabled.png");
    TextureManager.request("cancel.png");
    TextureManager.request("cancel-enabled.png");
    TextureManager.request("move.png");
    TextureManager.request("move-enabled.png");
    TextureManager.request("truck.png");
    TextureManager.request("truck-enabled.png");

    ShaderManager.request("src/shaders/wire.vert");
    ShaderManager.request("src/shaders/wire.frag");
    ShaderManager.request("src/shaders/wirecirclesshader.frag");
    ShaderManager.request("src/shaders/grid.vert");
    ShaderManager.request("src/shaders/grid.frag");
    ShaderManager.request("src/shaders/circle.vert");
    ShaderManager.request("src/shaders/circle.frag");
};

App.prototype.update = function update()
{
    if (TextureManager.loading() ||
        ShaderManager.loading())
    {
        return;
    }

    if (this.loading)
    {
        this.loading = false;
        this.postLoad();
        this.breadboard.postLoad();
    }

    this.nextTick -= 1;
    if (this.nextTick < 0)
    {
        this.gameTick += 1;
        this.updateGame();
        this.nextTick = 30;
    }

    //this.breadboard.update();
    this.save();
};

App.prototype.updateGame = function updateGame()
{

};

App.prototype.addGrid = function addGrid()
{
    var vertices = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0
    ]);
    var gridGeometry = new THREE.BufferGeometry();
    gridGeometry.addAttribute('position', new THREE.BufferAttribute(vertices, 2));

    gridGeometry.boundingSphere = new THREE.Sphere();
    gridGeometry.boundingSphere.radius = 99999;

    this.gridMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: this.breadboard.gameStage.feather,
            box: { value: [0.0, 0.0, 0.0, 0.0] }
        },
        vertexShader: ShaderManager.get("src/shaders/grid.vert"),
        fragmentShader: ShaderManager.get("src/shaders/grid.frag"),
        side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(gridGeometry, this.gridMaterial);
    this.scene.add(mesh);
};

App.prototype.updateCircles = function updateCircles(time)
{
    var p = this.breadboard.mouseP || [0,0];
    var x = p[0];
    var y = p[1];


    x = (x / this.renderer.domElement.clientWidth) * 2 - 1;
    y = -((y / this.renderer.domElement.clientHeight) * 2 - 1);

    var v3 = new THREE.Vector3(x, y, 0.0);
    v3 = v3.applyMatrix4(this.breadboard.gameStage.invProjectionMatrix);

    x = v3.x;
    y = v3.y;

    var r = 0.5;

    var circles = this.circles;
    circles[0]  = x;
    circles[1]  = y;
    circles[2]  = r;
    circles[3]  = x;
    circles[4]  = y;
    circles[5]  = r;
    circles[6]  = x;
    circles[7]  = y;
    circles[8]  = r;
    circles[9]  = x;
    circles[10] = y;
    circles[11] = r;
    circles[12] = x;
    circles[13] = y;
    circles[14] = r;
    circles[15] = x;
    circles[16] = y;
    circles[17] = r;

    var circlesAttribute = this.circleGeometry.getAttribute('circle');
    circlesAttribute.dynamic = true;
    circlesAttribute.needsUpdate = true;
};

App.prototype.addCircles = function addCircles()
{
    var x = 10.0;
    var y = 10.0;
    var r = 1.0;

    var uvs = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0
    ]);

    this.circles = new Float32Array([
        x, y, r,
        x, y, r,
        x, y, r,

        x, y, r,
        x, y, r,
        x, y, r
    ]);

    var circleGeometry = this.circleGeometry = new THREE.BufferGeometry();
    circleGeometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    circleGeometry.addAttribute('circle', new THREE.BufferAttribute(this.circles, 3));
    circleGeometry.setDrawRange(0, 6);

    circleGeometry.boundingSphere = new THREE.Sphere();
    circleGeometry.boundingSphere.radius = 99999;

    this.circleMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: this.breadboard.gameStage.feather
        },
        vertexShader: ShaderManager.get("src/shaders/circle.vert"),
        fragmentShader: ShaderManager.get("src/shaders/circle.frag"),
        side: THREE.DoubleSide
    });
    this.circleMaterial.transparent = true;

    var mesh = new THREE.Mesh(circleGeometry, this.circleMaterial);
    this.scene.add(mesh);
};

App.prototype.postLoad = function postLoad()
{
    //var geometry = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5);

    var geometry = new THREE.BufferGeometry();

    var maxNumWires = 80000;
    var indicesArray = new Uint16Array(maxNumWires * 6);
    var verticesArray = new Uint8Array(maxNumWires * 8);
    var i;
    var index;
    var vertexIndex;
    var vertex;
    for (i = 0; i < maxNumWires; i += 1)
    {
        index = i * 6;
        vertexIndex = i * 4;
        indicesArray[index + 0] = vertexIndex + 0;
        indicesArray[index + 1] = vertexIndex + 1;
        indicesArray[index + 2] = vertexIndex + 2;
        indicesArray[index + 3] = vertexIndex + 2;
        indicesArray[index + 4] = vertexIndex + 3;
        indicesArray[index + 5] = vertexIndex + 0;

        vertex = i * 8;
        verticesArray[vertex + 0] = 0;
        verticesArray[vertex + 1] = 0;
        verticesArray[vertex + 2] = 1;
        verticesArray[vertex + 3] = 0;
        verticesArray[vertex + 4] = 1;
        verticesArray[vertex + 5] = 1;
        verticesArray[vertex + 6] = 0;
        verticesArray[vertex + 7] = 1;
    }

    var indices = new THREE.BufferAttribute(indicesArray, 1);

    var wires = [];
    wires.push(-5, -6, -4, -6);
    wires.push(0, 0, 0, 5);
    wires.push(0, 0, 5, 5);
    wires.push(5, 2, 2, 2);
    wires.push(-1, -1, 2, -4);
    wires.push(-5, -3, 5, -3);
    wires.push(-5, -5, 15, -5);

    // for (i = 0; i < 1000; i += 1)
    // {
    //     var l = (3 + Math.random() * 5) | 0;
    //     var x = (-500 + Math.random() * 1000) | 0;
    //     var y = 15 - 30 * Math.floor(i / 1000);
    //     var dx = Math.round(-1 + Math.random() * 2);
    //     var dy = Math.round(-1 + Math.random() * 2);
    //     if (!dx && !dy)
    //     {
    //         i -= 1;
    //         continue;
    //     }
    //     wires.push(x, y, x + dx * l, y + dy * l);
    // }

    var numWires = wires.length / 4;
    console.log(numWires);

    var p1s = new Int16Array(numWires * 12);
    var p2s = new Int16Array(numWires * 12);
    var wireIndex;

    var wireValueIndex = 0;
    for (i = 0; i < numWires; i += 1)
    {
        index = i * 12;
        wireIndex = i * 4;

        var wireLength = Math.max(Math.abs(wires[wireIndex + 0] - wires[wireIndex + 2]),
                                  Math.abs(wires[wireIndex + 1] - wires[wireIndex + 3]));
        var texture1 = wireValueIndex;
        wireValueIndex += wireLength;
        var texture2 = wireValueIndex;

        p1s[index + 0]  = wires[wireIndex + 0];
        p1s[index + 1]  = wires[wireIndex + 1];
        p1s[index + 2]  = texture1;
        p1s[index + 3]  = wires[wireIndex + 0];
        p1s[index + 4]  = wires[wireIndex + 1];
        p1s[index + 5]  = texture1;
        p1s[index + 6]  = wires[wireIndex + 0];
        p1s[index + 7]  = wires[wireIndex + 1];
        p1s[index + 8]  = texture1;
        p1s[index + 9]  = wires[wireIndex + 0];
        p1s[index + 10] = wires[wireIndex + 1];
        p1s[index + 11] = texture1;

        p2s[index + 0]  = wires[wireIndex + 2];
        p2s[index + 1]  = wires[wireIndex + 3];
        p2s[index + 2]  = texture2;
        p2s[index + 3]  = wires[wireIndex + 2];
        p2s[index + 4]  = wires[wireIndex + 3];
        p2s[index + 5]  = texture2;
        p2s[index + 6]  = wires[wireIndex + 2];
        p2s[index + 7]  = wires[wireIndex + 3];
        p2s[index + 8]  = texture2;
        p2s[index + 9]  = wires[wireIndex + 2];
        p2s[index + 10] = wires[wireIndex + 3];
        p2s[index + 11] = texture2;
    }

    var textureSize = wireValueIndex;
    var textureData = this.textureData = new Uint8Array(textureSize);
    for (i = 0; i < textureSize; i += 1)
    {
        textureData[i] = 255;
    }
    var dataTexture = this.dataTexture = new THREE.DataTexture(textureData, textureSize, 1, THREE.LuminanceFormat, THREE.UnsignedByteType);
    dataTexture.magFilter = THREE.NearestFilter;
    dataTexture.needsUpdate = true;

    geometry.setIndex(indices);
    geometry.addAttribute('position', new THREE.BufferAttribute(verticesArray, 2));
    geometry.addAttribute('p1', new THREE.BufferAttribute(p1s, 3));
    geometry.addAttribute('p2', new THREE.BufferAttribute(p2s, 3));
    geometry.setDrawRange(0, 6 * numWires);

    geometry.boundingSphere = new THREE.Sphere();
    geometry.boundingSphere.radius = 99999;

    var wireVertexShader = ShaderManager.get("src/shaders/wire.vert");
    var wireCirclesFragmentShader = ShaderManager.get("src/shaders/wirecirclesshader.frag");

    this.wireCirclesBgMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: this.breadboard.gameStage.feather,
            radius: { value: 0.4 },
            fg: { value: 0.0 },
            textureSize: {value : textureSize}
        },
        vertexShader: wireVertexShader,
        fragmentShader: wireCirclesFragmentShader,
        side: THREE.DoubleSide
    });
    this.wireCirclesBgMaterial.transparent = true;

    this.wireMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: this.breadboard.gameStage.feather,
            texture: {value : dataTexture},
            textureSize: {value : textureSize},
        },
        vertexShader: wireVertexShader,
        fragmentShader: ShaderManager.get("src/shaders/wire.frag"),
        side: THREE.DoubleSide
    });
    this.wireMaterial.transparent = true;

    this.wireCirclesFgMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: this.breadboard.gameStage.feather,
            radius: { value: 0.35 },
            fg: { value: 1.0 },
            textureSize: {value : textureSize}
        },
        vertexShader: wireVertexShader,
        fragmentShader: wireCirclesFragmentShader,
        side: THREE.DoubleSide
    });
    this.wireCirclesFgMaterial.transparent = true;

    var mesh;
    this.addGrid();
    mesh = new THREE.Mesh(geometry, this.wireCirclesBgMaterial);
    this.scene.add(mesh);
    mesh = new THREE.Mesh(geometry, this.wireMaterial);
    this.scene.add(mesh);
    mesh = new THREE.Mesh(geometry, this.wireCirclesFgMaterial);
    this.scene.add(mesh);

    this.addCircles();

    this.wireValueIndex = 0;
    this.nextWireValue = 0;

    var that = this;
    function animate(time)
    {
        time *= 0.001;  // seconds

        that.wireValueIndex += 1;
        if (that.wireValueIndex >= dataTexture.image.width)
        {
            that.wireValueIndex = 0;
            that.nextWireValue = that.nextWireValue ? 0 : 255;
        }

        that.textureData[that.wireValueIndex] = that.nextWireValue;
        dataTexture.needsUpdate = true;

        var canvas = that.canvas;
        var aspect = canvas.width / canvas.height;

        var gameStage = that.breadboard.gameStage;
        gameStage.update();
        var camera = gameStage.camera;

        that.gridMaterial.uniforms.box.value = [camera.left, camera.top, camera.right, camera.bottom];

        that.updateCircles(time);

        that.renderer.setScissor(10, 10, canvas.width - 100, canvas.height - 20);
        that.renderer.setScissorTest(true);
        that.renderer.render(that.scene, camera);
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
};

App.prototype.initWebGL = function initWebGL()
{
    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});

    this.scene = new THREE.Scene();
};

App.prototype.debugInfo = function debugInfo(str)
{
    this.debugMsg += str + "<br>";
    document.getElementById("debugText").innerHTML = this.debugMsg;
};

App.prototype.onError = function onError(message, source, lineno, colno, error)
{
    this.debugInfo("Error: " + source + ":" + lineno + " " + message);
};

App.prototype.save = function save()
{
    if (this.breadboard && this.breadboard.dirtySave)
    {
        var json = this.breadboard.toJson();
        this.breadboard.dirtySave = false;
        var jsonStr = JSON.stringify(json);
        window.localStorage.setItem("breadboard", jsonStr);
    }
};

var app = new App();
