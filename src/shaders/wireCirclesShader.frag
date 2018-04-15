precision highp float;
precision highp int;

uniform float radius;
uniform float color;

varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;

void main(void) {
    // gl_FragColor = vec4(0.9, 0.9, 0.9, 1.0);
    vec2 offset1 = vP - vP1;
    float d1 = length(offset1);
    vec2 offset2 = vP - vP2;
    float d2 = length(offset2);

    float d = min(d1, d2);

    gl_FragColor = vec4(color, color, color, (radius - d) * 30.0);
}
