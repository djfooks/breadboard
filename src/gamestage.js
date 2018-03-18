
function GameStage(minX, minY, maxX, maxY)
{
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;

    this.gameMin = [0.0, 0.0];
    this.gameMax = [0.0, 0.0];

    this.gameStageHitbox = new Hitbox(minX, minY, maxX, maxY, this);

    this.gameStageHitbox.onMouseDown = this.mouseDown.bind(this);
    this.gameStageHitbox.onMouseUp = this.mouseUp.bind(this);
    this.gameStageHitbox.onMouseMove = this.mouseMove.bind(this);

    this.hitboxes = [];

    this.view = [0, 0];
    this.zoomVelocity = 0;
    this.zoomLevel = 70;
    this.zoom = 20;
    this.invZoom = 1 / this.zoom;

    this.mousePos = [(this.maxX - this.minX) * 0.5,
                     (this.maxX - this.minX) * 0.5];

    this.onMouseDown = null;
    this.onMouseUp = null;
    this.onMouseMove = null;

    this.debugClippping = false;
}

GameStage.prototype.scroll = function scroll(delta)
{
    this.view[0] += delta[0];
    this.view[1] += delta[1];
};

GameStage.prototype.update = function update(deltaTime)
{
    this.zoomVelocity *= 0.8;

    var oldZoom = this.zoom;
    this.zoomLevel += this.zoomVelocity;
    if (this.zoomLevel > 100)
    {
        this.zoomLevel = 100;
        this.zoomVelocity = 0;
    }
    this.zoom = Math.pow(1.05, this.zoomLevel);
    this.invZoom = 1 / this.zoom;

    // keep whatever is under the mouse stationary during the zoom
    this.view[0] = ((this.view[0] + this.mousePos[0]) * (this.zoom / oldZoom)) - this.mousePos[0];
    this.view[1] = ((this.view[1] + this.mousePos[1]) * (this.zoom / oldZoom)) - this.mousePos[1];

    var offsetX = this.mousePos[0] - (this.maxX - this.minX) * 0.5;
    var offsetY = this.mousePos[1] - (this.maxX - this.minX) * 0.5;

    // move the view slightly so that whatever is under the mouse moves to the center of the game space
    var centerVelocity = Math.abs(this.zoomVelocity);
    this.view[0] += offsetX * centerVelocity * 0.05;
    this.view[1] += offsetY * centerVelocity * 0.05;

    if (this.debugClippping)
    {
        this.gameMin = this.toView([this.minX + 50, this.minY + 50]);
        this.gameMax = this.toView([this.maxX - 50, this.maxY - 50]);
    }
    else
    {
        this.gameMin = this.toView([this.minX, this.minY]);
        this.gameMax = this.toView([this.maxX, this.maxY]);
    }
};

GameStage.prototype.clearHitboxes = function clearHitboxes()
{
    this.hitboxes.length = 0;
};

GameStage.prototype.zoomDelta = function zoomDelta(deltaY)
{
    this.zoomVelocity += deltaY * 0.005;
};

GameStage.prototype.addHitbox = function addHitbox(hitbox)
{
    if (!hitbox)
    {
        throw new Error("Invalid hitbox");
    }
    this.hitboxes.push(hitbox);
};

GameStage.prototype.removeHitbox = function removeHitbox(hitbox)
{
    if (!hitbox)
    {
        throw new Error("Invalid hitbox");
    }
    var i;
    for (i = 0; i < this.hitboxes.length; i += 1)
    {
        if (this.hitboxes[i] === hitbox)
        {
            this.hitboxes.splice(i, 1);
            return true;
        }
    }
    return false;
};

GameStage.prototype.findHitbox = function findHitbox(x, y)
{
    var i;
    for (i = 0; i < this.hitboxes.length; i += 1)
    {
        var hitbox = this.hitboxes[i];
        if (x > hitbox.minX &&
            x < hitbox.maxX &&
            y > hitbox.minY &&
            y < hitbox.maxY)
        {
            return hitbox;
        }
    }
    return null;
};

