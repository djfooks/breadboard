
function FreezerComponent(breadboard)
{
    this.p0 = [-1, -1];
    this.p1 = this.p0;

    this.id0 = -1;
    this.id1 = -1;

    this.rotation = 0;

    this.hitbox = new Hitbox(0, 0, 0, 0, this);
}
Component.addComponentFunctions(FreezerComponent);

FreezerComponent.prototype.getSize = function getSize() { return [1, 1] };

FreezerComponent.prototype.type = ComponentTypes.FREEZER;

FreezerComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    var matrix = RotationMatrix[this.rotation];

    this.p0 = [p[0], p[1]];
    this.id0 = breadboard.getIndex(p[0], p[1]);

    this.p1 = AddTransformedVector(this.p0, matrix, [1, 1]);
    this.id1 = breadboard.getIndex(this.p1[0], this.p1[1]);

    Component.updateHitbox(this, p, this.p1);
};

FreezerComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new FreezerComponent(breadboard);
    cloneComponent.move(breadboard, this.p0, this.rotation);
    return cloneComponent;
};

FreezerComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.FREEZER,
        p0: this.p0
    };
};

FreezerComponent.prototype.prepareGeometry = function prepareGeometry(componentRenderer)
{
    componentRenderer.freezerSymbols.count += 1;
};

FreezerComponent.prototype.addGeometry = function addGeometry(componentRenderer, breadboard)
{
    index = componentRenderer.freezerSymbols.index * 8;
    componentRenderer.addPosition(componentRenderer.freezerSymbols.p0, index, this.p0);
    componentRenderer.addPosition(componentRenderer.freezerSymbols.p1, index, this.p1);
    componentRenderer.freezerSymbols.index += 1;
};

FreezerComponent.prototype.getConnections = function getConnections()
{
    return [this.id0, this.id1];
};

FreezerComponent.prototype.getOutputs = function getOutputs(id)
{
    return [];
};
