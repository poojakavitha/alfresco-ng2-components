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

import { browser } from 'protractor';
import {
    StringUtil, TasksService,
    ProcessDefinitionsService, ProcessInstancesService,
    LoginPage, ApiService,
    AppListCloudPage, LocalStorageUtil, IdentityService, GroupIdentityService, DateUtil
} from '@alfresco/adf-testing';
import { NavigationBarPage } from '../core/pages/navigation-bar.page';
import { TasksCloudDemoPage } from './pages/tasks-cloud-demo.page';
import { TaskListCloudConfiguration } from './config/task-list-cloud.config';
import moment = require('moment');
import { taskFilterConfiguration } from './config/task-filter.config';

describe('Edit task filters and task list properties', () => {

    const simpleApp = browser.params.resources.ACTIVITI_CLOUD_APPS.SIMPLE_APP.name;
    const candidateBaseApp = browser.params.resources.ACTIVITI_CLOUD_APPS.CANDIDATE_BASE_APP.name;

    const loginSSOPage = new LoginPage();
    const navigationBarPage = new NavigationBarPage();
    const appListCloudComponent = new AppListCloudPage();
    const tasksCloudDemoPage = new TasksCloudDemoPage();

    const apiService = new ApiService();
    const identityService = new IdentityService(apiService);
    const groupIdentityService = new GroupIdentityService(apiService);
    const tasksService = new TasksService(apiService);
    const processDefinitionService = new ProcessDefinitionsService(apiService);
    const processInstancesService = new ProcessInstancesService(apiService);

    const noTasksFoundMessage = 'No Tasks Found';
    let createdTask, notAssigned, notDisplayedTask, processDefinition, processInstance, priorityTask, subTask,
        otherOwnerTask, testUser, groupInfo, simpleTask;
    const priority = 30;

    const beforeDate = moment().add(-1, 'days').format('DD/MM/YYYY');
    const currentDate = DateUtil.formatDate('DD/MM/YYYY');
    const afterDate = moment().add(1, 'days').format('DD/MM/YYYY');

    beforeAll(async () => {
        await apiService.loginWithProfile('identityAdmin');

        testUser = await identityService.createIdentityUserWithRole([identityService.ROLES.ACTIVITI_USER]);

        groupInfo = await groupIdentityService.getGroupInfoByGroupName('hr');
        await identityService.addUserToGroup(testUser.idIdentityService, groupInfo.id);

        await apiService.login(testUser.email, testUser.password);

        otherOwnerTask = await tasksService.createStandaloneTask(StringUtil.generateRandomString(), simpleApp);
        await tasksService.claimTask(otherOwnerTask.entry.id, simpleApp);

        createdTask = await tasksService.createStandaloneTask(StringUtil.generateRandomString(), simpleApp);
        await tasksService.claimTask(createdTask.entry.id, simpleApp);

        simpleTask = await tasksService.createStandaloneTask(StringUtil.generateRandomString(), simpleApp);
        notAssigned = await tasksService.createStandaloneTask(StringUtil.generateRandomString(), simpleApp);
        priorityTask = await tasksService.createStandaloneTask(StringUtil.generateRandomString(), simpleApp, { priority: priority });
        await tasksService.claimTask(priorityTask.entry.id, simpleApp);

        notDisplayedTask = await tasksService.createStandaloneTask(StringUtil.generateRandomString(), candidateBaseApp);
        await tasksService.claimTask(notDisplayedTask.entry.id, candidateBaseApp);

        processDefinition = await processDefinitionService
            .getProcessDefinitionByName(browser.params.resources.ACTIVITI_CLOUD_APPS.SIMPLE_APP.processes.dropdownrestprocess, simpleApp);

        processInstance = await processInstancesService.createProcessInstance(processDefinition.entry.key, simpleApp);

        subTask = await tasksService.createStandaloneTask(StringUtil.generateRandomString(), simpleApp, { 'parentTaskId': createdTask.entry.id });
        await tasksService.claimTask(subTask.entry.id, simpleApp);

        const jsonFile = new TaskListCloudConfiguration().getConfiguration();

        await loginSSOPage.login(testUser.email, testUser.password);
        await LocalStorageUtil.setConfigField('adf-cloud-task-list', JSON.stringify(jsonFile));
        await LocalStorageUtil.setConfigField('adf-edit-task-filter', JSON.stringify(taskFilterConfiguration));
    }, 5 * 60 * 1000);

    afterAll(async (done) => {
        await apiService.loginWithProfile('identityAdmin');
        await identityService.deleteIdentityUser(testUser.idIdentityService);
        done();
    });

    describe('Edit task filters and task list properties - filter properties', () => {

        beforeEach(async () => {
            await navigationBarPage.navigateToProcessServicesCloudPage();
            await appListCloudComponent.checkApsContainer();
            await appListCloudComponent.goToApp(simpleApp);
            await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();
            await tasksCloudDemoPage.taskFilterCloudComponent.checkTaskFilterIsDisplayed('my-tasks');
        });

        it('[C292004] Filter by appName', async () => {
            await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getAppNameDropDownValue()).toEqual(simpleApp);

            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedByName(createdTask.entry.name);
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsNotDisplayedByName(notDisplayedTask.entry.name);

            await tasksCloudDemoPage.editTaskFilterCloudComponent().setAppNameDropDown(candidateBaseApp);
            await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getAppNameDropDownValue()).toEqual(candidateBaseApp);

            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedByName(notDisplayedTask.entry.name);
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsNotDisplayedByName(createdTask.entry.name);
        });

        it('[C291906] Should be able to see only the task with specific taskId when typing it in the task Id field', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setId(createdTask.entry.id);
            await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getId()).toEqual(createdTask.entry.id);
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedById(createdTask.entry.id);
            await tasksCloudDemoPage.taskListCloudComponent().getRowsWithSameId(createdTask.entry.id).then(async (list) => {
                await expect(list.length).toEqual(1);
            });
        });

        it('[C291907] Should be able to see No tasks found when typing an invalid task id', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setId('invalidId');
            await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getId()).toEqual('invalidId');

            await expect(await tasksCloudDemoPage.taskListCloudComponent().getNoTasksFoundMessage()).toEqual(noTasksFoundMessage);
        });

        it('[C297476] Filter by taskName', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setTaskName(createdTask.entry.name);
            await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getTaskName()).toEqual(createdTask.entry.name);
            await tasksCloudDemoPage.taskListCloudComponent().getRowsWithSameName(createdTask.entry.name).then(async (list) => {
                await expect(list.length).toEqual(1);
            });
        });

        it('[C297613] Should be able to see No tasks found when typing a task name that does not exist', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setTaskName('invalidName');
            await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getTaskName()).toEqual('invalidName');

            await expect(await tasksCloudDemoPage.taskListCloudComponent().getNoTasksFoundMessage()).toEqual(noTasksFoundMessage);
        });

        it('[C297480] Should be able to see only tasks that are part of a specific process when processInstanceId is set', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setProcessInstanceId(processInstance.entry.id);
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setStatusFilterDropDown('ALL');

            await tasksCloudDemoPage.editTaskFilterCloudComponent().clearAssignee();

            await expect(await tasksCloudDemoPage.taskListCloudComponent().getDataTable().getNumberOfRows()).toBe(1);

            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedByProcessInstanceId(processInstance.entry.id);
        });

        it('[C297684] Should be able to see No tasks found when typing an invalid processInstanceId', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setProcessInstanceId('invalidTaskId');

            await expect(await tasksCloudDemoPage.taskListCloudComponent().getNoTasksFoundMessage()).toEqual(noTasksFoundMessage);
        });

        it('[C297478] Should be able to see only tasks that are assigned to a specific user when assignee is set', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setAssignee(testUser.username);

            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedByName(createdTask.entry.name);
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsNotDisplayedByName(notAssigned.entry.name);
        });

        it('[C297686] Should be able to see No tasks found when typing an invalid user to assignee field', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setAssignee('invalid');

            await expect(await tasksCloudDemoPage.taskListCloudComponent().getNoTasksFoundMessage()).toEqual(noTasksFoundMessage);
        });

        it('[C297482] Should be able to see only tasks with specific priority when priority is set', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setPriority(priority);

            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedByName(priorityTask.entry.name);
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsNotDisplayedByName(createdTask.entry.name);
        });

        it('[C297687] Should be able to see No tasks found when typing unused value for priority field', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setPriority('87650');

            await expect(await tasksCloudDemoPage.taskListCloudComponent().getNoTasksFoundMessage()).toEqual(noTasksFoundMessage);
        });

        it('[C297481] Should be able to see only tasks with specific parentTaskId when parentTaskId is set', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setParentTaskId(subTask.entry.parentTaskId);

            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedByName(subTask.entry.name);
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsNotDisplayedByName(createdTask.entry.name);
        });

        it('[C297486] Filter by Owner', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setStatusFilterDropDown('ALL');
            await tasksCloudDemoPage.editTaskFilterCloudComponent().clearAssignee();
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setOwner(testUser.username);

            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedByName(notAssigned.entry.name);
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedByName(createdTask.entry.name);

            await tasksCloudDemoPage.editTaskFilterCloudComponent().setOwner('invalid');

            await expect(await tasksCloudDemoPage.taskListCloudComponent().getNoTasksFoundMessage()).toEqual(noTasksFoundMessage);
        });

        it('[C297484] Task is displayed when typing into lastModifiedFrom field a date before the task CreatedDate', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setLastModifiedFrom(beforeDate);
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedByName(createdTask.entry.name);

            await tasksCloudDemoPage.editTaskFilterCloudComponent().setLastModifiedFrom(afterDate);
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsNotDisplayedByName(createdTask.entry.name);
        });

        it('[C297689] Task is not displayed when typing into lastModifiedFrom field the same date as tasks CreatedDate', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setLastModifiedFrom(currentDate);
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setTaskName(simpleTask.entry.name);
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsNotDisplayedByName(simpleTask.entry.name);
        });

        it('[C297485] Task is displayed when typing into lastModifiedTo field a date after the task CreatedDate', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setLastModifiedTo(afterDate);
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedByName(createdTask.entry.name);

            await tasksCloudDemoPage.editTaskFilterCloudComponent().setLastModifiedTo(beforeDate);
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsNotDisplayedByName(createdTask.entry.name);
        });

        it('[C297690] Task is not displayed when typing into lastModifiedTo field the same date as tasks CreatedDate', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setLastModifiedTo(currentDate);
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setTaskName(simpleTask.entry.name);
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsNotDisplayedByName(simpleTask.entry.name);
        });

        it('[C297691] Task is not displayed when typing into lastModifiedFrom field a date before the task due date  ' +
            'and into lastModifiedTo a date before task due date', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setLastModifiedFrom(beforeDate);
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setLastModifiedTo(beforeDate);
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setTaskName(createdTask.entry.name);
            await expect(await tasksCloudDemoPage.taskListCloudComponent().getNoTasksFoundMessage()).toEqual(noTasksFoundMessage);
        });

        it('[C297692] Task is displayed when typing into lastModifiedFrom field a date before the tasks due date ' +
            'and into lastModifiedTo a date after', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setLastModifiedFrom(beforeDate);
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setLastModifiedTo(afterDate);
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setTaskName(createdTask.entry.name);
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedByName(createdTask.entry.name);
        });

        it('[C297693] Task is not displayed when typing into lastModifiedFrom field a date after the tasks due date ' +
            'and into lastModifiedTo a date after', async () => {
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setLastModifiedFrom(afterDate);
            await tasksCloudDemoPage.editTaskFilterCloudComponent().setLastModifiedTo(afterDate);
            await expect(await tasksCloudDemoPage.taskListCloudComponent().getNoTasksFoundMessage()).toEqual(noTasksFoundMessage);
        });
    });
});
