import React from "react";
import UTIF from "utif";

import { Stage, Layer, Image } from "react-konva";
export class LoadImage extends React.Component {
    state = {
        image: null
    };
    componentDidMount() {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "../sample/31t3152.c.r.0002.TIF");
        xhr.responseType = "arraybuffer";
        xhr.onload = e => {
            console.log(e.target.response);
            const ifds = UTIF.decode(e.target.response);
            const firstPageOfTif = ifds[0];
            UTIF.decodeImages(e.target.response, ifds);
            const rgba = UTIF.toRGBA8(firstPageOfTif);

            const imageWidth = firstPageOfTif.width;
            const imageHeight = firstPageOfTif.height;

            const cnv = document.createElement("canvas");
            cnv.width = imageWidth;
            cnv.height = imageHeight;

            const ctx = cnv.getContext("2d");
            const imageData = ctx.createImageData(imageWidth, imageHeight);
            for (let i = 0; i < rgba.length; i++) {
                imageData.data[i] = rgba[i];
            }
            ctx.putImageData(imageData, 0, 0);

            this.setState({
                image: cnv
            });
        };
        xhr.send();
    }

    render() {
        return (
            <Stage width={window.innerWidth} height={window.innerHeight}>
                <Layer>
                    <Image image={this.state.image} />
                </Layer>
            </Stage>
        );
    }
}
 
