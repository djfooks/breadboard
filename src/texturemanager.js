
var TextureManager = {};
TextureManager.imagesLoading = 0;
TextureManager.images = {};

TextureManager.get = function get(url)
{
    return TextureManager.images[url];
};

TextureManager.request = function request(url)
{
    TextureManager.imagesLoading += 1;
    var imageObj = new Image();

    imageObj.onload = function()
    {
        TextureManager.imagesLoading -= 1;
        TextureManager.images[url] = imageObj;
    };
    imageObj.src = url;
};

TextureManager.loading = function loading()
{
    return TextureManager.imagesLoading > 0;
};
