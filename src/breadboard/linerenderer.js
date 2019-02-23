
function LineRenderer(renderer, color, vertexShader, fragmentShader)
{
    this.renderer = renderer;
    this.lineGeometry = renderer.createQuadGeometry();

    this.lines = [];

    this.color = ColorPalette.createRGBAColor(color);

    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;

    this.cursorX = 0.0;
    this.cursorY = 0.0;
}

LineRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    this.lineMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            color: this.color
        },
        vertexShader: ShaderManager.get(this.vertexShader),
        fragmentShader: ShaderManager.get(this.fragmentShader),
        side: THREE.DoubleSide
    });
    this.lineMaterial.transparent = true;

    this.lineMesh = new THREE.Mesh(this.lineGeometry, this.lineMaterial);
    scene.add(this.lineMesh);
};

LineRenderer.prototype.clearLines = function clearLines()
{
    this.lines.length = 0;
};

LineRenderer.prototype.addLine = function addLine(p1x, p1y, p2x, p2y)
{
    this.lines = this.lines.concat([p1x, p1y, p2x, p2y]);
};

LineRenderer.prototype.moveTo = function moveTo(x, y)
{
    this.cursorX = x;
    this.cursorY = y;
};

LineRenderer.prototype.lineTo = function lineTo(x, y)
{
    this.lines = this.lines.concat([this.cursorX, this.cursorY, x, y]);
    this.cursorX = x;
    this.cursorY = y;
};

LineRenderer.prototype.updateGeometry = function updateGeometry()
{
    var lines = this.lines;
    var linesLength = lines.length;

    var data = new Float32Array(linesLength * 4);

    var i;
    var stride = 4;
    var index = 0;
    for (i = 0; i < linesLength; i += stride)
    {
        data[index +  0] = lines[i + 0];
        data[index +  1] = lines[i + 1];
        data[index +  2] = lines[i + 2];
        data[index +  3] = lines[i + 3];

        data[index +  4] = lines[i + 0];
        data[index +  5] = lines[i + 1];
        data[index +  6] = lines[i + 2];
        data[index +  7] = lines[i + 3];

        data[index +  8] = lines[i + 0];
        data[index +  9] = lines[i + 1];
        data[index + 10] = lines[i + 2];
        data[index + 11] = lines[i + 3];

        data[index + 12] = lines[i + 0];
        data[index + 13] = lines[i + 1];
        data[index + 14] = lines[i + 2];
        data[index + 15] = lines[i + 3];

        index += 16;
    }

    var lineGeometry = this.lineGeometry;
    lineGeometry.addAttribute('lines', new THREE.BufferAttribute(data, stride));
    lineGeometry.setDrawRange(0, 6 * linesLength / stride);
};
