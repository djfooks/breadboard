precision highp float;
precision highp int;

uniform float feather;
uniform float textureSize;

uniform float radius;
uniform float fg;

varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;
varying float vUV;

uniform sampler2D texture;

void main(void) {
    // gl_FragColor = vec4(0.9, 0.9, 0.9, 1.0);
    vec2 offset1 = vP - vP1;
    float d1 = length(offset1);
    vec2 offset2 = vP - vP2;
    float d2 = length(offset2);

    float d = min(d1, d2);

    float alpha = 1.0 - ((d - radius) / feather);

    // TODO split shader into fg and bg types
    float wireValue = texture2D(texture, vec2(vUV / textureSize, 0.0)).x;
    vec3 color = mix(vec3(1.0, 1.0, 1.0), vec3(1.0, 0.0, 0.0), wireValue);
    color = mix(vec3(0.0, 0.0, 0.0), color, fg);

    gl_FragColor = vec4(color.rgb, alpha);
}
