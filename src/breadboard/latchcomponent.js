
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

LatchComponent.prototype.getSize = function getSize() { return [2, 3] };

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

LatchComponent.prototype.render = function render(breadboard, renderer)
{
    renderer.textureData[this.signalValueIndex] = this.signalValue ? 255 : 0;
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
