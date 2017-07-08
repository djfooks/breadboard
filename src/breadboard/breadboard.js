
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
    this.stage = stage;

    this.stage.onMouseDown = this.onMouseDown.bind(this);
    this.stage.onMouseUp = this.onMouseUp.bind(this);
    this.stage.onMouseMove = this.onMouseMove.bind(this, false);

    this.gameStage = new GameStage(0, 0, cols * spacing, rows * spacing);
    this.stage.addHitbox(this.gameStage.gameStageHitbox);

    this.gameStage.onMouseDown = this.onMouseDown.bind(this);
    this.gameStage.onMouseUp = this.onMouseUp.bind(this);
    this.gameStage.onMouseMove = this.onMouseMove.bind(this, true);
    this.mouseOverGameStage = false;

    this.isScrolling = false;
    this.scrollGrab = [0, 0];
    this.scrollGrabView = [0, 0];

    this.top = top;
    this.left = left;
    this.cols = cols;
    this.rows = rows;
    this.spacing = spacing;

    this.clear();

    this.tray = new Tray(this);

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
    this.imagesRequested = 0;
    function addButton(texture, x, y, state, first)
    {
        var button = new Button(x, y, 30, 30);
        function onClick()
        {
            that.disableButtons();
            that.state = state;
            that.enableButton(button);
        }
        button.hitbox.onMouseUp = onClick;
        button.disabledTexture = texture + ".png";
        button.enabledTexture = texture + "-enabled.png";
        button.enabled = false;

        stage.addButton(button);

        buttons.push(button);
        if (first)
        {
            onClick();
        }
        return button;
    }

    this.addWireButton    = addButton("jack-plug",   655, 0,  Breadboard.state.ADD_WIRE, true);
    this.removeWireButton = addButton("cancel",      655, 40, Breadboard.state.REMOVE_WIRE);
    this.moveButton       = addButton("move",        655, 80, Breadboard.state.MOVE);
}

Breadboard.prototype.postLoad = function postLoad()
{
    var i;
    var buttons = this.buttons;
    for (i = 0; i < buttons.length; i += 1)
    {
        var button = buttons[i];
        button.enabledTexture = TextureManager.get(button.enabledTexture);
        button.disabledTexture = TextureManager.get(button.disabledTexture);
    }
}

Breadboard.prototype.clear = function clearFn()
{
    this.connections = new Array(this.cols * this.rows);
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

    this.shouldSwitch = false;
    this.state = Breadboard.state.ADD_WIRE;
    this.draggingStartPoint = [-1, -1];
    this.draggingPoint = [0, 0];
    this.draggingComponent = null;
    this.draggingComponentGrabPoint = [0, 0];
    this.draggingFromTray = false;
    this.wireStart = [-1, -1];

    this.simulateSteps = 0;

    this.pulsePath = new PulsePath(0, 50, this.getIndex(0, 0), -1);
};

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
        buttons[i].enabled = false;
    }
};

Breadboard.prototype.enableButton = function disableButtons(button)
{
    button.enabled = true;
};

Breadboard.prototype.drawButtons = function drawButtons()
{
    var ctx = this.stage.ctx;
    var i;
    var buttons = this.buttons;
    for (i = 0; i < buttons.length; i += 1)
    {
        var button = buttons[i];
        var texture = button.enabled ? button.enabledTexture : button.disabledTexture;
        var hitbox = button.hitbox;
        ctx.drawImage(texture, hitbox.minX, hitbox.minY, hitbox.getWidth(), hitbox.getHeight());
    }
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
        else if (componentJson.type === ComponentTypes.DIODE)
        {
            component = new DiodeComponent(breadboard);
        }
        breadboard.gameStage.addHitbox(component.hitbox);
        component.stateFromJson(componentJson);
        component.move(breadboard, componentJson.p, componentJson.rotation | 0);
        breadboard.addComponent(component);
    }
    return breadboard;
};

Breadboard.prototype.drawGrid = function drawGrid()
{
    var ctx = this.stage.ctx;

    var x;
    var y;

    var left = this.left - this.gameStage.view[0];
    var top = this.top - this.gameStage.view[1];
    var cols = this.cols;
    var rows = this.rows;
    var spacing = this.spacing;

    var right = left + (cols - 1) * spacing;
    var bottom = top + (rows - 1) * spacing;

    ctx.beginPath();
    ctx.strokeStyle = "#B0B0B0";
    ctx.lineWidth = 1;
    for (x = 0; x < cols; x += 1)
    {
        for (y = 0; y < rows; y += 1)
        {
            ctx.moveTo(left + x * spacing, top);
            ctx.lineTo(left + x * spacing, bottom);

            ctx.moveTo(left,  top + y * spacing);
            ctx.lineTo(right, top + y * spacing);
        }
    }

    ctx.stroke();
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
    var canvas = this.stage.canvas;
    var ctx = this.stage.ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.tray.draw(this, ctx);
    this.drawButtons();

    var gs = this.gameStage;
    ctx.save();
    ctx.beginPath();
    ctx.rect(gs.minX, gs.minY, gs.maxX - gs.minY, gs.maxY - gs.minY);
    ctx.clip();

    this.drawGrid();
    this.drawComponents();
    this.drawWires(this.wires);
    this.drawWires(this.virtualWires);

    ctx.restore();

    this.drawDraggedComponents();
};

