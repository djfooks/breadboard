
function ComponentRenderer(renderer)
{
    this.renderer = renderer;

    this.textRenderer = new TextRenderer(renderer);

    this.dynamicTextRenderer = new TextRenderer(renderer);

    this.switchGeometry = renderer.createQuadGeometry();
    this.outputNodeGeometry = renderer.createQuadGeometry();
    this.inputNodeGeometry = renderer.createQuadGeometry();
    this.busNodeGeometry = renderer.createQuadGeometry();

    this.batterySymbolGeometry = renderer.createQuadGeometry();
    this.diodeSymbolGeometry = renderer.createQuadGeometry();
    this.freezerSymbolGeometry = renderer.createQuadGeometry();

    this.innerRadius = { value: 0.26 };
    this.outerRadius = { value: 0.31 };
    this.width = { value: 0.01 };
    this.inputBgColor = ColorPalette.createRGBColor(ColorPalette.base.inputNode);
    this.outputBgColor = ColorPalette.createRGBColor(ColorPalette.base.outputNode);

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

    this.busNodes = {
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

    this.freezerSymbols = {
        count: 0,
        index: 0,
        p0: null,
        p1: null
    };
}

ComponentRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    this.textRenderer.addMeshes(scene, feather);
    this.dynamicTextRenderer.addMeshes(scene, feather);

    this.componentSwitchMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            radius: this.outerRadius,
            feather: feather,
            texture: this.renderer.texture,
            textureDimensions: this.renderer.textureDimensions,
            bgColor: this.outputBgColor
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
            textureDimensions: this.renderer.textureDimensions,
            bgColor: this.outputBgColor
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
            textureDimensions: this.renderer.textureDimensions,
            bgColor: this.inputBgColor
        },
        vertexShader: ShaderManager.get("src/shaders/componentnode.vert"),
        fragmentShader: ShaderManager.get("src/shaders/componentnode.frag"),
        side: THREE.DoubleSide
    });
    this.inputNodeMaterial.transparent = true;

    this.busNodeMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            bgColor: this.outputBgColor
        },
        vertexShader: ShaderManager.get("src/shaders/busnode.vert"),
        fragmentShader: ShaderManager.get("src/shaders/busnode.frag"),
        side: THREE.DoubleSide
    });
    this.busNodeMaterial.transparent = true;

    scene.add(new THREE.Mesh(this.switchGeometry, this.componentSwitchMaterial));
    scene.add(new THREE.Mesh(this.outputNodeGeometry, this.outputNodeMaterial));
    scene.add(new THREE.Mesh(this.inputNodeGeometry, this.inputNodeMaterial));
    scene.add(new THREE.Mesh(this.busNodeGeometry, this.busNodeMaterial));

    this.batterySymbolMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            bgColor: this.outputBgColor
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
            border: { value: Component.border },
            bgColor: this.outputBgColor
        },
        vertexShader: ShaderManager.get("src/shaders/diodesymbol.vert"),
        fragmentShader: ShaderManager.get("src/shaders/diodesymbol.frag"),
        side: THREE.DoubleSide
    });
    this.diodeSymbolMaterial.transparent = true;

    scene.add(new THREE.Mesh(this.diodeSymbolGeometry, this.diodeSymbolMaterial));

    this.freezerSymbolMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            time: this.renderer.time,
            feather: feather,
            bgColor: this.outputBgColor
        },
        vertexShader: ShaderManager.get("src/shaders/freezersymbol.vert"),
        fragmentShader: ShaderManager.get("src/shaders/freezersymbol.frag"),
        side: THREE.DoubleSide
    });
    this.freezerSymbolMaterial.transparent = true;

    scene.add(new THREE.Mesh(this.freezerSymbolGeometry, this.freezerSymbolMaterial));
};

ComponentRenderer.prototype.addOutputNode = function addOutputNode(breadboard, p, isTray)
{
    var index = this.outputNodes.index * 16;
    // TODO test if there is a wire index here we could reuse before increasing size of texture
    var textureIndex = this.getNextTextureIndex(breadboard, isTray);
    this.addPositionAndTextureIndex(this.outputNodes.p, index, p, textureIndex);
    this.outputNodes.index += 1;
    return textureIndex;
};

ComponentRenderer.prototype.addNode = function addNode(breadboard, nodeType, p, id, isTray)
{
    var index = nodeType.index * 16;
    var textureIndex = this.getWireTextureIndex(breadboard, id, p, isTray);
    this.addPositionAndTextureIndex(nodeType.p, index, p, textureIndex);
    nodeType.index += 1;
    return textureIndex;
};

