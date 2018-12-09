
function LatchComponent(breadboard)
{
    this.p0 = [-1, -1];
    this.p1 = this.p0;

    this.baseId = -1;
    this.baseP = [-1, -1];

    this.outId0 = -1;
    this.outP0 = [-1, -1];

    this.outId1 = -1;
    this.outP1 = [-1, -1];

    this.signalId0 = -1;
    this.signalP0 = [-1, -1];

    this.signalId1 = -1;
    this.signalP1 = [-1, -1];

    this.signalValue = false;
    this.signalValueIndex = -1;

    this.pulsePaths = [];

    this.hitbox = new Hitbox(0, 0, 0, 0, this);
}
Component.addComponentFunctions(LatchComponent);

LatchComponent.prototype.type = ComponentTypes.LATCH;

LatchComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.LATCH,
        p0: this.p0,
        rotation: this.rotation
    };
};

LatchComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    var matrix = RotationMatrix[this.rotation];
    this.p0 = [p[0], p[1]];

    this.outP0 = [p[0], p[1]];
    this.outId0 = breadboard.getIndex(p[0], p[1]);

    this.signalP0 = AddTransformedVector(p, matrix, [1, 0]);
    this.signalId0 = breadboard.getIndex(this.signalP0[0], this.signalP0[1]);

    this.baseP = AddTransformedVector(p, matrix, [0, 1]);
    this.baseId = breadboard.getIndex(this.baseP[0], this.baseP[1]);

    this.outP1 = AddTransformedVector(p, matrix, [0, 2]);
    this.outId1 = breadboard.getIndex(this.outP1[0], this.outP1[1]);

    this.signalP1 = AddTransformedVector(p, matrix, [1, 2]);
    this.signalId1 = breadboard.getIndex(this.signalP1[0], this.signalP1[1]);

    this.p1 = this.signalP1;

    this.pulsePaths = [];
    Component.updateHitbox(this, p, this.signalP1);
};

LatchComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new LatchComponent(breadboard);
    cloneComponent.move(breadboard, this.p0, this.rotation);
    return cloneComponent;
};

LatchComponent.prototype.isValidPosition = function isValidPosition(breadboard, p0, rotation)
{
    var rotationMatrix = RotationMatrix[rotation];

    var p1 = AddTransformedVector(p0, rotationMatrix, [1, 0]);
    var p2 = AddTransformedVector(p0, rotationMatrix, [0, 1]);
    var p3 = AddTransformedVector(p0, rotationMatrix, [0, 2]);
    var p4 = AddTransformedVector(p0, rotationMatrix, [1, 2]);

    var p0Component = breadboard.getComponent(p0);
    var p1Component = breadboard.getComponent(p1);
    var p2Component = breadboard.getComponent(p2);
    var p3Component = breadboard.getComponent(p3);
    var p4Component = breadboard.getComponent(p4);

    var isValid = true;
    isValid = isValid && breadboard.validPosition(p0) && (!p0Component || p0Component === this);
    isValid = isValid && breadboard.validPosition(p1) && (!p1Component || p1Component === this);
    isValid = isValid && breadboard.validPosition(p2) && (!p2Component || p2Component === this);
    isValid = isValid && breadboard.validPosition(p3) && (!p3Component || p3Component === this);
    isValid = isValid && breadboard.validPosition(p4) && (!p4Component || p4Component === this);
    return isValid;
};

LatchComponent.prototype.prepareGeometry = function prepareGeometry(componentRenderer)
{
    componentRenderer.switches.count += 1;
    componentRenderer.inputNodes.count += 2;
};

