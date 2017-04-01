
function RelayComponent(breadboard, outId0, baseId, outId1, signalId)
{
    this.baseId = baseId;
    this.baseP = breadboard.getPositionFromIndex(baseId);

    this.outId0 = outId0;
    this.outP0 = breadboard.getPositionFromIndex(outId0);

    this.outId1 = outId1;
    this.outP1 = breadboard.getPositionFromIndex(outId1);

    this.signalId = signalId;
    this.signalP = breadboard.getPositionFromIndex(signalId);

    this.signalValue = false;
    this.bgDirty = true;
    this.canToggle = false;

    this.pulsePaths = [];
}

RelayComponent.prototype.draw = function draw(breadboard, bgGraphics, fgGraphics)
{
    var top = breadboard.top;
    var left = breadboard.left;
    var spacing = breadboard.spacing;
    var boarder = spacing * 0.38;

    var baseP = this.baseP;
    var outP0 = this.outP0;
    var outP1 = this.outP1;
    var signalP = this.signalP;

    if (true)//this.bgDirty || breadboard.dirty)
    {
        this.bgDirty = false;

        bgGraphics.lineStyle(6, 0x000000, 1);
        bgGraphics.beginFill(0x000000, 1);
        bgGraphics.drawCircle(left + baseP[0] * spacing, top + baseP[1] * spacing, 6);
        bgGraphics.drawCircle(left + outP0[0] * spacing, top + outP0[1] * spacing, 6);
        bgGraphics.drawCircle(left + outP1[0] * spacing, top + outP1[1] * spacing, 6);

        bgGraphics.lineStyle(6, 0x00FF00, 1);
        bgGraphics.beginFill(0x00FF00, 1);
        bgGraphics.drawCircle(left + signalP[0] * spacing, top + signalP[1] * spacing, 6);

        bgGraphics.lineStyle(11, 0x000000, 1);
        bgGraphics.moveTo(left + baseP[0] * spacing, top + baseP[1] * spacing);
        if (this.signalValue)
        {
            bgGraphics.lineTo(left + outP1[0] * spacing, top + outP1[1] * spacing);
        }
        else
        {
            bgGraphics.lineTo(left + outP0[0] * spacing, top + outP0[1] * spacing);
        }

        bgGraphics.lineStyle(2, 0x000000, 1);
        bgGraphics.beginFill(0x000000, 0);
        bgGraphics.drawRect(left + outP0[0] * spacing - boarder, top + outP0[1] * spacing - boarder,
            boarder * 2, spacing * 3 + boarder * 2);
    }

    var color;
    var value0 = breadboard.connections[this.outId0].getValue();
    color = breadboard.getWireColor(value0);
    bgGraphics.lineStyle(3, color, 1);
    bgGraphics.beginFill(color, 1);
    bgGraphics.drawCircle(left + outP0[0] * spacing, top + outP0[1] * spacing, 6);

    var valueBase = breadboard.connections[this.baseId].getValue();
    color = breadboard.getWireColor(valueBase);
    bgGraphics.lineStyle(3, color, 1);
    bgGraphics.beginFill(color, 1);
    bgGraphics.drawCircle(left + baseP[0] * spacing, top + baseP[1] * spacing, 6);

    var value1 = breadboard.connections[this.outId1].getValue();
    color = breadboard.getWireColor(value1);
    bgGraphics.lineStyle(3, color, 1);
    bgGraphics.beginFill(color, 1);
    bgGraphics.drawCircle(left + outP1[0] * spacing, top + outP1[1] * spacing, 6);

    var valueSignal = breadboard.connections[this.signalId].getValue();
    color = breadboard.getWireColor(valueSignal);
    bgGraphics.lineStyle(3, color, 1);
    bgGraphics.beginFill(color, 1);
    bgGraphics.drawCircle(left + signalP[0] * spacing, top + signalP[1] * spacing, 6);

    bgGraphics.moveTo(left + baseP[0] * spacing, top + baseP[1] * spacing);
    if (this.signalValue)
    {
        color = breadboard.getWireColor(Math.min(value1, valueBase));
        bgGraphics.lineStyle(8, color, 1);
        bgGraphics.lineTo(left + outP1[0] * spacing, top + outP1[1] * spacing);
    }
    else
    {
        color = breadboard.getWireColor(Math.min(value0, valueBase));
        bgGraphics.lineStyle(8, color, 1);
        bgGraphics.lineTo(left + outP0[0] * spacing, top + outP0[1] * spacing);
    }
};

RelayComponent.prototype.update = function update(breadboard)
{
    var signalValue = breadboard.connections[this.signalId].isOn();
    if (this.signalValue === signalValue)
    {
        return;
    }
    this.signalValue = signalValue;
    this.bgDirty = true;

    var i;
    for (i = 0; i < this.pulsePaths.length; i += 1)
    {
        var child = this.pulsePaths[i];
        var parent = child.parent;
        var parentInputId = child.sourceId;

        var isBase0Connection;
        if (parentInputId === this.baseId)
        {
            isBase0Connection = (child.inputId === this.outId0);
        }
        else if (parentInputId === this.outId0)
        {
            isBase0Connection = (child.inputId === this.baseId);
        }
        else if (parentInputId === this.outId1)
        {
            isBase0Connection = false;
        }
        else
        {
            throw new Error();
        }

        if (signalValue === isBase0Connection)
        {
            child.createPulse(0);
        }
        else
        {
            var parentStep = parent.idToStep[parentInputId];
            child.createPulse(parent.values[parentStep]);
        }
    }
};

RelayComponent.prototype.getConnections = function getConnections()
{
    return [this.baseId, this.outId0, this.outId1, this.signalId];
};

RelayComponent.prototype.getOutputs = function getOutputs(id)
{
    if (id === this.baseId)
    {
        return [this.outId0, this.outId1];
    }
    if (id === this.outId0 || id === this.outId1)
    {
        return [this.baseId];
    }
    if (id === this.signalId)
    {
        return [];
    }
    throw new Error();
};

RelayComponent.prototype.isConnected = function isConnected(id0, id1)
{
    if (this.signalValue)
    {
        if (id0 === this.baseId && id1 === this.outId1)
        {
            return true;
        }
        if (id1 === this.baseId && id0 === this.outId1)
        {
            return true;
        }
    }
    else
    {
        if (id0 === this.baseId && id1 === this.outId0)
        {
            return true;
        }
        if (id1 === this.baseId && id0 === this.outId0)
        {
            return true;
        }
    }
    return false;
};
