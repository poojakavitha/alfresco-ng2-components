/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DateCloudFilterType } from '../../../models/date-cloud-filter.model';
import { DateRangeFilterService } from '../../../common/date-range-filter/date-range-filter.service';
import { ComponentSelectionMode } from '../../../types';

export class TaskFilterCloudModel {
    id: string;
    name: string;
    key: string;
    icon: string;
    index: number;
    appName: string;
    status: string;
    sort: string;
    assignee: string;
    order: string;
    owner: string;
    processDefinitionName?: string;
    processDefinitionId: string;
    processInstanceId: string;
    createdDate: Date;
    dueDateType: DateCloudFilterType;
    dueDate: Date;
    taskName: string;
    taskId: string;
    parentTaskId: string;
    priority: number;
    standalone: boolean;
    completedBy: string;
    lastModifiedFrom: string;
    lastModifiedTo: string;
    completedDateType: DateCloudFilterType;
    completedDate: Date;

    private _completedFrom: string;
    private _completedTo: string;
    private _dueDateFrom: string;
    private _dueDateTo: string;
    private dateRangeFilterService = new DateRangeFilterService();

    constructor(obj?: any) {
        if (obj) {
            this.id = obj.id || Math.random().toString(36).substr(2, 9);
            this.name = obj.name || null;
            this.key = obj.key || null;
            this.icon = obj.icon || null;
            this.index = obj.index || null;
            this.appName = obj.appName || obj.appName === '' ? obj.appName : null;
            this.status = obj.status || null;
            this.sort = obj.sort || null;
            this.assignee = obj.assignee || null;
            this.order = obj.order || null;
            this.owner = obj.owner || null;
            this.processDefinitionName = obj.processDefinitionName || null;
            this.processDefinitionId = obj.processDefinitionId || null;
            this.processInstanceId = obj.processInstanceId || null;
            this.createdDate = obj.createdDate || null;
            this.dueDateType = obj.dueDateType || null;
            this.dueDate = obj.dueDate || null;
            this._dueDateFrom = obj._dueDateFrom || null;
            this._dueDateTo = obj._dueDateTo || null;
            this.taskName = obj.taskName || null;
            this.taskId = obj.taskId || null;
            this.parentTaskId = obj.parentTaskId || null;
            this.priority = obj.priority || null;
            this.standalone = obj.standalone || null;
            this.lastModifiedFrom = obj.lastModifiedFrom || null;
            this.lastModifiedTo = obj.lastModifiedTo || null;
            this.completedBy = obj.completedBy || null;
            this.completedDateType = obj.completedDateType || null;
            this.completedFrom = obj._completedFrom || null;
            this.completedTo = obj._completedTo || null;
            this.completedDate = obj.completedDate || null;
        }
    }

    set dueDateFrom(dueDateFrom: string) {
        this._dueDateFrom = dueDateFrom;
    }

    set dueDateTo(dueDateTo: string) {
        this._dueDateTo = dueDateTo;
    }

    get dueDateFrom() {
        if (this.isDateRangeType(this.dueDateType)) {
            return this._dueDateFrom;
        }
        return this.getStartDate(this.dueDateType);
    }

    get dueDateTo() {
        if (this.isDateRangeType(this.dueDateType)) {
            return this._dueDateTo;
        }
        return this.getEndDate(this.dueDateType);
    }

    set completedFrom(completedFrom: string) {
        this._completedFrom = completedFrom;
    }

    set completedTo(completedTo: string) {
        this._completedTo = completedTo;
    }

    get completedFrom(): string {
        if (this.isDateRangeType(this.completedDateType)) {
            return this._completedFrom;
        }
        return this.getStartDate(this.completedDateType);
    }

    get completedTo(): string {
        if (this.isDateRangeType(this.completedDateType)) {
            return this._completedTo;
        }
        return this.getEndDate(this.completedDateType);
    }

    private getStartDate(key: DateCloudFilterType) {
        return this.dateRangeFilterService.getDateRange(key).startDate;
    }

    private getEndDate(key: DateCloudFilterType) {
        return this.dateRangeFilterService.getDateRange(key).endDate;
    }

    private isDateRangeType(type: DateCloudFilterType) {
        return !!this.dateRangeFilterService.isDateRangeType(type);
    }
}

export interface ServiceTaskFilterCloudModel {
    id?: string;
    name?: string;
    key?: string;
    icon?: string;
    index?: number;
    appName?: string;
    status?: string;
    sort?: string;
    order?: string;
    activityName?: string;
    activityType?: string;
    completedDate?: Date;
    elementId?: string;
    executionId?: string;
    processDefinitionId?: string;
    processDefinitionKey?: string;
    processDefinitionVersion?: number;
    processInstanceId?: string;
    serviceTaskId?: string;
    serviceFullName?: string;
    serviceName?: string;
    serviceVersion?: string;
    startedDate?: Date;
}

export enum TaskType {
    UserTask = 'userTask',
    ServiceTask = 'serviceTask'
}

export class FilterParamsModel {

    id?: string;
    name?: string;
    key?: string;
    index?: number;

    constructor(obj?: any) {
        if (obj) {
            this.id = obj.id || null;
            this.name = obj.name || null;
            this.key = obj.key || null;
            this.index = obj.index;
        }
    }
}

export class TaskFilterAction {
    actionType: string;
    icon: string;
    tooltip: string;
    filter: TaskFilterCloudModel | ServiceTaskFilterCloudModel;

    constructor(obj?: any) {
        if (obj) {
            this.actionType = obj.actionType || null;
            this.icon = obj.icon || null;
            this.tooltip = obj.tooltip || null;
            this.filter = obj.filter || null;
        }
    }
}

export interface FilterOptions {
    label?: string;
    value?: string;
}

export class TaskFilterProperties {
    label: string;
    type: string;
    value: any;
    key: string;
    attributes?: { [key: string]: string; };
    options?: FilterOptions[];
    dateFilterOptions?: DateCloudFilterType[];
    selectionMode?: ComponentSelectionMode;

    constructor(obj?: any) {
        if (obj) {
            this.label = obj.label || null;
            this.type = obj.type || null;
            this.value = obj.value || '';
            this.key = obj.key || null;
            this.attributes = obj.attributes || null;
            this.options = obj.options || null;
            this.dateFilterOptions = obj.dateFilterOptions || null;
            this.selectionMode = obj.selectionMode || null;
        }
    }
}
