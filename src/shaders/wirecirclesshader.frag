precision highp float;
precision highp int;

uniform float feather;
uniform vec2 textureDimensions;
uniform float radius;
uniform vec3 wireEdgeColor;
uniform float isSelection;

uniform float fg;

varying vec2 vP;
varying vec4 vCircle;

uniform sampler2D texture;

#define SQRT2 1.4142135

void main(void) {
    vec2 uv = vCircle.zw + vec2(0.5, 0.5); // don't sample on the edge of the texture!

    // gl_FragColor = vec4(0.9, 0.9, 0.9, 1.0);
    vec2 offset1 = vP - vCircle.xy;
    float d = length(offset1);

    float r = radius + feather * SQRT2 * isSelection;

    float alpha = 1.0 - ((d - r) / feather);

    float wireValue = texture2D(texture, uv / textureDimensions).x;
    vec3 color = mix(vec3(1.0, 1.0, 1.0), vec3(1.0, 0.53, 0.53), wireValue);
    color = mix(wireEdgeColor, color, fg);

    gl_FragColor = vec4(color.rgb, alpha);
}
