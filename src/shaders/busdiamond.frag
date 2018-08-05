precision highp float;
precision highp int;

uniform float feather;

varying vec2 vP;

void main(void) {
    // gl_FragColor = vec4(0.9, 0.0, 0.0, 1.0);

    const float outer = 0.25;
    const float inner = 0.19;
    float outerD = outer - feather * 0.5;
    float innerD = inner - feather * 0.5;

    float d = abs(vP.x) + abs(vP.y);
    float alpha = 1.0 - (d - outerD) / feather;

    float v = (d - innerD) / feather;

    vec3 wireColor = vec3(0.0, 1.0, 1.0);
    wireColor = mix(wireColor, vec3(0.0, 0.0, 0.0), max(min(v, 1.0), 0.0));

    gl_FragColor = vec4(wireColor, alpha);
}
