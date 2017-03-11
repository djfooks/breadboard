
function PulsePath(id, pathPower)
{
    this.id = id;
    this.pathPower = pathPower;
    this.values = new Uint8Array(pathPower);

    this.powerToEdges = new Array(pathPower);

    this.onPulses = [];
    this.offPulses = [];
}

PulsePath.prototype.rebuildPaths = function rebuildPaths(breadboard, inputId0)
{
    var connections = breadboard.connections;
    var edges = [];
    var switches = [];
    var visited = {};
    var path = this.path = {};

    var pathPower = this.pathPower;
    var powerToEdges = this.powerToEdges = new Array(pathPower);
    var i;
    for (i = 0; i < pathPower; i += 1)
    {
        this.values[i] = 0;
        this.powerToEdges[i] = [];
    }
    this.onPulses = [];
    this.offPulses = [];

    visited[inputId0] = true;
    edges.push(inputId0);
    powerToEdges[0].push(inputId0);

    var index = 1;
    pathPower -= 1;

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
                    if (!visited[newId])
                    {
                        visited[newId] = true;
                        powerToEdges[index].push(newId);
                        //var switches = connections[newId].components.switches;
                        breadboard.pulseReset(newId);
                    }
                }
                dirBit = dirBit << 1;
            }
        }
        edges = powerToEdges[index];
        index += 1;
        pathPower -= 1;
    }
};

PulsePath.prototype.updatePulsesType = function updatePulsesType(breadboard, pulses, value)
{
    var values = this.values;
    var pathPower = this.pathPower;
    var powerToEdges = this.powerToEdges;
    var i;
    var j;
    for (i = 0; i < pulses.length;)
    {
        // move pulse 1 step down the wire setting the values
        var index = pulses[i];
        values[index] = value;
        var edges = powerToEdges[index]
        for (j = 0; j < edges.length; j += 1)
        {
            breadboard.pulseValue(edges[j], value);
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
    this.updatePulsesType(breadboard, this.onPulses, 1);
    this.updatePulsesType(breadboard, this.offPulses, 0);
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
