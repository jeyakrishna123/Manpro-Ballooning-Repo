import React, { useRef } from 'react';
import { Stage, Layer, Rect, Group, Image, Text, RegularPolygon, Wedge, Star, Ring, Label, Tag, Circle } from 'react-konva';
// import JSZip from 'jszip';
import useStore from "../Store/store";
import WatermarkOverlay from "./WatermarkOverlay";
import { rearrangedPageBalloon,  shortBalloon,showAlert } from "../Common/Common";
import initialState from "../Store/init";
//import useImage from 'use-image';

// #region Canvas Background base64 Image
class PatternImage extends React.Component {
    // #region constructor
    constructor(props) {
        super(props);

        this.state = {
            image: null,
        };
    }
    // #endregion

    // #region fn
    componentDidMount() {
        this.loadImage();
    }
    componentDidUpdate(oldProps) {
        if (oldProps.src !== this.props.src) {
            this.loadImage();
        }
    }
    componentWillUnmount() {
        this.image.removeEventListener('load', this.handleLoad);

    }
    loadImage() {
        this.image = new window.Image();
        this.image.src = this.props.src;
        this.image.addEventListener('load', this.handleLoad);
    }
    handleLoad = () => {
        this.setState({
            image: this.image,
        });
    };
    // #endregion

    // #region Render HTML
    render() {
        return (
            <Image
                x={this.props.x}
                y={this.props.y}
                width={this.props.width}
                height={this.props.height}
                image={this.state.image}
                ref={(node) => {
                    this.imageNode = node;
                }}
            />
        );
    }
    // #endregion
}
// #endregion

