import { vec3 } from 'gl-matrix';

export class EEGChannel
{
    private m_vbo: WebGLBuffer | null;
    private m_data: Float32Array;

    constructor(private m_color: vec3,
                history: number,
                private m_gl: WebGLRenderingContext)
    {
        this.m_data = new Float32Array(history);
        this.m_data.fill(0);
        this.m_vbo = this.m_gl.createBuffer();
        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, this.m_vbo);
        this.m_gl.bufferData(this.m_gl.ARRAY_BUFFER, this.m_data, this.m_gl.DYNAMIC_DRAW);
    }

    get data(): Float32Array
    {
        return this.m_data;
    }

    public update()
    {
        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, this.m_vbo);
        this.m_gl.bufferSubData(this.m_gl.ARRAY_BUFFER, 0, this.m_data);
    }
}
