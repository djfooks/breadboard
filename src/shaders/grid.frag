precision highp float;
precision highp int;

varying vec2 vP;

void main(void) {

    vec2 frac = fract(vP);
    vec2 s = step(vec2(0.5, 0.5), frac);
    s = abs(s - frac);
    float grid = clamp(min(s.x, s.y) * 15.0, 0.0, 1.0) + 0.4;

    gl_FragColor = vec4(grid, grid, grid, 1.0);
}
