function Breadboard(stage, top, left, cols, rows)
{
    this.stage = stage;

    this.debugDrawList = [];

    this.wireHasDot = this.wireHasDotFn.bind(this);
    this.virtualWireHasDot = this.virtualWireHasDotFn.bind(this);

    this.stage.onMouseDown = this.onMouseDown.bind(this);
    this.stage.onMouseUp = this.onMouseUp.bind(this);
    this.stage.onMouseMove = this.onMouseMove.bind(this, false);
    this.stage.onWheel = this.onWheel.bind(this);
    this.stage.onKeyDown = this.onKeyDown.bind(this);
    this.stage.onKeyUp = this.onKeyUp.bind(this);

    this.onKeyDownFn = null;

    var canvas = this.stage.canvas;
    this.gameStage = new GameStage(canvas, 10, 10, canvas.width - 240, canvas.height - 10);
    this.stage.addHitbox(this.gameStage.gameStageHitbox);

    this.prevView = [0, 0]
    this.prevZoomLevel = 0;

    this.canvasScene = new THREE.Scene();
    this.canvasCamera = new THREE.OrthographicCamera(0, canvas.width, 0, canvas.height, 0, 100);
    this.canvasCamera.position.z = 100;
    this.canvasCamera.updateProjectionMatrix();

    this.gameStage.onMouseDown = this.onMouseDown.bind(this);
    this.gameStage.onMouseUp = this.onMouseUp.bind(this);
    this.gameStage.onMouseMove = this.onMouseMove.bind(this, true);
    this.mouseOverGameStage = false;

    this.isScrolling = false;
    this.scrollGrab = [0, 0];

    this.top = top;
    this.left = left;
    this.cols = cols;
    this.rows = rows;

    this.scene = stage.scene;
    this.gameRenderer = new GameRenderer();
    this.gridRenderer = new GridRenderer();
    this.wireRenderer = new WireRenderer(this.gameRenderer);
    this.busRenderer = new BusRenderer(this.gameRenderer);
    this.componentBoxRenderer = new ComponentBoxRenderer(this.gameRenderer, false);
    this.componentRenderer = new ComponentRenderer(this.gameRenderer);
    this.lineRenderer = new LineRenderer(this.gameRenderer, ColorPalette.base.gameBorder, "src/shaders/line.vert", "src/shaders/line.frag");

    this.selectionLines = new LineRenderer(this.gameRenderer, ColorPalette.base.selectionBox, "src/shaders/selectionline.vert", "src/shaders/selectionline.frag");
    this.selectionComponentBoxRenderer = new ComponentBoxRenderer(this.gameRenderer, true);
    this.selectionWireRenderer = new WireRenderer(this.gameRenderer, true);
    this.selectionBusRenderer = new BusRenderer(this.gameRenderer, true);
    this.selectionGeometryDirty = true;

    this.virtualWireRenderer = new WireRenderer(this.gameRenderer);
    this.virtualWireGeometryDirty = true;
    ColorPalette.setColorRGB(ColorPalette.base.virtualWire, this.virtualWireRenderer.wireEdgeColor.value);

    this.virtualBusRenderer = new BusRenderer(this.gameRenderer);
    this.virtualBusGeometryDirty = true;
    this.virtualBusRenderer.colorTexture.value = ColorPalette.base.textures.virtualBus;
    ColorPalette.setColorRGB(ColorPalette.base.virtualBusBg, this.virtualBusRenderer.bgColor.value);

    this.tray = new Tray(this);
    this.tray.gameStage.onMouseDown = this.onMouseDown.bind(this);
    this.tray.gameStage.onMouseUp = this.onMouseUp.bind(this);
    this.tray.gameStage.onMouseMove = this.onMouseMove.bind(this, false);
    this.stage.addHitbox(this.tray.gameStage.gameStageHitbox);

    this.selectedObjects = new SelectedObjectSet(this);

    this.prevDrawState = Breadboard.state.START_STATE;
    this.clear();

    this.frame = 0;
}

