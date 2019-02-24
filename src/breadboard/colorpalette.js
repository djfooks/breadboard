
var ColorPalette = {
    base: {
        black: [0.0, 0.0, 0.0],
        white: [1.0, 1.0, 1.0],

        buttonHover: [0.35, 0.4, 0.95],
        buttonSelected: [0.45, 0.7, 0.9],

        gameBorder: [0.0, 0.0, 0.0, 1.0],
        cursor: [0.2, 0.2, 0.2],

        selection: [0.5, 0.78, 1.0],
        selectionBox: [0.0, 0.45, 0.7, 0.7],

        virtualWire: [0.4, 0.4, 0.4],
        virtualBus: [
            [0.4, 0.9, 0.9],
            [0.9, 0.4, 0.9],
            [0.9, 1.0, 0.4]
        ],
        virtualBusBg: [0.4, 0.4, 0.4],

        box: [0.0, 0.0, 0.0],
        boxFill: [1.0, 1.0, 1.0],
        inputNode: [0.0, 1.0, 0.0],
        outputNode: [0.0, 0.0, 0.0],
        textOverride: [0.0, 0.0, 0.0, 0.0],
        wire: [0.0, 0.0, 0.0],
        bus: [
            [0.0, 1.0, 1.0],
            [1.0, 0.0, 1.0],
            [1.0, 1.0, 0.0]
        ],
        busBg: [0.0, 0.0, 0.0],
        textures: {},
    },
    bg: {
        box: [0.7, 0.7, 0.7],
        inputNode: [0.7, 1.0, 0.7],
        outputNode: [0.7, 0.7, 0.7],
        textOverride: [0.7, 0.7, 0.7, 1.0],
        wire: [0.7, 0.7, 0.7],
        bus: [
            [0.9, 0.9, 0.9],
            [0.9, 0.9, 0.9],
            [0.9, 0.9, 0.9]
        ],
        busBg: [0.8, 0.8, 0.8],
        textures: {},
    },
    invalid: {
        box: [1.0, 0.0, 0.0],
        inputNode: [1.0, 0.0, 0.0],
        outputNode: [1.0, 0.0, 0.0],
        textOverride: [1.0, 0.0, 0.0, 1.0],
        wire: [1.0, 0.0, 0.0],
        bus: [
            [1.0, 0.7, 0.7],
            [0.7, 1.0, 0.7],
            [0.7, 0.7, 1.0]
        ],
        busBg: [1.0, 0.0, 0.0],
        textures: {},
    }
};

ColorPalette.createPaletteTexture = function createPaletteTexture(colorArray)
{
    var textureData = new Uint8Array(colorArray.length * 3);
    for (i = 0; i < colorArray.length; i += 1)
    {
        var index = i * 3;
        textureData[index + 0] = colorArray[i][0] * 255;
        textureData[index + 1] = colorArray[i][1] * 255;
        textureData[index + 2] = colorArray[i][2] * 255;
    }
    var texture = new THREE.DataTexture(textureData, colorArray.length, 1, THREE.RGBFormat);
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    return texture;
};

ColorPalette.createPaletteTextures = function createPaletteTextures()
{
    var matchingSize = [
        [ColorPalette.base.bus, ColorPalette.bg.bus, ColorPalette.invalid.bus, ColorPalette.base.virtualBus]
    ];

    var i;
    var j;
    for (i = 0; i < matchingSize.length; i += 1)
    {
        var matchList = matchingSize[i];
        var first = true;
        var expectedSize = 0;
        for (j = 0; j < matchList.length; j += 1)
        {
            if (first)
            {
                expectedSize = matchList[j].length;
            }
            else if (expectedSize != matchList[j].length)
            {
                throw new Error("Palette size mismatch");
            }
        }
    }

    ColorPalette.base.textures.bus = ColorPalette.createPaletteTexture(ColorPalette.base.bus);
    ColorPalette.bg.textures.bus = ColorPalette.createPaletteTexture(ColorPalette.bg.bus);
    ColorPalette.invalid.textures.bus = ColorPalette.createPaletteTexture(ColorPalette.invalid.bus);

    ColorPalette.base.textures.virtualBus = ColorPalette.createPaletteTexture(ColorPalette.base.virtualBus);
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

ColorPalette.createTHREEColor = function (palette)
{
    return new THREE.Color(
        palette[0],
        palette[1],
        palette[2]
    );
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
