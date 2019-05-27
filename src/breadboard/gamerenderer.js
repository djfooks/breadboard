
function GameRenderer()
{
    this.textureSize = 0;
    this.textureDimensions = { value: new THREE.Vector2(0, 0) };
    this.texture = {value : null};
    this.time = { value: 0.0 };
    this.lastUpdate = new Date().getTime() / 1000;
    this.textureData = new Uint8Array(0);
    this.dataTexture = null;

    var maxNum = 10000;
    var indicesArray = new Uint16Array(maxNum * 6);
    var verticesArray = new Uint8Array(maxNum * 8);
    var i;
    var index;
    var vertexIndex;
    var vertex;
    for (i = 0; i < maxNum; i += 1)
    {
        index = i * 6;
        vertexIndex = i * 4;
        indicesArray[index + 0] = vertexIndex + 0;
        indicesArray[index + 1] = vertexIndex + 1;
        indicesArray[index + 2] = vertexIndex + 2;
        indicesArray[index + 3] = vertexIndex + 0;
        indicesArray[index + 4] = vertexIndex + 2;
        indicesArray[index + 5] = vertexIndex + 3;

        vertex = i * 8;
        verticesArray[vertex + 6] = 0;
        verticesArray[vertex + 7] = 1;
        verticesArray[vertex + 0] = 0;
        verticesArray[vertex + 1] = 0;
        verticesArray[vertex + 2] = 1;
        verticesArray[vertex + 3] = 0;
        verticesArray[vertex + 4] = 1;
        verticesArray[vertex + 5] = 1;
    }

    this.vertices = new THREE.BufferAttribute(verticesArray, 2);
    this.indices = new THREE.BufferAttribute(indicesArray, 1);
}

GameRenderer.renderOrder = {
    componentBox: 0,
    nodes: 1,

    selectionWireCircleBg: 3,
    selectionWire: 4,
    selectionWireCircleFg: 5,

    wireCircleBg: 6,
    wire: 7,
    wireCircleFg: 8,
};

GameRenderer.prototype.createQuadGeometry = function createQuadGeometry()
{
    var result = new THREE.BufferGeometry();
    result.setIndex(this.indices);
    result.addAttribute('position', this.vertices);
    result.boundingSphere = new THREE.Sphere();
    result.boundingSphere.radius = 99999;
    return result;
};

GameRenderer.maxTextureSize = 2048;

GameRenderer.getValueTextureIndexX = function getValueTextureIndexX(v)
{
    return v % GameRenderer.maxTextureSize;
};

GameRenderer.getValueTextureIndexY = function getValueTextureIndexY(v)
{
    return Math.floor(v / GameRenderer.maxTextureSize);
};

GameRenderer.prototype.createValuesTexture = function createValuesTexture()
{
    var textureSize = this.textureSize;
    var textureWidth = Math.max(2, Math.min(textureSize, GameRenderer.maxTextureSize));
    var textureHeight = GameRenderer.getValueTextureIndexY(textureSize) + 1;
    var textureData = this.textureData = new Uint8Array(textureWidth * textureHeight);
    for (i = 0; i < textureSize; i += 1)
    {
        textureData[i] = 0;
    }
    textureData[1] = 255;
    var dataTexture = this.dataTexture = new THREE.DataTexture(
        textureData,
        textureWidth,
        textureHeight,
        THREE.LuminanceFormat,
        THREE.UnsignedByteType);

    dataTexture.magFilter = THREE.NearestFilter;
    dataTexture.needsUpdate = true;

    this.texture.value = dataTexture;
    this.textureDimensions.value.x = textureWidth;
    this.textureDimensions.value.y = textureHeight;
};

GameRenderer.prototype.update = function update()
{
    var now = new Date().getTime() / 1000;
    this.time.value += (now - this.lastUpdate);
    if (this.time.value > 10000.0)
    {
        this.time.value -= 10000.0;
    }
    this.lastUpdate = now;
};
