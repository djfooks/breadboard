
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
