
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

function SelectedObjectSet()
{
    this.clear();
}

SelectedObjectSet.prototype.indexOf = function indexOf(object)
{
    this.objects = [];
    this.components = [];
    this.wires = [];
};

SelectedObjectSet.prototype.addObject = function addObject(object)
{
    var selectedObject = new SelectedObject();
    selectedObject.object = object;
    if (object.isWire())
    {
        this.wires.push(selectedObject);
    }
    else
    {
        this.components.push(selectedObject);
    }
    this.objects.push(selectedObject);
    return selectedObject;
};

SelectedObjectSet.prototype.removeObject = function removeObject(object)
{
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
    }
    else
    {
        removeFromList(this.components, object);
    }
    return removeFromList(this.objects, object);
};

SelectedObjectSet.prototype.indexOf = function indexOf(object)
{
    var i;
    var list = this.objects;
    for (i = 0; i < list.length; i += 1)
    {
        if (list[i].object === object)
        {
            return i;
        }
    }
    return -1;
};
