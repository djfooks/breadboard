function GridRenderer()
{
    var vertices = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0
    ]);
    var geometry = this.geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 2));

    geometry.boundingSphere = new THREE.Sphere();
    geometry.boundingSphere.radius = 99999;
}

GridRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    this.gridMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            box: { value: [0.0, 0.0, 0.0, 0.0] }
        },
        vertexShader: ShaderManager.get("src/shaders/grid.vert"),
        fragmentShader: ShaderManager.get("src/shaders/grid.frag"),
        side: THREE.DoubleSide
    });
    this.mesh = new THREE.Mesh(this.geometry, this.gridMaterial);
    scene.add(this.mesh);
};

GridRenderer.prototype.updateGeometry = function updateGeometry(camera)
{
    this.gridMaterial.uniforms.box.value = [camera.left, camera.top, camera.right, camera.bottom];
};
