import React from 'react';
import { Container, Row, Col, Input, Label, Form, InputGroup, InputGroupText, NavLink, Button } from 'reactstrap';
import './signup.css';
import Image from '../Common/Image';
import * as Constants from '../Common/constants';
import useStore from "../Store/store";
import { Navigate } from "react-router-dom";
//import { instance } from "../Client/http-common";
import { Overlay } from '../Common/Loader';
import classNames from "classnames";
import axios from "axios";
import { config, seo, CatchError, showAlert } from "../Common/Common";

const grad = (Constants.APP_LOGO === '') ? "1" : "1";
class SignupPage extends React.Component {
    static displayName = "Signup";
    constructor(props) {
        super(props)
        this.state = {
            submit: false,
            created: false,
            isVisiblepassword: false,
            isVisiblecpassword: false,
            credentials: {
                Email: '',
                Password: '',
                CPassword: '',
            },
            emailErrors: [],
            passErrors: [],
            cpassErrors: [],
            formErrors: {
                Email: '',
                Password: '',
                CPassword: '',
            }
        };
    }
    componentDidMount = () => {
         
        seo({
            title: `${SignupPage.displayName}`,
            metaDescription: config.APP_TITLE
        });
    }
    componentWillUnmount = () => {
        seo({
            title: `${SignupPage.displayName}`,
            metaDescription: config.APP_TITLE
        });
    }
    loginValidate = () => {
        const data = {
            UserName: this.state.credentials.Email.toLowerCase(),
            Password: this.state.credentials.Password,
            CPassword: this.state.credentials.CPassword,
        };
        let formErrors = this.state.formErrors;
        let emails = this.state.emailErrors;
        let passs = this.state.passErrors;
        let cpasss = this.state.cpassErrors;
        formErrors.Email = '';
        formErrors.Password = '';
        formErrors.CPassword = '';
        emails = [];
        passs = [];
        cpasss = [];
        let email = emails;
        let pass = passs;
        let cpass = cpasss;

        if ('' === data.UserName) {
            if (email.length === 0) email.push(!config.Demo ? 'Please enter UserName' :'Please enter email');
        }
        if (config.Demo) {
            if (!/^[\w+\.]+@(?:[\w]+\.)+[A-Za-z]+$/.test(data.UserName)) {
                if (email.length === 0) email.push('Please enter a valid email');
            }
        }

        if ('' === data.Password) {
            if (pass.length === 0) pass.push('Please enter a password');
        }

        if (data.Password.length < 7) {
            if (pass.length === 0) pass.push('The password must be 8 characters or longer');
        }
        if (data.Password.length !== data.CPassword.length || data.Password !== data.CPassword) {
            if (cpass.length === 0) cpass.push('Passwords do not match');
        }

        if (email.length > 0 || pass.length > 0 || cpass.length > 0) {
            if (email.length > 0) {
                formErrors.Email = email;
                this.setState({ emailErrors: email });
            } else {
                this.setState({ emailErrors: '' });
            }
            if (pass.length > 0) {
                formErrors.Password = pass;
                this.setState({ passErrors: pass });
            } else {
                this.setState({ passErrors: '' });
            }
            if (cpass.length > 0) {
                formErrors.CPassword = cpass;
                this.setState({ cpassErrors: cpass });
            } else {
                this.setState({ cpassErrors: '' });
            }
            this.setState({ submit: false });
            return false;
        }
        this.setState({ passErrors: '', emailErrors: '' });
        return true;
    }

    handleSubmit1 = async (e) => {
        e.preventDefault();
        this.setState({ submit: true });
        // useStore.setState({ ...initialState, user: [{}] });
        const data = {
            UserName: this.state.credentials.Email.toLowerCase(),
            Password: this.state.credentials.Password,
            CPassword: this.state.credentials.CPassword,
        };
        let v = this.loginValidate();


        if (!v) {
            let formErrors = this.state.formErrors;
            // console.log(formErrors);
            this.handleValidationErrors(formErrors);
            return;
        }
        useStore.setState({ isLoading: true, loadingText: "connecting..." });

        try {
            let BASE_URL = process.env.REACT_APP_SERVER;
            let url = BASE_URL + "/api/users/createOwn";
            const apiClient = axios.create({
                baseURL: BASE_URL,
                headers: {
                    // 'Authorization': `Basic ${encodedCredentials}`, // Basic auth
                    'Content-Type': 'application/json',
                },
            });
            const res = await apiClient.post(url, data);
            this.setState({ submit: false });
            if (res.status === 200) {
                // console.log(res.User)
                useStore.setState({ isLoading: false });
                showAlert("Success", res.data);
                this.setState({ created: true })
                
            }
        }
        catch (error) {
            this.setState({ submit: false });
            useStore.setState({ isLoading: false });
            //console.log('catch', error);
            CatchError(error)
        }
    };

    handleValidationErrors = (errors) => {
        let colllection = [];
        for (const field in errors) {
            if (errors.hasOwnProperty(field)) {
                const messages = errors[field];
                for (const message of messages) {
                    // console.error(`${field}: ${message}`);
                    colllection.push(`<span>${message}</span>`);
                }
            }
        }
        if (colllection.length > 0) {
            showAlert("Error", colllection.join("<br/>"));
        }
    }

    handleChange = e => {
        e.preventDefault()
        const cred = this.state.credentials;
        cred[e.target.name] = e.target.value;
        this.setState({ credentials: cred })
        this.loginValidate();
    }

