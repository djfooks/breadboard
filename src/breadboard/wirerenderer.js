
function WireRenderer(renderer, isSelection)
{
    this.renderer = renderer;

    this.wireGeometry = [];
    this.circleGeometry = [];

    var color = isSelection ? ColorPalette.base.selection : ColorPalette.base.wire;
    this.wireEdgeColor = ColorPalette.createRGBColor(color);

    this.isSelection = { value: isSelection ? 1.0 : 0.0 };

    this.circleBgMesh = [];
    this.circleFgMesh = [];
    this.wireMesh = [];
}

WireRenderer.prototype.createMeshes = function createMeshes(scene, feather)
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
            textureDimensions: this.renderer.textureDimensions,
            wireEdgeColor: this.wireEdgeColor,
            isSelection: this.isSelection
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
            textureDimensions: this.renderer.textureDimensions,
            wireEdgeColor: this.wireEdgeColor,
            isSelection: this.isSelection
        },
        vertexShader: wireVertexShader,
        fragmentShader: ShaderManager.get("src/shaders/wire.frag"),
        side: THREE.DoubleSide
    });
    this.wireMaterial.transparent = true;

    if (this.isSelection.value == 0.0)
    {
        this.wireCirclesFgMaterial = new THREE.RawShaderMaterial({
            uniforms: {
                feather: feather,
                radius: { value: 0.14 },
                fg: { value: 1.0 },
                texture: this.renderer.texture,
                textureDimensions: this.renderer.textureDimensions
            },
            vertexShader: wireCirclesVertexShader,
            fragmentShader: wireCirclesFragmentShader,
            side: THREE.DoubleSide
        });
        this.wireCirclesFgMaterial.transparent = true;
    }

    this.addMeshSet();
    this.setVisible(scene, true);
};

WireRenderer.prototype.addMeshSet = function addMeshSet()
{
    var renderer = this.renderer;

    var circleGeometry = renderer.createQuadGeometry();
    var circleMesh = new THREE.Mesh(circleGeometry, this.wireCirclesBgMaterial);
    this.circleGeometry.push(circleGeometry);
    this.circleBgMesh.push(circleMesh);

    var wireGeometry = renderer.createQuadGeometry();
    var wireMesh = new THREE.Mesh(wireGeometry, this.wireMaterial);
    this.wireGeometry.push(wireGeometry);
    this.wireMesh.push(wireMesh);

    if (this.wireCirclesFgMaterial)
    {
        var circleFgMesh = new THREE.Mesh(circleGeometry, this.wireCirclesFgMaterial);
        this.circleFgMesh.push(circleFgMesh);
    }
};

WireRenderer.prototype.setVisible = function setVisible(scene, visible)
{
    function doMeshSet(list, order)
    {
        var i;
        for (i = 0; i < list.length; i += 1)
        {
            if (visible)
            {
                scene.add(list[i]);
                list[i].renderOrder = order;
            }
            else
            {
                scene.remove(list[i]);
            }
        }
    }

    doMeshSet(this.circleBgMesh, 0);
    doMeshSet(this.wireMesh, 1);
    if (this.wireCirclesFgMaterial)
    {
        doMeshSet(this.circleFgMesh, 2);
    }
};

WireRenderer.maxWiresPerGeometry = 4096;

