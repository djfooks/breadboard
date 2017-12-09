
function SelectedObject(component, grabOffset)
{
    this.component = component;
    this.grabOffset = grabOffset;
}

SelectedObject.areAllValid = function areAllValid(breadboard, selectedList, draggingPoint)
{
    var i;
    for (i = 0; i < selectedList.length; i += 1)
    {
        var selectedObj = selectedList[i];
        var component = selectedObj.component;
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
