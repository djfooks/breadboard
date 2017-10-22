
function DebuggerComponent(breadboard)
{
    this.p = [-1, -1];

    this.powerId = [];
    this.powerP = [-1, -1];

    this.pinId = [];
    this.pinP = [];

    var i;
    for (i = 0; i < 8; i += 1)
    {
        this.pinId.push(-1);
        this.pinP.push([-1, -1]);
    }

    this.previousValue = 0;
    this.value = 0;
    this.editingValue = false;
    this.debugType = DebuggerComponent.debugType.WRITE;

    this.pulsePaths = [];

    Component.addHitbox(breadboard, this);
}

DebuggerComponent.debugType = {
    WRITE: 1,
    READ: 2
};

DebuggerComponent.prototype.type = ComponentTypes.DEBUGGER;

DebuggerComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.DEBUGGER,
        p: this.p,
        rotation: this.rotation,
        value: this.value,
    };
};

DebuggerComponent.prototype.stateFromJson = function stateFromJson(json)
{
    this.value = json.value | 0;
};

DebuggerComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    var matrix = RotationMatrix[this.rotation];
    this.p = [p[0], p[1]];

    this.powerP = [p[0], p[1]];
    this.powerId = breadboard.getIndex(p[0], p[1]);

    var i;
    for (i = 0; i < 8; i += 1)
    {
        this.pinP[i] = AddTransformedVector(p, matrix, [i, 1]);
        this.pinId[i] = breadboard.getIndex(this.pinP[i][0], this.pinP[i][1]);
    }

    this.pulsePaths = [];
    Component.updateHitbox(this, p, this.pinP[7]);
};

DebuggerComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new DebuggerComponent(breadboard);
    cloneComponent.move(breadboard, this.p, this.rotation);
    return cloneComponent;
};

DebuggerComponent.prototype.isValidPosition = function isValidPosition(breadboard, p, rotation)
{
    var rotationMatrix = RotationMatrix[rotation];
    var i;
    var isValid = true;
    for (i = 0; i < 8; i += 1)
    {
        var pin = AddTransformedVector(p, rotationMatrix, [i, 1]);
        var component = breadboard.getComponent(pin);
        isValid = isValid && breadboard.validPosition(pin) && (!component || component === this);
    }
    return isValid;
};

DebuggerComponent.prototype.draw = function draw(drawOptions, ctx, p, bgColor, fgColor)
{
    var rotationMatrix = RotationMatrix[this.rotation];
    var pinP = this.pinP;
    var i;

    if (!p)
    {
        p = this.p;
    }
    else
    {
        pinP = [];
        for (i = 0; i < 8; i += 1)
        {
            pinP.push(AddTransformedVector(p, rotationMatrix, [i, 1]));
        }
    }

    var radius = Component.connectionBgRadius;
    ctx.fillStyle = bgColor;

    ctx.beginPath();
    ctx.arc(p[0], p[1], radius, 0, Math.PI * 2.0);
    ctx.fill();

    for (i = 0; i < 8; i += 1)
    {
        ctx.beginPath();
        ctx.arc(pinP[i][0], pinP[i][1], radius, 0, Math.PI * 2.0);
        ctx.fill();
    }

    Component.containerPath(drawOptions, ctx, bgColor, p, pinP[7]);
    ctx.stroke();

    var color;
    var value0 = drawOptions.getConnectionValue(this.powerId);
    Component.drawFgNode(ctx, fgColor, value0, p);

    for (i = 0; i < 8; i += 1)
    {
        var pinValue = drawOptions.getConnectionValue(this.pinId[i]);
        Component.drawFgNode(ctx, fgColor, pinValue, pinP[i]);
    }

    ctx.fillStyle = "#FFFFFF";
    var textBox0 = AddTransformedVector(p, rotationMatrix, [6, 0]);
    var textBox1 = AddTransformedVector(p, rotationMatrix, [1, 0]);
    Component.containerPath(drawOptions, ctx, bgColor, textBox0, textBox1);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.editingValue ? "#FF0000" : bgColor;
    var textPos = AddTransformedVector(p, rotationMatrix, [5.9, 0.3])
    ctx.textAlign="right";
    ctx.font = "bold 0.9px Courier New";
    ctx.fillText(this.value, textPos[0], textPos[1]);
};

