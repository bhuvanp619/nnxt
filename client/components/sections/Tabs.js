import React, {Component} from 'react'
import PropTypes from 'prop-types'
import Tab from '../tabs/Tab'
import {Loader} from 'react-loaders'
import {Route} from 'react-router-dom'
import * as U from "../../../server/utils";

import {
    ADMIN_PERMISSION_TAB,
    ADMIN_ROLE_FORM,
    ADMIN_ROLE_LIST,
    PERMISSION_FORM,
    PERMISSION_LIST,
    PERMISSION_TAB,
    ROLE_FORM,
    ROLE_LIST,
    ROLE_TAB,
    USER_FORM,
    USER_LIST,
    USER_PROFILE_FORM,
    USER_PROFILE_TAB,
    USER_TAB,
    EMPLOYEE_SETTING_TAB,
    EMPLOYEE_SETTING_FORM,
    LEAVE_SETTING_TAB,
    HOLIDAY_TAB,
    LEAVE_SETTING_FORM,
    HOLIDAY_FORM,
    HOLIDAY_LIST, EMAIL_TAB, EMAIL_TEMPLATE_FORM, EMAIL_TEMPLATE_LIST
} from "../componentConsts"

import {
    EDIT_PROFILE,
    EDIT_ROLE_PERMISSIONS,
    LIST_USERS,
    MANAGE_PERMISSIONS,
    MANAGE_ROLES,
    CREATE_USER
} from "../../clientconstants"
import {
    AdminRoleFormContainer,
    AdminRoleListContainer,
    PermissionFormContainer,
    PermissionListContainer,
    RoleFormContainer,
    RoleListContainer,
    TabSectionContainer,
    UserFormContainer,
    UserListContainer,
    UserProfileFormContainer,
    EmployeeSettingFormContainer,
    LeaveSettingFormContainer,
    HolidayFormContainer,
    HolidayListContainer,
    EmailTemplateFormContainer,
    EmailTemplatesListContainer

} from "../../containers"
import * as A from "../../actions";
import * as logger from '../../clientLogger'


class Tabs extends Component {
    constructor(props) {
        super(props)
        logger.debug(logger.TABS_LIFE_CYCLE, 'constructor()')
        this.changeTab = this.changeTab.bind(this)
        this.tabData = []

        let permissions = this.props.loggedInUser.permissions


        if (permissions.includes(EDIT_PROFILE)) {
            this.tabData.push({
                name: USER_PROFILE_TAB, url: "/profile",
                render: (props) => {
                    return <TabSectionContainer>
                        <UserProfileFormContainer name={USER_PROFILE_FORM}/>
                    </TabSectionContainer>
                }
            })
        }

        if (permissions.includes(MANAGE_PERMISSIONS)) {
            this.tabData.push({
                name: PERMISSION_TAB, url: "/permission",
                render: (props) => {
                    return <TabSectionContainer>
                        <PermissionFormContainer name={PERMISSION_FORM}/>
                        <PermissionListContainer name={PERMISSION_LIST}/>
                    </TabSectionContainer>
                }
            })
        }
        if (permissions.includes(MANAGE_ROLES)) {
            this.tabData.push({
                name: ROLE_TAB, url: "/role",
                render: (props) => {
                    return <TabSectionContainer>
                        <RoleFormContainer name={ROLE_FORM}/>
                        <RoleListContainer name={ROLE_LIST}/>
                    </TabSectionContainer>
                }
            })
        }

        /*
        if (permissions.includes(LIST_USERS)) {
            this.tabData.push({
                name: ADMIN_USER_TAB, displayName: "Users", url: "/admin-user",
                render: (props) => {
                    return <TabSectionContainer>
                        <AdminUserFormContainer name={ADMIN_USER_FORM}/>
                        <AdminUserListContainer name={ADMIN_USER_LIST}/>
                    </TabSectionContainer>
                }
            })
        }
        */

        if (permissions.includes(LIST_USERS)) {
            this.tabData.push({
                name: USER_TAB, url: "/users",
                render: (props) => {
                    return <TabSectionContainer>
                        <UserFormContainer name={USER_FORM}/>
                        <UserListContainer name={USER_LIST}/>
                    </TabSectionContainer>
                }
            })
        }

        if (permissions.includes(EDIT_ROLE_PERMISSIONS)) {
            this.tabData.push({
                name: ADMIN_PERMISSION_TAB,
                url: "/admin-permission",
                displayName: "Permissions",
                render: (props) => {
                    return <TabSectionContainer>
                        <AdminRoleFormContainer name={ADMIN_ROLE_FORM}/>
                        <AdminRoleListContainer name={ADMIN_ROLE_LIST}/>
                    </TabSectionContainer>
                }
            })
        }
        if (permissions.includes(CREATE_USER)) {
            this.tabData.push({
                name: EMPLOYEE_SETTING_TAB,
                url: "/employee-setting",
                render: (props) => {
                    return <TabSectionContainer>
                        <EmployeeSettingFormContainer name={EMPLOYEE_SETTING_FORM}/>
                    </TabSectionContainer>
                }
            })
        }
        if (permissions.includes(CREATE_USER)) {
            this.tabData.push({
                name: LEAVE_SETTING_TAB,
                url: "/leave-setting",
                render: (props) => {
                    return <TabSectionContainer>
                        <LeaveSettingFormContainer name={LEAVE_SETTING_FORM}/>
                    </TabSectionContainer>
                }
            })
        }
        if (permissions.includes(CREATE_USER)) {
            this.tabData.push({
                name: EMAIL_TAB,
                url: "/email-templates",
                render: (props) => {
                    return <TabSectionContainer>
                        <EmailTemplateFormContainer name={EMAIL_TEMPLATE_FORM}/>
                        <EmailTemplatesListContainer name={EMAIL_TEMPLATE_LIST}/>
                    </TabSectionContainer>
                }
            })
        }
        if (permissions.includes(LIST_USERS)) {
            this.tabData.push({
                name: HOLIDAY_TAB,
                url: "/holiday",
                render: (props) => {
                    return <TabSectionContainer>
                        <HolidayFormContainer name={HOLIDAY_FORM}/>
                        <HolidayListContainer name={HOLIDAY_LIST}/>
                    </TabSectionContainer>
                }
            })
        }


        if (this.tabData.length > 0) {
            this.state = {
                activeTab: this.tabData[0]
            }
        }
    }

