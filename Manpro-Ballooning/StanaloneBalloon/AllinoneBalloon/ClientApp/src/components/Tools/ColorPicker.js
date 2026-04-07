import React from "react";
import { SketchPicker } from 'react-color';
import reactCSS from 'reactcss';
import { RGBAToHexA } from '../Common/Common';
import useStore from "../Store/store";

export class SketchPickerComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            displayColorPicker: false,
            color: this.props.color ? this.props.color : {
                r: '241',
                g: '112',
                b: '19',
                a: '1',
            },
        }
    }

    handleClick = () => {
        this.setState({ displayColorPicker: !this.state.displayColorPicker })
    };

    handleClose = () => {
        this.setState({ displayColorPicker: false })
    };

    handleChange = (color) => {
        this.setState({ color: color.rgb })
        this.props.update(RGBAToHexA(`rgba(${this.state.color.r}, ${this.state.color.g}, ${this.state.color.b}, ${this.state.color.a})`));
    };

    render() {

        const styles = reactCSS({
            'default': {
                color: {
                    width: '36px',
                    height: '14px',
                    borderRadius: '2px',
                    border: '2px',
                    background: `rgba(${this.state.color.r}, ${this.state.color.g}, ${this.state.color.b}, ${this.state.color.a})`,
                    //  background: `${this.state.color}`,
                },
                swatch: {
                    padding: '5px',
                    background: '#fff',
                    borderRadius: '1px',
                    boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
                   // display: 'inline-block',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                popover: {
                    position: 'relative',
                    zIndex: '2',
                },
                cover: {
                    position: 'fixed',
                    top: '0px',
                    right: '0px',
                    bottom: '0px',
                    left: '0px',
                },
            },
        });
        const props = useStore.getState();
        const r = (props.user[0].role === "Admin" || props.user[0].role === "Supervisor") ? true : false;
        return (

            <div>
                <div style={styles.swatch} onClick={this.handleClick} >
                    <div style={styles.color} />
                </div>
                
                {this.state.displayColorPicker ? <div style={styles.popover}>
                    <div style={styles.cover} onClick={this.handleClose} />
                    {r ? <SketchPicker id={this.props.id} color={this.state.color} onChange={this.handleChange} />: null}
                </div> : null}
            </div >
        )
    }
}

