
const filters: CustomFilter<any>[] = [];
const ticker = new PIXI.Ticker();

ticker.add(() => {
  for (const filter of filters) {
    filter.updateTime();
  }
});
ticker.start();

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export class CustomFilter<u extends { [x: string]: unknown }> extends PIXI.Filter {
  constructor(vertex?: string, fragment?: string, uniforms?: u) {
    super(vertex ?? DEFAULT_VERTEX, fragment ?? DEFAULT_FRAG, uniforms);

    if (!this.program.fragmentSrc.includes("#version 300 es"))
      this.program.fragmentSrc = this.#addGLESVersion(300, this.program.fragmentSrc);

    if (!this.program.vertexSrc.includes("#version 300 es"))
      this.program.vertexSrc = this.#addGLESVersion(300, this.program.vertexSrc);

    filters.push(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setBgScale(width: number, height: number) {
    // empty
  }

  public updateTime() {
    // empty
  }

  public id: string = foundry.utils.randomID();

  destroy(): void {
    const index = filters.indexOf(this);
    if (index !== -1) filters.splice(index, 1);

    super.destroy();
  }

  #addGLESVersion(version: number, shader: string): string {
    const lines = shader.split("\n");
    const versionIndex = lines.findIndex(line => line.startsWith("#version"));
    if (versionIndex !== -1) {
      lines.splice(versionIndex, 1);
      lines.unshift("#version ${version} es");
    } else {
      lines.unshift(`#version ${version} es`);
    }
    return lines.join("\n");
  }
}


const DEFAULT_VERTEX = `#version 300 es

in vec2 aVertexPosition;

uniform mat3 projectionMatrix;

out vec2 vTextureCoord;

uniform vec4 inputSize;
uniform vec4 outputFrame;

vec4 filterVertexPosition(void) {
    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}

vec2 filterTextureCoord(void) {
    return aVertexPosition * (outputFrame.zw * inputSize.zw);
}

void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}`;

const DEFAULT_FRAG = `#version 300 es

precision highp float;

uniform sampler2D uSampler;
in vec2 vTextureCoord;
out vec4 color;

void main() {
    color = texture(uSampler, vTextureCoord);
}`