const vsh = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
 `;
const fsh = `
uniform sampler2D u_previousFrame;
varying vec2 vUv;

void main() {
    vec2 offsetUv = vUv + vec2(0.001, 0.0);
    vec4 prevColor = texture2D(u_previousFrame, offsetUv);
    gl_FragColor = prevColor;
}
`;
export const feedbackMaterial = (feedbackRenderTarget) => {
    return new THREE.ShaderMaterial({
        uniforms: {
            u_previousFrame: { value: feedbackRenderTarget.texture },
            u_time: { value: 0 }
        },
        vertexShader: vsh,
        fragmentShader: fsh
    })
};