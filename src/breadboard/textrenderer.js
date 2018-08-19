
function TextRenderer(renderer)
{
    this.renderer = renderer;

    this.textObjects = {
    };

    // var textGeometry = this.textGeometry = new THREE.BufferGeometry();

    // textGeometry.boundingSphere = new THREE.Sphere();
    // textGeometry.boundingSphere.radius = 99999;

}

TextRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    var loadedFont = JsonManager.get("sourcecodepro-medium.json");
    var config = {
        text: "5",
        width: 50,
        align: 'center',
        font: loadedFont,
        letterSpacing: 1,
        scale: 1,
        rotate: false,
        color: "#F00"
    };
    this.textGeometry = createBMFontGeometry(config);

    var scale = 0.02;
    var positions = this.textGeometry.attributes.position.array;
    var i;
    for (i = 0; i < positions.length; i += 2)
    {
        positions[i + 0] = 100.5 + positions[i + 0] * scale;
        positions[i + 1] = 94.3 + positions[i + 1] * scale;
    }

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
