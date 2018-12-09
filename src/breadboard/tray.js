
function Tray(breadboard)
{
    this.breadboard = breadboard;

    this.canvas = document.getElementById("canvas");
    this.renderer = breadboard.stage.renderer;
    this.scene = new THREE.Scene();

    this.gameStage = new GameStage(this.canvas, 0, 0, 99999, 99999);

    // this.gameStage.view = [-670, 0];
    // this.gameStage.setZoom(25);

    this.gameStage.update();

    this.wireRenderer = new WireRenderer(breadboard.gameRenderer);
    this.busRenderer = new BusRenderer(breadboard.gameRenderer);
    this.componentBoxRenderer = new ComponentBoxRenderer();
    this.componentRenderer = new ComponentRenderer(breadboard.gameRenderer);
    this.textRenderer = new TextRenderer(breadboard.gameRenderer);

    this.resetComponents();
}

Tray.prototype.postLoad = function postLoad()
{
    this.componentBoxRenderer.addMeshes(this.scene, this.gameStage.feather);
    this.componentRenderer.addMeshes(this.scene, this.gameStage.feather);
    this.wireRenderer.addMeshes(this.scene, this.gameStage.feather);
    this.busRenderer.addMeshes(this.scene, this.gameStage.feather);
    this.textRenderer.addMeshes(this.scene, this.gameStage.feather);


    var x = 10.0;
    var y = 10.0;
    var r = 1.0;

    var uvs = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0
    ]);

    this.circles = new Float32Array([
        x, y, r,
        x, y, r,
        x, y, r,

        x, y, r,
        x, y, r,
        x, y, r
    ]);

    var circleGeometry = this.circleGeometry = new THREE.BufferGeometry();
    circleGeometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    circleGeometry.addAttribute('circle', new THREE.BufferAttribute(this.circles, 3));
    circleGeometry.setDrawRange(0, 6);

    circleGeometry.boundingSphere = new THREE.Sphere();
    circleGeometry.boundingSphere.radius = 99999;

    this.circleMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            feather: this.gameStage.feather
        },
        vertexShader: ShaderManager.get("src/shaders/circle.vert"),
        fragmentShader: ShaderManager.get("src/shaders/circle.frag"),
        side: THREE.DoubleSide
    });
    this.circleMaterial.transparent = true;

    var mesh = new THREE.Mesh(circleGeometry, this.circleMaterial);
    this.scene.add(mesh);
}

Tray.prototype.resetComponents = function resetComponents()
{
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

Tray.prototype.draw = function draw(ctx)
{
    this.renderer.setScissor(10, 10, this.canvas.width, this.canvas.height);
    this.renderer.setScissorTest(true);
    this.renderer.render(this.scene, this.gameStage.camera);

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
