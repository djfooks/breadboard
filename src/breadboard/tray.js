
function Tray(breadboard)
{
    this.breadboard = breadboard;

    this.canvas = document.getElementById("canvas");
    this.renderer = breadboard.stage.renderer;
    this.scene = new THREE.Scene();

    this.gameStage = new GameStage(this.canvas, 0, 0, 99999, 99999);

    this.gameStage.view = [-10, 11.85];
    this.gameStage.zoomLevel = -53;
    this.gameStage.updateZoom();

    this.hoverButtonIndex = -1;
    var buttonHalfHeight = this.buttonHalfHeight = 0.4 + Component.border;

    this.selectHitbox = new Hitbox(-0.5, 0 - buttonHalfHeight, 2.5, 0 + buttonHalfHeight);
    this.selectHitbox.onMouseMove = this.hoverButton.bind(this, 0);
    this.selectHitbox.onMouseUp = this.setBreadboardState.bind(this, Breadboard.state.MOVE);
    this.gameStage.addHitbox(this.selectHitbox);

    this.addWireHitbox = new Hitbox(-0.5, 2 - buttonHalfHeight, 2.5, 2 + buttonHalfHeight);
    this.addWireHitbox.onMouseMove = this.hoverButton.bind(this, 1);
    this.addWireHitbox.onMouseUp = this.setBreadboardState.bind(this, Breadboard.state.ADD_WIRE, ComponentTypes.WIRE);
    this.gameStage.addHitbox(this.addWireHitbox);

    this.addBusHitbox = new Hitbox(-0.5, 4 - buttonHalfHeight, 2.5, 4 + buttonHalfHeight);
    this.addBusHitbox.onMouseMove = this.hoverButton.bind(this, 2);
    this.addBusHitbox.onMouseUp = this.setBreadboardState.bind(this, Breadboard.state.ADD_WIRE, ComponentTypes.BUS);
    this.gameStage.addHitbox(this.addBusHitbox);

    this.configureHitbox = new Hitbox(-0.5, 6 - buttonHalfHeight, 2.5, 6 + buttonHalfHeight);
    this.configureHitbox.onMouseMove = this.hoverButton.bind(this, 3);
    this.configureHitbox.onMouseUp = this.configure.bind(this);
    this.gameStage.addHitbox(this.configureHitbox);

    this.gameStage.update();

    this.selectSpriteRenderer = new SpriteRenderer(breadboard.gameRenderer, null);
    this.configureSpriteRenderer = new SpriteRenderer(breadboard.gameRenderer, null);

    this.wireRenderer = new WireRenderer(breadboard.gameRenderer, false);
    this.busRenderer = new BusRenderer(breadboard.gameRenderer, false);
    this.componentBoxRenderer = new ComponentBoxRenderer(breadboard.gameRenderer, false);
    this.componentRenderer = new ComponentRenderer(breadboard.gameRenderer);

    this.selectionWireRenderer = new WireRenderer(breadboard.gameRenderer, true);
    this.selectionBusRenderer = new BusRenderer(breadboard.gameRenderer, true);

    this.buttonRenderers = [];
    var i;
    for (i = 0; i < 4; i += 1)
    {
        this.buttonRenderers[i] = new RectangleRenderer(breadboard.gameRenderer, false);
    }

    this.resetComponents();

    this.state = 0;
    this.wireType = -1;
}

Tray.prototype.setBreadboardState = function setBreadboardState(newState, wireType)
{
    this.breadboard.setState(newState, wireType);
};

Tray.prototype.getSelectedButton = function getSelectedButton()
{
    var state = this.breadboard.state;
    if (state == Breadboard.state.ADD_WIRE || state == Breadboard.state.PLACING_WIRE)
    {
        return (this.breadboard.wireType == ComponentTypes.WIRE) ? 1 : 2;
    }
    else
    {
        return 0;
    }
};

