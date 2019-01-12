precision highp float;
precision highp int;

uniform float feather;
uniform float border;
uniform vec3 color;
uniform float isSelection;

varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;

uniform sampler2D texture;

#define SQRT2 1.4142135

void main(void) {
    //gl_FragColor = vec4(0.0, 0.9, 0.0, 1.0);
    float width = 0.05;

    vec2 size = vP2 - vP1;
    vec2 center = (vP1 + vP2) * 0.5;

    float borderExtras = width * 0.5 + feather;
    float clampedBorder = min(border + borderExtras, 0.65) - borderExtras;

    vec2 a = abs(vP - center) - size * 0.5;
    float dist = max(a.x, a.y);
    float inner = clampedBorder - width * 0.5;
    float outer = clampedBorder + width * 0.5 + feather * isSelection * SQRT2;
    float scale =       smoothstep(inner, inner + feather, dist);
    float alpha = 1.0 - smoothstep(outer, outer + feather, dist);

    vec3 c = mix(vec3(1.0, 1.0, 1.0), color, scale);
    gl_FragColor = vec4(c, alpha);
}
