
function SwitchComponent(breadboard, id0, id1)
{
    this.id0 = id0;
    this.p0 = breadboard.getPositionFromIndex(id0);

    this.id1 = id1;
    this.p1 = breadboard.getPositionFromIndex(id1);

    this.fgGraphics = new PIXI.Graphics();
    this.bgGraphics = new PIXI.Graphics();

    breadboard.componentsContainer.addChild(this.bgGraphics);
    breadboard.componentsContainer.addChild(this.fgGraphics);

    this.connected = false;
    this.bgDirty = true;

    this.pulsePaths = [];
}

SwitchComponent.prototype.draw = function draw(breadboard)
{
    var bgGraphics = this.bgGraphics;
    var fgGraphics = this.fgGraphics;
    var top = breadboard.top;
    var left = breadboard.left;
    var spacing = breadboard.spacing;
    var boarder = spacing * 0.38;

    var p0 = this.p0;
    var p1 = this.p1;

    if (this.bgDirty)
    {
        this.bgDirty = false;
        bgGraphics.clear();

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
        bgGraphics.drawRect(left + p0[0] * spacing - boarder, top + p0[1] * spacing - boarder,
            boarder * 2, spacing + boarder * 2);
    }

    fgGraphics.clear();

    var value0 = breadboard.connections[this.id0].getValue();
    var color;
    color = breadboard.getWireColor(value0);
    bgGraphics.lineStyle(3, color, 1);
    bgGraphics.beginFill(color, 1);
    bgGraphics.drawCircle(left + p0[0] * spacing, top + p0[1] * spacing, 6);

    var value1 = breadboard.connections[this.id1].getValue();
    color = breadboard.getWireColor(value1);
    bgGraphics.lineStyle(3, color, 1);
    bgGraphics.beginFill(color, 1);
    bgGraphics.drawCircle(left + p1[0] * spacing, top + p1[1] * spacing, 6);

    if (this.connected)
    {
        color = breadboard.getWireColor(Math.min(value0, value1));
        bgGraphics.lineStyle(8, color, 1);
        bgGraphics.moveTo(left + p0[0] * spacing, top + p0[1] * spacing);
        bgGraphics.lineTo(left + p1[0] * spacing, top + p1[1] * spacing);
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
