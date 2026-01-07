import {
  Component,
  ViewChild,
  ViewContainerRef,
  Type,
  AfterViewInit,
  Injector,
  OutputEmitterRef,
  isSignal,
  WritableSignal,
  signal,
  inject,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { RippleDirective } from '../ripple.directive';
import { TranslatePipe } from '@ngx-translate/core';

export interface DynamicComponentInterface<T> {
  activeModal?: NgbActiveModal;
  done: OutputEmitterRef<T>;
  submit(): any;
  loading?: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-modal-wrapper-component',
  templateUrl: './modal-wrapper-component.component.html',
  styleUrls: ['./modal-wrapper-component.component.scss'],
  imports: [RippleDirective, TranslatePipe],
})
export class AppModalWrapperComponent implements AfterViewInit {
  title = signal<string>('Modal');
  contentComponent = signal<Type<any> | null>(null); // start with null
  contentInputs = signal<Record<string, any>>({});
  @ViewChild('modalContent', { read: ViewContainerRef })
  modalContent!: ViewContainerRef;
  activeModal = inject(NgbActiveModal);
  injector = inject(Injector);
  isLoading = false;

  private dynamicComponentRef?: { instance: DynamicComponentInterface<any> };

  ngAfterViewInit() {
    if (this.contentComponent() !== null) {
      this.dynamicComponentRef = this.modalContent.createComponent(
        this.contentComponent()!,
        { injector: this.injector }
      );
      Object.entries(this.contentInputs()).forEach(([key, value]) => {
        const instanceProp = this.dynamicComponentRef!.instance[key];

        if (isSignal(instanceProp)) {
          const writableSignal = instanceProp as WritableSignal<any>;
          writableSignal.set(value);
        } else {
          this.dynamicComponentRef!.instance[key] = value;
        }
      });

      if ('activeModal' in this.dynamicComponentRef.instance) {
        this.dynamicComponentRef.instance.activeModal = this.activeModal;
      }

      if (this.dynamicComponentRef.instance.done) {
        this.dynamicComponentRef.instance.done.subscribe((result: any) => {
          this.isLoading = false;
          this.activeModal.close(result);
        });
      }
    }
  }

  async onOk() {
    const instance = this.dynamicComponentRef?.instance;
    if (!instance) return;
    this.isLoading = true;
    try {
      await instance.submit?.();
      instance.done.subscribe((value) => {
        this.activeModal.close(value);
      });
    } catch (err) {
      console.error('Modal action failed:', err);
    } finally {
      if (!instance.loading) {
        this.isLoading = false;
      }
    }
  }
}
