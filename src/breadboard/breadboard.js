
function Wire(x0, y0, x1, y1, id0, id1)
{
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;

    this.id0 = id0;
    this.id1 = id1;

    var dx = x1 - x0;
    this.dx = dx < 0 ? -1 : (dx > 0 ? 1 : 0);
    var dy = y1 - y0;
    this.dy = dy < 0 ? -1 : (dy > 0 ? 1 : 0);

    this.bit0 = Connection.getDirectionFlag( this.dx,  this.dy);
    this.bit1 = Connection.getDirectionFlag(-this.dx, -this.dy);
}

Wire.prototype.iterate = function iterate(fn)
{
    var x = this.x0;
    var y = this.y0;
    var x1 = this.x1;
    var y1 = this.y1;
    var dx = this.dx;
    var dy = this.dy;
    while (x !== x1 || y !== y1)
    {
        fn(x, y);
        x += dx;
        y += dy;
    }
    fn(x, y);
};

Wire.prototype.toJson = function toJson()
{
    return [this.x0, this.y0, this.x1, this.y1];
};

function Breadboard(stage, top, left, cols, rows, spacing)
{
    this.fgGraphics = new PIXI.Graphics();
    this.bgGraphics = new PIXI.Graphics();
    this.stage = stage;

    this.top = top;
    this.left = left;
    this.cols = cols;
    this.rows = rows;
    this.spacing = spacing;
    this.connections = new Array(cols * rows);
    this.componentsList = [];
    var i;
    for (i = 0; i < this.connections.length; i += 1)
    {
        this.connections[i] = new Connection();
    }
    this.wires = [];
    this.virtualWires = [];
    this.removeWireId = -1;
    this.dirty = false;

    this.state = Breadboard.state.ADD_WIRE;
    this.draggingComponent = null;
    this.draggingGrabPoint = [-1, -1];
    this.shouldToggle = false;
    this.wireStart = [-1, -1];

    this.simulateSteps = 0;

    this.drawGrid();
    this.tray = new Tray(this);
    this.tray.draw();

    this.componentsContainer = new PIXI.Container();

    this.componentsBgGraphics = new PIXI.Graphics();
    this.componentsFgGraphics = new PIXI.Graphics();

    this.componentsContainer.addChild(this.componentsBgGraphics);
    this.componentsContainer.addChild(this.componentsFgGraphics);

    stage.addChild(this.componentsContainer);
    stage.addChild(this.bgGraphics);
    stage.addChild(this.fgGraphics);

    this.disabledMatrix = [1, 0, 0, 0, 0,
                           0, 1, 0, 0, 0,
                           0, 0, 1, 0, 0,
                           0, 0, 0, 1, 0];
    this.enabledMatrix = [0.1, 0, 0, 0, 0,
                          0, 1, 0, 0, 0,
                          0, 0, 0.1, 0, 0,
                          0, 0, 0, 1, 0];

    var buttons = this.buttons = [];
    var that = this;
    function addButton(texture, x, y, state, first)
    {
        var button = PIXI.Sprite.fromImage(texture);
        button.x = x;
        button.y = y;
        button.width = 30;
        button.height = 30;
        button.filters = [new PIXI.filters.ColorMatrixFilter()];
        button.interactive = true;

        function onClick()
        {
            that.disableButtons();
            that.state = state;
            that.enableButton(button);
        }

        button.on("pointerdown", onClick);

        stage.addChild(button);

        buttons.push(button);
        if (first)
        {
            onClick();
        }
        return button;
    }

    this.addWireButton    = addButton("jack-plug.png",   675, 0,  Breadboard.state.ADD_WIRE, true);
    this.removeWireButton = addButton("cancel.png",      675, 40, Breadboard.state.REMOVE_WIRE);
    this.moveButton       = addButton("move.png",        675, 80, Breadboard.state.MOVE);

    this.pulsePath = new PulsePath(0, 50, this.getIndex(0, 0), -1);
}

Breadboard.state = {
    ADD_WIRE: 1,
    PLACING_WIRE: 2,
    REMOVE_WIRE: 3,
    DRAG_COMPONENT: 4,
    MOVE: 5
};

Breadboard.prototype.disableButtons = function disableButtons()
{
    var i;
    var buttons = this.buttons;
    for (i = 0; i < buttons.length; i += 1)
    {
        buttons[i].filters[0].matrix = this.disabledMatrix;
    }
};

Breadboard.prototype.enableButton = function disableButtons(button)
{
    button.filters[0].matrix = this.enabledMatrix;
};


