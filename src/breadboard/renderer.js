
function Renderer()
{
    this.textureSize = {value : 0};
    this.texture = {value : null};
    this.textureData = new Uint8Array(0);
    this.dataTexture = null;
}

Renderer.prototype.createValuesTexture = function createValuesTexture()
{
    var textureSize = this.textureSize.value;
    var textureData = this.textureData = new Uint8Array(textureSize);
    for (i = 0; i < textureSize; i += 1)
    {
        textureData[i] = 0;
    }
    var dataTexture = this.dataTexture = new THREE.DataTexture(textureData, textureSize, 1, THREE.LuminanceFormat, THREE.UnsignedByteType);
    dataTexture.magFilter = THREE.NearestFilter;
    dataTexture.needsUpdate = true;

    this.texture.value = dataTexture;
    this.textureSize.value = textureSize;
};
