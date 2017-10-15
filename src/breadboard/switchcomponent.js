
function SwitchComponent(breadboard)
{
    this.p = [-1, -1];

    this.id0 = -1;
    this.p0 = [-1, -1];

    this.id1 = -1;
    this.p1 = [-1, -1];

    this.connected = false;
    this.bgDirty = true;
    this.canToggle = true;

    this.rotation = 0;

    this.pulsePaths = [];

    Component.addHitbox(breadboard, this);
}

SwitchComponent.type = ComponentTypes.SWITCH;

SwitchComponent.prototype.move = function move(breadboard, p, rotation)
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

SwitchComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new SwitchComponent(breadboard);
    cloneComponent.move(breadboard, this.p, this.rotation);
    return cloneComponent;
};

SwitchComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.SWITCH,
        p: this.p,
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

SwitchComponent.prototype.isValidPosition = function isValidPosition(breadboard, p0, rotation)
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

SwitchComponent.prototype.draw = function draw(drawOptions, ctx, p, bgColor, fgColor, gameStage)
{
    var top = drawOptions.top;
    var left = drawOptions.left;
    var spacing = drawOptions.spacing;
    var zoom = drawOptions.zoom;

    if (!p)
    {
        p = [left + this.p[0] * spacing, top + this.p[1] * spacing];
    }

    var rotationMatrix = RotationMatrix[this.rotation];

    var screenP0 = gameStage.fromView(p);
    var screenP1 = AddTransformedVector(screenP0, rotationMatrix, [0, spacing]);

    var radius = 6 * zoom;
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = radius;
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(screenP0[0], screenP0[1], radius, 0, Math.PI * 2);
    ctx.moveTo(screenP1[0], screenP1[1]);
    ctx.arc(screenP1[0], screenP1[1], radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    if (this.connected)
    {
        ctx.lineWidth = 11 * zoom;
        ctx.moveTo(screenP0[0], screenP0[1]);
        ctx.lineTo(screenP1[0], screenP1[1]);
        ctx.stroke();
    }

    Component.drawContainer(drawOptions, ctx, bgColor, screenP0, screenP1);

    var value0 = drawOptions.getConnectionValue(this.id0);
    var value1 = drawOptions.getConnectionValue(this.id1);
    var color;
    ctx.lineWidth = 3 * zoom;

    Component.drawFgNode(drawOptions, ctx, fgColor, value0, screenP0);
    Component.drawFgNode(drawOptions, ctx, fgColor, value1, screenP1);

    ctx.beginPath();
    if (this.connected)
    {
        color = fgColor || drawOptions.getWireColor(Math.min(value0, value1));
        ctx.strokeStyle = color;
        ctx.lineWidth = 8 * zoom;
        ctx.moveTo(screenP0[0], screenP0[1]);
        ctx.lineTo(screenP1[0], screenP1[1]);
        ctx.stroke();
    }
};

SwitchComponent.prototype.update = function update()
{
};

SwitchComponent.prototype.toggle = function toggle()
{
    this.connected = !this.connected;
    this.bgDirty = true;

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
