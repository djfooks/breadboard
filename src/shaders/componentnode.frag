precision highp float;
precision highp int;

uniform float feather;
uniform float textureSize;
uniform float radius;

uniform sampler2D texture;

uniform float fg;

varying vec2 vP;
varying vec2 vCircle;
varying float vValue;

void main(void) {
    // gl_FragColor = vec4(0.9, 0.0, 0.0, 1.0);
    vec2 offset1 = vP - vCircle.xy;
    float d = length(offset1);
    float r = radius - feather * 0.5;

    float alpha = 1.0 - ((d - r) / feather);

    vec3 color = mix(vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0 - vValue, 1.0 - vValue), fg);

    gl_FragColor = vec4(color, alpha);
}
