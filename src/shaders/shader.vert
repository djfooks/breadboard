varying vec2 vUv;
// varying vec2 vP;
// varying vec2 vP1;
// varying vec2 vP2;
void main()
{
    vUv = uv;
    // vP1 = p1;
    // vP2 = p2;
    vec4 mvPosition = vec4(position.x, position.y, 0.0, 1.0 );
    // vP = position;
    gl_Position = projectionMatrix * mvPosition;
}
