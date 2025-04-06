uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;
uniform float exposure;
uniform float bloomStrength;
uniform float bloomFactor;

varying vec2 vUv;

void main() {
    // Base scene color
    vec4 baseColor = texture2D(baseTexture, vUv);
    
    // Bloom color
    vec4 bloomColor = texture2D(bloomTexture, vUv);
    
    // Apply exposure to base color
    baseColor.rgb *= exposure;
    
    // Add bloom with strength control
    vec3 result = baseColor.rgb + bloomColor.rgb * bloomStrength * bloomFactor;
    
    // Tone mapping
    result = vec3(1.0) - exp(-result * 1.0);
    
    // Gamma correction
    result = pow(result, vec3(1.0/2.2));
    
    gl_FragColor = vec4(result, baseColor.a);
}


