precision highp float;
precision highp int;

uniform mat4 projectionMatrix;
attribute vec2 position;

uniform vec4 box;

varying vec2 vP;

void main()
{
    vec2 p = mix(box.xy, box.zw, position);

    vP = p;
    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
