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
    this.stage.onKeyUp = this.onKeyUp.bind(this);

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

    this.debugDrawHitboxes = false;
    this.debugDrawConnections = false;

    var buttons = this.buttons = [];
    var that = this;
    this.imagesRequested = 0;
    function addButton(texture, x, y, state, first, callback)
    {
        var button = new Button(x, y, 30, 30);
        function onClick()
        {
            that.disableButtons();
            that.state = state;
            that.enableButton(button);

            if (callback)
            {
                callback();
            }
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

    this.addWireButton    = addButton("jack-plug",   655, 0,   Breadboard.state.ADD_WIRE, true,
        function () { that.wireType = Breadboard.wireType.WIRE; });

    this.addBusWireButton = addButton("truck",       655, 40,  Breadboard.state.ADD_WIRE, false,
        function () { that.wireType = Breadboard.wireType.BUS; });

    this.addFastWireButton = addButton("truck",       655, 80,  Breadboard.state.ADD_WIRE, false,
        function () { that.wireType = Breadboard.wireType.FAST; });

    this.removeWireButton = addButton("cancel",      655, 120,  Breadboard.state.REMOVE_WIRE);
    this.moveButton       = addButton("move",        655, 160, Breadboard.state.MOVE);

    this.tray = new Tray(this);
    this.tray.gameStage.onMouseDown = this.onMouseDown.bind(this);
    this.tray.gameStage.onMouseUp = this.onMouseUp.bind(this);
    this.tray.gameStage.onMouseMove = this.onMouseMove.bind(this, false);
    this.stage.addHitbox(this.tray.gameStage.gameStageHitbox);

    this.frame = 0;
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
    this._connections = {};
    this.componentsList = [];

    this.gameStage.clearHitboxes();

    this.wires = [];
    this.buses = [];
    this.virtualWires = [];

    this.batteries = [];
    this.removeWireId = -1;
    this.dirty = false;

    this.shouldSwitch = false;
    this.state = Breadboard.state.ADD_WIRE;
    this.wireType = Breadboard.wireType.WIRE;
    this.draggingPoint = [0, 0];
    this.selectedList = [];
    this.draggingFromTray = false;
    this.wireStart = [-1, -1];
    this.selectStart = [-1, -1];
    this.gameSpaceMouse = [-1, -1];

    this.mouseDownComponent = null;
    this.mouseDownP = [-1, -1];

    this.simulateSteps = 0;

    this.connectionIdPulseMap = {};
};

Breadboard.wireType = {
    WIRE: 1,
    BUS: 2,
    FAST: 3,
};

Breadboard.state = {
    ADD_WIRE: 1,
    PLACING_WIRE: 2,
    REMOVE_WIRE: 3,
    DRAG_COMPONENT: 4,
    MOVE: 5,
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
        buses: [],
        componentsList: []
    };
    var i;
    var wires = this.wires;
    var wiresLength = wires.length;
    for (i = 0; i < wiresLength; i += 1)
    {
        out.wires.push(wires[i].toJson());
    }

    var buses = this.buses;
    var busesLength = buses.length;
    for (i = 0; i < busesLength; i += 1)
    {
        out.buses.push(buses[i].toJson());
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
    var breadboard = new Breadboard(stage, top, left, 1001, 1001);

    var i;
    var wires = json.wires;
    var wiresLength = wires.length;
    breadboard.wireType = Breadboard.wireType.WIRE;
    for (i = 0; i < wiresLength; i += 1)
    {
        var w = wires[i];
        breadboard.addWire(w[0], w[1], w[2], w[3], false);
    }

    var wiresFast = json.wiresFast;
    if (wiresFast)
    {
        var wiresFastLength = wiresFast.length;
        breadboard.wireType = Breadboard.wireType.FAST;
        for (i = 0; i < wiresFastLength; i += 1)
        {
            var w = wiresFast[i];
            breadboard.addWire(w[0], w[1], w[2], w[3], false);
        }
    }

    var buses = json.buses;
    if (buses)
    {
        breadboard.wireType = Breadboard.wireType.BUS;
        var busesLength = buses.length;
        for (i = 0; i < busesLength; i += 1)
        {
            var w = buses[i];
            breadboard.addWire(w[0], w[1], w[2], w[3], false);
        }
    }
    breadboard.wireType = Breadboard.wireType.WIRE;

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
        }
        else if (componentJson.type === ComponentTypes.DIODE)
        {
            component = new DiodeComponent(breadboard);
        }
        else if (componentJson.type === ComponentTypes.DEBUGGER)
        {
            component = new DebuggerComponent(breadboard);
        }
        else if (componentJson.type === ComponentTypes.BUS_INPUT)
        {
            component = new BusInputComponent(breadboard);
        }
        else if (componentJson.type === ComponentTypes.BUS_OUTPUT)
        {
            component = new BusOutputComponent(breadboard);
        }
        else if (componentJson.type === ComponentTypes.LATCH)
        {
            component = new LatchComponent(breadboard);
        }
        breadboard.gameStage.addHitbox(component.hitbox);
        component.stateFromJson(componentJson);
        component.move(breadboard, componentJson.p0 || componentJson.p, componentJson.rotation | 0);
        breadboard.addComponent(component);
    }
    return breadboard;
};

