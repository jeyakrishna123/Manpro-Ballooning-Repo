import React, { useEffect } from "react";
import { Text, Group, Transformer, Rect } from "react-konva";
import useStore from "../Store/store";

const Measurement = ({ keyplace, fitscreen, shapeProps, isSelected, onSelect, onDblClick, onChange, onClick, dfontSize }) => {
    const groupRef = React.useRef();
    const textRef = React.useRef(null);
    const transformRef = React.useRef();
    const shapeRef = React.useRef();

 
    useEffect(() => {
        if (isSelected) {
            // we need to attach transformer manually
            transformRef.current.nodes([groupRef.current]);
            transformRef.current.getLayer().batchDraw();
        }
        
    }, [isSelected]);

    const onMouseEnterGroup = event => {
        event.target.getStage().container().style.cursor = "initial";
    };
    const onMouseEnter = event => {
        event.target.getStage().container().style.cursor = "move";
    };

    const onMouseLeave = event => {
        event.target.getStage().container().style.cursor = "crosshair";
    };
    const {  defaultPicker, fontScale, bgImgScale, zoomed } = useStore.getState();

    let desiredBalloon = 1;
    let fontSizeScale = 0;
    if (parseFloat(fontScale) > 0 || parseFloat(fontScale) < 0) {
        fontSizeScale = parseFloat(fontScale) / 10
    }
    if (parseFloat(fontScale) === 0) {
        fontSizeScale = 0
    }
    if (fitscreen) {
 
        desiredBalloon = 1.5;
    } 
 
   // if (fontText < 0) fontText = 0;
    // const maxTextWidth = 300;
    let [textWidth, settextWidth] = React.useState(300 );
    let [textHeight, settextHeight] = React.useState(20  );
    const [text, settext] = React.useState(shapeProps.converted.toString());
    let [fontSize, setFontSize] = React.useState(12 );
    let text1 = shapeProps.converted.toString();

    const getWidth = (text, fontSize) => {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        ctx.font = `normal ${fontSize}px Calibri`;
        var initialMeasure = ctx.measureText(text);
        
        return initialMeasure;
    }
    useEffect(() => {
        if (textRef.current) {
            const textNode = textRef.current;
            // Automatically adjust font size based on text length
            const textWidth = textNode.getTextWidth();
            const textHeight = textNode.height();
        
            settextWidth(textWidth);
            settextHeight(textHeight);
            setFontSize(dfontSize);
            settext(text1 );
            var initialMeasure = getWidth(text, fontSize);
            var initialWidth = initialMeasure.width;
            settextWidth(initialWidth);
            
           // console.log("inside", text, initialWidth, initialMeasure, textWidth, textHeight,  fontSize ) 
        }
    }, [textWidth, textHeight, fontSize, text, text1, fontSizeScale]);

 

    let circle_text_x = shapeProps.Measure_X_Axis;
    let circle_text_y = shapeProps.Measure_Y_Axis;
    if (fitscreen) {
        if (circle_text_x < 0)
            circle_text_x = shapeProps.Measure_X_Axis;
        if (circle_text_y < 10)
            circle_text_y = 10;
    }
    let x = (circle_text_x );
    let y = (circle_text_y);

    // console.log(circle_text_x, textWidth, (textWidth / desiredBalloon) / 2, text)
 

    if (!fitscreen) {
 
        fontSize = dfontSize + fontSizeScale ;
    }

    if (zoomed) {
        fontSize = fontSize + fontSizeScale ;
        var initialMeasure = getWidth(text, fontSize);
        var initialWidth = initialMeasure.width;
        textWidth = initialWidth;
    } else {
        var initialMeasure1 = getWidth(text, fontSize);
        var initialWidth1 = initialMeasure1.width;
        textWidth =  initialWidth1 ;
    }
    if (textRef.current) {
        textHeight = textRef.current.height();
    }
    let MeasureAnnotation = { ...{}, x: shapeProps.Measure_X_Axis !== shapeProps.Crop_X_Axis ? x : x - (shapeProps.Crop_Width / 2), width: textWidth, height: textHeight, y: shapeProps.Measure_Y_Axis !== shapeProps.Crop_Y_Axis ? y : y + (shapeProps.Crop_Height * 1) - ((fitscreen)? 0 : (textHeight / 2))   }
   // if (text === '130.58')
  //  console.log(text, x, y, fontSize, textWidth, fontScale, textHeight)
   // console.log(shapeProps.selectedRegion)
    return (
        <React.Fragment>      
              
            {(shapeProps.selectedRegion === "") &&  (
                <>
                    <Group
                       // {...MeasureAnnotation}
                        x={shapeProps.Measure_X_Axis + shapeProps.Crop_Width * 0.1}
                        y={shapeProps.Measure_Y_Axis - shapeProps.Crop_Height * 1.2}
                        key={keyplace+ "_measure_group_" + shapeProps.id}
                        id={keyplace + "_measure_group_" + shapeProps.id}
                        onMouseEnter={onMouseEnterGroup}
                        onClick={(e) => {
                          //  console.log("measure onDblClick", shapeProps.id, e)
                            e.evt.preventDefault(true);
                            e.evt.stopPropagation();
                         //   onClick({ ...shapeProps })
                         //   console.log("measure onDblClick", shapeProps.id, e)
                        }}
                        onDblClick={(e) => {
                            e.evt.preventDefault(true);
                            e.evt.stopPropagation();  
                            onDblClick({ ...shapeProps })
                            //console.log("measure onDblClick", shapeProps.id,e)
                        }}
                        
                        onMouseLeave={(e) => { }}
                        onMouseOver={(e) => { }}
                        onContextMenu={(e) => {  }}
                        draggable={isSelected ? true:false}
                        ref={groupRef}
                        onDragStart={(e) => { }}
                        onDragEnd={(e) => {
                            onChange({
                                mx: e.target.x(),
                                my: e.target.y()
                            });
                            useStore.setState({
                                ItemView: null,
                                isLoading: true, loadingText: "Updating new Position..."
                            })
                        }}
                        onTransformEnd={(e) => {
                            const node = groupRef.current;
                            onChange({
                                mx: node.x(),
                                my: node.y()
                            });
                        }}
                    >
                        {(isSelected) && (
                            <>
                                <Rect
                                    key={keyplace + "_ann_create_rect_" + shapeProps.BalloonShape}
                                    fill="#ffff"
                                    background={"#fff"}
                                    stroke={defaultPicker} //"red"
                                    onMouseDown={onSelect}
                                    ref={shapeRef}
                                    width={textWidth}
                                    height={textHeight * bgImgScale}
                                    strokeWidth={0}
                                   // dash={[3, 3]}
                                    draggable={false}
                                    onMouseEnter={onMouseEnter}
                                    onMouseLeave={onMouseLeave}

                                />

                            </>
                        )}
                        <Text
                            //{...MeasureAnnotation}
                            ref={textRef}
 
                            text={text}
                            fontFamily="Calibri"
                            fontSize={fontSize / desiredBalloon}
                            fill={defaultPicker}
                            stroke={defaultPicker}
                            strokeWidth={.25}
                            draggable={false}
                            wrap={"word"}
                            ellipsis={false}
                            align="center"
                            verticalAlign="middle"
                        />
                        </Group>
                    {isSelected && <Transformer  
                        fill={defaultPicker}
                        background={defaultPicker}
                        key={keyplace + "_measure_trans_" + shapeProps.BalloonShape}
                        rotateEnabled={false} borderDash={[3, 3]}
                        borderStroke={"#0071be"} padding={0}
                        resizeEnabled={false} ref={transformRef} />}
                </>
            )}
           
           
        </React.Fragment>
    );
};

export default Measurement;
