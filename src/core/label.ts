import { mat4 } from 'gl-matrix';
import { EEGShaderProgram } from './shader';
import { EEGScreen } from './renderer';

export class EEGLabel
{
    private m_texture: WebGLTexture | null;
    private m_size: { width: number, height: number };

    constructor(text: string, private m_shaderProgram: EEGShaderProgram, private m_gl: WebGLRenderingContext)
    {
        let cvs = document.createElement("canvas");
        cvs.width = 1;
        cvs.height = 1;
        let ctx = cvs.getContext("2d");
        if (ctx) {
            const fontSize = 14;
            ctx.font = fontSize + "px Helvetica Neue, Helvetica, Arial, sans-serif";
            this.m_size = { width: ctx.measureText(text).width, height: fontSize + 2 };
            cvs.width = this.m_size.width;
            cvs.height = this.m_size.height;
            ctx.textBaseline = "middle";
            ctx.fillText(text, this.m_size.width / 2.0, this.m_size.height / 2.0);
        } else {
            this.m_size = { width: 0, height: 0 };
        }

        this.m_texture = this.m_gl.createTexture();
        this.m_gl.bindTexture(this.m_gl.TEXTURE_2D, this.m_texture);
        this.m_gl.texImage2D(this.m_gl.TEXTURE_2D, 0, this.m_gl.RGBA, this.m_gl.RGBA, this.m_gl.UNSIGNED_BYTE, cvs);
        this.m_gl.texParameteri(this.m_gl.TEXTURE_2D, this.m_gl.TEXTURE_WRAP_S, this.m_gl.CLAMP_TO_EDGE);
        this.m_gl.texParameteri(this.m_gl.TEXTURE_2D, this.m_gl.TEXTURE_WRAP_T, this.m_gl.CLAMP_TO_EDGE);
        this.m_gl.texParameteri(this.m_gl.TEXTURE_2D, this.m_gl.TEXTURE_MAG_FILTER, this.m_gl.NEAREST);
        this.m_gl.texParameteri(this.m_gl.TEXTURE_2D, this.m_gl.TEXTURE_MIN_FILTER, this.m_gl.NEAREST);
    }

    public render(channelIndex: number, channelHeight: number, screen: EEGScreen)
    {
    }
}
