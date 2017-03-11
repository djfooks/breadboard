
function Connection()
{
    this.wires = 0;
    this.components = {
        wires: [],
        switch: null
    };
    this.value = 0;
}

Connection.directionVector = [
    [ 0, -1],    // NORTH
    [ 1, -1],    // NORTH_EAST
    [ 1,  0],    // EAST
    [ 1,  1],    // SOUTH_EAST
    [ 0,  1],    // SOUTH
    [-1,  1],    // SOUTH_WEST
    [-1,  0],    // WEST
    [-1, -1]     // NORTH_WEST
];
Connection.getDirectionFlag = function getDirectionFlag(dx, dy)
{
    var dv = Connection.directionVector;
    var i;
    for (i = 0; i < 8; i += 1)
    {
        if (dx == dv[i][0] && dy == dv[i][1])
        {
            return (1 << i);
        }
    }
    return -1;
};

Connection.prototype.addWire = function addWire(direction)
{
    this.wires |= direction;
};

Connection.prototype.removeWire = function removeWire(direction)
{
    this.wires &= ~direction;
};

Connection.prototype.addWireComponent = function addWireComponent(component)
{
    this.components.wires.push(component);
};

Connection.prototype.removeWireComponent = function removeWireComponent(component)
{
    var index = this.components.wires.indexOf(component);
    this.components.wires.splice(index, 1);
};

Connection.prototype.hasDot = function hasDot(component)
{
    var i;
    var lastWire = -1;
    var numWires = 0;
    for (i = 0; i < 8; i += 1)
    {
        if (this.wires & (1 << i))
        {
            numWires += 1;
            if (lastWire !== -1)
            {
                if ((lastWire % 4) === (i % 4))
                {
                    // wire in and out are in the same direction
                    continue;
                }
                return true;
            }
            lastWire = i;
        }
    }
    return (numWires == 1);
};
