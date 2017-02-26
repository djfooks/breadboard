
function Wire(p0, p1)
{
    this.p0 = p0;
    this.p1 = p1;
    this.value = 0;
}

Wire.prototype.getConnection = function getConnection(from)
{
    if (from === this.p0)
    {
        return this.p1;
    }
    else if (from === this.p1)
    {
        return this.p0;
    }
    return -1;
}

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
        this.connections[i] = [];
    }
    this.wires = [];
    this.virtualWires = [];
    this.dirty = false;
    this.state = Breadboard.state.NONE;
    this.wireStart = [-1, -1];

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
    if (this.dirty)
    {
        this.simulate();
        this.draw();
        this.dirty = false;
    }
};

Breadboard.prototype.simulate = function simulate()
{
    var i;
    var connections = this.connections;
    var wires = this.wires;
    var wiresLength = wires.length;
    for (i = 0; i < wiresLength; i += 1)
    {
        wires[i].value = 0;
    }

    var edges = [];
    edges.push(0);

    while (edges.length > 0)
    {
        var id = edges.pop();
        var connectionComponents = connections[id];
        for (i = 0; i < connectionComponents.length; i += 1)
        {
            var component = connectionComponents[i];
            if (component.value === 0)
            {
                component.value = 1;
                this.dirty = true;
                var newId = component.getConnection(id);
                if (newId !== -1)
                {
                    edges.push(newId);
                }
            }
        }
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

    var left = this.left;
    var top = this.top;
    var spacing = this.spacing;
    var circlesDrawn = {};
    bgGraphics.lineStyle(6, 0x000000, 1);
    for (i = 0; i < wires.length; i += 1)
    {
        var wire = wires[i];
        var p0 = this.getPositionFromIndex(wire.p0);
        var p1 = this.getPositionFromIndex(wire.p1);
        if (!circlesDrawn[wire.p0])
        {
            circlesDrawn[wire.p0] = true;
            bgGraphics.drawCircle(left + p0[0] * spacing, top + p0[1] * spacing, 1.5);
        }
        if (!circlesDrawn[wire.p1])
        {
            circlesDrawn[wire.p1] = true;
            bgGraphics.drawCircle(left + p1[0] * spacing, top + p1[1] * spacing, 1.5);
        }
        bgGraphics.lineStyle(6, 0x000000, 1);
        bgGraphics.moveTo(left + p0[0] * spacing, top + p0[1] * spacing);
        bgGraphics.lineTo(left + p1[0] * spacing, top + p1[1] * spacing);
    }

    for (i = 0; i < wires.length; i += 1)
    {
        var wire = wires[i];
        var p0 = this.getPositionFromIndex(wire.p0);
        var p1 = this.getPositionFromIndex(wire.p1);

        if (wire.value)
        {
            fgGraphics.lineStyle(3, 0xFF0000, 1);
        }
        else
        {
            fgGraphics.lineStyle(3, 0xFFFFFF, 1);
        }

        fgGraphics.moveTo(left + p0[0] * spacing, top + p0[1] * spacing);
        fgGraphics.lineTo(left + p1[0] * spacing, top + p1[1] * spacing);
        fgGraphics.drawCircle(left + p0[0] * spacing, top + p0[1] * spacing, 1);
        fgGraphics.drawCircle(left + p1[0] * spacing, top + p1[1] * spacing, 1);
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

    var p0 = this.getIndex(x0, y0);
    var p1 = this.getIndex(x1, y1);

    var newWire = new Wire(p0, p1);
    if (virtual)
    {
        this.virtualWires.push(newWire);
    }
    else
    {
        this.wires.push(newWire);
        this.connections[p0].push(newWire);
        this.connections[p1].push(newWire);
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
        if (p[0] !== wireStart[0] ||
            p[1] !== wireStart[1])
        {
            if (p[0] == wireStart[0] ||
                p[1] == wireStart[1])
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
