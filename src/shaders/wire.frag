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
    float d = abs(dot(wireOffset, n));

    float minX = min(vP1.x, vP2.x);
    float maxX = max(vP1.x, vP2.x);
    float minY = min(vP1.y, vP2.y);
    float maxY = max(vP1.y, vP2.y);
    const float innerWire = 0.06;
    const float outerWire = 0.09;
    float outerBounds = outerWire + feather;
    bool inOuterWire = vP.x >= minX - outerBounds && vP.x <= maxX + outerBounds && vP.y >= minY - outerBounds && vP.y <= maxY + outerBounds;

    if (inOuterWire)
    {
        float v = (d - outerWire) / feather;
        float alpha = 1.0 - v;

        v = (d - innerWire) / feather;
        float wireColor = 1.0 - v;

        gl_FragColor = vec4(wireColor, 0.0, 0.0, alpha);
    }
    else
    {
        gl_FragColor = vec4(0.9, 0.9, 0.9, 0.0);
    }
}
