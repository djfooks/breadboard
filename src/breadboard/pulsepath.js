
function PulsePath(pathPower, inputId, sourceId)
{
    this.inputId = inputId;
    this.sourceId = sourceId;
    this.pathPower = pathPower;
    this.values = new Uint8Array(pathPower);
    this.parent = null;
    this.wireId = -1;

    this.init();
}

PulsePath.prototype.init = function init()
{
    var pathPower = this.pathPower;
    var stepToEdges = this.stepToEdges = new Array(pathPower);
    var stepToEdgesDir = this.stepToEdgesDir = new Array(pathPower);
    var i;
    for (i = 0; i < pathPower; i += 1)
    {
        this.values[i] = 0;
        stepToEdges[i] = [];
        stepToEdgesDir[i] = [];
    }
    this.children = [];
    this.nextStepChildren = [];
    this.idToChild = {};
    this.idToStep = {};
    this.idToDirectionsVisited = {};

    this.onPulses = [];
    this.offPulses = [];

    // set all direction bits to true for the inputId
    this.idToDirectionsVisited[this.inputId] = 15;

    this.idToStep[this.inputId] = 0;
    this.stepToEdges[0].push(this.inputId);
    this.stepToEdgesDir[0].push(-1);
}

PulsePath.prototype.reset = function reset(breadboard)
{
    this.init();

    var connection = breadboard.connections[this.inputId];
    connection.addPulsePathStep(0, this, 0);
}

PulsePath.prototype.hasVisited = function hasVisited(dir, id)
{
    var directionsVisited = this.idToDirectionsVisited[id];
    if (directionsVisited !== undefined)
    {
        if (directionsVisited & (1 << (dir % 4)))
        {
            return true;
        }
    }
    if (this.parent)
    {
        return this.parent.hasVisited(dir, id);
    }
    return false;
};

PulsePath.nextId = 1;
PulsePath.prototype.rebuildPaths = function rebuildPaths(breadboard)
{
    PulsePath.nextId = 1;

    this.reset(breadboard);

    this.addConnection(breadboard.connectionIdPulseMap, this.inputId);

    var i;
    for (i = 1; i < this.pathPower; i += 1)
    {
        if (!this.recursiveStepPath(breadboard, i))
        {
            return;
        }
    }
};

PulsePath.prototype.addConnection = function addConnection(connectionIdPulseMap, connectionId)
{
    if (connectionIdPulseMap.hasOwnProperty(connectionId))
    {
        connectionIdPulseMap[connectionId].push(this);
    }
    else
    {
        connectionIdPulseMap[connectionId] = [this];
    }
}

PulsePath.maxWireId = 0;
PulsePath.prototype.recursiveBuildWireIds = function recursiveBuildWireIds(breadboard)
{
    var overlappingPulses = [];
    var idToStep = this.idToStep;
    var id;
    var i;
    var connectionIdPulseMap = breadboard.connectionIdPulseMap;
    for (id in idToStep)
    {
        if (idToStep.hasOwnProperty(id))
        {
            var pulses = connectionIdPulseMap[id];
            if (pulses.length === 1)
            {
                continue;
            }
            for (i = 0; i < pulses.length; i += 1)
            {
                var pulse = pulses[i];
                if (pulse === this)
                {
                    continue;
                }
                var j;
                var alreadyOverlapping = false;
                for (j = 0; j < overlappingPulses.length; j += 1)
                {
                    if (overlappingPulses[j] == pulse)
                    {
                        alreadyOverlapping = true;
                        break;
                    }
                }
                if (!alreadyOverlapping)
                {
                    overlappingPulses.push(pulse);
                }
            }
        }
    }

    if (overlappingPulses.length > 255)
    {
        throw new Error("Too many paths through 1 wire! (" + overlappingPulses.length + ")");
    }

    var wireId = 0;
    while (true)
    {
        var wireIdUsed = false;
        for (i = 0; i < overlappingPulses.length; i += 1)
        {
            if (overlappingPulses[i].wireId === wireId)
            {
                wireId += 1;
                wireIdUsed = true;
            }
        }
        if (!wireIdUsed)
        {
            this.wireId = wireId;
            break;
        }
    }

    PulsePath.maxWireId = Math.max(PulsePath.maxWireId, wireId);

    var children = this.children;
    for (i = 0; i < children.length; i += 1)
    {
        children[i].recursiveBuildWireIds(breadboard);
    }
};

PulsePath.prototype.recursiveStepPath = function recursiveStepPath(breadboard, stepIndex)
{
    var updated = false;

    this.children = this.children.concat(this.nextStepChildren);
    this.nextStepChildren = [];

    var stepUpdated;
    stepUpdated = this.stepPath(breadboard, stepIndex);
    updated = updated || stepUpdated;

    var i;
    for (i = 0; i < this.children.length; i += 1)
    {
        var child = this.children[i];
        var power = this.pathPower - stepIndex;
        var childStepIndex = child.pathPower - power;
        stepUpdated = child.recursiveStepPath(breadboard, childStepIndex);
        updated = updated || stepUpdated;
    }
    return updated;
};

