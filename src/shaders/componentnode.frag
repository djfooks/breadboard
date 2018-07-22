precision highp float;
precision highp int;

uniform float feather;
uniform float textureSize;
uniform float radius;
uniform vec3 color;

uniform float fg;

varying vec2 vP;
varying vec2 vCircle;

uniform sampler2D texture;

void main(void) {
    // gl_FragColor = vec4(0.9, 0.0, 0.0, 1.0);
    vec2 offset1 = vP - vCircle.xy;
    float d = length(offset1);

    float alpha = 1.0 - ((d - radius) / feather);
    gl_FragColor = vec4(color.rgb, alpha);
}
