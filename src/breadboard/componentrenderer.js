
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
        verticesArray[vertex + 0] = 0;
        verticesArray[vertex + 1] = 0;
        verticesArray[vertex + 2] = 1;
        verticesArray[vertex + 3] = 0;
        verticesArray[vertex + 4] = 1;
        verticesArray[vertex + 5] = 1;
        verticesArray[vertex + 6] = 0;
        verticesArray[vertex + 7] = 1;
    }

    var indices = new THREE.BufferAttribute(indicesArray, 1);

    var switchGeometry = this.switchGeometry = new THREE.BufferGeometry();
    switchGeometry.setIndex(indices);
    switchGeometry.addAttribute('position', new THREE.BufferAttribute(verticesArray, 2));
    switchGeometry.boundingSphere = new THREE.Sphere();
    switchGeometry.boundingSphere.radius = 99999;

    this.innerRadius = { value: 0.26 };
    this.outerRadius = { value: 0.31 };
    this.width = { value: 0.01 };
    this.color = { value: new THREE.Vector3(0.0, 0.0, 0.0)};
    this.inputColor = { value: new THREE.Vector3(0.0, 1.0, 0.0)};

    this.switches = {
        count: 0,
        index: 0,
        base: null,
        p0: null,
        p1: null,
        signal: null,
    };
}

ComponentRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    this.componentSwitchMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            radius: this.outerRadius,
            width: this.width,
            fg: { value: 0.0 },
            texture: this.renderer.texture,
            textureSize: this.renderer.textureSize
        },
        vertexShader: ShaderManager.get("src/shaders/componentswitch.vert"),
        fragmentShader: ShaderManager.get("src/shaders/componentswitch.frag"),
        side: THREE.DoubleSide
    });
    this.componentSwitchMaterial.transparent = true;

    scene.add(new THREE.Mesh(this.switchGeometry, this.componentSwitchMaterial));
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
};
