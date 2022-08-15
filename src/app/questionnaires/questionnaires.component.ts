import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { FhirConfigService } from '../fhirConfig.service';
import Client from 'fhir-kit-client';
import { Router } from '@angular/router';
import * as R from 'ramda';
import { QuestionnaireTableEntry } from '../questionnaires-table/questionnaires-table.component';
import { QuestionnaireWithResponse } from '../questionnaire-item/types';
import { extractQuestionnaireWithResponseFromBundle } from '../util/bundle-transform';
import { MatTabChangeEvent } from '@angular/material/tabs/tab-group';
import { TaskTableEntry } from '../tasks-table/tasks-table.component';

@Component({
  selector: 'app-questionnaires',
  templateUrl: './questionnaires.component.html',
  styleUrls: ['./questionnaires.component.scss'],
})
export class QuestionnairesComponent implements OnInit {
  newOrderDataSource = new MatTableDataSource<
    QuestionnaireTableEntry<fhir.r4.Questionnaire>
  >();
  openOrderDataSource = new MatTableDataSource<
    QuestionnaireTableEntry<QuestionnaireWithResponse>
  >();
  completedOrderDataSource = new MatTableDataSource<
    QuestionnaireTableEntry<QuestionnaireWithResponse>
  >();
  taskDataSource = new MatTableDataSource<TaskTableEntry<fhir.r4.Task>>();

  client: Client;

  constructor(fhirConfigService: FhirConfigService, private router: Router) {
    this.client = fhirConfigService.getFhirClient();
  }

  update(index): void {
    switch (index) {
      case 0:
        this.loadQuestionnaires();
        break;
      case 1:
        this.loadQuestionnaireResponses();
        break;
      case 2:
        this.loadQuestionnaireResponsesCompleted();
        break;
      case 3:
        this.loadTasks();
        break;
    }
  }

  tabChanged(tabChangeEvent: MatTabChangeEvent): void {
    console.log('tabChangeEvent => ', tabChangeEvent);
    console.log('index => ', tabChangeEvent.index);
    this.update(tabChangeEvent.index);
  }

  async ngOnInit() {
    this.update(0);
  }

  async loadQuestionnaires() {
    const questionnaires: fhir.r4.Questionnaire[] = (await this.client
      .search({
        resourceType: 'Questionnaire',
        searchParams: {
          _summary: 'true',
          _sort: 'title',
          _count: 200,
        },
      })
      .then(extractResourcesFromSearchBundle)) as fhir.r4.Questionnaire[];
    this.newOrderDataSource.data = questionnaires.map((questionnaire) => ({
      title: questionnaire.title ? questionnaire.title : questionnaire.id,
      status: questionnaire.status,
      date: questionnaire.date,
      publisher: questionnaire.publisher,
      version: questionnaire.version,
      entry: questionnaire,
    }));
  }

  async loadQuestionnaireResponses() {
    const questionnaireResponses: fhir.r4.QuestionnaireResponse[] = (await this.client
      .search({
        resourceType: 'QuestionnaireResponse',
        searchParams: {
          _summary: 'true',
          _sort: '-_lastUpdated',
          status: 'in-progress',
        },
      })
      .then(
        extractResourcesFromSearchBundle
      )) as fhir.r4.QuestionnaireResponse[];

    if (!questionnaireResponses.length) {
      return;
    }

    // load related Questionnaires
    const questionnaireUrls = R.uniq(
      questionnaireResponses.map(
        (questionnaireResponse) => questionnaireResponse.questionnaire
      )
    ).join(',');
    const linkedQuestionnaires: fhir.r4.Questionnaire[] = (await this.client
      .search({
        resourceType: 'Questionnaire',
        searchParams: {
          _summary: 'true',
          url: questionnaireUrls,
        },
      })
      .then(extractResourcesFromSearchBundle)) as fhir.r4.Questionnaire[];

    this.openOrderDataSource.data = questionnaireResponses.map(
      (questionnaireResponse) => {
        const questionnaire = linkedQuestionnaires.find(
          ({ url }) => questionnaireResponse.questionnaire === url
        );
        return {
          title: questionnaire?.title + ' ' + questionnaireResponse.id,
          status: questionnaireResponse?.status,
          date: questionnaireResponse.meta?.lastUpdated,
          publisher: questionnaire?.publisher,
          version: questionnaireResponse.meta?.versionId,
          entry: {
            questionnaire,
            questionnaireResponse,
          },
        };
      }
    );
  }

