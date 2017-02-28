
function Connection()
{
    this.updateCounter = 0;
    this.wires = 0;
    this.components = [];
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

Connection.prototype.getValue = function getValue(updateCounter)
{
    if (this.updateCounter === updateCounter)
    {
        return this.value;
    }
    return 0;
};

Connection.prototype.setValue = function setValue(updateCounter, value)
{
    this.updateCounter = updateCounter;
    this.value = value;
};

Connection.prototype.addWire = function addWire(direction)
{
    this.wires |= direction;
};

Connection.prototype.addComponent = function addComponent(component)
{
    this.components.push(component);
};
