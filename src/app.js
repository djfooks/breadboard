
var App = function ()
{
    window.onerror = this.onError.bind(this);
    this.debugText = "";
    this.pixiApp = new PIXI.Application(800, 600, { antialias: true });

    this.pixiApp.renderer.backgroundColor = 0xFFFFFF;
    var stage = this.pixiApp.stage;

    document.body.appendChild(this.pixiApp.view);

    var cancel = PIXI.Sprite.fromImage('/cancel.png');

    cancel.x = 300;
    cancel.y = 0;
    cancel.width = 30;
    cancel.height = 30;

    var colorMatrix = new PIXI.filters.ColorMatrixFilter();
    colorMatrix.matrix = [1, 0, 0, 0, 0,
                          0, 0, 0, 0, 0,
                          0, 0, 0, 0, 0,
                          0, 0, 0, 1, 0];

    cancel.filters = [colorMatrix];

    cancel.interactive = true;
    cancel.on("pointerdown", function ()
    {
        colorMatrix.matrix[6] = 1;
        colorMatrix.matrix[12] = 1;
    });

    stage.addChild(cancel);

    this.fps = 30;
    this.intervalId = setInterval(this.update.bind(this), 1000 / this.fps);

    var top = 40;
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
    }

    this.moneyText = new PIXI.Text('$');
    this.moneyText.x = 0;
    this.moneyText.y = 0;
    stage.addChild(this.moneyText);

    this.wiresText = new PIXI.Text('Wires: ');
    this.wiresText.x = 100;
    this.wiresText.y = 0;
    stage.addChild(this.wiresText);

    this.nextTick = 0;
    this.gameTick = 0;

    this.money = 0;
    this.wires = 0;

    stage.interactive = true;
    stage.hitArea = new PIXI.Rectangle(0, 0, 1000, 1000);
    stage.mousedown = this.mousedown.bind(this);
    stage.mouseup = this.mouseup.bind(this);
    stage.mousemove = this.mousemove.bind(this);
    stage.touchstart = this.mousedown.bind(this);
    stage.touchend = this.mouseup.bind(this);
    stage.touchmove = this.mousemove.bind(this);
};

App.prototype.mousedown = function mousedown(e)
{
    var event = e.data.originalEvent;
    this.breadboard.mousedown([event.layerX, event.layerY]);
};

App.prototype.mouseup = function mouseup(e)
{
    var event = e.data.originalEvent;
    this.breadboard.mouseup([event.layerX, event.layerY]);
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
    this.money += 1;

    this.moneyText.text = "$" + this.money;
    this.wiresText.text = "Wires: " + this.wires;
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
    if (this.breadboard && this.breadboard.dirty)
    {
        var json = this.breadboard.toJson();
        var jsonStr = JSON.stringify(json);
        window.localStorage.setItem("breadboard", jsonStr);
    }
}

new App();