GameStage.prototype.mouseDown = function mouseDown(p, button)
{
    this.mousePos = [p[0], p[1]];
    var q = this.toView(p);
    var hitbox = this.findHitbox(q[0], q[1]);
    if (hitbox && hitbox.onMouseDown)
    {
        hitbox.onMouseDown(p, button);
    }
    else if (this.onMouseDown)
    {
        this.onMouseDown(p, button);
    }
};

GameStage.prototype.mouseUp = function mouseUp(p, button)
{
    this.mousePos = [p[0], p[1]];
    var q = this.toView(p);
    var hitbox = this.findHitbox(q[0], q[1]);
    if (hitbox && hitbox.onMouseUp)
    {
        hitbox.onMouseUp(p, button);
    }
    else if (this.onMouseUp)
    {
        this.onMouseUp(p, button);
    }
};

GameStage.prototype.mouseMove = function mouseMove(p)
{
    this.mousePos = [p[0], p[1]];
    var q = this.toView(p);
    var hitbox = this.findHitbox(q[0], q[1]);
    if (hitbox && hitbox.onMouseMove)
    {
        hitbox.onMouseMove(p);
    }
    else if (this.onMouseMove)
    {
        this.onMouseMove(p);
    }
};

GameStage.prototype.transformContext = function transformContext(ctx)
{
    var z = this.zoom;
    ctx.transform(z, 0, 0, z, -this.view[0], -this.view[1]);
};

GameStage.prototype.toView = function toView(p)
{
    return [(p[0] - this.minX + this.view[0]) * this.invZoom,
            (p[1] - this.minY + this.view[1]) * this.invZoom];
};

GameStage.prototype.fromView = function fromView(p)
{
    return [p[0] * this.zoom + this.minX - this.view[0],
            p[1] * this.zoom + this.minY - this.view[1]];
};

GameStage.prototype.hitboxOverlaps = function hitboxOverlaps(hitbox)
{
    return (hitbox.maxX >= this.gameMin[0] && this.gameMax[0] >= hitbox.minX &&
            hitbox.maxY >= this.gameMin[1] && this.gameMax[1] >= hitbox.minY);
};

GameStage.prototype.boxOverlaps = function boxOverlaps(x0, y0, x1, y1, padding)
{
    var minX = Math.min(x0, x1) - padding;
    var minY = Math.min(y0, y1) - padding;
    var maxX = Math.max(x0, x1) + padding;
    var maxY = Math.max(y0, y1) + padding;
    return (maxX >= this.gameMin[0] && this.gameMax[0] >= minX &&
            maxY >= this.gameMin[1] && this.gameMax[1] >= minY);
};

GameStage.prototype.drawBorder = function drawBorder(ctx)
{
    var padding = 1;
    if (this.debugClippping)
    {
        padding -= 50;
    }
    var x0 = this.minX - padding;
    var y0 = this.minY - padding;
    var x1 = this.maxX + padding;
    var y1 = this.maxY + padding;

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y1);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1, y0);
    ctx.lineTo(x0, y0);
    ctx.stroke();
};

GameStage.prototype.drawHitboxes = function drawHitboxes(ctx)
{
    var i;
    for (i = 0; i < this.hitboxes.length; i += 1)
    {
        var hitbox = this.hitboxes[i];
        ctx.beginPath();
        ctx.lineWidth = 1 * this.invZoom;
        ctx.strokeStyle = "#0000FF";
        ctx.moveTo(hitbox.minX, hitbox.minY);
        ctx.lineTo(hitbox.minX, hitbox.maxY);
        ctx.lineTo(hitbox.maxX, hitbox.maxY);
        ctx.lineTo(hitbox.maxX, hitbox.minY);
        ctx.lineTo(hitbox.minX, hitbox.minY);
        ctx.stroke();
    }
};