  async loadQuestionnaireResponsesCompleted() {
    const questionnaireResponses: fhir.r4.QuestionnaireResponse[] = (await this.client
      .search({
        resourceType: 'QuestionnaireResponse',
        searchParams: {
          _summary: 'true',
          _sort: '-_lastUpdated',
          status: 'completed',
        },
      })
      .then(
        extractResourcesFromSearchBundle
      )) as fhir.r4.QuestionnaireResponse[];

    if (!questionnaireResponses.length) {
      return;
    }

    // load related Questionnaires
    const questionnaireUrls = R.uniq(
      questionnaireResponses.map(
        (questionnaireResponse) => questionnaireResponse.questionnaire
      )
    ).join(',');
    const linkedQuestionnaires: fhir.r4.Questionnaire[] = (await this.client
      .search({
        resourceType: 'Questionnaire',
        searchParams: {
          _summary: 'true',
          url: questionnaireUrls,
        },
      })
      .then(extractResourcesFromSearchBundle)) as fhir.r4.Questionnaire[];

    this.completedOrderDataSource.data = questionnaireResponses.map(
      (questionnaireResponse) => {
        const questionnaire = linkedQuestionnaires.find(
          ({ url }) => questionnaireResponse.questionnaire === url
        );
        return {
          title: questionnaire?.title + ' ' + questionnaireResponse.id,
          status: questionnaireResponse?.status,
          date: questionnaireResponse.meta?.lastUpdated,
          publisher: questionnaire?.publisher,
          version: questionnaireResponse.meta?.versionId,
          entry: {
            questionnaire,
            questionnaireResponse,
          },
        };
      }
    );
  }

  async loadTasks() {
    const tasks: fhir.r4.Resource[] = await this.client
      .search({
        resourceType: 'Task',
        searchParams: {
          _sort: '-authored-on',
        },
      })
      .then(extractResourcesFromSearchBundle);

    this.taskDataSource.data = tasks.map((task: fhir.r4.Task) => ({
      title: task?.description ? task?.description : task.id,
      status: task?.status,
      authoredOn: task?.authoredOn,
      lastModified: task?.lastModified,
      requester: task?.requester?.display,
      owner: task?.owner?.display,
      entry: task,
    }));

    console.log('task entries' + this.taskDataSource.data.length);
  }

  openQuestionnaire(entry: fhir.r4.Questionnaire) {
    this.router.navigate(['questionnaire', entry.id]);
  }

  openQuestionnaireResponse({
    questionnaire,
    questionnaireResponse,
  }: QuestionnaireWithResponse) {
    this.router.navigate(['questionnaire', questionnaire.id], {
      queryParams: { questionnaireResponseId: questionnaireResponse.id },
    });
  }

  openBundle(bundleId: string) {
    this.router.navigate(['bundle', bundleId]);
  }

  openTask(taskId: fhir.r4.Task) {
    this.router.navigate(['task', taskId.id]);
  }
}

const extractResourcesFromSearchBundle = (
  bundle: fhir.r4.OperationOutcome | fhir.r4.Bundle
): Promise<fhir.r4.Resource[]> =>
  bundle.resourceType !== 'Bundle'
    ? Promise.reject('Search failed')
    : Promise.resolve(
        (bundle as fhir.r4.Bundle)?.entry?.map(({ resource }) => resource) ?? []
      );
