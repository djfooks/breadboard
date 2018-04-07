
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

    this.filesLoading = 0;
};

App.prototype.update = function update()
{
    if (TextureManager.loading() ||
        this.filesLoading > 0)
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

App.prototype.loadFile = function loadFile(url, onLoad, onProgress, onError) {
    this.filesLoading += 1;

    var vertex_loader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    vertex_loader.setResponseType('text');
    vertex_loader.load(url, function (text)
    {
        onLoad(text);
        this.filesLoading -= 1;
    }, onProgress, onError);
};

App.prototype.postLoad = function postLoad()
{
    //var geometry = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5);

    var geometry = new THREE.BufferGeometry();

    var maxNumWires = 100;
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
    wires.push(0, 0, 0, 5);
    wires.push(0, 0, 5, 5);
    wires.push(5, 2, 2, 2);
    wires.push(-1, -1, 2, -4);

    var numWires = wires.length / 4;

    var p1s = new Int16Array(numWires * 8);
    var p2s = new Int16Array(numWires * 8);
    var wireIndex;

    for (i = 0; i < numWires; i += 1)
    {
        index = i * 8;
        wireIndex = i * 4;
        p1s[index + 0] = wires[wireIndex + 0];
        p1s[index + 1] = wires[wireIndex + 1];
        p1s[index + 2] = wires[wireIndex + 0];
        p1s[index + 3] = wires[wireIndex + 1];
        p1s[index + 4] = wires[wireIndex + 0];
        p1s[index + 5] = wires[wireIndex + 1];
        p1s[index + 6] = wires[wireIndex + 0];
        p1s[index + 7] = wires[wireIndex + 1];

        p2s[index + 0] = wires[wireIndex + 2];
        p2s[index + 1] = wires[wireIndex + 3];
        p2s[index + 2] = wires[wireIndex + 2];
        p2s[index + 3] = wires[wireIndex + 3];
        p2s[index + 4] = wires[wireIndex + 2];
        p2s[index + 5] = wires[wireIndex + 3];
        p2s[index + 6] = wires[wireIndex + 2];
        p2s[index + 7] = wires[wireIndex + 3];
    }

    geometry.setIndex(indices);
    geometry.addAttribute('position', new THREE.BufferAttribute(verticesArray, 2));
    geometry.addAttribute('p1', new THREE.BufferAttribute(p1s, 2));
    geometry.addAttribute('p2', new THREE.BufferAttribute(p2s, 2));
    geometry.setDrawRange(0, 6 * numWires);

    geometry.boundingSphere = new THREE.Sphere();
    geometry.boundingSphere.radius = 99999;

    this.wireCirclesBgMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            radius: { value: 0.4 },
            color: { value: 0.0 }
        },
        vertexShader: this.vertexShader,
        fragmentShader: this.wireCirclesFragmentShader,
        side: THREE.DoubleSide
    });
    this.wireCirclesBgMaterial.transparent = true;

    this.wireMaterial = new THREE.RawShaderMaterial({
        uniforms: {},
        vertexShader: this.vertexShader,
        fragmentShader: this.fragmentShader,
        side: THREE.DoubleSide
    });
    this.wireMaterial.transparent = true;

    this.wireCirclesFgMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            radius: { value: 0.35 },
            color: { value: 1.0 }
        },
        vertexShader: this.vertexShader,
        fragmentShader: this.wireCirclesFragmentShader,
        side: THREE.DoubleSide
    });
    this.wireCirclesFgMaterial.transparent = true;

    var mesh;
    mesh = new THREE.Mesh(geometry, this.wireCirclesBgMaterial);
    this.scene.add(mesh);
    mesh = new THREE.Mesh(geometry, this.wireMaterial);
    this.scene.add(mesh);
    mesh = new THREE.Mesh(geometry, this.wireCirclesFgMaterial);
    this.scene.add(mesh);

    var that = this;
    function animate(time)
    {
        time *= 0.001;  // seconds

        that.renderer.render(that.scene, that.camera);
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
};

App.prototype.initWebGL = function initWebGL()
{
    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});

    var aspect = canvas.width / canvas.height;
    this.camera = new THREE.OrthographicCamera(-10 * aspect, 10 * aspect, -10, 10, 0, 100);
    this.camera.position.z = 100;

    this.scene = new THREE.Scene();

    var that = this;
    this.vertexShader = "";
    this.fragmentShader = "";
    this.wireCirclesFragmentShader = "";
    this.loadFile("src/shaders/shader.vert", function (text)
    {
        that.vertexShader = text;
    });
    this.loadFile("src/shaders/shader.frag", function (text)
    {
        that.fragmentShader = text;
    });
    this.loadFile("src/shaders/wireCirclesShader.frag", function (text)
    {
        that.wireCirclesFragmentShader = text;
    });
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
