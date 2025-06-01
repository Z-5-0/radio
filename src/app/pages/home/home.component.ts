import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { InputOtp, InputOtpModule } from 'primeng/inputotp';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RadioSound } from '../../models/radio-sound';
import { CommonModule } from '@angular/common';
import { concatMap, from, interval, of, Subject, Subscription, takeWhile, tap, timer } from 'rxjs';
import { SliderModule } from 'primeng/slider';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { PanelModule } from 'primeng/panel';
import { FieldsetModule } from 'primeng/fieldset';
import { TooltipModule } from 'primeng/tooltip';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';

import { radioSounds } from '../../shared/constants/radiosound';
import { DrawerOption } from '../../models/drawer-option';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputOtpModule,
    SliderModule,
    ProgressBarModule,
    ToastModule,
    PanelModule,
    FieldsetModule,
    TooltipModule,
    LoadingComponent,
    DrawerComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('otpRef') otpRef!: InputOtp;
  @ViewChild('audioRef') audioRef!: ElementRef<HTMLAudioElement>;

  renderer: Renderer2 = inject(Renderer2);

  subscriptions: { [key: string]: Subscription } = {};
  play$: Subject<void> = new Subject<void>;

  inputValues: string = '';

  radioSounds = radioSounds;

  audioElement!: HTMLAudioElement;

  segmentsToPlay: RadioSound[] = [];
  currentSegment: RadioSound | null = null;
  currentSegmentIndex = 0;

  isLoading: boolean = false;
  isPlaying: boolean = false;

  inputOtpFields!: NodeListOf<Element>;

  pressedCharacters: string[] = Array.from({ length: 10 });

  delay: number = 500;
  volume: number = 100;

  showCheatSheet: boolean = false;
  showResults: boolean = false;

  results: boolean[] = [];

  drawerIsVisible: boolean = false;
  drawerOptions: DrawerOption[] = [
    { template: 'cheatsheet', header: 'CheatSheet', position: 'left' },
    { template: 'log', header: 'Logs', position: 'right' },
  ];
  selectedDrawer: DrawerOption = {} as DrawerOption;

  localStorageItems: string[] = ['delay', 'volume', 'log'];

  constructor() {
  }

  ngOnInit(): void {
    if (!localStorage.getItem('log')) {
      localStorage.setItem('log', JSON.stringify([]));
    }

    this.getSettings();
  }

  ngAfterViewInit(): void {
    const nativeElement = this.otpRef.el.nativeElement as HTMLElement;
    this.inputOtpFields = nativeElement.querySelectorAll('input.p-inputotp-input');
    this.audioElement = this.audioRef.nativeElement;
  }

  start() {
    this.inputValues = '';
    this.pressedCharacters = Array.from({ length: 10 });
    this.segmentsToPlay = [];
    this.results = [];

    this.setInputOtpClasses(false);

    this.otpRef.el.nativeElement.querySelector('input').focus();

    this.generateRandomSegments();
    this.playSegments();
  }

  generateRandomSegments() {
    for (let i = 0; i < 10; i++) {
      const randomSound = Math.floor(Math.random() * 36) + 1;
      this.segmentsToPlay.push(this.radioSounds.find(sound => sound.id === randomSound)!)
    }
  }

  playSegments() {
    this.isPlaying = true;

    const playSubscription = from(this.segmentsToPlay).pipe(
      concatMap(segment => {
        return of(segment).pipe(
          tap(() => {
            this.currentSegmentIndex++;
            this.audioElement.currentTime = segment.start;
            this.audioElement.play();
          }),
          concatMap(() => timer((segment.end - segment.start) * 1000)), // megvárjuk, amíg lejátszódik a szegmens
          tap(() => this.audioElement.pause()),
          concatMap(() => timer(this.delay)) // várunk a delay-nek beállított érték szerint
        );
      })
    ).subscribe({
      complete: () => {
        this.audioElement.currentTime = 0;
        this.currentSegment = null;
        this.currentSegmentIndex = 0;
        this.getResults();
      }
    });

    this.subscriptions['play'] = playSubscription;
  }

  onInputChange(event: any) {
    const inputElement = event.originalEvent.target as HTMLInputElement;
    const inputs = Array.from(this.inputOtpFields);
    const index = inputs.indexOf(inputElement);
    const value = (inputs[index] as HTMLInputElement).value;

    this.pressedCharacters[index] = value.toUpperCase();
  }

  onDelayChange(event: any) {
    const delay = event.value;

    this.saveSettings('delay', delay);
  }

  onVolumeChange(event: any) {
    const volume = event.value / 100;
    this.audioRef.nativeElement.volume = volume;
    this.saveSettings('volume', `${volume * 100}`); // másolásra volt szükség
  }

  getResults() {
    timer(1000).pipe(
      tap(() => {
        this.isLoading = true;
      }),
    ).subscribe();
    timer(3000).pipe(
      tap(() => {
        this.isLoading = false;
        this.isPlaying = false;
        this.checkResults();
      }),
    ).subscribe();
  }

  checkResults() {
    this.results = this.pressedCharacters.map((letter, index) => letter === this.segmentsToPlay[index].code);
    this.setInputOtpClasses(true);

    let logHistory = JSON.parse(localStorage.getItem('log') || '[]');
    logHistory.push(this.results);
    this.saveSettings('log', logHistory);
  }

  setInputOtpClasses(active: boolean) {
    this.inputOtpFields.forEach((input, index) => {
      switch (active) {
        case true:
          this.results[index] ? this.renderer.addClass(input, 'success') : this.renderer.addClass(input, 'error');
          break;
        case false:
          this.renderer.removeClass(input, 'success');
          this.renderer.removeClass(input, 'error');
          break;
      }
    });
  }

  getSettings(title?: string) {
    this.delay = Number(JSON.parse(localStorage.getItem('delay') || this.delay.toString()));
    this.volume = Number(JSON.parse(localStorage.getItem('volume') || this.volume.toString()));
  }

  saveSettings(name: string, data: any) {
    localStorage.setItem(name, JSON.stringify(data));
  }

  loadLogHistory() {

  }

  reset() {
    this.segmentsToPlay = [];
    this.isPlaying = false;
    this.subscriptions['play'].unsubscribe();
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.inputValues = '';
    this.currentSegment = null;
    this.currentSegmentIndex = 0;
  }

  ngOnDestroy() {
    Object.entries(this.subscriptions).forEach(([key, subscription]) => {
      subscription.unsubscribe();
    });
  }
}
