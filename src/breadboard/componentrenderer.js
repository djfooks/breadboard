
function ComponentRenderer(renderer)
{
    this.renderer = renderer;

    var maxNum = 10000;
    var indicesArray = new Uint16Array(maxNum * 6);
    var verticesArray = new Uint8Array(maxNum * 8);
    var i;
    var index;
    var vertexIndex;
    var vertex;
    for (i = 0; i < maxNum; i += 1)
    {
        index = i * 6;
        vertexIndex = i * 4;
        indicesArray[index + 0] = vertexIndex + 0;
        indicesArray[index + 1] = vertexIndex + 1;
        indicesArray[index + 2] = vertexIndex + 2;
        indicesArray[index + 3] = vertexIndex + 2;
        indicesArray[index + 4] = vertexIndex + 3;
        indicesArray[index + 5] = vertexIndex + 0;

        vertex = i * 8;
        verticesArray[vertex + 6] = 0;
        verticesArray[vertex + 7] = 1;
        verticesArray[vertex + 0] = 0;
        verticesArray[vertex + 1] = 0;
        verticesArray[vertex + 2] = 1;
        verticesArray[vertex + 3] = 0;
        verticesArray[vertex + 4] = 1;
        verticesArray[vertex + 5] = 1;
    }

    var indices = new THREE.BufferAttribute(indicesArray, 1);

    function createQuadGeometry()
    {
        var result = new THREE.BufferGeometry();
        result.setIndex(indices);
        result.addAttribute('position', new THREE.BufferAttribute(verticesArray, 2));
        result.boundingSphere = new THREE.Sphere();
        result.boundingSphere.radius = 99999;
        return result;
    }

    this.switchGeometry = createQuadGeometry();
    this.outputNodeGeometry = createQuadGeometry();
    this.inputNodeGeometry = createQuadGeometry();

    this.batterySymbolGeometry = createQuadGeometry();
    this.diodeSymbolGeometry = createQuadGeometry();

    this.innerRadius = { value: 0.26 };
    this.outerRadius = { value: 0.31 };
    this.width = { value: 0.01 };
    this.bgColor = { value: new THREE.Vector3(0.0, 0.0, 0.0)};
    this.inputBgColor = { value: new THREE.Vector3(0.0, 1.0, 0.0)};

    this.switches = {
        count: 0,
        index: 0,
        base: null,
        p0: null,
        p1: null,
        signal: null,
    };

    this.outputNodes = {
        count: 0,
        index: 0,
        p: null
    };

    this.inputNodes = {
        count: 0,
        index: 0,
        p: null
    };

    this.batterySymbols = {
        count: 0,
        index: 0,
        p0: null,
        p1: null
    };

    this.diodeSymbols = {
        count: 0,
        index: 0,
        p0: null,
        p1: null
    };
}

ComponentRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    this.componentSwitchMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            radius: this.outerRadius,
            feather: feather,
            texture: this.renderer.texture,
            textureSize: this.renderer.textureSize
        },
        vertexShader: ShaderManager.get("src/shaders/componentswitch.vert"),
        fragmentShader: ShaderManager.get("src/shaders/componentswitch.frag"),
        side: THREE.DoubleSide
    });
    this.componentSwitchMaterial.transparent = true;

    this.outputNodeMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            radius: this.outerRadius,
            feather: feather,
            texture: this.renderer.texture,
            textureSize: this.renderer.textureSize,
            bgColor: this.bgColor
        },
        vertexShader: ShaderManager.get("src/shaders/componentnode.vert"),
        fragmentShader: ShaderManager.get("src/shaders/componentnode.frag"),
        side: THREE.DoubleSide
    });
    this.outputNodeMaterial.transparent = true;

    this.inputNodeMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            radius: this.outerRadius,
            feather: feather,
            texture: this.renderer.texture,
            textureSize: this.renderer.textureSize,
            bgColor: this.inputBgColor
        },
        vertexShader: ShaderManager.get("src/shaders/componentnode.vert"),
        fragmentShader: ShaderManager.get("src/shaders/componentnode.frag"),
        side: THREE.DoubleSide
    });
    this.inputNodeMaterial.transparent = true;

    scene.add(new THREE.Mesh(this.switchGeometry, this.componentSwitchMaterial));
    scene.add(new THREE.Mesh(this.outputNodeGeometry, this.outputNodeMaterial));
    scene.add(new THREE.Mesh(this.inputNodeGeometry, this.inputNodeMaterial));

    this.batterySymbolMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather
        },
        vertexShader: ShaderManager.get("src/shaders/batterysymbol.vert"),
        fragmentShader: ShaderManager.get("src/shaders/batterysymbol.frag"),
        side: THREE.DoubleSide
    });
    this.batterySymbolMaterial.transparent = true;

    scene.add(new THREE.Mesh(this.batterySymbolGeometry, this.batterySymbolMaterial));

    this.diodeSymbolMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            border: { value: Component.border }
        },
        vertexShader: ShaderManager.get("src/shaders/diodesymbol.vert"),
        fragmentShader: ShaderManager.get("src/shaders/diodesymbol.frag"),
        side: THREE.DoubleSide
    });
    this.diodeSymbolMaterial.transparent = true;

    scene.add(new THREE.Mesh(this.diodeSymbolGeometry, this.diodeSymbolMaterial));
};

ComponentRenderer.prototype.addOutputNode = function addOutputNode(breadboard, p)
{
    var index = this.outputNodes.index * 12;
    var textureIndex = breadboard.renderer.textureSize.value;
    breadboard.renderer.textureSize.value += 1;
    this.addPositionAndTextureIndex(this.outputNodes.p, index, p, textureIndex);
    this.outputNodes.index += 1;
    return textureIndex;
};

