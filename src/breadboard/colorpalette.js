
var ColorPalette = {
    base: {
        gameBorder: [0.0, 0.0, 0.0, 1.0],

        selection: [0.5, 0.78, 1.0],
        selectionBox: [0.0, 0.45, 0.7, 0.7],

        virtualWire: [0.4, 0.4, 0.4],
        virtualBus: [0.4, 0.9, 0.9],
        virtualBusBg: [0.4, 0.4, 0.4],

        box: [0.0, 0.0, 0.0],
        inputNode: [0.0, 1.0, 0.0],
        outputNode: [0.0, 0.0, 0.0],
        textOverride: [0.0, 0.0, 0.0, 0.0],
        wire: [0.0, 0.0, 0.0],
        bus: [0.0, 1.0, 1.0],
        busBg: [0.0, 0.0, 0.0],
    },
    bg: {
        box: [0.7, 0.7, 0.7],
        inputNode: [0.7, 1.0, 0.7],
        outputNode: [0.7, 0.7, 0.7],
        textOverride: [0.7, 0.7, 0.7, 1.0],
        wire: [0.7, 0.7, 0.7],
        bus: [0.9, 0.9, 0.9],
        busBg: [0.8, 0.8, 0.8],
    },
    invalid: {
        box: [1.0, 0.0, 0.0],
        inputNode: [1.0, 0.0, 0.0],
        outputNode: [1.0, 0.0, 0.0],
        textOverride: [1.0, 0.0, 0.0, 1.0],
        wire: [1.0, 0.0, 0.0],
        bus: [1.0, 0.7, 0.7],
        busBg: [1.0, 0.0, 0.0],
    }
};

ColorPalette.setColorRGB = function setColorRGB(palette, dst)
{
    dst.x = palette[0];
    dst.y = palette[1];
    dst.z = palette[2];
};

ColorPalette.setColorRGBA = function setColorRGBA(palette, dst)
{
    dst.x = palette[0];
    dst.y = palette[1];
    dst.z = palette[2];
    dst.w = palette[3];
};

ColorPalette.createRGBColor = function (palette)
{
    return { value: new THREE.Vector3(
        palette[0],
        palette[1],
        palette[2]
    )};
};

ColorPalette.createRGBAColor = function (palette)
{
    return { value: new THREE.Vector4(
        palette[0],
        palette[1],
        palette[2],
        palette[3],
    )};
};
