
function ComponentBoxRenderer()
{
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
        indicesArray[index + 3] = vertexIndex + 2;
        indicesArray[index + 4] = vertexIndex + 3;
        indicesArray[index + 5] = vertexIndex + 0;

        vertex = i * 8;
        verticesArray[vertex + 0] = 0;
        verticesArray[vertex + 1] = 0;
        verticesArray[vertex + 2] = 1;
        verticesArray[vertex + 3] = 0;
        verticesArray[vertex + 4] = 1;
        verticesArray[vertex + 5] = 1;
        verticesArray[vertex + 6] = 0;
        verticesArray[vertex + 7] = 1;
    }

    var indices = new THREE.BufferAttribute(indicesArray, 1);

    var geometry = this.geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.addAttribute('position', new THREE.BufferAttribute(verticesArray, 2));
    geometry.boundingSphere = new THREE.Sphere();
    geometry.boundingSphere.radius = 99999;
}

ComponentBoxRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    this.rectangleMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            border: { value: 0.05 }//Component.border }
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

    var p1s = new Int16Array(numComponents * 12);
    var p2s = new Int16Array(numComponents * 12);

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
