import { CommonModule, KeyValue } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { CardModule } from 'primeng/card';

import { radioSounds } from '../../constants/radiosound';
import { MeterGroupModule, MeterItem } from 'primeng/metergroup';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { LoopReversePipe } from '../../pipes/loop-reverse.pipe';

@Component({
  selector: 'app-drawer',
  imports: [
    CommonModule,
    ButtonModule,
    FormsModule,
    DrawerModule,
    CardModule,
    MeterGroupModule,
    LoopReversePipe
  ],
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.scss'
})
export class DrawerComponent {
  @Input() isVisible: boolean = false;
  @Output() isVisibleChange: EventEmitter<boolean> = new EventEmitter(false);

  @Input() header: string = 'false';
  @Input() position: string = 'left';

  @Input() template!: 'cheatsheet' | 'log';

  @ViewChildren('audioRefTest') audioRefTest!: QueryList<ElementRef<HTMLAudioElement>>;

  radioSounds = radioSounds;

  logs: MeterItem[][] = [];

  meterValues: any = [];

  onLoadedMetadataTest(id: number, start: number) {
    const audio = this.audioRefTest.get(id - 1)?.nativeElement;
    audio!.currentTime = start;
  }

  onTimeUpdateTest(id: number, start: number, end: number) {
    const audio = this.audioRefTest.get(id - 1)?.nativeElement;
    if (audio!.currentTime >= end) {
      audio!.pause();
      this.audioEndedTest(id, start);
    }
  }

  audioEndedTest(id: number, start: number) {
    this.audioRefTest.get(id - 1)!.nativeElement.currentTime = start;
  }

  onShow(event: any) {
    if (this.template === 'log') {
      this.logs = JSON.parse(localStorage.getItem('log') || '[]');

      this.logs = this.logs.map((log, index) => {
        let correct = log.filter(item => item).length;
        let wrong = log.filter(item => !item).length;
        return [
          { label: 'Correct', color: '#4ade80', value: correct * 10 },
          { label: 'Wrong', color: '#f87171', value: wrong * 10 }
        ]
      });
    }
  }

  onHide(event: any) {
    this.isVisibleChange.emit(false);
  }

  clearLogs() {
    localStorage.removeItem('log');
    this.onShow({});
  }
}
