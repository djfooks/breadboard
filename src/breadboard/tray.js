
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
    this.switch = new SwitchComponent(this.breadboard, 0, 1);
    this.switch.p0 = [ 22, 2 ];
    this.switch.p1 = [ 22, 3 ];
    this.switch.updateContainer(this.breadboard);

    this.relay = new RelayComponent(this.breadboard, 0, 1, 2, 3);
    this.relay.outP0   = [ 22, 5 ];
    this.relay.baseP   = [ 22, 6 ];
    this.relay.outP1   = [ 22, 7 ];
    this.relay.signalP = [ 22, 8 ];
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
