
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

    Component.addHitbox(breadboard, this);
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

BusInputComponent.prototype.draw = function draw(drawOptions, ctx, p, bgColor, fgColor)
{
    var rotationMatrix = RotationMatrix[this.rotation];

    var busP = this.busP;
    var settingP = this.settingP;
    var signalP = this.signalP;

    if (!p)
    {
        p = this.p0;
    }
    else
    {
        busP = p;
        settingP = AddTransformedVector(p, rotationMatrix, [0, 1]);
        signalP = AddTransformedVector(p, rotationMatrix, [0, 2]);
    }

    var radius = Component.connectionBgRadius;
    ctx.strokeStyle = bgColor;

    var diamondSize = 0.33;

    ctx.lineCap = "square";
    ctx.fillStyle = "#FFFFFF";
    ctx.lineWidth = 0.1;
    ctx.beginPath();
    ctx.moveTo(busP[0] + diamondSize, busP[1]);
    ctx.lineTo(busP[0], busP[1] + diamondSize);
    ctx.lineTo(busP[0] - diamondSize, busP[1]);
    ctx.lineTo(busP[0], busP[1] - diamondSize);
    ctx.lineTo(busP[0] + diamondSize, busP[1]);
    ctx.stroke();
    ctx.fill();
    ctx.lineCap = "butt";

    ctx.fillStyle = "#00FF00"; // green
    ctx.beginPath();
    ctx.arc(signalP[0], signalP[1], radius, 0, Math.PI * 2.0);
    ctx.fill();

    Component.containerPath(ctx, bgColor, busP, signalP);
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    Component.containerPath(ctx, bgColor, settingP, settingP);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.editingValue ? "#FF0000" : bgColor;
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.font = "bold 0.9px Courier New";
    ctx.fillText(this.busKey, settingP[0], settingP[1]);

    var color;
    var valueSignal = drawOptions.getConnectionValue(this.signalId);

    Component.drawFgNode(ctx, fgColor, valueSignal, signalP);
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
        this.editingValue = true;
        breadboard.registerKeyDown(this.onKeyDown.bind(this));
    }
};

BusInputComponent.prototype.onKeyDown = function onKeyDown(breadboard, key, keyCode)
{
    if (keyCode === 13)
    {
        this.editingValue = false;
        breadboard.unregisterKeyDown();
        return;
    }

    this.busKey = key[0];
    this.updateValue(breadboard);
};

BusInputComponent.prototype.updateValue = function updateValue(breadboard)
{
    breadboard.dirtySave = true;
    breadboard.dirty = true;
};

BusInputComponent.prototype.getBusPosition = function getBusPosition()
{
    return this.busP;
};
