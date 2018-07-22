
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

    var wireGeometry = this.wireGeometry = new THREE.BufferGeometry();
    wireGeometry.setIndex(indices);
    wireGeometry.addAttribute('position', new THREE.BufferAttribute(verticesArray, 2));
    wireGeometry.boundingSphere = new THREE.Sphere();
    wireGeometry.boundingSphere.radius = 99999;

    var maxNumWiresCircles = maxNumWires * 2;
    var circleIndicesArray = new Uint16Array(maxNumWiresCircles * 6);
    var circleVerticesArray = new Uint8Array(maxNumWiresCircles * 8);
    for (i = 0; i < maxNumWiresCircles; i += 1)
    {
        index = i * 6;
        vertexIndex = i * 4;
        circleIndicesArray[index + 0] = vertexIndex + 0;
        circleIndicesArray[index + 1] = vertexIndex + 1;
        circleIndicesArray[index + 2] = vertexIndex + 2;
        circleIndicesArray[index + 3] = vertexIndex + 2;
        circleIndicesArray[index + 4] = vertexIndex + 3;
        circleIndicesArray[index + 5] = vertexIndex + 0;

        vertex = i * 8;
        circleVerticesArray[vertex + 0] = 0;
        circleVerticesArray[vertex + 1] = 0;
        circleVerticesArray[vertex + 2] = 1;
        circleVerticesArray[vertex + 3] = 0;
        circleVerticesArray[vertex + 4] = 1;
        circleVerticesArray[vertex + 5] = 1;
        circleVerticesArray[vertex + 6] = 0;
        circleVerticesArray[vertex + 7] = 1;
    }

    var circleIndices = new THREE.BufferAttribute(circleIndicesArray, 1);

    var circleGeometry = this.circleGeometry = new THREE.BufferGeometry();
    circleGeometry.setIndex(circleIndices);
    circleGeometry.addAttribute('position', new THREE.BufferAttribute(circleVerticesArray, 2));
    circleGeometry.boundingSphere = new THREE.Sphere();
    circleGeometry.boundingSphere.radius = 99999;

    this.textureSize = {value : 0};
    this.texture = {value : null};
}

WireRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    var wireVertexShader = ShaderManager.get("src/shaders/wire.vert");
    var wireCirclesVertexShader = ShaderManager.get("src/shaders/wirecirclesshader.vert");
    var wireCirclesFragmentShader = ShaderManager.get("src/shaders/wirecirclesshader.frag");

    this.wireCirclesBgMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            radius: { value: 0.19 },
            fg: { value: 0.0 },
            texture: this.texture,
            textureSize: this.textureSize
        },
        vertexShader: wireCirclesVertexShader,
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
            radius: { value: 0.14 },
            fg: { value: 1.0 },
            texture: this.texture,
            textureSize: this.textureSize
        },
        vertexShader: wireCirclesVertexShader,
        fragmentShader: wireCirclesFragmentShader,
        side: THREE.DoubleSide
    });
    this.wireCirclesFgMaterial.transparent = true;

    scene.add(new THREE.Mesh(this.circleGeometry, this.wireCirclesBgMaterial));
    scene.add(new THREE.Mesh(this.wireGeometry,   this.wireMaterial));
    scene.add(new THREE.Mesh(this.circleGeometry, this.wireCirclesFgMaterial));
};

WireRenderer.prototype.updateGeometry = function updateGeometry(wires, breadboard)
{
    var numWires = wires.length;

    var p1s = new Int16Array(numWires * 12);
    var p2s = new Int16Array(numWires * 12);

    var circlesMap = {};
    var numCircles = 0;
    var wire;
    function wireIterate(x, y, index)
    {
        var id = breadboard.getIndex(x, y);
        var connection = breadboard.getConnection(id);
        if (connection.hasDot)
        {
            if (!circlesMap.hasOwnProperty(id))
            {
                circlesMap[id] = wire;
                numCircles += 1;
            }
        }
    }

    var wireValueIndex = 1;
    var i;
    var index;
    var circlesIndex = 0;
    for (i = 0; i < numWires; i += 1)
    {
        wire = wires[i];
        wire.iterate(wireIterate);
    }

    for (i = 0; i < numWires; i += 1)
    {
        index = i * 12;
        wire = wires[i];

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

        wireValueIndex += 1;
    }

    var circles = new Int16Array(numCircles * 12);
    var id;
    for (id in circlesMap)
    {
        wire = circlesMap[id];
        var p = breadboard.getPositionFromIndex(id);

        var dist = Math.abs(p[0] - wire.x0) + Math.abs(p[1] - wire.y1);
        var texture = wire.texture0 + dist;

        circles[circlesIndex + 0]  = p[0];
        circles[circlesIndex + 1]  = p[1];
        circles[circlesIndex + 2]  = texture;
        circles[circlesIndex + 3]  = p[0];
        circles[circlesIndex + 4]  = p[1];
        circles[circlesIndex + 5]  = texture;
        circles[circlesIndex + 6]  = p[0];
        circles[circlesIndex + 7]  = p[1];
        circles[circlesIndex + 8]  = texture;
        circles[circlesIndex + 9]  = p[0];
        circles[circlesIndex + 10] = p[1];
        circles[circlesIndex + 11] = texture;
        circlesIndex += 12;
    }

    var textureSize = wireValueIndex;
    var textureData = this.textureData = new Uint8Array(textureSize);
    for (i = 0; i < textureSize; i += 1)
    {
        textureData[i] = 0;
    }
    var dataTexture = this.dataTexture = new THREE.DataTexture(textureData, textureSize, 1, THREE.LuminanceFormat, THREE.UnsignedByteType);
    dataTexture.magFilter = THREE.NearestFilter;
    dataTexture.needsUpdate = true;

    this.texture.value = dataTexture;
    this.textureSize.value = textureSize;

    var wireGeometry = this.wireGeometry;
    wireGeometry.addAttribute('p1', new THREE.BufferAttribute(p1s, 3));
    wireGeometry.addAttribute('p2', new THREE.BufferAttribute(p2s, 3));
    wireGeometry.setDrawRange(0, 6 * numWires);

    var circleGeometry = this.circleGeometry;
    circleGeometry.addAttribute('circle', new THREE.BufferAttribute(circles, 3));
    circleGeometry.setDrawRange(0, 6 * numCircles);
};