Breadboard.prototype.toJson = function toJson()
{
    var out = {
        cols: this.cols,
        rows: this.rows,
        wires: [],
        componentsList: []
    };
    var i;
    var wires = this.wires;
    var wiresLength = wires.length;
    for (i = 0; i < wiresLength; i += 1)
    {
        out.wires.push(wires[i].toJson());
    }

    var componentsList = this.componentsList;
    for (i = 0; i < componentsList.length; i += 1)
    {
        out.componentsList.push(componentsList[i].toJson());
    }
    return out;
};

Breadboard.createFromJson = function createFromJson(stage, top, left, spacing, json)
{
    var breadboard = new Breadboard(stage, top, left, json.cols, json.rows, spacing);

    var wires = json.wires;
    var wiresLength = wires.length;
    var i;
    for (i = 0; i < wiresLength; i += 1)
    {
        var w = wires[i];
        breadboard.addWire(w[0], w[1], w[2], w[3], false);
    }

    var componentsList = json.componentsList;
    if (!componentsList)
    {
        return breadboard;
    }
    var componentsLength = componentsList.length;
    var i;
    for (i = 0; i < componentsLength; i += 1)
    {
        var componentJson = componentsList[i];
        var component;
        if (componentJson.type === ComponentTypes.SWITCH)
        {
            component = new SwitchComponent(breadboard);
        }
        else if (componentJson.type === ComponentTypes.RELAY)
        {
            component = new RelayComponent(breadboard);
        }
        component.stateFromJson(componentJson);
        component.move(breadboard, componentJson.p);
        breadboard.addComponent(component);
    }
    return breadboard;
};

Breadboard.prototype.drawGrid = function drawGrid()
{
    var gridGraphics = this.gridGraphics = new PIXI.Graphics();

    gridGraphics.lineStyle(1, 0xB0B0B0, 1);

    var x;
    var y;

    var left = this.left;
    var top = this.top;
    var cols = this.cols;
    var rows = this.rows;
    var spacing = this.spacing;

    var right = left + (cols - 1) * spacing;
    var bottom = top + (rows - 1) * spacing;

    for (x = 0; x < cols; x += 1)
    {
        for (y = 0; y < rows; y += 1)
        {
            gridGraphics.moveTo(left + x * spacing, top);
            gridGraphics.lineTo(left + x * spacing, bottom);

            gridGraphics.moveTo(left,  top + y * spacing);
            gridGraphics.lineTo(right, top + y * spacing);
        }
    }

    this.stage.addChild(gridGraphics);
};

Breadboard.prototype.update = function update()
{
    if (this.dirty)
    {
        this.dirtySave = true;
        // TODO draw wires here too
        this.pulsePath.rebuildPaths(this, 0);
        this.pulseReset();
        this.pulsePath.createPulse(1);
    }

    this.pulsePath.updatePulses(this);
    this.updateComponents();
    this.draw();

    if (this.dirty)
    {
        this.dirty = false;
    }
};

Breadboard.prototype.updateComponents = function updateComponents()
{
    var componentsList = this.componentsList;
    var i;
    for (i = 0; i < componentsList.length; i += 1)
    {
        componentsList[i].update(this);
    }
};

Breadboard.prototype.pulseReset = function pulseReset()
{
    var that = this;
    function wireIterate(x, y)
    {
        that.connections[that.getIndex(x, y)].reset();
    }

    var i;
    for (i = 0; i < this.wires.length; i += 1)
    {
        var wire = this.wires[i];
        wire.iterate(wireIterate);
    }

    var componentsList = this.componentsList;
    var i;
    for (i = 0; i < componentsList.length; i += 1)
    {
        var outputs = componentsList[i].getConnections();
        var j;
        for (j = 0; j < outputs.length; j += 1)
        {
            this.connections[outputs[j]].reset();
        }
    }
};

Breadboard.prototype.draw = function draw()
{
    this.componentsFgGraphics.clear();
    this.componentsBgGraphics.clear();
    this.fgGraphics.clear();
    this.bgGraphics.clear();

    this.drawComponents();
    this.drawWires(this.wires);
    this.drawWires(this.virtualWires);
};

Breadboard.prototype.getWireColor = function getWireColor(count)
{
    if (count > 1)
    {
        return 0xFF0000;
    }
    else if (count > 0)
    {
        return 0xFF8888;
    }
    else
    {
        return 0xFFFFFF;
    }
};

