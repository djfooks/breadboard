precision highp float;
precision highp int;

uniform mat4 projectionMatrix;
uniform float feather;

attribute vec2 position;
attribute vec4 lines;

// varying vec2 vP;
// varying vec2 vP1;
// varying vec2 vP2;
void main()
{
    // vP1 = p1.xy;
    // vP2 = p2.xy;
    vec2 vP1 = lines.xy;
    vec2 vP2 = lines.zw;

    vec2 o = vP1 - vP2;
    float d = length(o);
    vec2 n = o * feather / d;
    vec2 m = vec2(n.y, -n.x);

    vec2 p = mix(vP1 + n, vP2 - n, position.x);
    p += mix(-m, m, position.y);

    // vP = p;
    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
