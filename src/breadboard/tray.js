
function Tray(breadboard)
{
    this.breadboard = breadboard;

    this.resetComponents();
}

Tray.prototype.resetComponents = function resetComponents()
{
    this.switch = new SwitchComponent(this.breadboard);
    this.breadboard.stage.addHitbox(this.switch.hitbox);
    this.switch.move(this.breadboard, [22, 4], 0);

    this.relay = new RelayComponent(this.breadboard);
    this.breadboard.stage.addHitbox(this.relay.hitbox);
    this.relay.move(this.breadboard, [22, 7], 0);

    this.diode = new DiodeComponent(this.breadboard);
    this.breadboard.stage.addHitbox(this.diode.hitbox);
    this.diode.move(this.breadboard, [22, 12], 0);
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
    var spacing = breadboard.spacing;

    var x = left + cols * spacing;
    var bottom = top + rows * spacing;

    ctx.moveTo(x, 0);
    ctx.lineTo(x, bottom);

    this.switch.draw(breadboard, ctx, null, "#000000", "#FFFFFF");
    this.relay.draw(breadboard, ctx, null, "#000000", "#FFFFFF");
    this.diode.draw(breadboard, ctx, null, "#000000", "#FFFFFF");
};
