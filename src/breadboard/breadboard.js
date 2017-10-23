
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

Wire.getColor = function getColor(count)
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

function DrawOptions(breadboard)
{
    if (breadboard)
    {
        this.getConnectionValue = breadboard.getConnectionValue.bind(breadboard);
    }
    else
    {
        this.getConnectionValue = function getConnectionValueFn() { return 0; };
    }
};

function Breadboard(stage, top, left, cols, rows)
{
    this.stage = stage;

    this.debugDrawList = [];

    this.stage.onMouseDown = this.onMouseDown.bind(this);
    this.stage.onMouseUp = this.onMouseUp.bind(this);
    this.stage.onMouseMove = this.onMouseMove.bind(this, false);
    this.stage.onWheel = this.onWheel.bind(this);
    this.stage.onKeyDown = this.onKeyDown.bind(this);

    this.onKeyDownFn = null;

    this.gameStage = new GameStage(1, 1, 601, 601);
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

    this.clear();

    this.drawHitboxes = false;

    var buttons = this.buttons = [];
    var that = this;
    this.imagesRequested = 0;
    function addButton(texture, x, y, state, subState, first)
    {
        var button = new Button(x, y, 30, 30);
        function onClick()
        {
            that.disableButtons();
            that.state = state;
            that.subState = subState;
            that.enableButton(button);
        }
        button.hitbox.onMouseUp = onClick;
        button.texture = texture + ".png";
        button.enabled = false;

        stage.addButton(button);

        buttons.push(button);
        if (first)
        {
            onClick();
        }
        return button;
    }

    this.addBlackWireButton = addButton("jack-plug-black",   655, 10,  Breadboard.state.ADD_WIRE, 0, true);
    this.addBlueWireButton  = addButton("jack-plug-blue",    655, 50,  Breadboard.state.ADD_WIRE, 1);
    this.removeWireButton   = addButton("cancel",            655, 90,  Breadboard.state.REMOVE_WIRE);
    this.moveButton         = addButton("move",              655, 130, Breadboard.state.MOVE);

    this.tray = new Tray(this);
    this.tray.gameStage.onMouseDown = this.onMouseDown.bind(this);
    this.tray.gameStage.onMouseUp = this.onMouseUp.bind(this);
    this.tray.gameStage.onMouseMove = this.onMouseMove.bind(this, false);
    this.stage.addHitbox(this.tray.gameStage.gameStageHitbox);
}

