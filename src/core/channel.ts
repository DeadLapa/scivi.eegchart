import { vec3, mat4 } from 'gl-matrix';
import { EEGShaderProgram } from './shader';
import { EEGScreen } from './renderer';
import { EEGLabel } from './label';

export class EEGChannel
{
    private m_vbo: WebGLBuffer | null;
    private m_data: Float32Array;
    private m_soundGroupDisplays: Float32Array;
    private m_soundGroupScounts: Float32Array;
    private m_label: EEGLabel;
    private m_curGroup: number;
    private m_lastData: boolean;
    private static m_shaderProgram: EEGShaderProgram;

    constructor(private m_name: string,
                private m_color: vec3,
                private m_historyLength: number,
                private m_gl: WebGLRenderingContext,
                private m_visible: boolean)
    {
        this.m_curGroup = -1;
        this.m_lastData = false;
        this.m_visible = true;
        const n = this.m_historyLength * 2;
        this.m_soundGroupDisplays = new Float32Array(n);
        this.m_soundGroupScounts = new Float32Array(n);
        this.m_data = new Float32Array(n);
        for (let i = 0, x = 0; i < n; ++x) {
            this.m_data[i++] = x;
            this.m_soundGroupDisplays[i] = 0;
            this.m_soundGroupScounts[i] = 0;
            this.m_data[i++] = 0;
            this.m_soundGroupDisplays[i] = 0;
            this.m_soundGroupScounts[i] = 0;
        }
        this.m_vbo = this.m_gl.createBuffer();
        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, this.m_vbo);
        this.m_gl.bufferData(this.m_gl.ARRAY_BUFFER, this.m_data, this.m_gl.DYNAMIC_DRAW);

        this.m_label = new EEGLabel(this.m_name, this.m_color, this.m_gl);

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

    get getVisible(): boolean
    {
        return this.m_visible;
    }
    public visibleTurnOn()
    {
        this.m_visible = true;
    }
    public visibleTurnOff()
    {
        this.m_visible = false;
    }
    public appendData(data: number[])
    {
        //const n = this.m_historyLength * 2;
        let booleanData: boolean;
        booleanData = data[0] > 0.5;
        if(this.m_curGroup == -1)
        {
            this.m_curGroup +=1;
            if(!booleanData)
            {
                this.m_soundGroupDisplays[this.m_curGroup] +=1;
            }
            else
            {
                this.m_soundGroupScounts[this.m_curGroup] +=1;
            }
        }
        else
        {
            if(booleanData != this.m_lastData)
            {
                if(this.m_lastData)
                {
                    this.m_curGroup +=1;
                    this.m_soundGroupDisplays[this.m_curGroup] += this.m_soundGroupDisplays[this.m_curGroup-1]+this.m_soundGroupScounts[this.m_curGroup-1];
                }
                else
                {
                    this.m_soundGroupScounts[this.m_curGroup] +=1;
                }


            }
            else
            {
                if(!booleanData)
                {
                    this.m_soundGroupDisplays[this.m_curGroup] +=1;
                }
                else
                {
                    this.m_soundGroupScounts[this.m_curGroup] +=1;
                }
            }

        }
        this.m_lastData = booleanData;


        //for (let i = data.length * 2 + 1, j = 1; i < n; i += 2, j += 2)
       //     this.m_data[j] = this.m_data[i];
        //for (let i = Math.max(this.m_historyLength - data.length, 0) * 2 + 1, j = 0; i < n; i += 2, ++j)
        //    this.m_data[i] = data[j];
        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, this.m_vbo);
        this.m_gl.bufferSubData(this.m_gl.ARRAY_BUFFER, 0, this.m_data);
    }

    public render(channelIndex: number, channelHeight: number, channelScale: number, screen: EEGScreen) {
        if (this.m_visible) {
            const mvp = mat4.fromValues(
                2.0 / (this.m_historyLength - 1), 0.0, 0.0, 0.0,
                0.0, channelScale, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                -1.0, 1.0 - channelHeight * (channelIndex + 0.5), 0.0, 1.0
            );

            this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, this.m_vbo);
            EEGChannel.m_shaderProgram.activate();
            EEGChannel.m_shaderProgram.setUniformMat4("u_mvp", mvp);
            EEGChannel.m_shaderProgram.setUniformVec3("u_color", this.m_color);
            for (let i=0; i <= this.m_curGroup;i++)
            {
                this.m_gl.drawArrays(this.m_gl.LINE_STRIP, this.m_soundGroupDisplays[i]*2, this.m_soundGroupScounts[i]*2);
            }

            EEGChannel.m_shaderProgram.deactivate();

            this.m_label.render(channelIndex, channelHeight, screen);
        }

    }

}
