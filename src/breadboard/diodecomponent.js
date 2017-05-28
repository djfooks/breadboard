
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

    var container = this.container = new PIXI.Container();
    breadboard.stage.addChild(container);

    container.interactive = true;
    container.mousedown = breadboard.onComponentMouseDown.bind(breadboard, this, 0);
    container.rightdown = breadboard.onComponentMouseDown.bind(breadboard, this, 1);
    container.mouseup = breadboard.onComponentMouseUp.bind(breadboard, this, 0);
    container.rightup = breadboard.onComponentMouseUp.bind(breadboard, this, 1);
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
    Component.updateContainer(breadboard, this, p, [0, 1]);
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

DiodeComponent.prototype.isValidPosition = function isValidPosition(breadboard, p, rotation)
{
    var rotationMatrix = RotationMatrix[rotation];

    var p0Component = breadboard.getComponent(p);
    var p1Component = breadboard.getComponent(AddTransformedVector(p, rotationMatrix, [0, 1]));

    var isValid = true;
    isValid = isValid && (!p0Component || p0Component === this);
    isValid = isValid && (!p1Component || p1Component === this);
    return isValid;
};

DiodeComponent.prototype.draw = function draw(breadboard, bgGraphics, fgGraphics, p)
{
    var top = breadboard.top;
    var left = breadboard.left;
    var spacing = breadboard.spacing;

    if (!p)
    {
        p = [left + this.p[0] * spacing, top + this.p[1] * spacing];
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
        Component.drawContainer(breadboard, bgGraphics, screenP0, screenP1);
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

    bgGraphics.lineStyle(1.5, 0x000000, 1);
    bgGraphics.beginFill(0x000000, 0);
    var arrowHead0 = AddTransformedVector(screenP0, rotationMatrix, [0, spacing * 0.6]);
    var arrowLeft0 = AddTransformedVector(screenP0, rotationMatrix, [-spacing * 0.4, spacing * 0.3]);
    var arrowRight0 = AddTransformedVector(screenP0, rotationMatrix, [spacing * 0.4, spacing * 0.3]);
    bgGraphics.moveTo(arrowLeft0[0], arrowLeft0[1]);
    bgGraphics.lineTo(arrowHead0[0], arrowHead0[1]);
    bgGraphics.lineTo(arrowRight0[0], arrowRight0[1]);
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
