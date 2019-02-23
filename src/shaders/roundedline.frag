precision highp float;
precision highp int;

uniform float feather;
uniform vec3 color;

varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;

const float thickness = 0.025;

float lineDistance(vec2 a, vec2 b)
{
    vec2 v = a - b;
    float lSq = dot(v, v);
    float t = max(0.0, min(1.0, dot(vP - b, v) / lSq));
    vec2 projection = b + t * v;
    return distance(vP, projection);
}

float line(vec2 a, vec2 b)
{
    float d = lineDistance(a, b);
    return max(1.0 - (max(0.0, d - (thickness - feather * 0.5)) / feather), 0.0);
}

void main(void)
{
    //gl_FragColor = vec4(vP.xy, 0.0, 1.0);

    float alpha = line(vP1, vP2);
    gl_FragColor = vec4(color, alpha);
}
