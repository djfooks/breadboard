
function SelectedObject()
{
    this.object = null;
    this.grabbedPosition = [0, 0];
}

SelectedObject.areAllValid = function areAllValid(breadboard, selectedComponents, localOffset)
{
    var i;
    for (i = 0; i < selectedComponents.length; i += 1)
    {
        var selectedObj = selectedComponents[i];
        var component = selectedObj.object;
        var q;
        if (localOffset)
        {
            var p = [localOffset[0] + selectedObj.grabbedPosition[0],
                     localOffset[1] + selectedObj.grabbedPosition[1]];
            q = breadboard.getPosition(p);
        }
        else
        {
            q = component.p0;
        }

        if (!breadboard.validPosition(q) ||
            !component.isValidPosition(breadboard, q, component.rotation))
        {
            return false;
        }
    }
    return true;
};

function SelectedObjectSet(breadboard)
{
    this.breadboard = breadboard;

    this.canvas = document.getElementById("canvas");
    this.renderer = breadboard.stage.renderer;
    this.scene = new THREE.Scene();
    this.bgScene = new THREE.Scene();

    this.wireRenderer = new WireRenderer(breadboard.gameRenderer);
    this.busRenderer = new BusRenderer(breadboard.gameRenderer);
    this.componentBoxRenderer = new ComponentBoxRenderer(breadboard.gameRenderer);
    this.componentRenderer = new ComponentRenderer(breadboard.gameRenderer);
    this.textRenderer = new TextRenderer(breadboard.gameRenderer);

    this.feather = { value : 0.0 };

    this.camera = new THREE.OrthographicCamera(1, 1, 1, 1, 0, 100);
    this.camera.position.z = 100;
    this.bgCamera = new THREE.OrthographicCamera(1, 1, 1, 1, 0, 100);
    this.bgCamera.position.z = 100;

    this.setGameStage(true);

    this.clear();
}

SelectedObjectSet.prototype.clear = function clear(object)
{
    this.offset = [ 0, 0 ];

    this.objects = [];
    this.components = [];
    this.wires = [];

    this.componentObjects = [];
    this.wireObjects = [];
    this.busObjects = [];

    this._connections = {};
    this.connectionMapOffset = [0, 0];
    this.connectionMapDirty = false;

    this.componentsDirty = true;

    this.render = false;
};

SelectedObjectSet.prototype.setGameStage = function setGameStage(isTray)
{
    this.gameStage = isTray ? this.breadboard.tray.gameStage : this.breadboard.gameStage;
};

SelectedObjectSet.prototype.postLoad = function postLoad()
{
    this.componentBoxRenderer.addMeshes(this.scene, this.feather);
    this.componentRenderer.addMeshes(this.scene, this.feather);
    this.wireRenderer.addMeshes(this.scene, this.feather);
    this.busRenderer.addMeshes(this.scene, this.feather);
    this.textRenderer.addMeshes(this.scene, this.feather);
};

SelectedObjectSet.colorPalette = {
    base: {
        box: [0.0, 0.0, 0.0]
    },
    bg: {
        box: [0.7, 0.7, 0.7]
    }
};

SelectedObjectSet.prototype.setColors = function setColors(colorPalette)
{
    this.componentBoxRenderer.color.value.x = colorPalette.box[0];
    this.componentBoxRenderer.color.value.y = colorPalette.box[1];
    this.componentBoxRenderer.color.value.z = colorPalette.box[2];
};

SelectedObjectSet.prototype.draw = function draw()
{
    if (!this.render)
    {
        return;
    }
    this.updateConnectionMap();

    var that = this;
    var breadboard = this.breadboard;
    function wireHasDotFn(id, x, y)
    {
        return that.hasDot(x, y);
    }
    // function bgWireHasDotFn(id, x, y)
    // {
    //     var connection = breadboard.findConnection(id);
    //     return (connection && connection.hasDot) || that.hasDot(x, y);
    // }

    if (this.componentsDirty)
    {
        this.wireRenderer.updateGeometry(this.wireObjects, breadboard, true, wireHasDotFn);
        this.busRenderer.updateGeometry(this.busObjects, breadboard, true, wireHasDotFn);
        this.componentBoxRenderer.updateGeometry(this.componentObjects);
        this.componentRenderer.updateGeometry(this.componentObjects, breadboard, true);

        // this.bgWireRenderer.updateGeometry(this.wireObjects, breadboard, true, bgWireHasDotFn);
        // this.bgBusRenderer.updateGeometry(this.busObjects, breadboard, true, bgWireHasDotFn);

        this.componentsDirty = false;
    }

    this.feather.value = this.gameStage.feather.value;

    var gameStageCamera = this.gameStage.camera;
    var offset = this.offset;

    // BACKGROUND
    var bgCamera = this.bgCamera;
    var bgOffset = [Math.round(offset[0]), Math.round(offset[1])];
    bgCamera.left   = gameStageCamera.left   - bgOffset[0];
    bgCamera.right  = gameStageCamera.right  - bgOffset[0];
    bgCamera.top    = gameStageCamera.top    - bgOffset[1];
    bgCamera.bottom = gameStageCamera.bottom - bgOffset[1];
    bgCamera.updateProjectionMatrix();

    this.setColors(SelectedObjectSet.colorPalette.bg);

    this.renderer.setScissor(10, 10, this.canvas.width, this.canvas.height);
    this.renderer.setScissorTest(true);
    this.renderer.render(this.scene, this.bgCamera);

    // FOREGROUND
    var camera = this.camera;
    camera.left   = gameStageCamera.left   - offset[0];
    camera.right  = gameStageCamera.right  - offset[0];
    camera.top    = gameStageCamera.top    - offset[1];
    camera.bottom = gameStageCamera.bottom - offset[1];
    camera.updateProjectionMatrix();

    this.setColors(SelectedObjectSet.colorPalette.base);

    this.renderer.setScissor(10, 10, this.canvas.width, this.canvas.height);
    this.renderer.setScissorTest(true);
    this.renderer.render(this.scene, this.camera);
};

