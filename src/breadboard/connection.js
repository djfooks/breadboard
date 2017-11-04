
function Connection()
{
    this.wireBits = 0;
    this.wires = [];
    this.component = null;
    var pulsePaths = this.pulsePaths = new Array(4);
    var pulsePathSteps = this.pulsePathSteps = new Array(4);
    this.reset();
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

Connection.getDirectionId = function getDirectionId(dx, dy)
{
    var dv = Connection.directionVector;
    var i;
    for (i = 0; i < 8; i += 1)
    {
        if (dx == dv[i][0] && dy == dv[i][1])
        {
            return i;
        }
    }
    return -1;
};

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

Connection.prototype.empty = function empty()
{
    return this.wires.length === 0 && !this.component;
};

Connection.prototype.addPulsePathStep = function addPulsePathStep(dir, pulsePath, stepId)
{
    dir = dir % 4;
    this.pulsePaths[dir].push(pulsePath);
    this.pulsePathSteps[dir].push(stepId);
};

Connection.prototype._getDirectionValueInternal = function _getDirectionValueInternal(dir)
{
    var i;
    var count = 0;
    var pulsePaths = this.pulsePaths[dir];
    for (i = 0; i < pulsePaths.length; i += 1)
    {
        count += pulsePaths[i].values[this.pulsePathSteps[dir][i]];
    }
    return count;
}

Connection.prototype.getDirectionValue = function getDirectionValue(dir)
{
    if (this.hasDot)
    {
        return this.getValue();
    }
    dir = dir % 4;
    return this._getDirectionValueInternal(dir);
};

Connection.prototype.getValue = function getValue()
{
    var i;
    var count = 0;
    for (i = 0; i < 4; i += 1)
    {
        count += this._getDirectionValueInternal(i);
    }
    return count;
}

Connection.prototype.isOn = function isOn()
{
    var i;
    var count = 0;
    for (i = 0; i < 4; i += 1)
    {
        if (this._getDirectionValueInternal(i))
        {
            return true;
        }
    }
    return false;
};

Connection.prototype.reset = function reset()
{
    var i;
    for (i = 0; i < 4; i += 1)
    {
        this.pulsePaths[i] = [];
        this.pulsePathSteps[i] = [];
    }
};

Connection.prototype.addWire = function addWire(id, direction)
{
    this.wireBits |= direction;
    this.updateHasDot(id);
};

Connection.prototype.removeWire = function removeWire(id, direction)
{
    this.wireBits &= ~direction;
    this.updateHasDot(id);
};

Connection.prototype.addWireComponent = function addWireComponent(id, component)
{
    this.wires.push(component);
    this.updateHasDot(id);
};

Connection.prototype.removeWireComponent = function removeWireComponent(id, component)
{
    var index = this.wires.indexOf(component);
    this.wires.splice(index, 1);
    this.updateHasDot(id);
};

Connection.prototype.setComponent = function setComponent(id, component)
{
    this.component = component;
    this.updateHasDot(id);
};

Connection.prototype.updateHasDot = function updateHasDot(id)
{
    if (this.component)
    {
        this.hasDot = true;
        return;
    }
    var i;
    var wires = this.wires;
    for (i = 0; i < wires.length; i += 1)
    {
        if (id === wires[i].id0 || id === wires[i].id1)
        {
            this.hasDot = true;
            return;
        }
    }
    this.hasDot = false;
    return;
};
