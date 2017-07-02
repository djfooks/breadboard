
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

SwitchComponent.prototype.isValidPosition = function isValidPosition(breadboard, p, rotation)
{
    var rotationMatrix = RotationMatrix[rotation];

    var p0Component = breadboard.getComponent(p);
    var p1Component = breadboard.getComponent(AddTransformedVector(p, rotationMatrix, [0, 1]));

    var isValid = true;
    isValid = isValid && (!p0Component || p0Component === this);
    isValid = isValid && (!p1Component || p1Component === this);
    return isValid;
};

SwitchComponent.prototype.draw = function draw(breadboard, ctx, p, bgColor, fgColor)
{
    var top = breadboard.top;
    var left = breadboard.left;
    var spacing = breadboard.spacing;

    if (!p)
    {
        p = [left + this.p[0] * spacing, top + this.p[1] * spacing];
    }

    var rotationMatrix = RotationMatrix[this.rotation];

    var screenP0 = breadboard.gameStage.fromView(p);
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

    ctx.beginPath();
    if (this.connected)
    {
        ctx.lineWidth = 11;
        ctx.moveTo(screenP0[0], screenP0[1]);
        ctx.lineTo(screenP1[0], screenP1[1]);
        ctx.stroke();
    }

    Component.drawContainer(breadboard, ctx, bgColor, screenP0, screenP1);

    var value0 = breadboard.getConnectionValue(this.id0);
    var value1 = breadboard.getConnectionValue(this.id1);
    var color;
    ctx.lineWidth = 3;

    Component.drawFgNode(breadboard, ctx, fgColor, value0, screenP0);
    Component.drawFgNode(breadboard, ctx, fgColor, value1, screenP1);

    ctx.beginPath();
    if (this.connected)
    {
        color = fgColor || breadboard.getWireColor(Math.min(value0, value1));
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
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
