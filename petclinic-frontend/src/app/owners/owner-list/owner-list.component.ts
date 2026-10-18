import {Component, OnDestroy, OnInit} from '@angular/core';
import {OwnerService} from '../owner.service';
import {Owner} from '../owner';
import {Router} from '@angular/router';
import {PageEvent} from '@angular/material/paginator';
import {Sort, SortDirection} from '@angular/material/sort';
import {Subject} from 'rxjs';
import {debounceTime, finalize, switchMap, takeUntil} from 'rxjs/operators';

const DEFAULT_SORT = 'name';
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-owner-list',
  templateUrl: './owner-list.component.html',
  styleUrls: ['./owner-list.component.css']
})
export class OwnerListComponent implements OnInit, OnDestroy {
  errorMessage: string;
  filter = '';
  owners: Owner[];
  totalElements = 0;
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20];
  sortActive = DEFAULT_SORT;
  sortDirection: SortDirection = 'asc';
  isOwnersDataReceived: boolean = false;

  private readonly load$ = new Subject<void>();
  private readonly typing$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  constructor(private router: Router, private ownerService: OwnerService) {

  }

  ngOnInit() {
    this.load$.pipe(
      switchMap(() => this.ownerService.listOwners({
        search: this.filter.trim(),
        page: this.pageIndex,
        size: this.pageSize,
        sort: `${this.sortActive},${this.sortDirection}`
      }).pipe(finalize(() => this.isOwnersDataReceived = true))),
      takeUntil(this.destroy$)
    ).subscribe(
      page => {
        this.owners = page.content;
        this.totalElements = page.totalElements;
      },
      error => this.errorMessage = error as any);
    this.typing$.pipe(debounceTime(SEARCH_DEBOUNCE_MS), takeUntil(this.destroy$))
      .subscribe(() => this.search());
    this.load$.next();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilterChange(filter: string) {
    this.filter = filter;
    this.typing$.next();
  }

  search() {
    this.pageIndex = 0;
    this.load$.next();
  }

  onPage(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load$.next();
  }

  onSort(sort: Sort) {
    this.sortActive = sort.active || DEFAULT_SORT;
    this.sortDirection = sort.direction || 'asc';
    this.search();
  }

  onSelect(owner: Owner) {
    this.router.navigate(['/owners', owner.id]);
  }

  addOwner() {
    this.router.navigate(['/owners/add']);
  }
}