ComponentRenderer.prototype.addNode = function addNode(breadboard, nodeType, p, id)
{
    var index = nodeType.index * 12;
    var textureIndex = this.getWireTextureIndex(breadboard, id, p);
    this.addPositionAndTextureIndex(nodeType.p, index, p, textureIndex);
    nodeType.index += 1;
};

ComponentRenderer.prototype.getWireTextureIndex = function getWireTextureIndex(breadboard, id, p)
{
    var connection = breadboard.getConnection(id);
    var textureIndex = 0;
    if (connection.wires.length > 0)
    {
        var wire = connection.wires[0];
        textureIndex = wire.texture0 + Math.max(Math.abs(wire.x0 - p[0]), Math.abs(wire.y0 - p[1]));
    }
    return textureIndex;
};

ComponentRenderer.prototype.addPosition = function addPosition(data, index, p)
{
    data[index + 0] = p[0];
    data[index + 1] = p[1];
    data[index + 2] = p[0];
    data[index + 3] = p[1];
    data[index + 4] = p[0];
    data[index + 5] = p[1];
    data[index + 6] = p[0];
    data[index + 7] = p[1];
};

ComponentRenderer.prototype.addPositionAndTextureIndex = function addPositionAndTextureIndex(data, index, p, textureIndex)
{
    data[index + 0]  = p[0];
    data[index + 1]  = p[1];
    data[index + 2]  = textureIndex;
    data[index + 3]  = p[0];
    data[index + 4]  = p[1];
    data[index + 5]  = textureIndex;
    data[index + 6]  = p[0];
    data[index + 7]  = p[1];
    data[index + 8]  = textureIndex;
    data[index + 9]  = p[0];
    data[index + 10] = p[1];
    data[index + 11] = textureIndex;
};

ComponentRenderer.prototype.addTextureIndex = function addTextureIndex(data, index, textureIndex)
{
    data[index + 0] = textureIndex;
    data[index + 1] = textureIndex;
    data[index + 2] = textureIndex;
    data[index + 3] = textureIndex;
};

ComponentRenderer.prototype.updateGeometry = function updateGeometry(components, breadboard)
{
    this.switches.count = 0;
    this.switches.index = 0;

    this.outputNodes.count = 0;
    this.outputNodes.index = 0;

    this.inputNodes.count = 0;
    this.inputNodes.index = 0;

    this.batterySymbols.count = 0;
    this.batterySymbols.index = 0;

    this.diodeSymbols.count = 0;
    this.diodeSymbols.index = 0;

    var numComponents = components.length;

    var i;
    for (i = 0; i < numComponents; i += 1)
    {
        var component = components[i];
        component.prepareGeometry(this);
    }

    this.switches.base = new Int16Array(this.switches.count * 12);
    this.switches.p0 = new Int16Array(this.switches.count * 12);
    this.switches.p1 = new Int16Array(this.switches.count * 12);
    this.switches.signal = new Int16Array(this.switches.count * 4);

    this.outputNodes.p = new Int16Array(this.outputNodes.count * 12);
    this.inputNodes.p = new Int16Array(this.inputNodes.count * 12);

    this.batterySymbols.p0 = new Int16Array(this.batterySymbols.count * 8);
    this.batterySymbols.p1 = new Int16Array(this.batterySymbols.count * 8);

    this.diodeSymbols.p0 = new Int16Array(this.diodeSymbols.count * 8);
    this.diodeSymbols.p1 = new Int16Array(this.diodeSymbols.count * 8);

    var index = 0;
    for (i = 0; i < numComponents; i += 1)
    {
        var component = components[i];
        var connections = component.addGeometry(this, breadboard);
    }

    var switchGeometry = this.switchGeometry;
    switchGeometry.addAttribute('base', new THREE.BufferAttribute(this.switches.base, 3));
    switchGeometry.addAttribute('p0', new THREE.BufferAttribute(this.switches.p0, 3));
    switchGeometry.addAttribute('p1', new THREE.BufferAttribute(this.switches.p1, 3));
    switchGeometry.addAttribute('signal', new THREE.BufferAttribute(this.switches.signal, 1));
    switchGeometry.setDrawRange(0, 6 * this.switches.count);

    var outputNodeGeometry = this.outputNodeGeometry;
    outputNodeGeometry.addAttribute('circle', new THREE.BufferAttribute(this.outputNodes.p, 3));
    outputNodeGeometry.setDrawRange(0, 6 * this.outputNodes.count);

    var inputNodeGeometry = this.inputNodeGeometry;
    inputNodeGeometry.addAttribute('circle', new THREE.BufferAttribute(this.inputNodes.p, 3));
    inputNodeGeometry.setDrawRange(0, 6 * this.inputNodes.count);

    var batterySymbolGeometry = this.batterySymbolGeometry;
    batterySymbolGeometry.addAttribute('p0', new THREE.BufferAttribute(this.batterySymbols.p0, 2));
    batterySymbolGeometry.addAttribute('p1', new THREE.BufferAttribute(this.batterySymbols.p1, 2));
    batterySymbolGeometry.setDrawRange(0, 6 * this.batterySymbols.count);

    var diodeSymbolGeometry = this.diodeSymbolGeometry;
    diodeSymbolGeometry.addAttribute('p0', new THREE.BufferAttribute(this.diodeSymbols.p0, 2));
    diodeSymbolGeometry.addAttribute('p1', new THREE.BufferAttribute(this.diodeSymbols.p1, 2));
    diodeSymbolGeometry.setDrawRange(0, 6 * this.diodeSymbols.count);
};
