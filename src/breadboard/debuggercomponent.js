
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
        debugType: this.debugType
    };
};

DebuggerComponent.prototype.stateFromJson = function stateFromJson(json)
{
    this.value = json.value | 0;
    this.debugType = json.debugType || DebuggerComponent.debugType.WRITE;
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

    if (this.debugType === DebuggerComponent.debugType.WRITE)
    {
        ctx.beginPath();
        ctx.arc(p[0], p[1], radius, 0, Math.PI * 2.0);
        ctx.fill();
    }

    for (i = 0; i < 8; i += 1)
    {
        ctx.beginPath();
        ctx.arc(pinP[i][0], pinP[i][1], radius, 0, Math.PI * 2.0);
        ctx.fill();
    }

    Component.containerPath(drawOptions, ctx, bgColor, p, pinP[7]);
    ctx.stroke();

    var color;
    if (this.debugType === DebuggerComponent.debugType.WRITE)
    {
        var value0 = drawOptions.getConnectionValue(this.powerId);
        Component.drawFgNode(ctx, fgColor, value0, p);
    }

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
    var textPos = AddTransformedVector(p, rotationMatrix, [5.9, 0.0])
    ctx.textAlign="right";
    ctx.textBaseline="middle";
    ctx.font = "bold 0.9px Courier New";
    ctx.fillText(this.value, textPos[0], textPos[1]);

    var cogP = AddTransformedVector(p, rotationMatrix, [7, 0]);
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(cogP[0], cogP[1], 0.35, 0, Math.PI * 2.0);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cogP[0], cogP[1], 0.3, 0, Math.PI * 2.0);
    ctx.fill();

    var innerRadius = 0.15;
    var outerRadius = 0.25;
    var teeth = 8;
    var inSize = 0.3;
    var teethSize = 0.15;
    ctx.beginPath();
    ctx.lineCap = "round";
    var firstPos = null;
    for (i = 0; i < teeth; i += 1)
    {
        var angle = (Math.PI * 2 / teeth) * i + 0.3;
        var inAngle0 = angle - inSize;
        var inAngle1 = angle + inSize;
        var in0 = [cogP[0] + Math.sin(inAngle0) * innerRadius, cogP[1] + Math.cos(inAngle0) * innerRadius];
        var in1 = [cogP[0] + Math.sin(inAngle1) * innerRadius, cogP[1] + Math.cos(inAngle1) * innerRadius];
        var toothAngle0 = angle - teethSize;
        var toothAngle1 = angle + teethSize;
        var tooth0 = [cogP[0] + Math.sin(toothAngle0) * outerRadius, cogP[1] + Math.cos(toothAngle0) * outerRadius];
        var tooth1 = [cogP[0] + Math.sin(toothAngle1) * outerRadius, cogP[1] + Math.cos(toothAngle1) * outerRadius];
        if (!firstPos)
        {
            ctx.moveTo(in0[0], in0[1]);
            firstPos = in0;
        }
        else
        {
            ctx.lineTo(in0[0], in0[1]);
        }
        ctx.lineTo(tooth0[0], tooth0[1]);
        ctx.lineTo(tooth1[0], tooth1[1]);
        ctx.lineTo(in1[0], in1[1]);
    }
    ctx.lineTo(firstPos[0], firstPos[1]);
    ctx.stroke();
    ctx.lineCap = "butt";
};

DebuggerComponent.prototype.reset = function reset()
{
};

DebuggerComponent.prototype.update = function update(breadboard)
{
    if (this.debugType === DebuggerComponent.debugType.READ)
    {
        this.value = 0;
        var i;
        for (i = 0; i < 8; i += 1)
        {
            if (breadboard.getConnection(this.pinId[i]).isOn())
            {
                this.value |= (1 << (7 - i));
            }
        }
        this.previousValue = this.value;
    }
};

DebuggerComponent.prototype.getConnections = function getConnections(breadboard)
{
    var connections = [this.powerId];
    var rotationMatrix = RotationMatrix[this.rotation];
    var i;
    for (i = 0; i < 8; i += 1)
    {
        connections.push(this.pinId[i]);
    }
    for (i = 0; i < 7; i += 1)
    {
        var screenP = AddTransformedVector(this.p, rotationMatrix, [i + 1, 0]);
        connections.push(breadboard.getIndex(screenP[0], screenP[1]));
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
    else if (key === "0" || (key | 0) !== 0)
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

    var write = (this.debugType === DebuggerComponent.debugType.WRITE);
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
                if (connected && write)
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
};

DebuggerComponent.prototype.toggle = function toggle(breadboard, p)
{
    var rotationMatrix = RotationMatrix[this.rotation];
    var configure = AddTransformedVector(this.p, rotationMatrix, [7, 0]);
    if (p[0] === configure[0] && p[1] === configure[1])
    {
        if (this.debugType === DebuggerComponent.debugType.WRITE)
        {
            this.debugType = DebuggerComponent.debugType.READ;
            this.editingValue = false;
            breadboard.unregisterKeyDown();
            this.value = 0;
            this.updateValue(breadboard);
        }
        else
        {
            this.debugType = DebuggerComponent.debugType.WRITE;
        }
        breadboard.dirty = true;
        return;
    }

    if (this.debugType === DebuggerComponent.debugType.READ)
    {
        return;
    }

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
    if (this.debugType === DebuggerComponent.debugType.READ)
    {
        return false;
    }

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

DebuggerComponent.prototype.getBusPosition = function getBusPosition()
{
    return null;
};
