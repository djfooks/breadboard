precision highp float;
precision highp int;

uniform float feather;
uniform float textureSize;
uniform vec3 wireEdgeColor;

varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;
varying float vUV;

uniform sampler2D texture;

void main(void) {
    // gl_FragColor = vec4(0.9, 0.0, 0.0, 1.0);

    vec2 n = vP1 - vP2;
    n = normalize(n);
    n = vec2(n.y, -n.x);
    vec2 wireOffset = vP - vP1;
    float d = abs(dot(wireOffset, n));

    float minX = min(vP1.x, vP2.x);
    float maxX = max(vP1.x, vP2.x);
    float minY = min(vP1.y, vP2.y);
    float maxY = max(vP1.y, vP2.y);
    const float innerWire = 0.03;
    const float outerWire = 0.07;

    float v = (d - outerWire) / feather;
    float alpha = 1.0 - v;

    v = (d - innerWire) / feather;

    float wireValue = texture2D(texture, vec2(vUV / textureSize, 0.5)).x;

    vec3 wireColor = mix(vec3(1.0, 1.0, 1.0), vec3(1.0, 0.53, 0.53), wireValue);

    wireColor = mix(wireColor, wireEdgeColor, max(min(v, 1.0), 0.0));

    gl_FragColor = vec4(wireColor.rgb, alpha);
}
