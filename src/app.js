
var testTexture;

var App = function ()
{
    window.onerror = this.onError.bind(this);
    this.debugText = "";

    this.canvas = document.getElementById("canvas");
    this.gl = this.canvas.getContext("webgl");

    if (!this.gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    this.initWebGL();

    this.stage = new Stage(this.canvas, this.renderer, this.scene);
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
    // TextureManager.request("jack-plug.png");
    // TextureManager.request("jack-plug-enabled.png");
    // TextureManager.request("cancel.png");
    // TextureManager.request("cancel-enabled.png");
    // TextureManager.request("move.png");
    // TextureManager.request("move-enabled.png");
    // TextureManager.request("truck.png");
    // TextureManager.request("truck-enabled.png");

    function mipmaps(texture)
    {
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = that.renderer.capabilities.getMaxAnisotropy();
    }

    var textureLoader = new THREE.TextureLoader();
    var texture = textureLoader.load("sourcecodepro-medium.png", mipmaps);
    testTexture = texture;

    ShaderManager.request("src/shaders/wire.vert");
    ShaderManager.request("src/shaders/wire.frag");
    ShaderManager.request("src/shaders/wirecirclesshader.vert");
    ShaderManager.request("src/shaders/wirecirclesshader.frag");
    ShaderManager.request("src/shaders/bus.vert");
    ShaderManager.request("src/shaders/bus.frag");
    ShaderManager.request("src/shaders/busdiamond.vert");
    ShaderManager.request("src/shaders/busdiamond.frag");
    ShaderManager.request("src/shaders/componentnode.vert");
    ShaderManager.request("src/shaders/componentnode.frag");
    ShaderManager.request("src/shaders/busnode.vert");
    ShaderManager.request("src/shaders/busnode.frag");
    ShaderManager.request("src/shaders/componentswitch.vert");
    ShaderManager.request("src/shaders/componentswitch.frag");
    ShaderManager.request("src/shaders/batterysymbol.vert");
    ShaderManager.request("src/shaders/batterysymbol.frag");
    ShaderManager.request("src/shaders/diodesymbol.vert");
    ShaderManager.request("src/shaders/diodesymbol.frag");
    ShaderManager.request("src/shaders/grid.vert");
    ShaderManager.request("src/shaders/grid.frag");
    ShaderManager.request("src/shaders/circle.vert");
    ShaderManager.request("src/shaders/circle.frag");
    ShaderManager.request("src/shaders/rectangle.vert");
    ShaderManager.request("src/shaders/rectangle.frag");
    ShaderManager.request("src/shaders/bmfont.vert");
    ShaderManager.request("src/shaders/bmfont.frag");

    JsonManager.request("sourcecodepro-medium.json");
};

App.prototype.update = function update()
{
    if (TextureManager.loading() ||
        ShaderManager.loading() ||
        JsonManager.loading())
    {
        return;
    }

    if (this.loading)
    {
        this.loading = false;
        //this.postLoad();
        this.breadboard.postLoad();
    }

    this.nextTick -= 1;
    if (this.nextTick < 0)
    {
        this.gameTick += 1;
        this.updateGame();
        this.nextTick = 30;
    }

    this.breadboard.update();
    this.save();
};

App.prototype.updateGame = function updateGame()
{

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
    this.addCircles();
};

App.prototype.initWebGL = function initWebGL()
{
    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
    this.renderer.autoClear = false;
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
