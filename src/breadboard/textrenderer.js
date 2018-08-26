
function TextRenderer(renderer)
{
    this.renderer = renderer;

    this.textObjects = {
        count: 0,
        index: 0,
        positions: null
    };

    // var textGeometry = this.textGeometry = new THREE.BufferGeometry();

    // textGeometry.boundingSphere = new THREE.Sphere();
    // textGeometry.boundingSphere.radius = 99999;

    var loadedFont = JsonManager.get("sourcecodepro-medium.json");
    this.singleLetterConfig = {
        width: 50,
        align: 'center',
        font: loadedFont,
        letterSpacing: 1,
        scale: 1,
        rotate: false,
        color: "#F00"
    };

    var textGeometry = this.textGeometry = new THREE.BufferGeometry();
    textGeometry.setIndex(this.indices);
    textGeometry.boundingSphere = new THREE.Sphere();
    textGeometry.boundingSphere.radius = 99999;
}

TextRenderer.prototype.addText = function addText(data, p, text)
{
    this.singleLetterConfig.text = text;
    var newGeometry = createBMFontGeometry(this.singleLetterConfig);

    var index = this.textObjects.index;
    var positions = this.positions;

    var scale = 0.02;
    var newPositions = newGeometry.attributes.position.array;
    var i;
    for (i = 0; i < newPositions.length; i += 2)
    {
        positions[index + i + 0] = p[0] + 0.5 + newPositions[i + 0] * scale;
        positions[index + i + 1] = p[1] + 0.3 + newPositions[i + 1] * scale;
    }

    index += newPositions.length;
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
};

TextRenderer.prototype.updateGeometry = function updateGeometry(wires, breadboard)
{

};