Breadboard.prototype.drawComponents = function drawComponents()
{
    var componentsFgGraphics = this.componentsFgGraphics;
    var componentsBgGraphics = this.componentsBgGraphics;
    var componentsList = this.componentsList;
    var i;
    for (i = 0; i < componentsList.length; i += 1)
    {
        componentsList[i].draw(this, componentsBgGraphics, componentsFgGraphics);
    }
};

Breadboard.prototype.drawWires = function drawWires(wires)
{
    var fgGraphics = this.fgGraphics;
    var bgGraphics = this.bgGraphics;

    var i;

    var that = this;
    var connections = this.connections;
    var left = this.left;
    var top = this.top;
    var spacing = this.spacing;
    var circlesDrawn = {};
    bgGraphics.lineStyle(6, 0x000000, 1);
    for (i = 0; i < wires.length; i += 1)
    {
        var wire = wires[i];
        var x0 = wire.x0;
        var y0 = wire.y0;
        var x1 = wire.x1;
        var y1 = wire.y1;
        bgGraphics.lineStyle(6, 0x000000, 1);
        var removing = false;
        wire.iterate(function wireIterate(x, y)
        {
            var id = that.getIndex(x, y);
            if (id == that.removeWireId)
            {
                removing = true;
            }
            var connection = connections[id];
            if (circlesDrawn[id] || !connection.hasDot())
            {
                return;
            }
            circlesDrawn[id] = true;
            bgGraphics.drawCircle(left + x * spacing, top + y * spacing, 2);
        });

        if (removing)
        {
            bgGraphics.lineStyle(6, 0x888888, 1);
        }

        bgGraphics.moveTo(left + x0 * spacing, top + y0 * spacing);
        bgGraphics.lineTo(left + x1 * spacing, top + y1 * spacing);
        // TODO only update bgGraphics when a wire/component is added
    }

    var circlesDrawn = {};
    for (i = 0; i < wires.length; i += 1)
    {
        var wire = wires[i];
        var start = [wire.x0, wire.y0];
        var connection = connections[wire.id0];
        if (!connection)
        {
            continue;
        }
        var value = connection.getValue();
        wire.iterate(function wireIterateCurrent(x, y)
        {
            var id = that.getIndex(x, y);
            var connection = connections[id];
            var connectionValue = connection.getValue();
            if (circlesDrawn[id] || connection.hasDot())
            {
                circlesDrawn[id] = true;
                fgGraphics.lineStyle(6, that.getWireColor(connectionValue), 1);
                fgGraphics.drawCircle(left + x * spacing, top + y * spacing, 1);
            }
            if (value !== connectionValue)
            {
                fgGraphics.lineStyle(3, that.getWireColor(value), 1);
                value = connectionValue;
                fgGraphics.moveTo(left + start[0] * spacing, top + start[1] * spacing);
                fgGraphics.lineTo(left + x * spacing, top + y * spacing);
                start[0] = x;
                start[1] = y;
            }
        });

        if (start[0] !== wire.x1 || start[1] !== wire.y1)
        {
            fgGraphics.lineStyle(3, that.getWireColor(value), 1);
            fgGraphics.moveTo(left + start[0] * spacing, top + start[1] * spacing);
            fgGraphics.lineTo(left + wire.x1 * spacing, top + wire.y1 * spacing);
        }
    }
};

Breadboard.prototype.getIndex = function getIndex(x, y)
{
    return x + y * this.cols;
};

Breadboard.prototype.getPositionFromIndex = function getPositionFromIndex(index)
{
    var y = Math.floor(index / this.cols);
    var x = index - (y * this.cols);
    return [x, y];
};

Breadboard.prototype.getPosition = function getPosition(p)
{
    var x = Math.round((p[0] - this.left) / this.spacing);
    var y = Math.round((p[1] - this.top) / this.spacing);
    return [x, y];
};

Breadboard.prototype.getLayerPosition = function getLayerPosition(p)
{
    var x = p[0] * this.spacing + this.left;
    var y = p[1] * this.spacing + this.top;
    return [x, y];
};

Breadboard.prototype.removeWire = function removeWire(wire)
{
    this.dirty = true;

    var index = this.wires.indexOf(wire);
    this.wires.splice(index, 1);

    var connections = this.connections;

    var dx = wire.dx;
    var dy = wire.dy;
    var bit0 = wire.bit0;
    var bit1 = wire.bit1;
    var x = wire.x0;
    var y = wire.y0;
    var x1 = wire.x1;
    var y1 = wire.y1;
    var id;
    while (x !== x1 || y !== y1)
    {
        id = this.getIndex(x, y);
        connections[id].removeWire(bit0);
        connections[id].removeWireComponent(wire);
        x += dx;
        y += dy;
        id = this.getIndex(x, y);
        connections[id].removeWire(bit1);
    }
    connections[id].removeWireComponent(wire);
};

