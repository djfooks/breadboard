
function SpriteRenderer(renderer, texture)
{
    this.geometry = renderer.createQuadGeometry();

    this.color = ColorPalette.createRGBColor(ColorPalette.base.black);
    this.texture = { value : texture };
    this.size = { value : 1.0 };
}

SpriteRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    this.spriteMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            color: this.color,
            texture: this.texture,
            size: this.size
        },
        vertexShader: ShaderManager.get("src/shaders/sprite.vert"),
        fragmentShader: ShaderManager.get("src/shaders/sprite.frag"),
        side: THREE.DoubleSide
    });
    this.spriteMaterial.transparent = true;

    var geometry = this.geometry;
    scene.add(new THREE.Mesh(geometry, this.spriteMaterial));
};

SpriteRenderer.prototype.updateGeometry = function updateGeometry(sprites)
{
    var numSprites = sprites.length;

    var p1s = new Float32Array(numSprites * 8);

    var i;
    var index;
    for (i = 0; i < numSprites; i += 1)
    {
        index = i * 8;
        var sprite = sprites[i];

        p1s[index + 0] = sprite[0];
        p1s[index + 1] = sprite[1];
        p1s[index + 2] = sprite[0];
        p1s[index + 3] = sprite[1];
        p1s[index + 4] = sprite[0];
        p1s[index + 5] = sprite[1];
        p1s[index + 6] = sprite[0];
        p1s[index + 7] = sprite[1];
    }

    var geometry = this.geometry;
    geometry.addAttribute('p0', new THREE.BufferAttribute(p1s, 2));
    geometry.setDrawRange(0, 6 * numSprites);
};
