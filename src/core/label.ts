import { vec3, mat4 } from 'gl-matrix';
import { EEGShaderProgram } from './shader';
import { EEGScreen } from './renderer';

export class EEGLabel
{
    private m_texture: WebGLTexture | null;
    private m_size: { width: number, height: number };
    private m_cScale: number;

    private static m_vbo: WebGLBuffer | null;
    private static m_shaderProgram: EEGShaderProgram;

    constructor(private m_text: string, private m_color: vec3, private m_gl: WebGLRenderingContext)
    {
        this.m_texture = null;
        this.m_size = { width: 0, height: 0 };
        this.m_cScale = 0.0;

        if (!EEGLabel.m_vbo) {
            let data = Float32Array.from([
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
            ]);
            EEGLabel.m_vbo = this.m_gl.createBuffer();
            this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, EEGLabel.m_vbo);
            this.m_gl.bufferData(this.m_gl.ARRAY_BUFFER, data, this.m_gl.STATIC_DRAW);
        }

        if (!EEGLabel.m_shaderProgram) {
            EEGLabel.m_shaderProgram = new EEGShaderProgram(
                // vertex shader
                "precision highp float;" +
                "precision lowp int;" +
                "attribute vec2 a_position;" +
                "uniform mat4 u_mvp;" +
                "varying vec2 v_texCoord;" +
                "void main() { v_texCoord = a_position; gl_Position = u_mvp * vec4(a_position, 0.0, 1.0); }",
                // fragment shader
                "precision highp float;" +
                "precision lowp int;" +
                "uniform sampler2D u_texture;" +
                "varying vec2 v_texCoord;" +
                "void main() { gl_FragColor = texture2D(u_texture, v_texCoord); }",
                this.m_gl!!
            );
            EEGLabel.m_shaderProgram.attribute("a_position", 2, 0, 2);
        }
    }

    private roundRect(ctx: CanvasRenderingContext2D,
                      x: number, y: number, width: number, height: number, radius: number,
                      fill: boolean, stroke: boolean)
    {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (fill)
            ctx.fill();
        if (stroke)
            ctx.stroke();
    }

    private contrastBlack(color: vec3): boolean
    {
        return 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2] >= 0.6;
    }

    public render(channelIndex: number, channelHeight: number, screen: EEGScreen)
    {
        if (!this.m_texture || screen.cScale != this.m_cScale) {
            this.m_cScale = screen.cScale;

            let cvs = document.createElement("canvas");
            cvs.width = 1;
            cvs.height = 1;
            let ctx = cvs.getContext("2d");
            if (ctx) {
                const fontSize = 14 * screen.cScale;
                const padding = 5 * screen.cScale;
                const radius = 8 * screen.cScale;
                ctx.font = fontSize + "px Helvetica Neue, Helvetica, Arial, sans-serif";
                // this.m_size = { width: ctx.measureText(this.m_text).width + padding * 2, height: fontSize + 2 };
                this.m_size = { width: 30 * screen.cScale, height: 20 * screen.cScale };
                cvs.width = this.m_size.width;
                cvs.height = this.m_size.height;
                ctx.textBaseline = "middle";
                ctx.textAlign = "center";
                ctx.font = fontSize + "px Helvetica Neue, Helvetica, Arial, sans-serif";
                ctx.fillStyle = "rgba(" + (this.m_color[0] * 255) + ", " + (this.m_color[1] * 255) + ", " + (this.m_color[2] * 255) + ", 1)";
                this.roundRect(ctx, 0, 0, this.m_size.width, this.m_size.height, radius, true, false);
                ctx.fillStyle = this.contrastBlack(this.m_color) ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 1)";
                ctx.fillText(this.m_text, this.m_size.width / 2.0, this.m_size.height / 2.0);
            } else {
                this.m_size = { width: 0, height: 0 };
            }

            this.m_texture = this.m_gl.createTexture();
            this.m_gl.pixelStorei(this.m_gl.UNPACK_FLIP_Y_WEBGL, true);
            this.m_gl.bindTexture(this.m_gl.TEXTURE_2D, this.m_texture);
            this.m_gl.texImage2D(this.m_gl.TEXTURE_2D, 0, this.m_gl.RGBA, this.m_gl.RGBA, this.m_gl.UNSIGNED_BYTE, cvs);
            this.m_gl.texParameteri(this.m_gl.TEXTURE_2D, this.m_gl.TEXTURE_WRAP_S, this.m_gl.CLAMP_TO_EDGE);
            this.m_gl.texParameteri(this.m_gl.TEXTURE_2D, this.m_gl.TEXTURE_WRAP_T, this.m_gl.CLAMP_TO_EDGE);
            this.m_gl.texParameteri(this.m_gl.TEXTURE_2D, this.m_gl.TEXTURE_MAG_FILTER, this.m_gl.NEAREST);
            this.m_gl.texParameteri(this.m_gl.TEXTURE_2D, this.m_gl.TEXTURE_MIN_FILTER, this.m_gl.NEAREST);
        }

        const px = 2.0 / (screen.width * screen.cScale);
        const py = 2.0 / (screen.height * screen.cScale);
        const mvp = mat4.fromValues(
            px * this.m_size.width, 0.0,                                        0.0, 0.0,
            0.0,                    py * this.m_size.height,                    0.0, 0.0,
            0.0,                    0.0,                                        1.0, 0.0,
            -1.0 + px * 10,         1.0 - channelHeight * (channelIndex + 0.5), 0.0, 1.0
        );

        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, EEGLabel.m_vbo);
        EEGLabel.m_shaderProgram.activate();
        EEGLabel.m_shaderProgram.setUniformMat4("u_mvp", mvp);
        this.m_gl.activeTexture(this.m_gl.TEXTURE0);
        this.m_gl.bindTexture(this.m_gl.TEXTURE_2D, this.m_texture);
        EEGLabel.m_shaderProgram.setUniformTextureUnit("u_texture", 0);
        this.m_gl.drawArrays(this.m_gl.TRIANGLE_FAN, 0, 4);
        EEGLabel.m_shaderProgram.deactivate();
    }
}
