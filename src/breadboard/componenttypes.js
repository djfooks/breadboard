
var ComponentTypes = {
    SWITCH: 1,
    RELAY: 2,
    DIODE: 3,
};

var Component = {};

Component.border = 0.38;

Component.updateContainer = function updateContainer(breadboard, component, p, size)
{
    var container = component.container;

    var left = breadboard.left;
    var top = breadboard.top;
    var spacing = breadboard.spacing;
    var border = spacing * Component.border;

    var rotationMatrix = RotationMatrix[component.rotation];
    var screenP0 = [left + component.p[0] * spacing, top + component.p[1] * spacing];
    var screenP1   = AddTransformedVector(screenP0, rotationMatrix, [size[0] * spacing, size[1] * spacing]);

    var screenMin = [Math.min(screenP0[0], screenP1[0]), Math.min(screenP0[1], screenP1[1])];
    var screenMax = [Math.max(screenP0[0], screenP1[0]), Math.max(screenP0[1], screenP1[1])];

    container.hitArea = new PIXI.Rectangle(
        screenMin[0] - border,
        screenMin[1] - border,
        screenMax[0] - screenMin[0] + border * 2.0,
        screenMax[1] - screenMin[1] + border * 2.0);
};

Component.drawContainer = function drawContainer(breadboard, graphics, screenP0, screenP1)
{
    var border = breadboard.spacing * Component.border;
    var screenMin = [Math.min(screenP0[0], screenP1[0]), Math.min(screenP0[1], screenP1[1])];
    var screenMax = [Math.max(screenP0[0], screenP1[0]), Math.max(screenP0[1], screenP1[1])];
    graphics.drawRect(screenMin[0] - border,
                      screenMin[1] - border,
                      screenMax[0] - screenMin[0] + border * 2.0,
                      screenMax[1] - screenMin[1] + border * 2.0);
};

Component.getColor = function drawContainer(pickedUp)
{
    if (pickedUp)
    {
        return 0xAAAAAA;
    }
    return 0x000000;
};

Component.getGrabPoint = function getGrabPoint(breadboard, component, p)
{
    var top = breadboard.top;
    var left = breadboard.left;
    var spacing = breadboard.spacing;

    var componentP = [left + component.p[0] * spacing, top + component.p[1] * spacing];
    return [componentP[0] - p[0], componentP[1] - p[1]];
};
