
var App = function ()
{
    window.onerror = this.onError.bind(this);
    this.debugText = "";
    this.pixiApp = new PIXI.Application(800, 600, { antialias: true });

    if (this.pixiApp.renderer.gl.canvas)
    {
        this.pixiApp.renderer.gl.canvas.oncontextmenu = function (e)
        {
            e.preventDefault();
        }
    }

    this.pixiApp.renderer.backgroundColor = 0xFFFFFF;
    var stage = this.pixiApp.stage;

    document.body.appendChild(this.pixiApp.view);

    this.fps = 30;
    this.intervalId = setInterval(this.update.bind(this), 1000 / this.fps);

    var top = 60;
    var left = 30;
    var spacing = 30;
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
        this.breadboard = Breadboard.createFromJson(stage, top, left, spacing, json);
    }
    else
    {
        var rows = 20;
        var cols = 20;
        this.breadboard = new Breadboard(stage, top, left, cols, rows, spacing);
        this.breadboard.addWire(0, 0, cols - 1, 0, false);
    }

    this.nextTick = 0;
    this.gameTick = 0;

    stage.interactive = true;
    stage.hitArea = new PIXI.Rectangle(0, 0, 1000, 1000);
    stage.mousedown = this.mousedown.bind(this, 0);
    stage.mouseup = this.mouseup.bind(this, 0);
    stage.mousemove = this.mousemove.bind(this);
    stage.touchstart = this.mousedown.bind(this, 0);
    stage.touchend = this.mouseup.bind(this, 0);
    stage.touchmove = this.mousemove.bind(this);
    stage.rightdown = this.mousedown.bind(this, 1);
    stage.rightup = this.mouseup.bind(this, 1);
};

App.prototype.mousedown = function mousedown(button, e)
{
    var event = e.data.originalEvent;
    this.breadboard.mousedown([event.layerX, event.layerY], button);
    return false;
};

App.prototype.mouseup = function mouseup(button, e)
{
    var event = e.data.originalEvent;
    this.breadboard.mouseup([event.layerX, event.layerY], button);
    return false;
};

App.prototype.mousemove = function mousemove(e)
{
    var event = e.data.originalEvent;
    this.breadboard.mousemove([event.layerX, event.layerY]);
};

App.prototype.update = function update()
{
    this.nextTick -= 1;
    if (this.nextTick < 0)
    {
        this.gameTick += 1;
        this.updateGame();
        this.nextTick = 30;
    }

    this.save();
    this.breadboard.update();
};

App.prototype.updateGame = function updateGame()
{
};

App.prototype.debugInfo = function debugInfo(str)
{
    this.debugMsg += str + "<br>";
    document.getElementById("debugText").innerHTML = this.debugMsg;
}

App.prototype.onError = function onError(message, source, lineno, colno, error)
{
    this.debugInfo("Error: " + source + ":" + lineno + " " + message);
}

App.prototype.save = function save()
{
    if (this.breadboard && this.breadboard.dirtySave)
    {
        var json = this.breadboard.toJson();
        this.breadboard.dirtySave = false;
        var jsonStr = JSON.stringify(json);
        window.localStorage.setItem("breadboard", jsonStr);
    }
}

new App();
