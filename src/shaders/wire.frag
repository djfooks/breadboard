precision highp float;
precision highp int;

varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;

void main(void) {
    // gl_FragColor = vec4(0.9, 0.9, 0.9, 1.0);
    vec2 n = vP1 - vP2;
    n = normalize(n);
    n = vec2(n.y, -n.x);
    vec2 wireOffset = vP - vP1;
    float dWire = dot(wireOffset, n);

    float minX = min(vP1.x, vP2.x);
    float maxX = max(vP1.x, vP2.x);
    float minY = min(vP1.y, vP2.y);
    float maxY = max(vP1.y, vP2.y);
    const float innerWire = 0.12;
    const float outerWire = 0.18;
    bool inOuterWire = vP.x >= minX - outerWire && vP.x <= maxX + outerWire && vP.y >= minY - outerWire && vP.y <= maxY + outerWire;

    if (inOuterWire)
    {
        if (abs(dWire) < innerWire)
        {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
        else if (abs(dWire) < outerWire)
        {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
    }
    else
    {
        gl_FragColor = vec4(0.9, 0.9, 0.9, 0.0);
    }
}
