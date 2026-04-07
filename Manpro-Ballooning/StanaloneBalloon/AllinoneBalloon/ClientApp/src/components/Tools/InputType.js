import React from "react";
import { Input } from "reactstrap";
import useStore from "../Store/store";

export class InputComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            value: ""
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleChangeAngle = this.handleChangeAngle.bind(this);
        this.handleAngleChange = this.handleAngleChange.bind(this);
    }
    handleChange = (e) => {
        this.setState({ value: e.target.value });
        this.props.update(e.target.value);
    };
    handleChangeAngle = (e) => {
        this.setState({ value: e.target.value });
    }
     handleAngleChange = (e) => {
        var decimal = /^[1-9]+\/[1-9]+$/;
         let bool = e.target.value.match(decimal);
         let state = useStore.getState();
        if (bool) {
            this.props.update(e.target.value);
        } else {
            this.props.update(state.MinMaxAngles);
            document.getElementById('angles').value = state.MinMaxAngles;
        }
    }
    render() {
        const props = useStore.getState();
        const r = (props.user[0].role === "Admin" || props.user[0].role === "Supervisor") ? true : false;
    return(
        <>
            {(this.props.id === "angles") && (
            <>
                    <Input
                        placeholder={this.props.placeholder} 
                        id={this.props.id} 
                        disabled={r ? "" : "disabled"}
                        name={this.props.name}
                        type={this.props.type}
                        className={this.props.className}
                        value={this.props.value}
                        onBlur={this.handleAngleChange} 
                        onChange={this.handleChangeAngle} />
            </>
            )}
            {(this.props.type === "text" && this.props.id !== "angles") && (
            <>
                    <Input
                        placeholder={this.props.placeholder}
                        disabled={r ? "" : "disabled"}
                        id={this.props.id} name={this.props.name}
                        type={this.props.type}
                        className={this.props.className}
                        value={this.props.value}
                        onChange={this.handleChange} />
            </>
            )}
        </>
        )}       
}
