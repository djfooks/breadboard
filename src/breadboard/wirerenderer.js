
function WireRenderer()
{
    var maxNumWires = 10000;
    var indicesArray = new Uint16Array(maxNumWires * 6);
    var verticesArray = new Uint8Array(maxNumWires * 8);
    var i;
    var index;
    var vertexIndex;
    var vertex;
    for (i = 0; i < maxNumWires; i += 1)
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

    var geometry = this.geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.addAttribute('position', new THREE.BufferAttribute(verticesArray, 2));
    geometry.boundingSphere = new THREE.Sphere();
    geometry.boundingSphere.radius = 99999;

    this.textureSize = {value : 0};
    this.texture = {value : null};
}

WireRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    var wireVertexShader = ShaderManager.get("src/shaders/wire.vert");
    var wireCirclesFragmentShader = ShaderManager.get("src/shaders/wirecirclesshader.frag");

    this.wireCirclesBgMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            radius: { value: 0.4 },
            fg: { value: 0.0 },
            texture: this.texture,
            textureSize: this.textureSize
        },
        vertexShader: wireVertexShader,
        fragmentShader: wireCirclesFragmentShader,
        side: THREE.DoubleSide
    });
    this.wireCirclesBgMaterial.transparent = true;

    this.wireMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            texture: this.texture,
            textureSize: this.textureSize,
        },
        vertexShader: wireVertexShader,
        fragmentShader: ShaderManager.get("src/shaders/wire.frag"),
        side: THREE.DoubleSide
    });
    this.wireMaterial.transparent = true;

    this.wireCirclesFgMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            radius: { value: 0.35 },
            fg: { value: 1.0 },
            texture: this.texture,
            textureSize: this.textureSize
        },
        vertexShader: wireVertexShader,
        fragmentShader: wireCirclesFragmentShader,
        side: THREE.DoubleSide
    });
    this.wireCirclesFgMaterial.transparent = true;

    var geometry = this.geometry;
    scene.add(new THREE.Mesh(geometry, this.wireCirclesBgMaterial));
    scene.add(new THREE.Mesh(geometry, this.wireMaterial));
    scene.add(new THREE.Mesh(geometry, this.wireCirclesFgMaterial));
};

WireRenderer.prototype.updateGeometry = function updateGeometry(wires)
{
    var numWires = wires.length;

    var p1s = new Int16Array(numWires * 12);
    var p2s = new Int16Array(numWires * 12);

    var wireValueIndex = 0;
    var i;
    var index;
    for (i = 0; i < numWires; i += 1)
    {
        index = i * 12;
        var wire = wires[i];

        var wireLength = Math.max(Math.abs(wire.x0 - wire.x1),
                                  Math.abs(wire.y0 - wire.y1));
        var texture0 = wire.texture0 = wireValueIndex;
        wireValueIndex += wireLength;
        var texture1 = wire.texture1 = wireValueIndex;

        p1s[index + 0]  = wire.x0;
        p1s[index + 1]  = wire.y0;
        p1s[index + 2]  = texture0;
        p1s[index + 3]  = wire.x0;
        p1s[index + 4]  = wire.y0;
        p1s[index + 5]  = texture0;
        p1s[index + 6]  = wire.x0;
        p1s[index + 7]  = wire.y0;
        p1s[index + 8]  = texture0;
        p1s[index + 9]  = wire.x0;
        p1s[index + 10] = wire.y0;
        p1s[index + 11] = texture0;

        p2s[index + 0]  = wire.x1;
        p2s[index + 1]  = wire.y1;
        p2s[index + 2]  = texture1;
        p2s[index + 3]  = wire.x1;
        p2s[index + 4]  = wire.y1;
        p2s[index + 5]  = texture1;
        p2s[index + 6]  = wire.x1;
        p2s[index + 7]  = wire.y1;
        p2s[index + 8]  = texture1;
        p2s[index + 9]  = wire.x1;
        p2s[index + 10] = wire.y1;
        p2s[index + 11] = texture1;
    }

    var textureSize = wireValueIndex;
    var textureData = this.textureData = new Uint8Array(textureSize);
    for (i = 0; i < textureSize; i += 1)
    {
        textureData[i] = 255;
    }
    var dataTexture = this.dataTexture = new THREE.DataTexture(textureData, textureSize, 1, THREE.LuminanceFormat, THREE.UnsignedByteType);
    dataTexture.magFilter = THREE.NearestFilter;
    dataTexture.needsUpdate = true;

    this.texture.value = dataTexture;
    this.textureSize.value = textureSize;

    var geometry = this.geometry;
    geometry.addAttribute('p1', new THREE.BufferAttribute(p1s, 3));
    geometry.addAttribute('p2', new THREE.BufferAttribute(p2s, 3));
    geometry.setDrawRange(0, 6 * numWires);
};
