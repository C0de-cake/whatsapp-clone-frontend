import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SendStateDisplayComponent} from './send-state-display.component';

describe('SendStateDisplayComponent', () => {
  let component: SendStateDisplayComponent;
  let fixture: ComponentFixture<SendStateDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendStateDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SendStateDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
