import { string, number } from "prop-types";
import { request } from "http";
import { T } from "antd/lib/upload/utils";
import { AppError, AppException } from "../types";

export interface GroupsServiceInfo {
    servname: string;
    version: string;
    servertime: number;
    gitcommithash: string
}

export interface BriefGroup {
    id: string;
    name: string;
    custom: {
        gravatarhash?: string
    }
    owner: string;
    // createdAt: number;
    // modifiedAt: number
}

export type GroupList = Array<BriefGroup>

export type Username = string;

export interface WorkspaceInfo {
    rid: string
    name: string
    narrname: string
    public: boolean
    perm: string
}

export interface AppInfo {
    rid: string
}

export interface Group {
    id: string
    name: string
    owner: Username
    admins: Array<Username>
    members: Array<Username>
    description: string
    createdate: number
    moddate: number
    resources: {
        workspace: Array<WorkspaceInfo>,
        catalogmethod: Array<AppInfo>
    }
    custom: {
        gravatarhash?: string
    }
}

export interface NewGroup {
    id: string
    name: string
    gravatarhash: string | null
    description: string
}

export interface GroupUpdate {
    name: string
    gravatarhash: string | null
    description: string
}

export interface Request {
    id: string
    groupid: string
    requester: Username
    type: string
    status: string
    resource: string
    resourcetype: string
    createdate: number
    expiredate: number
    moddate: number
}

export interface RequestWithCompletion extends Request {
    complete: false
}

export interface Completion {
    complete: true
}

export interface ErrorInfo {
    appcode: number
    apperror: string
    callid: string
    httpcode: number
    httpstatus: string
    message: string
    time: number
}

export interface ErrorResult {
    error: ErrorInfo
}

// Error types: (appcode)
// 10000	Authentication failed
// 10010	No authentication token
// 10020	Invalid token
// 20000	Unauthorized
// 30000	Missing input parameter
// 30001	Illegal input parameter
// 30010	Illegal user name
// 40000	Group already exists
// 40010	Request already exists
// 40020	User already group member
// 40030	Workspace already in group
// 50000	No such group
// 50010	No such request
// 50020	No such user
// 50030	No such workspace
// 60000	Unsupported operation

export interface GroupExists {
    exists: boolean
}

// export interface GroupRequest {
//     id: string,
//     groupid: string,
//     requester: Username,
//     type: string,
//     status: string,
//     resource: string
//     resourcetype: string
//     createdate: number,
//     expiredate: number,
//     moddate: number
// }

export enum SortDirection {
    ASCENDING = 0,
    DESCENDING
}

export interface GetRequestsParams {
    includeClosed?: boolean,
    sortDirection?: SortDirection,
    startAt?: Date
}

export interface RequestMemebershipParams {
    groupId: string
}

export interface RequestNarrativeParams {
    workspaceId: number
    groupId: string
}

function promiseTry<T>(fun: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        try {
            return resolve(fun())
        } catch (ex) {
            reject(ex)
        }
    })
}

export interface GroupError {
    httpcode: number
    httpstatus: string
    appcode: number
    apperror: string
    message: string
    callid: string
    time: number
}

export class Exception extends Error {

}

export class GroupException extends AppException {
    originalError: GroupError
    constructor(error: GroupError) {
        super({
            code: 'group-exception',
            message: error.apperror,
            detail: error.message,
            info: new Map<string, any>([
                ['httpcode', error.httpcode],
                ['httpstatus', error.httpstatus],
                ['appcode', error.appcode],
                ['apperror', error.apperror],
                ['message', error.message],
                ['callid', error.callid],
                ['time', error.time]
            ])
        })
        this.name = 'GroupException'
        this.originalError = error
    }
}

export class ServerException extends AppException {
    constructor(detail: string) {
        super({ code: 'server-exception', message: 'Server Exception', detail: detail })
        this.name = 'ServerException'
    }
}

export class GroupsClient {
    token: string;
    url: string;

    constructor({ token, url }: { token: string, url: string }) {
        this.token = token
        this.url = url
    }

    getInfo(): Promise<GroupsServiceInfo> {
        return fetch(this.url + '/', {
            headers: {
                Authorization: this.token,
                Accept: 'application/json'
            },
            mode: 'cors'
        })
            .then((response) => {
                return response.json();
            })
            .then((result) => {
                return result as GroupsServiceInfo;
            });
    }

