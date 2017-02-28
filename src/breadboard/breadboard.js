
function Wire(x0, y0, x1, y1, id0, id1)
{
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;

    this.id0 = id0;
    this.id1 = id1;

    var dx = x1 - x0;
    this.dx = dx < 0 ? -1 : (dx > 0 ? 1 : 0);
    var dy = y1 - y0;
    this.dy = dy < 0 ? -1 : (dy > 0 ? 1 : 0);

    this.bit0 = Connection.getDirectionFlag( this.dx,  this.dy);
    this.bit1 = Connection.getDirectionFlag(-this.dx, -this.dy);
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
};

function Breadboard(stage, top, left, cols, rows, spacing)
{
    this.fgGraphics = new PIXI.Graphics();
    this.bgGraphics = new PIXI.Graphics();
    this.stage = stage;

    this.top = top;
    this.left = left;
    this.cols = cols;
    this.rows = rows;
    this.spacing = spacing;
    this.connections = new Array(cols * rows);
    var i;
    for (i = 0; i < this.connections.length; i += 1)
    {
        this.connections[i] = new Connection();
    }
    this.wires = [];
    this.virtualWires = [];
    this.dirty = false;
    this.state = Breadboard.state.NONE;
    this.wireStart = [-1, -1];
    this.updateCounter = 0;

    this.simulateSteps = 0;

    this.drawGrid();
    stage.addChild(this.bgGraphics);
    stage.addChild(this.fgGraphics);
}

Breadboard.prototype.drawGrid = function drawGrid()
{
    var gridGraphics = this.gridGraphics = new PIXI.Graphics();

    gridGraphics.lineStyle(1, 0xB0B0B0, 1);

    var x;
    var y;

    var left = this.left;
    var top = this.top;
    var cols = this.cols;
    var rows = this.rows;
    var spacing = this.spacing;

    var right = left + (cols - 1) * spacing;
    var bottom = left + (rows - 1) * spacing;

    for (x = 0; x < cols; x += 1)
    {
        for (y = 0; y < rows; y += 1)
        {
            gridGraphics.moveTo(left + x * spacing, top);
            gridGraphics.lineTo(left + x * spacing, bottom);

            gridGraphics.moveTo(left,  top + y * spacing);
            gridGraphics.lineTo(right, top + y * spacing);
        }
    }

    this.stage.addChild(gridGraphics);
};

Breadboard.state = {
    NONE: 1,
    PLACING_WIRE: 2
};

Breadboard.prototype.update = function update()
{
    if (true)//this.dirty)
    {
        this.simulate();
        this.draw();
        this.dirty = false;
    }
};

Breadboard.prototype.simulate = function simulate()
{
    var i;
    var j;
    var connections = this.connections;
    this.updateCounter += 1;
    var updateCounter = this.updateCounter;

    var edges = [];
    connections[0].setValue(updateCounter, 1);
    edges.push(0);

    var steps = 0;
    this.simulateSteps += 1;

    if (this.simulateSteps > 150)
    {
        this.simulateSteps = 0;
    }

    var newEdges;
    while (edges.length > 0 && steps < this.simulateSteps)
    {
        newEdges = [];
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
                    var p = this.getPositionFromIndex(id);
                    var x = p[0] + delta[0];
                    var y = p[1] + delta[1];
                    var newId = this.getIndex(x, y);
                    if (connections[newId].getValue(updateCounter) === 0)
                    {
                        connections[newId].setValue(updateCounter, 1);
                        newEdges.push(newId);
                    }
                }
                dirBit = dirBit << 1;
            }
        }
        steps += 1;
        edges = newEdges;
    }
};

Breadboard.prototype.draw = function draw()
{
    this.fgGraphics.clear();
    this.bgGraphics.clear();

    this.drawWires(this.wires);
    this.drawWires(this.virtualWires);
};

