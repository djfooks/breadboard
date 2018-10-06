
function TextRenderer(renderer)
{
    this.renderer = renderer;

    this.textObjects = {
        count: 0,
        index: 0,
        positions: null,
        uvs: null
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

TextRenderer.prototype.addText = function addText(p, text)
{
    this.singleLetterConfig.text = text;
    var newGeometry = createBMFontGeometry(this.singleLetterConfig);

    var index = this.textObjects.index;
    var positions = this.textObjects.positions;
    var uvs = this.textObjects.uvs;

    var scale = 0.02;
    var newPositions = newGeometry.attributes.position.array;
    var newUVs = newGeometry.attributes.uv.array;
    var i;
    for (i = 0; i < newPositions.length; i += 2)
    {
        positions[index + i + 0] = p[0] - 0.5 + newPositions[i + 0] * scale;
        positions[index + i + 1] = p[1] + 0.23 + newPositions[i + 1] * scale;
        uvs[index + i + 0] = newUVs[i + 0];
        uvs[index + i + 1] = newUVs[i + 1];
    }

    this.textObjects.index += newPositions.length;
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
};

TextRenderer.prototype.updateGeometry = function updateGeometry()
{
    var textGeometry = this.textGeometry;
    textGeometry.addAttribute('position', new THREE.BufferAttribute(this.textObjects.positions, 2));
    textGeometry.addAttribute('uv', new THREE.BufferAttribute(this.textObjects.uvs, 2));
    textGeometry.setDrawRange(0, 6 * this.textObjects.count);
};
