precision highp float;
precision highp int;

uniform float feather;

varying vec2 vP;
varying vec3 vCircle;
void main(void) {
    float radius = vCircle.z;
    vec2 offset1 = vP - vCircle.xy;
    float d = length(offset1);

    float alpha = 1.0 - ((d - radius) / feather);
    gl_FragColor = vec4(1.0, 0.0, 0.0, alpha);
}
