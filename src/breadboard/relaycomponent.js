
function RelayComponent(breadboard)
{
    this.p = [-1, -1];

    this.baseId = -1;
    this.baseP = [-1, -1];

    this.outId0 = -1;
    this.outP0 = [-1, -1];

    this.outId1 = -1;
    this.outP1 = [-1, -1];

    this.signalId = -1;
    this.signalP = [-1, -1];

    this.signalValue = false;
    this.bgDirty = true;
    this.canToggle = false;

    this.pulsePaths = [];

    var container = this.container = new PIXI.Container();
    breadboard.stage.addChild(container);

    container.interactive = true;
    container.mousedown = breadboard.onComponentMouseDown.bind(breadboard, this, 0);
    container.rightdown = breadboard.onComponentMouseDown.bind(breadboard, this, 1);
    container.mouseup = breadboard.onComponentMouseUp.bind(breadboard, this, 0);
    container.rightup = breadboard.onComponentMouseUp.bind(breadboard, this, 1);
}

RelayComponent.type = ComponentTypes.RELAY;

RelayComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.RELAY,
        p: this.outP0
    };
};

RelayComponent.prototype.stateFromJson = function stateFromJson(json)
{
};

RelayComponent.prototype.move = function move(breadboard, p)
{
    this.p = [p[0], p[1]];

    this.outP0 = [p[0], p[1]];
    this.outId0 = breadboard.getIndex(p[0], p[1]);

    this.baseP = [p[0], p[1] + 1];
    this.baseId = breadboard.getIndex(this.baseP[0], this.baseP[1]);

    this.outP1 = [p[0], p[1] + 2];
    this.outId1 = breadboard.getIndex(this.outP1[0], this.outP1[1]);

    this.signalP = [p[0], p[1] + 3];
    this.signalId = breadboard.getIndex(this.signalP[0], this.signalP[1]);

    this.bgDirty = true;
    this.canToggle = true;

    this.pulsePaths = [];

    var container = this.container;

    var left = breadboard.left;
    var top = breadboard.top;
    var spacing = breadboard.spacing;
    var border = spacing * 0.38;

    var width = this.signalP[0] - this.outP0[0];
    var height = this.signalP[1] - this.outP0[1];

    container.hitArea = new PIXI.Rectangle(
        left + this.outP0[0] * spacing - border,
        top  + this.outP0[1] * spacing - border,
        width * spacing + border * 2.0,
        height * spacing + border * 2.0);
};

RelayComponent.prototype.clone = function clone(breadboard)
{
    var newSwitch = new RelayComponent(breadboard);
    newSwitch.move(breadboard, this.outP0);
    return newSwitch;
};

RelayComponent.prototype.isValidPosition = function isValidPosition(breadboard, p)
{
    var isValid = true;
    isValid = isValid && !breadboard.pointHasComponent(p);
    isValid = isValid && !breadboard.pointHasComponent([p[0], p[1] + 1]);
    isValid = isValid && !breadboard.pointHasComponent([p[0], p[1] + 2]);
    isValid = isValid && !breadboard.pointHasComponent([p[0], p[1] + 3]);
    return isValid;
};

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

    var overrideColor = null;
    if (!fgGraphics)
    {
        fgGraphics = bgGraphics;
        overrideColor = 0xFFFFFF;
    }

    var color;
    var value0 = breadboard.getConnectionValue(this.outId0);
    color = overrideColor || breadboard.getWireColor(value0);
    fgGraphics.lineStyle(3, color, 1);
    fgGraphics.beginFill(color, 1);
    fgGraphics.drawCircle(left + outP0[0] * spacing, top + outP0[1] * spacing, 6);

    var valueBase = breadboard.getConnectionValue(this.baseId);
    color = overrideColor || breadboard.getWireColor(valueBase);
    fgGraphics.lineStyle(3, color, 1);
    fgGraphics.beginFill(color, 1);
    fgGraphics.drawCircle(left + baseP[0] * spacing, top + baseP[1] * spacing, 6);

    var value1 = breadboard.getConnectionValue(this.outId1);
    color = overrideColor || breadboard.getWireColor(value1);
    fgGraphics.lineStyle(3, color, 1);
    fgGraphics.beginFill(color, 1);
    fgGraphics.drawCircle(left + outP1[0] * spacing, top + outP1[1] * spacing, 6);

    var valueSignal = breadboard.getConnectionValue(this.signalId);
    color = overrideColor || breadboard.getWireColor(valueSignal);
    fgGraphics.lineStyle(3, color, 1);
    fgGraphics.beginFill(color, 1);
    fgGraphics.drawCircle(left + signalP[0] * spacing, top + signalP[1] * spacing, 6);

    fgGraphics.moveTo(left + baseP[0] * spacing, top + baseP[1] * spacing);
    if (this.signalValue)
    {
        color = overrideColor || breadboard.getWireColor(Math.min(value1, valueBase));
        fgGraphics.lineStyle(8, color, 1);
        fgGraphics.lineTo(left + outP1[0] * spacing, top + outP1[1] * spacing);
    }
    else
    {
        color = overrideColor || breadboard.getWireColor(Math.min(value0, valueBase));
        fgGraphics.lineStyle(8, color, 1);
        fgGraphics.lineTo(left + outP0[0] * spacing, top + outP0[1] * spacing);
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

RelayComponent.prototype.toggle = function toggle()
{
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
