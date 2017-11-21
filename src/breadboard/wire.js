
function Wire(x0, y0, x1, y1, id0, id1, type)
{
    this.type = type;
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;

    this.id0 = id0;
    this.id1 = id1;

    var dx = x1 - x0;
    dx = dx < 0 ? -1 : (dx > 0 ? 1 : 0);
    this.dx = dx;
    var dy = y1 - y0;
    dy = dy < 0 ? -1 : (dy > 0 ? 1 : 0);
    this.dy = dy;

    this.directionId = Connection.getDirectionId(dx, dy)
    this.bit0 = Connection.getDirectionFlag( dx,  dy);
    this.bit1 = Connection.getDirectionFlag(-dx, -dy);
}

Wire.prototype.iterate = function iterate(fn)
{
    var x = this.x0;
    var y = this.y0;
    var x1 = this.x1;
    var y1 = this.y1;
    var dx = this.dx;
    var dy = this.dy;
    while (x !== x1 || y !== y1)
    {
        fn(x, y);
        x += dx;
        y += dy;
    }
    fn(x, y);
};

Wire.prototype.toJson = function toJson()
{
    return [this.x0, this.y0, this.x1, this.y1];
};

Wire.getColor = function getColor(count)
{
    if (count > 1)
    {
        return "#FF0000";
    }
    else if (count > 0)
    {
        return "#FF8888";
    }
    else
    {
        return "#FFFFFF";
    }
};

function BusKey()
{
    this.value = 0;
};

function Bus(breadboard, p)
{
    this.keys = {};
    var edges = [p];
    var visited = {};
    var i;

    while (edges.length)
    {
        p = edges.pop();
        var index = breadboard.getIndex(p[0], p[1]);
        if (visited[index])
        {
            continue;
        }
        visited[index] = true;

        var connection = breadboard.getConnection(index);
        var component = connection.component;

        if (component)
        {
            var connectionBus = component.getBusPosition();
            if (connectionBus)
            {
                if (p[0] === connectionBus[0] &&
                    p[1] === connectionBus[1])
                {
                    component.bus = this;
                    if (component.type === ComponentTypes.BUS_OUTPUT)
                    {
                        var channel = this.keys[component.busKey];
                        if (!channel)
                        {
                            this.keys[component.busKey] = new BusKey();
                        }
                    }
                }
            }
        }

        var buses = connection.buses;
        for (i = 0; i < buses.length; i += 1)
        {
            var bus = buses[i];
            bus.iterate(function (x, y)
            {
                var index = breadboard.getIndex(x, y);
                var connection = breadboard.getConnection(index);
                if (connection.component)
                {
                    edges.push([x, y]);
                    return;
                }

                var otherBuses = connection.buses;
                var j;
                for (j = 0; j < otherBuses.length; j += 1)
                {
                    var otherBus = otherBuses[j];
                    if (otherBus === bus)
                    {
                        continue;
                    }
                    if (otherBus.x0 === x &&
                        otherBus.y0 === y)
                    {
                        edges.push([x, y]);
                    }
                    else if (otherBus.x1 === x &&
                             otherBus.y1 === y)
                    {
                        edges.push([x, y]);
                    }
                }
            });

        }
    }
}

Bus.prototype.iterate = function iterate(fn)
{
    var x = this.x0;
    var y = this.y0;
    var x1 = this.x1;
    var y1 = this.y1;
    var dx = this.dx;
    var dy = this.dy;
    while (x !== x1 || y !== y1)
    {
        fn(x, y);
        x += dx;
        y += dy;
    }
    fn(x, y);
};

Bus.buildPaths = function buildPaths(breadboard)
{
    var componentsList = breadboard.componentsList;
    var i;
    for (i = 0; i < componentsList.length; i += 1)
    {
        var component = componentsList[i];
        var busP = component.getBusPosition();
        if (busP && !component.bus)
        {
            new Bus(breadboard, busP);
        }
    }
};

Bus.prototype.addValue = function addValue(key, value)
{
    var channel = this.keys[key];
    if (!channel)
    {
        return;
    }
    channel.value += value;
    if (channel.value < 0)
    {
        throw new Error("Negative channel value!");
    }
};

Bus.prototype.isOn = function isOn(key)
{
    var channel = this.keys[key];
    if (!channel)
    {
        return false;
    }
    return channel.value > 0;
};