const KonvaDownload = React.forwardRef((prop, ref) => {
    const stageRefs = useRef([]);
    const groupRefs = useRef([]);
    const ccRefs = useRef([]);
    const ccRRefs = useRef([]);
    const balRefs = useRef([]);
    const balTextRefs = useRef([]);
    const cirRef = useRef([]);
    const MeasureGroupRefs = useRef([]);
    const MeasureTextRefs = useRef([]);
    // Reactive subscription — re-renders when showdownloadComponent changes
    const showdownloadComponent = useStore((s) => s.showdownloadComponent);
    let props = useStore.getState();

    let newPositionBAlloon = [];
    let rescale = [];
    const clonedArray = props.originalRegions.map(item => ({ ...item }));
    const clonedArrayorigin = props.partial_image.map(item => ({ ...item }));
    let ballonDetails = clonedArray.map((item) => {
        let pageIndex = item.Page_No - 1;
        let superScale = clonedArrayorigin.filter((a) => {
            return a.item === parseInt(pageIndex);
        });
        rescale[pageIndex] = (superScale[0].scale);

        if (item.hasOwnProperty("newarr")) {
            let x = parseInt(item.newarr.Crop_X_Axis * rescale[pageIndex]);
            let y = parseInt(item.newarr.Crop_Y_Axis * rescale[pageIndex]);
            let w = parseInt(item.newarr.Crop_Width * rescale[pageIndex]);
            let h = parseInt(item.newarr.Crop_Height * rescale[pageIndex]);
            let cx = parseInt(item.newarr.Circle_X_Axis * rescale[pageIndex]);
            let cy = parseInt(item.newarr.Circle_Y_Axis * rescale[pageIndex]);
            let mx = parseInt(item.newarr.Measure_X_Axis * rescale[pageIndex]);
            let my = parseInt(item.newarr.Measure_Y_Axis * rescale[pageIndex]);
            item.x = x;
            item.y = y;
            item.width = w;
            item.height = h;
            item.Crop_X_Axis = x;
            item.Crop_Y_Axis = y;
            item.Crop_Width = w;
            item.Crop_Height = h;
            item.Circle_X_Axis = cx;
            item.Circle_Y_Axis = cy;
            item.Measure_X_Axis = mx;
            item.Measure_Y_Axis = my;
        }
        if (item.hasOwnProperty("xx")) {
            newPositionBAlloon.push({ ...item })
        }
        let b = item.Balloon.toString();
        item.Balloon = b.replaceAll(".", "-");
        item.Balloon_Text_FontSize = 12;
        if (item.isballooned) {
            return { ...item, isballooned: true, selectedRegion: "" };
        } else {return false }
    }).filter(a =>  a !== false);

    const newrects = rearrangedPageBalloon(ballonDetails);
    const groupedByPage = newrects.reduce((acc, item) => {
        (acc[item.Page_No] = acc[item.Page_No] || []).push(item); 
        return acc;
    }, {});
    
    const canvasSize = props.partial_image;
    const canvasReSize = props.resized_image;
    const drawingDetails = props.drawingDetails;
    const controllCopy = props.controllCopy;
    const controllCopyByPage = shortBalloon(controllCopy, "pageNo");
    const drawings = Object.keys(groupedByPage).map((key, index) => ({
        balloons: groupedByPage[key],
        canvasSize: canvasSize[index],
        canvasReSize: (canvasReSize[index] === null || canvasReSize[index] === undefined) ? {width:7000,height:5000} :canvasReSize[index],
        drawingDetails: drawingDetails[index],
        controllCopy: controllCopyByPage[index]
    }));
 
    const convertStagesToImages = () => {
        try {
            const images = stageRefs.current.map((stageRef, i) => {
                const stageW = stageRef.width();
                const stageH = stageRef.height();
                // Dynamically adjust pixelRatio to avoid exceeding browser canvas limits (~16384px or ~268M pixels)
                const maxPixels = 268000000;
                let ratio = 2;
                while (ratio > 1 && (stageW * ratio) * (stageH * ratio) > maxPixels) {
                    ratio -= 0.5;
                }
                ratio = Math.max(ratio, 1);
                const dataURL = stageRef.toDataURL({ mimeType: "image/png", pixelRatio: ratio });
                return dataURL;
            });
            return images;
        } catch (err) {
            console.error('Unable to export canvas:', err);
        }
    };

    React.useImperativeHandle(ref, () => ({
        callMethod: convertStagesToImages
    }));
    const getWidth = (text, fontSize) => {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        ctx.font = `normal ${fontSize}px Calibri`;
        var metrics = ctx.measureText(text);
        return metrics.width;
    }
    const getHeight = (text, fontSize) => {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        ctx.font = `normal ${fontSize}px Calibri`;
        var metrics = ctx.measureText(text);
        var textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        return textHeight;
    }

    return (
        <div key={"konvaWrapper"}>
            {showdownloadComponent && drawings.map((item, i) => {
                
                const PageData = item.balloons; 
                // Get the first item
                const firstItem = PageData[0];
                const StartBalloon = parseInt(firstItem.Balloon);
                // Get the last item
                const lastItem = PageData[PageData.length - 1];
                const EndBalloon = parseInt(lastItem.Balloon);

                var padding = initialState.pad;
               
                var ow = item.canvasSize.fullWidth;
                var oh = item.canvasSize.fullHeight;
                let changed = false;
                let scaleFactor = 1;
                if (ow > 7000 || oh > 7000) {
                    changed = true;
                    var cow = item.canvasReSize.width;
                    var coh = item.canvasReSize.height;
                     var widthRatio = ow / cow;     //misplaced - controlcpy
                     var heightRatio = oh / coh;    //misplaced - controlcpy
                    ow = cow;
                    oh = coh;
                    scaleFactor = Math.min(widthRatio, heightRatio);
                }
                //console.log(changed)
                const fontSize  = props.balloonFont;

                // Compute display-to-export scale (needed for CC and balloons)
                var targetW = initialState.win.width - (2 * padding);
                var targetH = initialState.win.height - (2 * padding);
                var widthFit = targetW / ow;
                var heightFit = targetH / oh;
                let diffscale = ow / oh;
                var scale = (widthFit > heightFit) ? ((diffscale < 1) ? widthFit : heightFit) : widthFit;
                let w = parseInt(ow * scale, 10);
                let h = parseInt(oh * scale, 10);
                let bal_ScaledX = ow / w;
                let bal_ScaledY = oh / h;

                if (changed) {
                   // bal_ScaledX = scaleFactor;
                }
                let fontSizeScale = 0;
                let fontText = 1;
                if (props.fontScale > 0 || props.fontScale < 0) {
                    fontSizeScale = props.fontScale / 100
                }
                if (props.fontScale === 0) {
                    fontSizeScale = 0
                }
                fontText = props.bgImgScale + fontSizeScale * props.bgImgScale;

                // CC text layout - mirror Controlledcopy.js exactly, using bal_ScaledX as scale
                let ccScale = bal_ScaledX;
                let cc_height = getHeight(`CONTROLLED COPY`, fontSize) + fontSize;
                let txt_bs_width = getWidth(`B.NO START - `, fontSize);
                let no_bs_width = getWidth(`${StartBalloon}\t`, fontSize) + fontSize;
                let txt_be_width = getWidth(`B.NO END -\t`, fontSize);
                let no_be_width = getWidth(`${EndBalloon}`, fontSize);
                let tot_start_width = (txt_bs_width + no_bs_width);
                let eb_width = (tot_start_width + txt_be_width);

                let rect_width = (eb_width + no_be_width) * ccScale + props.rectPadding * ccScale;
                let rect_height = cc_height * 2 * ccScale + props.rectPadding / 2 * ccScale;
                let textTemplates = [
                    { text: "CONTROLLED COPY", x: 0, y: 0, fontSize: (fontSize + 2) * ccScale, fill: "#0071be", stroke: "#0071be", lineHeight: 1 },
                    { text: `B.NO START - `, x: 0, y: cc_height * ccScale, fontSize: fontSize * ccScale, fill: "#000", stroke: "#000", lineHeight: 1 },
                    { text: `${StartBalloon}\t`, x: txt_bs_width * ccScale, y: cc_height * ccScale, fontSize: fontSize * ccScale, fill: "#0071be", stroke: "#0071be", lineHeight: 1 },
                    { text: `B.NO END -\t`, x: tot_start_width * ccScale, y: cc_height * ccScale, fontSize: fontSize * ccScale, fill: "#000", stroke: "#000", lineHeight: 1 },
                    { text: `${EndBalloon}`, x: eb_width * ccScale, y: cc_height * ccScale, fontSize: fontSize * ccScale, fill: "#0071be", stroke: "#0071be", lineHeight: 1 },
                ];
                let ItemBalloon =  item.balloons.filter(a => {
 
                    a.Measure_X_Axis = a.Measure_X_Axis / scaleFactor;
                    a.Measure_Y_Axis = a.Measure_Y_Axis / scaleFactor;
                    a.Circle_X_Axis = a.Circle_X_Axis / scaleFactor;
                    a.Circle_Y_Axis = a.Circle_Y_Axis / scaleFactor;
                    a.Crop_Width = a.Crop_Width / scaleFactor;
                    a.Crop_Height = a.Crop_Height / scaleFactor;
                    return a;
                });
               // console.log(props.setImages);

                return (                   
                        <React.Fragment key={i + "annotation_image_stagef"}>
                            <Stage
                                key={i + "annotation_image_stage"}
                                width={parseInt(ow)}
                                height={parseInt(oh)}
                                x={parseInt(item.canvasSize.x)}
                                y={parseInt(item.canvasSize.y)}
                                ref={el => (stageRefs.current[i] = el)}>
                                <Layer key={i + "annotation_image_layer"}>

                                    <Group
                                        key={i + "annotation_image_group"}
                                        width={parseInt(ow)}
                                        height={parseInt(oh)}
                                        x={parseInt(item.canvasSize.x)}
                                        y={parseInt(item.canvasSize.y)}
                                    ref={gel => (groupRefs.current[i] = gel)}
                                    >                                        
                                        {
                                             <PatternImage  
                                                key={i + "annotation_image"}
                                                src={props.setImages[i].url}
                                                alt={props.setImages[i].fileName}
                                                width={parseInt(ow)}
                                                height={parseInt(oh)}
                                                x={parseInt(item.canvasSize.x)}
                                                y={parseInt(item.canvasSize.y)}
                                            />
                                        }
                                        {/* Watermark: map from screen coordinates to export image coordinates */}
                                        <WatermarkOverlay
                                            areaW={parseInt(ow)}
                                            areaH={parseInt(oh)}
                                            offsetX={parseInt(item.canvasSize.x) || 0}
                                            offsetY={parseInt(item.canvasSize.y) || 0}
                                            exportScale={bal_ScaledX || 1}
                                            imgW={parseInt(ow)}
                                            imgH={parseInt(oh)}
                                        />
    <Group
      key={i + "cc_group"}
      x={parseInt(item.controllCopy?.origin?.x || 0) * ow / (props.imageWidth || ow) + (props.bgImgW > 0 ? props.rectPadding * 2 * ow / props.bgImgW : 0)}
      y={parseInt(item.controllCopy?.origin?.y || 0) * oh / (props.imageHeight || oh) + (props.bgImgH > 0 ? props.rectPadding * 2 * oh / props.bgImgH : 0)}
      ref={(cel) => (ccRefs.current[i] = cel)}
    >
                                                <Rect
                                                    ref={crel => (ccRRefs.current[i] = crel)}
                                                    key={i + "cc_group_rect"}
                                                    x={-props.rectPadding * ccScale}
                                                    y={-props.rectPadding * ccScale}
                                                    width={rect_width + props.rectPadding * ccScale}
                                                    height={rect_height + props.rectPadding * ccScale}
                                                    fill="transparent"
                                                    stroke={props.defaultPicker}
                                                    strokeWidth={0.5 * bal_ScaledX}
                                                    cornerRadius={0}
                                                />
                                                {textTemplates.map((textObj, index) => (
                                                    <Text
                                                        key={i+"_cc_"+index}
                                                        text={textObj.text}
                                                        x={textObj.x}
                                                        y={textObj.y}
                                                        fontSize={textObj.fontSize}
                                                        fill={textObj.fill}
                                                        stroke={textObj.stroke}
                                                        fontStyle="bold"
                                                        strokeWidth={0.5}
                                                        lineHeight={textObj.lineHeight}
                                                        fontFamily="Calibri"
                                                        draggable={false}
                                                        wrap={"word"}
                                                        ellipsis={false}
                                                        align="left"
                                                        verticalAlign="middle"
                                                    />
                                                ))}
                                            </Group>  

                                        {ItemBalloon.length > 0 && (ItemBalloon.filter(a => {
                                            let radius = 7.5;
                                            let shapeAdjacent = -7;
                                            let shapeAdjacentX = -9;
                                            let shapeAdjacentY = -12;
                                            let circleWidth = 10;
                                            if (parseInt(a.Balloon) === 1)
                                                a.Balloon = 1
                                            switch (parseInt(a.Balloon).toString().length) {
                                                case 1:
                                                    radius = 7.5;
                                                    shapeAdjacent = -4;
                                                    shapeAdjacentX = -1.5;
                                                    shapeAdjacentY = -5;
                                                    circleWidth = 10 * fontText;
                                                    break;
                                                case 2:
                                                    radius = 8;
                                                    shapeAdjacent = -2;
                                                    shapeAdjacentX = -3;
                                                    shapeAdjacentY = -6;
                                                    circleWidth = 12 * fontText;
                                                    break;
                                                case 3:
                                                    radius = 10;
                                                    shapeAdjacent = 0;
                                                    shapeAdjacentX = -4.5;
                                                    shapeAdjacentY = -7;
                                                    circleWidth = 14 * fontText;
                                                    break;
                                                case 4:
                                                    radius = 11;
                                                    shapeAdjacent = 3;
                                                    shapeAdjacentX = -9;
                                                    shapeAdjacentY = -12;
                                                    circleWidth = 16 * fontText;
                                                    break;
                                                default:
                                                    radius = 7.5;
                                                    shapeAdjacent = -7;
                                                    shapeAdjacentX = -9;
                                                    shapeAdjacentY = -12;
                                                    circleWidth = 10 * fontText;
                                                    break;
                                            }
                                            var canvas = document.createElement('canvas');
                                            var ctx = canvas.getContext('2d');
                                            let fontSize = props.balloonFont * bal_ScaledX + fontSizeScale;
                                            ctx.font = `normal ${fontSize}px Calibri`;
                                            var initialMeasure = ctx.measureText(a.converted.toString());
                                            var textWidth = initialMeasure.width ;
                                           
                                            let circle_text_x = a.Circle_X_Axis - circleWidth * bal_ScaledX ;
                                            let circle_text_y = a.Circle_Y_Axis - circleWidth * bal_ScaledX   + a.Crop_Height / 2;
                                            a.desiredRadius = 1.3;
                                            a.shapeAdjacent = shapeAdjacent;
                                            a.BalloonRadius = radius;
                                            a.annotation = {
                                                ...{},
                                                circle_text_x: circle_text_x,
                                                circle_text_y: circle_text_y,
                                                circleWidth: circleWidth,
                                                textWidth: textWidth,
                                                shapeAdjacentX: shapeAdjacentX ,
                                                shapeAdjacentY: shapeAdjacentY,
                                                fontSize: fontSize
                                            }

                                            return a;
                                        }).map((ann, index) => (
                                            <Group key={i+"_"+index + "bal_group"}
                                                ref={bel => (balRefs.current[i] = bel)}
                                            >
                                                {(() => {
                                                    const shapeColor = (ann.newarr.BalloonColor !== "" ? ann.newarr.BalloonColor : props.defaultPicker);
                                                    const isDark = props.balloonMode === "dark";
                                                    const shapeFill = isDark ? shapeColor : "transparent";
                                                    const cw = ann.annotation.circleWidth * bal_ScaledX * scaleFactor;
                                                    const cx = ann.annotation.circle_text_x;
                                                    const cy = ann.annotation.circle_text_y;
                                                    const sw = 2;
                                                    const shapeRadius = cw / 2 / ann.desiredRadius;

                                                    switch (ann.BalloonShape) {
                                                        case 'Circle':
                                                            return <Circle key={i+"_"+index+"_ann_circle"} x={cx} y={cy} width={cw+4} height={cw} fill={shapeFill} stroke={shapeColor} strokeWidth={sw} />;
                                                        case 'Ring':
                                                            return <Ring key={i+"_"+index+"_ann_ring"} x={cx} y={cy} innerRadius={shapeRadius/2+2} outerRadius={shapeRadius+2} fill={shapeFill} stroke={shapeColor} strokeWidth={sw} />;
                                                        case 'Star':
                                                            return <Star key={i+"_"+index+"_ann_star"} x={cx} y={cy} innerRadius={shapeRadius/2+2} outerRadius={shapeRadius+2} numPoints={6} fill={shapeFill} stroke={shapeColor} strokeWidth={sw} />;
                                                        case 'Wedge':
                                                            return <Wedge key={i+"_"+index+"_ann_wedge"} x={cx} y={cy+shapeRadius} radius={cw*ann.desiredRadius} angle={60} rotation={-120} fill={shapeFill} stroke={shapeColor} strokeWidth={sw} />;
                                                        case 'Triangle':
                                                            return <RegularPolygon key={i+"_"+index+"_ann_tri"} x={cx} y={cy} sides={3} radius={cw} fill={shapeFill} stroke={shapeColor} strokeWidth={sw} />;
                                                        case 'Diamond':
                                                            return <RegularPolygon key={i+"_"+index+"_ann_diamond"} x={cx} y={cy} sides={4} radius={shapeRadius+2} fill={shapeFill} stroke={shapeColor} strokeWidth={sw} />;
                                                        case 'Square':
                                                            return <RegularPolygon key={i+"_"+index+"_ann_square"} x={cx} y={cy} sides={4} rotation={-135} radius={shapeRadius+2} fill={shapeFill} stroke={shapeColor} strokeWidth={sw} />;
                                                        case 'Pentagon':
                                                            return <RegularPolygon key={i+"_"+index+"_ann_pent"} x={cx} y={cy} sides={5} radius={shapeRadius} fill={shapeFill} stroke={shapeColor} strokeWidth={sw} />;
                                                        case 'Hexagon':
                                                            return <RegularPolygon key={i+"_"+index+"_ann_hex"} x={cx} y={cy} sides={6} radius={shapeRadius} fill={shapeFill} stroke={shapeColor} strokeWidth={sw} />;
                                                        case 'Octagon':
                                                            return <RegularPolygon key={i+"_"+index+"_ann_oct"} x={cx} y={cy} sides={8} radius={ann.BalloonRadius * bal_ScaledX * scaleFactor} fill={shapeFill} stroke={shapeColor} strokeWidth={sw} />;
                                                        default:
                                                            return <Circle key={i+"_"+index+"_ann_default"} x={cx} y={cy} width={cw+4} height={cw} fill={shapeFill} stroke={shapeColor} strokeWidth={sw} />;
                                                    }
                                                })()}

                                                {(!ann.BalloonShape.includes('Tooltip')) && (<Text
                                                    key={i + "_bal_" + index + "_" + ann.BalloonShape}
                                                    ref={bel => (balTextRefs.current[i] = bel)}
                                                    text={parseInt(ann.Balloon)}
                                                    x={ann.annotation.circle_text_x - (ann.annotation.circleWidth * bal_ScaledX * scaleFactor) / 2}
                                                    y={ann.annotation.circle_text_y - (ann.annotation.circleWidth * bal_ScaledX * scaleFactor) / 2}
                                                    width={(ann.annotation.circleWidth * bal_ScaledX * scaleFactor)}
                                                    height={(ann.annotation.circleWidth * bal_ScaledX * scaleFactor)}
                                                    fontSize={ann.annotation.fontSize / ann.desiredRadius}
                                                    fill={props.balloonMode === "dark" ? "#ffffff" : "black"}
                                                    stroke={props.balloonMode === "dark" ? "#ffffff" : "black"}
                                                    fontStyle="bold"
                                                    strokeWidth={0.8}
                                                    fontFamily="Calibri"
                                                    draggable={false}
                                                    wrap={"word"}
                                                    ellipsis={false}
                                                    align="center"
                                                    verticalAlign="middle"
                                                />)}

                                            </Group>
                                        ))
                                        )}

                                        {(props.Convert_to_mm) && ItemBalloon.filter(a => {
                                            const { defaultPicker, fontScale  } = useStore.getState();
                                             
                                            let fontSizeScale = 0;
                                            if (parseFloat(fontScale) > 0 || parseFloat(fontScale) < 0) {
                                                fontSizeScale = parseFloat(fontScale) / 10
                                            }
                                            if (parseFloat(fontScale) === 0) {
                                                fontSizeScale = 0
                                            }
 
                                            var canvas = document.createElement('canvas');
                                            var ctx = canvas.getContext('2d');
                                            let fontSize = props.balloonFont * bal_ScaledX + fontSizeScale  ;
                                            ctx.font = `normal ${fontSize}px Calibri`;
                                            var initialMeasure = ctx.measureText(a.converted.toString());
                                            var initialWidth = initialMeasure.width;
                              
                                            let circle_text_x = a.Measure_X_Axis !== a.Crop_X_Axis ? a.Measure_X_Axis : a.Measure_X_Axis - 7 * bal_ScaledX;
                                            let circle_text_y = a.Measure_Y_Axis !== a.Crop_Y_Axis ? a.Measure_Y_Axis : a.Measure_Y_Axis + 7 * bal_ScaledY;
                     
                                            let x = (circle_text_x);
                                            let y = (circle_text_y);
                                            let textHeight = 0;
                                            if (MeasureTextRefs.current[i]) {
                                              textHeight = MeasureTextRefs.current[i].height();
                                            }
                                           
                                           // let MeasureAnnotation = { ...{}, x: x, width: initialWidth, height: a.Circle_Height * bal_ScaledX, y: y }
                                            let MeasureAnnotation = { ...{}, defaultPicker: defaultPicker, fontSize: fontSize * scaleFactor, x: a.Measure_X_Axis !== a.Crop_X_Axis ? x : x - (a.Crop_Width / 2), width: initialWidth, height: textHeight, y: a.Measure_Y_Axis !== a.Crop_Y_Axis ? y : y + (a.Crop_Height * 1) -  (textHeight / 2) }
                                            a.MeasureAnnotation = MeasureAnnotation;
                                           // console.log(a.Balloon, a, fontSizeScale, scaleFactor, props.bgImgScale);
                                            return a.convert === true
                                        }).map((ann, mindex) =>
                                                    (<>
                                            <Group key={i + "_" + mindex + "measure_group"}
                                                x={ann.Measure_X_Axis + ann.Crop_Width}
                                                y={ann.Measure_Y_Axis - ann.Crop_Height / 2}
                                                width={ann.MeasureAnnotation.width }
                                                height={ann.MeasureAnnotation.height }
                                                        ref={bel => (MeasureGroupRefs.current[i] = bel)}
                                                    >
                                                <Text
                                                    key={i + "_" + mindex + "measure_text"}
                                                            ref={bel => (MeasureTextRefs.current[i] = bel)}
                          
                                                            text={ann.converted.toString()}
                                                            stroke={ann.defaultPicker} //"blue"
                                                            fontFamily="Calibri"
                                                            fontSize={ann.MeasureAnnotation.fontSize * fontText }
                                                            background={ann.MeasureAnnotation.defaultPicker}
                                                            fill={ann.MeasureAnnotation.defaultPicker}
                                                            strokeWidth={.25}
                                                            draggable={false}
                                                            wrap={"word"}
                                                            ellipsis={false}
                                                            align="center"
                                                            verticalAlign="middle"
                                                        />
                                                </Group>
                                                </>)
                                            )
                                        }
                                </Group>
                            </Layer>
                            </Stage>
                            </React.Fragment>
                );
            })
            };
        </div>
    );
});
export default KonvaDownload;
