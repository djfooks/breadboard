
function DiodeComponent(breadboard)
{
    this.id0 = -1;
    this.p0 = [-1, -1];

    this.id1 = -1;
    this.p1 = [-1, -1];

    this.rotation = 0;
    this.pulsePaths = [];

    this.hitbox = new Hitbox(0, 0, 0, 0, this);
}
Component.addComponentFunctions(DiodeComponent);

DiodeComponent.prototype.type = ComponentTypes.DIODE;

DiodeComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    this.p0 = [p[0], p[1]];
    var matrix = RotationMatrix[this.rotation];

    this.p0 = [p[0], p[1]];
    this.id0 = breadboard.getIndex(p[0], p[1]);

    this.p1 = AddTransformedVector(this.p0, matrix, [0, 1]);
    this.id1 = breadboard.getIndex(this.p1[0], this.p1[1]);

    this.pulsePaths = [];
    Component.updateHitbox(this, p, this.p1);
};

DiodeComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new DiodeComponent(breadboard);
    cloneComponent.move(breadboard, this.p0, this.rotation);
    return cloneComponent;
};

DiodeComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.DIODE,
        p0: this.p0,
        rotation: this.rotation
    };
};

DiodeComponent.prototype.isValidPosition = function isValidPosition(breadboard, p0, rotation)
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

DiodeComponent.prototype.draw = function draw(drawOptions, ctx, p, bgColor, fgColor)
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
    ctx.arc(p0[0], p0[1], radius, 0, Math.PI * 2.0);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p1[0], p1[1], radius, 0, Math.PI * 2.0);
    ctx.fill();

    ctx.lineWidth = 0.05;
    ctx.strokeStyle = bgColor;
    var arrowHead0 = AddTransformedVector(p0, rotationMatrix, [0, 0.65]);
    var arrowLeft0 = AddTransformedVector(p0, rotationMatrix, [-Component.border, 0.15]);
    var arrowRight0 = AddTransformedVector(p0, rotationMatrix, [Component.border, 0.15]);
    ctx.beginPath();
    ctx.moveTo(arrowLeft0[0], arrowLeft0[1]);
    ctx.lineTo(arrowHead0[0], arrowHead0[1]);
    ctx.lineTo(arrowRight0[0], arrowRight0[1]);
    ctx.stroke();

    Component.containerPath(ctx, bgColor, p0, p1);
    ctx.stroke();

    var value0 = drawOptions.getConnectionValue(this.id0);
    var value1 = drawOptions.getConnectionValue(this.id1);

    Component.drawFgNode(ctx, fgColor, value0, p0);
    Component.drawFgNode(ctx, fgColor, value1, p1);
};

DiodeComponent.prototype.getConnections = function getConnections()
{
    return [this.id0, this.id1];
};

DiodeComponent.prototype.getOutputs = function getOutputs(id)
{
    if (id === this.id0)
    {
        return [this.id1];
    }
    else if (id === this.id1)
    {
        return [];
    }
    throw new Error();
};

DiodeComponent.prototype.isConnected = function isConnected(id0, id1)
{
    if (id0 === this.id0 && id1 === this.id1)
    {
        return true;
    }
    else if (id0 === this.id1 && id1 === this.id0)
    {
        return false;
    }
    throw new Error();
};