Breadboard.prototype.getWireColor = function getWireColor(count)
{
    if (count > 1)
    {
        return "#FF0000";
    }
    else if (count > 0)
    {
        return "#FF8888";
    }
    else
    {
        return "#FFFFFF";
    }
};

Breadboard.prototype.drawComponents = function drawComponents()
{
    var ctx = this.stage.ctx;
    var componentsList = this.componentsList;
    var i;
    for (i = 0; i < componentsList.length; i += 1)
    {
        componentsList[i].draw(this, ctx, null, "#000000", null, this.gameStage);
    }
};

Breadboard.prototype.drawDraggedComponents = function drawDraggedComponents()
{
    var ctx = this.stage.ctx;
    var gameStage = this.draggingFromTray ? this.tray.gameStage : this.gameStage;
    if (this.state === Breadboard.state.DRAG_COMPONENT)
    {
        var p = [this.draggingPoint[0] + this.draggingComponentGrabPoint[0],
                 this.draggingPoint[1] + this.draggingComponentGrabPoint[1]];

        var q = this.getPosition(p);
        var valid = (this.mouseOverGameStage &&
                     this.validPosition(q) &&
                     this.draggingComponent.isValidPosition(this, q, this.draggingComponent.rotation));
        var component = this.draggingComponent;
        if (valid)
        {
            component.draw(this, ctx, null, "#AAAAAA", null, gameStage);
        }
        var color;
        if (this.draggingFromTray)
        {
            color = "#000000";
        }
        else if (!valid || !this.mouseOverGameStage)
        {
            color = "#FF0000";
        }
        else
        {
            color = "#000000";
        }
        component.draw(this, ctx, p, color, "#FFFFFF", gameStage);
    }
};