Breadboard.prototype.addWire = function addWire(x0, y0, x1, y1, virtual)
{
    if (x0 == x1 && y0 == y1)
    {
        return;
    }

    var id0 = this.getIndex(x0, y0);
    var id1 = this.getIndex(x1, y1);

    newWire = new Wire(x0, y0, x1, y1, id0, id1);
    if (virtual)
    {
        this.virtualWires.push(newWire);
    }
    else
    {
        this.dirty = true;
        this.wires.push(newWire);
        var connections = this.connections;

        var dx = newWire.dx;
        var dy = newWire.dy;
        var bit0 = newWire.bit0;
        var bit1 = newWire.bit1;
        var x = x0;
        var y = y0;
        var id;
        while (x !== x1 || y !== y1)
        {
            id = this.getIndex(x, y);
            connections[id].addWire(bit0);
            connections[id].addWireComponent(newWire);
            x += dx;
            y += dy;
            id = this.getIndex(x, y);
            connections[id].addWire(bit1);
        }
        connections[id].addWireComponent(newWire);
    }
};

Breadboard.prototype.validPosition = function validPosition(p)
{
    return p[0] >= 0 && p[1] >= 0 && p[0] < this.cols && p[1] < this.rows;
};

Breadboard.prototype.wireRemoveUpdate = function wirePlaceUpdate(p, virtual)
{
    p = this.getPosition(p);
    if (!this.validPosition(p))
    {
        this.removeWireId = -1;
        return;
    }
    if (virtual)
    {
        this.removeWireId = this.getIndex(p[0], p[1]);
    }
    else
    {
        var id = this.getIndex(p[0], p[1]);
        var wires = this.connections[id].components.wires;
        while (wires.length)
        {
            this.removeWire(wires[0]);
        }
    }
};

Breadboard.prototype.wirePlaceUpdate = function wirePlaceUpdate(p, virtual)
{
    p = this.getPosition(p);
    if (!this.validPosition(p))
    {
        this.virtualWires = [];
        return;
    }
    if (this.state === Breadboard.state.PLACING_WIRE)
    {
        this.virtualWires = [];
        var wireStart = this.wireStart;
        if (p[0] === wireStart[0] &&
            p[1] === wireStart[1])
        {
            return;
        }

        if (p[0] === wireStart[0] ||
            p[1] === wireStart[1])
        {
            this.addWire(p[0], p[1], wireStart[0], wireStart[1], virtual);
        }
        else
        {
            var x = p[0] - wireStart[0];
            var y = p[1] - wireStart[1];
            if (Math.abs(x) < Math.abs(y))
            {
                y = ((y > 0 && x > 0) || (y < 0 && x < 0)) ? x : -x;
                this.addWire(wireStart[0], wireStart[1], wireStart[0] + x, wireStart[1] + y, virtual);
                this.addWire(wireStart[0] + x, wireStart[1] + y, p[0], p[1], virtual);
            }
            else
            {
                x = ((x > 0 && y > 0) || (x < 0 && y < 0)) ? y : -y;
                this.addWire(wireStart[0], wireStart[1], wireStart[0] + x, wireStart[1] + y, virtual);
                this.addWire(wireStart[0] + x, wireStart[1] + y, p[0], p[1], virtual);
            }
        }
    }
};

Breadboard.prototype.getConnectionValue = function getConnectionValue(id)
{
    if (id < 0 || id > this.connections.length)
    {
        return false;
    }
    return this.connections[id].getValue();
};

Breadboard.prototype.getComponent = function getComponent(p)
{
    if (!this.validPosition(p))
    {
        return true;
    }
    var id = this.getIndex(p[0], p[1]);
    return this.connections[id].components.component;
};

Breadboard.prototype.onComponentMouseDown = function onComponentMouseDown(component, button, e)
{
    if (button === 1)
    {
        return;
    }

    this.shouldToggle = true;
    if (this.state !== Breadboard.state.MOVE && !this.tray.isFromTray(component))
    {
        return;
    }
    var event = e.data.originalEvent;
    p = [event.layerX, event.layerY];
    p = this.getPosition(p);

    this.state = Breadboard.state.DRAG_COMPONENT;
    this.disableButtons();
    this.enableButton(this.moveButton);
    if (this.tray.isFromTray(component))
    {
        component = component.clone(this);
    }
    this.draggingComponent = component;
    this.draggingGrabPoint = p;
};


