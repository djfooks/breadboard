
function Connection()
{
    this.wires = 0;
    this.components = {
        wires: [],
        switch: null
    };
    this.values = new Uint32Array(8);
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

Connection.prototype.isOn = function isOn()
{
    var i;
    for (i = 0; i < this.values.length; i += 1)
    {
        if (this.values[i] > 0)
        {
            return true;
        }
    }
    return false;
};

Connection.prototype.setPulseValue = function setPulseValue(pulseId, value)
{
    var i = pulseId >> 5;
    var bit = pulseId & 31;
    if (value)
    {
        this.values[i] |= 1 << bit;
    }
    else
    {
        this.values[i] &= ~(1 << bit);
    }
};

Connection.prototype.reset = function reset()
{
    var i;
    for (i = 0; i < this.values.length; i += 1)
    {
        this.values[i] = 0;
    }
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
