
function BusInputComponent(breadboard)
{
    this.p0 = [-1, -1];
    this.p1 = this.p0;

    this.busId = -1;
    this.busP = [-1, -1];

    this.settingId = -1;
    this.settingP = [-1, -1];

    this.signalId = -1;
    this.signalP = [-1, -1];

    this.busKey = "0";
    this.bus = null;

    this.signalValue = false;

    this.hitbox = new Hitbox(0, 0, 0, 0, this);
}
Component.addComponentFunctions(BusInputComponent);

BusInputComponent.prototype.type = ComponentTypes.BUS_INPUT;

BusInputComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.BUS_INPUT,
        p0: this.p0,
        rotation: this.rotation,
        busKey: this.busKey
    };
};

BusInputComponent.prototype.stateFromJson = function stateFromJson(json)
{
    this.busKey = json.busKey || "0";
};

BusInputComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    var matrix = RotationMatrix[this.rotation];
    this.p0 = [p[0], p[1]];

    this.busP = [p[0], p[1]];
    this.busId = breadboard.getIndex(p[0], p[1]);

    this.settingP = AddTransformedVector(p, matrix, [0, 1]);
    this.settingId = breadboard.getIndex(this.settingP[0], this.settingP[1]);

    this.signalP = AddTransformedVector(p, matrix, [0, 2]);
    this.signalId = breadboard.getIndex(this.signalP[0], this.signalP[1]);

    this.p1 = this.signalP;

    Component.updateHitbox(this, p, this.signalP);
};

BusInputComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new BusInputComponent(breadboard);
    cloneComponent.busKey = this.busKey;
    cloneComponent.move(breadboard, this.p0, this.rotation);
    return cloneComponent;
};

BusInputComponent.prototype.isValidPosition = function isValidPosition(breadboard, p0, rotation)
{
    var rotationMatrix = RotationMatrix[rotation];

    var p1 = AddTransformedVector(p0, rotationMatrix, [0, 1]);
    var p2 = AddTransformedVector(p0, rotationMatrix, [0, 2]);

    var p0Component = breadboard.getComponent(p0);
    var p1Component = breadboard.getComponent(p1);
    var p2Component = breadboard.getComponent(p2);

    var isValid = true;
    isValid = isValid && breadboard.validPosition(p0) && (!p0Component || p0Component === this);
    isValid = isValid && breadboard.validPosition(p1) && (!p1Component || p1Component === this);
    isValid = isValid && breadboard.validPosition(p2) && (!p2Component || p2Component === this);
    return isValid;
};

BusInputComponent.prototype.prepareGeometry = function prepareGeometry(componentRenderer)
{
    componentRenderer.busNodes.count += 1;
    componentRenderer.inputNodes.count += 1;
    componentRenderer.textRenderer.textObjects.count += 1;
    componentRenderer.textRenderer.prepareText(this.settingId, this.busKey);
};

BusInputComponent.prototype.addGeometry = function addGeometry(componentRenderer, breadboard, isTray)
{
    var index = componentRenderer.busNodes.index * 8;
    componentRenderer.addPosition(componentRenderer.busNodes.p, index, this.busP);
    componentRenderer.busNodes.index += 1;

    componentRenderer.addNode(breadboard, componentRenderer.inputNodes, this.signalP, this.signalId, isTray);

    componentRenderer.addText(this.settingId, (breadboard.focusComponent === this) ? 255 : 0);
};

BusInputComponent.prototype.reset = function reset()
{
    this.bus = null;
    this.signalValue = false;
};

BusInputComponent.prototype.update = function update(breadboard)
{
    var signalValue = breadboard.getConnection(this.signalId).isOn();
    if (this.bus && signalValue !== this.signalValue)
    {
        this.signalValue = signalValue;
        this.bus.addValue(this.busKey, signalValue ? 1 : -1);
    }
};

BusInputComponent.prototype.getConnections = function getConnections()
{
    return [this.busId, this.settingId, this.signalId];
};

BusInputComponent.prototype.getOutputs = function getOutputs(id)
{
    return [];
};

BusInputComponent.prototype.toggle = function toggle(breadboard, p)
{
    var settingP = this.settingP;
    if (p[0] === settingP[0] && p[1] === settingP[1])
    {
        breadboard.takeFocus(this, this.onKeyDown.bind(this));
    }
};

BusInputComponent.prototype.onKeyDown = function onKeyDown(breadboard, key, keyCode)
{
    if (keyCode === 13)
    {
        breadboard.removeFocus();
        return;
    }

    this.busKey = key[0];
    this.updateValue(breadboard);
};

BusInputComponent.prototype.updateValue = function updateValue(breadboard)
{
    breadboard.dirtySave = true;
    breadboard.dirty = true;
    breadboard.geometryDirty = true;
};

BusInputComponent.prototype.getBusPosition = function getBusPosition()
{
    return this.busP;
};
