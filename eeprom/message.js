function generate()
{
    var outputs = new Uint8Array(256);

    var msg = "Hello world      ";

    var i;
    for (i = 0; i < 256; i += 1)
    {
        outputs[i] = msg.charCodeAt(i % msg.length);
    }

    return outputs;
}
