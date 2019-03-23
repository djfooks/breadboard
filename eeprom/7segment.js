function generate()
{
    var outputs = new Uint8Array(256);

    var digitIndex = 0;
    var div = Math.pow(10, digitIndex);

    var bBottom = 1;
    var bLeftBottom = 2;
    var bMiddle = 4;
    var bLeftTop = 8;
    var bTop = 16;
    var bRightTop = 32;
    var bRightBottom = 64;

    var digitBits = new Array(10);

    digitBits[0] = ~bMiddle;
    digitBits[1] = bRightTop | bRightBottom;
    digitBits[2] = ~(bLeftTop | bRightBottom);
    digitBits[3] = ~(bLeftBottom | bLeftTop);
    digitBits[4] = bRightBottom | bRightTop | bMiddle | bLeftTop;
    digitBits[5] = ~(bLeftBottom | bRightTop);
    digitBits[6] = ~bRightTop;
    digitBits[7] = bRightBottom | bRightTop | bTop;
    digitBits[8] = 0xff;
    digitBits[9] = ~(bLeftBottom | bBottom);

    var i;
    for (i = 0; i < 255; i += 1)
    {
        var digit = Math.floor(i / div) % 10;
        if (i < div && digitIndex != 0)
        {
            outputs[i] = 0;
        }
        else
        {
            outputs[i] = digitBits[digit];
        }
    }

    return outputs;
}
