precision highp float;
precision highp int;

uniform float feather;
uniform float textureSize;
uniform float radius;

uniform float fg;

varying vec2 vP;
varying vec3 vCircle;

uniform sampler2D texture;

void main(void) {
    // gl_FragColor = vec4(0.9, 0.9, 0.9, 1.0);
    vec2 offset1 = vP - vCircle.xy;
    float d = length(offset1);

    float alpha = 1.0 - ((d - radius) / feather);

    // TODO split shader into fg and bg types
    float wireValue = texture2D(texture, vec2(vCircle.z / textureSize, 0.0)).x;
    vec3 color = mix(vec3(1.0, 1.0, 1.0), vec3(1.0, 0.53, 0.53), wireValue);
    color = mix(vec3(0.0, 0.0, 0.0), color, fg);

    gl_FragColor = vec4(color.rgb, alpha);
}