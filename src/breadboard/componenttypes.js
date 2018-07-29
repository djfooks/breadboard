
var ComponentTypes = {
    SWITCH: 1,
    RELAY: 2,
    DIODE: 3,
    BATTERY: 4,
    DEBUGGER: 5,
    BUS_INPUT: 6,
    BUS_OUTPUT: 7,
    LATCH: 8,
    WIRE: 9,
    BUS: 10,
};

var Component = {};

Component.border = 0.4;
Component.selectionBorder = 0.55;
Component.borderLineWidth = 0.05;

Component.removeHitbox = function removeHitbox(breadboard, component)
{
    breadboard.gameStage.removeHitbox(component.hitbox);
    component.hitbox.clearCallbacks();
};

Component.updateHitbox = function updateHitbox(component, p0, p1)
{
    var hitbox = component.hitbox;

    var border = Component.border;
    var min = [Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1])];
    var max = [Math.max(p0[0], p1[0]), Math.max(p0[1], p1[1])];
    hitbox.minX = min[0] - border;
    hitbox.minY = min[1] - border;
    hitbox.maxX = max[0] + border;
    hitbox.maxY = max[1] + border;
};

Component.drawContainerPath = function containerPath(ctx, bgColor, p0, p1, border)
{
    var min = [Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1])];
    var max = [Math.max(p0[0], p1[0]), Math.max(p0[1], p1[1])];
    var x0 = min[0] - border;
    var y0 = min[1] - border;
    var x1 = max[0] + border;
    var y1 = max[1] + border;

    ctx.beginPath();
    ctx.lineWidth = Component.borderLineWidth;
    ctx.strokeStyle = bgColor;
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y1);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1, y0);
    ctx.lineTo(x0, y0);
};

Component.containerPath = function containerPath(ctx, bgColor, p0, p1)
{
    this.drawContainerPath(ctx, bgColor, p0, p1, Component.border);
};

Component.connectionFgRadius = 0.25;
Component.connectionBgRadius = 0.30;

Component.drawFgNode = function drawFgNode(ctx, fgColor, value0, p)
{
    var color = fgColor || Wire.getColor(value0);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p[0], p[1], Component.connectionFgRadius, 0, Math.PI * 2);
    ctx.fill();
};

Component.addComponentFunctions = function addComponentFunctions(componentType)
{
    componentType.prototype.drawSelection = function drawSelection(ctx, color)
    {
        Component.drawContainerPath(ctx, color, this.p0, this.p1, Component.selectionBorder);
        ctx.stroke();
    };
    componentType.prototype.getPosition = function getPosition()
    {
        return [this.p0[0], this.p0[1]];
    };
    componentType.prototype.isWire = function isWire() { return false; };
    componentType.prototype.stateFromJson = function stateFromJson(json) {};
    componentType.prototype.reset = function reset() {};
    componentType.prototype.update = function update() {};
    componentType.prototype.toggle = function toggle() {};
    componentType.prototype.isConnected = function isConnected(id0, id1) { return false; };
    componentType.prototype.getBusPosition = function getBusPosition() { return null; };
    componentType.prototype.addGeometry = function addGeometry(nodes, connections) {};
    componentType.prototype.prepareGeometry = function prepareGeometry(componentRenderer) {};
    componentType.prototype.render = function render(renderer) {};
};
