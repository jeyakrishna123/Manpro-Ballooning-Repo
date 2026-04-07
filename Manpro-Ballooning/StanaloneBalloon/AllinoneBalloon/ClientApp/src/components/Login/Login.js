import React from 'react';
import { Input, Form, NavLink, Button } from 'reactstrap';
import './login.css';
import Image from '../Common/Image';
import * as Constants from '../Common/constants';
import initialState from "../Store/init";
import useStore from "../Store/store";
import { Navigate } from "react-router-dom";
//import { instance } from "../Client/http-common";
import { Overlay } from '../Common/Loader';
import classNames from "classnames";
import axios from "axios";
import { config, seo, CatchError, showAlert } from "../Common/Common";

const grad = (Constants.APP_LOGO === '') ? "1" : "1";

// #region Component Login
class Login extends React.Component {
    static displayName = "Login";
    constructor(props) {
        super(props)
        this.state = {
            submit: false,
            isVisiblepassword: false,
            credentials: { Email: '', Password: '' },
            emailErrors:[],
            passErrors: [],
            formErrors: {
                Email: '',
                Password: '',
            },
            poster:"",
        };
    }
    GlobalConfig = async () => {
        await fetch("/config.json")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load config");
                }
                return response.json();
            })
            .then((data) => {
               // console.log("Error fetching config:", data);
                useStore.setState({ AppSettings: data });
            })
            .catch((error) => {
                console.error("Error fetching config:", error);
            });
    };
    componentDidMount =   () => {
        this.setState({ poster: require(`../../assets/login-logo.jpg`) });
        console.log(config)
            seo({
                title: `${Login.displayName}`,
                metaDescription: config.APP_TITLE,
        
            });
       
    }
    componentWillUnmount = () => {
        seo({
            title: `${Login.displayName}`,
            metaDescription: config.APP_TITLE,
            
        });
    }
    loginValidate = () => {
        const data = {
            UserName: this.state.credentials.Email.toLowerCase(),
            Password: this.state.credentials.Password
        };
        let formErrors = this.state.formErrors;
        let emails = this.state.emailErrors;
        let passs = this.state.passErrors;
        formErrors.Email = '';
        formErrors.Password = '';
        emails = [];
        passs = [];
        let email = emails;
        let pass = passs;

        if ('' === data.UserName) {
            if (email.length === 0) email.push(!config.Demo ? 'Please enter UserName' : 'Please enter email');
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

        if (email.length > 0 || pass.length > 0) {
            if (email.length > 0) {
                formErrors.Email = email;
                this.setState({ emailErrors: email });
            } else {
                this.setState({  emailErrors: '' });
            }
            if (pass.length > 0) {
                formErrors.Password = pass;
                this.setState({ passErrors: pass });
            } else {
                this.setState({ passErrors: '' });
            }
            this.setState({ submit: false });
            return false;
        }
        this.setState({ passErrors: '', emailErrors:'' });
        return true;
    }
  
    handleSubmit1 = async (e) => {
        e.preventDefault();
        this.setState({ submit: true });
      // useStore.setState({ ...initialState, user: [{}] });
        const data = {
            UserName: this.state.credentials.Email.toLowerCase(),
            Password: this.state.credentials.Password
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
          //  let username = "11193446";
          //  let password = "60-dayfreetrial";
          //  const encodedCredentials = btoa(`${username}:${password}`);
            let BASE_URL = process.env.REACT_APP_SERVER;
            let url = BASE_URL + "/api/users/login";
            const apiClient = axios.create({
                baseURL: BASE_URL,
                headers: {
                   // 'Authorization': `Basic ${encodedCredentials}`, // Basic auth
                    'Content-Type': 'application/json',
                },
            });
            const res = await apiClient.post(url, data);
            this.setState({ submit: false });
            if (config.console)
            console.log(res)
            if (res.status === 200) {
              //  console.log(res)
                sessionStorage.setItem('user', JSON.stringify([res.data.User]));
                sessionStorage.setItem('roles', JSON.stringify(res.data.Roles));
                useStore.setState({ ...initialState, user: [res.data.User], roles:res.data.Roles, isLoading: false });
            }
        }
        catch (error) {
            this.setState({ submit: false });
            useStore.setState({ isLoading: false });
            console.log('catch', error);
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
            showAlert("Error", colllection.join("<br/>") );
        }
    }

    handleChange = e => {
        e.preventDefault()
        const cred = this.state.credentials;
        cred[e.target.name] = e.target.value;
        this.setState({ credentials: cred })
        this.loginValidate();
    }
    // #region Render HTML
    render() {
        let { user, isLoading } = useStore.getState();

        return (
            <>
            <Overlay isLoading={isLoading} />
            {user.length > 0 && (
                <Navigate to="/" replace={true} />
            )}
            <div className="login-wrapper">
                <div className="login-card">
                    <div className="login-header">
                        {(Constants.APP_LOGO === '') &&
                            <NavLink disabled className="applogo" href="#">
                                <Image name={Constants.APP_DEFAULT_LOGO} alt={Constants.APP_NAME} title={Constants.APP_NAME} className="gb_Hc" style={(config.Demo ? { height: "100px" } : {})} />
                                <div className="app-company">{Constants.APP_COMPANY}</div>
                            </NavLink>
                        }
                        {(Constants.APP_LOGO !== '') && (
                            <NavLink disabled className="applogo" href="#">
                                <Image name={Constants.APP_LOGO} alt={Constants.APP_NAME} title={Constants.APP_NAME} className="gb_Hc" style={(config.Demo ? { height: "100px" } : {})} />
                            </NavLink>
                        )}
                        <h4>INSPECTION EXPERT SYSTEM</h4>
                    </div>

                    <div className="login-body">
                        <div className="login-subtitle">Sign in to your account</div>
                        <Form autoComplete="off">
                            <div className="form-group">
                                <label htmlFor="Email">{config.Demo ? 'Email Address' : 'User Name'}</label>
                                <div className="input-wrapper">
                                    <i className="fa fa-user input-icon"></i>
                                    <Input
                                        id="Email"
                                        name="Email"
                                        type={config.Demo ? "email" : "text"}
                                        className="form-control"
                                        placeholder={config.Demo ? "Enter your email" : "Enter your username"}
                                        autoComplete="off"
                                        value={this.state.credentials.Email || ''}
                                        onChange={this.handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="Password">Password</label>
                                <div className="input-wrapper">
                                    <i className="fa fa-lock input-icon"></i>
                                    <Input
                                        id="Password"
                                        name="Password"
                                        type={this.state.isVisiblepassword ? "text" : "password"}
                                        className="form-control"
                                        style={{ paddingRight: '42px' }}
                                        placeholder="Enter your password"
                                        autoComplete="off"
                                        value={this.state.credentials.Password || ''}
                                        onChange={this.handleChange}
                                        required
                                    />
                                    <i
                                        className={classNames("fa toggle-password", { "fa-eye": !this.state.isVisiblepassword, "fa-eye-slash": this.state.isVisiblepassword })}
                                        onClick={() => this.setState({ isVisiblepassword: !this.state.isVisiblepassword })}
                                    ></i>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                onClick={this.handleSubmit1}
                                disabled={this.state.submit}
                                className="btn-login"
                            >
                                {this.state.submit ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </Form>
                    </div>

                    {config.Demo && (
                        <div className="login-footer">
                            Don't have an account? <NavLink className="d-inline" href="/signup">Sign Up</NavLink>
                        </div>
                    )}
                </div>
            </div>
            </>
        );

    }
    // #endregion
}
export default Login;
// #endregion