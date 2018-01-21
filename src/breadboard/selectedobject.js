
function SelectedObject()
{
    this.object = null;
    this.grabOffset = [0, 0];
}

SelectedObject.areAllValid = function areAllValid(breadboard, selectedComponents, draggingPoint)
{
    var i;
    for (i = 0; i < selectedComponents.length; i += 1)
    {
        var selectedObj = selectedComponents[i];
        var component = selectedObj.object;
        var q;
        if (draggingPoint)
        {
            var p = [draggingPoint[0] + selectedObj.grabOffset[0],
                     draggingPoint[1] + selectedObj.grabOffset[1]];
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
    this.clear();
}

SelectedObjectSet.prototype.clear = function clear(object)
{
    this.objects = [];
    this.components = [];
    this.wires = [];
    this.wireObjects = [];

    this._connections = {};
    this.connectionMapOffset = [0, 0];
    this.connectionMapDirty = false;
};

SelectedObjectSet.prototype.setOffset = function setOffset(p)
{
    this.connectionMapOffset[0] = p[0];
    this.connectionMapOffset[1] = p[1];
};

SelectedObjectSet.prototype.hasDot = function hasDot(x, y)
{
    var id = this.breadboard.getIndex(x - this.connectionMapOffset[0],
                                      y - this.connectionMapOffset[1]);
    var connection = this._connections[id];
    if (!connection)
    {
        //throw new Error("How did this happen?");
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
    var wireObjects = this.wireObjects;
    var components = this.components;
    var i;
    var j;
    for (i = 0; i < wireObjects.length; i += 1)
    {
        var wire = wireObjects[i];
        wire.iterate(function (x, y)
        {
            var id = breadboard.getIndex(x, y);
            that.emplaceConnection(id).addWireComponent(id, wire);
        });
    }

    for (i = 0; i < components.length; i += 1)
    {
        var component = components[i].object;
        var connectionIds = component.getConnections(this);
        for (j = 0; j < connectionIds.length; j += 1)
        {
            var id = connectionIds[j];
            this.emplaceConnection(id).setComponent(id, component);
        }
    }
};

SelectedObjectSet.prototype.addObject = function addObject(object)
{
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
        this.wireObjects.push(object);
    }
    else
    {
        this.components.push(selectedObject);
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
                list.splice(i, -1);
                return true;
            }
        }
        return false;
    };

    if (object.isWire())
    {
        removeFromList(this.wires, object);
        this.wireObjects.splice(this.wireObjects.indexOf(object), -1);
    }
    else
    {
        removeFromList(this.components, object);
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
