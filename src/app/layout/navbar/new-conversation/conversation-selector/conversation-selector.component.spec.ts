import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ConversationSelectorComponent} from './conversation-selector.component';

describe('ConversationSelectorComponent', () => {
  let component: ConversationSelectorComponent;
  let fixture: ComponentFixture<ConversationSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConversationSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
