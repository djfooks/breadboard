
function SwitchComponent(breadboard)
{
    this.p0 = [-1, -1];
    this.p1 = [-1, -1];

    this.id0 = -1;
    this.id1 = -1;

    this.connected = false;
    this.connectedTextureIndex = -1;
    this.rotation = 0;
    this.pulsePaths = [];

    this.hitbox = new Hitbox(0, 0, 0, 0, this);
}
Component.addComponentFunctions(SwitchComponent);

SwitchComponent.prototype.getSize = function getSize() { return [1, 2] };

SwitchComponent.prototype.type = ComponentTypes.SWITCH;

SwitchComponent.prototype.prepareGeometry = function prepareGeometry(componentRenderer)
{
    componentRenderer.switches.count += 1;
};

SwitchComponent.prototype.addGeometry = function addGeometry(componentRenderer, breadboard, isTray)
{
    var index = componentRenderer.switches.index * 16;

    var p0 = this.p0;
    var p1 = this.p1;
    var textureIndex0 = componentRenderer.getWireTextureIndex(breadboard, this.id0, p0, isTray);
    var textureIndex1 = componentRenderer.getWireTextureIndex(breadboard, this.id1, p1, isTray);
    componentRenderer.addPositionAndTextureIndex(componentRenderer.switches.base, index, p0, textureIndex0);
    componentRenderer.addPositionAndTextureIndex(componentRenderer.switches.p0, index, p0, textureIndex0);
    componentRenderer.addPositionAndTextureIndex(componentRenderer.switches.p1, index, p1, textureIndex1);

    this.connectedTextureIndex = componentRenderer.getNextTextureIndex(breadboard, isTray);

    var signalIndex = componentRenderer.switches.index * 8;
    componentRenderer.addTextureIndex(componentRenderer.switches.signal, signalIndex, this.connectedTextureIndex);

    componentRenderer.switches.index += 1;
};

SwitchComponent.prototype.render = function render(breadboard, renderer)
{
    renderer.textureData[this.connectedTextureIndex] = this.connected ? 255 : 0;
};

SwitchComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    var matrix = RotationMatrix[this.rotation];

    this.p0 = [p[0], p[1]];
    this.id0 = breadboard.getIndex(p[0], p[1]);

    this.p1 = AddTransformedVector(this.p0, matrix, [0, 1]);
    this.id1 = breadboard.getIndex(this.p1[0], this.p1[1]);

    this.pulsePaths = [];
    Component.updateHitbox(this, p, this.p1);
};

SwitchComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new SwitchComponent(breadboard);
    cloneComponent.connected = this.connected;
    cloneComponent.move(breadboard, this.p0, this.rotation);
    return cloneComponent;
};

SwitchComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.SWITCH,
        p0: this.p0,
        rotation: this.rotation,
        connected: this.connected
    };
};

SwitchComponent.prototype.stateFromJson = function stateFromJson(json)
{
    if (this.connected !== json.connected)
    {
        this.toggle();
    }
};

SwitchComponent.prototype.toggle = function toggle()
{
    this.connected = !this.connected;

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
