import { vec2, vec3, mat4 } from 'gl-matrix';
import { EEGChannel } from './channel';
import { EEGGrid } from './grid';
import { EEGShaderProgram } from './shader';

export type EEGScreen = { width: number, height: number, cScale: number };

export class EEGChart
{
    private m_historyLength: number;
    private m_channels: EEGChannel[];
    private m_channelsMap: { [ id: string ]: number };
    private m_gl: WebGLRenderingContext | null;
    private m_canvas: HTMLCanvasElement;
    private m_grid: EEGGrid;
    private m_screen: EEGScreen;
    private m_labelShaderProgram: EEGShaderProgram;

    constructor(private m_view: HTMLElement)
    {
        this.m_historyLength = 1000;
        this.m_channels = [];
        this.m_channelsMap = {};

        this.m_canvas = document.createElement("canvas");
        this.m_view.appendChild(this.m_canvas);
        this.m_screen = { width: this.m_view.clientWidth, height: this.m_view.clientHeight, cScale: window.devicePixelRatio || 1};
        this.resizeCanvas();
        try {
            this.m_gl = this.m_canvas.getContext("webgl", { antialias: true });
        } catch (e) {
            this.m_gl = null;
            alert("Could not initialize WebGL");
        }

        let gl = this.m_gl!!;

        this.m_grid = new EEGGrid(gl);
        this.reshape(this.m_screen.width, this.m_screen.height);

        this.m_labelShaderProgram = new EEGShaderProgram(
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
    }

    private hex2vec3(hex: string): vec3
    {
        if (hex.length !== 7)
            return vec3.fromValues(0, 0, 0);
        let result = [ 0, 0, 0 ];
        hex = hex.toLowerCase();
        const zCode = "0".charCodeAt(0);
        const nCode = zCode + 9;
        const aCode = "a".charCodeAt(0);
        const fCode = aCode + 5;
        for (let i = 1, j = 0; i < hex.length; ++i) {
            let c = hex.charCodeAt(i);
            if (c >= zCode && c <= nCode)
                c -= zCode;
            else if (c >= aCode && c <= fCode)
                c -= aCode - 10;
            else
                return vec3.fromValues(0, 0, 0);
            result[j] |= c << (4 * ((i - 1) % 2));
            if (i % 2 === 0)
                ++j;
        }
        return vec3.fromValues(result[0] / 255.0, result[1] / 255.0, result[2] / 255.0);
    }

    private getColor(index: number): vec3
    {
        const colors = [
            "#F2645A", "#1DAAB2", "#F5B455", "#88D9F2", "#C0A141",
            "#AE79F3", "#C4CD5C", "#3C5FD6", "#86C558", "#B94296",
            "#809549", "#5693D6", "#2DAA31", "#C569CD", "#54B075",
            "#9F5A8F", "#2D8764", "#ADADE9", "#65B1A1", "#A030CB"
        ];
        return this.hex2vec3(colors[index % colors.length]);
    }

    public appendChannelData(channel: string, data: number[])
    {
        if (this.m_channelsMap[channel] === undefined) {
            const n = this.m_channels.length;
            this.m_channels.push(new EEGChannel(channel, this.getColor(n), this.m_historyLength, this.m_gl!!));
            this.m_channelsMap[channel] = n;
        }
        this.m_channels[this.m_channelsMap[channel]].appendData(data);
    }

    public render()
    {
        let gl = this.m_gl!!;
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const channelHeightInCM = 1.5;
        const channelHeight = (2.0 / (this.m_screen.height / 96.0 * 2.54)) * channelHeightInCM;

        this.m_grid.render(this.m_channels.length, channelHeight);
        this.m_channels.forEach((channel: EEGChannel, index: number) => {
            channel.render(index, channelHeight, channelHeight / 2);
        });
    }

    private resizeCanvas()
    {
        this.m_canvas.style.width = this.m_screen.width + "px";
        this.m_canvas.style.height = this.m_screen.height + "px";
        this.m_canvas.width = this.m_screen.width * this.m_screen.cScale;
        this.m_canvas.height = this.m_screen.height * this.m_screen.cScale;
    }

    public reshape(w: number, h: number)
    {
        this.m_screen.cScale = window.devicePixelRatio || 1;
        this.m_screen.width = w;
        this.m_screen.height = h;
        this.resizeCanvas();
        this.m_gl!!.viewport(0, 0, w * this.m_screen.cScale, h * this.m_screen.cScale);
    }
}
