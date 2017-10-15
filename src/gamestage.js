
function GameStage(minX, minY, maxX, maxY)
{
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;

    this.gameStageHitbox = new Hitbox(minX, minY, maxX, maxY);

    this.gameStageHitbox.onMouseDown = this.mouseDown.bind(this);
    this.gameStageHitbox.onMouseUp = this.mouseUp.bind(this);
    this.gameStageHitbox.onMouseMove = this.mouseMove.bind(this);

    this.hitboxes = [];

    this.view = [0, 0];
    this.zoomLevel = 1;
    this.zoom = 1;

    this.onMouseDown = null;
    this.onMouseUp = null;
    this.onMouseMove = null;
}

GameStage.prototype.scroll = function scroll(delta)
{
    this.view[0] += delta[0];
    this.view[1] += delta[1];
};

GameStage.prototype.zoomDelta = function zoomDelta(deltaY)
{
    this.zoomLevel += deltaY * 0.01;
    this.zoom = Math.pow(1.05, this.zoomLevel);
};

GameStage.prototype.addHitbox = function addHitbox(hitbox)
{
    this.hitboxes.push(hitbox);
};

GameStage.prototype.removeHitbox = function removeHitbox(hitbox)
{
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
}

GameStage.prototype.mouseDown = function mouseDown(p, button)
{
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

GameStage.prototype.toView = function toView(p)
{
    return [p[0] + this.view[0], p[1] + this.view[1]];
};

GameStage.prototype.fromView = function fromView(p)
{
    return [p[0] - this.view[0], p[1] - this.view[1]];
};

GameStage.prototype.drawBorder = function drawBorder(ctx)
{
    var x0 = this.minX - 1;
    var y0 = this.minY - 1;
    var x1 = this.maxX + 1;
    var y1 = this.maxY + 1;

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
        var min = this.fromView([hitbox.minX, hitbox.minY]);
        var max = this.fromView([hitbox.maxX, hitbox.maxY]);
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#0000FF";
        ctx.moveTo(min[0], min[1]);
        ctx.lineTo(min[0], max[1]);
        ctx.lineTo(max[0], max[1]);
        ctx.lineTo(max[0], min[1]);
        ctx.lineTo(min[0], min[1]);
        ctx.stroke();
    }
};
