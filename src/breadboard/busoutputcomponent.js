
function BusOutputComponent(breadboard)
{
    this.p0 = [-1, -1];
    this.p1 = this.p0;

    this.busId = -1;
    this.busP = [-1, -1];

    this.settingId = -1;
    this.settingP = [-1, -1];

    this.inId = -1;
    this.inP = [-1, -1];

    this.outId = -1;
    this.outP = [-1, -1];

    this.busKey = "0";
    this.bus = null;

    this.signalValue = false;
    this.signalValueIndex = -1;

    this.hitbox = new Hitbox(0, 0, 0, 0, this);
}
Component.addComponentFunctions(BusOutputComponent);

BusOutputComponent.prototype.getSize = function getSize() { return [1, 4] };

BusOutputComponent.prototype.type = ComponentTypes.BUS_OUTPUT;

BusOutputComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.BUS_OUTPUT,
        p0: this.p0,
        rotation: this.rotation,
        busKey: this.busKey
    };
};

BusOutputComponent.prototype.stateFromJson = function stateFromJson(json)
{
    this.busKey = json.busKey || "0";
};

BusOutputComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    var matrix = RotationMatrix[this.rotation];
    this.p0 = [p[0], p[1]];

    this.busP = [p[0], p[1]];
    this.busId = breadboard.getIndex(p[0], p[1]);

    this.settingP = AddTransformedVector(p, matrix, [0, 1]);
    this.settingId = breadboard.getIndex(this.settingP[0], this.settingP[1]);

    this.inP = AddTransformedVector(p, matrix, [0, 2]);
    this.inId = breadboard.getIndex(this.inP[0], this.inP[1]);

    this.outP = AddTransformedVector(p, matrix, [0, 3]);
    this.outId = breadboard.getIndex(this.outP[0], this.outP[1]);

    this.p1 = this.outP;

    Component.updateHitbox(this, p, this.outP);
};

BusOutputComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new BusOutputComponent(breadboard);
    cloneComponent.busKey = this.busKey;
    cloneComponent.move(breadboard, this.p0, this.rotation);
    return cloneComponent;
};

BusOutputComponent.prototype.prepareGeometry = function prepareGeometry(componentRenderer)
{
    componentRenderer.switches.count += 1;
    componentRenderer.busNodes.count += 1;
    componentRenderer.textRenderer.prepareText(this.settingId, this.settingP, this.busKey);
};

BusOutputComponent.prototype.addGeometry = function addGeometry(componentRenderer, breadboard, isTray)
{
    var index = componentRenderer.switches.index * 16;

    var inP = this.inP;
    var outP = this.outP;
    var textureIndexIn = componentRenderer.getWireTextureIndex(breadboard, this.inId, inP, isTray);
    var textureIndexOut = componentRenderer.getWireTextureIndex(breadboard, this.outId, outP, isTray);
    componentRenderer.addPositionAndTextureIndex(componentRenderer.switches.base, index, inP, textureIndexIn);
    componentRenderer.addPositionAndTextureIndex(componentRenderer.switches.p0, index, inP, textureIndexIn);
    componentRenderer.addPositionAndTextureIndex(componentRenderer.switches.p1, index, outP, textureIndexOut);

    this.signalValueIndex = componentRenderer.getNextTextureIndex(breadboard, isTray);

    var signalIndex = componentRenderer.switches.index * 8;
    componentRenderer.addTextureIndex(componentRenderer.switches.signal, signalIndex, this.signalValueIndex);

    componentRenderer.switches.index += 1;

    busIndex = componentRenderer.busNodes.index * 8;
    componentRenderer.addPosition(componentRenderer.busNodes.p, busIndex, this.busP);
    componentRenderer.busNodes.index += 1;

    componentRenderer.addText(this.settingId, (breadboard.focusComponent === this) ? 255 : 0);
};

BusOutputComponent.prototype.render = function render(breadboard, renderer)
{
    renderer.textureData[this.signalValueIndex] = this.signalValue ? 255 : 0;
};

BusOutputComponent.prototype.reset = function reset()
{
    this.bus = null;
    this.signalValue = false;
};

BusOutputComponent.prototype.update = function update(breadboard)
{
    var signalValue;
    if (this.bus)
    {
        this.signalValue = signalValue = this.bus.isOn(this.busKey);
    }
    else
    {
        this.signalValue = signalValue = false;
    }

    var i;
    for (i = 0; i < this.pulsePaths.length; i += 1)
    {
        var child = this.pulsePaths[i];
        if (this.signalValue)
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

BusOutputComponent.prototype.getConnections = function getConnections()
{
    return [this.busId, this.settingId, this.inId, this.outId];
};

BusOutputComponent.prototype.toggle = function toggle(breadboard, p)
{
    var settingP = this.settingP;
    if (p[0] === settingP[0] && p[1] === settingP[1])
    {
        breadboard.takeFocus(this, this.onKeyDown.bind(this));
    }
};

BusOutputComponent.prototype.getOutputs = function getOutputs(id)
{
    if (id === this.inId)
    {
        return [this.outId];
    }
    else if (id === this.outId)
    {
        return [this.inId];
    }
    return [];
};

BusOutputComponent.prototype.isConnected = function isConnected(id0, id1)
{
    if (!this.signalValue)
    {
        return false;
    }
    if (id0 === this.inId && id1 === this.outId)
    {
        return true;
    }
    else if (id0 === this.outId && id1 === this.inId)
    {
        return true;
    }
    throw new Error();
};

BusOutputComponent.prototype.onKeyDown = function onKeyDown(breadboard, key, keyCode)
{
    if (keyCode === 13)
    {
        breadboard.removeFocus();
        return;
    }

    this.busKey = key[0];
    this.updateValue(breadboard);
};

BusOutputComponent.prototype.updateValue = function updateValue(breadboard)
{
    breadboard.dirtySave = true;
    breadboard.dirty = true;
    breadboard.geometryDirty = true;
};

BusOutputComponent.prototype.getBusPosition = function getBusPosition()
{
    return this.busP;
};
