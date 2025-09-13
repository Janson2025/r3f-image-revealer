// components/materials/mask/shaders.js
export const basicUVVertexShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export function makeMaskedImageFragmentShader(MAX = 128) {
  return /* glsl */ `
    precision highp float;

    uniform sampler2D uMap;
    uniform float uTime;
    uniform float uSpeedMul;
    uniform float uSizeMul;
    uniform float uOpacityMul;
    uniform float uOpacityCap;
    uniform float uAspect;     // height / width  (h/w)
    uniform float uEdge;       // feather width
    uniform int   uNum;

    #define MAX ${MAX}
    uniform float uBaseAngles[MAX];
    uniform float uDistances[MAX];
    uniform float uSizes[MAX];
    uniform float uSpeeds[MAX];
    uniform float uOpacities[MAX];

    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(uMap, vUv);

      // ✅ Correct aspect compensation:
      // scale.y = h/w, scale.x = 1.0
      vec2 scale = vec2(1.0, uAspect);

      // Center UVs and scale Y so distances are isotropic
      vec2 uvC = (vUv - 0.5) * scale;

      float mask = 0.0;

      for (int i = 0; i < MAX; i++) {
        if (i >= uNum) break;

        float ang  = uBaseAngles[i] + uTime * uSpeeds[i];
        float dist = uDistances[i];

        // Orbit center in the SAME scaled space
        vec2 pos = 0.5 * dist * vec2(cos(ang), sin(ang)) * scale;

        float r = uSizes[i] * uSizeMul;

        // Distance in corrected space
        float d = length(uvC - pos);

        // Feather adjusted against Y scaling
        float feather = uEdge / max(scale.y, 0.0001);

        // Soft circle: 1 at center → 0 at edge
        float circle = smoothstep(r, r - feather, d);

        mask = max(mask, circle * uOpacities[i]);
      }

      mask = clamp(mask, 0.0, 1.0);
      vec4 outCol = vec4(texel.rgb, mask);

      if (outCol.a < 0.001) discard;
      gl_FragColor = outCol;
    }
  `;
}
