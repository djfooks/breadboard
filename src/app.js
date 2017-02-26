
var App = function ()
{
    this.pixiApp = new PIXI.Application(800, 600, { antialias: true });

    this.pixiApp.renderer.backgroundColor = 0xFFFFFF;
    var stage = this.pixiApp.stage;

    document.body.appendChild(this.pixiApp.view);

    this.fps = 30;
    this.intervalId = setInterval(this.update.bind(this), 1000 / this.fps);

    var top = 30;
    var left = 30;
    var rows = 20;
    var cols = 20;
    var spacing = 20;
    this.breadboard = new Breadboard(stage, top, left, cols, rows, spacing);

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
    stage.click = this.click.bind(this);
};

App.prototype.click = function click(e)
{
    var event = e.data.originalEvent;
    this.breadboard.click([event.layerX, event.layerY]);
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

    this.breadboard.update();
};

App.prototype.updateGame = function updateGame()
{
    this.money += 1;

    this.moneyText.text = "$" + this.money;
    this.wiresText.text = "Wires: " + this.wires;
};

new App();
