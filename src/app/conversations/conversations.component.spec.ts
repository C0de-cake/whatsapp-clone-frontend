import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ConversationsComponent} from './conversations.component';

describe('ConversationsComponent', () => {
  let component: ConversationsComponent;
  let fixture: ComponentFixture<ConversationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConversationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
