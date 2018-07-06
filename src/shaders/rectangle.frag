precision highp float;
precision highp int;

uniform float feather;
uniform float border;

varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;
varying float vUV;

uniform sampler2D texture;

void main(void) {
    //gl_FragColor = vec4(0.0, 0.9, 0.0, 1.0);

    vec2 size = vP2 - vP1 + vec2(border, border) * 2.0;
    vec2 center = (vP1 + vP2) * 0.5;
    vec2 a = abs(vP - center) - size * 0.5;
    vec2 delta = max(abs(vP - center) - size * 0.5, 0.0);
    float d = sqrt(dot(delta, delta));

    float v = (abs(d - (feather + 0.1))) / feather;
    float alpha = 1.0 - v;
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
}
