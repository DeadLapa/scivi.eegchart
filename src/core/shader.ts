import { vec3, mat4 } from 'gl-matrix';

type EEGAttribute = { location: number, length: number, offset: number, stride: number };

export class EEGShaderProgram
{
    private m_program: WebGLProgram | null;
    private m_attributes: EEGAttribute[];
    private m_uniforms: { [ id: string ]: WebGLUniformLocation | null };

    constructor(vCode: string, fCode: string, private m_gl: WebGLRenderingContext)
    {
        let vsh = this.compileShader(vCode, this.m_gl.VERTEX_SHADER);
        let fsh = this.compileShader(fCode, this.m_gl.FRAGMENT_SHADER);
        if (vsh && fsh) {
            this.m_program = this.m_gl.createProgram();
            this.m_gl.attachShader(this.m_program!!, vsh);
            this.m_gl.attachShader(this.m_program!!, fsh);
            this.m_gl.linkProgram(this.m_program!!);
            if (!this.m_gl.getProgramParameter(this.m_program!!, this.m_gl.LINK_STATUS)) {
                alert("Could not initialize shaders");
                this.m_program = null;
            }
        } else {
            this.m_program = null;
        }
        this.m_attributes = [];
        this.m_uniforms = {};
    }

    private compileShader(code: string, type: number): WebGLShader | null
    {
        let shader = this.m_gl.createShader(type);
        this.m_gl.shaderSource(shader!!, code);
        this.m_gl.compileShader(shader!!);
        if (!this.m_gl.getShaderParameter(shader!!, this.m_gl.COMPILE_STATUS)) {
            alert(this.m_gl.getShaderInfoLog(shader!!));
            return null;
        }
        return shader;
    }

    public attribute(name: string, length: number, offset: number, stride: number)
    {
        this.m_attributes.push({
            location: this.m_gl.getAttribLocation(this.m_program!!, name),
            length: length,
            offset: offset * 4,
            stride: stride * 4
        });
    }

    private uniformLocation(name: string): WebGLUniformLocation | null
    {
        if (this.m_uniforms[name] === undefined)
            this.m_uniforms[name] = this.m_gl.getUniformLocation(this.m_program!!, name);
        return this.m_uniforms[name];
    }

    public setUniformMat4(name: string, m: mat4)
    {
        this.m_gl.uniformMatrix4fv(this.uniformLocation(name), false, m);
    }

    public setUniformVec3(name: string, v: vec3)
    {
        this.m_gl.uniform3fv(this.uniformLocation(name), v);
    }

    public setUniformTextureUnit(name: string, u: number)
    {
        this.m_gl.uniform1i(this.uniformLocation(name), u);
    }

    public activate()
    {
        this.m_gl.useProgram(this.m_program);
        this.m_attributes.forEach((attr: EEGAttribute) => {
            this.m_gl.enableVertexAttribArray(attr.location);
            this.m_gl.vertexAttribPointer(attr.location, attr.length, this.m_gl.FLOAT, false, attr.stride, attr.offset);
        });
    }

    public deactivate()
    {
        this.m_attributes.forEach((attr: EEGAttribute) => {
            this.m_gl.disableVertexAttribArray(attr.location);
        });
    }
}
