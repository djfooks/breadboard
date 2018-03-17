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
}

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
        function () { that.wireType = ComponentTypes.WIRE; });

    this.addBusWireButton = addButton("truck",       655, 40,  Breadboard.state.ADD_WIRE, false,
        function () { that.wireType = ComponentTypes.BUS; });

    this.removeWireButton = addButton("cancel",      655, 80,  Breadboard.state.REMOVE_WIRE);
    this.moveButton       = addButton("move",        655, 120, Breadboard.state.MOVE);

    this.tray = new Tray(this);
    this.tray.gameStage.onMouseDown = this.onMouseDown.bind(this);
    this.tray.gameStage.onMouseUp = this.onMouseUp.bind(this);
    this.tray.gameStage.onMouseMove = this.onMouseMove.bind(this, false);
    this.stage.addHitbox(this.tray.gameStage.gameStageHitbox);

    this.frame = 0;

    this.wireDrawParameters = new WireDrawParameters();
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
};

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
    this.wireType = ComponentTypes.WIRE;
    this.draggingPoint = [0, 0];
    this.selectedObjects = new SelectedObjectSet(this);
    this.copiedObjects = [];
    this.copiedObjectsMouse = [0, 0];
    this.draggingFromTray = false;
    this.draggingFromTrayComponent = null;
    this.wireStart = [-1, -1];
    this.selectStart = [-1, -1];
    this.gameSpaceMouse = [-1, -1];

    this.mouseDownComponent = null;
    this.mouseDownP = [-1, -1];

    this.simulateSteps = 0;

    this.connectionIdPulseMap = {};
};

Breadboard.state = {
    ADD_WIRE: 1,
    PLACING_WIRE: 2,
    REMOVE_WIRE: 3,
    DRAG: 4,
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
    var w;
    var wires = json.wires;
    var wiresLength = wires.length;
    for (i = 0; i < wiresLength; i += 1)
    {
        w = wires[i];
        breadboard.addWire(w[0], w[1], w[2], w[3], ComponentTypes.WIRE, false);
    }

    var buses = json.buses;
    if (buses)
    {
        var busesLength = buses.length;
        for (i = 0; i < busesLength; i += 1)
        {
            w = buses[i];
            breadboard.addWire(w[0], w[1], w[2], w[3], ComponentTypes.BUS, false);
        }
    }

    var componentsList = json.componentsList;
    if (!componentsList)
    {
        return breadboard;
    }
    var componentsLength = componentsList.length;
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
        component.stateFromJson(componentJson);
        component.move(breadboard, componentJson.p0 || componentJson.p, componentJson.rotation | 0);
        if (breadboard.addComponent(component))
        {
            breadboard.gameStage.addHitbox(component.hitbox);
        }
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

    if (this.stage.isKeyDown(BaseKeyCodeMap.DELETE) ||
        this.stage.isKeyDown(BaseKeyCodeMap.BACKSPACE))
    {
        this.removeSelectedObjects();
    }

    if (this.stage.isKeyDown(BaseKeyCodeMap.CTRL) &&
        this.stage.isKeyDown(BaseKeyCodeMap.KEY_C))
    {
        this.copySelectedObjects();
    }

    if (this.stage.isKeyDown(BaseKeyCodeMap.CTRL) &&
        this.stage.isKeyDown(BaseKeyCodeMap.KEY_V))
    {
        this.pasteSelectedObjects();
    }

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

    this.drawSelection();

    this.drawComponents();
    this.drawWires(this.wires, "#000000", this.wireDrawParameters);
    this.drawBuses(this.buses, "#000000", this.wireDrawParameters);
    if (this.wireType == ComponentTypes.WIRE)
    {
        this.drawWires(this.virtualWires, "#000000", this.wireDrawParameters);
    }
    else /*if (this.wireType == ComponentTypes.BUS)*/
    {
        this.drawBuses(this.virtualWires, "#000000", this.wireDrawParameters);
    }

    if (this.debugDrawHitboxes)
    {
        this.gameStage.drawHitboxes(ctx);
    }

    // ctx.fillStyle = "blue";
    // ctx.beginPath();
    // ctx.arc(this.draggingPoint[0], this.draggingPoint[1], 0.1, 0, Math.PI * 2);
    // ctx.fill();

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
        this.drawDraggedObjects();
    }

    var i;
    for (i = 0; i < this.debugDrawList.length; i += 1)
    {
        this.debugDrawList[i](ctx);
    }

    // ctx.fillStyle = "red";
    // ctx.beginPath();
    // ctx.arc(this.mouseDownP[0], this.mouseDownP[1], 2, 0, Math.PI * 2);
    // ctx.fill();
};