DebuggerComponent.prototype.update = function update(breadboard)
{
};

DebuggerComponent.prototype.getConnections = function getConnections(breadboard)
{
    var connections = [this.powerId];
    var rotationMatrix = RotationMatrix[this.rotation];
    var i;
    for (i = 0; i < 8; i += 1)
    {
        var screenP = AddTransformedVector(this.p, rotationMatrix, [i + 1, 0]);
        connections.push(breadboard.getIndex(screenP[0], screenP[1]));
        connections.push(this.pinId[0]);
    }
    return connections;
};

DebuggerComponent.prototype.onKeyDown = function onKeyDown(breadboard, key, keyCode)
{
    if (keyCode === 13)
    {
        this.editingValue = false;
        breadboard.unregisterKeyDown();
        return;
    }
    if (keyCode === 8)
    {
        this.value = (this.value / 10) | 0;
    }
    else if (key === "+")
    {
        this.value += 1;
    }
    else if (key === "-")
    {
        this.value -= 1;
    }
    else if (keyCode <= "0".charCodeAt(0) && keyCode >= "9".charCodeAt(0))
    {
        this.value = (this.value + key) | 0;
    }
    else
    {
        return;
    }

    if (this.value < 0 || this.value > 255)
    {
        this.value = 0;
    }

    this.updateValue(breadboard);
};

DebuggerComponent.prototype.updateValue = function updateValue(breadboard)
{
    if (this.previousValue === this.value)
    {
        return;
    }
    this.previousValue = this.value;

    breadboard.dirtySave = true;

    var i;
    var j;
    for (i = 0; i < this.pulsePaths.length; i += 1)
    {
        var child = this.pulsePaths[i];
        for (j = 0; j < this.pinId.length; j += 1)
        {
            if (this.pinId[j] === child.inputId)
            {
                var connected = (this.value & (1 << (7 - j))) !== 0;
                if (connected)
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
        }
    }
}

DebuggerComponent.prototype.toggle = function toggle(breadboard, p)
{
    if (this.textBoxElement)
    {
        return;
    }

    var rotationMatrix = RotationMatrix[this.rotation];
    var screen0 = AddTransformedVector(this.p, rotationMatrix, [1, 0]);
    var screen1 = AddTransformedVector(this.p, rotationMatrix, [6, 0]);
    var min = [Math.min(screen0[0], screen1[0]), Math.min(screen0[1], screen1[1])];
    var max = [Math.max(screen0[0], screen1[0]), Math.max(screen0[1], screen1[1])];
    if (p[0] >= min[0] && p[0] <= max[0] && p[1] >= min[1] && p[1] <= max[1])
    {
        this.editingValue = true;
        breadboard.registerKeyDown(this.onKeyDown.bind(this));
    }
};

DebuggerComponent.prototype.getOutputs = function getOutputs(id)
{
    var i;
    if (id === this.powerId)
    {
        return [this.pinId[0],
                this.pinId[1],
                this.pinId[2],
                this.pinId[3],
                this.pinId[4],
                this.pinId[5],
                this.pinId[6],
                this.pinId[7]];
    }
    for (i = 0; i < 8; i += 1)
    {
        if (id === this.pinId[i])
        {
            return [this.powerId];
        }
    }
    return [];
    //TODO
    //throw new Error();
};

DebuggerComponent.prototype.isConnected = function isConnected(id0, id1)
{
    var otherId;
    if (id0 === this.powerId)
    {
        otherId = id1;
    }
    else if (id1 === this.powerId)
    {
        otherId = id0;
    }
    else
    {
        return false;
    }

    var i;
    for (i = 0; i < 8; i += 1)
    {
        if (otherId === this.pinId[i])
        {
            return this.value & (1 << (7 - i));
        }
    }
};
