
function DebuggerComponent(breadboard)
{
    this.p0 = [-1, -1];
    this.p1 = this.p0;

    this.powerId = [];
    this.powerP = [-1, -1];
    this.powerTextureIndex = -1;

    this.pinId = [];
    this.pinP = [];
    this.pinTextureIndex = [];

    var i;
    for (i = 0; i < 8; i += 1)
    {
        this.pinId.push(-1);
        this.pinP.push([-1, -1]);
        this.pinTextureIndex.push(-1);
    }

    this.previousValue = 0;
    this.value = 0;
    this.valueSelected = true;
    this.debugType = DebuggerComponent.debugType.WRITE;

    this.pulsePaths = [];

    this.hitbox = new Hitbox(0, 0, 0, 0, this);
}
Component.addComponentFunctions(DebuggerComponent);

DebuggerComponent.debugType = {
    WRITE: 1,
    READ: 2
};

DebuggerComponent.prototype.type = ComponentTypes.DEBUGGER;

DebuggerComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.DEBUGGER,
        p0: this.p0,
        rotation: this.rotation,
        value: this.value,
        debugType: this.debugType
    };
};

DebuggerComponent.prototype.stateFromJson = function stateFromJson(json)
{
    this.value = json.value | 0;
    this.previousValue = this.value;
    this.debugType = json.debugType || DebuggerComponent.debugType.WRITE;
};

DebuggerComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    var matrix = RotationMatrix[this.rotation];
    this.p0 = [p[0], p[1]];

    this.powerP = [p[0], p[1]];
    this.powerId = breadboard.getIndex(p[0], p[1]);

    var i;
    for (i = 0; i < 8; i += 1)
    {
        this.pinP[i] = AddTransformedVector(p, matrix, [i, 1]);
        this.pinId[i] = breadboard.getIndex(this.pinP[i][0], this.pinP[i][1]);
    }

    this.p1 = this.pinP[7];

    this.pulsePaths = [];
    Component.updateHitbox(this, p, this.pinP[7]);
};

DebuggerComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new DebuggerComponent(breadboard);
    cloneComponent.value = this.value;
    cloneComponent.move(breadboard, this.p0, this.rotation);
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

DebuggerComponent.textConfig = {
    width: 300,
    align: 'right',
    letterSpacing: 1,
    scale: 1,
    rotate: false,
    color: "#F00"
};

DebuggerComponent.textConfigRotate = {
    width: 300,
    align: 'right',
    letterSpacing: 1,
    scale: 1,
    rotate: true,
    color: "#F00"
};

DebuggerComponent.prototype.addText = function addText(componentRenderer, breadboard)
{
    var rotationMatrix = RotationMatrix[this.rotation];
    var textConfig;
    var offset;
    if (this.rotation === 0)
    {
        textConfig = DebuggerComponent.textConfig;
        offset = [0.9, 0.0];
    }
    else if (this.rotation === 1)
    {
        textConfig = DebuggerComponent.textConfigRotate;
        offset = [0.9, 0.0];
    }
    else if (this.rotation === 2)
    {
        textConfig = DebuggerComponent.textConfig;
        offset = [10.3, 0.0];
    }
    else if (this.rotation === 3)
    {
        textConfig = DebuggerComponent.textConfigRotate;
        offset = [10.3, 0.0];
    }
    var textPos = AddTransformedVector(this.p0, rotationMatrix, offset);

    if (this.debugType === DebuggerComponent.debugType.WRITE)
    {
        componentRenderer.addText(textPos, this.value + "", (breadboard.focusComponent === this) ? 255 : 0, textConfig);
    }
    else
    {
        componentRenderer.addDynamicText(textPos, this.value + "", (breadboard.focusComponent === this) ? 255 : 0, textConfig);
    }
};

DebuggerComponent.prototype.prepareGeometry = function prepareGeometry(componentRenderer)
{
    if (this.debugType === DebuggerComponent.debugType.WRITE)
    {
        componentRenderer.outputNodes.count += 9;
        componentRenderer.textRenderer.textObjects.count += (this.value + "").length;
    }
    else
    {
        componentRenderer.inputNodes.count += 9;
    }
};

