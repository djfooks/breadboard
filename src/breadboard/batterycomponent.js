
function BatteryComponent(breadboard)
{
    this.p0 = [-1, -1];
    this.p1 = this.p0;

    this.id0 = -1;
    this.id1 = -1;

    this.rotation = 0;
    this.pulsePaths = [];
    this.strength = 50;

    this.hitbox = new Hitbox(0, 0, 0, 0, this);
}
Component.addComponentFunctions(BatteryComponent);

BatteryComponent.prototype.getSize = function getSize() { return [1, 2] };

BatteryComponent.prototype.type = ComponentTypes.BATTERY;

BatteryComponent.prototype.createPulsePath = function createPulsePath()
{
    this.pulsePaths = [new PulsePath(this.strength, this.id1, -1)];
};

BatteryComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    var matrix = RotationMatrix[this.rotation];

    this.p0 = [p[0], p[1]];
    this.id0 = breadboard.getIndex(p[0], p[1]);

    this.p1 = AddTransformedVector(this.p0, matrix, [0, 1]);
    this.id1 = breadboard.getIndex(this.p1[0], this.p1[1]);

    Component.updateHitbox(this, p, this.p1);
};

BatteryComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new BatteryComponent(breadboard);
    cloneComponent.move(breadboard, this.p0, this.rotation);
    return cloneComponent;
};

BatteryComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.BATTERY,
        p0: this.p0,
        rotation: this.rotation
    };
};

BatteryComponent.prototype.prepareGeometry = function prepareGeometry(componentRenderer)
{
    componentRenderer.outputNodes.count += 1;
    componentRenderer.batterySymbols.count += 1;
};

BatteryComponent.prototype.addGeometry = function addGeometry(componentRenderer, breadboard)
{
    var index = componentRenderer.outputNodes.index * 12;
    componentRenderer.addPositionAndTextureIndex(componentRenderer.outputNodes.p, index, this.p1, 1);
    componentRenderer.outputNodes.index += 1;

    index = componentRenderer.batterySymbols.index * 8;
    componentRenderer.addPosition(componentRenderer.batterySymbols.p0, index, this.p0);
    componentRenderer.addPosition(componentRenderer.batterySymbols.p1, index, this.p1);
    componentRenderer.batterySymbols.index += 1;
};

BatteryComponent.prototype.getConnections = function getConnections()
{
    return [this.id0, this.id1];
};

BatteryComponent.prototype.getOutputs = function getOutputs(id)
{
    return [];
};
