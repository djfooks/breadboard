
function TextRenderer(renderer)
{
    this.renderer = renderer;

    this.textObjects = {
        count: 0,
        index: 0,
        positions: null,
        uvs: null,
        colors: null
    };

    // var textGeometry = this.textGeometry = new THREE.BufferGeometry();

    // textGeometry.boundingSphere = new THREE.Sphere();
    // textGeometry.boundingSphere.radius = 99999;

    this.singleLetterConfig = {
        width: 50,
        align: 'center',
        letterSpacing: 1,
        scale: 1,
        rotate: false,
        color: "#F00"
    };

    var textGeometry = this.textGeometry = new THREE.BufferGeometry();
    textGeometry.setIndex(renderer.indices);
    textGeometry.boundingSphere = new THREE.Sphere();
    textGeometry.boundingSphere.radius = 99999;
}

TextRenderer.prototype.addText = function addText(p, text, red)
{
    this.singleLetterConfig.text = text;
    var newGeometry = createBMFontGeometry(this.singleLetterConfig);

    var index = this.textObjects.index;
    var positions = this.textObjects.positions;
    var uvs = this.textObjects.uvs;
    var colors = this.textObjects.colors;

    var scale = 0.02;
    var newPositions = newGeometry.attributes.position.array;
    var newUVs = newGeometry.attributes.uv.array;
    var i;
    var count = newPositions.length * 0.5;
    var start = index * 2;
    for (i = 0; i < count; i += 1)
    {
        var i2 = i * 2;
        positions[start + i2 + 0] = p[0] - 0.5 + newPositions[i2 + 0] * scale;
        positions[start + i2 + 1] = p[1] + 0.23 + newPositions[i2 + 1] * scale;
        uvs[start + i2 + 0] = newUVs[i2 + 0];
        uvs[start + i2 + 1] = newUVs[i2 + 1];
        colors[index + i] = red;
    }

    this.textObjects.index += count;
};


TextRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    this.textMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            map: {value: testTexture}
        },
        vertexShader: ShaderManager.get("src/shaders/bmfont.vert"),
        fragmentShader: ShaderManager.get("src/shaders/bmfont.frag"),
        side: THREE.DoubleSide,
        transparent: true,
        depthTest: false
    });

    scene.add(new THREE.Mesh(this.textGeometry, this.textMaterial));

    var loadedFont = JsonManager.get("sourcecodepro-medium.json");
    this.singleLetterConfig.font = loadedFont;

};

TextRenderer.prototype.clearGeometry = function clearGeometry()
{
    this.textObjects.count = 0;
    this.textObjects.index = 0;
};

TextRenderer.prototype.allocateGeometry = function allocateGeometry()
{
    this.textObjects.positions = new Float32Array(this.textObjects.count * 8);
    this.textObjects.uvs = new Float32Array(this.textObjects.count * 8);
    this.textObjects.colors = new Uint8Array(this.textObjects.count * 4);
};

TextRenderer.prototype.updateGeometry = function updateGeometry()
{
    var textGeometry = this.textGeometry;
    textGeometry.addAttribute('position', new THREE.BufferAttribute(this.textObjects.positions, 2));
    textGeometry.addAttribute('uv', new THREE.BufferAttribute(this.textObjects.uvs, 2));
    textGeometry.addAttribute('color', new THREE.BufferAttribute(this.textObjects.colors, 1));
    textGeometry.setDrawRange(0, 6 * this.textObjects.count);
};
