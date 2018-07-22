
function ComponentNodeRenderer()
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

    var nodeGeometry = this.nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setIndex(indices);
    nodeGeometry.addAttribute('position', new THREE.BufferAttribute(verticesArray, 2));
    nodeGeometry.boundingSphere = new THREE.Sphere();
    nodeGeometry.boundingSphere.radius = 99999;

    var inputNodeGeometry = this.inputNodeGeometry = new THREE.BufferGeometry();
    inputNodeGeometry.setIndex(indices);
    inputNodeGeometry.addAttribute('position', new THREE.BufferAttribute(verticesArray, 2));
    inputNodeGeometry.boundingSphere = new THREE.Sphere();
    inputNodeGeometry.boundingSphere.radius = 99999;

    this.radius = { value: 0.3 };
    this.width = { value: 0.01 };
    this.color = { value: new THREE.Vector3(0.0, 0.0, 0.0)};
    this.inputColor = { value: new THREE.Vector3(0.0, 1.0, 0.0)};
}

ComponentNodeRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    this.componentNodeMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            radius: this.radius,
            width: this.width,
            color: this.color
        },
        vertexShader: ShaderManager.get("src/shaders/componentnode.vert"),
        fragmentShader: ShaderManager.get("src/shaders/componentnode.frag"),
        side: THREE.DoubleSide
    });
    this.componentNodeMaterial.transparent = true;

    this.componentInputNodeMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            radius: this.radius,
            width: this.width,
            color: this.inputColor
        },
        vertexShader: ShaderManager.get("src/shaders/componentnode.vert"),
        fragmentShader: ShaderManager.get("src/shaders/componentnode.frag"),
        side: THREE.DoubleSide
    });
    this.componentInputNodeMaterial.transparent = true;

    scene.add(new THREE.Mesh(this.nodeGeometry, this.componentNodeMaterial));
    //scene.add(new THREE.Mesh(this.inputNodeGeometry, this.componentInputNodeMaterial));
};

ComponentNodeRenderer.prototype.addWireTexture = function addWireTexture(wireRenderer)
{
    this.componentNodeMaterial.uniforms.textureSize = wireRenderer.textureSize;
    this.componentNodeMaterial.uniforms.texture = wireRenderer.texture;

    this.componentInputNodeMaterial.uniforms.textureSize = wireRenderer.textureSize;
    this.componentInputNodeMaterial.uniforms.texture = wireRenderer.texture;
};

ComponentNodeRenderer.prototype.updateGeometry = function updateGeometry(components, breadboard)
{
    var numComponents = components.length;

    var numNodes = 0;
    var numInputNodes = 0;
    var i;
    var j;
    for (i = 0; i < numComponents; i += 1)
    {
        var component = components[i];
        numNodes += component.getConnections(breadboard).length;
    }

    var circles = new Int16Array(numNodes * 12);

    var index = 0;
    for (i = 0; i < numComponents; i += 1)
    {
        var component = components[i];
        var connections = component.getConnections(breadboard);
        for (j = 0; j < connections.length; j += 1)
        {
            var id = connections[j];
            var q = breadboard.getPositionFromIndex(id);

            var connection = breadboard.getConnection(id);
            var textureIndex = 0;
            if (connection.wires.length > 0)
            {
                var wire = connection.wires[0];
                textureIndex = wire.texture0 + Math.abs(wire.x0 - q[0]) + Math.abs(wire.y0 - q[1]);
            }

            circles[index + 0]  = q[0];
            circles[index + 1]  = q[1];
            circles[index + 2]  = textureIndex;
            circles[index + 3]  = q[0];
            circles[index + 4]  = q[1];
            circles[index + 5]  = textureIndex;
            circles[index + 6]  = q[0];
            circles[index + 7]  = q[1];
            circles[index + 8]  = textureIndex;
            circles[index + 9]  = q[0];
            circles[index + 10] = q[1];
            circles[index + 11] = textureIndex;

            index += 12;
        }
    }

    var nodeGeometry = this.nodeGeometry;
    nodeGeometry.addAttribute('circle', new THREE.BufferAttribute(circles, 3));
    nodeGeometry.setDrawRange(0, 6 * numNodes);
};