DebuggerComponent.prototype.addGeometry = function addGeometry(componentRenderer, breadboard, isTray)
{
    var i;
    if (this.debugType === DebuggerComponent.debugType.WRITE)
    {
        for (i = 0; i < 8; i += 1)
        {
            this.pinTextureIndex[i] = componentRenderer.addOutputNode(breadboard, this.pinP[i], isTray);
        }

        this.powerTextureIndex = componentRenderer.addOutputNode(breadboard, this.powerP, isTray);
        this.addText(componentRenderer, breadboard);
    }
    else
    {
        for (i = 0; i < 8; i += 1)
        {
            this.pinTextureIndex[i] = componentRenderer.addNode(breadboard, componentRenderer.inputNodes, this.pinP[i], this.pinId[i], isTray);
        }
    }
};

DebuggerComponent.prototype.dynamicPrepareGeometry = function dynamicPrepareGeometry(componentRenderer)
{
    if (this.debugType === DebuggerComponent.debugType.READ)
    {
        componentRenderer.dynamicTextRenderer.textObjects.count += (this.value + "").length;
    }
};

DebuggerComponent.prototype.dynamicAddGeometry = function dynamicAddGeometry(componentRenderer, breadboard, isTray)
{
    if (this.debugType === DebuggerComponent.debugType.READ)
    {
        this.addText(componentRenderer, breadboard);
    }
};

DebuggerComponent.prototype.render = function render(breadboard, renderer)
{
    if (this.debugType === DebuggerComponent.debugType.WRITE)
    {
        var i;
        for (i = 0; i < 8; i += 1)
        {
            Component.renderPinValue(breadboard, renderer, this, this.pinId[i], this.pinTextureIndex[i]);
        }
        Component.renderPinValue(breadboard, renderer, this, this.powerId, this.powerTextureIndex);
    }
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
        if (this.previousValue != this.value)
        {
            breadboard.dynamicGeometryDirty = true;
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
        var screenP = AddTransformedVector(this.p0, rotationMatrix, [i + 1, 0]);
        connections.push(breadboard.getIndex(screenP[0], screenP[1]));
    }
    return connections;
};

DebuggerComponent.prototype.onKeyDown = function onKeyDown(breadboard, key, keyCode)
{
    if (keyCode === 13)
    {
        breadboard.removeFocus();
        return;
    }
    if (keyCode === 8)
    {
        if (this.valueSelected)
        {
            this.value = 0;
        }

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
        if (this.valueSelected)
        {
            this.value = 0;
        }
        this.value = (this.value + key) | 0;
    }
    else
    {
        return;
    }

    this.valueSelected = false;

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
    if (write)
    {
        breadboard.dirtySave = true;
        breadboard.geometryDirty = true;
    }

    var i;
    var j;
    for (i = 0; i < this.pulsePaths.length; i += 1)
    {
        var child = this.pulsePaths[i];
        if (this.powerId == child.inputId)
        {
            for (j = 0; j < this.pinId.length; j += 1)
            {
                if (this.pinId[j] === child.sourceId)
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
            // continue;
        }

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
                // continue;
            }
        }
    }
};

DebuggerComponent.prototype.configure = function configure(breadboard)
{
    if (this.debugType === DebuggerComponent.debugType.WRITE)
    {
        this.debugType = DebuggerComponent.debugType.READ;
        breadboard.removeFocus();
    }
    else
    {
        this.debugType = DebuggerComponent.debugType.WRITE;
    }
    this.value = 0;
    this.updateValue(breadboard);
    breadboard.dirty = true;
    breadboard.geometryDirty = true;
};

DebuggerComponent.prototype.toggle = function toggle(breadboard, p)
{
    var rotationMatrix = RotationMatrix[this.rotation];
    var configure = AddTransformedVector(this.p0, rotationMatrix, [7, 0]);
    if (p[0] === configure[0] && p[1] === configure[1])
    {
        this.configure(breadboard);
        return;
    }

    if (this.debugType === DebuggerComponent.debugType.READ)
    {
        return;
    }

    var screen0 = AddTransformedVector(this.p0, rotationMatrix, [1, 0]);
    var screen1 = AddTransformedVector(this.p0, rotationMatrix, [6, 0]);
    var min = [Math.min(screen0[0], screen1[0]), Math.min(screen0[1], screen1[1])];
    var max = [Math.max(screen0[0], screen1[0]), Math.max(screen0[1], screen1[1])];
    if (p[0] >= min[0] && p[0] <= max[0] && p[1] >= min[1] && p[1] <= max[1])
    {
        breadboard.takeFocus(this, this.onKeyDown.bind(this));
        this.valueSelected = true;
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
