varying vec2 vUv;
void main( void ) {
    gl_FragColor = vec4( 0.5 - vUv.y * 0.5, vUv.x, vUv.y, 1.0 );
}