Breadboard.prototype.postLoad = function postLoad()
{
    var scene = this.scene;
    var feather = this.gameStage.feather;

    this.gridRenderer.addMeshes(scene, feather);

    this.selectionComponentBoxRenderer.addMeshes(scene, feather);
    this.componentBoxRenderer.addMeshes(scene, feather);
    this.componentRenderer.addMeshes(scene, feather);

    this.selectionWireRenderer.createMeshes(scene, feather);
    this.selectionBusRenderer.createMeshes(scene, feather);
    this.wireRenderer.createMeshes(scene, feather);

    this.busRenderer.createMeshes(scene, feather);

    this.selectionLines.addMeshes(scene, feather);

    this.virtualWireRenderer.createMeshes(scene, feather);
    this.virtualBusRenderer.createMeshes(scene, feather);

    this.selectedObjects.postLoad();
    this.tray.postLoad();

    var lineRenderer = this.lineRenderer;
    var gameStage = this.gameStage;
    lineRenderer.addMeshes(this.canvasScene);

    var width = 1.0;
    var minX = gameStage.minX;
    var maxX = gameStage.maxX;
    var minY = gameStage.minY;
    var maxY = gameStage.maxY;

    lineRenderer.addLine(minX + width, minY, minX + width, maxY);
    lineRenderer.addLine(minX, maxY, maxX, maxY);
    lineRenderer.addLine(maxX - width, maxY, maxX - width, minY);
    lineRenderer.addLine(maxX, minY, minX, minY);

    lineRenderer.updateGeometry();
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
    this.geometryDirty = true;

    this.shouldSwitch = false;
    this.state = Breadboard.state.START_STATE;
    this.wireType = ComponentTypes.WIRE;
    this.draggingPoint = [0, 0];
    this.selectedObjects.clear();
    this.copiedObjects = [];
    this.draggingFromTray = false;
    this.wireStart = [-1, -1];
    this.selectStart = [-1, -1];
    this.gameSpaceMouse = [-1, -1];

    this.mouseDownComponent = null;
    this.gameSpaceMouseDownP = [-1, -1];

    this.runSimulation = true;
    this.stepSimulation = false;

    this.connectionIdPulseMap = {};
};

Breadboard.state = {
    ADD_WIRE: 1,
    PLACING_WIRE: 2,
    REMOVE_WIRE: 3,
    DRAG: 4,
    MOVE: 5,
};

Breadboard.state.START_STATE = Breadboard.state.ADD_WIRE;

Breadboard.prototype.setState = function setState(state, wireType)
{
    this.state = state;
    this.wireType = wireType;
};