    componentDidMount() {
        logger.debug(logger.TABS_LIFE_CYCLE, 'componentDidMount()')
        if (this.tabData && this.tabData.length > 0) {
            this.changeTab(null, this.tabData[0])
        }
    }

    changeTab(e, tab) {
        logger.debug(logger.TABS_CHANGE_TAB, 'Tab [' + tab.name + '] clicked...')
        const {store} = this.context;
        switch (tab.name) {
            case USER_PROFILE_TAB:
                store.dispatch(A.showUserInfo())
                store.dispatch(A.showComponentHideOthers(USER_PROFILE_FORM))
                break;

            case PERMISSION_TAB:
                store.dispatch(A.getAllRolesFromServer())
                store.dispatch(A.getAllPermissionsFromServer())
                store.dispatch(A.showComponentHideOthers(PERMISSION_LIST))
                break;

            case ROLE_TAB:
                store.dispatch(A.getAllRolesFromServer())
                store.dispatch(A.showComponentHideOthers(ROLE_LIST))
                break;

            case USER_TAB:
                store.dispatch(A.getAllRolesFromServer())
                store.dispatch(A.getAllUsersFromServer())
                store.dispatch(A.showComponentHideOthers(USER_LIST))
                break;

            case ADMIN_PERMISSION_TAB:
                store.dispatch(A.getAllRolesFromServer())
                store.dispatch(A.showComponentHideOthers(ADMIN_ROLE_LIST))
                break

            case EMPLOYEE_SETTING_TAB:
                store.dispatch(A.getEmployeeSettingFromServer())
                store.dispatch(A.showComponentHideOthers(EMPLOYEE_SETTING_FORM))
                break;

            case LEAVE_SETTING_TAB:
                store.dispatch(A.getLeaveSettingFromServer())
                store.dispatch(A.showComponentHideOthers(LEAVE_SETTING_FORM))
                break;

            case EMAIL_TAB:
                store.dispatch(A.getAllEmailTemplatesFromServer())
                store.dispatch(A.getAllEmailTemplatesTypesFromServer())
                store.dispatch(A.showComponentHideOthers(EMAIL_TEMPLATE_LIST))
                break;

            case HOLIDAY_TAB:
                store.dispatch(A.getAllHolidayYearsFromServer())
                let currentYear = U.getCurrentYear()
                store.dispatch(A.getAllHolidaysOfYearFromServer(currentYear))
                store.dispatch(A.showComponentHideOthers(HOLIDAY_LIST))
                break;
        }
        this.setState({
            activeTab: tab
        });
    }

    render() {
        logger.debug(logger.TABS_RENDER, this.props)
        return <div>
            <Loader type="square-spin" active={this.props.showLoader}/>
            <div className="col-md-12 adminTabs">
                <ul className="nav nav-tabs">
                    {this.tabData && this.tabData.length && this.tabData.map(function (tab, idx) {
                        return (
                            <Tab key={idx} data={tab} match={this.props.match} isActive={this.state.activeTab === tab}
                                 handleClick={(e) => this.changeTab(e, tab)} {...this.props}/>
                        );
                    }.bind(this))}
                </ul>
            </div>
            {this.tabData.length > 0 &&
            <Route key={"admin_idx_route"} exact path={this.props.match.url} render={this.tabData[0].render}/>}
            {
                this.tabData && this.tabData.length && this.tabData.map(function (tab, idx) {
                    return (
                        <Route key={"route" + idx} path={this.props.match.url + tab.url} render={tab.render}/>
                    );
                }.bind(this))
            }
        </div>
    }
}

Tabs.contextTypes = {
    store: PropTypes.object
}


export default Tabs