Breadboard.prototype.postLoad = function postLoad()
{
    var i;
    var buttons = this.buttons;
    for (i = 0; i < buttons.length; i += 1)
    {
        var button = buttons[i];
        button.texture = TextureManager.get(button.texture);
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
    this.batteries = [];
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

    this.connectionIdPulseMap = {};
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
    ctx.lineWidth = 2;
    for (i = 0; i < buttons.length; i += 1)
    {
        var button = buttons[i];
        var hitbox = button.hitbox;
        ctx.strokeStyle = button.enabled ? "#FF0000" : "#000000";
        ctx.beginPath();
        ctx.moveTo(hitbox.minX, hitbox.minY);
        ctx.lineTo(hitbox.minX, hitbox.maxY);
        ctx.lineTo(hitbox.maxX, hitbox.maxY);
        ctx.lineTo(hitbox.maxX, hitbox.minY);
        ctx.lineTo(hitbox.minX, hitbox.minY);
        ctx.stroke();
        ctx.drawImage(button.texture, hitbox.minX, hitbox.minY, hitbox.getWidth(), hitbox.getHeight());
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

Breadboard.createFromJson = function createFromJson(stage, top, left, json)
{
    var breadboard = new Breadboard(stage, top, left, 50, 50);

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
        else if (componentJson.type === ComponentTypes.BATTERY)
        {
            component = new BatteryComponent(breadboard);
            breadboard.batteries.push(component);
        }
        else if (componentJson.type === ComponentTypes.DIODE)
        {
            component = new DiodeComponent(breadboard);
        }
        else if (componentJson.type === ComponentTypes.DEBUGGER)
        {
            component = new DebuggerComponent(breadboard);
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

    var cols = this.cols;
    var rows = this.rows;

    var right = cols - 1;
    var bottom = rows - 1;

    ctx.beginPath();
    ctx.strokeStyle = "#B0B0B0";
    ctx.lineWidth = 0.05;
    for (x = 0; x < cols; x += 1)
    {
        for (y = 0; y < rows; y += 1)
        {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, bottom);

            ctx.moveTo(0, y);
            ctx.lineTo(right, y);
        }
    }

    ctx.stroke();
};

Breadboard.prototype.iterateBatteryPulsePaths = function iterateBatteryPulsePaths(fn)
{
    var i;
    for (i = 0; i < this.batteries.length; i += 1)
    {
        fn(this.batteries[i].pulsePaths[0]);
    }
};

Breadboard.prototype.update = function update()
{
    var that = this;
    if (this.dirty)
    {
        this.dirtySave = true;

        this.connectionIdPulseMap = {};

        var componentsList = this.componentsList;
        var i;
        for (i = 0; i < componentsList.length; i += 1)
        {
            componentsList[i].pulsePaths = [];
        }
        for (i = 0; i < this.batteries.length; i += 1)
        {
            this.batteries[i].createPulsePath();
        }

        this.iterateBatteryPulsePaths(function (pulsePath) { pulsePath.rebuildPaths(that); });
        this.iterateBatteryPulsePaths(function (pulsePath) { pulsePath.recursiveBuildWireIds(that); });

        this.pulseReset();
        this.iterateBatteryPulsePaths(function (pulsePath) { pulsePath.createPulse(1); });
    }

    this.gameStage.update();
    this.iterateBatteryPulsePaths(function (pulsePath) { pulsePath.updatePulses(that); });
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
        var outputs = componentsList[i].getConnections(this);
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
    this.gameStage.drawBorder(ctx);

    this.tray.draw(ctx);
    this.drawButtons();

    var gs = this.gameStage;
    ctx.save();
    ctx.beginPath();
    ctx.rect(gs.minX, gs.minY, gs.maxX - gs.minY, gs.maxY - gs.minY);
    ctx.clip();

    gs.transformContext(ctx);

    this.drawGrid();
    this.drawComponents();
    this.drawWires(this.wires);
    this.drawWires(this.virtualWires);

    if (this.drawHitboxes)
    {
        this.gameStage.drawHitboxes(ctx);
    }

    ctx.restore();

    if (this.drawHitboxes)
    {
        ctx.save();
        this.tray.gameStage.transformContext(ctx);
        this.tray.gameStage.drawHitboxes(ctx);
        ctx.restore();
    }
    else
    {
        this.drawDraggedComponents();
    }

    var i;
    for (i = 0; i < this.debugDrawList.length; i += 1)
    {
        this.debugDrawList[i](ctx);
    }
};

Breadboard.prototype.drawComponents = function drawComponents()
{
    var ctx = this.stage.ctx;
    var componentsList = this.componentsList;
    var drawOptions = new DrawOptions(this);
    var i;
    for (i = 0; i < componentsList.length; i += 1)
    {
        componentsList[i].draw(drawOptions, ctx, null, "#000000", null, this.gameStage);
    }
};

Breadboard.prototype.drawDraggedComponents = function drawDraggedComponents()
{
    var ctx = this.stage.ctx;
    var gameStage = this.draggingFromTray ? this.tray.gameStage : this.gameStage;
    if (this.state === Breadboard.state.DRAG_COMPONENT)
    {
        ctx.save();
        gameStage.transformContext(ctx);
        var drawOptions = new DrawOptions(null);
        var p = [this.draggingPoint[0] + this.draggingComponentGrabPoint[0],
                 this.draggingPoint[1] + this.draggingComponentGrabPoint[1]];

        var q = this.getPosition(p);
        var valid = (this.mouseOverGameStage &&
                     this.validPosition(q) &&
                     this.draggingComponent.isValidPosition(this, q, this.draggingComponent.rotation));
        var component = this.draggingComponent;
        if (valid)
        {
            component.draw(drawOptions, ctx, null, "#AAAAAA", null, gameStage);
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
        component.draw(drawOptions, ctx, p, color, "#FFFFFF", gameStage);
        ctx.restore();
    }
};

Breadboard.prototype.drawWires = function drawWires(wires)
{
    var ctx = this.stage.ctx;

    var i;

    var that = this;
    var connections = this.connections;
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
            ctx.arc(x, y, 0.2, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.strokeStyle = "#000000";
        if (removing)
        {
            ctx.strokeStyle = "#888888";
        }

        ctx.beginPath();
        ctx.lineWidth = 0.2;
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
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
                ctx.fillStyle = Wire.getColor(connectionValue);
                ctx.beginPath();
                ctx.arc(x, y, 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
            if (value !== connectionValue)
            {
                ctx.strokeStyle = Wire.getColor(value);
                ctx.lineWidth = 0.1;
                value = connectionValue;
                ctx.beginPath();
                ctx.moveTo(start[0], start[1]);
                ctx.lineTo(x, y);
                ctx.stroke();
                start[0] = x;
                start[1] = y;
            }
        });

        if (start[0] !== wire.x1 || start[1] !== wire.y1)
        {
            ctx.strokeStyle = Wire.getColor(value);
            ctx.lineWidth = 0.1;
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.lineTo(wire.x1, wire.y1);
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
    var x = Math.round(p[0]);
    var y = Math.round(p[1]);
    return [x, y];
};

Breadboard.prototype.getLayerPosition = function getLayerPosition(p)
{
    var x = p[0] * this.gameStage.spacing + this.left;
    var y = p[1] * this.gameStage.spacing + this.top;
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
        this.onMouseDown(q, button);
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
        this.onMouseDown(q, button);
        return;
    }
    var p = this.getPosition(q);

    this.state = Breadboard.state.DRAG_COMPONENT;
    this.draggingStartPoint = q;
    this.draggingFromTray = fromTray;

    var gameStage = this.gameStage;
    if (fromTray)
    {
        component = component.clone(this);
        this.tray.gameStage.addHitbox(component.hitbox);
        gameStage = this.tray.gameStage;
    }
    this.draggingComponent = component;
    this.draggingComponentGrabPoint = Component.getGrabPoint(component, gameStage.toView(q));
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
        if (this.state === Breadboard.state.DRAG_COMPONENT)
        {
            this.rotateComponent(this.draggingComponent);
        }
        return;
    }

    var q;
    if (this.shouldSwitch)
    {
        q = this.getPosition(this.gameStage.toView(p));
        var component = this.getComponent(q);
        if (component)
        {
            component.toggle(this, q);
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
        var draggingComponent = this.draggingComponent;
        var valid = (this.mouseOverGameStage &&
                     this.validPosition(draggingComponent.p) &&
                     draggingComponent.isValidPosition(this, draggingComponent.p, draggingComponent.rotation));
        if (valid)
        {
            this.addComponent(draggingComponent);
        }
        else
        {
            Component.remove(this, draggingComponent);
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
    var gameStage = this.draggingFromTray ? this.tray.gameStage : this.gameStage;
    this.draggingPoint = gameStage.toView(p);
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

            this.tray.gameStage.removeHitbox(this.draggingComponent.hitbox);
            gameStage = this.gameStage;
            gameStage.addHitbox(this.draggingComponent.hitbox);
        }
        var grabPoint = gameStage.toView(p);
        grabPoint = [grabPoint[0] + this.draggingComponentGrabPoint[0],
                     grabPoint[1] + this.draggingComponentGrabPoint[1]];
        grabPoint = this.getPosition(grabPoint);

        this.draggingComponent.move(this, grabPoint, this.draggingComponent.rotation);
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
    var outputs = component.getConnections(this);
    var i;
    for (i = 0; i < outputs.length; i += 1)
    {
        this.connections[outputs[i]].components.component = component;
    }
    this.dirty = true;

    if (component.type === ComponentTypes.BATTERY)
    {
        this.batteries.push(component);
    }
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
    var removeObjectFromList = function removeObjectFromList(list, obj)
    {
        var i;
        for (i = 0; i < list.length; i += 1)
        {
            if (list[i] === obj)
            {
                list.splice(i, 1);
                return true;
            }
        }
        return false;
    };
    if (!removeObjectFromList(this.componentsList, component))
    {
        return false;
    }

    if (component.type === ComponentTypes.BATTERY)
    {
        removeObjectFromList(this.batteries, component);
    }

    var outputs = component.getConnections(this);
    for (i = 0; i < outputs.length; i += 1)
    {
        this.connections[outputs[i]].components.component = null;
    }
    this.dirty = true;
    return true;
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

    if (this.state === Breadboard.state.DRAG_COMPONENT)
    {
        this._onComponentMouseUp(p, button);
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

Breadboard.prototype.onWheel = function onWheel(deltaY)
{
    this.gameStage.zoomDelta(-deltaY);
};

Breadboard.prototype.onKeyDown = function onKeyDown(key, keyCode)
{
    if (this.onKeyDownFn)
    {
        this.onKeyDownFn(this, key, keyCode);
    }
};

Breadboard.prototype.registerKeyDown = function registerKeyDown(fn)
{
    this.onKeyDownFn = fn;
};

Breadboard.prototype.unregisterKeyDown = function unregisterKeyDown(fn)
{
    this.onKeyDownFn = null;
};
