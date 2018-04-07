
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
};

App.prototype.update = function update()
{
    if (TextureManager.loading() ||
        this.shadersLoading > 0)
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

App.prototype.loadShader = function loadShader(vertex_url, fragment_url, onLoad, onProgress, onError) {
    this.shadersLoading += 1;

    var vertex_loader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    vertex_loader.setResponseType('text');
    vertex_loader.load(vertex_url, function (vertex_text)
    {
        var fragment_loader = new THREE.FileLoader(THREE.DefaultLoadingManager);
        fragment_loader.setResponseType('text');
        fragment_loader.load(fragment_url, function (fragment_text)
        {
            onLoad(vertex_text, fragment_text);
            this.shadersLoading -= 1;
        });
    }, onProgress, onError);
};

App.prototype.postLoad = function postLoad()
{
    //var geometry = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5);

    var geometry = new THREE.BufferGeometry();
    var h = 5;
    var vertices = new Float32Array([
        -h, -h,
         h, -h,
         h,  h,

         h,  h,
        -h,  h,
        -h, -h
    ]);

    var uvs = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
         1.0,  1.0,

         1.0,  1.0,
        -1.0,  1.0,
        -1.0, -1.0
    ]);

    var p1s = new Float32Array([
         1.0,  1.0,
         1.0,  1.0,
         1.0,  1.0,

         1.0,  1.0,
         1.0,  1.0,
         1.0,  1.0
    ]);

    var p2s = new Float32Array([
         0.0,  0.0,
         0.0,  0.0,
         0.0,  0.0,

         0.0,  0.0,
         0.0,  0.0,
         0.0,  0.0
    ]);

    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 2));
    geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.addAttribute('p1', new THREE.BufferAttribute(p1s, 2));
    geometry.addAttribute('p2', new THREE.BufferAttribute(p2s, 2));

    geometry.boundingSphere = new THREE.Sphere();
    geometry.boundingSphere.radius = 99999;

    this.material = new THREE.RawShaderMaterial({
        uniforms: {},
        vertexShader: this.vertexShader,
        fragmentShader: this.fragmentShader,
        side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geometry, this.material);
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
    this.loadShader("src/shaders/shader.vert", "src/shaders/shader.frag", function (vertex_text, fragment_text)
    {
        that.vertexShader = vertex_text;
        that.fragmentShader = fragment_text;
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