SelectedObjectSet.prototype.setOffset = function setOffset(p, localOffset)
{
    this.connectionMapOffset[0] = p[0];
    this.connectionMapOffset[1] = p[1];

    this.offset[0] = localOffset[0];
    this.offset[1] = localOffset[1];
};

SelectedObjectSet.prototype.hasDot = function hasDot(x, y)
{
    var id = this.breadboard.getIndex(x, y);
    var connection = this._connections[id];
    if (!connection)
    {
        throw new Error("How did this happen?");
        return false;
    }
    return connection.hasDot;
};

SelectedObjectSet.prototype.emplaceConnection = function emplaceConnection(id)
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

SelectedObjectSet.prototype.updateConnectionMap = function updateConnectionMap()
{
    if (!this.connectionMapDirty)
    {
        return;
    }
    this.connectionMapDirty = false;
    this._connections = {};
    this.connectionMapOffset[0] = 0;
    this.connectionMapOffset[1] = 0;

    var that = this;
    var breadboard = this.breadboard;
    var components = this.components;
    var i;
    var j;
    function itrWires(wireObjects)
    {
        for (i = 0; i < wireObjects.length; i += 1)
        {
            var wire = wireObjects[i];
            wire.iterate(function (x, y)
            {
                var id = breadboard.getIndex(x, y);
                that.emplaceConnection(id).addWireComponent(id, wire);
            });
        }
    }
    itrWires(this.wireObjects);
    itrWires(this.busObjects);

    for (i = 0; i < components.length; i += 1)
    {
        var component = components[i].object;
        var connectionIds = component.getConnections(breadboard);
        for (j = 0; j < connectionIds.length; j += 1)
        {
            var id = connectionIds[j];
            this.emplaceConnection(id).setComponent(id, component);
        }
    }
};

SelectedObjectSet.prototype.addObject = function addObject(object)
{
    if (!object)
    {
        throw new Error("Adding invalid object");
    }

    this.connectionMapDirty = true;
    if (this.indexOf(object) != -1)
    {
        return null;
    }
    var selectedObject = new SelectedObject();
    selectedObject.object = object;
    this.objects.push(selectedObject);
    if (object.isWire())
    {
        this.wires.push(selectedObject);
        if (object.type === ComponentTypes.WIRE)
        {
            this.wireObjects.push(object);
        }
        else //if (object.type === ComponentTypes.BUS)
        {
            this.busObjects.push(object);
        }
    }
    else
    {
        this.components.push(selectedObject);
        this.componentObjects.push(object);
        this.componentsDirty = true;
    }
    return selectedObject;
};

SelectedObjectSet.prototype.removeObject = function removeObject(object)
{
    this.connectionMapDirty = true;
    var removeFromList = function (list, object)
    {
        var i;
        for (i = 0; i < list.length; i += 1)
        {
            if (list[i].object === object)
            {
                list.splice(i, 1);
                return true;
            }
        }
        return false;
    };

    if (object.isWire())
    {
        if (!removeFromList(this.wires, object))
        {
            return false;
        }
        var index;
        if (object.type === ComponentTypes.WIRE)
        {
            index = this.wireObjects.indexOf(object);
            this.wireObjects.splice(index, 1);
        }
        else //if (object.type === ComponentTypes.BUS)
        {
            index = this.busObjects.indexOf(object);
            this.busObjects.splice(index, 1);
        }
    }
    else
    {
        this.componentsDirty = true;
        if (!removeFromList(this.components, object))
        {
            return false;
        }
        index = this.componentObjects.indexOf(object);
        this.componentObjects.splice(index, 1);
    }
    return removeFromList(this.objects, object);
};

SelectedObjectSet.prototype.indexOf = function indexOf(object, list)
{
    var i;
    list = list || this.objects;
    for (i = 0; i < list.length; i += 1)
    {
        if (list[i].object === object)
        {
            return i;
        }
    }
    return -1;
};
