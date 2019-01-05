
var ShaderManager = {};
ShaderManager.shadersLoading = 0;
ShaderManager.shaders = {};

ShaderManager.get = function get(url)
{
    return ShaderManager.shaders[url];
};

ShaderManager.request = function request(url)
{
    this.shadersLoading += 1;

    var loader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    loader.setResponseType('text');
    loader.load(url, function (text)
    {
        ShaderManager.shadersLoading -= 1;
        ShaderManager.shaders[url] = text + "\n//" + url;
    }, null, this.onError.bind(this, url));
};

ShaderManager.onError = function onError(url, e)
{
    window.alert("Unable to load shader " + url);
    console.log(e);
};

ShaderManager.loading = function loading()
{
    return ShaderManager.shadersLoading > 0;
};