PulsePath.prototype.stepPath = function stepPath(breadboard, stepIndex)
{
    var pathPower = this.pathPower - stepIndex;
    if (pathPower == 0)
    {
        throw new Error();
    }

    var stepToEdges = this.stepToEdges;
    var edges = stepToEdges[stepIndex - 1];
    if (edges.length === 0)
    {
        return false;
    }
    var stepToEdgesDir = this.stepToEdgesDir;
    var edgesDir = stepToEdgesDir[stepIndex - 1];

    var idToStep = this.idToStep;
    var idToDirectionsVisited = this.idToDirectionsVisited;
    var idToChild = this.idToChild;
    var connections = breadboard.connections;
    var connectionIdPulseMap = breadboard.connectionIdPulseMap;

    var updated = false;

    var i;
    var j;
    var k;
    var that = this;
    function flowOut(id, directionIndex)
    {
        var delta = Connection.directionVector[directionIndex];
        var p = breadboard.getPositionFromIndex(id);
        var x = p[0] + delta[0];
        var y = p[1] + delta[1];
        var newId = breadboard.getIndex(x, y);
        if (!that.hasVisited(directionIndex, newId))
        {
            updated = true;
            stepToEdges[stepIndex].push(newId);
            stepToEdgesDir[stepIndex].push(directionIndex);
            idToStep[newId] = stepIndex;
            that.addConnection(connectionIdPulseMap, newId);
            var connection = connections[newId];
            if (connection.hasDot)
            {
                idToDirectionsVisited[newId] = 15;
            }
            else
            {
                idToDirectionsVisited[newId] |= (1 << (directionIndex % 4));
            }
            connection.addPulsePathStep(directionIndex, that, stepIndex);
            var component = connection.component;
            if (component)
            {
                var outputIds = component.getOutputs(newId);
                for (k = 0; k < outputIds.length; k += 1)
                {
                    var outputId = outputIds[k];
                    if (outputId !== -1 && !that.hasVisited(0, outputId))
                    {
                        var child = new PulsePath(pathPower, outputId, newId);
                        child.addConnection(connectionIdPulseMap, outputId);

                        var outputConnection = connections[outputId];
                        outputConnection.addPulsePathStep(15, child, 0);

                        child.parent = that;
                        that.nextStepChildren.push(child);
                        component.pulsePaths.push(child);
                        if (idToChild.hasOwnProperty(newId))
                        {
                            idToChild[newId].push(child);
                        }
                        else
                        {
                            idToChild[newId] = [child];
                        }

                        PulsePath.nextId += 1;
                    }
                }
            }
        }
    }

    for (i = 0; i < edges.length; i += 1)
    {
        var id = edges[i];
        console.log(id);
        var connection = connections[id];

        if (connection.hasDot)
        {
            var dirBit = 1;
            for (j = 0; j < 8; j += 1)
            {
                if ((connection.wireBits & dirBit) > 0)
                {
                    flowOut(id, j);
                }
                dirBit = dirBit << 1;
            }
        }
        else if (edgesDir[i] !== -1)
        {
            flowOut(id, edgesDir[i]);
        }
    }
    return updated;
}

PulsePath.prototype.updatePulsesType = function updatePulsesType(breadboard, pulses, value)
{
    var values = this.values;
    var pathPower = this.pathPower;
    var stepToEdges = this.stepToEdges;
    var i;
    var j;
    var k;
    for (i = 0; i < pulses.length;)
    {
        // move pulse 1 step down the wire setting the values
        var index = pulses[i];
        values[index] = value;
        var edges = stepToEdges[index];
        for (j = 0; j < edges.length; j += 1)
        {
            var id = edges[j];

            var children = this.idToChild[id];
            if (children)
            {
                var connection = breadboard.connections[id];
                var component = connection.component;
                for (k = 0; k < children.length; k += 1)
                {
                    var child = children[k];
                    if (component.isConnected(id, child.inputId))
                    {
                        child.createPulse(value);
                    }
                }
            }
        }

        index += 1;
        pulses[i] = index;
        if (index >= pathPower || edges.length === 0)
        {
            pulses[i] = pulses[pulses.length - 1];
            pulses.pop();
        }
        else
        {
            i += 1;
        }
    }
};

PulsePath.prototype.updatePulses = function updatePulses(breadboard)
{
    this.updatePulsesType(breadboard, this.onPulses, 1);
    this.updatePulsesType(breadboard, this.offPulses, 0);

    var i;
    for (i = 0; i < this.children.length; i += 1)
    {
        this.children[i].updatePulses(breadboard);
    }
};

PulsePath.prototype.createPulse = function createPulse(value)
{
    if (this.values[0] == value)
    {
        return;
    }
    if (value)
    {
        this.onPulses.push(0);
    }
    else
    {
        this.offPulses.push(0);
    }
};
