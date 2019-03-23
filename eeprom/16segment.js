function bits(str)
{
    return parseInt(str, 2);
}

function generate()
{
    var high = false;

    var outputs = new Uint8Array(256);

    var digitBits = new Array(256);

    // https://github.com/dmadison/LED-Segment-ASCII/blob/master/16-Segment/16-Segment-ASCII_BIN-NDP.txt
    digitBits[(' ').charCodeAt(0)]  = bits('0000000000000000');
    digitBits[('!').charCodeAt(0)]  = bits('0000000000001100');
    digitBits[('"').charCodeAt(0)]  = bits('0000001000000100');
    digitBits[('#').charCodeAt(0)]  = bits('1010101000111100');
    digitBits[('$').charCodeAt(0)]  = bits('1010101010111011');
    digitBits[('%').charCodeAt(0)]  = bits('1110111010011001');
    digitBits[('&').charCodeAt(0)]  = bits('1001001101110001');
    digitBits[('\'').charCodeAt(0)] = bits('0000001000000000');
    digitBits[('(').charCodeAt(0)]  = bits('0001010000000000');
    digitBits[(')').charCodeAt(0)]  = bits('0100000100000000');
    digitBits[('*').charCodeAt(0)]  = bits('1111111100000000');
    digitBits[('+').charCodeAt(0)]  = bits('1010101000000000');
    digitBits[(',').charCodeAt(0)]  = bits('0100000000000000');
    digitBits[('-').charCodeAt(0)]  = bits('1000100000000000');
    digitBits[('.').charCodeAt(0)]  = bits('0001000000000000');
    digitBits[('/').charCodeAt(0)]  = bits('0100010000000000');
    digitBits[('0').charCodeAt(0)]  = bits('0100010011111111');
    digitBits[('1').charCodeAt(0)]  = bits('0000010000001100');
    digitBits[('2').charCodeAt(0)]  = bits('1000100001110111');
    digitBits[('3').charCodeAt(0)]  = bits('0000100000111111');
    digitBits[('4').charCodeAt(0)]  = bits('1000100010001100');
    digitBits[('5').charCodeAt(0)]  = bits('1001000010110011');
    digitBits[('6').charCodeAt(0)]  = bits('1000100011111011');
    digitBits[('7').charCodeAt(0)]  = bits('0000000000001111');
    digitBits[('8').charCodeAt(0)]  = bits('1000100011111111');
    digitBits[('9').charCodeAt(0)]  = bits('1000100010111111');
    digitBits[(':').charCodeAt(0)]  = bits('0010001000000000');
    digitBits[(';').charCodeAt(0)]  = bits('0100001000000000');
    digitBits[('<').charCodeAt(0)]  = bits('1001010000000000');
    digitBits[('=').charCodeAt(0)]  = bits('1000100000110000');
    digitBits[('>').charCodeAt(0)]  = bits('0100100100000000');
    digitBits[('?').charCodeAt(0)]  = bits('0010100000000111');
    digitBits[('@').charCodeAt(0)]  = bits('0000101011110111');
    digitBits[('A').charCodeAt(0)]  = bits('1000100011001111');
    digitBits[('B').charCodeAt(0)]  = bits('0010101000111111');
    digitBits[('C').charCodeAt(0)]  = bits('0000000011110011');
    digitBits[('D').charCodeAt(0)]  = bits('0010001000111111');
    digitBits[('E').charCodeAt(0)]  = bits('1000000011110011');
    digitBits[('F').charCodeAt(0)]  = bits('1000000011000011');
    digitBits[('G').charCodeAt(0)]  = bits('0000100011111011');
    digitBits[('H').charCodeAt(0)]  = bits('1000100011001100');
    digitBits[('I').charCodeAt(0)]  = bits('0010001000110011');
    digitBits[('J').charCodeAt(0)]  = bits('0000000001111100');
    digitBits[('K').charCodeAt(0)]  = bits('1001010011000000');
    digitBits[('L').charCodeAt(0)]  = bits('0000000011110000');
    digitBits[('M').charCodeAt(0)]  = bits('0000010111001100');
    digitBits[('N').charCodeAt(0)]  = bits('0001000111001100');
    digitBits[('O').charCodeAt(0)]  = bits('0000000011111111');
    digitBits[('P').charCodeAt(0)]  = bits('1000100011000111');
    digitBits[('Q').charCodeAt(0)]  = bits('0001000011111111');
    digitBits[('R').charCodeAt(0)]  = bits('1001100011000111');
    digitBits[('S').charCodeAt(0)]  = bits('1000100010111011');
    digitBits[('T').charCodeAt(0)]  = bits('0010001000000011');
    digitBits[('U').charCodeAt(0)]  = bits('0000000011111100');
    digitBits[('V').charCodeAt(0)]  = bits('0100010011000000');
    digitBits[('W').charCodeAt(0)]  = bits('0101000011001100');
    digitBits[('X').charCodeAt(0)]  = bits('0101010100000000');
    digitBits[('Y').charCodeAt(0)]  = bits('1000100010111100');
    digitBits[('Z').charCodeAt(0)]  = bits('0100010000110011');
    digitBits[('[').charCodeAt(0)]  = bits('0010001000010010');
    digitBits[('\\').charCodeAt(0)] = bits('0001000100000000');
    digitBits[(']').charCodeAt(0)]  = bits('0010001000100001');
    digitBits[('^').charCodeAt(0)]  = bits('0101000000000000');
    digitBits[('_').charCodeAt(0)]  = bits('0000000000110000');
    digitBits[('`').charCodeAt(0)]  = bits('0000000100000000');
    digitBits[('a').charCodeAt(0)]  = bits('1010000001110000');
    digitBits[('b').charCodeAt(0)]  = bits('1010000011100000');
    digitBits[('c').charCodeAt(0)]  = bits('1000000001100000');
    digitBits[('d').charCodeAt(0)]  = bits('0010100000011100');
    digitBits[('e').charCodeAt(0)]  = bits('1100000001100000');
    digitBits[('f').charCodeAt(0)]  = bits('1010101000000010');
    digitBits[('g').charCodeAt(0)]  = bits('1010001010100001');
    digitBits[('h').charCodeAt(0)]  = bits('1010000011000000');
    digitBits[('i').charCodeAt(0)]  = bits('0010000000000000');
    digitBits[('j').charCodeAt(0)]  = bits('0010001001100000');
    digitBits[('k').charCodeAt(0)]  = bits('0011011000000000');
    digitBits[('l').charCodeAt(0)]  = bits('0000000011000000');
    digitBits[('m').charCodeAt(0)]  = bits('1010100001001000');
    digitBits[('n').charCodeAt(0)]  = bits('1010000001000000');
    digitBits[('o').charCodeAt(0)]  = bits('1010000001100000');
    digitBits[('p').charCodeAt(0)]  = bits('1000001011000001');
    digitBits[('q').charCodeAt(0)]  = bits('1010001010000001');
    digitBits[('r').charCodeAt(0)]  = bits('1000000001000000');
    digitBits[('s').charCodeAt(0)]  = bits('1010000010100001');
    digitBits[('t').charCodeAt(0)]  = bits('1000000011100000');
    digitBits[('u').charCodeAt(0)]  = bits('0010000001100000');
    digitBits[('v').charCodeAt(0)]  = bits('0100000001000000');
    digitBits[('w').charCodeAt(0)]  = bits('0101000001001000');
    digitBits[('x').charCodeAt(0)]  = bits('0101010100000000');
    digitBits[('y').charCodeAt(0)]  = bits('0000101000011100');
    digitBits[('z').charCodeAt(0)]  = bits('1100000000100000');
    digitBits[('{').charCodeAt(0)]  = bits('1010001000010010');
    digitBits[('|').charCodeAt(0)]  = bits('0010001000000000');
    digitBits[('}').charCodeAt(0)]  = bits('0010101000100001');
    digitBits[('~').charCodeAt(0)]  = bits('1100110000000000');

    var i;
    for (i = 0; i < 255; i += 1)
    {
        outputs[i] = high ? (digitBits[i] >> 8) : (digitBits[i] & 0xff);
    }

    return outputs;
}
