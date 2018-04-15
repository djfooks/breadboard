precision highp float;
precision highp int;

uniform float feather;

varying vec2 vP;

void main(void) {

    vec2 frac = fract(vP);
    vec2 s = step(vec2(0.5, 0.5), frac);
    s = abs(s - frac);
    const float gridLineWidth = 0.01;
    float d = min(s.x, s.y);
    float v = (d - gridLineWidth) / feather;
    v = clamp(v, 0.0, 1.0) + 0.4;

    gl_FragColor = vec4(v, v, v, 1.0);
}
