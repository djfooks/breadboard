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

void main(void) {
    //gl_FragColor = vec4(0.0, 0.9, 0.0, 1.0);
    float width = 0.01 + feather * (0.5 + isSelection * 2.0);
    float borderFeather = (border - width) * 2.0;

    vec2 size = vP2 - vP1 + vec2(borderFeather, borderFeather);
    vec2 center = (vP1 + vP2) * 0.5;
    vec2 a = abs(vP - center) - size * 0.5;
    vec2 delta = max(abs(vP - center) - size * 0.5, 0.0);
    float d = sqrt(dot(delta, delta));

    float radius = width + 0.005;
    float alpha = (width - (d - radius)) / (feather * 0.5);
    float scale = (width + (d - radius)) / (feather * 0.5);
    vec3 c = mix(vec3(1.0, 1.0, 1.0), color, scale);
    gl_FragColor = vec4(c, alpha);
}
