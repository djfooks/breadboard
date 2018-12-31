precision highp float;
precision highp int;

uniform float feather;
uniform float textureSize;
uniform float radius;
uniform vec3 wireEdgeColor;

uniform float fg;

varying vec2 vP;
varying vec3 vCircle;

uniform sampler2D texture;

void main(void) {
    float uv = vCircle.z + 0.5; // don't sample on the edge of the texture!

    // gl_FragColor = vec4(0.9, 0.9, 0.9, 1.0);
    vec2 offset1 = vP - vCircle.xy;
    float d = length(offset1);

    float alpha = 1.0 - ((d - radius) / feather);

    float wireValue = texture2D(texture, vec2(uv / textureSize, 0.5)).x;
    vec3 color = mix(vec3(1.0, 1.0, 1.0), vec3(1.0, 0.53, 0.53), wireValue);
    color = mix(wireEdgeColor, color, fg);

    gl_FragColor = vec4(color.rgb, alpha);
}