    groupExists(id: string): Promise<GroupExists> {
        return fetch(this.url + '/group/' + id + '/exists')
            .then((response) => {
                return response.json()
            })
            .then((exists) => {
                return exists as GroupExists
            })
    }

    // getGroups(): Promise<GroupList> {
    //     return fetch(this.url + '/group', {
    //         headers: {
    //             Authorization: this.token,
    //             Accept: 'application/json'
    //         },
    //         mode: 'cors'
    //     })
    //         .then((response) => {
    //             return response.json()
    //         })
    //         .then((result: GroupList) => {
    //             return result.filter(({ type }) => type === 'Organization')
    //         })
    // }


    getGroups(): Promise<Array<Group>> {
        let start = new Date().getTime()
        return fetch(this.url + '/group', {
            headers: {
                Authorization: this.token,
                Accept: 'application/json'
            },
            mode: 'cors'
        })
            .then((response) => {
                if (response.status !== 200) {
                    console.error('error fetching groups', response)
                    throw new Error('Error fetching groups')
                }
                return response.json()
            })
            .then((result: GroupList) => {
                return Promise.all(result.map((group) => (this.getGroupById(group.id))))
            })
            .then((result) => {
                return result;
            })
    }

    getGroupById(id: string): Promise<Group> {
        return fetch(this.url + '/group/' + id, {
            headers: {
                Authorization: this.token,
                Accept: 'application/json'
            },
            mode: 'cors'
        })
            .then((response) => {
                if (response.status === 404) {
                    return null
                }
                return response.json()
            })
            .then((result) => {
                return result as Group
            })
    }

