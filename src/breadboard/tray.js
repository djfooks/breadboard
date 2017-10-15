
function Tray(breadboard)
{
    this.breadboard = breadboard;

    this.gameStage = new GameStage(0, 0, 99999, 99999);

    this.zoomLevel = 1;
    this.zoom = 1;

    this.resetComponents();
}

Tray.prototype.resetComponents = function resetComponents()
{
    this.switch = new SwitchComponent(this.breadboard);
    this.breadboard.stage.addHitbox(this.switch.hitbox);
    this.switch.move(this.breadboard, [0, 4], 0);

    this.relay = new RelayComponent(this.breadboard);
    this.breadboard.stage.addHitbox(this.relay.hitbox);
    this.relay.move(this.breadboard, [0, 7], 0);

    this.diode = new DiodeComponent(this.breadboard);
    this.breadboard.stage.addHitbox(this.diode.hitbox);
    this.diode.move(this.breadboard, [0, 12], 0);
};

Tray.prototype.isFromTray = function isFromTray(component)
{
    var fromTray = false;
    fromTray = fromTray || (component === this.switch);
    fromTray = fromTray || (component === this.relay);
    fromTray = fromTray || (component === this.diode);
    return fromTray;
};

Tray.prototype.draw = function draw(breadboard, ctx)
{
    ctx.strokeStyle = "#000000";

    var left = breadboard.left;
    var top = breadboard.top;
    var cols = breadboard.cols;
    var rows = breadboard.rows;
    var spacing = breadboard.zoom0Spacing;

    var drawOptions = new DrawOptions(null, spacing, 1);
    drawOptions.top = 30;
    drawOptions.left = 670;

    var x = left + cols * spacing;
    var bottom = top + rows * spacing;

    ctx.moveTo(x, 0);
    ctx.lineTo(x, bottom);

    this.switch.draw(drawOptions, ctx, null, "#000000", "#FFFFFF", this.gameStage);
    this.relay.draw(drawOptions, ctx, null, "#000000", "#FFFFFF", this.gameStage);
    this.diode.draw(drawOptions, ctx, null, "#000000", "#FFFFFF", this.gameStage);
};
