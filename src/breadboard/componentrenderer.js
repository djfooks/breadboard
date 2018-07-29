
function ComponentRenderer()
{
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
        circle0: null,
        circle1: null,
        connected: null,
    };
}

ComponentRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    this.componentSwitchMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            radius: this.outerRadius,
            width: this.width,
            fg: { value: 0.0 }
        },
        vertexShader: ShaderManager.get("src/shaders/componentswitch.vert"),
        fragmentShader: ShaderManager.get("src/shaders/componentswitch.frag"),
        side: THREE.DoubleSide
    });
    this.componentSwitchMaterial.transparent = true;

    scene.add(new THREE.Mesh(this.switchGeometry, this.componentSwitchMaterial));
};

ComponentRenderer.prototype.addWireTexture = function addWireTexture(wireRenderer)
{
    this.componentSwitchMaterial.uniforms.textureSize = wireRenderer.textureSize;
    this.componentSwitchMaterial.uniforms.texture = wireRenderer.texture;
};

ComponentRenderer.prototype.updateGeometry = function updateGeometry(components, breadboard)
{
    this.switches.count = 0;
    var numComponents = components.length;

    var i;
    for (i = 0; i < numComponents; i += 1)
    {
        var component = components[i];
        component.prepareGeometry(this);
    }

    this.switches.circle0 = new Int16Array(this.switches.count * 12);
    this.switches.circle0Index = 0;
    this.switches.circle1 = new Int16Array(this.switches.count * 12);
    this.switches.circle1Index = 0;
    this.switches.connected = new Int16Array(this.switches.count * 4);
    this.switches.connectedIndex = 0;

    var index = 0;
    for (i = 0; i < numComponents; i += 1)
    {
        var component = components[i];
        var connections = component.addGeometry(this, breadboard);
    }

    var switchGeometry = this.switchGeometry;
    switchGeometry.addAttribute('circle0', new THREE.BufferAttribute(this.switches.circle0, 3));
    switchGeometry.addAttribute('circle1', new THREE.BufferAttribute(this.switches.circle1, 3));
    switchGeometry.addAttribute('connected', new THREE.BufferAttribute(this.switches.connected, 1));
    switchGeometry.setDrawRange(0, 6 * this.switches.count);
};
