precision highp float;
precision highp int;

varying vec2 vUv;
varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;

void main(void) {
    // gl_FragColor = vec4(0.5 - vUv.y * 0.5, vUv.x, vUv.y, 1.0);

    vec2 offset1 = vP - vP1;
    float d1 = length(offset1);
    vec2 offset2 = vP - vP2;
    float d2 = length(offset2);
    float radius = 0.3;

    vec2 n = vP1 - vP2;
    n = normalize(n);
    n = vec2(n.y, -n.x);
    vec2 wireOffset = vP - vP1;
    float dWire = dot(wireOffset, n);

    float minX = min(vP1.x, vP2.x);
    float maxX = max(vP1.x, vP2.x);
    float minY = min(vP1.y, vP2.y);
    float maxY = max(vP1.y, vP2.y);
    bool inbetweenPoints = vP.x > minX && vP.x < maxX && vP.y > minY && vP.y < maxY;

    if (abs(dWire) < 0.1 && inbetweenPoints)
    {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
    else if (d1 < radius || d2 < radius || (abs(dWire) < 0.2 && inbetweenPoints))
    {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
    else
    {
        gl_FragColor = vec4(0.9, 0.9, 0.9, 1.0);
    }
}
