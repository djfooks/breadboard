
function EEPROMComponent(breadboard)
{
    this.p0 = [-1, -1];
    this.p1 = this.p0;

    this.powerId = [];
    this.powerP = [-1, -1];
    this.powerTextureIndex = -1;

    this.addressId = [];
    this.addressP = [];

    this.valueId = [];
    this.valueP = [];
    this.valueTextureIndex = [];

    var i;
    for (i = 0; i < 8; i += 1)
    {
        this.addressId.push(-1);
        this.addressP.push([-1, -1]);

        this.valueId.push(-1);
        this.valueP.push([-1, -1]);
        this.valueTextureIndex.push(-1);
    }

    this.previousValue = 0;
    this.address = 0;
    this.value = 0;

    this.pulsePaths = [];

    this.hitbox = new Hitbox(0, 0, 0, 0, this);

    this.data = null;
    this.valueLookup = new Uint8Array(256);

    for (i = 0; i < 256; i += 1)
    {
        this.valueLookup[i] = i * 2 + 1;
    }

    this.jsCodeSource = null;
}
Component.addComponentFunctions(EEPROMComponent);

EEPROMComponent.prototype.getSize = function getSize() { return [2, 10] };

EEPROMComponent.prototype.type = ComponentTypes.EEPROM;

EEPROMComponent.prototype.toJson = function toJson()
{
    return {
        type: ComponentTypes.EEPROM,
        p0: this.p0,
        rotation: this.rotation,
        data: this.data,
        valueLookup: this.valueLookup,
        jsCodeSource: this.jsCodeSource
    };
};

EEPROMComponent.prototype.stateFromJson = function stateFromJson(json)
{
    this.data = json.data;
    //this.valueLookup = json.valueLookup;
    this.jsCodeSource = json.jsCodeSource;
};

EEPROMComponent.prototype.move = function move(breadboard, p, rotation)
{
    this.rotation = rotation;
    var matrix = RotationMatrix[this.rotation];
    this.p0 = [p[0], p[1]];

    this.powerP = [p[0], p[1]];
    this.powerId = breadboard.getIndex(p[0], p[1]);

    var i;
    for (i = 0; i < 8; i += 1)
    {
        this.addressP[i] = AddTransformedVector(p, matrix, [i + 1, 0]);
        this.addressId[i] = breadboard.getIndex(this.addressP[i][0], this.addressP[i][1]);

        this.valueP[i] = AddTransformedVector(p, matrix, [i + 1, 1]);
        this.valueId[i] = breadboard.getIndex(this.valueP[i][0], this.valueP[i][1]);
    }

    this.p1 = this.valueP[7];

    this.pulsePaths = [];
    Component.updateHitbox(this, p, this.p1);
};

EEPROMComponent.prototype.clone = function clone(breadboard)
{
    var cloneComponent = new EEPROMComponent(breadboard);
    cloneComponent.data = this.data;
    cloneComponent.values = this.values;
    cloneComponent.jsCodeSource = this.jsCodeSource;
    cloneComponent.move(breadboard, this.p0, this.rotation);
    return cloneComponent;
};

EEPROMComponent.prototype.prepareGeometry = function prepareGeometry(componentRenderer)
{
    // power and 8-pins
    componentRenderer.outputNodes.count += 9;
    componentRenderer.inputNodes.count += 8;
};

EEPROMComponent.prototype.addGeometry = function addGeometry(componentRenderer, breadboard, isTray)
{
    var i;
    for (i = 0; i < 8; i += 1)
    {
        this.valueTextureIndex[i] = componentRenderer.addOutputNode(breadboard, this.valueP[i], isTray);
        componentRenderer.addNode(breadboard, componentRenderer.inputNodes, this.addressP[i], this.addressId[i], isTray);
    }
    this.powerTextureIndex = componentRenderer.addOutputNode(breadboard, this.powerP, isTray);
};

EEPROMComponent.prototype.render = function render(breadboard, renderer)
{
    var i;
    for (i = 0; i < 8; i += 1)
    {
        Component.renderPinValue(breadboard, renderer, this, this.valueId[i], this.valueTextureIndex[i]);
    }
    Component.renderPinValue(breadboard, renderer, this, this.powerId, this.powerTextureIndex);
};

EEPROMComponent.prototype.update = function update(breadboard)
{
    this.address = 0;
    var i;
    for (i = 0; i < 8; i += 1)
    {
        if (breadboard.getConnection(this.addressId[i]).isOn())
        {
            this.address |= (1 << (7 - i));
        }
    }

    var value = this.valueLookup[this.address];
    if (this.previousValue != value)
    {
        var j;
        for (i = 0; i < this.pulsePaths.length; i += 1)
        {
            var child = this.pulsePaths[i];
            if (this.powerId == child.inputId)
            {
                for (j = 0; j < this.valueId.length; j += 1)
                {
                    if (this.valueId[j] === child.sourceId)
                    {
                        var connected = (value & (1 << (7 - j))) !== 0;
                        if (connected)
                        {
                            var parent = child.parent;
                            var parentStep = parent.idToStep[child.sourceId];
                            child.createPulse(parent.values[parentStep]);
                        }
                        else
                        {
                            child.createPulse(0);
                        }
                    }
                }
                // continue;
            }

            for (j = 0; j < this.valueId.length; j += 1)
            {
                if (this.valueId[j] === child.inputId)
                {
                    var connected = (value & (1 << (7 - j))) !== 0;
                    if (connected)
                    {
                        var parent = child.parent;
                        var parentStep = parent.idToStep[child.sourceId];
                        child.createPulse(parent.values[parentStep]);
                    }
                    else
                    {
                        child.createPulse(0);
                    }
                    // continue;
                }
            }
        }
        this.previousValue = value;
    }
};

EEPROMComponent.prototype.getConnections = function getConnections(breadboard)
{
    var connections = [this.powerId];
    var rotationMatrix = RotationMatrix[this.rotation];
    var i;
    for (i = 0; i < 8; i += 1)
    {
        connections.push(this.valueId[i]);
        connections.push(this.addressId[i]);
    }
    return connections;
};

EEPROMComponent.prototype.configure = function configure(breadboard)
{
    breadboard.vueapp.showConfigureModal(breadboard);
};

EEPROMComponent.prototype.getOutputs = function getOutputs(id)
{
    var i;
    if (id === this.powerId)
    {
        return [this.valueId[0],
                this.valueId[1],
                this.valueId[2],
                this.valueId[3],
                this.valueId[4],
                this.valueId[5],
                this.valueId[6],
                this.valueId[7]];
    }
    for (i = 0; i < 8; i += 1)
    {
        if (id === this.valueId[i])
        {
            return [this.powerId];
        }
    }
    return [];
    //TODO
    //throw new Error();
};

EEPROMComponent.prototype.isConnected = function isConnected(id0, id1)
{
    var otherId;
    if (id0 === this.powerId)
    {
        otherId = id1;
    }
    else if (id1 === this.powerId)
    {
        otherId = id0;
    }
    else
    {
        return false;
    }

    var value = this.valueLookup[this.address];

    var i;
    for (i = 0; i < 8; i += 1)
    {
        if (otherId === this.valueId[i])
        {
            return value & (1 << (7 - i));
        }
    }
};