Tray.prototype.updateButtons = function updateButtons()
{
    var time = new Date().getTime() / 1000;

    var hoverButton = this.hoverButtonIndex;
    var selectedButton = this.getSelectedButton();
    var buttonRenderers = this.buttonRenderers;
    var buttonRenderersLength = buttonRenderers.length;
    var i;
    for (i = 0; i < buttonRenderersLength; i += 1)
    {
        var buttonRenderer = buttonRenderers[i];
        var hovering = (i == hoverButton);

        var color;
        if (hovering)
        {
            var t = time - Math.trunc(time);
            t = t * 2.0;
            if (t > 1.0)
            {
                t = 2.0 - t;
            }
            var scale = 1.0 - (t * 0.2);
            var sampleColor = ColorPalette.base.buttonHover;
            var color = [
                sampleColor[0] * scale,
                sampleColor[1] * scale,
                sampleColor[2] * scale
            ];
            scale = 1.0 + (t * 0.2);
            buttonRenderer.border.value = Component.border * scale;
        }
        else
        {
            color = (i == selectedButton) ? ColorPalette.base.buttonSelected : ColorPalette.base.white;
            buttonRenderer.border.value = Component.border;
        }

        ColorPalette.setColorRGB(color, buttonRenderer.fillColor.value);
    }
}

Tray.prototype.hoverButton = function hoverButton(index)
{
    this.hoverButtonIndex = index;
};

Tray.prototype.configure = function configure()
{
    var selectedObjects = this.breadboard.selectedObjects.objects;
    for (i = 0; i < selectedObjects.length; i += 1)
    {
        var selectedObject = selectedObjects[i].object;
        selectedObject.configure(this.breadboard);
    }
};

Tray.prototype.postLoad = function postLoad()
{
    var buttonRenderersLength = this.buttonRenderers.length;
    var i;
    for (i = 0; i < buttonRenderersLength; i += 1)
    {
        this.buttonRenderers[i].addMeshes(this.scene, this.gameStage.feather);
    }

    var buttonHalfHeight = this.buttonHalfHeight - Component.border;
    this.buttonRenderers[0].updateGeometry([{p0: [0, 0 - buttonHalfHeight], p1: [2, 0 + buttonHalfHeight]}]);
    this.buttonRenderers[1].updateGeometry([{p0: [0, 2 - buttonHalfHeight], p1: [2, 2 + buttonHalfHeight]}]);
    this.buttonRenderers[2].updateGeometry([{p0: [0, 4 - buttonHalfHeight], p1: [2, 4 + buttonHalfHeight]}]);
    this.buttonRenderers[3].updateGeometry([{p0: [0, 6 - buttonHalfHeight], p1: [2, 6 + buttonHalfHeight]}]);

    this.selectionWireRenderer.createMeshes(this.scene, this.gameStage.feather);
    this.selectionBusRenderer.createMeshes(this.scene, this.gameStage.feather);

    this.componentBoxRenderer.addMeshes(this.scene, this.gameStage.feather);
    this.componentRenderer.addMeshes(this.scene, this.gameStage.feather);
    this.wireRenderer.createMeshes(this.scene, this.gameStage.feather);
    this.busRenderer.createMeshes(this.scene, this.gameStage.feather);

    function wireHasDotFn(id, x, y)
    {
        return (x % 2 == 0);
    }
    this.wireRenderer.updateGeometry(this.wires, this.breadboard, true, wireHasDotFn);
    this.busRenderer.updateGeometry(this.buses, this.breadboard, true, wireHasDotFn);
    this.selectionWireRenderer.updateGeometry(this.wires, this.breadboard, true, wireHasDotFn);
    this.selectionBusRenderer.updateGeometry(this.buses, this.breadboard, true, wireHasDotFn);

    this.componentBoxRenderer.updateGeometry(this.componentsList);
    this.componentRenderer.updateGeometry(this.componentsList, this, true);

    var buttonSpriteSize = 0.8;
    this.selectSpriteRenderer.texture.value = TextureManager.get("arrow-cursor.png");
    this.selectSpriteRenderer.addMeshes(this.scene, this.gameStage.feather);
    this.selectSpriteRenderer.updateGeometry([[1, 0]]);
    this.selectSpriteRenderer.size.value = buttonSpriteSize;

    this.configureSpriteRenderer.texture.value = TextureManager.get("tinker.png");
    this.configureSpriteRenderer.addMeshes(this.scene, this.gameStage.feather);
    this.configureSpriteRenderer.updateGeometry([[1, 6]]);
    this.configureSpriteRenderer.size.value = buttonSpriteSize;
}

