
function WireRenderer(renderer)
{
    this.renderer = renderer;

    this.wireGeometry = renderer.createQuadGeometry();
    this.circleGeometry = renderer.createQuadGeometry();
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
            texture: this.renderer.texture,
            textureSize: this.renderer.textureSize
        },
        vertexShader: wireCirclesVertexShader,
        fragmentShader: wireCirclesFragmentShader,
        side: THREE.DoubleSide
    });
    this.wireCirclesBgMaterial.transparent = true;

    this.wireMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            texture: this.renderer.texture,
            textureSize: this.renderer.textureSize
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
            texture: this.renderer.texture,
            textureSize: this.renderer.textureSize
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

WireRenderer.prototype.updateGeometry = function updateGeometry(wires, breadboard, isTray, hasDotFn)
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
        var hasDot = hasDotFn(id, x, y);
        if (hasDot)
        {
            if (!circlesMap.hasOwnProperty(id))
            {
                circlesMap[id] = wire;
                numCircles += 1;
            }
        }
    }

    var wireValueIndex = 2;
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

        if (isTray)
        {
            texture0 = 0;
            texture1 = 0;
        }

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

        var texture = wire.texture0 + Math.max(Math.abs(wire.x0 - p[0]), Math.abs(wire.y0 - p[1]));

        if (isTray)
        {
            texture = 0;
        }

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

    if (!isTray)
    {
        this.renderer.textureSize.value += wireValueIndex;
    }

    var wireGeometry = this.wireGeometry;
    wireGeometry.addAttribute('p1', new THREE.BufferAttribute(p1s, 3));
    wireGeometry.addAttribute('p2', new THREE.BufferAttribute(p2s, 3));
    wireGeometry.setDrawRange(0, 6 * numWires);

    var circleGeometry = this.circleGeometry;
    circleGeometry.addAttribute('circle', new THREE.BufferAttribute(circles, 3));
    circleGeometry.setDrawRange(0, 6 * numCircles);
};
