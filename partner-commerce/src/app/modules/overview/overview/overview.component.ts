import { Component, OnInit } from '@angular/core';
import { Observable, of, Subscription } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { sumBy, get, defaultTo } from 'lodash';
import { ApiService, FilterOperator } from '@congarevenuecloud/core';
import { OrderService, Order, UserService, User, FieldFilter, AccountService, LocalCurrencyPipe, QuoteService, Quote } from '@congarevenuecloud/ecommerce';
import { TableOptions } from '@congarevenuecloud/elements';

import moment from 'moment';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverViewComponent implements OnInit {

  orderType = Order;
  quoteType= Quote;

  user$: Observable<User>;
  subscription: Subscription;
  totalOrderAmount$: Observable<number>;
  totalOrderRecords$: Observable<number>;
  totalQuoteAmount$: Observable<number>;
  totalQuoteRecords$: Observable<number>;
  orderAmountByStatus$: Observable<number>;
  view$: Observable<TableOptions>;
  quoteView$: Observable<TableOptions>;

  constructor(private orderService: OrderService, private currencyPipe: LocalCurrencyPipe, private userService: UserService, private apiService: ApiService, private accountService: AccountService, private quoteService: QuoteService) { }

  ngOnInit() {
    this.loadView();
  }

  loadView() {
    this.view$ = this.accountService.getCurrentAccount().pipe(
      map(() => {
        this.totalOrderRecords$ = this.orderService.getMyOrders(null, null, this.getOrderFilters()).pipe(map(orders => defaultTo(get(orders, 'length'), 0)))
        this.totalOrderAmount$ = this.orderService.getMyOrders(null, null, this.getFilterForAmount(), null, null, null).pipe(map((totalData: Array<Order>) => get(totalData, 'OrderAmount.DisplayValue', sumBy(totalData, 'OrderAmount.DisplayValue'))));
        this.totalQuoteRecords$ = this.quoteService.getMyQuotes(null, this.getQuoteFilters(), null, null, null, null, null, false).pipe(map(quotes => defaultTo(get(quotes, 'length'), 0)))
        this.totalQuoteAmount$ = this.quoteService.getMyQuotes(null, this.getQuoteFilterForAmount(), null, null, null, null, null, false).pipe(map((totalData: Array<Quote>) => sumBy(totalData, (quote) => get(quote, 'GrandTotal.Value'))))
        this.quoteView$ = of({
          tableOptions: {
            columns: [
              {
                prop: 'Name',
                label: 'CUSTOM_LABELS.PROPOSAL_NAME'
              },
              {
                prop: 'GrandTotal',
                label: 'CUSTOM_LABELS.TOTAL_AMOUNT',
                value: (record) => {
                  return this.currencyPipe.transform(get(get(record, 'GrandTotal'), 'DisplayValue'));
                }
              },
              {
                prop: 'CreatedDate',
                label: 'CUSTOM_LABELS.CREATED_DATE'
              }
            ],
            filters: this.getQuoteFilters(),
            limit: 5,
            routingLabel: 'proposals'
          },
        }as unknown as TableOptions);
        return {
          tableOptions: {
            columns: [
              {
                prop: 'Name',
                label: 'CUSTOM_LABELS.ORDER_NAME'
              },
              {
                prop: 'OrderAmount'
              },
              {
                prop: 'CreatedDate',
                label: 'CUSTOM_LABELS.CREATED_DATE'
              }
            ],
            filters: this.getOrderFilters(),
            limit: 5,
            routingLabel: 'orders'
          },
        } as TableOptions;
      },
        take(1))
    );
    this.user$ = this.userService.getCurrentUser();
  }

  getOrderFilters(): Array<FieldFilter> {
    return [{
      field: 'CreatedDate',
      value: moment().format("YYYY-MM-DD"),
      filterOperator: FilterOperator.LESS_EQUAL
    },
    {
      field: 'CreatedDate',
      value: moment().subtract(6, 'days').format("YYYY-MM-DD"),
      filterOperator: FilterOperator.GREATER_EQUAL
    },
    {
      field: 'SoldToAccount.Id',
      value: localStorage.getItem('account'),
      filterOperator: FilterOperator.EQUAL
    }] as Array<FieldFilter>;
  }

  getQuoteFilters(): Array<FieldFilter> {
    return [{
      field: 'CreatedDate',
      value: moment().format("YYYY-MM-DD"),
      filterOperator: FilterOperator.LESS_EQUAL
    },
    {
      field: 'CreatedDate',
      value: moment().subtract(6, 'days').format("YYYY-MM-DD"),
      filterOperator: FilterOperator.GREATER_EQUAL
    },
    {
      field: 'Account.Id',
      value: localStorage.getItem('account'),
      filterOperator: FilterOperator.EQUAL
    }] as Array<FieldFilter>;
  }

  getFilterForAmount(): Array<FieldFilter> {
    return [{
      field: 'SoldToAccount.Id',
      value: localStorage.getItem('account'),
      filterOperator: FilterOperator.EQUAL
    }] as Array<FieldFilter>;
  }

  getQuoteFilterForAmount(): Array<FieldFilter> {
    return [{
      field: 'Account.Id',
      value: localStorage.getItem('account'),
      filterOperator: FilterOperator.EQUAL
    }] as Array<FieldFilter>;
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
  }
}
