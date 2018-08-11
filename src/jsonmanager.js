
var JsonManager = {};
JsonManager.filesLoading = 0;
JsonManager.files = {};

JsonManager.get = function get(url)
{
    return JsonManager.files[url];
};

JsonManager.request = function request(url)
{
    this.filesLoading += 1;

    var loader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    loader.setResponseType('text');
    loader.load(url, function (text)
    {
        JsonManager.filesLoading -= 1;
        JsonManager.files[url] = JSON.parse(text);
    }, null, this.onError.bind(this, url));
};

JsonManager.onError = function onError(url, e)
{
    window.alert("Unable to load shader " + url);
    console.log(e);
};

JsonManager.loading = function loading()
{
    return JsonManager.filesLoading > 0;
};
