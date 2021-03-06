import * as React from 'react';
import * as orgModel from '../../../data/models/organization/model';
import './component.css';
import OrgLogo from '../../OrgLogo';
import Owner from '../OwnerContainer';
import { NavLink } from 'react-router-dom';

export interface OrganizationProps {
    organization: orgModel.Organization;
}

interface OrganizationState {

}

export default class Organization extends React.Component<OrganizationProps, OrganizationState> {


    fullTimestamp(d: Date) {
        return Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            timeZoneName: 'short'
        }).format(d);
    }

    renderLogo(org: orgModel.Organization) {
        return (
            <OrgLogo logoUrl={org.logoUrl} size={30} organizationName={org.name} organizationId={org.id} />
        );
    }

    render() {
        const org = this.props.organization;
        return (
            <div className="OrganizationEntity-Accessible ">
                <div className="OrganizationEntity-Accessible-logoCol">
                    {this.renderLogo(org)}
                </div>
                <div className="OrganizationEntity-Accessible-mainCol">
                    <div className="OrganizationEntity-Accessible-name">
                        <NavLink to={`/orgs/${org.id}`}>
                            {org.name}
                        </NavLink>
                    </div>
                    <div className="OrganizationEntity-Accessible-researchInterests">
                        {org.researchInterests}
                    </div>
                    <div className="OrganizationEntity-Accessible-owner">
                        <Owner username={org.owner.username} showAvatar={false} avatarSize={20} />
                    </div>
                    {/* <div className="OrganizationEntity-Accessible-createdAt">
                        <Tooltip
                            placement="bottomRight"
                            mouseEnterDelay={0.5}
                            title={this.fullTimestamp(org.createdAt)}>
                            <span>
                                {Intl.DateTimeFormat('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                }).format(org.createdAt)}
                            </span>
                        </Tooltip>
                    </div> */}
                </div>
            </div>
        );
    }
}