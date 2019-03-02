
function BusKey()
{
    this.value = 0;
}

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
                if ((x == bus.x0 && y == bus.y0) ||
                    (x == bus.x1 && y == bus.y1))
                {
                    if (otherBuses.length)
                    {
                        edges.push([x, y]);
                    }
                }
                else
                {
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
                }
            });

        }
    }
}

Bus.updateColors = function updateColors(breadboard, buses, virtual)
{
    if (!virtual)
    {
        console.log("wregf");
    }

    var newColor = breadboard.tray.getBusColorIndex();
    var bestCount = 0;

    var i;
    for (i = 0; i < buses.length; i += 1)
    {
        var bus1 = buses[i];
        if (bus1 === null)
        {
            continue;
        }

        bus1.iterate(function (x, y, i)
        {
            var id = breadboard.getIndex(x, y);
            var connection = breadboard.findConnection(id);
            if (!connection)
            {
                return;
            }
            var j;
            for (j = 0; j < connection.buses.length; j += 1)
            {
                var bus2 = connection.buses[j];
                // only ends of buses connect
                if (bus1 != bus2 &&
                    (bus1.id0 === id || bus1.id1 === id ||
                     bus2.id0 === id || bus2.id1 === id))
                {
                    var count = 0;
                    bus2.iterate(function (breadboard, p, id)
                    {
                        count += 1;
                    });
                    if (count > bestCount)
                    {
                        bestCount = count;
                        newColor = bus2.colorIndex;
                    }
                }
            }
        });
    }

    var bus;
    for (i = 0; i < buses.length; i += 1)
    {
        bus = buses[i];
        if (bus === null)
        {
            continue;
        }
        if (virtual)
        {
            bus.colorIndex = newColor;
        }
        else
        {
            bus.setColorIndex(breadboard, newColor);
        }
    }

    if (!virtual)
    {
        breadboard.tray.setBusColorIndex(newColor);
    }
};

Bus.iterate = function iterate(breadboard, p, fn)
{
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

        fn(breadboard, p, index);

        var connection = breadboard.getConnection(index);

        var buses = connection.buses;
        for (i = 0; i < buses.length; i += 1)
        {
            var bus = buses[i];
            bus.iterate(function (x, y)
            {
                var index = breadboard.getIndex(x, y);
                var connection = breadboard.getConnection(index);

                var otherBuses = connection.buses;
                var j;
                if ((x == bus.x0 && y == bus.y0) ||
                    (x == bus.x1 && y == bus.y1))
                {
                    if (otherBuses.length)
                    {
                        edges.push([x, y]);
                    }
                }
                else
                {
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
                }
            });

        }
    }
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