Breadboard.prototype.drawGrid = function drawGrid()
{
    var ctx = this.stage.ctx;

    ctx.beginPath();
    ctx.strokeStyle = "#B0B0B0";
    ctx.lineWidth = 0.05;

    var step = 1;
    if (this.gameStage.zoom < 10)
    {
        step = 10;
    }
    if (this.gameStage.zoom < 1)
    {
        step = 100;
        ctx.lineWidth = 0.5;
    }

    var x;
    var y;

    var cols = this.cols;
    var rows = this.rows;

    var right = cols - 1;
    var bottom = rows - 1;

    var min = this.getPosition(this.gameStage.toView([this.gameStage.minX, this.gameStage.minY]));
    var max = this.getPosition(this.gameStage.toView([this.gameStage.maxX, this.gameStage.maxY]));

    min = [Math.floor(Math.max(min[0], 0) / step) * step,
           Math.floor(Math.max(min[1], 0) / step) * step];

    ctx.beginPath();
    ctx.strokeStyle = "#B0B0B0";
    for (x = min[0]; x < Math.min(max[0] + step, cols); x += step)
    {
        for (y = min[1]; y < Math.min(max[1] + step, rows); y += step)
        {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, bottom);

            ctx.moveTo(0, y);
            ctx.lineTo(right, y);
        }
    }

    ctx.stroke();
};

