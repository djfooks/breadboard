
function RelayComponent(breadboard)
{
    this.p0 = [-1, -1];
    this.p1 = this.p0;

    this.baseId = -1;
    this.baseP = [-1, -1];

    this.outId0 = -1;
    this.outP0 = [-1, -1];

    this.outId1 = -1;
    this.outP1 = [-1, -1];

    this.signalId = -1;
    this.signalP = [-1, -1];

    this.signalValue = false;

    this.pulsePaths = [];

    this.hitbox = new Hitbox(0, 0, 0, 0, this);
}
Component.addComponentFunctions(RelayComponent);

RelayComponent.prototype.type = ComponentTypes.RELAY;

RelayComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.RELAY,
        p0: this.p0,
        rotation: this.rotation
    };
};

RelayComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    var matrix = RotationMatrix[this.rotation];
    this.p0 = [p[0], p[1]];

    this.outP0 = [p[0], p[1]];
    this.outId0 = breadboard.getIndex(p[0], p[1]);

    this.baseP = AddTransformedVector(p, matrix, [0, 1]);
    this.baseId = breadboard.getIndex(this.baseP[0], this.baseP[1]);

    this.outP1 = AddTransformedVector(p, matrix, [0, 2]);
    this.outId1 = breadboard.getIndex(this.outP1[0], this.outP1[1]);

    this.signalP = AddTransformedVector(p, matrix, [0, 3]);
    this.signalId = breadboard.getIndex(this.signalP[0], this.signalP[1]);

    this.p1 = this.signalP;

    this.pulsePaths = [];
    Component.updateHitbox(this, p, this.signalP);
};

RelayComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new RelayComponent(breadboard);
    cloneComponent.move(breadboard, this.p0, this.rotation);
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

RelayComponent.prototype.prepareGeometry = function prepareGeometry(componentRenderer)
{
    componentRenderer.switches.count += 1;
};

RelayComponent.prototype.addGeometry = function addGeometry(componentRenderer, breadboard)
{
    var baseP = this.baseP;
    var textureIndexBase = componentRenderer.getWireTextureIndex(breadboard, this.baseId, baseP);

    var p0 = this.outP0;
    var textureIndex0 = componentRenderer.getWireTextureIndex(breadboard, this.outId0, p0);

    var p1 = this.outP1;
    var textureIndex1 = componentRenderer.getWireTextureIndex(breadboard, this.outId1, p1);

    var baseData = componentRenderer.switches.base;
    var p0Data = componentRenderer.switches.p0;
    var p1Data = componentRenderer.switches.p1;
    var signal =componentRenderer.switches.signal;
    var index = componentRenderer.switches.index * 12;
    var signalIndex = componentRenderer.switches.index * 4;

    baseData[index + 0]  = baseP[0];
    baseData[index + 1]  = baseP[1];
    baseData[index + 2]  = textureIndexBase;
    baseData[index + 3]  = baseP[0];
    baseData[index + 4]  = baseP[1];
    baseData[index + 5]  = textureIndexBase;
    baseData[index + 6]  = baseP[0];
    baseData[index + 7]  = baseP[1];
    baseData[index + 8]  = textureIndexBase;
    baseData[index + 9]  = baseP[0];
    baseData[index + 10] = baseP[1];
    baseData[index + 11] = textureIndexBase;

    p0Data[index + 0]  = p0[0];
    p0Data[index + 1]  = p0[1];
    p0Data[index + 2]  = textureIndex0;
    p0Data[index + 3]  = p0[0];
    p0Data[index + 4]  = p0[1];
    p0Data[index + 5]  = textureIndex0;
    p0Data[index + 6]  = p0[0];
    p0Data[index + 7]  = p0[1];
    p0Data[index + 8]  = textureIndex0;
    p0Data[index + 9]  = p0[0];
    p0Data[index + 10] = p0[1];
    p0Data[index + 11] = textureIndex0;

    p1Data[index + 0]  = p1[0];
    p1Data[index + 1]  = p1[1];
    p1Data[index + 2]  = textureIndex1;
    p1Data[index + 3]  = p1[0];
    p1Data[index + 4]  = p1[1];
    p1Data[index + 5]  = textureIndex1;
    p1Data[index + 6]  = p1[0];
    p1Data[index + 7]  = p1[1];
    p1Data[index + 8]  = textureIndex1;
    p1Data[index + 9]  = p1[0];
    p1Data[index + 10] = p1[1];
    p1Data[index + 11] = textureIndex1;

    var signalP = this.signalP;
    var textureIndexSignal = componentRenderer.getWireTextureIndex(breadboard, this.signalId, signalP);
    signal[signalIndex + 0] = textureIndexSignal;
    signal[signalIndex + 1] = textureIndexSignal;
    signal[signalIndex + 2] = textureIndexSignal;
    signal[signalIndex + 3] = textureIndexSignal;

    componentRenderer.switches.index += 1;
};

RelayComponent.prototype.draw = function draw(drawOptions, ctx, p, bgColor, fgColor, hasFocus)
{
    var outP0 = this.outP0;
    var baseP = this.baseP;
    var outP1 = this.outP1;
    var signalP = this.signalP;

    if (!p)
    {
        p = this.p0;
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

    Component.containerPath(ctx, bgColor, outP0, signalP);
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
    this.signalValue = signalValue;

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
