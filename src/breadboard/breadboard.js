
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
    this.graphics = new PIXI.Graphics();
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
    this.dirty = false;
    this.state = Breadboard.state.NONE;
    this.wireStart = [-1, -1];

    this.drawGrid();
    stage.addChild(this.graphics);
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
    this.simulate();
    if (this.dirty)
    {
        this.dirty = false;
        this.draw();
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
    var graphics = this.graphics;
    graphics.clear();
    graphics.lineStyle(2, 0x000000, 1);
    var value = 0;
    var i;

    var left = this.left;
    var top = this.top;
    var spacing = this.spacing;
    for (i = 0; i < this.wires.length; i += 1)
    {
        var wire = this.wires[i];
        if (wire.value !== value)
        {
            value = wire.value;
            if (value)
            {
                graphics.lineStyle(2, 0xFF0000, 1);
            }
            else
            {
                graphics.lineStyle(2, 0x000000, 1);
            }
        }

        var p0 = this.getPositionFromIndex(wire.p0);
        var p1 = this.getPositionFromIndex(wire.p1);

        graphics.moveTo(left + p0[0] * spacing, top + p0[1] * spacing);
        graphics.lineTo(left + p1[0] * spacing, top + p1[1] * spacing);
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

Breadboard.prototype.addWire = function addWire(x0, y0, x1, y1)
{
    this.dirty = true;

    var p0 = this.getIndex(x0, y0);
    var p1 = this.getIndex(x1, y1);

    var wires = this.wires;
    var newWire = new Wire(p0, p1);
    wires.push(newWire);

    this.connections[p0].push(newWire);
    this.connections[p1].push(newWire);
};

Breadboard.prototype.click = function click(p)
{
    console.log(p[0] + " " + p[1]);
    p = this.getPosition(p);
    console.log(p[0] + " " + p[1]);
    if (p[0] < 0 || p[1] < 0 || p[0] > this.cols || p[1] > this.rows)
    {
        this.state = Breadboard.state.NONE;
        return;
    }

    if (this.state === Breadboard.state.NONE)
    {
        this.wireStart = p;
        this.state = Breadboard.state.PLACING_WIRE;
    }
    else if (this.state === Breadboard.state.PLACING_WIRE)
    {
        if (p[0] !== this.wireStart[0] ||
            p[1] !== this.wireStart[1])
        {
            this.addWire(p[0], p[1], this.wireStart[0], this.wireStart[1]);
        }
        this.state = Breadboard.state.NONE;
    }
};