ComponentRenderer.prototype.getWireTextureIndex = function getWireTextureIndex(breadboard, id, p, isTray)
{
    if (isTray)
    {
        return 0;
    }

    var connection = breadboard.getConnection(id);
    var textureIndex = 0;
    if (connection.wires.length > 0)
    {
        var wire = connection.wires[0];
        textureIndex = wire.texture0 + Math.max(Math.abs(wire.x0 - p[0]), Math.abs(wire.y0 - p[1]));
    }
    return textureIndex;
};

ComponentRenderer.prototype.getNextTextureIndex = function getNextTextureIndex(breadboard, isTray)
{
    if (isTray)
    {
        return 0;
    }
    else
    {
        var result = breadboard.gameRenderer.textureSize;
        breadboard.gameRenderer.textureSize += 1;
        return result;
    }
}

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
    var textureX = GameRenderer.getValueTextureIndexX(textureIndex);
    var textureY = GameRenderer.getValueTextureIndexY(textureIndex);
    data[index + 0]  = p[0];
    data[index + 1]  = p[1];
    data[index + 2]  = textureX;
    data[index + 3]  = textureY;
    data[index + 4]  = p[0];
    data[index + 5]  = p[1];
    data[index + 6]  = textureX;
    data[index + 7]  = textureY;
    data[index + 8]  = p[0];
    data[index + 9]  = p[1];
    data[index + 10] = textureX;
    data[index + 11] = textureY;
    data[index + 12] = p[0];
    data[index + 13] = p[1];
    data[index + 14] = textureX;
    data[index + 15] = textureY;
};

ComponentRenderer.prototype.addTextureIndex = function addTextureIndex(data, index, textureIndex)
{
    var textureX = GameRenderer.getValueTextureIndexX(textureIndex);
    var textureY = GameRenderer.getValueTextureIndexY(textureIndex);
    data[index + 0] = textureX;
    data[index + 1] = textureY;
    data[index + 2] = textureX;
    data[index + 3] = textureY;
    data[index + 4] = textureX;
    data[index + 5] = textureY;
    data[index + 6] = textureX;
    data[index + 7] = textureY;
};

ComponentRenderer.prototype.addText = function addText()
{
    this.textRenderer.addText.apply(this.textRenderer, arguments);
};

ComponentRenderer.prototype.addDynamicText = function addDynamicText()
{
    this.dynamicTextRenderer.addText.apply(this.dynamicTextRenderer, arguments);
};

ComponentRenderer.prototype.updateDynamicGeometry = function updateDynamicGeometry(components, breadboard, isTray)
{
    this.dynamicTextRenderer.clearGeometry();

    var numComponents = components.length;

    var i;
    var component;
    for (i = 0; i < numComponents; i += 1)
    {
        component = components[i];
        component.dynamicPrepareGeometry(this);
    }

    this.dynamicTextRenderer.allocateGeometry();

    var index = 0;
    for (i = 0; i < numComponents; i += 1)
    {
        component = components[i];
        component.dynamicAddGeometry(this, breadboard, isTray);
    }

    this.dynamicTextRenderer.updateGeometry();
};

