
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

Tray.prototype.draw = function draw(ctx)
{
    var drawOptions = new DrawOptions(null);

    ctx.save();

    var z = 25;
    var left = 670;
    var top = 0;

    ctx.transform(z, 0, 0, z, left, top);

    // this.switch.draw(drawOptions, ctx, null, "#000000", "#FFFFFF");
    this.relay.draw(drawOptions, ctx, null, "#000000", "#FFFFFF");
    // this.diode.draw(drawOptions, ctx, null, "#000000", "#FFFFFF");

    ctx.restore();
};
