import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'loopReverse',
    standalone: true
})

export class LoopReversePipe implements PipeTransform {
    transform(value: any) {
        return value.slice().reverse();
    }
}