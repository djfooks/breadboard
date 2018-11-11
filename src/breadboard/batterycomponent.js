
function BatteryComponent(breadboard)
{
    this.p0 = [-1, -1];
    this.p1 = this.p0;

    this.id0 = -1;
    this.id1 = -1;

    this.rotation = 0;
    this.pulsePaths = [];
    this.strength = 50;

    this.hitbox = new Hitbox(0, 0, 0, 0, this);
}
Component.addComponentFunctions(BatteryComponent);

BatteryComponent.prototype.type = ComponentTypes.BATTERY;

BatteryComponent.prototype.createPulsePath = function createPulsePath()
{
    this.pulsePaths = [new PulsePath(this.strength, this.id1, -1)];
};

BatteryComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
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
    cloneComponent.move(breadboard, this.p0, this.rotation);
    return cloneComponent;
};

BatteryComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.BATTERY,
        p0: this.p0,
        rotation: this.rotation
    };
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

BatteryComponent.prototype.prepareGeometry = function prepareGeometry(componentRenderer)
{
    componentRenderer.outputNodes.count += 1;
    componentRenderer.batterySymbols.count += 1;
};

BatteryComponent.prototype.addGeometry = function addGeometry(componentRenderer, breadboard)
{
    var index = componentRenderer.outputNodes.index * 12;
    componentRenderer.addPositionAndTextureIndex(componentRenderer.outputNodes.p, index, this.p1, 1);
    componentRenderer.outputNodes.index += 1;

    index = componentRenderer.batterySymbols.index * 8;
    componentRenderer.addPosition(componentRenderer.batterySymbols.p0, index, this.p0);
    componentRenderer.addPosition(componentRenderer.batterySymbols.p1, index, this.p1);
    componentRenderer.batterySymbols.index += 1;
};

BatteryComponent.prototype.draw = function draw(drawOptions, ctx, p, bgColor, fgColor, hasFocus)
{
    var p0 = this.p0;
    var p1 = this.p1;

    var rotationMatrix = RotationMatrix[this.rotation];
    if (!p)
    {
        p = this.p0;
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

    Component.containerPath(ctx, bgColor, p0, p1);
    ctx.stroke();

    Component.drawFgNode(ctx, null, 1, p1);
};

BatteryComponent.prototype.getConnections = function getConnections()
{
    return [this.id0, this.id1];
};

BatteryComponent.prototype.getOutputs = function getOutputs(id)
{
    return [];
};
