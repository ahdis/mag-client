import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  Action,
  FormItem,
  LinkIdPathSegment,
  QuestionnaireState,
} from '../types';
import { addAnswer, removeAnswer } from '../store/action';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-questionnaire-form-item-group',
  templateUrl: './questionnaire-form-item-group.component.html',
  styleUrls: ['./questionnaire-form-item-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionnaireFormItemGroupComponent {
  @Input() formItem: FormItem;
  @Input() level: number;
  @Input() linkIdPath: LinkIdPathSegment[];
  @Input() childrenItemLinkIdPaths: LinkIdPathSegment[][][];
  @Input() store: Observable<QuestionnaireState>;
  @Input() dispatch: (action: Action) => void;

  addGroup() {
    this.dispatch(addAnswer(this.linkIdPath, ''));
  }

  removeGroup(index) {
    this.dispatch(removeAnswer(this.linkIdPath, index));
  }
}
