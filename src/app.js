
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

    ColorPalette.createPaletteTextures();

    this.stage = new Stage(this.canvas, this.renderer, this.scene);
    this.stage.enable();

    this.fps = 30;
    this.intervalId = setInterval(this.update.bind(this), 1000 / this.fps);

    this.vueApp = new VueApp(this.breadboard);

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
        this.breadboard = Breadboard.createFromJson(this.vueApp, this.stage, top, left, json);
    }
    else
    {
        var rows = 1001;
        var cols = 1001;
        this.breadboard = new Breadboard(this.vueApp, this.stage, top, left, cols, rows);
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

    TextureManager.init(this.renderer);

    TextureManager.request("sourcecodepro-medium.png", { mipmaps: true });
    TextureManager.request("tinker.png", { mipmaps: true });
    TextureManager.request("arrow-cursor.png", { mipmaps: true });

    ShaderManager.request("src/shaders/batterysymbol.frag");
    ShaderManager.request("src/shaders/batterysymbol.vert");
    ShaderManager.request("src/shaders/bmfont.frag");
    ShaderManager.request("src/shaders/bmfont.vert");
    ShaderManager.request("src/shaders/bus.frag");
    ShaderManager.request("src/shaders/bus.vert");
    ShaderManager.request("src/shaders/busdiamond.frag");
    ShaderManager.request("src/shaders/busdiamond.vert");
    ShaderManager.request("src/shaders/busnode.frag");
    ShaderManager.request("src/shaders/busnode.vert");
    ShaderManager.request("src/shaders/busselection.frag");
    ShaderManager.request("src/shaders/circle.frag");
    ShaderManager.request("src/shaders/circle.vert");
    ShaderManager.request("src/shaders/componentnode.frag");
    ShaderManager.request("src/shaders/componentnode.vert");
    ShaderManager.request("src/shaders/componentswitch.frag");
    ShaderManager.request("src/shaders/componentswitch.vert");
    ShaderManager.request("src/shaders/diodesymbol.frag");
    ShaderManager.request("src/shaders/diodesymbol.vert");
    ShaderManager.request("src/shaders/grid.frag");
    ShaderManager.request("src/shaders/grid.vert");
    ShaderManager.request("src/shaders/line.frag");
    ShaderManager.request("src/shaders/line.vert");
    ShaderManager.request("src/shaders/rectangle.frag");
    ShaderManager.request("src/shaders/rectangle.vert");
    ShaderManager.request("src/shaders/roundedline.frag");
    ShaderManager.request("src/shaders/roundedline.vert");
    ShaderManager.request("src/shaders/selectionline.frag");
    ShaderManager.request("src/shaders/selectionline.vert");
    ShaderManager.request("src/shaders/sprite.frag");
    ShaderManager.request("src/shaders/sprite.vert");
    ShaderManager.request("src/shaders/wire.frag");
    ShaderManager.request("src/shaders/wire.vert");
    ShaderManager.request("src/shaders/wirecirclesshader.frag");
    ShaderManager.request("src/shaders/wirecirclesshader.vert");

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
        this.nextTick = 3;
    }

    this.breadboard.update();
    this.breadboard.update();
    this.breadboard.draw();
    this.save();
};

App.prototype.updateGame = function updateGame()
{

};

App.prototype.postLoad = function postLoad()
{
    this.addCircles();
};

App.prototype.initWebGL = function initWebGL()
{
    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
    this.renderer.autoClear = false;
    this.renderer.sortObjects = true;
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
