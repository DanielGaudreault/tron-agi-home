uniform vec3 color1;
uniform vec3 color2;
uniform vec3 lineColor;
uniform float lineWidth;
uniform float gridSize;
uniform float time;

varying vec2 vUv;

void main() {
    // Calculate coordinates in grid space
    vec2 coord = vUv * gridSize;
    
    // Create grid pattern
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = min(grid.x, grid.y);
    float alpha = 1.0 - min(line, 1.0);
    
    // Checkerboard pattern
    float check = mod(floor(coord.x) + floor(coord.y), 2.0);
    vec3 baseColor = mix(color1, color2, check);
    
    // Combine with grid lines
    vec3 color = mix(baseColor, lineColor, alpha * 0.5);
    
    // Add glow effect to lines
    float glow = smoothstep(0.0, 0.2, alpha);
    color += lineColor * glow * 0.3;
    
    // Add subtle pulse animation
    float pulse = sin(time * 2.0) * 0.05 + 0.95;
    color *= pulse;
    
    // Add edge glow (distance to border)
    float border = min(
        min(vUv.x, 1.0 - vUv.x),
        min(vUv.y, 1.0 - vUv.y)
    );
    float edgeGlow = smoothstep(0.1, 0.2, border);
    color = mix(color * 1.5, color, edgeGlow);
    
    gl_FragColor = vec4(color, 1.0);
}
