
function SwitchComponent(breadboard, id0, id1)
{
    this.id0 = id0;
    this.p0 = breadboard.getPositionFromIndex(id0);

    this.id1 = id1;
    this.p1 = breadboard.getPositionFromIndex(id1);

    this.connected = false;
    this.bgDirty = true;
    this.canToggle = true;

    this.pulsePaths = [];

    var container = this.container = new PIXI.Container();
    breadboard.stage.addChild(container);
    this.updateContainer(breadboard);

    container.interactive = true;
    container.mousedown = breadboard.onComponentMouseDown.bind(breadboard, this);
}

SwitchComponent.type = ComponentTypes.SWITCH;

SwitchComponent.prototype.updateContainer = function updateContainer(breadboard)
{
    var container = this.container;

    var left = breadboard.left;
    var top = breadboard.top;
    var spacing = breadboard.spacing;
    var border = spacing * 0.38;

    var width = this.p1[0] - this.p0[0];
    var height = this.p1[1] - this.p0[1];

    container.hitArea = new PIXI.Rectangle(
        left + this.p0[0] * spacing - border,
        top  + this.p0[1] * spacing - border,
        width * spacing + border * 2.0,
        height * spacing + border * 2.0);
};

SwitchComponent.prototype.draw = function draw(breadboard, bgGraphics, fgGraphics)
{
    var top = breadboard.top;
    var left = breadboard.left;
    var spacing = breadboard.spacing;
    var border = spacing * 0.38;

    var p0 = this.p0;
    var p1 = this.p1;

    if (true)//this.bgDirty || breadboard.dirty)
    {
        this.bgDirty = false;

        bgGraphics.lineStyle(6, 0x000000, 1);
        bgGraphics.beginFill(0x000000, 1);
        bgGraphics.drawCircle(left + p0[0] * spacing, top + p0[1] * spacing, 6);
        bgGraphics.drawCircle(left + p1[0] * spacing, top + p1[1] * spacing, 6);

        if (this.connected)
        {
            bgGraphics.lineStyle(11, 0x000000, 1);
            bgGraphics.moveTo(left + p0[0] * spacing, top + p0[1] * spacing);
            bgGraphics.lineTo(left + p1[0] * spacing, top + p1[1] * spacing);
        }

        bgGraphics.lineStyle(2, 0x000000, 1);
        bgGraphics.beginFill(0x000000, 0);
        bgGraphics.drawRect(left + p0[0] * spacing - border, top + p0[1] * spacing - border,
            border * 2, spacing + border * 2);
    }

    var overrideColor = null;
    if (!fgGraphics)
    {
        fgGraphics = bgGraphics;
        overrideColor = 0xFFFFFF;
    }

    var value0 = breadboard.connections[this.id0].getValue();
    var color;
    color = overrideColor || breadboard.getWireColor(value0);
    fgGraphics.lineStyle(3, color, 1);
    fgGraphics.beginFill(color, 1);
    fgGraphics.drawCircle(left + p0[0] * spacing, top + p0[1] * spacing, 6);

    var value1 = breadboard.connections[this.id1].getValue();
    color = overrideColor || breadboard.getWireColor(value1);
    fgGraphics.lineStyle(3, color, 1);
    fgGraphics.beginFill(color, 1);
    fgGraphics.drawCircle(left + p1[0] * spacing, top + p1[1] * spacing, 6);

    if (this.connected)
    {
        color = overrideColor || breadboard.getWireColor(Math.min(value0, value1));
        fgGraphics.lineStyle(8, color, 1);
        fgGraphics.moveTo(left + p0[0] * spacing, top + p0[1] * spacing);
        fgGraphics.lineTo(left + p1[0] * spacing, top + p1[1] * spacing);
    }
};

SwitchComponent.prototype.update = function update()
{
};

SwitchComponent.prototype.toggle = function toggle()
{
    this.connected = !this.connected;
    this.bgDirty = true;

    var i;
    for (i = 0; i < this.pulsePaths.length; i += 1)
    {
        var child = this.pulsePaths[i];
        if (this.connected)
        {
            var parent = child.parent;
            var parentStep = parent.idToStep[child.sourceId];
            child.createPulse(parent.values[parentStep]);
        }
        else
        {
            child.createPulse(0);
        }
    }
};

SwitchComponent.prototype.getConnections = function getConnections()
{
    return [this.id0, this.id1];
};

SwitchComponent.prototype.getOutputs = function getOutputs(id)
{
    if (id === this.id0)
    {
        return [this.id1];
    }
    else if (id === this.id1)
    {
        return [this.id0];
    }
    throw new Error();
};

SwitchComponent.prototype.isConnected = function isConnected(id0, id1)
{
    if (!this.connected)
    {
        return false;
    }
    if (id0 === this.id0 && id1 === this.id1)
    {
        return true;
    }
    else if (id0 === this.id1 && id1 === this.id0)
    {
        return true;
    }
    throw new Error();
};
