
function Tray(breadboard)
{
    this.breadboard = breadboard;

    var graphicsBg = this.graphicsBg = new PIXI.Graphics();
    var graphicsFg = this.graphicsFg = new PIXI.Graphics();

    breadboard.stage.addChild(graphicsBg);
    breadboard.stage.addChild(graphicsFg);

    this.resetComponents();
}

Tray.prototype.resetComponents = function resetComponents()
{
    this.switch = new SwitchComponent(this.breadboard);
    this.switch.move(this.breadboard, [22, 2]);

    this.relay = new RelayComponent(this.breadboard, 0, 1, 2, 3);
    this.relay.outP0   = [ 22, 5 ];
    this.relay.baseP   = [ 22, 6 ];
    this.relay.outP1   = [ 22, 7 ];
    this.relay.signalP = [ 22, 8 ];
};

Tray.prototype.isFromTray = function isFromTray(component)
{
    var fromTray = false;
    fromTray = fromTray || (component === this.switch);
    fromTray = fromTray || (component === this.relay);
    return fromTray;
};

Tray.prototype.draw = function draw()
{
    var breadboard = this.breadboard;
    var graphicsBg = this.graphicsBg;

    graphicsBg.lineStyle(1, 0x000000, 1);

    var left = breadboard.left;
    var top = breadboard.top;
    var cols = breadboard.cols;
    var rows = breadboard.rows;
    var spacing = breadboard.spacing;

    var x = left + cols * spacing;
    var bottom = top + rows * spacing;

    graphicsBg.moveTo(x, 0);
    graphicsBg.lineTo(x, bottom);

    this.switch.draw(breadboard, graphicsBg);
    this.relay.draw(breadboard, graphicsBg);
};