Breadboard.prototype.drawWires = function drawWires(wires)
{
    var ctx = this.stage.ctx;

    var i;

    var that = this;
    var connections = this.connections;
    var left = this.left - this.gameStage.view[0];
    var top = this.top - this.gameStage.view[1];
    var spacing = this.spacing;
    var circlesDrawn = {};

    for (i = 0; i < wires.length; i += 1)
    {
        var wire = wires[i];
        var x0 = wire.x0;
        var y0 = wire.y0;
        var x1 = wire.x1;
        var y1 = wire.y1;

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

            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.arc(left + x * spacing, top + y * spacing, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.strokeStyle = "#000000";
        if (removing)
        {
            ctx.strokeStyle = "#888888";
        }

        ctx.beginPath();
        ctx.lineWidth = 6;
        ctx.moveTo(left + x0 * spacing, top + y0 * spacing);
        ctx.lineTo(left + x1 * spacing, top + y1 * spacing);
        ctx.stroke();
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
                ctx.fillStyle = that.getWireColor(connectionValue);
                ctx.beginPath();
                ctx.arc(left + x * spacing, top + y * spacing, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            if (value !== connectionValue)
            {
                ctx.strokeStyle = that.getWireColor(value);
                ctx.lineWidth = 3;
                value = connectionValue;
                ctx.beginPath();
                ctx.moveTo(left + start[0] * spacing, top + start[1] * spacing);
                ctx.lineTo(left + x * spacing, top + y * spacing);
                ctx.stroke();
                start[0] = x;
                start[1] = y;
            }
        });

        if (start[0] !== wire.x1 || start[1] !== wire.y1)
        {
            ctx.strokeStyle = that.getWireColor(value);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(left + start[0] * spacing, top + start[1] * spacing);
            ctx.lineTo(left + wire.x1 * spacing, top + wire.y1 * spacing);
            ctx.stroke();
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
        this.shouldSwitch = false;

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

Breadboard.prototype.onComponentMouseDown = function onComponentMouseDown(component, q, button)
{
    var fromTray = this.tray.isFromTray(component);
    if (button === 1)
    {
        this.onMouseDown(!fromTray, q, button);
        return;
    }

    if (button === 2)
    {
        this.shouldSwitch = false;
        return;
    }

    this.shouldSwitch = true;

    if (this.state !== Breadboard.state.MOVE && !this.tray.isFromTray(component))
    {
        this.onMouseDown(!fromTray, q, button);
        return;
    }
    p = this.getPosition(q);

    this.state = Breadboard.state.DRAG_COMPONENT;
    this.draggingStartPoint = q;
    this.draggingFromTray = fromTray;
    if (fromTray)
    {
        component = component.clone(this);
        this.stage.addHitbox(component.hitbox);
    }
    this.draggingComponent = component;
    this.draggingComponentGrabPoint = Component.getGrabPoint(this, component, this.gameStage.toView(q));
    this.draggingComponentUpdate(q);
};

Breadboard.prototype._onComponentMouseUp = function _onComponentMouseUp(p, button)
{
    if (button === 1)
    {
        this.onMouseUp(p, button);
        return;
    }
    else if (button === 2)
    {
        var component;
        if (this.state === Breadboard.state.DRAG_COMPONENT)
        {
            component = this.draggingComponent;
        }
        else
        {
            p = this.getPosition(p);
            component = this.getComponent(p);

            this.state = Breadboard.state.MOVE;
            this.disableButtons();
            this.enableButton(this.moveButton);
        }
        if (component)
        {
            this.rotateComponent(component);
        }
        return;
    }

    var q;
    if (this.shouldSwitch)
    {
        q = this.getPosition(p);
        var component = this.getComponent(q);
        if (component)
        {
            component.toggle();
            this.dirtySave = true;
        }
    }

    if (this.state !== Breadboard.state.DRAG_COMPONENT || !this.draggingComponent)
    {
        this.onMouseUp(p, button);
        return;
    }

    if (!this.shouldSwitch)
    {
        var valid = (this.mouseOverGameStage &&
                     this.validPosition(this.draggingComponent.p) &&
                     this.draggingComponent.isValidPosition(this, this.draggingComponent.p, this.draggingComponent.rotation));
        if (valid)
        {
            this.addComponent(this.draggingComponent);
        }
        else
        {
            Component.remove(this, this.draggingComponent);
        }
    }

    this.state = Breadboard.state.MOVE;
    this.disableButtons();
    this.enableButton(this.moveButton);
    this.draggingComponent = null;
};

Breadboard.prototype.onComponentMouseUp = function onComponentMouseUp(component, p, button)
{
    this._onComponentMouseUp(p, button);
};

Breadboard.prototype.draggingComponentUpdate = function draggingComponentUpdate(p)
{
    this.draggingPoint = this.gameStage.toView(p);
    if (this.shouldSwitch)
    {
        if (p[0] != this.draggingStartPoint[0] ||
            p[1] != this.draggingStartPoint[1])
        {
            this.disableButtons();
            this.enableButton(this.moveButton);
            if (!this.draggingFromTray)
            {
                this.removeComponent(this.draggingComponent);
            }
            this.shouldSwitch = false;
        }
    }

    if (!this.shouldSwitch)
    {
        if (this.draggingFromTray && this.mouseOverGameStage)
        {
            this.draggingFromTray = false;
            this.stage.removeHitbox(this.draggingComponent.hitbox);
            this.gameStage.addHitbox(this.draggingComponent.hitbox);
        }
        var grabPoint = [p[0] + this.draggingComponentGrabPoint[0],
                         p[1] + this.draggingComponentGrabPoint[1]];
        grabPoint = this.gameStage.toView(grabPoint);
        p = this.getPosition(grabPoint);

        this.draggingComponent.move(this, p, this.draggingComponent.rotation);
    }
};

Breadboard.prototype.rotateComponent = function rotateComponent(component)
{
    var newRotation = Rotate90(component.rotation);
    var valid = component.isValidPosition(this, component.p, newRotation);
    if (this.state !== Breadboard.state.DRAG_COMPONENT && !valid)
    {
        return;
    }

    this.draggingComponentGrabPoint = [this.draggingComponentGrabPoint[1], -this.draggingComponentGrabPoint[0]];

    this.removeComponent(component);
    component.move(this, component.p, newRotation);
    if (valid && this.state !== Breadboard.state.DRAG_COMPONENT)
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

Breadboard.prototype.getComponent = function getComponent(p)
{
    if (!this.validPosition(p))
    {
        return;
    }

    var id0 = this.getIndex(p[0], p[1]);
    return this.connections[id0].components.component;
};

Breadboard.prototype.removeComponent = function removeComponent(component)
{
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

Breadboard.prototype.onMouseDown = function onMouseDown(p, button)
{
    if (button === 1 && this.mouseOverGameStage)
    {
        this.isScrolling = true;
        this.scrollGrab = p;
        this.scrollGrabView = this.gameStage.view;
        return;
    }

    if (!this.mouseOverGameStage)
    {
        return;
    }

    p = this.gameStage.toView(p);
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

Breadboard.prototype.onMouseUp = function onMouseUp(p, button)
{
    if (button === 1)
    {
        this.isScrolling = false;
        return;
    }

    if (!this.mouseOverGameStage)
    {
        return;
    }

    p = this.gameStage.toView(p);
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
        this._onComponentMouseUp(p, button);
    }
};

Breadboard.prototype.onMouseMove = function onMouseMove(gameSpace, p)
{
    this.mouseOverGameStage = gameSpace;

    if (this.isScrolling)
    {
        var delta = [p[0] - this.scrollGrab[0], p[1] - this.scrollGrab[1]];
        this.gameStage.view = [this.scrollGrabView[0] - delta[0], this.scrollGrabView[1] - delta[1]];
        return;
    }

    if (this.state === Breadboard.state.PLACING_WIRE)
    {
        p = this.gameStage.toView(p);
        this.wirePlaceUpdate(p, true);
    }
    else if (this.state === Breadboard.state.REMOVE_WIRE)
    {
        p = this.gameStage.toView(p);
        this.wireRemoveUpdate(p, true);
    }
    else if (this.state === Breadboard.state.DRAG_COMPONENT)
    {
        this.draggingComponentUpdate(p);
    }
};