ComponentRenderer.prototype.updateGeometry = function updateGeometry(components, breadboard, isTray)
{
    this.textRenderer.clearGeometry();

    this.switches.count = 0;
    this.switches.index = 0;

    this.outputNodes.count = 0;
    this.outputNodes.index = 0;

    this.inputNodes.count = 0;
    this.inputNodes.index = 0;

    this.busNodes.count = 0;
    this.busNodes.index = 0;

    this.batterySymbols.count = 0;
    this.batterySymbols.index = 0;

    this.diodeSymbols.count = 0;
    this.diodeSymbols.index = 0;

    this.freezerSymbols.count = 0;
    this.freezerSymbols.index = 0;

    var numComponents = components.length;

    var i;
    var component;
    for (i = 0; i < numComponents; i += 1)
    {
        component = components[i];
        component.prepareGeometry(this);
    }

    this.textRenderer.allocateGeometry();

    this.switches.base = new Int16Array(this.switches.count * 16);
    this.switches.p0 = new Int16Array(this.switches.count * 16);
    this.switches.p1 = new Int16Array(this.switches.count * 16);
    this.switches.signal = new Int16Array(this.switches.count * 8);

    this.outputNodes.p = new Int16Array(this.outputNodes.count * 16);
    this.inputNodes.p = new Int16Array(this.inputNodes.count * 16);
    this.busNodes.p = new Int16Array(this.busNodes.count * 8);

    this.batterySymbols.p0 = new Int16Array(this.batterySymbols.count * 8);
    this.batterySymbols.p1 = new Int16Array(this.batterySymbols.count * 8);

    this.diodeSymbols.p0 = new Int16Array(this.diodeSymbols.count * 8);
    this.diodeSymbols.p1 = new Int16Array(this.diodeSymbols.count * 8);

    this.freezerSymbols.p0 = new Int16Array(this.freezerSymbols.count * 8);
    this.freezerSymbols.p1 = new Int16Array(this.freezerSymbols.count * 8);

    var index = 0;
    for (i = 0; i < numComponents; i += 1)
    {
        component = components[i];
        component.addGeometry(this, breadboard, isTray);
    }

    if (this.switches.count       != this.switches.index)       { throw new Error("switches.count invalid"); }
    if (this.outputNodes.count    != this.outputNodes.index)    { throw new Error("outputNodes.count invalid"); }
    if (this.inputNodes.count     != this.inputNodes.index)     { throw new Error("inputNodes.count invalid"); }
    if (this.busNodes.count       != this.busNodes.index)       { throw new Error("busNodes.count invalid"); }
    if (this.batterySymbols.count != this.batterySymbols.index) { throw new Error("batterySymbols.count invalid"); }
    if (this.diodeSymbols.count   != this.diodeSymbols.index)   { throw new Error("diodeSymbols.count invalid"); }
    if (this.freezerSymbols.count != this.freezerSymbols.index) { throw new Error("freezerSymbols.count invalid"); }

    this.textRenderer.updateGeometry();

    var switchGeometry = this.switchGeometry;
    switchGeometry.addAttribute('base', new THREE.BufferAttribute(this.switches.base, 4));
    switchGeometry.addAttribute('p0', new THREE.BufferAttribute(this.switches.p0, 4));
    switchGeometry.addAttribute('p1', new THREE.BufferAttribute(this.switches.p1, 4));
    switchGeometry.addAttribute('signal', new THREE.BufferAttribute(this.switches.signal, 2));
    switchGeometry.setDrawRange(0, 6 * this.switches.count);

    var outputNodeGeometry = this.outputNodeGeometry;
    outputNodeGeometry.addAttribute('circle', new THREE.BufferAttribute(this.outputNodes.p, 4));
    outputNodeGeometry.setDrawRange(0, 6 * this.outputNodes.count);

    var inputNodeGeometry = this.inputNodeGeometry;
    inputNodeGeometry.addAttribute('circle', new THREE.BufferAttribute(this.inputNodes.p, 4));
    inputNodeGeometry.setDrawRange(0, 6 * this.inputNodes.count);

    var busNodeGeometry = this.busNodeGeometry;
    busNodeGeometry.addAttribute('p0', new THREE.BufferAttribute(this.busNodes.p, 2));
    busNodeGeometry.setDrawRange(0, 6 * this.busNodes.count);

    var batterySymbolGeometry = this.batterySymbolGeometry;
    batterySymbolGeometry.addAttribute('p0', new THREE.BufferAttribute(this.batterySymbols.p0, 2));
    batterySymbolGeometry.addAttribute('p1', new THREE.BufferAttribute(this.batterySymbols.p1, 2));
    batterySymbolGeometry.setDrawRange(0, 6 * this.batterySymbols.count);

    var diodeSymbolGeometry = this.diodeSymbolGeometry;
    diodeSymbolGeometry.addAttribute('p0', new THREE.BufferAttribute(this.diodeSymbols.p0, 2));
    diodeSymbolGeometry.addAttribute('p1', new THREE.BufferAttribute(this.diodeSymbols.p1, 2));
    diodeSymbolGeometry.setDrawRange(0, 6 * this.diodeSymbols.count);

    var freezerSymbolGeometry = this.freezerSymbolGeometry;
    freezerSymbolGeometry.addAttribute('p0', new THREE.BufferAttribute(this.freezerSymbols.p0, 2));
    freezerSymbolGeometry.addAttribute('p1', new THREE.BufferAttribute(this.freezerSymbols.p1, 2));
    freezerSymbolGeometry.setDrawRange(0, 6 * this.freezerSymbols.count);
};
