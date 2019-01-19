
function Tray(breadboard)
{
    this.breadboard = breadboard;

    this.canvas = document.getElementById("canvas");
    this.renderer = breadboard.stage.renderer;
    this.scene = new THREE.Scene();

    this.gameStage = new GameStage(this.canvas, 0, 0, 99999, 99999);

    this.gameStage.view = [-10, 12];
    this.gameStage.zoomLevel = -53;
    this.gameStage.updateZoom();

    this.addWireHitbox = new Hitbox(-0.5, -0.5, 2.5, 0.5);
    this.addWireHitbox.onMouseUp = this.setBreadboardState.bind(this, Breadboard.state.ADD_WIRE);
    this.gameStage.addHitbox(this.addWireHitbox);

    this.addBusHitbox = new Hitbox(-0.5, 0.5, 2.5, 1.5);
    this.addBusHitbox.onMouseUp = this.setBreadboardState.bind(this, Breadboard.state.ADD_BUS);
    this.gameStage.addHitbox(this.addBusHitbox);

    this.gameStage.update();

    this.wireRenderer = new WireRenderer(breadboard.gameRenderer, false);
    this.busRenderer = new BusRenderer(breadboard.gameRenderer, false);
    this.componentBoxRenderer = new ComponentBoxRenderer(breadboard.gameRenderer, false);
    this.componentRenderer = new ComponentRenderer(breadboard.gameRenderer);

    this.selectionWireRenderer = new WireRenderer(breadboard.gameRenderer, true);
    this.selectionBusRenderer = new BusRenderer(breadboard.gameRenderer, true);

    this.resetComponents();

    this.state = 0;
}

Tray.prototype.setBreadboardState = function setBreadboardState(newState)
{
    this.breadboard.setState(newState);
};

Tray.prototype.postLoad = function postLoad()
{
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
}

Tray.prototype.resetComponents = function resetComponents()
{
    this.wires = [
        new Wire(0, 0, 2, 0, 0, 0, ComponentTypes.WIRE)
    ];
    this.buses = [
        new Wire(0, 1, 2, 1, 0, 0, ComponentTypes.BUS)
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
    if (this.breadboard.state != this.state)
    {
        this.selectionWireRenderer.removeMeshes(this.scene);
        this.selectionBusRenderer.removeMeshes(this.scene);

        var state = this.state = this.breadboard.state;
        if (state == Breadboard.state.ADD_WIRE)
        {
            this.selectionWireRenderer.addMeshes(this.scene);
        }
        else if (state == Breadboard.state.ADD_BUS)
        {
            this.selectionBusRenderer.addMeshes(this.scene);
        }
    }

    this.renderer.setScissor(0, 0, this.canvas.width, this.canvas.height);
    this.renderer.setScissorTest(false);
    this.renderer.render(this.scene, this.gameStage.camera);

    this.gameStage.update();

    // var drawOptions = new DrawOptions(null);

    // ctx.save();

    // this.gameStage.transformContext(ctx);

    // this.battery.draw(drawOptions, ctx, null, "#000000", "#FFFFFF");
    // this.switch.draw(drawOptions, ctx, null, "#000000", "#FFFFFF");
    // this.relay.draw(drawOptions, ctx, null, "#000000", "#FFFFFF");
    // this.diode.draw(drawOptions, ctx, null, "#000000", "#FFFFFF");
    // this.debugger.draw(drawOptions, ctx, null, "#000000", "#FFFFFF");
    // this.busInput.draw(drawOptions, ctx, null, "#000000", "#FFFFFF");
    // this.busOutput.draw(drawOptions, ctx, null, "#000000", "#FFFFFF");
    // this.latch.draw(drawOptions, ctx, null, "#000000", "#FFFFFF");

    // ctx.restore();
};
