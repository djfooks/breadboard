
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

Wire.width = 0.2;
Wire.halfWidth = Wire.width * 0.5;

Wire.prototype.move = function move(breadboard, p/*, rotation*/)
{
    var ox = p[0] - this.x0;
    var oy = p[1] - this.y0;
    this.x0 += ox;
    this.y0 += oy;
    this.x1 += ox;
    this.y1 += oy;

    this.id0 = breadboard.getIndex(this.x0, this.y0);
    this.id1 = breadboard.getIndex(this.x1, this.y1);
};

Wire.prototype.isWire = function isWire()
{
    return true;
};

Wire.prototype.drawSelection = function drawSelection(ctx, color)
{
    ctx.lineWidth = 0.3;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(this.x0, this.y0);
    ctx.lineTo(this.x1, this.y1);
    ctx.stroke();
};

Wire.prototype.getPosition = function getPosition()
{
    return [this.x0, this.y0];
};

Wire.prototype.boxOverlap = function boxOverlap(x0, y0, x1, y1)
{
    var tmp;
    if (x0 > x1)
    {
        tmp = x0;
        x0 = x1;
        x1 = tmp;
    }
    if (y0 > y1)
    {
        tmp = y0;
        y0 = y1;
        y1 = tmp;
    }

    // if p0 end is in the box
    if (this.x0 > x0 && this.x0 < x1 &&
        this.y0 > y0 && this.y0 < y1)
    {
        return true;
    }
    // if p1 end is in the box
    if (this.x1 > x0 && this.x1 < x1 &&
        this.y1 > y0 && this.y1 < y1)
    {
        return true;
    }

    // hack so that small x0==x1 and y0==y1 box still selects the wire
    if (this.distance(x0, y0) == 0.0)
    {
        return true;
    }
    if (this.distance(x1, y1) == 0.0)
    {
        return true;
    }

    if (this.lineIntersect(x0, y0, x1, y0))
    {
        return true;
    }
    if (this.lineIntersect(x1, y0, x1, y1))
    {
        return true;
    }
    if (this.lineIntersect(x1, y1, x0, y1))
    {
        return true;
    }
    if (this.lineIntersect(x0, y1, x0, y0))
    {
        return true;
    }
    return false;
};

Wire.prototype.lineIntersect = function lineIntersect(x0, y0, x1, y1)
{
    var CmPx = x0 - this.x0
    var CmPy = y0 - this.y0;
    var rx = this.x1 - this.x0
    var ry = this.y1 - this.y0;
    var sx = x1 - x0
    var sy = y1 - y0;

    var CmPxr = CmPx * ry - CmPy * rx;
    var CmPxs = CmPx * sy - CmPy * sx;
    var rxs = rx * sy - ry * sx;

    if (CmPxr === 0.0)
    {
        // Lines are collinear, and so intersect if they have any overlap

        return ((x0 - this.x0 < 0.0) != (x0 - this.x1 < 0.0))
            || ((y0 - this.y0 < 0.0) != (y0 - this.y1 < 0.0));
    }

    if (rxs === 0.0)
    {
        return false; // Lines are parallel.
    }

    var rxsr = 1.0 / rxs;
    var t = CmPxs * rxsr;
    var u = CmPxr * rxsr;

    return (t >= 0.0) && (t <= 1.0) && (u >= 0.0) && (u <= 1.0);
};

Wire.prototype.distance = function distance(px, py)
{
    var x0 = this.x0;
    var y0 = this.y0;
    var x1 = this.x1;
    var y1 = this.y1;

    var lineDistance = 0.0;

    var dx = this.dx;
    var dy = this.dy;

    var d0;
    var d1;
    var d;

    d0 = x0 * dx + y0 * dy;
    d = px * dx + py * dy;
    d1 = x1 * dx + y1 * dy;

    if (d - d0 < Wire.width)
    {
        lineDistance = Math.sqrt((px - x0) * (px - x0) + (py - y0) * (py - y0)) - Wire.width;
    }
    else if (d - d1 > -Wire.width)
    {
        lineDistance = Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1)) - Wire.width;
    }
    else
    {
        var tx = dy;
        var ty = -dx;
        d0 = x0 * tx + y0 * ty;
        d = px * tx + py * ty;
        lineDistance = Math.abs(d - d0) - (Wire.halfWidth + 0.02);
    }

    return Math.max(0.0, lineDistance);
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

Wire.prototype.toggle = function toggle()
{
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

Bus.prototype.toggle = function toggle()
{
};
