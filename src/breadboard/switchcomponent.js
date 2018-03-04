
function SwitchComponent(breadboard)
{
    this.p = [-1, -1];

    this.id0 = -1;
    this.p0 = [-1, -1];

    this.id1 = -1;
    this.p1 = [-1, -1];

    this.connected = false;
    this.rotation = 0;
    this.pulsePaths = [];

    Component.addHitbox(breadboard, this);
}

SwitchComponent.prototype.type = ComponentTypes.SWITCH;

SwitchComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    this.p = [p[0], p[1]];
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

SwitchComponent.prototype.draw = function draw(drawOptions, ctx, p, bgColor, fgColor, hasFocus)
{
    var p0 = this.p0;
    var p1 = this.p1;

    if (!p)
    {
        p = this.p;
    }
    else
    {
        var rotationMatrix = RotationMatrix[this.rotation];
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

    ctx.strokeStyle = bgColor;
    if (this.connected)
    {
        ctx.beginPath();
        ctx.lineWidth = 0.3;
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.stroke();
    }

    Component.containerPath(drawOptions, ctx, bgColor, p0, p1);
    ctx.stroke();

    var value0 = drawOptions.getConnectionValue(this.id0);
    var value1 = drawOptions.getConnectionValue(this.id1);

    Component.drawFgNode(ctx, fgColor, value0, p0);
    Component.drawFgNode(ctx, fgColor, value1, p1);

    ctx.beginPath();
    if (this.connected)
    {
        var color = fgColor || Wire.getColor(Math.min(value0, value1));
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.2;
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.stroke();
    }
};

SwitchComponent.prototype.reset = function reset()
{
};

SwitchComponent.prototype.update = function update()
{
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

SwitchComponent.prototype.getBusPosition = function getBusPosition()
{
    return null;
};