Breadboard.prototype.onComponentMouseUp = function onComponentMouseUp(component, button, e)
{
    if (button === 1)
    {
        this.state = Breadboard.state.MOVE;
        this.disableButtons();
        this.enableButton(this.moveButton);

        var event = e.data.originalEvent;
        p = [event.layerX, event.layerY];
        this.rotateComponent(component);
        return;
    }

    if (this.shouldToggle)
    {
        component.toggle();
        this.dirtySave = true;
    }
    if (this.state !== Breadboard.state.DRAG_COMPONENT || !this.draggingComponent)
    {
        var event = e.data.originalEvent;
        this.mouseup([event.layerX, event.layerY]);
        return;
    }

    this.draggingComponent = null;
};

Breadboard.prototype.dragComponent = function dragComponent(p)
{
    p = this.getPosition(p);
    if (!this.validPosition(p))
    {
        this.shouldToggle = false;
        this.removeComponent(this.draggingGrabPoint);
    }

    if (p[0] !== this.draggingGrabPoint[0] ||
        p[1] !== this.draggingGrabPoint[1])
    {
        this.shouldToggle = false;
        this.removeComponent(this.draggingGrabPoint);
        if (this.draggingComponent.isValidPosition(this, p, this.draggingComponent.rotation))
        {
            this.draggingGrabPoint = p;
            this.draggingComponent.move(this, p);
            this.addComponent(this.draggingComponent);
        }
    }
};

Breadboard.prototype.rotateComponent = function rotateComponent(component)
{
    var valid = component.isValidPosition(this, component.p, Rotate90(component.rotation));
    if (component !== this.draggingComponent && !valid)
    {
        return;
    }

    this.removeComponent(component.p);
    component.rotate(this);
    if (valid)
    {
        this.addComponent(component);
        this.dirty = true;
    }
};

Breadboard.prototype.addComponent = function addComponent(component)
{
    this.componentsList.push(component);
    var outputs = component.getConnections();
    var i;
    for (i = 0; i < outputs.length; i += 1)
    {
        this.connections[outputs[i]].components.component = component;
    }
    this.dirty = true;
};

Breadboard.prototype.removeComponent = function removeComponent(p)
{
    if (!this.validPosition(p))
    {
        return;
    }

    var id0 = this.getIndex(p[0], p[1]);
    var component = this.connections[id0].components.component;
    if (!component)
    {
        return;
    }

    var i;
    for (i = 0; i < this.componentsList.length; i += 1)
    {
        if (this.componentsList[i] === component)
        {
            this.componentsList.splice(i, 1);
            break;
        }
    }
    var outputs = component.getConnections();
    for (i = 0; i < outputs.length; i += 1)
    {
        this.connections[outputs[i]].components.component = null;
    }
    this.dirty = true;
};

Breadboard.prototype.mousedown = function mousedown(p, button)
{
    if (button === 1)
    {
        return;
    }

    p = this.getPosition(p);
    if (this.state !== Breadboard.state.ADD_WIRE)
    {
        return;
    }

    if (this.validPosition(p))
    {
        this.state = Breadboard.state.PLACING_WIRE;
        this.wireStart = p;
    }
};

Breadboard.prototype.mouseup = function mouseup(p, button)
{
    if (button === 1)
    {
        return;
    }
    if (this.state === Breadboard.state.PLACING_WIRE)
    {
        this.wirePlaceUpdate(p, false);
        this.state = Breadboard.state.ADD_WIRE;
    }
    else if (this.state === Breadboard.state.REMOVE_WIRE)
    {
        this.wireRemoveUpdate(p, false);
    }
    else if (this.state === Breadboard.state.DRAG_COMPONENT)
    {
        this.draggingComponent = null;
        this.state = Breadboard.state.MOVE;
    }
};

Breadboard.prototype.mousemove = function mousemove(p)
{
    if (this.state === Breadboard.state.PLACING_WIRE)
    {
        this.wirePlaceUpdate(p, true);
    }
    else if (this.state === Breadboard.state.REMOVE_WIRE)
    {
        this.wireRemoveUpdate(p, true);
    }
    else if (this.state === Breadboard.state.DRAG_COMPONENT)
    {
        this.dragComponent(p);
    }
};
