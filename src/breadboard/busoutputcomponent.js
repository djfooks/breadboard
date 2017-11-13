
function BusOutputComponent(breadboard)
{
    this.p = [-1, -1];

    this.busId = -1;
    this.busP = [-1, -1];

    this.settingId = -1;
    this.settingP = [-1, -1];

    this.inId = -1;
    this.inP = [-1, -1];

    this.outId = -1;
    this.outP = [-1, -1];

    this.busKey = "0";

    Component.addHitbox(breadboard, this);
}

BusOutputComponent.prototype.type = ComponentTypes.BUS_OUTPUT;

BusOutputComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.BUS_OUTPUT,
        p: this.p,
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
    this.p = [p[0], p[1]];

    this.busP = [p[0], p[1]];
    this.busId = breadboard.getIndex(p[0], p[1]);

    this.settingP = AddTransformedVector(p, matrix, [0, 1]);
    this.settingId = breadboard.getIndex(this.settingP[0], this.settingP[1]);

    this.inP = AddTransformedVector(p, matrix, [0, 2]);
    this.inId = breadboard.getIndex(this.inP[0], this.inP[1]);

    this.outP = AddTransformedVector(p, matrix, [0, 3]);
    this.outId = breadboard.getIndex(this.outP[0], this.outP[1]);

    Component.updateHitbox(this, p, this.outP);
};

BusOutputComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new BusOutputComponent(breadboard);
    cloneComponent.move(breadboard, this.p, this.rotation);
    return cloneComponent;
};

BusOutputComponent.prototype.isValidPosition = function isValidPosition(breadboard, p0, rotation)
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

BusOutputComponent.prototype.draw = function draw(drawOptions, ctx, p, bgColor, fgColor)
{
    var rotationMatrix = RotationMatrix[this.rotation];

    var busP = this.busP;
    var settingP = this.settingP;
    var inP = this.inP;
    var outP = this.outP;

    if (!p)
    {
        p = this.p;
    }
    else
    {
        busP = p;
        settingP = AddTransformedVector(p, rotationMatrix, [0, 1]);
        inP = AddTransformedVector(p, rotationMatrix, [0, 2]);
        outP = AddTransformedVector(p, rotationMatrix, [0, 3]);
    }
  
    var radius = Component.connectionBgRadius;
    ctx.strokeStyle = bgColor;

    var diamondSize = 0.33;

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(busP[0] + diamondSize, busP[1]);
    ctx.lineTo(busP[0], busP[1] + diamondSize);
    ctx.lineTo(busP[0] - diamondSize, busP[1]);
    ctx.lineTo(busP[0], busP[1] - diamondSize);
    ctx.lineTo(busP[0] + diamondSize, busP[1]);
    ctx.stroke();
    ctx.fill();

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(inP[0], inP[1], radius, 0, Math.PI * 2.0);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(outP[0], outP[1], radius, 0, Math.PI * 2.0);
    ctx.fill();

    Component.containerPath(drawOptions, ctx, bgColor, busP, outP);
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    Component.containerPath(drawOptions, ctx, bgColor, settingP, settingP);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.editingValue ? "#FF0000" : bgColor;
    var textPos = AddTransformedVector(settingP, rotationMatrix, [0.0, 0.3])
    ctx.textAlign="center";
    ctx.font = "bold 0.9px Courier New";
    ctx.fillText(this.busKey, textPos[0], textPos[1]);

    var color;
    var valueIn = drawOptions.getConnectionValue(this.inId);
    var valueOut = drawOptions.getConnectionValue(this.outId);

    Component.drawFgNode(ctx, fgColor, valueIn, inP);
    Component.drawFgNode(ctx, fgColor, valueOut, outP);
};

BusOutputComponent.prototype.update = function update(breadboard)
{
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
        this.editingValue = true;
        breadboard.registerKeyDown(this.onKeyDown.bind(this));
    }
};

BusOutputComponent.prototype.getOutputs = function getOutputs(id)
{
    return [];
};

BusOutputComponent.prototype.isConnected = function isConnected(id0, id1)
{
    return false;
};

BusOutputComponent.prototype.onKeyDown = function onKeyDown(breadboard, key, keyCode)
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

BusOutputComponent.prototype.updateValue = function updateValue(breadboard)
{
    breadboard.dirtySave = true;
}
