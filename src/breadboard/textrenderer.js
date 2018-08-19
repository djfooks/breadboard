
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
        imagePath: 'sourcecodepro-medium.png',
        text: "Hello world",
        width: 1150,
        align: 'center',
        font: loadedFont,
        lineHeight: loadedFont.common.lineHeight,
        letterSpacing: 1,
        scale: 1,
        rotate: false,
        color: "#F00"
    };
    this.textGeometry = createBMFontGeometry(config);

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
