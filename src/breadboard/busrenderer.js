
function BusRenderer(renderer, isSelection)
{
    this.renderer = renderer;

    this.busGeometry = renderer.createQuadGeometry();
    this.diamondGeometry = renderer.createQuadGeometry();

    this.bgColor = ColorPalette.createRGBColor(isSelection ? ColorPalette.base.selection : ColorPalette.base.busBg);
    this.color = ColorPalette.createRGBColor(ColorPalette.base.bus);

    this.isSelection = { value: isSelection ? 1.0 : 0.0 };
}

BusRenderer.prototype.addMeshes = function addMeshes(scene, feather)
{
    this.busMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            color: this.color,
            bgColor: this.bgColor
        },
        vertexShader: ShaderManager.get("src/shaders/bus.vert"),
        fragmentShader: ShaderManager.get(this.isSelection.value ? "src/shaders/busselection.frag" : "src/shaders/bus.frag"),
        side: THREE.DoubleSide
    });
    this.busMaterial.transparent = true;

    this.busDiamondMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: feather,
            color: this.color,
            bgColor: this.bgColor,
            isSelection: this.isSelection
        },
        vertexShader: ShaderManager.get("src/shaders/busdiamond.vert"),
        fragmentShader: ShaderManager.get("src/shaders/busdiamond.frag"),
        side: THREE.DoubleSide
    });
    this.busDiamondMaterial.transparent = true;

    scene.add(new THREE.Mesh(this.busGeometry,   this.busMaterial));
    scene.add(new THREE.Mesh(this.diamondGeometry, this.busDiamondMaterial));
};

BusRenderer.prototype.updateGeometry = function updateGeometry(buses, breadboard, isTray, hasDotFn)
{
    var numBuses = buses.length;

    var p1s = new Int16Array(numBuses * 8);
    var p2s = new Int16Array(numBuses * 8);

    var diamondMap = {};
    var numDiamonds = 0;
    var bus;
    function busIterate(x, y, index)
    {
        var id = breadboard.getIndex(x, y);
        var hasDot = hasDotFn(id, x, y);
        if (hasDot)
        {
            if (!diamondMap.hasOwnProperty(id))
            {
                diamondMap[id] = bus;
                numDiamonds += 1;
            }
        }
    }

    var i;
    var index;
    for (i = 0; i < numBuses; i += 1)
    {
        bus = buses[i];
        bus.iterate(busIterate);
    }

    for (i = 0; i < numBuses; i += 1)
    {
        index = i * 8;
        bus = buses[i];

        p1s[index + 0] = bus.x0;
        p1s[index + 1] = bus.y0;
        p1s[index + 2] = bus.x0;
        p1s[index + 3] = bus.y0;
        p1s[index + 4] = bus.x0;
        p1s[index + 5] = bus.y0;
        p1s[index + 6] = bus.x0;
        p1s[index + 7] = bus.y0;

        p2s[index + 0] = bus.x1;
        p2s[index + 1] = bus.y1;
        p2s[index + 2] = bus.x1;
        p2s[index + 3] = bus.y1;
        p2s[index + 4] = bus.x1;
        p2s[index + 5] = bus.y1;
        p2s[index + 6] = bus.x1;
        p2s[index + 7] = bus.y1;
    }

    var diamonds = new Int16Array(numDiamonds * 8);
    var diamondsIndex = 0;
    var id;
    for (id in diamondMap)
    {
        bus = diamondMap[id];
        var p = breadboard.getPositionFromIndex(id);

        diamonds[diamondsIndex + 0] = p[0];
        diamonds[diamondsIndex + 1] = p[1];
        diamonds[diamondsIndex + 2] = p[0];
        diamonds[diamondsIndex + 3] = p[1];
        diamonds[diamondsIndex + 4] = p[0];
        diamonds[diamondsIndex + 5] = p[1];
        diamonds[diamondsIndex + 6] = p[0];
        diamonds[diamondsIndex + 7] = p[1];
        diamondsIndex += 8;
    }

    var busGeometry = this.busGeometry;
    busGeometry.addAttribute('p1', new THREE.BufferAttribute(p1s, 2));
    busGeometry.addAttribute('p2', new THREE.BufferAttribute(p2s, 2));
    busGeometry.setDrawRange(0, 6 * numBuses);

    var diamondGeometry = this.diamondGeometry;
    diamondGeometry.addAttribute('diamond', new THREE.BufferAttribute(diamonds, 2));
    diamondGeometry.setDrawRange(0, 6 * numDiamonds);
};
