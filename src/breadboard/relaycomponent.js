
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

RelayComponent.prototype.getSize = function getSize() { return [1, 4] };

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

RelayComponent.prototype.prepareGeometry = function prepareGeometry(componentRenderer)
{
    componentRenderer.switches.count += 1;
    componentRenderer.inputNodes.count += 1;
};

RelayComponent.prototype.addGeometry = function addGeometry(componentRenderer, breadboard, isTray)
{
    var baseP = this.baseP;
    var p0 = this.outP0;
    var p1 = this.outP1;
    var signalP = this.signalP;
    var textureIndexBase = componentRenderer.getWireTextureIndex(breadboard, this.baseId, baseP, isTray);
    var textureIndex0 = componentRenderer.getWireTextureIndex(breadboard, this.outId0, p0, isTray);
    var textureIndex1 = componentRenderer.getWireTextureIndex(breadboard, this.outId1, p1, isTray);
    var textureIndexSignal = componentRenderer.getWireTextureIndex(breadboard, this.signalId, signalP, isTray);

    var index = componentRenderer.switches.index * 12;
    componentRenderer.addPositionAndTextureIndex(componentRenderer.switches.base, index, baseP, textureIndexBase);
    componentRenderer.addPositionAndTextureIndex(componentRenderer.switches.p0, index, p0, textureIndex0);
    componentRenderer.addPositionAndTextureIndex(componentRenderer.switches.p1, index, p1, textureIndex1);

    var signalIndex = componentRenderer.switches.index * 4;
    componentRenderer.addTextureIndex(componentRenderer.switches.signal, signalIndex, textureIndexSignal);

    componentRenderer.switches.index += 1;

    componentRenderer.addNode(breadboard, componentRenderer.inputNodes, signalP, this.signalId, isTray);
};

RelayComponent.prototype.update = function update(breadboard)
{
    var signalValue = breadboard.getConnection(this.signalId).isOn();
    this.signalValue = signalValue;

    var i;
    var pulsePaths = this.pulsePaths;
    var pulsePathsLength = pulsePaths.length;
    for (i = 0; i < pulsePathsLength; i += 1)
    {
        var child = pulsePaths[i];
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
