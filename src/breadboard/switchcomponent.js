
function SwitchComponent(breadboard, id0, id1)
{
    this.id0 = id0;
    this.p0 = breadboard.getPositionFromIndex(id0);

    this.id1 = id1;
    this.p1 = breadboard.getPositionFromIndex(id1);

    this.onTexture = PIXI.Texture.fromImage('/switch_on.png');
    this.offTexture = PIXI.Texture.fromImage('/switch_off.png');

    this.sprite = PIXI.Sprite.fromImage('/switch_off.png');
    var layerPosition = breadboard.getLayerPosition(this.p0);
    this.sprite.x = layerPosition[0] - breadboard.spacing * 0.5;
    this.sprite.y = layerPosition[1] - breadboard.spacing * 0.6;
    this.sprite.width = 30;
    this.sprite.height = 65;

    breadboard.componentsContainer.addChild(this.sprite);

    this.connected = false;
}

SwitchComponent.prototype.toggle = function toggle()
{
    this.connected = !this.connected;
    this.sprite.texture = this.connected ? this.onTexture : this.offTexture;
}
