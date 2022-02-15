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

    constructor(private m_view: HTMLElement)//, private m_navbar: HTMLElement)
    {
        this.m_historyLength = 1000;
        this.m_channels = [];
        this.m_channelsMap = {};

        this.m_canvas = document.createElement("canvas");
        this.m_view.appendChild(this.m_canvas);
        this.m_screen = { width: this.m_view.clientWidth, height: this.m_view.clientHeight, cScale: window.devicePixelRatio || 1};
        console.log("5587");
        this.resizeCanvas();
        try {
            this.m_gl = this.m_canvas.getContext("webgl", { antialias: true, premultipliedAlpha: false, alpha: false });
        } catch (e) {
            this.m_gl = null;
            alert("Could not initialize WebGL");
        }

        let gl = this.m_gl!!;

        this.m_grid = new EEGGrid(gl);
        this.reshape(this.m_screen.width, this.m_screen.height);

        if (this.m_gl) {
            this.m_gl.enable(this.m_gl.BLEND);
            this.m_gl.blendFunc(this.m_gl.SRC_ALPHA, this.m_gl.ONE_MINUS_SRC_ALPHA);
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
            result[j] |= c << (4 * (i % 2));
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
            //this.m_navbar.appendChild(this.appendButtonForChannel(channel, this));
            const n = this.m_channels.length;
            this.m_channels.push(new EEGChannel(channel, this.getColor(n), this.m_historyLength, this.m_gl!!, true));
            this.m_channelsMap[channel] = n;
            this.reshape(this.m_screen.width, (this.m_channels.length + 1) * 56.8);
        }
        this.m_channels[this.m_channelsMap[channel]].appendData(data);
    }
    public appendButtonForChannel(channel: string, EEGChar: EEGChart) : HTMLButtonElement
    {
        let CurButton = document.createElement("button");
        CurButton.name = channel;
        CurButton.textContent = channel;
        CurButton.onclick = function () {
            EEGChar.turnVisibility(channel);
            if (CurButton.className != "button-navbar-def")
                CurButton.className = "button-navbar-def";
            else
                CurButton.className = "button-navbar-dis";
        };
        CurButton.className = "button-navbar-def";
        return CurButton;
    }
    public turnVisibility(channel: string) {
        if(this.m_channels[this.m_channelsMap[channel]].getVisible)
            this.m_channels[this.m_channelsMap[channel]].visibleTurnOff();
        else
            this.m_channels[this.m_channelsMap[channel]].visibleTurnOn();
        this.render();
        //return this.m_channels[this.m_channelsMap[channel]].getVisible;
    }
    // public turnOnVisibility(channel: string) {
    //     this.m_channels[this.m_channelsMap[channel]].visibleTurnOff();
    //     this.render();
    // }
    public render()
    {
        let gl = this.m_gl!!;
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const channelHeightInCM = 1.5;
        const channelHeight = (2.0 / (this.m_screen.height / 96.0 * 2.54)) * channelHeightInCM;
        let visibleChannelsCount = 0;
        this.m_channels.forEach((channel: EEGChannel, index) => {
            if(channel.getVisible){
                visibleChannelsCount++;
            }
        })
        this.m_grid.render(visibleChannelsCount, channelHeight);
        let indexVisibleChannel = 0;
        this.m_channels.forEach((channel: EEGChannel, index: number) => {
            if(channel.getVisible){
                channel.render(indexVisibleChannel, channelHeight, channelHeight / 2, this.m_screen);
                indexVisibleChannel++;
            }

        });
    }

    private resizeCanvas()
    {

        this.m_canvas.style.width = this.m_screen.width + "px";
        this.m_canvas.style.height = this.m_screen.height + "px";
        this.m_canvas.width = this.m_screen.width * this.m_screen.cScale;
        this.m_canvas.height = this.m_screen.height * this.m_screen.cScale;
    }
    // private resizeScreen()
    // {
    //     const channelHeightInCM2 = 1.5;
    //     const channelHeight2 = (2.0 / (this.m_screen.height / 96.0 * 2.54)) * channelHeightInCM2;
    //     //this.m_screen.width + "px";
    //     if(( (this.m_screen.height- this.m_screen.height % channelHeight2)/channelHeight2) <= this.m_channels.length)
    //     {
    //         this.m_screen.height = this.m_channels.length * channelHeight2;
    //     }
    //
    //
    // }

    public reshape(w: number, h: number)
    {
        this.m_screen.cScale = window.devicePixelRatio || 1;
        this.m_screen.width = w;
        this.m_screen.height = h;
        this.resizeCanvas();
        this.m_gl!!.viewport(0, 0, w * this.m_screen.cScale, h * this.m_screen.cScale);
    }
}
