
function DiodeComponent(breadboard, id0, id1)
{
    this.id0 = id0;
    this.p0 = breadboard.getPositionFromIndex(id0);

    this.id1 = id1;
    this.p1 = breadboard.getPositionFromIndex(id1);

    this.bgDirty = true;
    this.canToggle = true;

    this.pulsePaths = [];
}

DiodeComponent.prototype.draw = function draw(breadboard)
{
    var bgGraphics = breadboard.componentsBgGraphics;
    var fgGraphics = breadboard.componentsFgGraphics;
    var top = breadboard.top;
    var left = breadboard.left;
    var spacing = breadboard.spacing;
    var boarder = spacing * 0.38;

    var p0 = this.p0;
    var p1 = this.p1;

    if (true)//this.bgDirty || breadboard.dirty)
    {
        this.bgDirty = false;

        bgGraphics.lineStyle(6, 0x000000, 1);
        bgGraphics.beginFill(0x000000, 1);
        bgGraphics.drawCircle(left + p0[0] * spacing, top + p0[1] * spacing, 6);
        bgGraphics.drawCircle(left + p1[0] * spacing, top + p1[1] * spacing, 6);

        bgGraphics.lineStyle(11, 0x000000, 1);
        bgGraphics.moveTo(left + p0[0] * spacing, top + p0[1] * spacing);
        bgGraphics.lineTo(left + p1[0] * spacing, top + p1[1] * spacing);

        bgGraphics.lineStyle(4, 0x000000, 1);
        var midY = top + (p0[1] + p1[1]) * 0.5 * spacing;
        bgGraphics.moveTo(left + p0[0] * spacing - boarder, midY);
        bgGraphics.lineTo(left + p1[0] * spacing + boarder, midY);
        bgGraphics.lineTo(left + p1[0] * spacing, top + p1[1] * spacing);

        bgGraphics.lineStyle(2, 0x000000, 1);
        bgGraphics.beginFill(0x000000, 0);
        bgGraphics.drawRect(left + p0[0] * spacing - boarder, top + p0[1] * spacing - boarder,
            boarder * 2, spacing + boarder * 2);
    }


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

    color = breadboard.getWireColor(Math.min(value0, value1));
    bgGraphics.lineStyle(8, color, 1);
    bgGraphics.moveTo(left + p0[0] * spacing, top + p0[1] * spacing);
    bgGraphics.lineTo(left + p1[0] * spacing, top + p1[1] * spacing);
};

DiodeComponent.prototype.update = function update()
{
};

DiodeComponent.prototype.toggle = function toggle()
{
    this.connected = !this.connected;
    this.bgDirty = true;

    var i;
    for (i = 0; i < this.pulsePaths.length; i += 1)
    {
        var child = this.pulsePaths[i];
        var parent = child.parent;
        var parentStep = parent.idToStep[child.sourceId];
        child.createPulse(parent.values[parentStep]);
    }
};

DiodeComponent.prototype.getConnections = function getConnections()
{
    return [this.id0, this.id1];
};

DiodeComponent.prototype.getOutputs = function getOutputs(id)
{
    if (id === this.id0)
    {
        return [this.id1];
    }
    else if (id === this.id1)
    {
        return [];
    }
    throw new Error();
};

DiodeComponent.prototype.isConnected = function isConnected(id0, id1)
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
        return false;
    }
    throw new Error();
};
