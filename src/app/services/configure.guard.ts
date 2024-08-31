import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ProductDetailComponent } from '../modules/products/detail/product-detail.component';
import { get } from 'lodash';
import { ProductConfigurationService } from '@congarevenuecloud/elements';

@Injectable({
  providedIn: 'root',
})
export class ConfigureGuard {

  constructor(private productConfigService: ProductConfigurationService) { }
  canDeactivate(
    component: ProductDetailComponent
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (get(component, 'unsavedConfiguration')) {
      if (confirm('There are unsaved changes in progress in your configuration. Do you want to discard these changes?')) {
        this.productConfigService.unsavedConfiguration.next(false);
        return of(true);
      } else
        return of(false);
    }
    this.productConfigService.unsavedConfiguration.next(false);
    this.productConfigService.isDiscovery.next(false);
    return of(true);
  }
}