Breadboard.prototype.toJson = function toJson()
{
    var out = {
        viewX: this.gameStage.view[0],
        viewY: this.gameStage.view[1],
        viewZoom: this.gameStage.zoomLevel,
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
        out.wires.push(wires[i].toJson(false));
    }

    var buses = this.buses;
    var busesLength = buses.length;
    for (i = 0; i < busesLength; i += 1)
    {
        out.buses.push(buses[i].toJson(true));
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

    if (json.viewZoom)
    {
        breadboard.gameStage.setView(json.viewX, json.viewY, json.viewZoom);
    }

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
            if (w.length == 5)
            {
                var bus = breadboard.buses[breadboard.buses.length - 1];
                bus.colorIndex = w[4];
            }
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
        breadboard.addComponent(component);
    }
    return breadboard;
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

    if (this.gameStage.view[0] != this.prevView[0] ||
        this.gameStage.view[1] != this.prevView[1] ||
        this.gameStage.zoomLevel != this.prevZoomLevel)
    {
        if (this.gameStage.zoomVelocity == 0)
        {
            this.prevView[0] = this.gameStage.view[0];
            this.prevView[1] = this.gameStage.view[1];
            this.prevZoomLevel = this.gameStage.zoomLevel;
            this.dirtySave = true;
        }
    }

    if (!this.focusComponent)
    {
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
    }

    if (this.runSimulation || this.stepSimulation)
    {
        this.stepSimulation = false;

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

        if (this.dirty)
        {
            this.dirty = false;
        }
    }
    this.draw();
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

Breadboard.prototype.wireHasDotFn = function wireHasDotFn(id, x, y)
{
    var connection = this.getConnection(id);
    return connection.hasDot;
};

Breadboard.prototype.virtualWireHasDotFn = function virtualWireHasDotFn(id, x, y)
{
    var virtualWires = this.virtualWires;
    var i;
    for (i = 0; i < virtualWires.length; i += 1)
    {
        var wire = virtualWires[i];
        if (wire.id0 == id || wire.id1 == id)
        {
            return true;
        }
    }

    var connection = this.findConnection(id);
    if (connection)
    {
        return connection.hasDot;
    }
    return false;
};

Breadboard.prototype.draw = function draw()
{
    var stage = this.stage;
    var canvas = stage.canvas;
    var camera = this.gameStage.camera;

    if (this.state != this.prevDrawState)
    {
        if (this.state === Breadboard.state.DRAG || this.prevDrawState === Breadboard.state.DRAG)
        {
            this.selectedObjects.draggingGeometryDirty = true;
            this.selectionGeometryDirty = true;
        }
        this.prevDrawState = this.state;
    }

    this.gridRenderer.updateGeometry(camera);
    if (this.geometryDirty)
    {
        this.gameRenderer.textureSize.value = 0;
        this.wireRenderer.updateGeometry(this.wires, this, false, this.wireHasDot);
        this.busRenderer.updateGeometry(this.buses, this, false, this.wireHasDot);
        this.componentBoxRenderer.updateGeometry(this.componentsList);

        this.componentRenderer.updateGeometry(this.componentsList, this, false);

        this.gameRenderer.createValuesTexture();
        this.geometryDirty = false;
    }

    if (this.virtualWireGeometryDirty)
    {
        this.virtualWireRenderer.updateGeometry(this.virtualWires, this, true, this.virtualWireHasDot);
        this.virtualWireGeometryDirty = false;
    }

    if (this.virtualBusGeometryDirty)
    {
        this.virtualBusRenderer.updateGeometry(this.virtualWires, this, true, this.virtualWireHasDot);
        this.virtualBusGeometryDirty = false;
    }

    this.updateSelectionGeometry();

    var that = this;
    var wire;
    var textureData = this.gameRenderer.textureData;
    var connections = this._connections;
    function wireIterate(x, y, index)
    {
        var id = that.getIndex(x, y);
        var connection = connections[id];
        var connectionValue = 0;
        if (connection)
        {
            connectionValue = connection.getDirectionValue(wire.directionId);
        }

        textureData[wire.texture0 + index] = connectionValue ? 255 : 0;
    }

    var i;
    for (i = 0; i < this.wires.length; i += 1)
    {
        wire = this.wires[i];
        wire.iterate(wireIterate);
    }
    for (i = 0; i < this.componentsList.length; i += 1)
    {
        this.componentsList[i].render(this.gameRenderer);
    }
    this.gameRenderer.dataTexture.needsUpdate = true;

    stage.renderer.clear();

    this.gameStage.setScissor(stage.renderer);
    stage.renderer.render(stage.scene, this.gameStage.camera);
    this.selectedObjects.draw();

    this.tray.draw();

    stage.renderer.setScissor(0, 0, canvas.width, canvas.height);
    stage.renderer.setScissorTest(false);
    stage.renderer.render(this.canvasScene, this.canvasCamera);

    this.selectedObjects.drawHover();
};

Breadboard.prototype.updateSelectionGeometry = function updateSelectionGeometry()
{
    var selectionLines = this.selectionLines;
    var selectingObjects = (this.selectStart[0] != -1 || this.selectStart[1] != -1);
    if (!this.selectionGeometryDirty && !selectingObjects)
    {
        selectionLines.clearLines();
        selectionLines.updateGeometry();

        return;
    }
    this.selectionGeometryDirty = false;

    if (this.state === Breadboard.state.DRAG)
    {
        selectionLines.clearLines();
        selectionLines.updateGeometry();

        this.selectionComponentBoxRenderer.updateGeometry([]);
        this.selectionWireRenderer.updateGeometry([], this, true, this.wireHasDot);
        this.selectionBusRenderer.updateGeometry([], this, true, this.wireHasDot);
        return;
    }

    var selectedObjects = this.selectedObjects;

    var border = Component.border;

    var selectionComponents = selectedObjects.componentObjects.slice();
    var selectionWires = selectedObjects.wireObjects.slice();
    var selectionBuses = selectedObjects.busObjects.slice();

    selectionLines.clearLines();
    if (selectingObjects)
    {
        var i;
        var x0 = this.selectStart[0];
        var y0 = this.selectStart[1];
        var x1 = this.gameSpaceMouse[0];
        var y1 = this.gameSpaceMouse[1];

        var minX = Math.min(x0, x1);
        var minY = Math.min(y0, y1);
        var maxX = Math.max(x0, x1);
        var maxY = Math.max(y0, y1);

        selectionLines.addLine(minX, minY, minX, maxY);
        selectionLines.addLine(minX, maxY, maxX, maxY);
        selectionLines.addLine(maxX, maxY, maxX, minY);
        selectionLines.addLine(maxX, minY, minX, minY);

        var cx0 = Math.ceil(minX - border);
        var cy0 = Math.ceil(minY - border);
        var cx1 = Math.floor(maxX + border);
        var cy1 = Math.floor(maxY + border);

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
                selectionComponents.push(component);
            }
        }

        var wires = this.wires;
        for (i = 0; i < wires.length; i += 1)
        {
            var wire = wires[i];
            if (wire.boxOverlap(x0, y0, x1, y1, cx0, cy0, cx1, cy1))
            {
                selectionWires.push(wire);
            }
        }

        var buses = this.buses;
        for (i = 0; i < buses.length; i += 1)
        {
            var bus = buses[i];
            if (bus.boxOverlap(x0, y0, x1, y1, cx0, cy0, cx1, cy1))
            {
                selectionBuses.push(bus);
            }
        }
    }

    selectionLines.updateGeometry();
    this.selectionComponentBoxRenderer.updateGeometry(selectionComponents);
    this.selectionWireRenderer.updateGeometry(selectionWires, this, true, this.wireHasDot);
    this.selectionBusRenderer.updateGeometry(selectionBuses, this, true, this.wireHasDot);
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
    var i;
    if (this.state !== Breadboard.state.DRAG)
    {
        var selectedObjects = this.selectedObjects.objects;
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
            }
        }
    }
    this.selectedObjects.clear();
    this.selectionGeometryDirty = true;

    this.state = Breadboard.state.MOVE;

    this.mouseDownComponent = null;
};

