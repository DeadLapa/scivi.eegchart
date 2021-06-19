import { vec3 } from 'gl-matrix';
import { EEGChannel } from './channel';

export class EEGChart
{
    private m_historyLength: number;
    private m_channels: { [ id: string ]: EEGChannel };
    private m_gl: WebGLRenderingContext | null;
    private m_canvas: HTMLCanvasElement;

    constructor(private m_view: HTMLElement)
    {
        this.m_historyLength = 1000;
        this.m_channels = {};
        this.m_gl = null;

        this.m_canvas = document.createElement("canvas");
        this.m_view.appendChild(this.m_canvas);
        const devicePixelRatio = window.devicePixelRatio || 1;
        this.m_canvas.width = m_view.clientWidth * devicePixelRatio;
        this.m_canvas.height = m_view.clientHeight * devicePixelRatio;
        try {
            this.m_gl = this.m_canvas.getContext("webgl");
        } catch (e) {
            this.m_gl = null;
        }
        if (this.m_gl) {
            this.m_gl.viewport(0, 0, this.m_canvas.width, this.m_canvas.height);
        } else {
            alert("Could not initialize WebGL");
        }
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

    private nextColor(): vec3
    {
        const colors = [
            "#F2645A", "#1DAAB2", "#F5B455", "#88D9F2", "#C0A141",
            "#AE79F3", "#C4CD5C", "#3C5FD6", "#86C558", "#B94296",
            "#809549", "#5693D6", "#2DAA31", "#C569CD", "#54B075",
            "#9F5A8F", "#2D8764", "#ADADE9", "#65B1A1", "#A030CB"
        ];
        return this.hex2vec3(colors[Object.keys(this.m_channels).length % colors.length]);
    }

    public appendChannelData(channel: string, data: number[])
    {
        if (this.m_gl) {
            if (this.m_channels[channel] === undefined)
                this.m_channels[channel] = new EEGChannel(this.nextColor(), this.m_historyLength, this.m_gl);
            let d = this.m_channels[channel].data;
            for (let i = data.length - 1, j = 0; i < this.m_historyLength; ++i, ++j)
                d[j] = d[i];
            for (let i = Math.max(this.m_historyLength - data.length, 0), j = 0; i < this.m_historyLength; ++i, ++j)
                d[i] = data[j];
            this.m_channels[channel].update();
        }
    }

    public render()
    {
    }

    public reshape(w: number, h: number)
    {
        if (this.m_gl) {
            const devicePixelRatio = window.devicePixelRatio || 1;
            this.m_canvas.width = w * devicePixelRatio;
            this.m_canvas.height = h * devicePixelRatio;
            this.m_gl.viewport(0, 0, w, h);
        }
    }
}
