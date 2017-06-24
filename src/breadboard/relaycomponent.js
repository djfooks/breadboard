
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

    Component.addHitbox(breadboard, this);
}

RelayComponent.type = ComponentTypes.RELAY;

RelayComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.RELAY,
        p: this.p,
        rotation: this.rotation
    };
};

RelayComponent.prototype.stateFromJson = function stateFromJson(json)
{
};

RelayComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    var matrix = RotationMatrix[this.rotation];
    this.p = [p[0], p[1]];

    this.outP0 = [p[0], p[1]];
    this.outId0 = breadboard.getIndex(p[0], p[1]);

    this.baseP = AddTransformedVector(p, matrix, [0, 1]);
    this.baseId = breadboard.getIndex(this.baseP[0], this.baseP[1]);

    this.outP1 = AddTransformedVector(p, matrix, [0, 2]);
    this.outId1 = breadboard.getIndex(this.outP1[0], this.outP1[1]);

    this.signalP = AddTransformedVector(p, matrix, [0, 3]);
    this.signalId = breadboard.getIndex(this.signalP[0], this.signalP[1]);

    this.bgDirty = true;
    this.canToggle = true;

    this.pulsePaths = [];
    Component.updateHitbox(breadboard, this, p, [0, 3]);
};

RelayComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new RelayComponent(breadboard);
    cloneComponent.move(breadboard, this.p, this.rotation);
    return cloneComponent;
};

RelayComponent.prototype.isValidPosition = function isValidPosition(breadboard, p, rotation)
{
    var rotationMatrix = RotationMatrix[rotation];

    var p0Component = breadboard.getComponent(p);
    var p1Component = breadboard.getComponent(AddTransformedVector(p, rotationMatrix, [0, 1]));
    var p2Component = breadboard.getComponent(AddTransformedVector(p, rotationMatrix, [0, 2]));
    var p3Component = breadboard.getComponent(AddTransformedVector(p, rotationMatrix, [0, 3]));

    var isValid = true;
    isValid = isValid && (!p0Component || p0Component === this);
    isValid = isValid && (!p1Component || p1Component === this);
    isValid = isValid && (!p2Component || p2Component === this);
    isValid = isValid && (!p3Component || p3Component === this);
    return isValid;
};

RelayComponent.prototype.draw = function draw(breadboard, ctx, p, bgColor, fgColor)
{
    var top = breadboard.top;
    var left = breadboard.left;
    var spacing = breadboard.spacing;

    if (!p)
    {
        p = [left + this.p[0] * spacing, top + this.p[1] * spacing];
    }

    var rotationMatrix = RotationMatrix[this.rotation];

    var outP0 = this.outP0;
    var baseP = this.baseP;
    var outP1 = this.outP1;
    var signalP = this.signalP;

    var screenOutP0 = p;
    var screenBaseP = AddTransformedVector(p, rotationMatrix, [0, spacing]);
    var screenOutP1 = AddTransformedVector(p, rotationMatrix, [0, spacing * 2.0]);
    var screenSignalP = AddTransformedVector(p, rotationMatrix, [0, spacing * 3.0]);

    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 6;
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(screenOutP0[0], screenOutP0[1], 6, 0, Math.PI * 2);
    ctx.moveTo(screenBaseP[0], screenBaseP[1]);
    ctx.arc(screenBaseP[0], screenBaseP[1], 6, 0, Math.PI * 2);
    ctx.moveTo(screenOutP1[0], screenOutP1[1]);
    ctx.arc(screenOutP1[0], screenOutP1[1], 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#00FF00";
    ctx.fillStyle = "#00FF00";
    ctx.beginPath();
    ctx.arc(screenSignalP[0], screenSignalP[1], 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 11;
    ctx.moveTo(screenBaseP[0], screenBaseP[1]);
    if (this.signalValue)
    {
        ctx.lineTo(screenOutP1[0], screenOutP1[1]);
    }
    else
    {
        ctx.lineTo(screenOutP0[0], screenOutP0[1]);
    }
    ctx.stroke();

    Component.drawContainer(breadboard, ctx, bgColor, screenOutP0, screenSignalP);

    var color;
    var value0 = breadboard.getConnectionValue(this.outId0);
    var valueBase = breadboard.getConnectionValue(this.baseId);
    var value1 = breadboard.getConnectionValue(this.outId1);
    var valueSignal = breadboard.getConnectionValue(this.signalId);
    ctx.lineWidth = 3;

    Component.drawFgNode(breadboard, ctx, fgColor, value0, screenOutP0);
    Component.drawFgNode(breadboard, ctx, fgColor, valueBase, screenBaseP);
    Component.drawFgNode(breadboard, ctx, fgColor, value1, screenOutP1);
    Component.drawFgNode(breadboard, ctx, fgColor, valueSignal, screenSignalP);

    ctx.beginPath();
    ctx.lineWidth = 8;
    ctx.moveTo(screenBaseP[0], screenBaseP[1]);
    if (this.signalValue)
    {
        color = fgColor || breadboard.getWireColor(Math.min(value1, valueBase));
        ctx.strokeStyle = color;
        ctx.lineTo(screenOutP1[0], screenOutP1[1]);
    }
    else
    {
        color = fgColor || breadboard.getWireColor(Math.min(value0, valueBase));
        ctx.strokeStyle = color;
        ctx.lineTo(screenOutP0[0], screenOutP0[1]);
    }
    ctx.stroke();
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