LatchComponent.prototype.addGeometry = function addGeometry(componentRenderer, breadboard, isTray)
{
    var baseP = this.baseP;
    var p0 = this.outP0;
    var p1 = this.outP1;
    var textureIndexBase = componentRenderer.getWireTextureIndex(breadboard, this.baseId, baseP, isTray);
    var textureIndex0 = componentRenderer.getWireTextureIndex(breadboard, this.outId0, p0, isTray);
    var textureIndex1 = componentRenderer.getWireTextureIndex(breadboard, this.outId1, p1, isTray);

    var index = componentRenderer.switches.index * 12;
    componentRenderer.addPositionAndTextureIndex(componentRenderer.switches.base, index, baseP, textureIndexBase);
    componentRenderer.addPositionAndTextureIndex(componentRenderer.switches.p0, index, p0, textureIndex0);
    componentRenderer.addPositionAndTextureIndex(componentRenderer.switches.p1, index, p1, textureIndex1);

    this.signalValueIndex = componentRenderer.getNextTextureIndex(breadboard, isTray);

    var signalIndex = componentRenderer.switches.index * 4;
    componentRenderer.addTextureIndex(componentRenderer.switches.signal, signalIndex, this.signalValueIndex);

    componentRenderer.switches.index += 1;

    componentRenderer.addNode(breadboard, componentRenderer.inputNodes, this.signalP0, this.signalId0, isTray);
    componentRenderer.addNode(breadboard, componentRenderer.inputNodes, this.signalP1, this.signalId1, isTray);
};

LatchComponent.prototype.render = function render(renderer)
{
    renderer.textureData[this.signalValueIndex] = this.signalValue ? 255 : 0;
};

LatchComponent.prototype.draw = function draw(drawOptions, ctx, p, bgColor, fgColor, hasFocus)
{
    var outP0 = this.outP0;
    var signalP0 = this.signalP0;
    var baseP = this.baseP;
    var outP1 = this.outP1;
    var signalP1 = this.signalP1;

    if (!p)
    {
        p = this.p0;
    }
    else
    {
        var rotationMatrix = RotationMatrix[this.rotation];
        outP0 = p;
        signalP0 = AddTransformedVector(p, rotationMatrix, [1, 0]);
        baseP = AddTransformedVector(p, rotationMatrix, [0, 1]);
        outP1 = AddTransformedVector(p, rotationMatrix, [0, 2]);
        signalP1 = AddTransformedVector(p, rotationMatrix, [1, 2]);
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
    ctx.arc(signalP0[0], signalP0[1], radius, 0, Math.PI * 2.0);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(signalP1[0], signalP1[1], radius, 0, Math.PI * 2.0);
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

    Component.containerPath(ctx, bgColor, outP0, signalP1);
    ctx.stroke();

    var color;
    var value0 = drawOptions.getConnectionValue(this.outId0);
    var valueBase = drawOptions.getConnectionValue(this.baseId);
    var value1 = drawOptions.getConnectionValue(this.outId1);
    var valueSignal0 = drawOptions.getConnectionValue(this.signalId0);
    var valueSignal1 = drawOptions.getConnectionValue(this.signalId1);

    Component.drawFgNode(ctx, fgColor, value0, outP0);
    Component.drawFgNode(ctx, fgColor, valueBase, baseP);
    Component.drawFgNode(ctx, fgColor, value1, outP1);
    Component.drawFgNode(ctx, fgColor, valueSignal0, signalP0);
    Component.drawFgNode(ctx, fgColor, valueSignal1, signalP1);

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

LatchComponent.prototype.update = function update(breadboard)
{
    var signalValue0 = breadboard.getConnection(this.signalId0).isOn();
    var signalValue1 = breadboard.getConnection(this.signalId1).isOn();
    if (!signalValue0 && !signalValue1)
    {
        return;
    }

    if (signalValue0 && signalValue1)
    {
        if (this.invalidSignalFrame < breadboard.frame - 1)
        {
            this.signalValue = Math.random() > 0.5;
        }
        this.invalidSignalFrame = breadboard.frame;
    }
    else if (signalValue0)
    {
        this.signalValue = false;
    }
    else if (signalValue1)
    {
        this.signalValue = true;
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

        if (this.signalValue === isBase0Connection)
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

LatchComponent.prototype.getConnections = function getConnections()
{
    return [this.baseId, this.outId0, this.outId1, this.signalId0, this.signalId1];
};

LatchComponent.prototype.getOutputs = function getOutputs(id)
{
    if (id === this.baseId)
    {
        return [this.outId0, this.outId1];
    }
    if (id === this.outId0 || id === this.outId1)
    {
        return [this.baseId];
    }
    if (id === this.signalId0 || id === this.signalId1)
    {
        return [];
    }
    throw new Error();
};

LatchComponent.prototype.isConnected = function isConnected(id0, id1)
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
