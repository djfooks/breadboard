
function ComponentBoxRenderer(renderer, isSelection)
{
    this.geometry = renderer.createQuadGeometry();

    this.color = ColorPalette.createRGBColor(isSelection ? ColorPalette.base.selection : ColorPalette.base.box);
    this.isSelection = { value: isSelection ? 1.0 : 0.0 };
}

ComponentBoxRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    this.rectangleMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            border: { value: Component.border },
            color: this.color,
            isSelection: this.isSelection
        },
        vertexShader: ShaderManager.get("src/shaders/rectangle.vert"),
        fragmentShader: ShaderManager.get("src/shaders/rectangle.frag"),
        side: THREE.DoubleSide
    });
    this.rectangleMaterial.transparent = true;

    var geometry = this.geometry;
    scene.add(new THREE.Mesh(geometry, this.rectangleMaterial));
};

ComponentBoxRenderer.prototype.updateGeometry = function updateGeometry(components)
{
    var numComponents = components.length;

    var p1s = new Int16Array(numComponents * 8);
    var p2s = new Int16Array(numComponents * 8);

    var i;
    var index;
    for (i = 0; i < numComponents; i += 1)
    {
        index = i * 8;
        var component = components[i];

        var minX = Math.min(component.p0[0], component.p1[0]);
        var minY = Math.min(component.p0[1], component.p1[1]);
        var maxX = Math.max(component.p0[0], component.p1[0]);
        var maxY = Math.max(component.p0[1], component.p1[1]);

        p1s[index + 0] = minX;
        p1s[index + 1] = minY;
        p1s[index + 2] = minX;
        p1s[index + 3] = minY;
        p1s[index + 4] = minX;
        p1s[index + 5] = minY;
        p1s[index + 6] = minX;
        p1s[index + 7] = minY;

        p2s[index + 0] = maxX;
        p2s[index + 1] = maxY;
        p2s[index + 2] = maxX;
        p2s[index + 3] = maxY;
        p2s[index + 4] = maxX;
        p2s[index + 5] = maxY;
        p2s[index + 6] = maxX;
        p2s[index + 7] = maxY;
    }

    var geometry = this.geometry;
    geometry.addAttribute('p1', new THREE.BufferAttribute(p1s, 2));
    geometry.addAttribute('p2', new THREE.BufferAttribute(p2s, 2));
    geometry.setDrawRange(0, 6 * numComponents);
};
