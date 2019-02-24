
var TextureManager = {};
TextureManager.texturesLoading = 0;
TextureManager.textures = {};

TextureManager.init = function init(renderer)
{
    TextureManager.textureLoader = new THREE.TextureLoader();
    TextureManager.renderer = renderer;
}

TextureManager.get = function get(url)
{
    return TextureManager.textures[url];
};

TextureManager.mipmaps = function mipmaps(texture)
{
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = TextureManager.renderer.capabilities.getMaxAnisotropy();
};

TextureManager.request = function request(url, params)
{
    TextureManager.texturesLoading += 1;

    function onload(texture)
    {
        TextureManager.texturesLoading -= 1;
        TextureManager.textures[url] = texture;
        if (params.mipmaps)
        {
            TextureManager.mipmaps(texture);
        }
    }

    TextureManager.textureLoader.load(url, onload);
};

TextureManager.loading = function loading()
{
    return TextureManager.texturesLoading > 0;
};
