
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

    this.gameStage.update();

    this.wireRenderer = new WireRenderer(breadboard.gameRenderer, false);
    this.busRenderer = new BusRenderer(breadboard.gameRenderer, false);
    this.componentBoxRenderer = new ComponentBoxRenderer(breadboard.gameRenderer, false);
    this.componentRenderer = new ComponentRenderer(breadboard.gameRenderer);

    this.resetComponents();
}

Tray.prototype.postLoad = function postLoad()
{
    this.componentBoxRenderer.addMeshes(this.scene, this.gameStage.feather);
    this.componentRenderer.addMeshes(this.scene, this.gameStage.feather);
    this.wireRenderer.addMeshes(this.scene, this.gameStage.feather);
    this.busRenderer.addMeshes(this.scene, this.gameStage.feather);

    function wireHasDotFn(id, x, y)
    {
        return (x % 2 == 0);
    }
    this.wireRenderer.updateGeometry(this.wires, this.breadboard, true, wireHasDotFn);
    this.busRenderer.updateGeometry(this.buses, this.breadboard, true, wireHasDotFn);

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
    this.renderer.setScissor(10, 10, this.canvas.width, this.canvas.height);
    this.renderer.setScissorTest(true);
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
