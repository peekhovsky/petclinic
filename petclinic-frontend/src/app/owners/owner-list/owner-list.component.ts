import {Component, OnInit} from '@angular/core';
import {OwnerService} from '../owner.service';
import {Owner} from '../owner';
import {Router} from '@angular/router';
import { finalize } from 'rxjs/operators';

export type SortColumn = 'name' | 'address' | 'city' | 'telephone' | 'pets';

@Component({
  selector: 'app-owner-list',
  templateUrl: './owner-list.component.html',
  styleUrls: ['./owner-list.component.css']
})
export class OwnerListComponent implements OnInit {
  errorMessage: string;
  filter = '';
  owners: Owner[];
  isOwnersDataReceived: boolean = false;
  readonly pageSizes = [5, 10, 20];
  pageSize = 5;
  page = 0;
  sortColumn: SortColumn | null = null;
  sortDescending = false;

  constructor(private router: Router, private ownerService: OwnerService) {

  }

  ngOnInit() {
    this.ownerService.getOwners().pipe(
      finalize(() => {
        this.isOwnersDataReceived = true;
      })
    ).subscribe(
      owners => this.owners = owners,
      error => this.errorMessage = error as any);
  }

  onSelect(owner: Owner) {
    this.router.navigate(['/owners', owner.id]);
  }

  addOwner() {
    this.router.navigate(['/owners/add']);
  }

  get filteredOwners(): Owner[] {
    const term = this.filter.trim().toLowerCase();
    return this.owners.filter(owner => !term || this.visibleText(owner).includes(term));
  }

  get sortedOwners(): Owner[] {
    const column = this.sortColumn;
    if (!column) {
      return this.filteredOwners;
    }
    const direction = this.sortDescending ? -1 : 1;
    return [...this.filteredOwners].sort((a, b) =>
      direction * this.sortValue(a, column).localeCompare(this.sortValue(b, column), undefined, {sensitivity: 'base'}));
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filteredOwners.length / this.pageSize));
  }

  get currentPage(): number {
    return Math.min(this.page, this.pageCount - 1);
  }

  get pagedOwners(): Owner[] {
    const start = this.currentPage * this.pageSize;
    return this.sortedOwners.slice(start, start + this.pageSize);
  }

  sortBy(column: SortColumn) {
    this.sortDescending = this.sortColumn === column && !this.sortDescending;
    this.sortColumn = column;
    this.page = 0;
  }

  sortIndicator(column: SortColumn): string {
    return this.sortColumn !== column ? '' : this.sortDescending ? '▼' : '▲';
  }

  setPageSize(size: number) {
    this.pageSize = size;
    this.page = 0;
  }

  goToPage(page: number) {
    this.page = Math.min(Math.max(page, 0), this.pageCount - 1);
  }

  private sortValue(owner: Owner, column: SortColumn): string {
    switch (column) {
      case 'name': return `${owner.firstName} ${owner.lastName}`;
      case 'pets': return (owner.pets || []).map(pet => pet.name).join(' ');
      default: return owner[column] || '';
    }
  }

  private visibleText(owner: Owner): string {
    const pets = (owner.pets || []).map(pet => pet.name);
    return [owner.firstName, owner.lastName, owner.address, owner.city, owner.telephone, ...pets]
      .join(' ').toLowerCase();
  }
}
