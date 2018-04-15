precision highp float;
precision highp int;

uniform float feather;

varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;

void main(void) {
    // gl_FragColor = vec4(0.9, 0.9, 0.9, 1.0);
    vec2 n = vP1 - vP2;
    n = normalize(n);
    n = vec2(n.y, -n.x);
    vec2 wireOffset = vP - vP1;
    float dWire = abs(dot(wireOffset, n));

    float minX = min(vP1.x, vP2.x);
    float maxX = max(vP1.x, vP2.x);
    float minY = min(vP1.y, vP2.y);
    float maxY = max(vP1.y, vP2.y);
    const float innerWire = 0.06;
    float outerWire = 0.063 + feather;
    bool inOuterWire = vP.x >= minX - outerWire && vP.x <= maxX + outerWire && vP.y >= minY - outerWire && vP.y <= maxY + outerWire;

    if (inOuterWire)
    {
        if (dWire < innerWire)
        {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
        else if (dWire < outerWire + feather)
        {
            float v = (dWire - outerWire) / feather;
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0 - v);
        }
    }
    else
    {
        gl_FragColor = vec4(0.9, 0.9, 0.9, 0.0);
    }
}
