precision highp float;
precision highp int;

uniform float feather;
uniform vec3 test;
uniform vec3 bgColor;
uniform vec3 color;
uniform float isSelection;

varying vec2 vP;

#define SQRT2 1.4142135

void main(void) {
    // gl_FragColor = vec4(bgColor, isSelection);

    float outer = 0.25 + feather * SQRT2 * isSelection;
    float inner = 0.19;
    float outerD = outer - feather * 0.5;
    float innerD = inner - feather * 0.5;

    float d = abs(vP.x) + abs(vP.y);
    float alpha = 1.0 - (d - outerD) / feather;

    float v = isSelection + (d - innerD) / feather;

    vec3 wireColor = mix(color, bgColor, max(min(v, 1.0), 0.0));

    gl_FragColor = vec4(wireColor, alpha);
}