Breadboard.prototype.copySelectedObjects = function copySelectedObjects()
{
    var selectedObjects = this.selectedObjects.objects;
    var copiedObjects = this.copiedObjects;
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

    this.draggingFromTray = false;

    var selectedObjects = this.selectedObjects;
    selectedObjects.clear();

    var copiedObjects = this.copiedObjects;
    var i;
    var minX =  9999999;
    var maxX = -9999999;
    var minY =  9999999;
    var maxY = -9999999;
    var object;
    for (i = 0; i < copiedObjects.length; i += 1)
    {
        object = copiedObjects[i];
        if (object.isWire())
        {
            minX = Math.min(minX, object.x0, object.x1);
            maxX = Math.max(maxX, object.x0, object.x1);
            minY = Math.min(minY, object.y0, object.y1);
            maxY = Math.max(maxY, object.y0, object.y1);
        }
        else
        {
            minX = Math.min(minX, object.p0[0], object.p1[0]);
            maxX = Math.max(maxX, object.p0[0], object.p1[0]);
            minY = Math.min(minY, object.p0[1], object.p1[1]);
            maxY = Math.max(maxY, object.p0[1], object.p1[1]);
        }
    }
    var center = [(minX + maxX) * 0.5, (minY + maxY) * 0.5];
    var roundedCenter = this.getPosition(center);

    var gameSpaceMouseDownP = this.gameSpaceMouseDownP;
    var gameSpaceMouseDownPRounded = this.getPosition(gameSpaceMouseDownP);

    for (i = 0; i < copiedObjects.length; i += 1)
    {
        object = copiedObjects[i].clone(this);

        selectedObj = selectedObjects.addObject(object);

        var ox = object.getPosition()[0] - roundedCenter[0];
        var oy = object.getPosition()[1] - roundedCenter[1];
        selectedObj.grabbedPosition = [gameSpaceMouseDownPRounded[0] + ox, gameSpaceMouseDownPRounded[1] + oy];
    }

    this.gameSpaceMouseDownP[0] += center[0] - roundedCenter[0];
    this.gameSpaceMouseDownP[1] += center[1] - roundedCenter[1];

    selectedObjects.connectionMapDirty = true;
    selectedObjects.setOffset([0, 0], [0, 0]);
    selectedObjects.render = true;
    for (i = 0; i < selectedObjects.objects.length; i += 1)
    {
        selectedObj = selectedObjects.objects[i];
        selectedObj.object.move(this, selectedObj.grabbedPosition, selectedObj.object.rotation);
    }
    selectedObjects.updateConnectionMap();

    this.mouseDownComponent = selectedObjects.objects[0].object;

    this.mouseDownComponentsUpdate(this.gameStage.fromView(this.gameSpaceMouse));
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
        return null;
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

        this.geometryDirty = true;
    }
    return wire;
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
                this.selectedObjects.removeObject(wires[0]);
                this.removeWire(wires[0]);
            }
            var buses = connection.buses;
            while (buses.length)
            {
                this.selectedObjects.removeObject(buses[0]);
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
        if (this.wireType == ComponentTypes.WIRE)
        {
            this.virtualWireGeometryDirty = true;
        }
        else
        {
           this.virtualBusGeometryDirty = true;
        }
        return;
    }
    if (this.state === Breadboard.state.PLACING_WIRE)
    {
        this.virtualWires = [];
        if (this.wireType == ComponentTypes.WIRE)
        {
            this.virtualWireGeometryDirty = true;
        }
        else
        {
           this.virtualBusGeometryDirty = true;
        }

        var wireStart = this.wireStart;
        if (p[0] === wireStart[0] &&
            p[1] === wireStart[1])
        {
            return;
        }
        this.shouldSwitch = false;

        var wires = [];
        if (p[0] === wireStart[0] ||
            p[1] === wireStart[1])
        {
            wires.push(this.addWire(p[0], p[1], wireStart[0], wireStart[1], this.wireType, virtual));
        }
        else
        {
            var x = p[0] - wireStart[0];
            var y = p[1] - wireStart[1];
            if (Math.abs(x) < Math.abs(y))
            {
                y = ((y > 0 && x > 0) || (y < 0 && x < 0)) ? x : -x;
                wires.push(this.addWire(wireStart[0], wireStart[1], wireStart[0] + x, wireStart[1] + y, this.wireType, virtual));
                wires.push(this.addWire(wireStart[0] + x, wireStart[1] + y, p[0], p[1], this.wireType, virtual));
            }
            else
            {
                x = ((x > 0 && y > 0) || (x < 0 && y < 0)) ? y : -y;
                wires.push(this.addWire(wireStart[0], wireStart[1], wireStart[0] + x, wireStart[1] + y, this.wireType, virtual));
                wires.push(this.addWire(wireStart[0] + x, wireStart[1] + y, p[0], p[1], this.wireType, virtual));
            }
        }

        if (this.wireType == ComponentTypes.BUS)
        {
            Bus.updateColors(this, wires, virtual);
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

    var fromTray = this.draggingFromTray = this.tray.isFromTray(component);
    var gameStage = fromTray ? this.tray.gameStage : this.gameStage;

    this.mouseDownComponent = component;
    this.gameSpaceMouseDownP = gameStage.toView(p);
    this.selectedObjects.setGameStage(fromTray);

    if (!this.draggingFromTray &&
        (!component.isWire() && this.componentsList.indexOf(component) === -1))
    {
        throw new Error("Clicked on a component that is not a part of the breadboard!");
    }
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
    var endMouseP = [this.gameSpaceMouseDownP[0], this.gameSpaceMouseDownP[1]];
    this.gameSpaceMouseDownP = [-1, -1];

    if (this.shouldSwitch ||
        this.state !== Breadboard.state.DRAG ||
        selectedObjects.objects.length === 0)
    {
        return false;
    }

    selectedObjects.render = false;
    selectedObjects.draggingGeometryDirty = true;

    var selectedComponents = selectedObjects.components;
    var selectedWires = selectedObjects.wires;

    var localOffset = [this.draggingPoint[0] - endMouseP[0],
                       this.draggingPoint[1] - endMouseP[1]];
    var positionOffset = this.getPosition(localOffset);
    var componentMovePoint;
    for (i = 0; i < selectedObjects.objects.length; i += 1)
    {
        var selectedObj = selectedObjects.objects[i].object;
        var prevPosition = selectedObj.getPosition();
        componentMovePoint = [positionOffset[0] + prevPosition[0],
                              positionOffset[1] + prevPosition[1]];
        selectedObj.move(this, componentMovePoint, selectedObj.rotation);
    }

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
            Component.removeHitbox(this, selectedComponents[i].object);
        }
        selectedObjects.clear();
    }

    this.state = Breadboard.state.MOVE;
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
    var gameSpaceMouseDownP = this.gameSpaceMouseDownP;
    var selectedObj;
    var canDrag = fromTray || (this.state === Breadboard.state.MOVE || this.state === Breadboard.state.DRAG);

    if (this.shouldSwitch)
    {
        if (draggingPoint[0] != gameSpaceMouseDownP[0] ||
            draggingPoint[1] != gameSpaceMouseDownP[1])
        {
            if (canDrag)
            {
                this.state = Breadboard.state.DRAG;
                var mouseDownComponent = this.mouseDownComponent;

                if (fromTray)
                {
                    selectedObjects.clear();
                    selectedObj = selectedObjects.addObject(mouseDownComponent.clone(this));
                    selectedObj.grabbedPosition = mouseDownComponent.getPosition();
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
        else
        {
            return;
        }
    }

    if (this.shouldSwitch || !canDrag)
    {
        this.shouldSwitch = false;
        this.mouseDownComponent = null;
        return;
    }

    if (fromTray && this.mouseOverGameStage)
    {
        gameStage = this.gameStage;
        draggingPoint = this.draggingPoint = gameStage.toView(p);
        fromTray = this.draggingFromTray = false;
    }

    var localOffset = [draggingPoint[0] - gameSpaceMouseDownP[0],
                       draggingPoint[1] - gameSpaceMouseDownP[1]];
    var positionOffset = this.getPosition(localOffset);
    selectedObjects.setOffset(positionOffset, localOffset);
    selectedObjects.setGameStage(fromTray);
    selectedObjects.isTray = fromTray;
    selectedObjects.render = true;
};

Breadboard.prototype.rotateComponents = function rotateComponents()
{
    var fromTray = this.draggingFromTray;
    var gameStage = fromTray ? this.tray.gameStage : this.gameStage;

    var draggingPoint = this.draggingPoint;
    var gameSpaceMouseDownP = this.gameSpaceMouseDownP;

    var selectedObjects = this.selectedObjects;

    var offsetX = draggingPoint[0] - gameSpaceMouseDownP[0];
    var offsetY = draggingPoint[1] - gameSpaceMouseDownP[1];

    var selectedComponents = selectedObjects.components;
    var selectedObj;
    var i;
    for (i = 0; i < selectedComponents.length; i += 1)
    {
        selectedObj = selectedComponents[i];
        var component = selectedObj.object;
        var newRotation = Rotate90(component.rotation);

        localOffset = [selectedObj.grabbedPosition[0] - gameSpaceMouseDownP[0],
                       selectedObj.grabbedPosition[1] - gameSpaceMouseDownP[1]];
        selectedObj.grabbedPosition = [Math.round(gameSpaceMouseDownP[0] + localOffset[1] + offsetX),
                                       Math.round(gameSpaceMouseDownP[1] - localOffset[0] + offsetY)];

        component.move(this, component.p0, newRotation);
    }

    var selectedWires = selectedObjects.wires;
    for (i = 0; i < selectedWires.length; i += 1)
    {
        selectedObj = selectedWires[i];

        localOffset = [selectedObj.grabbedPosition[0] - gameSpaceMouseDownP[0],
                       selectedObj.grabbedPosition[1] - gameSpaceMouseDownP[1]];
        selectedObj.grabbedPosition = [Math.round(gameSpaceMouseDownP[0] + localOffset[1] + offsetX),
                                       Math.round(gameSpaceMouseDownP[1] - localOffset[0] + offsetY)];

        var wire = selectedObj.object;
        wire.rotate(this);
    }

    var ox = gameSpaceMouseDownP[0] - gameSpaceMouseDownP[1] + offsetX;
    var oy = gameSpaceMouseDownP[1] + gameSpaceMouseDownP[0] + offsetY;
    gameSpaceMouseDownP[0] = draggingPoint[0] - (ox - Math.round(ox));
    gameSpaceMouseDownP[1] = draggingPoint[1] - (oy - Math.round(oy));

    selectedObjects.setOffset([0, 0], [0, 0]);
    selectedObjects.render = true;
    for (i = 0; i < selectedObjects.objects.length; i += 1)
    {
        selectedObj = selectedObjects.objects[i];
        selectedObj.object.move(this, selectedObj.grabbedPosition, selectedObj.object.rotation);
    }
    selectedObjects.connectionMapDirty = true;
    selectedObjects.draggingGeometryDirty = true;
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

    this.gameStage.addHitbox(component.hitbox);
    this.geometryDirty = true;
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

    Component.removeHitbox(this, component);
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
        this.scrollGrab = this.gameStage.toView(p);
        return;
    }

    this.removeFocus();

    var component = this.getComponentFromMouse(p);
    if (component)
    {
        if ((this.state !== Breadboard.state.DRAG) && this.onComponentMouseDown(component, p, button))
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
            this.shouldSwitch = false;
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
    this.tray.hoverButton(-1);

    this.mouseP = p;
    this.mouseOverGameStage = gameSpace;

    var gameSpaceMouse = this.gameSpaceMouse = this.gameStage.toView(p);

    // var debugP = this.getPosition(gameSpaceMouse);
    // var msg = debugP[0] + ", " + debugP[1] + "</br>";
    // var index = this.getIndex(debugP[0], debugP[1]);
    // var connection = this.findConnection(index);
    // if (connection)
    // {
    //     var j;
    //     for (j = 0; j < connection.wires.length; j += 1)
    //     {
    //         var textureData = this.renderer.textureData;
    //         var textureIndex = this.componentRenderer.getWireTextureIndex(this, index, debugP, false);
    //         msg += "index " + textureIndex + " value " + textureData[textureIndex];
    //     }
    // }
    // document.getElementById("debugText").innerHTML = msg;

    if (this.isScrolling)
    {
        var delta = [this.scrollGrab[0] - gameSpaceMouse[0], this.scrollGrab[1] - gameSpaceMouse[1]];
        var view = this.gameStage.view;
        view[0] += delta[0];
        view[1] += delta[1];
        this.gameStage.update();
        gameSpaceMouse = this.gameSpaceMouse = this.gameStage.toView(p);
        this.scrollGrab = [gameSpaceMouse[0], gameSpaceMouse[1]];
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
    this.gameStage.zoomDelta(deltaY * 120);
};

Breadboard.prototype.onKeyUp = function onKeyUp(key, keyCode)
{
};

Breadboard.prototype.onKeyDown = function onKeyDown(key, keyCode)
{
    if (keyCode === 19/*PAUSE BREAK*/)
    {
        this.runSimulation = !this.runSimulation;
    }
    if (keyCode === 39/*RIGHT*/ || keyCode === 32/*SPACE*/)
    {
        this.stepSimulation = true;
    }

    if (this.onKeyDownFn)
    {
        this.onKeyDownFn(this, key, keyCode);
    }
};

Breadboard.prototype.takeFocus = function takeFocus(component, fn)
{
    if (this.focusComponent && this.focusComponent.removeFocus)
    {
        this.focusComponent.removeFocus();
    }
    this.focusComponent = component;
    this.onKeyDownFn = fn;
    this.geometryDirty = true;
};

Breadboard.prototype.removeFocus = function removeFocus(fn)
{
    this.focusComponent = null;
    this.onKeyDownFn = null;

    this.geometryDirty = true;
};