Breadboard.prototype.drawConnections = function drawConnections(ctx)
{
    var id;
    var strId;
    for (strId in this._connections)
    {
        if (!this._connections.hasOwnProperty(strId))
        {
            continue;
        }

        id = strId | 0;

        var y = Math.floor(id / this.cols);
        var x = id - y * this.cols;

        var border = 0.5;
        var x0 = x - border;
        var y0 = y - border;
        var x1 = x + border;
        var y1 = y + border;

        ctx.beginPath();
        ctx.fillStyle = "blue";
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0, y1);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1, y0);
        ctx.lineTo(x0, y0);
        ctx.fill();
    }
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
    this.frame += 1;

    var that = this;
    if (this.dirty)
    {
        this.dirtySave = true;

        this.connectionIdPulseMap = {};

        // TODO reset entire connection map
        this.pulseReset();

        var componentsList = this.componentsList;
        var i;
        for (i = 0; i < componentsList.length; i += 1)
        {
            componentsList[i].pulsePaths = [];
            componentsList[i].reset();
        }
        for (i = 0; i < this.batteries.length; i += 1)
        {
            this.batteries[i].createPulsePath();
        }

        Bus.buildPaths(this);

        this.iterateBatteryPulsePaths(function (pulsePath) { pulsePath.rebuildPaths(that); });
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
        that._connections[that.getIndex(x, y)].reset();
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
            this._connections[outputs[j]].reset();
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

    if (this.debugDrawConnections)
    {
        this.drawConnections(ctx);
    }

    this.drawGrid();
    this.drawComponents();
    this.drawWires(this.wires);
    this.drawBuses(this.buses);
    if (this.wireType != Breadboard.wireType.BUS)
    {
        this.drawWires(this.virtualWires);
    }
    else /*if (this.wireType == Breadboard.wireType.BUS)*/
    {
        this.drawBuses(this.virtualWires);
    }

    this.drawSelection();

    if (this.debugDrawHitboxes)
    {
        this.gameStage.drawHitboxes(ctx);
    }

    ctx.restore();

    if (this.debugDrawHitboxes)
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

Breadboard.prototype.drawSelection = function drawSelection()
{
    if (this.state === Breadboard.state.DRAG_COMPONENT)
    {
        return;
    }
    var ctx = this.stage.ctx;

    var selectedList = this.selectedList;
    for (var i = 0; i < selectedList.length; i += 1)
    {
        var component = selectedList[i].component;
        Component.selectionContainerPath(ctx, "#BDB76B", component.p0, component.p1);
        ctx.stroke();
    }

    if (this.selectStart[0] === -1 && this.selectStart[1] === -1)
    {
        return;
    }

    var x0 = this.selectStart[0];
    var y0 = this.selectStart[1];
    var x1 = this.gameSpaceMouse[0];
    var y1 = this.gameSpaceMouse[1];

    ctx.beginPath();
    ctx.lineWidth = Component.borderLineWidth;
    ctx.setLineDash([0.1, 0.15]);
    ctx.strokeStyle = "#000000";
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y1);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1, y0);
    ctx.lineTo(x0, y0);
    ctx.stroke();

    ctx.setLineDash([]);
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
        var valid = this.mouseOverGameStage &&
                    SelectedObject.areAllValid(this, this.selectedList, this.draggingPoint);
        var selectedList = this.selectedList;
        var i;
        for (i = 0; i < selectedList.length; i += 1)
        {
            var selectedObj = selectedList[i];
            var component = selectedObj.component;

            var p = [this.draggingPoint[0] + selectedObj.grabOffset[0],
                     this.draggingPoint[1] + selectedObj.grabOffset[1]];

            var q = this.getPosition(p);

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
        }
        ctx.restore();
    }
};

