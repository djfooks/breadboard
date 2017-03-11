
function PulsePath(id, pathPower, inputId)
{
    this.id = id;
    this.inputId = inputId;
    this.pathPower = pathPower;
    this.values = new Uint8Array(pathPower);
    this.parent = null;

    this.reset();
}

PulsePath.prototype.reset = function reset()
{
    var pathPower = this.pathPower;
    var stepToEdges = this.stepToEdges = new Array(pathPower);
    var i;
    for (i = 0; i < pathPower; i += 1)
    {
        this.values[i] = 0;
        stepToEdges[i] = [];
    }
    this.onPulses = [];
    this.offPulses = [];
    this.children = [];
    this.idToChild = {};
    this.idToStep = {};
}

PulsePath.prototype.hasVisited = function hasVisited(id)
{
    if (this.idToStep.hasOwnProperty(id))
    {
        return true;
    }
    if (this.parent)
    {
        return this.parent.hasVisited(id);
    }
    return false;
};

PulsePath.prototype.rebuildPaths = function rebuildPaths(breadboard)
{
    var connections = breadboard.connections;
    var edges;

    this.reset();

    var pathPower = this.pathPower;
    var stepToEdges = this.stepToEdges;
    var idToStep = this.idToStep;
    var i;

    idToStep[this.inputId] = 0;
    stepToEdges[0].push(this.inputId);
    edges = stepToEdges[0];

    var index = 1;
    pathPower -= 1;

    var nextId = this.id;
    nextId += 1;

    while (edges.length > 0 && pathPower > 0)
    {
        for (i = 0; i < edges.length; i += 1)
        {
            var id = edges[i];
            var connection = connections[id];
            var dirBit = 1;
            for (j = 0; j < 8; j += 1)
            {
                if ((connection.wires & dirBit) > 0)
                {
                    var delta = Connection.directionVector[j];
                    var p = breadboard.getPositionFromIndex(id);
                    var x = p[0] + delta[0];
                    var y = p[1] + delta[1];
                    var newId = breadboard.getIndex(x, y);
                    if (!this.hasVisited(newId))
                    {
                        stepToEdges[index].push(newId);
                        idToStep[newId] = index;
                        var switchComponent = connections[newId].components.switch;
                        if (switchComponent)
                        {
                            var outputId = switchComponent.getOutput(newId);
                            // don't allow the pulse to power itself!
                            if (outputId !== -1 && !this.hasVisited(outputId))
                            {
                                var child = new PulsePath(nextId, pathPower, outputId);
                                child.parent = this;
                                this.children.push(child);
                                this.idToChild[outputId] = child;
                                switchComponent.pulsePaths.push(child);
                                nextId += 1;

                            }
                        }
                        breadboard.pulseReset(newId);
                    }
                }
                dirBit = dirBit << 1;
            }
        }
        edges = stepToEdges[index];
        index += 1;
        pathPower -= 1;
    }

    if (nextId > 999)
    {
        throw new Error();
    }

    for (i = 0; i < this.children.length; i += 1)
    {
        this.children[i].rebuildPaths(breadboard);
    }
};

PulsePath.prototype.updatePulsesType = function updatePulsesType(breadboard, pulses, value)
{
    var values = this.values;
    var pathPower = this.pathPower;
    var stepToEdges = this.stepToEdges;
    var i;
    var j;
    for (i = 0; i < pulses.length;)
    {
        // move pulse 1 step down the wire setting the values
        var index = pulses[i];
        values[index] = value;
        var edges = stepToEdges[index];
        for (j = 0; j < edges.length; j += 1)
        {
            var id = edges[j];
            var connection = breadboard.connections[id]
            connection.setPulseValue(this.id, value);

            // don't flow backwards through switches
            if (index !== 0)
            {
                var switchComponent = connection.components.switch;
                if (switchComponent)
                {
                    var switchOutputId = switchComponent.getConnectedOutput(id);
                    if (switchOutputId !== -1 && this.idToChild[switchOutputId])
                    {
                        this.idToChild[switchOutputId].createPulse(value);
                    }
                }
            }
        }

        index += 1;
        pulses[i] = index;
        if (index >= pathPower)
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
    PulsePath.counter += 1;
    if (PulsePath.counter > 100)
    {
        throw new Error();
    }
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