    put<T>(path: Array<string>, body: any): Promise<T> {
        const url = ([this.url].concat(path)).join('/')
        return fetch(url, {
            headers: {
                Authorization: this.token,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            method: 'PUT',
            body: JSON.stringify(body)
        })
            .then((response) => {
                if (response.status === 500) {
                    switch (response.headers.get('Content-Type')) {
                        case 'application/json':
                            return response.json()
                                .then((result) => {
                                    throw new GroupException(result)
                                })
                        case 'text/plain':
                            return response.text()
                                .then((result) => {
                                    throw new ServerException(result)
                                })
                        default:
                            throw new Error('Unexpected content type: ' + response.headers.get('Content-Type'))
                    }
                } else if (response.status !== 200) {
                    throw new Error('Unexpected response: ' + response.status + ' : ' + response.statusText)
                } else {
                    return response.json()
                        .then((result) => {
                            return result as T
                        })
                }
            })
    }

    async post<T>(path: Array<string>, body: any): Promise<T | null> {
        const url = ([this.url].concat(path)).join('/')
        const response = await fetch(url, {
            headers: {
                Authorization: this.token,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            method: 'POST',
            body: body ? JSON.stringify(body) : ''
        })

        if (response.status === 500) {
            switch (response.headers.get('Content-Type')) {
                case 'application/json':
                    const result = await response.json()
                    throw new GroupException(result)
                case 'text/plain':
                    const errorText = await response.text()
                    throw new ServerException(errorText)
                default:
                    throw new Error('Unexpected content type: ' + response.headers.get('Content-Type'))
            }
        } else if (response.status === 200) {
            return await response.json() as T
        } else if (response.status === 204) {
            return null
        } else {
            throw new Error('Unexpected response: ' + response.status + ' : ' + response.statusText)
        }
    }

    async get<T>(path: Array<string>): Promise<T> {
        const url = ([this.url].concat(path)).join('/')
        const response = await fetch(url, {
            headers: {
                Authorization: this.token,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            method: 'GET'
        })

        if (response.status === 500) {
            switch (response.headers.get('Content-Type')) {
                case 'application/json':
                    const result = await response.json()
                    throw new GroupException(result)
                case 'text/plain':
                    const errorText = await response.text()
                    throw new ServerException(errorText)
                default:
                    throw new Error('Unexpected content type: ' + response.headers.get('Content-Type'))
            }
        } else if (response.status === 200) {
            return await response.json() as T
        } else {
            throw new Error('Unexpected response: ' + response.status + ' : ' + response.statusText)
        }
    }

    createGroup(newGroup: NewGroup): Promise<Group> {
        return this.put<Group>(['group', newGroup.id], {
            name: newGroup.name,
            custom: {
                gravatarhash: newGroup.gravatarhash
            },
            description: newGroup.description
        })
    }

    updateGroup(id: string, groupUpdate: GroupUpdate): Promise<void> {
        return fetch(this.url + '/group/' + id + '/update', {
            headers: {
                Authorization: this.token,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            method: 'PUT',

            // TODO: build more intelligently
            body: JSON.stringify({
                name: groupUpdate.name,
                custom: {
                    gravatarhash: groupUpdate.gravatarhash
                },
                description: groupUpdate.description
            })
        })
            .then((response) => {
                // response is an empty body.
                if (response.status === 204) {
                    return
                }
                throw new Error('Unexpected response: ' + response.status + ' : ' + response.statusText)
            })
    }

    async getRequest(requestId: string): Promise<Request> {
        const path = ['request', 'id', requestId]
        return await this.get<Request>(path)
    }

    getGroupRequests(groupId: string, params: GetRequestsParams): Promise<Array<Request>> {
        const query = new URLSearchParams()
        if (params.includeClosed) {
            query.append('closed', 'closed')
        }
        if (params.sortDirection) {
            if (params.sortDirection === SortDirection.DESCENDING) {
                query.append('order', 'desc')
            } else {
                query.append('order', 'asc')
            }
        }
        if (params.startAt) {
            query.append('excludeupto', String(params.startAt.getTime()))
        }

        return fetch(this.url + '/group/' + groupId + '/requests?' + query.toString(), {
            headers: {
                Authorization: this.token,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            method: 'GET'
        })
            .then((response) => {
                if (response.status !== 200) {
                    throw new Error('Unexpected response: ' + response.status + ' : ' + response.statusText)
                }
                return response.json()
            })
    }

    getTargetedRequests(params: GetRequestsParams): Promise<Array<Request>> {
        const query = new URLSearchParams()
        if (params.includeClosed) {
            query.append('closed', 'closed')
        }
        if (params.sortDirection) {
            if (params.sortDirection === SortDirection.DESCENDING) {
                query.append('order', 'desc')
            } else {
                query.append('order', 'asc')
            }
        }
        if (params.startAt) {
            query.append('excludeupto', String(params.startAt.getTime()))
        }
        return fetch(this.url + '/request/targeted?' + query.toString(), {
            headers: {
                Authorization: this.token,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            method: 'GET'
        })
            .then((response) => {
                if (response.status !== 200) {
                    throw new Error('Unexpected response: ' + response.status + ' : ' + response.statusText)
                }
                return response.json()
            })
    }
    getCreatedRequests(params: GetRequestsParams): Promise<Array<Request>> {
        const query = new URLSearchParams()
        if (params.includeClosed) {
            query.append('closed', 'closed')
        }
        if (params.sortDirection) {
            if (params.sortDirection === SortDirection.DESCENDING) {
                query.append('order', 'desc')
            } else {
                query.append('order', 'asc')
            }
        }
        if (params.startAt) {
            query.append('excludeupto', String(params.startAt.getTime()))
        }
        return fetch(this.url + '/request/created?' + query.toString(), {
            headers: {
                Authorization: this.token,
                Accept: 'application/json',
                'Content-Type': 'appcliation/json'
            },
            mode: 'cors',
            method: 'GET'
        })
            .then((response) => {
                if (response.status !== 200) {
                    throw new Error('Unexpected response: ' + response.status + ' : ' + response.statusText)
                }
                return response.json()
            })
    }

    requestMembership(params: RequestMemebershipParams): Promise<Request> {
        return fetch(this.url + '/group/' + params.groupId + '/requestmembership', {
            headers: {
                Authorization: this.token,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            method: 'POST'
        })
            .then((response) => {
                if (response.status !== 200) {
                    throw new Error('Unexpected response: ' + response.status + ' : ' + response.statusText)
                }
                return response.json()
            })
            .then((result) => {
                return result as Request
            })
    }

    addOrRequestNarrative(params: RequestNarrativeParams): Promise<RequestWithCompletion | Completion> {
        const url = [
            this.url,
            'group',
            params.groupId,
            'resource',
            'workspace',
            String(params.workspaceId)
        ].join('/')
        return fetch(url, {
            headers: {
                Authorization: this.token,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            method: 'POST'
        })
            .then((response) => {
                if (response.status !== 200) {
                    throw new Error('Unexpected response: ' + response.status + ' : ' + response.statusText)
                }
                return response.json()
            })
            .then((result) => {
                if (result.complete === false) {
                    return result as RequestWithCompletion
                } else {
                    return result as Completion
                }

            })
    }



    deleteResource(groupId: string, resourceType: string, resourceId: string): Promise<void> {
        const url = [
            this.url,
            'group',
            groupId,
            'resource',
            resourceType,
            resourceId
        ].join('/')
        return fetch(url, {
            headers: {
                Authorization: this.token,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            method: 'DELETE'
        })
            .then((response) => {
                if (response.status !== 204) {
                    throw new Error('Unexpected response: ' + response.status + ' : ' + response.statusText)
                }
            })
    }

    cancelRequest({ requestId }: { requestId: string }): Promise<Request> {
        return fetch(this.url + '/request/id/' + requestId + '/cancel', {
            headers: {
                Authorization: this.token,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            method: 'PUT'
        })
            .then((response) => {
                if (response.status !== 200) {
                    throw new Error('Unexpected response: ' + response.status)
                }
                return response.json()
            })
            .then((result) => {
                return result as Request
            })
    }

    acceptRequest({ requestId }: { requestId: string }): Promise<Request> {
        return fetch(this.url + '/request/id/' + requestId + '/accept', {
            headers: {
                Authorization: this.token,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            method: 'PUT'
        })
            .then((response) => {
                if (response.status !== 200) {
                    throw new Error('Unexpected response: ' + response.status)
                }
                return response.json()
            })
            .then((result) => {
                return result as Request
            })
    }

    grantReadAccessToRequestedResource({ requestId }: { requestId: string }): Promise<null> {
        const path = ['request', 'id', requestId, 'getperm']
        return this.post<null>(path, null)
    }


    denyRequest({ requestId }: { requestId: string }): Promise<Request> {
        return fetch(this.url + '/request/id/' + requestId + '/deny', {
            headers: {
                Authorization: this.token,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            method: 'PUT'
        })
            .then((response) => {
                if (response.status !== 200) {
                    throw new Error('Unexpected response: ' + response.status)
                }
                return response.json()
            })
            .then((result) => {
                return result as Request
            })
    }

    memberToAdmin({ groupId, member }: { groupId: string, member: string }): Promise<void> {
        const url = [
            this.url, 'group', groupId, 'user', member, 'admin'
        ].join('/')
        return fetch(url, {
            headers: {
                Authorization: this.token,
                Accept: 'application/json'
            },
            mode: 'cors',
            method: 'PUT'
        })
            .then((response) => {
                if (response.status !== 204) {
                    throw new Error('Unexpected response: ' + response.status + ':' + response.statusText)
                }

            })
    }

    adminToMember({ groupId, member }: { groupId: string, member: string }): Promise<void> {
        const url = [
            this.url, 'group', groupId, 'user', member, 'admin'
        ].join('/')
        return fetch(url, {
            headers: {
                Authorization: this.token,
                Accept: 'application/json'
            },
            mode: 'cors',
            method: 'DELETE'
        })
            .then((response) => {
                if (response.status !== 204) {
                    throw new Error('Unexpected response: ' + response.status + ':' + response.statusText)
                }

            })
    }

    removeMember({ groupId, member }: { groupId: string, member: string }): Promise<void> {
        const url = [
            this.url, 'group', groupId, 'user', member
        ].join('/')
        return fetch(url, {
            headers: {
                Authorization: this.token,
                Accept: 'application/json'
            },
            mode: 'cors',
            method: 'DELETE'
        })
            .then((response) => {
                if (response.status !== 204) {
                    throw new Error('Unexpected response: ' + response.status + ':' + response.statusText)
                }

            })
    }

    requestJoinGroup({ groupId, username }: { groupId: string, username: string }): Promise<Request> {
        const url = [
            this.url, 'group', groupId, 'user', username
        ].join('/')
        return fetch(url, {
            headers: {
                Authorization: this.token,
                Accept: 'application/json'
            },
            mode: 'cors',
            method: 'POST'
        })
            .then((response) => {
                if (response.status !== 200) {
                    throw new Error('Unexpected response: ' + response.status + ':' + response.statusText)
                }
                return response.json()
            })
            .then((result) => {
                return result as Request
            })
    }
}