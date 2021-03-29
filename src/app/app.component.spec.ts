import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterModule, Routes } from '@angular/router';
import { FhirConfig, FhirJsHttpService, FHIR_HTTP_CONFIG } from 'ng-fhirjs';
import { AppComponent } from './app.component';
import { MatMenuModule } from '@angular/material';
import { TranslateModule } from '@ngx-translate/core';

export const FHIR_JS_CONFIG: FhirConfig = {
  baseUrl: 'http://localhost:8080/r4',
  credentials: 'same-origin',
};

const routes: Routes = [];

describe('AppComponent', () => {
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [AppComponent],
        imports: [
          MatMenuModule,
          TranslateModule.forRoot(),
          HttpClientTestingModule,
          RouterModule.forRoot(routes, {
            useHash: true,
            relativeLinkResolution: 'legacy',
          }),
        ],
        providers: [
          FhirJsHttpService,
          { provide: FHIR_HTTP_CONFIG, useValue: FHIR_JS_CONFIG },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();
    })
  );
  it(
    'should create the app',
    waitForAsync(() => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.debugElement.componentInstance;
      expect(app).toBeTruthy();
    })
  );
});
