precision highp float;
precision highp int;

uniform float feather;
uniform vec2 textureDimensions;
uniform mat4 projectionMatrix;
uniform float radius;
uniform vec3 color;

uniform sampler2D texture;

attribute vec2 position;
attribute vec4 circle;

varying vec2 vP;
varying vec3 vCircle;

void main()
{
    float r = radius + feather;
    vec2 p1 = vec2(circle.x - r, circle.y - r);
    vec2 p2 = vec2(circle.x + r, circle.y + r);

    vec2 p = vec2(mix(p1.x, p2.x, position.x), mix(p1.y, p2.y, position.y));

    float value = texture2D(texture, (circle.zw + vec2(0.5, 0.5)) / textureDimensions).x;
    vP = p;
    vCircle = vec3(circle.xy, value);
    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
