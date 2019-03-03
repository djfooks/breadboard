
function DiodeComponent(breadboard)
{
    this.id0 = -1;
    this.p0 = [-1, -1];

    this.id1 = -1;
    this.p1 = [-1, -1];

    this.rotation = 0;
    this.pulsePaths = [];

    this.hitbox = new Hitbox(0, 0, 0, 0, this);
}
Component.addComponentFunctions(DiodeComponent);

DiodeComponent.prototype.getSize = function getSize() { return [1, 2] };

DiodeComponent.prototype.type = ComponentTypes.DIODE;

DiodeComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    this.p0 = [p[0], p[1]];
    var matrix = RotationMatrix[this.rotation];

    this.p0 = [p[0], p[1]];
    this.id0 = breadboard.getIndex(p[0], p[1]);

    this.p1 = AddTransformedVector(this.p0, matrix, [0, 1]);
    this.id1 = breadboard.getIndex(this.p1[0], this.p1[1]);

    this.pulsePaths = [];
    Component.updateHitbox(this, p, this.p1);
};

DiodeComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new DiodeComponent(breadboard);
    cloneComponent.move(breadboard, this.p0, this.rotation);
    return cloneComponent;
};

DiodeComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.DIODE,
        p0: this.p0,
        rotation: this.rotation
    };
};

DiodeComponent.prototype.prepareGeometry = function prepareGeometry(componentRenderer)
{
    componentRenderer.outputNodes.count += 2;
    componentRenderer.diodeSymbols.count += 1;
};

DiodeComponent.prototype.addGeometry = function addGeometry(componentRenderer, breadboard, isTray)
{
    componentRenderer.addNode(breadboard, componentRenderer.outputNodes, this.p0, this.id0, isTray);
    componentRenderer.addNode(breadboard, componentRenderer.outputNodes, this.p1, this.id1, isTray);

    var index = componentRenderer.diodeSymbols.index * 8;
    componentRenderer.addPosition(componentRenderer.diodeSymbols.p0, index, this.p0);
    componentRenderer.addPosition(componentRenderer.diodeSymbols.p1, index, this.p1);
    componentRenderer.diodeSymbols.index += 1;
};

DiodeComponent.prototype.getConnections = function getConnections()
{
    return [this.id0, this.id1];
};

DiodeComponent.prototype.getOutputs = function getOutputs(id)
{
    if (id === this.id0)
    {
        return [this.id1];
    }
    else if (id === this.id1)
    {
        return [];
    }
    throw new Error();
};

DiodeComponent.prototype.isConnected = function isConnected(id0, id1)
{
    if (id0 === this.id0 && id1 === this.id1)
    {
        return true;
    }
    else if (id0 === this.id1 && id1 === this.id0)
    {
        return false;
    }
    throw new Error();
};