Breadboard.prototype.drawWires = function drawWires(wires)
{
    var ctx = this.stage.ctx;

    var i;

    var that = this;
    var connections = this._connections;
    var circles = {};
    var value;

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
            if (!circles[id] && connection && connection.hasDot)
            {
                circles[id] = [x, y];

                ctx.fillStyle = "#000000";
                ctx.beginPath();
                ctx.arc(x, y, 0.2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.strokeStyle = removing ? "#888888" : "#000000";

        ctx.beginPath();
        ctx.lineWidth = 0.2;
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        var start = [wire.x0, wire.y0];
        var connection = connections[wire.id0];

        wire.iterate(function wireIterateCurrent(x, y)
        {
            var id = that.getIndex(x, y);
            var connection = connections[id];
            var connectionValue = 0;
            if (connection)
            {
                connectionValue = connection.getDirectionValue(wire.directionId);
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

    var id;
    for (id in circles)
    {
        if (circles.hasOwnProperty(id))
        {
            id = id | 0;
            var x = circles[id][0];
            var y = circles[id][1];
            var connection = connections[id];
            if (!connection)
            {
                continue;
            }
            value = connection.getValue();

            ctx.fillStyle = Wire.getColor(value);
            ctx.beginPath();
            ctx.arc(x, y, 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

Breadboard.prototype.drawBuses = function drawBuses(buses)
{
    var ctx = this.stage.ctx;

    var i;

    var that = this;
    var connections = this._connections;
    var diamonds = {};
    var value;

    for (i = 0; i < buses.length; i += 1)
    {
        var bus = buses[i];
        var x0 = bus.x0;
        var y0 = bus.y0;
        var x1 = bus.x1;
        var y1 = bus.y1;

        var removing = false;
        bus.iterate(function busIterate(x, y)
        {
            var id = that.getIndex(x, y);
            if (id == that.removeWireId)
            {
                removing = true;
            }
            var connection = connections[id];
            if (!diamonds[id] && connection && connection.hasDot)
            {
                diamonds[id] = [x, y];
            }
        });

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);

        ctx.strokeStyle = removing ? "#888888" : "#000000";
        ctx.lineWidth = 0.3;
        ctx.stroke();

        ctx.strokeStyle = "aqua";
        ctx.lineWidth = 0.15;
        ctx.stroke();

        ctx.strokeStyle = removing ? "#888888" : "#000000";
        ctx.lineWidth = 0.05;
        ctx.stroke();
    }

    ctx.strokeStyle = "black";
    ctx.fillStyle = "teal";
    ctx.lineCap = "square";
    ctx.lineWidth = 0.15;
    var diamondWidth = 0.15;
    var id;
    for (id in diamonds)
    {
        if (diamonds.hasOwnProperty(id))
        {
            id = id | 0;
            var x = diamonds[id][0];
            var y = diamonds[id][1];
            var connection = connections[id];
            if (!connection)
            {
                continue;
            }
            value = connection.getValue();

            ctx.beginPath();
            ctx.moveTo(x + diamondWidth, y);
            ctx.lineTo(x, y + diamondWidth);
            ctx.lineTo(x - diamondWidth, y);
            ctx.lineTo(x, y - diamondWidth);
            ctx.lineTo(x + diamondWidth, y);
            ctx.stroke();
            ctx.fill();
        }
    }
    ctx.lineCap = "butt";
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

Breadboard.prototype.findConnection = function findConnection(id)
{
    var connection = this._connections[id];
    if (connection)
    {
        return connection;
    }
    return null;
};

Breadboard.prototype.getConnection = function getConnection(id)
{
    var connection = this._connections[id];
    if (connection)
    {
        return connection;
    }
    throw new Error("No connection");
};

Breadboard.prototype.emplaceConnection = function emplaceConnection(id)
{
    var connection = this._connections[id];
    if (connection)
    {
        return connection;
    }
    connection = new Connection();
    this._connections[id] = connection;
    return connection;
};

Breadboard.prototype.dirtyConnection = function dirtyConnection(id, connection)
{
    if (connection.empty())
    {
        delete this._connections[id];
    }
};

Breadboard.prototype.removeWire = function removeWire(wire)
{
    this.dirty = true;

    var index = this.buses.indexOf(wire);
    var wireType;
    if (index !== -1)
    {
        wireType = Breadboard.wireType.BUS;
        this.buses.splice(index, 1);
    }
    else
    {
        index = this.wires.indexOf(wire);
        wireType = this.wires[index].type;
        this.wires.splice(index, 1);
    }

    var dx = wire.dx;
    var dy = wire.dy;
    var bit0 = wire.bit0;
    var bit1 = wire.bit1;
    var x = wire.x0;
    var y = wire.y0;
    var x1 = wire.x1;
    var y1 = wire.y1;
    var id;
    var connection;
    while (x !== x1 || y !== y1)
    {
        id = this.getIndex(x, y);
        connection = this.getConnection(id);
        connection.removeWire(id, bit0, wireType);
        connection.removeWireComponent(id, wire);
        this.dirtyConnection(id, connection);
        x += dx;
        y += dy;
        id = this.getIndex(x, y);
        connection = this.getConnection(id);
        connection.removeWire(id, bit1, wireType);
    }
    connection.removeWireComponent(id, wire);
    this.dirtyConnection(id, connection);
};

Breadboard.prototype.addWire = function addWire(x0, y0, x1, y1, virtual)
{
    if (x0 == x1 && y0 == y1)
    {
        return;
    }

    var id0 = this.getIndex(x0, y0);
    var id1 = this.getIndex(x1, y1);

    var type = this.wireType;
    var newWire = new Wire(x0, y0, x1, y1, id0, id1, type);

    if (virtual)
    {
        this.virtualWires.push(newWire);
    }
    else
    {
        this.dirty = true;
        if (type != Breadboard.wireType.BUS)
        {
            this.wires.push(newWire);
        }
        else /*if (type == Breadboard.wireType.BUS)*/
        {
            this.buses.push(newWire);
        }

        var dx = newWire.dx;
        var dy = newWire.dy;
        var bit0 = newWire.bit0;
        var bit1 = newWire.bit1;
        var x = x0;
        var y = y0;
        var id;
        var connection;
        while (x !== x1 || y !== y1)
        {
            id = this.getIndex(x, y);
            connection = this.emplaceConnection(id);
            connection.addWire(id, bit0, type);
            connection.addWireComponent(id, newWire);
            x += dx;
            y += dy;
            id = this.getIndex(x, y);
            connection = this.emplaceConnection(id);
            connection.addWire(id, bit1, type);
        }
        connection.addWireComponent(id, newWire);
    }
};

Breadboard.prototype.validPosition = function validPosition(p)
{
    return p[0] >= 0 && p[1] >= 0 && p[0] < this.cols && p[1] < this.rows;
};

Breadboard.prototype.wireRemoveUpdate = function wireRemoveUpdate(p, virtual)
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
        var connection = this._connections[id];
        if (connection)
        {
            var wires = connection.wires;
            while (wires.length)
            {
                this.removeWire(wires[0]);
            }
            var buses = connection.buses;
            while (buses.length)
            {
                this.removeWire(buses[0]);
            }
            this.dirtyConnection(id, connection);
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
    var connection = this._connections[id];
    if (!connection)
    {
        return false;
    }
    return connection.getValue();
};

Breadboard.prototype.onComponentMouseDown = function onComponentMouseDown(component, p, button)
{
    if (button === 1)
    {
        this.onMouseDown(p, button);
        return;
    }

    if (button === 2)
    {
        this.shouldSwitch = false;
        return;
    }

    if (this.stage.isKeyDown(BaseKeyCodeMap.SHIFT))
    {
        this.shouldSwitch = false;
        var selectedList = this.selectedList;
        for (i = 0; i < selectedList.length; i += 1)
        {
            var selectedObj = selectedList[i];
            if (selectedObj.component === component)
            {
                selectedList.splice(i, 1);
                return;
            }
        }
        selectedList.push(new SelectedObject(component, [0, 0]));
        return;
    }

    this.draggingFromTray = this.tray.isFromTray(component);
    if (this.state !== Breadboard.state.MOVE && !this.draggingFromTray)
    {
        this.onMouseDown(p, button);
        return;
    }

    this.shouldSwitch = true;

    this.mouseDownComponent = component;
    this.mouseDownP = [p[0], p[1]];

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
            this.rotateComponents();
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

    if (this.stage.isKeyDown(BaseKeyCodeMap.SHIFT))
    {
        return;
    }

    this.mouseDownComponent = null;
    this.mouseDownP = [-1, -1];

    if (this.shouldSwitch ||
        this.state !== Breadboard.state.DRAG_COMPONENT ||
        this.selectedList.length === 0)
    {
        this.onMouseUp(p, button);
        return;
    }

    var selectedList = this.selectedList;
    var valid = this.mouseOverGameStage && SelectedObject.areAllValid(this, selectedList);
    var i;
    if (valid)
    {
        for (i = 0; i < selectedList.length; i += 1)
        {
            this.addComponent(selectedList[i].component);
        }
    }
    else
    {
        for (i = 0; i < selectedList.length; i += 1)
        {
            Component.remove(this, selectedList[i].component);
        }
        this.selectedList = [];
    }

    this.state = Breadboard.state.MOVE;
    this.disableButtons();
    this.enableButton(this.moveButton);
};

Breadboard.prototype.onComponentMouseUp = function onComponentMouseUp(component, p, button)
{
    this._onComponentMouseUp(p, button);
};

Breadboard.prototype.mouseDownComponentsUpdate = function mouseDownComponentsUpdate(p)
{
    var i;
    var fromTray = this.draggingFromTray;
    var gameStage = fromTray ? this.tray.gameStage : this.gameStage;
    this.draggingPoint = gameStage.toView(p);
    var selectedList = this.selectedList;
    var mouseDownP = this.mouseDownP;
    var selectedObj;
    var q = gameStage.toView(p);

    if (this.shouldSwitch)
    {
        if (p[0] != mouseDownP[0] ||
            p[1] != mouseDownP[1])
        {
            this.state = Breadboard.state.DRAG_COMPONENT;
            var mouseDownComponent = this.mouseDownComponent;

            if (fromTray)
            {
                this.disableButtons();
                this.enableButton(this.moveButton);
                selectedList = this.selectedList = [new SelectedObject(
                    mouseDownComponent.clone(this), Component.getGrabOffset(mouseDownComponent, q))];
                this.tray.gameStage.addHitbox(selectedList[0].component.hitbox);
            }
            else
            {
                var selected = false;
                for (i = 0; i < selectedList.length; i += 1)
                {
                    selectedObj = selectedList[i];
                    if (selectedObj.component === mouseDownComponent)
                    {
                        selected = true;
                        break;
                    }
                }

                if (selected)
                {
                    for (i = 0; i < selectedList.length; i += 1)
                    {
                        selectedObj = selectedList[i];
                        if (!this.removeComponent(selectedObj.component))
                        {
                            throw new Error("Unable to remove component");
                        }
                        selectedObj.grabOffset = Component.getGrabOffset(selectedObj.component, q);
                    }
                }
                else
                {
                    if (!this.removeComponent(mouseDownComponent))
                    {
                        throw new Error("Unable to remove component");
                    }
                    selectedList.push(new SelectedObject(mouseDownComponent,
                        Component.getGrabOffset(mouseDownComponent, q)));
                }
            }
            this.shouldSwitch = false;
        }
    }

    if (this.shouldSwitch)
    {
        return;
    }

    if (fromTray && this.mouseOverGameStage)
    {
        fromTray = this.draggingFromTray = false;

        this.tray.gameStage.removeHitbox(selectedList[0].component.hitbox);
        gameStage = this.gameStage;
        gameStage.addHitbox(selectedList[0].component.hitbox);
    }
    var grabPoint = gameStage.toView(p);
    for (i = 0; i < selectedList.length; i += 1)
    {
        var selectedObj = selectedList[i];
        componentGrabPoint = [grabPoint[0] + selectedObj.grabOffset[0],
                              grabPoint[1] + selectedObj.grabOffset[1]];
        componentGrabPoint = this.getPosition(componentGrabPoint);

        selectedObj.component.move(this, componentGrabPoint, selectedObj.component.rotation);
    }
};

Breadboard.prototype.rotateComponents = function rotateComponents()
{
    var selectedList = this.selectedList;
    var i;
    for (i = 0; i < selectedList.length; i += 1)
    {
        var selectedObj = selectedList[i];
        var component = selectedObj.component;
        var newRotation = Rotate90(component.rotation);
        var valid;
        if (this.state !== Breadboard.state.DRAG_COMPONENT)
        {
            valid = component.isValid(this, component.p0, newRotation)
            if (!valid)
            {
                return;
            }
        }

        selectedObj.grabOffset = [selectedObj.grabOffset[1], -selectedObj.grabOffset[0]];

        this.removeComponent(component);
        component.move(this, component.p0, newRotation);
        if (this.state !== Breadboard.state.DRAG_COMPONENT && valid)
        {
            this.addComponent(component);
            this.dirty = true;
        }
    }
};

Breadboard.prototype.addComponent = function addComponent(component)
{
    this.componentsList.push(component);
    var outputs = component.getConnections(this);
    var i;
    for (i = 0; i < outputs.length; i += 1)
    {
        this.emplaceConnection(outputs[i]).setComponent(outputs[i], component);
    }
    this.dirty = true;

    if (component.type === ComponentTypes.BATTERY)
    {
        this.batteries.push(component);
    }
};

Breadboard.prototype.selectComponents = function selectComponents()
{
    var p0 = this.gameSpaceMouse;

    var p1 = this.selectStart;
    if (p1[0] === -1 && p1[1] === -1)
    {
        p1 = [p0[0], p0[1]];
    }

    var border = Component.border + Component.borderLineWidth * 0.5;

    var x0 = Math.ceil(Math.min(p0[0], p1[0]) - border);
    var y0 = Math.ceil(Math.min(p0[1], p1[1]) - border);
    var x1 = Math.floor(Math.max(p0[0], p1[0]) + border);
    var y1 = Math.floor(Math.max(p0[1], p1[1]) + border);

    if (!this.stage.isKeyDown(BaseKeyCodeMap.SHIFT))
    {
        this.selectedList.length = 0;
    }
    var noGrabOffset = [0, 0];

    var selectedList = this.selectedList;

    var x;
    var y;
    var i;
    for (x = x0; x <= x1; x += 1)
    for (y = y0; y <= y1; y += 1)
    {
        var p = [x, y];
        if (!this.validPosition(p))
        {
            continue;
        }

        var component = this.getComponent(p);
        if (component)
        {
            var found = false;
            for (i = 0; i < selectedList.length; i += 1)
            {
                if (selectedList[i].component === component)
                {
                    found = true;
                    break;
                }
            }
            if (found)
            {
                continue;
            }
            selectedList.push(new SelectedObject(component, noGrabOffset));
        }
    }
};

Breadboard.prototype.getComponent = function getComponent(p)
{
    if (!this.validPosition(p))
    {
        return null;
    }

    var id0 = this.getIndex(p[0], p[1]);
    var connection = this._connections[id0];
    if (connection)
    {
        return this._connections[id0].component;
    }
    return null;
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
        var connection = this.getConnection(outputs[i]);
        connection.setComponent(outputs[i], null);
        this.dirtyConnection(outputs[i], connection);
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
    if (this.state === Breadboard.state.MOVE)
    {
        if (this.selectStart[0] === -1 && this.selectStart[1] === -1)
        {
            this.selectStart = [p[0], p[1]];
        }
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
    this.gameSpaceMouse = [p[0], p[1]];

    if (this.state === Breadboard.state.MOVE)
    {
        this.selectComponents();
        this.selectStart = [-1, -1];
    }
    else if (this.state === Breadboard.state.PLACING_WIRE)
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

    this.gameSpaceMouse = this.gameStage.toView(p);

    if (this.isScrolling)
    {
        var delta = [p[0] - this.scrollGrab[0], p[1] - this.scrollGrab[1]];
        this.gameStage.view = [this.scrollGrabView[0] - delta[0], this.scrollGrabView[1] - delta[1]];
        return;
    }

    if (this.state === Breadboard.state.PLACING_WIRE)
    {
        this.wirePlaceUpdate(this.gameSpaceMouse, true);
    }
    else if (this.state === Breadboard.state.REMOVE_WIRE)
    {
        this.wireRemoveUpdate(this.gameSpaceMouse, true);
    }

    if (this.mouseDownComponent)
    {
        this.mouseDownComponentsUpdate(p);
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

Breadboard.prototype.onKeyUp = function onKeyUp(key, keyCode)
{
};

Breadboard.prototype.registerKeyDown = function registerKeyDown(fn)
{
    this.onKeyDownFn = fn;
};

Breadboard.prototype.unregisterKeyDown = function unregisterKeyDown(fn)
{
    this.onKeyDownFn = null;
};
