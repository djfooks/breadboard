
function BatteryComponent(breadboard)
{
    this.p = [-1, -1];

    this.id0 = -1;
    this.p0 = [-1, -1];

    this.id1 = -1;
    this.p1 = [-1, -1];

    this.rotation = 0;
    this.pulsePaths = [];
    this.strength = 50;

    Component.addHitbox(breadboard, this);
}

BatteryComponent.prototype.type = ComponentTypes.BATTERY;

BatteryComponent.prototype.createPulsePath = function createPulsePath()
{
    this.pulsePaths = [new PulsePath(this.strength, this.id1, -1)];
};

BatteryComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    this.p = [p[0], p[1]];
    var matrix = RotationMatrix[this.rotation];

    this.p0 = [p[0], p[1]];
    this.id0 = breadboard.getIndex(p[0], p[1]);

    this.p1 = AddTransformedVector(this.p0, matrix, [0, 1]);
    this.id1 = breadboard.getIndex(this.p1[0], this.p1[1]);

    Component.updateHitbox(this, p, this.p1);
};

BatteryComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new BatteryComponent(breadboard);
    cloneComponent.move(breadboard, this.p, this.rotation);
    return cloneComponent;
};

BatteryComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.BATTERY,
        p: this.p,
        rotation: this.rotation
    };
};

BatteryComponent.prototype.stateFromJson = function stateFromJson(json)
{
};

BatteryComponent.prototype.isValidPosition = function isValidPosition(breadboard, p0, rotation)
{
    var rotationMatrix = RotationMatrix[rotation];

    var p1 = AddTransformedVector(p0, rotationMatrix, [0, 1]);

    var p0Component = breadboard.getComponent(p0);
    var p1Component = breadboard.getComponent(p1);

    var isValid = true;
    isValid = isValid && breadboard.validPosition(p0) && (!p0Component || p0Component === this);
    isValid = isValid && breadboard.validPosition(p1) && (!p1Component || p1Component === this);
    return isValid;
};

BatteryComponent.prototype.draw = function draw(drawOptions, ctx, p, bgColor, fgColor)
{
    var p0 = this.p0;
    var p1 = this.p1;

    var rotationMatrix = RotationMatrix[this.rotation];
    if (!p)
    {
        p = this.p;
    }
    else
    {
        p0 = p;
        p1 = AddTransformedVector(p, rotationMatrix, [0, 1]);
    }

    var radius = Component.connectionBgRadius;
    ctx.fillStyle = bgColor;

    ctx.beginPath();
    ctx.arc(p1[0], p1[1], radius, 0, Math.PI * 2.0);
    ctx.fill();

    ctx.strokeStyle = bgColor;
    ctx.fillStyle = Wire.getColor(1);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.lineWidth = 0.05;
    var offsetX = 0.25;
    var offsetY = 0.3;
    var bump = 0.4;

    var d0 = AddTransformedVector(p, rotationMatrix, [ offsetX,        offsetY]);
    var d1 = AddTransformedVector(p, rotationMatrix, [ offsetX,       -offsetY]);
    var d2 = AddTransformedVector(p, rotationMatrix, [-offsetX,       -offsetY]);
    var d3 = AddTransformedVector(p, rotationMatrix, [-offsetX,        offsetY]);
    var d4 = AddTransformedVector(p, rotationMatrix, [-offsetX * 0.5,  offsetY]);
    var d5 = AddTransformedVector(p, rotationMatrix, [-offsetX * 0.5,  bump]);
    var d6 = AddTransformedVector(p, rotationMatrix, [ offsetX * 0.5,  bump]);
    var d7 = AddTransformedVector(p, rotationMatrix, [ offsetX * 0.5,  offsetY]);
    var d8 = AddTransformedVector(p, rotationMatrix, [ offsetX,        offsetY]);

    ctx.moveTo(d0[0], d0[1]);
    ctx.lineTo(d1[0], d1[1]);
    ctx.lineTo(d2[0], d2[1]);
    ctx.lineTo(d3[0], d3[1]);
    ctx.lineTo(d4[0], d4[1]);
    ctx.lineTo(d5[0], d5[1]);
    ctx.lineTo(d6[0], d6[1]);
    ctx.lineTo(d7[0], d7[1]);
    ctx.lineTo(d8[0], d8[1]);
    ctx.fill();
    ctx.stroke();
    ctx.lineCap = "butt";

    Component.containerPath(drawOptions, ctx, bgColor, p0, p1);
    ctx.stroke();

    Component.drawFgNode(ctx, null, 1, p1);
};

BatteryComponent.prototype.update = function update()
{
};

BatteryComponent.prototype.toggle = function toggle()
{
};

BatteryComponent.prototype.getConnections = function getConnections()
{
    return [this.id0, this.id1];
};

BatteryComponent.prototype.getOutputs = function getOutputs(id)
{
    return [];
};

BatteryComponent.prototype.isConnected = function isConnected(id0, id1)
{
    return false;
};
