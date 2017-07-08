
function DiodeComponent(breadboard)
{
    this.p = [-1, -1];

    this.id0 = -1;
    this.p0 = [-1, -1];

    this.id1 = -1;
    this.p1 = [-1, -1];

    this.bgDirty = true;
    this.canToggle = true;

    this.rotation = 0;

    this.pulsePaths = [];

    Component.addHitbox(breadboard, this);
}

DiodeComponent.type = ComponentTypes.DIODE;

DiodeComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    this.p = [p[0], p[1]];
    var matrix = RotationMatrix[this.rotation];

    this.p0 = [p[0], p[1]];
    this.id0 = breadboard.getIndex(p[0], p[1]);

    this.p1 = AddTransformedVector(this.p0, matrix, [0, 1]);
    this.id1 = breadboard.getIndex(this.p1[0], this.p1[1]);

    this.bgDirty = true;
    this.canToggle = true;

    this.pulsePaths = [];
    Component.updateHitbox(breadboard, this, p, [0, 1]);
};

DiodeComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new DiodeComponent(breadboard);
    cloneComponent.move(breadboard, this.p, this.rotation);
    return cloneComponent;
};

DiodeComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.DIODE,
        p: this.p,
        rotation: this.rotation
    };
};

DiodeComponent.prototype.stateFromJson = function stateFromJson(json)
{
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

DiodeComponent.prototype.draw = function draw(breadboard, ctx, p, bgColor, fgColor, gameStage)
{
    var top = breadboard.top;
    var left = breadboard.left;
    var spacing = breadboard.spacing;

    if (!p)
    {
        p = [left + this.p[0] * spacing, top + this.p[1] * spacing];
    }

    var rotationMatrix = RotationMatrix[this.rotation];

    var screenP0 = gameStage.fromView(p);
    var screenP1 = AddTransformedVector(screenP0, rotationMatrix, [0, spacing]);

    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 6;
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(screenP0[0], screenP0[1], 6, 0, Math.PI * 2);
    ctx.moveTo(screenP1[0], screenP1[1]);
    ctx.arc(screenP1[0], screenP1[1], 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 1.5;
    var arrowHead0 = AddTransformedVector(screenP0, rotationMatrix, [0, spacing * 0.6]);
    var arrowLeft0 = AddTransformedVector(screenP0, rotationMatrix, [-spacing * 0.4 + ctx.lineWidth, spacing * 0.3]);
    var arrowRight0 = AddTransformedVector(screenP0, rotationMatrix, [spacing * 0.4 - ctx.lineWidth, spacing * 0.3]);
    ctx.beginPath();
    ctx.moveTo(arrowLeft0[0], arrowLeft0[1]);
    ctx.lineTo(arrowHead0[0], arrowHead0[1]);
    ctx.lineTo(arrowRight0[0], arrowRight0[1]);
    ctx.stroke();

    Component.drawContainer(breadboard, ctx, bgColor, screenP0, screenP1);

    var value0 = breadboard.getConnectionValue(this.id0);
    var value1 = breadboard.getConnectionValue(this.id1);

    Component.drawFgNode(breadboard, ctx, fgColor, value0, screenP0);
    Component.drawFgNode(breadboard, ctx, fgColor, value1, screenP1);
};

DiodeComponent.prototype.update = function update()
{
};

DiodeComponent.prototype.toggle = function toggle()
{
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
