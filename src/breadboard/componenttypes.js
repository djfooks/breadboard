
var ComponentTypes = {
    SWITCH: 1,
    RELAY: 2,
    DIODE: 3,
};

var Component = {};

Component.border = 0.38;

Component.addHitbox = function addHitbox(breadboard, component)
{
    var hitbox = component.hitbox = new Hitbox(0, 0, 0, 0);

    hitbox.onMouseDown = breadboard.onComponentMouseDown.bind(breadboard, component);
    hitbox.onMouseUp = breadboard.onComponentMouseUp.bind(breadboard, component);
};

Component.remove = function remove(breadboard, component)
{
    breadboard.stage.removeHitbox(component.hitbox);
    breadboard.gameStage.removeHitbox(component.hitbox);
    component.hitbox.onMouseDown = null;
    component.hitbox.onMouseUp = null;
    component.hitbox = null;
};

Component.updateHitbox = function updateHitbox(breadboard, component, p, size)
{
    var hitbox = component.hitbox;

    var left = breadboard.left;
    var top = breadboard.top;
    var spacing = breadboard.spacing;
    var border = spacing * Component.border;

    var rotationMatrix = RotationMatrix[component.rotation];
    var screenP0 = [left + component.p[0] * spacing, top + component.p[1] * spacing];
    var screenP1   = AddTransformedVector(screenP0, rotationMatrix, [size[0] * spacing, size[1] * spacing]);

    var screenMin = [Math.min(screenP0[0], screenP1[0]), Math.min(screenP0[1], screenP1[1])];
    var screenMax = [Math.max(screenP0[0], screenP1[0]), Math.max(screenP0[1], screenP1[1])];

    hitbox.minX = screenMin[0] - border;
    hitbox.minY = screenMin[1] - border;
    hitbox.maxX = screenMax[0] + border;
    hitbox.maxY = screenMax[1] + border;
};

Component.drawContainer = function drawContainer(drawOptions, ctx, bgColor, screenP0, screenP1)
{
    var border = Math.floor(drawOptions.spacing * Component.border);
    var screenMin = [Math.min(screenP0[0], screenP1[0]), Math.min(screenP0[1], screenP1[1])];
    var screenMax = [Math.max(screenP0[0], screenP1[0]), Math.max(screenP0[1], screenP1[1])];
    var x0 = screenMin[0] - border;
    var y0 = screenMin[1] - border;
    var x1 = screenMax[0] + border;
    var y1 = screenMax[1] + border;

    ctx.beginPath();
    ctx.lineWidth = 2 * drawOptions.zoom;
    ctx.strokeStyle = bgColor;
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y1);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1, y0);
    ctx.lineTo(x0, y0);
    ctx.stroke();
};

Component.drawFgNode = function drawFgNode(drawOptions, ctx, fgColor, value0, p)
{
    var color = fgColor || drawOptions.getWireColor(value0);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p[0], p[1], 6 * drawOptions.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

Component.getGrabPoint = function getGrabPoint(breadboard, component, p)
{
    var top = breadboard.top;
    var left = breadboard.left;
    var spacing = breadboard.spacing;

    var componentP = [left + component.p[0] * spacing, top + component.p[1] * spacing];
    return [componentP[0] - p[0], componentP[1] - p[1]];
};
