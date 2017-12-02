
function DraggingComponent(component, grabPoint)
{
    this.component = component;
    this.grabPoint = grabPoint;
}

DraggingComponent.areAllValid = function areAllValid(breadboard, draggingComponents, draggingPoint)
{
    var i;
    for (i = 0; i < draggingComponents.length; i += 1)
    {
        var draggingComponent = draggingComponents[i];
        var component = draggingComponent.component;
        var q;
        if (draggingPoint)
        {
            var p = [draggingPoint[0] + draggingComponent.grabPoint[0],
                     draggingPoint[1] + draggingComponent.grabPoint[1]];
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
