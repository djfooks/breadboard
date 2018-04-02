
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
    if (TextureManager.loading())
    {
        return;
    }

    if (this.loading)
    {
        this.loading = false;
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

App.prototype.initWebGL = function initWebGL()
{
    // this.scene = new THREE.Scene();

    // this.geometry = new THREE.BoxBufferGeometry( 0.75, 0.75, 0.75 );

    // var mesh = new THREE.Mesh(this.geometry, this.material);

    // this.scene.add(mesh);

    // this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
    // this.renderer.setPixelRatio( window.devicePixelRatio );

    var  renderer = new THREE.WebGLRenderer({canvas: this.canvas});

    // There's no reason to set the aspect here because we're going
    // to set it every frame any

    var aspect = this.canvas.width / this.canvas.height;
    var frustumSize = 600;

    var  camera = new THREE.OrthographicCamera(-1, 1, -1, 1, 0, 5);
    camera.position.z = 2;

    var scene = new THREE.Scene();
    var geometry = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5);

    var vertexShaderStr = `
            varying vec2 vUv;
            void main()
            {
                vUv = uv;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
                gl_Position = projectionMatrix * mvPosition;
            }
    `;

    var fragmentShaderStr = `
            varying vec2 vUv;
            void main( void ) {
                gl_FragColor = vec4( 0.5 - vUv.y * 0.5, vUv.x, vUv.y, 1.0 );
            }
    `;

    var material = new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: vertexShaderStr,
        fragmentShader: fragmentShaderStr
    });

    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    var light1 = new THREE.PointLight(0xff80C0, 2, 0);
    light1.position.set(200, 100, 300);
    scene.add(light1);

    function animate(time)
    {
        time *= 0.001;  // seconds

        mesh.rotation.x = time * 0.5;
        mesh.rotation.y = time * 1;

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
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