Breadboard.prototype.drawSelection = function drawSelection()
{
    if (this.state === Breadboard.state.DRAG)
    {
        return;
    }
    var ctx = this.stage.ctx;

    var selectedObjects = this.selectedObjects.objects;
    var component;
    for (var i = 0; i < selectedObjects.length; i += 1)
    {
        component = selectedObjects[i].object;
        component.drawSelection(ctx, "#BDB76B");
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

    var border = Component.border + Component.borderLineWidth * 0.5;

    var cx0 = Math.ceil(Math.min(x0, x1) - border);
    var cy0 = Math.ceil(Math.min(y0, y1) - border);
    var cx1 = Math.floor(Math.max(x0, x1) + border);
    var cy1 = Math.floor(Math.max(y0, y1) + border);

    var componentsList = this.componentsList;
    for (i = 0; i < componentsList.length; i += 1)
    {
        component = componentsList[i];
        var p0 = component.p0;
        var p1 = component.p1;
        var minx = Math.min(p0[0], p1[0]);
        var miny = Math.min(p0[1], p1[1]);
        var maxx = Math.max(p0[0], p1[0]);
        var maxy = Math.max(p0[1], p1[1]);
        if (maxx >= cx0 && cx1 >= minx &&
            maxy >= cy0 && cy1 >= miny)
        {
            component.drawSelection(ctx, "#AAAAAA");
        }
    }

    ctx.lineWidth = 0.35;
    ctx.strokeStyle = "#AAAAAA";

    var wires = this.wires;
    for (i = 0; i < wires.length; i += 1)
    {
        var wire = wires[i];
        if (wire.boxOverlap(x0, y0, x1, y1, cx0, cy0, cx1, cy1))
        {
            ctx.beginPath();
            ctx.moveTo(wire.x0, wire.y0);
            ctx.lineTo(wire.x1, wire.y1);
            ctx.stroke();
        }
    }

    ctx.lineWidth = 0.45;
    var buses = this.buses;
    for (i = 0; i < buses.length; i += 1)
    {
        var bus = buses[i];
        if (bus.boxOverlap(x0, y0, x1, y1, cx0, cy0, cx1, cy1))
        {
            ctx.beginPath();
            ctx.moveTo(bus.x0, bus.y0);
            ctx.lineTo(bus.x1, bus.y1);
            ctx.stroke();
        }
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

Breadboard.prototype.drawDraggedObjects = function drawDraggedObjects()
{
    var ctx = this.stage.ctx;
    var gameStage = this.draggingFromTray ? this.tray.gameStage : this.gameStage;
    if (this.state !== Breadboard.state.DRAG)
    {
        return;
    }
    var selectedObjects = this.selectedObjects;
    selectedObjects.updateConnectionMap();

    ctx.save();
    gameStage.transformContext(ctx);
    var drawOptions = new DrawOptions(null);

    var selectedComponents = selectedObjects.components;
    var selectedObj;
    var draggingPoint = this.draggingPoint;
    var viewMouseDownP = gameStage.toView(this.mouseDownP);
    var localOffset = [draggingPoint[0] - viewMouseDownP[0],
                       draggingPoint[1] - viewMouseDownP[1]];
    var valid = this.mouseOverGameStage &&
                SelectedObject.areAllValid(this, selectedComponents, localOffset);
    var i;
    for (i = 0; i < selectedComponents.length; i += 1)
    {
        selectedObj = selectedComponents[i];
        var component = selectedObj.object;

        var p = [localOffset[0] + selectedObj.grabbedPosition[0],
                 localOffset[1] + selectedObj.grabbedPosition[1]];

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

    var selectedWires = selectedObjects.wires;

    var greyDrawParameters = new WireDrawParameters();
    greyDrawParameters.hasDotFn = function (connection, x, y)
    {
        return (connection && connection.hasDot) || selectedObjects.hasDot(x, y);
    };
    this.drawWires(selectedObjects.wireObjects, "#808080", greyDrawParameters);
    this.drawBuses(selectedObjects.busObjects, "#808080", greyDrawParameters);

    var draggedDrawParameters = new WireDrawParameters();
    draggedDrawParameters.hasDotFn = function (connection, x, y)
    {
        return selectedObjects.hasDot(x, y);
    };
    localOffset[0] = localOffset[0] - Math.round(localOffset[0]);
    localOffset[1] = localOffset[1] - Math.round(localOffset[1]);
    draggedDrawParameters.offsetFn = function (offset, index)
    {
        var selectedObj = selectedWires[index];

        var p = [localOffset[0] + selectedObj.grabbedPosition[0],
                 localOffset[1] + selectedObj.grabbedPosition[1]];

        offset[0] = localOffset[0];
        offset[1] = localOffset[1];
    };

    this.drawWires(selectedObjects.wireObjects, "#000000", draggedDrawParameters);
    this.drawBuses(selectedObjects.busObjects, "#000000", draggedDrawParameters);

    ctx.restore();
};

function WireDrawParameters()
{
    this.offsetFn = function (offset, index)
    {
        offset[0] = 0;
        offset[1] = 0;
    };
    this.hasDotFn = function (connection, x, y)
    {
        return connection && connection.hasDot;
    };
}

Breadboard.prototype.drawWires = function drawWires(wires, fgColor, params)
{
    var ctx = this.stage.ctx;

    var i;

    var that = this;
    var connections = this._connections;
    var circles = {};
    var value;

    var offset = [0, 0];
    function wireIterate(x, y)
    {
        var id = that.getIndex(x, y);
        if (id == that.removeWireId)
        {
            removing = true;
        }
        var connection = connections[id];
        if (!circles[id] && params.hasDotFn(connection, x, y))
        {
            circles[id] = [x + offset[0], y + offset[1]];

            ctx.fillStyle = fgColor;
            ctx.beginPath();
            ctx.arc(x + offset[0], y + offset[1], Wire.wireWidth, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function wireIterateCurrent(x, y)
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
            ctx.moveTo(start[0] + offset[0], start[1] + offset[1]);
            ctx.lineTo(x + offset[0], y + offset[1]);
            ctx.stroke();
            start[0] = x;
            start[1] = y;
        }
    }

    var connection;
    for (i = 0; i < wires.length; i += 1)
    {
        var wire = wires[i];
        var x0 = wire.x0;
        var y0 = wire.y0;
        var x1 = wire.x1;
        var y1 = wire.y1;
        params.offsetFn(offset, i);

        var removing = false;
        wire.iterate(wireIterate);

        ctx.strokeStyle = removing ? "#888888" : fgColor;

        ctx.beginPath();
        ctx.lineWidth = Wire.wireWidth;
        ctx.moveTo(x0 + offset[0], y0 + offset[1]);
        ctx.lineTo(x1 + offset[0], y1 + offset[1]);
        ctx.stroke();

        var start = [wire.x0, wire.y0];
        connection = connections[wire.id0];

        wire.iterate(wireIterateCurrent);

        if (start[0] !== wire.x1 || start[1] !== wire.y1)
        {
            ctx.strokeStyle = Wire.getColor(value);
            ctx.lineWidth = 0.1;
            ctx.beginPath();
            ctx.moveTo(start[0] + offset[0], start[1] + offset[1]);
            ctx.lineTo(wire.x1 + offset[0], wire.y1 + offset[1]);
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
            connection = connections[id];
            if (connection)
            {
                value = connection.getValue();
            }
            else
            {
                value = 0;
            }

            ctx.fillStyle = Wire.getColor(value);
            ctx.beginPath();
            ctx.arc(x, y, 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

Breadboard.prototype.drawBuses = function drawBuses(buses, fgColor, params)
{
    var ctx = this.stage.ctx;

    var i;

    var that = this;
    var connections = this._connections;
    var diamonds = {};
    var value;

    var offset = [0, 0];
    function busIterate(x, y)
    {
        var id = that.getIndex(x, y);
        if (id == that.removeWireId)
        {
            removing = true;
        }
        var connection = connections[id];
        if (!diamonds[id] && params.hasDotFn(connection, x, y))
        {
            diamonds[id] = [x + offset[0], y + offset[1]];
        }
    }

    for (i = 0; i < buses.length; i += 1)
    {
        var bus = buses[i];
        var x0 = bus.x0;
        var y0 = bus.y0;
        var x1 = bus.x1;
        var y1 = bus.y1;
        params.offsetFn(offset, i);

        var removing = false;
        bus.iterate(busIterate);

        ctx.beginPath();
        ctx.moveTo(x0 + offset[0], y0 + offset[1]);
        ctx.lineTo(x1 + offset[0], y1 + offset[1]);

        ctx.strokeStyle = removing ? "#888888" : fgColor;
        ctx.lineWidth = 0.3;
        ctx.stroke();

        ctx.strokeStyle = "aqua";
        ctx.lineWidth = 0.15;
        ctx.stroke();

        ctx.strokeStyle = removing ? "#888888" : fgColor;
        ctx.lineWidth = 0.05;
        ctx.stroke();
    }

    ctx.strokeStyle = fgColor;
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

Breadboard.prototype.removeSelectedObjects = function removeSelectedObjects()
{
    var selectedObjects = this.selectedObjects.objects;
    var i;
    for (i = 0; i < selectedObjects.length; i += 1)
    {
        var selectedObject = selectedObjects[i].object;
        if (selectedObject.isWire())
        {
            this.removeWire(selectedObject);
        }
        else
        {
            this.removeComponent(selectedObject);
            Component.remove(this, selectedObject);
        }
    }
    this.selectedObjects.clear();
};

Breadboard.prototype.copySelectedObjects = function copySelectedObjects()
{
    var selectedObjects = this.selectedObjects.objects;
    var copiedObjects = this.copiedObjects;
    this.copiedObjectsMouse = [this.gameSpaceMouse[0], this.gameSpaceMouse[1]];
    copiedObjects.length = 0;
    var i;
    for (i = 0; i < selectedObjects.length; i += 1)
    {
        var selectedObject = selectedObjects[i];
        var copyObject = selectedObject.object.clone(this);
        copiedObjects.push(copyObject);
    }
};

Breadboard.prototype.pasteSelectedObjects = function pasteSelectedObjects()
{
    if (!this.copiedObjects.length)
    {
        return;
    }

    this.state = Breadboard.state.DRAG;

    this.shouldSwitch = false;

    var viewMouseDownP = this.getPosition(this.gameSpaceMouse);
    this.mouseDownP = this.gameStage.fromView(this.gameSpaceMouse);

    this.draggingFromTray = false;
    this.draggingFromTrayComponent = null;

    var selectedObjects = this.selectedObjects;
    selectedObjects.clear();
    var copiedObjectsMouse = this.getPosition(this.copiedObjectsMouse);

    var copiedObjects = this.copiedObjects;
    var i;
    for (i = 0; i < copiedObjects.length; i += 1)
    {
        var object = copiedObjects[i].clone(this);

        selectedObj = selectedObjects.addObject(object);

        var ox = object.getPosition()[0] - copiedObjectsMouse[0];
        var oy = object.getPosition()[1] - copiedObjectsMouse[1];
        selectedObj.grabbedPosition = [viewMouseDownP[0] + ox, viewMouseDownP[1] + oy];
    }
    selectedObjects.connectionMapDirty = true;
    selectedObjects.setOffset([0, 0]);
    for (i = 0; i < selectedObjects.objects.length; i += 1)
    {
        selectedObj = selectedObjects.objects[i];
        selectedObj.object.move(this, selectedObj.grabbedPosition, selectedObj.object.rotation);
    }

    this.mouseDownComponent = selectedObjects.objects[0].object;
};

Breadboard.prototype.removeWire = function removeWire(wire)
{
    this.dirty = true;

    var index = this.buses.indexOf(wire);
    var wireType;
    if (index !== -1)
    {
        wireType = ComponentTypes.BUS;
        this.buses.splice(index, 1);
    }
    else
    {
        wireType = ComponentTypes.WIRE;
        index = this.wires.indexOf(wire);
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

Breadboard.prototype.addWire = function addWire(x0, y0, x1, y1, type, virtual, wire)
{
    if (x0 == x1 && y0 == y1)
    {
        return;
    }

    var id0 = this.getIndex(x0, y0);
    var id1 = this.getIndex(x1, y1);

    wire = wire || new Wire(x0, y0, x1, y1, id0, id1, type);

    if (virtual)
    {
        this.virtualWires.push(wire);
    }
    else
    {
        this.dirty = true;
        if (type == ComponentTypes.WIRE)
        {
            this.wires.push(wire);
        }
        else /*if (type == ComponentTypes.BUS)*/
        {
            this.buses.push(wire);
        }

        var dx = wire.dx;
        var dy = wire.dy;
        var bit0 = wire.bit0;
        var bit1 = wire.bit1;
        var x = x0;
        var y = y0;
        var id;
        var connection;
        while (x !== x1 || y !== y1)
        {
            id = this.getIndex(x, y);
            connection = this.emplaceConnection(id);
            connection.addWire(id, bit0, type);
            connection.addWireComponent(id, wire);
            x += dx;
            y += dy;
            id = this.getIndex(x, y);
            connection = this.emplaceConnection(id);
            connection.addWire(id, bit1, type);
        }
        connection.addWireComponent(id, wire);
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
            this.addWire(p[0], p[1], wireStart[0], wireStart[1], this.wireType, virtual);
        }
        else
        {
            var x = p[0] - wireStart[0];
            var y = p[1] - wireStart[1];
            if (Math.abs(x) < Math.abs(y))
            {
                y = ((y > 0 && x > 0) || (y < 0 && x < 0)) ? x : -x;
                this.addWire(wireStart[0], wireStart[1], wireStart[0] + x, wireStart[1] + y, this.wireType, virtual);
                this.addWire(wireStart[0] + x, wireStart[1] + y, p[0], p[1], this.wireType, virtual);
            }
            else
            {
                x = ((x > 0 && y > 0) || (x < 0 && y < 0)) ? y : -y;
                this.addWire(wireStart[0], wireStart[1], wireStart[0] + x, wireStart[1] + y, this.wireType, virtual);
                this.addWire(wireStart[0] + x, wireStart[1] + y, p[0], p[1], this.wireType, virtual);
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
    if (button === 2)
    {
        this.shouldSwitch = false;
        return true;
    }

    if (this.state === Breadboard.state.MOVE && this.stage.isKeyDown(BaseKeyCodeMap.SHIFT))
    {
        this.shouldSwitch = false;
        if (this.selectedObjects.removeObject(component))
        {
            return true;
        }
        this.selectedObjects.addObject(component);
        return true;
    }

    this.shouldSwitch = true;

    this.mouseDownComponent = component;
    this.mouseDownP = [p[0], p[1]];

    this.draggingFromTray = this.tray.isFromTray(component);
    this.draggingFromTrayComponent = component;
    return false;
};

Breadboard.prototype.onComponentMouseUp = function onComponentMouseUp(p, button)
{
    if (button === 2)
    {
        if (this.state === Breadboard.state.DRAG)
        {
            this.rotateComponents();
        }
        return true;
    }

    var selectedObjects = this.selectedObjects;
    if (this.shouldSwitch)
    {
        var mouseDownComponent = this.mouseDownComponent;
        var q = this.gameStage.toView(p);
        if (mouseDownComponent)
        {
            mouseDownComponent.toggle(this, this.getPosition(q));
            this.dirtySave = true;
        }

        if (this.state === Breadboard.state.MOVE)
        {
            var selectedIndex = selectedObjects.indexOf(mouseDownComponent);
            if (selectedIndex === -1)
            {
                if (!this.stage.isKeyDown(BaseKeyCodeMap.SHIFT))
                {
                    selectedObjects.clear();
                }
                var selectedObj = selectedObjects.addObject(mouseDownComponent);
                selectedObj.grabbedPosition = mouseDownComponent.getPosition();
            }
            else if (this.stage.isKeyDown(BaseKeyCodeMap.SHIFT))
            {
                selectedObjects.removeObject(mouseDownComponent);
            }
        }
    }

    if (this.stage.isKeyDown(BaseKeyCodeMap.SHIFT))
    {
        return true;
    }

    this.mouseDownComponent = null;
    this.mouseDownP = [-1, -1];

    if (this.shouldSwitch ||
        this.state !== Breadboard.state.DRAG ||
        this.selectedObjects.objects.length === 0)
    {
        return false;
    }

    var selectedComponents = selectedObjects.components;
    var selectedWires = selectedObjects.wires;
    var valid = this.mouseOverGameStage && SelectedObject.areAllValid(this, selectedComponents);
    var i;
    if (valid)
    {
        for (i = 0; i < selectedComponents.length; i += 1)
        {
            this.addComponent(selectedComponents[i].object);
        }
        for (i = 0; i < selectedWires.length; i += 1)
        {
            var wire = selectedWires[i].object;
            this.addWire(wire.x0, wire.y0, wire.x1, wire.y1, wire.type, false, wire);
        }
    }
    else
    {
        for (i = 0; i < selectedComponents.length; i += 1)
        {
            Component.remove(this, selectedComponents[i].object);
        }
        this.selectedObjects.clear();
    }

    this.state = Breadboard.state.MOVE;
    this.disableButtons();
    this.enableButton(this.moveButton);
    return true;
};

Breadboard.prototype.mouseDownComponentsUpdate = function mouseDownComponentsUpdate(p)
{
    var i;
    var fromTray = this.draggingFromTray;
    var gameStage = fromTray ? this.tray.gameStage : this.gameStage;
    var draggingPoint = this.draggingPoint = gameStage.toView(p);
    var selectedObjects = this.selectedObjects;
    var selectedComponents = this.selectedObjects.components;
    var mouseDownP = this.mouseDownP;
    var selectedObj;
    var canDrag = fromTray || (this.state === Breadboard.state.MOVE || this.state === Breadboard.state.DRAG);

    if (this.shouldSwitch)
    {
        if (p[0] != mouseDownP[0] ||
            p[1] != mouseDownP[1])
        {
            if (canDrag)
            {
                this.state = Breadboard.state.DRAG;
                var mouseDownComponent = this.mouseDownComponent;

                if (fromTray)
                {
                    this.disableButtons();
                    this.enableButton(this.moveButton);
                    selectedObjects.clear();
                    selectedObj = selectedObjects.addObject(mouseDownComponent.clone(this));
                    selectedObj.grabbedPosition = mouseDownComponent.getPosition();
                    this.tray.gameStage.addHitbox(selectedObj.object.hitbox);
                }
                else
                {
                    var selectedIndex = selectedObjects.indexOf(mouseDownComponent);
                    if (selectedIndex !== -1)
                    {
                        for (i = 0; i < selectedComponents.length; i += 1)
                        {
                            selectedObj = selectedComponents[i];
                            if (!this.removeComponent(selectedObj.object))
                            {
                                throw new Error("Unable to remove component");
                            }
                            selectedObj.grabbedPosition = selectedObj.object.getPosition();
                        }
                        var selectedWires = selectedObjects.wires;
                        for (i = 0; i < selectedWires.length; i += 1)
                        {
                            selectedObj = selectedWires[i];
                            this.removeWire(selectedObj.object);
                            selectedObj.grabbedPosition = selectedObj.object.getPosition();
                        }
                        selectedObjects.connectionMapDirty = true;
                    }
                    else
                    {
                        if (mouseDownComponent.isWire())
                        {
                            this.removeWire(mouseDownComponent);
                        }
                        else
                        {
                            if (!this.removeComponent(mouseDownComponent))
                            {
                                throw new Error("Unable to remove component");
                            }
                        }
                        selectedObjects.clear();
                        selectedObj = selectedObjects.addObject(mouseDownComponent);
                        selectedObj.grabbedPosition = mouseDownComponent.getPosition();
                        selectedObjects.connectionMapDirty = true;
                    }
                }
            }
            this.shouldSwitch = false;
        }
    }

    if (this.shouldSwitch || !canDrag)
    {
        this.mouseDownComponent = null;
        return;
    }

    var viewMouseDownP = this.gameStage.toView(mouseDownP);
    var localOffset;
    if (fromTray && this.mouseOverGameStage)
    {
        var selectedObject = selectedObjects.objects[0];

        var trayViewMouseDownP = this.tray.gameStage.toView(mouseDownP);
        localOffset = [trayViewMouseDownP[0] - selectedObject.grabbedPosition[0],
                       trayViewMouseDownP[1] - selectedObject.grabbedPosition[1]];

        draggingPoint = this.draggingPoint = this.gameStage.toView(p);
        selectedObject.grabbedPosition = this.getPosition(draggingPoint);

        var newMouseDownView = [selectedObject.grabbedPosition[0] + localOffset[0],
                                selectedObject.grabbedPosition[1] + localOffset[1]];

        this.mouseDownP = this.gameStage.fromView(newMouseDownView);

        this.tray.gameStage.removeHitbox(selectedObject.object.hitbox);
        gameStage = this.gameStage;
        gameStage.addHitbox(selectedObject.object.hitbox);

        fromTray = this.draggingFromTray = false;
        this.draggingFromTrayComponent = null;
    }

    localOffset = [draggingPoint[0] - viewMouseDownP[0],
                   draggingPoint[1] - viewMouseDownP[1]];
    var positionOffset = this.getPosition(localOffset);
    selectedObjects.setOffset(positionOffset);
    var componentMovePoint;
    for (i = 0; i < selectedObjects.objects.length; i += 1)
    {
        selectedObj = selectedObjects.objects[i];
        componentMovePoint = [positionOffset[0] + selectedObj.grabbedPosition[0],
                              positionOffset[1] + selectedObj.grabbedPosition[1]];
        selectedObj.object.move(this, componentMovePoint, selectedObj.object.rotation);
    }
};

Breadboard.prototype.rotateComponents = function rotateComponents()
{
    var fromTray = this.draggingFromTray;
    var gameStage = fromTray ? this.tray.gameStage : this.gameStage;

    var draggingPoint = this.draggingPoint;
    var mouseDownP = this.mouseDownP;
    var viewMouseDownP = gameStage.toView(mouseDownP);

    var selectedObjects = this.selectedObjects;

    var viewMouseDownPInt = this.getPosition(viewMouseDownP);

    var offsetX = draggingPoint[0] - viewMouseDownP[0];
    var offsetY = draggingPoint[1] - viewMouseDownP[1];

    var selectedComponents = selectedObjects.components;
    var selectedObj;
    var i;
    for (i = 0; i < selectedComponents.length; i += 1)
    {
        selectedObj = selectedComponents[i];
        var component = selectedObj.object;
        var newRotation = Rotate90(component.rotation);

        localOffset = [selectedObj.grabbedPosition[0] - viewMouseDownP[0],
                       selectedObj.grabbedPosition[1] - viewMouseDownP[1]];
        selectedObj.grabbedPosition = [Math.round(viewMouseDownP[0] + localOffset[1] + offsetX),
                                       Math.round(viewMouseDownP[1] - localOffset[0] + offsetY)];

        component.move(this, component.p0, newRotation);
    }

    var selectedWires = selectedObjects.wires;
    for (i = 0; i < selectedWires.length; i += 1)
    {
        selectedObj = selectedWires[i];

        localOffset = [selectedObj.grabbedPosition[0] - viewMouseDownP[0],
                       selectedObj.grabbedPosition[1] - viewMouseDownP[1]];
        selectedObj.grabbedPosition = [Math.round(viewMouseDownP[0] + localOffset[1] + offsetX),
                                       Math.round(viewMouseDownP[1] - localOffset[0] + offsetY)];

        var wire = selectedObj.object;
        wire.rotate(this);
    }

    var ox = viewMouseDownP[0] - viewMouseDownP[1] + offsetX;
    var oy = viewMouseDownP[1] + viewMouseDownP[0] + offsetY;
    this.mouseDownP = gameStage.fromView([draggingPoint[0] - (ox - Math.round(ox)),
                                          draggingPoint[1] - (oy - Math.round(oy))]);

    selectedObjects.setOffset([0, 0]);
    for (i = 0; i < selectedObjects.objects.length; i += 1)
    {
        selectedObj = selectedObjects.objects[i];
        selectedObj.object.move(this, selectedObj.grabbedPosition, selectedObj.object.rotation);
    }
    selectedObjects.connectionMapDirty = true;
};

Breadboard.prototype.addComponent = function addComponent(component)
{
    var outputs = component.getConnections(this);
    var i;
    for (i = 0; i < outputs.length; i += 1)
    {
        var connection = this.findConnection(outputs[i]);
        if (connection && connection.component)
        {
            throw new Error("Adding component to a connection which already has a component!");
        }
    }
    this.componentsList.push(component);
    for (i = 0; i < outputs.length; i += 1)
    {
        this.emplaceConnection(outputs[i]).setComponent(outputs[i], component);
    }
    this.dirty = true;

    if (component.type === ComponentTypes.BATTERY)
    {
        this.batteries.push(component);
    }
    return true;
};

Breadboard.prototype.updateSelection = function updateSelection()
{
    var p0 = this.gameSpaceMouse;
    var p1 = this.selectStart;
    var i;

    var selectedObjects = this.selectedObjects;
    var selectedWires = selectedObjects.wires;
    if (p1[0] === p0[0] && p1[1] === p0[1])
    {
        for (i = 0; i < selectedWires.length; i += 1)
        {
            var object = selectedWires[i].object;
            if (object.distance(p0[0], p0[1]) == 0.0)
            {
                this.shouldSwitch = false;
                if (this.stage.isKeyDown(BaseKeyCodeMap.SHIFT))
                {
                    selectedWires.splice(i, 1);
                    return;
                }
            }
        }
    }
    if (p1[0] === -1 && p1[1] === -1)
    {
        return;
    }
    this.shouldSwitch = false;

    var selectedObj;

    var x0 = this.selectStart[0];
    var y0 = this.selectStart[1];
    var x1 = this.gameSpaceMouse[0];
    var y1 = this.gameSpaceMouse[1];

    var border = Component.border + Component.borderLineWidth * 0.5;

    var cx0 = Math.ceil(Math.min(x0, x1) - border);
    var cy0 = Math.ceil(Math.min(y0, y1) - border);
    var cx1 = Math.floor(Math.max(x0, x1) + border);
    var cy1 = Math.floor(Math.max(y0, y1) + border);

    var componentsList = this.componentsList;
    for (i = 0; i < componentsList.length; i += 1)
    {
        component = componentsList[i];
        var c0 = component.p0;
        var c1 = component.p1;
        var minx = Math.min(c0[0], c1[0]);
        var miny = Math.min(c0[1], c1[1]);
        var maxx = Math.max(c0[0], c1[0]);
        var maxy = Math.max(c0[1], c1[1]);
        if (maxx >= cx0 && cx1 >= minx &&
            maxy >= cy0 && cy1 >= miny)
        {
            selectedObjects.addObject(component);
        }
    }

    var wires = this.wires;
    for (i = 0; i < wires.length; i += 1)
    {
        var wire = wires[i];
        if (wire.boxOverlap(x0, y0, x1, y1))
        {
            selectedObjects.addObject(wire);
        }
    }

    var buses = this.buses;
    for (i = 0; i < buses.length; i += 1)
    {
        var bus = buses[i];
        if (bus.boxOverlap(x0, y0, x1, y1))
        {
            selectedObjects.addObject(bus);
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

Breadboard.prototype.getComponentFromMouse = function getComponentFromMouse(p)
{
    var q;
    var hitbox;
    if (!this.mouseOverGameStage)
    {
        q = this.tray.gameStage.toView(p);
        hitbox = this.tray.gameStage.findHitbox(q[0], q[1]);
        if (hitbox && hitbox.data)
        {
            return hitbox.data;
        }
        return null;
    }

    q = this.gameStage.toView(p);
    var buses = this.buses;
    var i;
    for (i = 0; i < buses.length; i += 1)
    {
        var bus = buses[i];
        if (bus.distance(q[0], q[1]) < 0.05)
        {
            return bus;
        }
    }
    var wires = this.wires;
    for (i = 0; i < wires.length; i += 1)
    {
        var wire = wires[i];
        if (wire.distance(q[0], q[1]) < 0.05)
        {
            return wire;
        }
    }
    hitbox = this.gameStage.findHitbox(q[0], q[1]);
    if (hitbox && hitbox.data)
    {
        return hitbox.data;
    }
    return null;
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

    var component = this.getComponentFromMouse(p);
    if (component)
    {
        if (this.onComponentMouseDown(component, p, button))
        {
            return;
        }
    }
    if (!this.mouseOverGameStage)
    {
        return;
    }

    q = this.gameStage.toView(p);
    if (this.state === Breadboard.state.MOVE)
    {
        if (!component)
        {
            if (this.selectStart[0] === -1 && this.selectStart[1] === -1)
            {
                this.selectStart = [q[0], q[1]];
            }
            if (!this.stage.isKeyDown(BaseKeyCodeMap.SHIFT))
            {
                this.selectedObjects.clear();
            }
        }
    }
    q = this.getPosition(q);

    if (this.state !== Breadboard.state.ADD_WIRE)
    {
        return;
    }

    if (this.validPosition(q))
    {
        this.state = Breadboard.state.PLACING_WIRE;
        this.wireStart = q;
    }
};

Breadboard.prototype.onMouseUp = function onMouseUp(p, button)
{
    if (button === 1)
    {
        this.isScrolling = false;
        return;
    }

    if (this.state === Breadboard.state.DRAG)
    {
        this.onComponentMouseUp(p, button);
        return;
    }

    var component = this.getComponentFromMouse(p);
    if (component)
    {
        if (this.onComponentMouseUp(p, button))
        {
            return;
        }
    }

    if (!this.mouseOverGameStage)
    {
        return;
    }

    p = this.gameStage.toView(p);
    this.gameSpaceMouse = [p[0], p[1]];

    if (this.state === Breadboard.state.MOVE)
    {
        this.updateSelection();
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