Breadboard.prototype.drawWires = function drawWires(wires)
{
    var fgGraphics = this.fgGraphics;
    var bgGraphics = this.bgGraphics;

    var i;

    var that = this;
    var connections = this.connections;
    var left = this.left;
    var top = this.top;
    var spacing = this.spacing;
    var updateCounter = this.updateCounter;
    var circlesDrawn = {};
    bgGraphics.lineStyle(6, 0x000000, 1);
    for (i = 0; i < wires.length; i += 1)
    {
        var wire = wires[i];
        var x0 = wire.x0;
        var y0 = wire.y0;
        var x1 = wire.x1;
        var y1 = wire.y1;
        if (!circlesDrawn[wire.id0])
        {
            circlesDrawn[wire.id0] = true;
            bgGraphics.drawCircle(left + x0 * spacing, top + y0 * spacing, 1.5);
        }
        if (!circlesDrawn[wire.id1])
        {
            circlesDrawn[wire.id1] = true;
            bgGraphics.drawCircle(left + x1 * spacing, top + y1 * spacing, 1.5);
        }
        bgGraphics.lineStyle(6, 0x000000, 1);
        bgGraphics.moveTo(left + x0 * spacing, top + y0 * spacing);
        bgGraphics.lineTo(left + x1 * spacing, top + y1 * spacing);
        // TODO only update bgGraphics when a wire/component is added
    }

    for (i = 0; i < wires.length; i += 1)
    {
        var wire = wires[i];
        var start = [wire.x0, wire.y0];
        var on = connections[wire.id0].getValue(updateCounter) > 0;
        wire.iterate(function wireIterateCurrent(x, y)
        {
            var id = that.getIndex(x, y);
            var connectionOn = connections[id].getValue(updateCounter) > 0;
            if ((connectionOn && !on) ||
                (!connectionOn && on))
            {
                if (on)
                {
                    fgGraphics.lineStyle(3, 0xFF0000, 1);
                }
                else
                {
                    fgGraphics.lineStyle(3, 0xFFFFFF, 1);
                }
                on = connectionOn;
                fgGraphics.moveTo(left + start[0] * spacing, top + start[1] * spacing);
                fgGraphics.lineTo(left + x * spacing, top + y * spacing);
                start[0] = x;
                start[1] = y;
            }
        });

        if (start[0] !== wire.x1 || start[1] !== wire.y1)
        {
            if (on)
            {
                fgGraphics.lineStyle(3, 0xFF0000, 1);
            }
            else
            {
                fgGraphics.lineStyle(3, 0xFFFFFF, 1);
            }
            fgGraphics.moveTo(left + start[0] * spacing, top + start[1] * spacing);
            fgGraphics.lineTo(left + wire.x1 * spacing, top + wire.y1 * spacing);
        }
    }
};

Breadboard.prototype.getIndex = function getIndex(x, y)
{
    return x + y * this.cols;
};

Breadboard.prototype.getPositionFromIndex = function getPositionFromIndex(index)
{
    var y = Math.floor(index / this.cols);
    var x = index - (y * this.cols);
    return [x, y];
};

Breadboard.prototype.getPosition = function getPosition(p)
{
    var x = Math.round((p[0] - this.left) / this.spacing);
    var y = Math.round((p[1] - this.top) / this.spacing);
    return [x, y];
};

Breadboard.prototype.addWire = function addWire(x0, y0, x1, y1, virtual)
{
    this.dirty = true;

    var id0 = this.getIndex(x0, y0);
    var id1 = this.getIndex(x1, y1);

    newWire = new Wire(x0, y0, x1, y1, id0, id1);
    if (virtual)
    {
        this.virtualWires.push(newWire);
    }
    else
    {
        this.wires.push(newWire);
        var connections = this.connections;
        connections[id0].addComponent(newWire);
        connections[id1].addComponent(newWire);

        var dx = newWire.dx;
        var dy = newWire.dy;
        var bit0 = newWire.bit0;
        var bit1 = newWire.bit1;
        var x = x0;
        var y = y0;
        var id;
        while (x !== x1 || y !== y1)
        {
            id = this.getIndex(x, y);
            connections[id].addWire(bit0);
            x += dx;
            y += dy;
            id = this.getIndex(x, y);
            connections[id].addWire(bit1);
        }
    }
};

Breadboard.prototype.validPosition = function validPosition(p)
{
    return p[0] >= 0 && p[1] >= 0 && p[0] <= this.cols && p[1] <= this.rows;
};

Breadboard.prototype.mouseUpdate = function mouseUpdate(p, virtual)
{
    if (this.state === Breadboard.state.NONE)
    {
        return;
    }
    p = this.getPosition(p);
    if (!this.validPosition(p))
    {
        this.state = Breadboard.state.NONE;
        return;
    }
    if (this.state === Breadboard.state.PLACING_WIRE)
    {
        this.virtualWires = [];
        var wireStart = this.wireStart;
        if (p[0] === wireStart[0] &&
            p[1] === wireStart[1])
        {
            return;
        }

        if (p[0] === wireStart[0] ||
            p[1] === wireStart[1])
        {
            this.addWire(p[0], p[1], wireStart[0], wireStart[1], virtual);
        }
        else
        {
            var x = p[0] - wireStart[0];
            var y = p[1] - wireStart[1];
            if (Math.abs(x) < Math.abs(y))
            {
                y = ((y > 0 && x > 0) || (y < 0 && x < 0)) ? x : -x;
                this.addWire(wireStart[0], wireStart[1], wireStart[0] + x, wireStart[1] + y, virtual);
                this.addWire(wireStart[0] + x, wireStart[1] + y, p[0], p[1], virtual);
            }
            else
            {
                x = ((x > 0 && y > 0) || (x < 0 && y < 0)) ? y : -y;
                this.addWire(wireStart[0], wireStart[1], wireStart[0] + x, wireStart[1] + y, virtual);
                this.addWire(wireStart[0] + x, wireStart[1] + y, p[0], p[1], virtual);
            }
        }
    }
};

Breadboard.prototype.mousedown = function mousedown(p)
{
    p = this.getPosition(p);
    if (this.validPosition(p))
    {
        this.state = Breadboard.state.PLACING_WIRE;
        this.wireStart = p;
    }
};

Breadboard.prototype.mouseup = function mouseup(p)
{
    this.mouseUpdate(p, false);
    this.state = Breadboard.state.NONE;
};

Breadboard.prototype.mousemove = function mousemove(p)
{
    this.mouseUpdate(p, true);
};
