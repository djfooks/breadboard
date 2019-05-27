
function CrystalRenderer(breadboard)
{
    var points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1),

        new THREE.Vector3(0, 1, 1),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(1, 0, 1),
        new THREE.Vector3(1, 1, 1),
    ];

    var mid = new THREE.Vector3(0, 0, 0);
    for ( var i = 0; i < points.length; i ++ )
    {
        mid.add(points[i]);
    }
    mid.divide(new THREE.Vector3(points.length, points.length, points.length));

    for ( var i = 0; i < points.length; i ++ )
    {
        points[i].sub(mid);
    }

    var quickHull = new THREE.QuickHull().setFromPoints( points );

    var faces = quickHull.faces;

    var vertices = [];
    var colorMap = {};
    var colors = [];
    for ( var i = 0; i < faces.length; i ++ ) {

        var face = faces[ i ];
        var edge = face.edge;
        var normalStr = face.normal.x + "," + face.normal.y + "," + face.normal.z;

        var color;
        if (colorMap[normalStr])
        {
            color = colorMap[normalStr];
        }
        else
        {
            color = colorMap[normalStr] = [ Math.random() * 255, Math.random() * 255, Math.random() * 255 ];
        }

        // we move along a doubly-connected edge list to access all face points (see HalfEdge docs)

        do {

            var point = edge.head().point;

            vertices.push( point.x, point.y, point.z );
            colors.push(color[0], color[1], color[2]);

            edge = edge.next;

        } while ( edge !== face.edge );

    }

    // build geometry

    this.vertices = new THREE.BufferAttribute(new Float32Array(vertices), 3);
    this.colors = new THREE.BufferAttribute(new Uint8Array(colors), 3, true);

    /*
    var triangles = [
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,

        0, 0, 0,
        -1, 0, 0,
        0, -1, 0,
    ];

    var verticesArray = new Float32Array(triangles);
    this.vertices = new THREE.BufferAttribute(verticesArray, 3);

    var colors = [
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,

        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
    ];

    this.colors = new THREE.BufferAttribute(new Uint8Array(colors), 3);
    */

    this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute('position', this.vertices);
    this.geometry.addAttribute('color', this.colors);
    this.geometry.boundingSphere = new THREE.Sphere();
    this.geometry.boundingSphere.radius = 3;
}

CrystalRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    this.material = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather
        },
        vertexShader: ShaderManager.get("src/shaders/crystal.vert"),
        fragmentShader: ShaderManager.get("src/shaders/crystal.frag"),
        side: THREE.DoubleSide
    });
    this.material.transparent = true;

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    scene.add(this.mesh);
    this.mesh.position.set(10, 10, 10);

    this.rotX = 0;
    this.rotY = 0;
    this.rotZ = 0;
};

CrystalRenderer.prototype.update = function update()
{
    this.rotX += 0.1;
    this.rotY += 0.02;
    this.rotZ += 0.001;
    var euler = new THREE.Euler( this.rotX, this.rotY, this.rotZ, 'XYZ' );
    this.mesh.rotation.copy(euler);
    // this.mesh.matrixWorldNeedsUpdate = true;
};
