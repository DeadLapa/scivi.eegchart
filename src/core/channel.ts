import { vec3, mat4 } from 'gl-matrix';
import { EEGShaderProgram } from './shader';

export class EEGChannel
{
    private m_vbo: WebGLBuffer | null;
    private m_data: Float32Array;

    private static m_shaderProgram: EEGShaderProgram

    constructor(private m_name: string,
                private m_color: vec3,
                private m_historyLength: number,
                private m_gl: WebGLRenderingContext)
    {
        const n = this.m_historyLength * 2;
        this.m_data = new Float32Array(n);
        for (let i = 0, x = 0; i < n; ++x) {
            this.m_data[i++] = x;
            this.m_data[i++] = 0;
        }
        this.m_vbo = this.m_gl.createBuffer();
        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, this.m_vbo);
        this.m_gl.bufferData(this.m_gl.ARRAY_BUFFER, this.m_data, this.m_gl.DYNAMIC_DRAW);

        if (!EEGChannel.m_shaderProgram) {
            EEGChannel.m_shaderProgram = new EEGShaderProgram(
                // vertex shader
                "precision highp float;" +
                "precision lowp int;" +
                "attribute vec2 a_position;" +
                "uniform mat4 u_mvp;" +
                "void main() { gl_Position = u_mvp * vec4(a_position, 0.0, 1.0); }",
                // fragment shader
                "precision highp float;" +
                "precision lowp int;" +
                "uniform vec3 u_color;" +
                "void main() { gl_FragColor = vec4(u_color, 1.0); }",
                this.m_gl!!
            );
            EEGChannel.m_shaderProgram.attribute("a_position", 2, 0, 2);
        }
    }

    get name(): string
    {
        return this.m_name;
    }

    public appendData(data: number[])
    {
        const n = this.m_historyLength * 2;
        for (let i = data.length * 2 + 1, j = 1; i < n; i += 2, j += 2)
            this.m_data[j] = this.m_data[i];
        for (let i = Math.max(this.m_historyLength - data.length, 0) * 2 + 1, j = 0; i < n; i += 2, ++j)
            this.m_data[i] = data[j];
        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, this.m_vbo);
        this.m_gl.bufferSubData(this.m_gl.ARRAY_BUFFER, 0, this.m_data);
    }

    public render(channelIndex: number, channelHeight: number, channelScale: number)
    {
        const mvp = mat4.fromValues(
            2.0 / (this.m_historyLength - 1), 0.0,                                        0.0, 0.0,
            0.0,                              channelScale,                               0.0, 0.0,
            0.0,                              0.0,                                        1.0, 0.0,
            -1.0,                             1.0 - channelHeight * (channelIndex + 0.5), 0.0, 1.0
        );

        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, this.m_vbo);
        EEGChannel.m_shaderProgram.activate();
        EEGChannel.m_shaderProgram.setUniformMat4("u_mvp", mvp);
        EEGChannel.m_shaderProgram.setUniformVec3("u_color", this.m_color);
        this.m_gl.drawArrays(this.m_gl.LINE_STRIP, 0, this.m_historyLength);
        EEGChannel.m_shaderProgram.deactivate();
    }
}
