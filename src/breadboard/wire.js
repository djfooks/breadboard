
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

    this.directionId = Connection.getDirectionId(dx, dy);
    this.bit0 = Connection.getDirectionFlag( dx,  dy);
    this.bit1 = Connection.getDirectionFlag(-dx, -dy);

    this.texture0 = 0;
    this.texture1 = 0;

    this.colorIndex = 0;
}

Wire.prototype.clone = function clone()
{
    return new Wire(this.x0, this.y0, this.x1, this.y1, this.id0, this.id1, this.type);
};

Wire.wireWidth = 0.2;
Wire.busWidth = 0.3;

Wire.prototype.getWidth = function getWidth()
{
    if (this.type === ComponentTypes.WIRE)
    {
        return Wire.wireWidth;
    }
    else// if (this.type === ComponentTypes.BUS)
    {
        return Wire.busWidth;
    }
};

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

Wire.prototype.rotate = function rotate(breadboard)
{
    var ox = this.x1 - this.x0;
    var oy = this.y1 - this.y0;

    this.x1 = oy + this.x0;
    this.y1 = -ox + this.y0;

    var dx = this.dx;
    var dy = this.dy;
    this.dx = dy;
    this.dy = -dx;
    dx = this.dx;
    dy = this.dy;

    this.id0 = breadboard.getIndex(this.x0, this.y0);
    this.id1 = breadboard.getIndex(this.x1, this.y1);

    this.directionId = Connection.getDirectionId(dx, dy);
    this.bit0 = Connection.getDirectionFlag( dx,  dy);
    this.bit1 = Connection.getDirectionFlag(-dx, -dy);
};

Wire.prototype.isWire = function isWire()
{
    return true;
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
    var CmPx = x0 - this.x0;
    var CmPy = y0 - this.y0;
    var rx = this.x1 - this.x0;
    var ry = this.y1 - this.y0;
    var sx = x1 - x0;
    var sy = y1 - y0;

    var CmPxr = CmPx * ry - CmPy * rx;
    var CmPxs = CmPx * sy - CmPy * sx;
    var rxs = rx * sy - ry * sx;

    if (CmPxr === 0.0)
    {
        // Lines are collinear, and so intersect if they have any overlap

        return ((x0 - this.x0 < 0.0) != (x0 - this.x1 < 0.0)) ||
               ((y0 - this.y0 < 0.0) != (y0 - this.y1 < 0.0));
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

Wire.prototype.distance = function baseDistance(px, py)
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

    var width = this.getWidth();

    if (d - d0 < width)
    {
        lineDistance = Math.sqrt((px - x0) * (px - x0) + (py - y0) * (py - y0)) - width;
    }
    else if (d - d1 > -width)
    {
        lineDistance = Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1)) - width;
    }
    else
    {
        var tx = dy;
        var ty = -dx;
        d0 = x0 * tx + y0 * ty;
        d = px * tx + py * ty;
        lineDistance = Math.abs(d - d0) - (width * 0.5 + 0.02);
    }

    return Math.max(0.0, lineDistance);
};

Wire.prototype.iterate = function iterate(fn)
{
    var x = this.x0;
    var y = this.y0;
    var x1 = this.x1;
    var y1 = this.y1;
    var dx = this.dx;
    var dy = this.dy;
    var i = 0;
    while (x !== x1 || y !== y1)
    {
        fn(x, y, i);
        x += dx;
        y += dy;
        i += 1;
    }
    fn(x, y, i);
};

Wire.prototype.toJson = function toJson(includeColor)
{
    if (includeColor)
    {
        return [this.x0, this.y0, this.x1, this.y1, this.colorIndex];
    }
    else
    {
        return [this.x0, this.y0, this.x1, this.y1];
    }
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

Wire.prototype.setColorIndex = function setColorIndex(breadboard, colorIndex)
{
    if (this.type != ComponentTypes.BUS)
    {
        return;
    }

    function iterate(breadboard, p, index)
    {
        var connection = breadboard.getConnection(index);
        var buses = connection.buses;
        for (i = 0; i < buses.length; i += 1)
        {
            buses[i].colorIndex = colorIndex;
        }
    }
    Bus.iterate(breadboard, [this.x0, this.y0], iterate);
    breadboard.geometryDirty = true;
};

Wire.prototype.configure = function configure(breadboard)
{
    var newColorIndex = (this.colorIndex + 1) % ColorPalette.base.bus.length;
    this.setColorIndex(breadboard, newColorIndex);
};
