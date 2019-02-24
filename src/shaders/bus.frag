precision highp float;
precision highp int;

uniform float feather;
uniform vec3 bgColor;
uniform float colorTextureSize;

varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;
varying float vColorIndex;

uniform sampler2D colorTexture;

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
    const float centerWire = 0.03;
    const float innerWire = 0.11;
    const float outerWire = 0.17;

    vec3 busColor = texture2D(colorTexture, vec2((vColorIndex + 0.5) / colorTextureSize, 0.5)).xyz;

    float alpha = 1.0 - (d - (outerWire - feather * 0.5)) / feather;

    float v = (d - (innerWire - feather * 0.5)) / feather;
    v = max(v, 1.0 - (d - (centerWire - feather * 0.5)) / feather);

    vec3 wireColor = mix(busColor, bgColor, max(min(v, 1.0), 0.0));

    gl_FragColor = vec4(wireColor.rgb, alpha);
}