WireRenderer.prototype.updateGeometry = function updateGeometry(scene, wires, breadboard, isTray, hasDotFn)
{
    var numWires = wires.length;

    var numGeometry = Math.ceil(numWires / WireRenderer.maxWiresPerGeometry);

    if (this.wireGeometry.length != numGeometry)
    {
        this.setVisible(scene, false);

        while (this.wireMesh.length < numGeometry)
        {
            this.addMeshSet();
        }

        while (this.wireMesh.length > numGeometry)
        {
            this.circleBgMesh.pop();
            this.wireMesh.pop();
            if (this.wireCirclesFgMaterial)
            {
                this.circleFgMesh.pop();
            }
            this.wireGeometry.pop();
            this.circleGeometry.pop();
        }

        this.setVisible(scene, true);
    }

    var wireValueIndex = 2;

    var wire;
    var batch = 0;
    var batchStartIndex = 0;
    while (batchStartIndex < numWires)
    {
        var batchWires = Math.min(numWires - batchStartIndex, WireRenderer.maxWiresPerGeometry);

        var p1s = new Int16Array(batchWires * 16);
        var p2s = new Int16Array(batchWires * 16);

        var circlesMap = {};
        var numCircles = 0;
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

        var i;
        var index;
        var circlesIndex = 0;
        for (i = 0; i < batchWires; i += 1)
        {
            wire = wires[batchStartIndex + i];
            wire.iterate(wireIterate);
        }

        for (i = 0; i < batchWires; i += 1)
        {
            index = i * 16;
            wire = wires[batchStartIndex + i];

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

            var texture0X = GameRenderer.getValueTextureIndexX(texture0);
            var texture0Y = GameRenderer.getValueTextureIndexY(texture0);

            var texture1X = GameRenderer.getValueTextureIndexX(texture1);
            var texture1Y = GameRenderer.getValueTextureIndexY(texture1);

            if (texture0Y != texture1Y)
            {
                // TODO fix the wrapping wire
            }

            p1s[index + 0]  = wire.x0;
            p1s[index + 1]  = wire.y0;
            p1s[index + 2]  = texture0X;
            p1s[index + 3]  = texture0Y;
            p1s[index + 4]  = wire.x0;
            p1s[index + 5]  = wire.y0;
            p1s[index + 6]  = texture0X;
            p1s[index + 7]  = texture0Y;
            p1s[index + 8]  = wire.x0;
            p1s[index + 9]  = wire.y0;
            p1s[index + 10] = texture0X;
            p1s[index + 11] = texture0Y;
            p1s[index + 12] = wire.x0;
            p1s[index + 13] = wire.y0;
            p1s[index + 14] = texture0X;
            p1s[index + 15] = texture0Y;

            p2s[index + 0]  = wire.x1;
            p2s[index + 1]  = wire.y1;
            p2s[index + 2]  = texture1X;
            p2s[index + 3]  = texture1Y;
            p2s[index + 4]  = wire.x1;
            p2s[index + 5]  = wire.y1;
            p2s[index + 6]  = texture1X;
            p2s[index + 7]  = texture1Y;
            p2s[index + 8]  = wire.x1;
            p2s[index + 9]  = wire.y1;
            p2s[index + 10] = texture1X;
            p2s[index + 11] = texture1Y;
            p2s[index + 12] = wire.x1;
            p2s[index + 13] = wire.y1;
            p2s[index + 14] = texture1X;
            p2s[index + 15] = texture1Y;

            wireValueIndex += 1;
        }

        var circles = new Int16Array(numCircles * 16);
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
            var textureX = GameRenderer.getValueTextureIndexX(texture);
            var textureY = GameRenderer.getValueTextureIndexY(texture);

            circles[circlesIndex + 0]  = p[0];
            circles[circlesIndex + 1]  = p[1];
            circles[circlesIndex + 2]  = textureX;
            circles[circlesIndex + 3]  = textureY;
            circles[circlesIndex + 4]  = p[0];
            circles[circlesIndex + 5]  = p[1];
            circles[circlesIndex + 6]  = textureX;
            circles[circlesIndex + 7]  = textureY;
            circles[circlesIndex + 8]  = p[0];
            circles[circlesIndex + 9]  = p[1];
            circles[circlesIndex + 10] = textureX;
            circles[circlesIndex + 11] = textureY;
            circles[circlesIndex + 12] = p[0];
            circles[circlesIndex + 13] = p[1];
            circles[circlesIndex + 14] = textureX;
            circles[circlesIndex + 15] = textureY;
            circlesIndex += 16;
        }

        if (!isTray)
        {
            this.renderer.textureSize += wireValueIndex;
        }

        var wireGeometry = this.wireGeometry[batch];
        wireGeometry.addAttribute('p1', new THREE.BufferAttribute(p1s, 4));
        wireGeometry.addAttribute('p2', new THREE.BufferAttribute(p2s, 4));
        wireGeometry.setDrawRange(0, 6 * batchWires);

        var circleGeometry = this.circleGeometry[batch];
        circleGeometry.addAttribute('circle', new THREE.BufferAttribute(circles, 4));
        circleGeometry.setDrawRange(0, 6 * numCircles);

        batchStartIndex += batchWires;
        batch += 1;
    }
};