Tray.prototype.resetComponents = function resetComponents()
{
    this.wires = [
        new Wire(0, 2, 2, 2, 0, 0, ComponentTypes.WIRE)
    ];
    this.buses = [
        new Wire(0, 4, 2, 4, 0, 0, ComponentTypes.BUS)
    ];

    this.battery = new BatteryComponent(this.breadboard);
    this.gameStage.addHitbox(this.battery.hitbox);
    this.battery.move(this.breadboard, [0, 9], 0);

    this.switch = new SwitchComponent(this.breadboard);
    this.gameStage.addHitbox(this.switch.hitbox);
    this.switch.move(this.breadboard, [0, 12], 0);

    this.relay = new RelayComponent(this.breadboard);
    this.gameStage.addHitbox(this.relay.hitbox);
    this.relay.move(this.breadboard, [0, 15], 0);

    this.diode = new DiodeComponent(this.breadboard);
    this.gameStage.addHitbox(this.diode.hitbox);
    this.diode.move(this.breadboard, [0, 20], 0);

    this.debugger = new DebuggerComponent(this.breadboard);
    this.gameStage.addHitbox(this.debugger.hitbox);
    this.debugger.move(this.breadboard, [-1, 23], 0);

    this.busInput = new BusInputComponent(this.breadboard);
    this.gameStage.addHitbox(this.busInput.hitbox);
    this.busInput.move(this.breadboard, [2, 9], 0);

    this.busOutput = new BusOutputComponent(this.breadboard);
    this.gameStage.addHitbox(this.busOutput.hitbox);
    this.busOutput.move(this.breadboard, [2, 13], 0);

    this.latch = new LatchComponent(this.breadboard);
    this.gameStage.addHitbox(this.latch.hitbox);
    this.latch.move(this.breadboard, [2, 18], 0);

    this.componentsList = [
        this.battery,
        this.switch,
        this.relay,
        this.diode,
        this.debugger,
        this.busInput,
        this.busOutput,
        this.latch,
    ];
};

Tray.prototype.isFromTray = function isFromTray(component)
{
    var fromTray = false;
    fromTray = fromTray || (component === this.battery);
    fromTray = fromTray || (component === this.switch);
    fromTray = fromTray || (component === this.relay);
    fromTray = fromTray || (component === this.diode);
    fromTray = fromTray || (component === this.debugger);
    fromTray = fromTray || (component === this.busInput);
    fromTray = fromTray || (component === this.busOutput);
    fromTray = fromTray || (component === this.latch);
    return fromTray;
};

Tray.prototype.draw = function draw()
{
    this.updateButtons();

    if (this.breadboard.state != this.state ||
        this.breadboard.wireType != this.wireType)
    {
        this.selectionWireRenderer.removeMeshes(this.scene);
        this.selectionBusRenderer.removeMeshes(this.scene);
        // this.scene.remove(this.selectionCursorMesh);

        var state = this.state = this.breadboard.state;
        var wireType = this.wireType = this.breadboard.wireType;
        var wireState = state == Breadboard.state.ADD_WIRE ||
                        state == Breadboard.state.PLACING_WIRE;
        if (wireState && wireType == ComponentTypes.WIRE)
        {
            this.selectionWireRenderer.addMeshes(this.scene);
        }
        else if (wireState && wireType == ComponentTypes.BUS)
        {
            this.selectionBusRenderer.addMeshes(this.scene);
        }
        else if (state == Breadboard.state.MOVE)
        {
            // this.scene.add(this.selectionCursorMesh);
        }
    }

    this.renderer.setScissor(0, 0, this.canvas.width, this.canvas.height);
    this.renderer.setScissorTest(false);
    this.renderer.render(this.scene, this.gameStage.camera);

    this.gameStage.update();
};
