
var ColorPalette = {
    base: {
        box: [0.0, 0.0, 0.0],
        inputNode: [0.0, 1.0, 0.0],
        outputNode: [0.0, 0.0, 0.0],
    },
    bg: {
        box: [0.7, 0.7, 0.7],
        inputNode: [0.7, 1.0, 0.7],
        outputNode: [0.7, 0.7, 0.7],
    },
    invalid: {
        box: [1.0, 0.0, 0.0],
        inputNode: [1.0, 0.0, 0.0],
        outputNode: [1.0, 0.0, 0.0],
    }
};

ColorPalette.setColor = function setColor(palette, dst)
{
    dst.x = palette[0];
    dst.y = palette[1];
    dst.z = palette[2];
};

ColorPalette.createRGBColor = function (palette)
{
    return { value: new THREE.Vector3(
        palette[0],
        palette[1],
        palette[2]
    )};
};
