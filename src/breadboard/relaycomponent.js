
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


    this.pulsePaths = [];

    Component.addHitbox(breadboard, this);
}

RelayComponent.prototype.type = ComponentTypes.RELAY;

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

    this.pulsePaths = [];
    Component.updateHitbox(this, p, this.signalP);
};

RelayComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new RelayComponent(breadboard);
    cloneComponent.move(breadboard, this.p, this.rotation);
    return cloneComponent;
};

RelayComponent.prototype.isValidPosition = function isValidPosition(breadboard, p0, rotation)
{
    var rotationMatrix = RotationMatrix[rotation];

    var p1 = AddTransformedVector(p0, rotationMatrix, [0, 1]);
    var p2 = AddTransformedVector(p0, rotationMatrix, [0, 2]);
    var p3 = AddTransformedVector(p0, rotationMatrix, [0, 3]);

    var p0Component = breadboard.getComponent(p0);
    var p1Component = breadboard.getComponent(p1);
    var p2Component = breadboard.getComponent(p2);
    var p3Component = breadboard.getComponent(p3);

    var isValid = true;
    isValid = isValid && breadboard.validPosition(p0) && (!p0Component || p0Component === this);
    isValid = isValid && breadboard.validPosition(p1) && (!p1Component || p1Component === this);
    isValid = isValid && breadboard.validPosition(p2) && (!p2Component || p2Component === this);
    isValid = isValid && breadboard.validPosition(p3) && (!p3Component || p3Component === this);
    return isValid;
};

RelayComponent.prototype.draw = function draw(drawOptions, ctx, p, bgColor, fgColor)
{
    var outP0 = this.outP0;
    var baseP = this.baseP;
    var outP1 = this.outP1;
    var signalP = this.signalP;

    if (!p)
    {
        p = this.p;
    }
    else
    {
        var rotationMatrix = RotationMatrix[this.rotation];
        outP0 = p;
        baseP = AddTransformedVector(p, rotationMatrix, [0, 1]);
        outP1 = AddTransformedVector(p, rotationMatrix, [0, 2]);
        signalP = AddTransformedVector(p, rotationMatrix, [0, 3]);
    }

    var radius = Component.connectionBgRadius;
    ctx.fillStyle = bgColor;

    ctx.beginPath();
    ctx.arc(outP0[0], outP0[1], radius, 0, Math.PI * 2.0);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(baseP[0], baseP[1], radius, 0, Math.PI * 2.0);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(outP1[0], outP1[1], radius, 0, Math.PI * 2.0);
    ctx.fill();

    ctx.fillStyle = "#00FF00"; // green
    ctx.beginPath();
    ctx.arc(signalP[0], signalP[1], radius, 0, Math.PI * 2.0);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 0.3;
    ctx.moveTo(baseP[0], baseP[1]);
    if (this.signalValue)
    {
        ctx.lineTo(outP1[0], outP1[1]);
    }
    else
    {
        ctx.lineTo(outP0[0], outP0[1]);
    }
    ctx.stroke();

    Component.containerPath(drawOptions, ctx, bgColor, outP0, signalP);
    ctx.stroke();

    var color;
    var value0 = drawOptions.getConnectionValue(this.outId0);
    var valueBase = drawOptions.getConnectionValue(this.baseId);
    var value1 = drawOptions.getConnectionValue(this.outId1);
    var valueSignal = drawOptions.getConnectionValue(this.signalId);

    Component.drawFgNode(ctx, fgColor, value0, outP0);
    Component.drawFgNode(ctx, fgColor, valueBase, baseP);
    Component.drawFgNode(ctx, fgColor, value1, outP1);
    Component.drawFgNode(ctx, fgColor, valueSignal, signalP);

    ctx.beginPath();
    ctx.lineWidth = 0.2;
    ctx.moveTo(baseP[0], baseP[1]);
    if (this.signalValue)
    {
        color = fgColor || Wire.getColor(Math.min(value1, valueBase));
        ctx.strokeStyle = color;
        ctx.lineTo(outP1[0], outP1[1]);
    }
    else
    {
        color = fgColor || Wire.getColor(Math.min(value0, valueBase));
        ctx.strokeStyle = color;
        ctx.lineTo(outP0[0], outP0[1]);
    }
    ctx.stroke();
};

RelayComponent.prototype.update = function update(breadboard)
{
    var signalValue = breadboard.getConnection(this.signalId).isOn();
    if (this.signalValue !== signalValue)
    {
        this.signalValue = signalValue;
    }

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
