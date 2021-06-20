import { EEGShaderProgram } from './shader';

export class EEGGrid
{
    private m_channelCount: number;
    private m_channelHeight: number;
    private m_vbo: WebGLBuffer | null;
    private m_shader: EEGShaderProgram;

    constructor(private m_gl: WebGLRenderingContext)
    {
        this.m_channelCount = 0;
        this.m_channelHeight = 0;
        this.m_vbo = null;
        this.m_shader = new EEGShaderProgram(
            // vertex shader
            "precision highp float;" +
            "precision lowp int;" +
            "attribute vec2 a_position;" +
            "void main() { gl_Position = vec4(a_position, 0.0, 1.0); }",
            // fragment shader
            "precision highp float;" +
            "precision lowp int;" +
            "void main() { gl_FragColor = vec4(0.6, 0.6, 0.6, 1.0); }",
            this.m_gl
        );
        this.m_shader.attribute("a_position", 2, 0, 2);
    }

    set channelHeight(ch: number)
    {
        this.m_channelHeight = ch;
    }

    public render(channelCount: number)
    {
        if (this.m_channelCount != channelCount) {
            this.m_channelCount = channelCount;
            if (!this.m_vbo)
                this.m_vbo = this.m_gl.createBuffer();
            let vertices = new Float32Array(this.m_channelCount * 4);
            for (let i = 0, j = 0; i < this.m_channelCount; ++i) {
                let y = 1.0 - (i + 1) * this.m_channelHeight;
                vertices[j++] = -1.0;
                vertices[j++] = y;
                vertices[j++] = 1.0;
                vertices[j++] = y;
                console.log(y);
            }
            this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, this.m_vbo);
            this.m_gl.bufferData(this.m_gl.ARRAY_BUFFER, vertices, this.m_gl.STATIC_DRAW);
        }

        this.m_shader.activate();
        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, this.m_vbo);
        this.m_gl.drawArrays(this.m_gl.LINES, 0, this.m_channelCount * 2);
        this.m_shader.deactivate();
    }
}
