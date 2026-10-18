import {Component, OnInit} from '@angular/core';
import {OwnerService} from '../owner.service';
import {Owner} from '../owner';
import {Router} from '@angular/router';
import { finalize } from 'rxjs/operators';

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

  private visibleText(owner: Owner): string {
    const pets = (owner.pets || []).map(pet => pet.name);
    return [owner.firstName, owner.lastName, owner.address, owner.city, owner.telephone, ...pets]
      .join(' ').toLowerCase();
  }
}
