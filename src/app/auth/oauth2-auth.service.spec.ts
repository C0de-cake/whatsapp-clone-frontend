import {TestBed} from '@angular/core/testing';

import {Oauth2AuthService} from './oauth2-auth.service';

describe('Oauth2AuthService', () => {
  let service: Oauth2AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Oauth2AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
