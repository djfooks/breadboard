
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

    var container = this.container = new PIXI.Container();
    breadboard.stage.addChild(container);

    container.interactive = true;
    container.mousedown = breadboard.onComponentMouseDown.bind(breadboard, this, 0);
    container.rightdown = breadboard.onComponentMouseDown.bind(breadboard, this, 1);
    container.mouseup = breadboard.onComponentMouseUp.bind(breadboard, this, 0);
    container.rightup = breadboard.onComponentMouseUp.bind(breadboard, this, 1);
}

SwitchComponent.type = ComponentTypes.SWITCH;
SwitchComponent.border = 0.38;

SwitchComponent.prototype.updateContainer = function updateContainer(breadboard)
{
    var container = this.container;

    var left = breadboard.left;
    var top = breadboard.top;
    var spacing = breadboard.spacing;
    var border = spacing * SwitchComponent.border;

    var rotationMatrix = RotationMatrix[this.rotation];
    var screenP0 = [left + this.p0[0] * spacing, top + this.p0[1] * spacing];
    var screenP1 = AddTransformedVector(screenP0, rotationMatrix, [0, spacing]);

    var screenMin = [Math.min(screenP0[0], screenP1[0]), Math.min(screenP0[1], screenP1[1])];
    var screenMax = [Math.max(screenP0[0], screenP1[0]), Math.max(screenP0[1], screenP1[1])];

    container.hitArea = new PIXI.Rectangle(
        screenMin[0] - border,
        screenMin[1] - border,
        screenMax[0] - screenMin[0] + border * 2.0,
        screenMax[1] - screenMin[1] + border * 2.0);
};

SwitchComponent.prototype.move = function move(breadboard, p)
{
    var matrix = RotationMatrix[this.rotation];
    this.p = [p[0], p[1]];

    this.p0 = [p[0], p[1]];
    this.id0 = breadboard.getIndex(p[0], p[1]);

    this.p1 = AddTransformedVector(this.p0, matrix, [0, 1]);
    this.id1 = breadboard.getIndex(this.p1[0], this.p1[1]);

    this.bgDirty = true;
    this.canToggle = true;

    this.pulsePaths = [];
    this.updateContainer(breadboard);
};

SwitchComponent.prototype.rotate = function rotate(breadboard)
{
    this.rotation = Rotate90(this.rotation);
    var matrix = RotationMatrix[this.rotation];

    this.p1 = AddTransformedVector(this.p0, matrix, [0, 1]);
    this.id1 = breadboard.getIndex(this.p1[0], this.p1[1]);

    this.bgDirty = true;
    this.canToggle = true;

    this.pulsePaths = [];
    this.updateContainer(breadboard);
};

SwitchComponent.prototype.clone = function clone(breadboard)
{
    var newSwitch = new SwitchComponent(breadboard);
    newSwitch.move(breadboard, this.p0);
    return newSwitch;
};

SwitchComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.SWITCH,
        p: this.p0,
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

SwitchComponent.prototype.draw = function draw(breadboard, bgGraphics, fgGraphics, p)
{
    var top = breadboard.top;
    var left = breadboard.left;
    var spacing = breadboard.spacing;
    var border = spacing * SwitchComponent.border;

    if (!p)
    {
        p = [left + this.p0[0] * spacing, top + this.p0[1] * spacing];
    }

    var rotationMatrix = RotationMatrix[this.rotation];

    var screenP0 = p;
    var screenP1 = AddTransformedVector(p, rotationMatrix, [0, spacing]);

    if (true)//this.bgDirty || breadboard.dirty)
    {
        this.bgDirty = false;

        bgGraphics.lineStyle(6, 0x000000, 1);
        bgGraphics.beginFill(0x000000, 1);
        bgGraphics.drawCircle(screenP0[0], screenP0[1], 6);
        bgGraphics.drawCircle(screenP1[0], screenP1[1], 6);

        if (this.connected)
        {
            bgGraphics.lineStyle(11, 0x000000, 1);
            bgGraphics.moveTo(screenP0[0], screenP0[1]);
            bgGraphics.lineTo(screenP1[0], screenP1[1]);
        }

        bgGraphics.lineStyle(2, 0x000000, 1);
        bgGraphics.beginFill(0x000000, 0);
        var screenMin = [Math.min(screenP0[0], screenP1[0]), Math.min(screenP0[1], screenP1[1])];
        var screenMax = [Math.max(screenP0[0], screenP1[0]), Math.max(screenP0[1], screenP1[1])];
        bgGraphics.drawRect(screenMin[0] - border,
                            screenMin[1] - border,
                            screenMax[0] - screenMin[0] + border * 2.0,
                            screenMax[1] - screenMin[1] + border * 2.0);
    }

    var overrideColor = null;
    if (!fgGraphics)
    {
        fgGraphics = bgGraphics;
        overrideColor = 0xFFFFFF;
    }

    var value0 = breadboard.getConnectionValue(this.id0);
    var color;
    color = overrideColor || breadboard.getWireColor(value0);
    fgGraphics.lineStyle(3, color, 1);
    fgGraphics.beginFill(color, 1);
    fgGraphics.drawCircle(screenP0[0], screenP0[1], 6);

    var value1 = breadboard.getConnectionValue(this.id1);
    color = overrideColor || breadboard.getWireColor(value1);
    fgGraphics.lineStyle(3, color, 1);
    fgGraphics.beginFill(color, 1);
    fgGraphics.drawCircle(screenP1[0], screenP1[1], 6);

    if (this.connected)
    {
        color = overrideColor || breadboard.getWireColor(Math.min(value0, value1));
        fgGraphics.lineStyle(8, color, 1);
        fgGraphics.moveTo(screenP0[0], screenP0[1]);
        fgGraphics.lineTo(screenP1[0], screenP1[1]);
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
