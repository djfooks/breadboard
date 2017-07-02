
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

    this.onMouseDown = null;
    this.onMouseUp = null;
    this.onMouseMove = null;
}

GameStage.prototype.scroll = function scroll(delta)
{
    this.view[0] += delta[0];
    this.view[1] += delta[1];
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