    render() {
        let { user, isLoading } = useStore.getState();

        return (
            <>
                <Overlay isLoading={isLoading} />
                <Container className=" gradient-form ">
                    <>
                        {this.state.created && (<Navigate to="/login" replace={true} />)}
                        {user.length > 0 && (
                            <Navigate to="/" replace={true} />
                        )}
                    </>
                    <Row>

                        <Col col='6' className="mb-0 mt-5 col-md-6">
                            <div className="d-flex flex-column ms-5">

                                <div className="text-center">
                                    {(Constants.APP_LOGO === '') &&
                                        <NavLink
                                            disabled
                                            className="applogo"
                                            href="#"
                                        >
                                            <Image name={Constants.APP_DEFAULT_LOGO} alt={Constants.APP_NAME} title={Constants.APP_NAME} className="gb_Hc" style={{ height: (!config.Demo? "50px":"100px") }} />
                                            <div>{Constants.APP_COMPANY}</div>
                                        </NavLink>
                                    }
                                    {(Constants.APP_LOGO !== '') &&
                                        <Image name={Constants.APP_LOGO} alt={Constants.APP_NAME} title={Constants.APP_NAME} className="gb_Hc" style={{ height: (!config.Demo ? "50px" : "100px") }} />
                                    }
                                    <h4 className="mt-1 mb-5 pb-1">INSPECTION EXPERT SYSTEM</h4>
                                </div>

                                <Container className="loginform css-tmvzag" >
                                    <InputGroup className="justify-content-around">
                                        <Label className="mb-4 mt-4" >Create an account if not registered yet</Label>
                                    </InputGroup>
                                    <Form autoComplete="off" className="container">

                                        <div className="mb-2 d-flex">
                                            <div className="col-4 text-end">
                                                <Label for="Email" className="apW">{config.Demo ? (<>&nbsp;User Email&nbsp;</>) : (<>&nbsp;User Name&nbsp;</>)}</Label>
                                            </div>
                                            <InputGroup className="col">
                                            <Input
                                                id="Email"
                                                name="Email"
                                                type={config.Demo ? "email" : "text"}
                                                style={{ fontSize: 12 }}
                                                placeholder={config.Demo ? "Email" : 'User Name'}
                                                autoComplete="off"
                                                value={this.state.credentials.Email || ''}
                                                onChange={this.handleChange}
                                                required
                                            >
                                            </Input>
                                            </InputGroup>
                                        </div>

                                        <div className="mb-2 d-flex">
                                            <div className="col-4 text-end">
                                                <Label for="Password" className="apW">&nbsp;&nbsp;Password&nbsp;&nbsp;</Label>
                                            </div>
                                            <InputGroup className="col">
                                            <Input
                                                id="Password"
                                                name="Password"
                                                type={this.state.isVisiblepassword ? "text" : "password"}
                                                style={{ fontSize: 12 }}
                                                placeholder='Password'
                                                autoComplete="off"
                                                value={this.state.credentials.Password || ''}
                                                onChange={this.handleChange}
                                                required
                                            >
                                            </Input>
                                            <InputGroupText className="input-group-text" >
                                                <i
                                                    className={classNames("fa fa-eye", { "fa-eye-slash": !this.state.isVisiblepassword })}
                                                    onClick={() => this.setState({ isVisiblepassword: !this.state.isVisiblepassword })}
                                                ></i>
                                                </InputGroupText>
                                            </InputGroup>
                                        </div>

                                        <div className="mb-2 d-flex">
                                            <div className="col-4 text-end">
                                                <Label for="CPassword" className="apW">&nbsp;&nbsp;Confirm Password&nbsp;&nbsp;</Label>
                                            </div>
                                            <InputGroup className="col">
                                            <Input
                                                id="CPassword"
                                                name="CPassword"
                                                type={this.state.isVisiblecpassword ? "text" : "password"}
                                                style={{ fontSize: 12 }}
                                                placeholder='ConfirmPassword'
                                                autoComplete="off"
                                                value={this.state.credentials.CPassword || ''}
                                                onChange={this.handleChange}
                                                required
                                            >
                                            </Input>
                                            <InputGroupText className="input-group-text" >
                                                <i
                                                    className={classNames("fa fa-eye", { "fa-eye-slash": !this.state.isVisiblecpassword })}
                                                    onClick={() => this.setState({ isVisiblecpassword: !this.state.isVisiblecpassword })}
                                                ></i>
                                                </InputGroupText>
                                            </InputGroup>
                                        </div>

                                        <div className="text-center  pt-1 mb-1 pb-1">

                                            <Button type="submit"
                                                onClick={this.handleSubmit1}
                                                disabled={this.state.submit}
                                                className={"mb-4 w-10 submit"}
                                            >Sign Up</Button>
                                        </div>
                                    </Form>
                                </Container>
                                {config.Demo && (<>
                                    <Container className="text-center pt-6 text-gray-500 m-3">
                                        Already have an account? &nbsp;<NavLink className="text-primary cursor-pointer d-inline" href="/login">Login</NavLink>.
                                    </Container>
                                </>)}
                            </div>
                        </Col>

                        <Col col='6' className="mb-0 mt-5 col-md-6">
                            <div className={"d-flex flex-column  justify-content-center gradient-custom-" + grad + "  h-100 mb-4"} >
                                <div className="text-white px-3 py-4 p-md-5 mx-md-4">
                                    <h4 className="mb-4">Let's Begin with Auto Ballooning</h4>
                                    <p className="small mb-0">
                                        <video muted="" id="video" className="w-100" width={400} poster="https://cdn.brandfolder.io/IQ55YUSL/at/q5v89wff9wxr2svt6v4gg7gc/floating_beads.auto" loop="" autoPlay="">
                                            <source src="https://www.youtube.com/watch?v=PpHzoqv2YyI&feature=youtu.be" type="video/mp4" />
                                            Your browser does not support the html video tag.
                                        </video>
                                    </p>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </>
        );
    }
}
export default SignupPage;
