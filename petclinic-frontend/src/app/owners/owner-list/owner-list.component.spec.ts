/* tslint:disable:no-unused-variable */

import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {DebugElement, NO_ERRORS_SCHEMA} from '@angular/core';

import {OwnerListComponent} from './owner-list.component';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import { OwnerQuery, OwnerService } from '../owner.service';
import {Owner, OwnerPage} from '../owner';
import {Observable, of} from 'rxjs';
import {RouterTestingModule} from '@angular/router/testing';
import {CommonModule} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {PartsModule} from '../../parts/parts.module';
import {ActivatedRouteStub} from '../../testing/router-stubs';
import {OwnerDetailComponent} from '../owner-detail/owner-detail.component';
import {OwnersModule} from '../owners.module';
import {DummyComponent} from '../../testing/dummy.component';
import {OwnerAddComponent} from '../owner-add/owner-add.component';
import {OwnerEditComponent} from '../owner-edit/owner-edit.component';
import Spy = jasmine.Spy;


class OwnerServiceStub {
  listOwners(query: OwnerQuery): Observable<OwnerPage> {
    return of();
  }

}

describe('OwnerListComponent', () => {

  let component: OwnerListComponent;
  let fixture: ComponentFixture<OwnerListComponent>;
  let ownerService = new OwnerServiceStub();
  let listOwnersSpy: Spy;
  let de: DebugElement;
  let el: HTMLElement;


  const testOwner: Owner = {
    id: 1,
    firstName: 'George',
    lastName: 'Franklin',
    address: '110 W. Liberty St.',
    city: 'Madison',
    telephone: '6085551023',
    pets: []
  };
  let testPage: OwnerPage;
  const pageOf = (owners: Owner[], totalElements = owners.length): OwnerPage =>
    ({content: owners, totalElements, page: 0, size: 10});
  const lastQuery = (): OwnerQuery => listOwnersSpy.calls.mostRecent().args[0];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DummyComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [CommonModule, FormsModule, NoopAnimationsModule, PartsModule, OwnersModule,
        RouterTestingModule.withRoutes(
          [{path: 'owners', component: OwnerListComponent},
            {path: 'owners/add', component: OwnerAddComponent},
            {path: 'owners/:id', component: OwnerDetailComponent},
            {path: 'owners/:id/edit', component: OwnerEditComponent}
          ])],
      providers: [
        {provide: OwnerService, useValue: ownerService},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub}
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    testPage = pageOf([testOwner]);

    fixture = TestBed.createComponent(OwnerListComponent);
    component = fixture.componentInstance;
    ownerService = fixture.debugElement.injector.get(OwnerService);
    listOwnersSpy = spyOn(ownerService, 'listOwners')
      .and.returnValue(of(testPage));

  });

  it('should create OwnerListComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should call ngOnInit() method', () => {
    fixture.detectChanges();
    expect(listOwnersSpy.calls.any()).toBe(true, 'listOwners called');
  });


  it(' should show full name after listOwners observable (async) ', waitForAsync(() => {
    fixture.detectChanges();
    fixture.whenStable().then(() => { // wait for async listOwners
      fixture.detectChanges();        // update view with name
      de = fixture.debugElement.query(By.css('.ownerFullName'));
      el = de.nativeElement;
      expect(el.innerText).toBe((testOwner.firstName.toString() + ' ' + testOwner.lastName.toString()));
    });
  }));

  describe('paging, sorting and search', () => {
    beforeEach(() => {
      listOwnersSpy.and.returnValue(of(pageOf([testOwner], 42)));
      fixture.detectChanges();
    });

    it('first loads page 0 of 10 sorted by name', () => {
      expect(lastQuery()).toEqual({search: '', page: 0, size: 10, sort: 'name,asc'});
      expect(component.totalElements).toBe(42);
    });

    it('offers 5, 10 and 20 rows per page', () => {
      expect(component.pageSizeOptions).toEqual([5, 10, 20]);
    });

    it('requests the chosen page and size', () => {
      component.onPage({pageIndex: 2, pageSize: 20, length: 42});
      expect(lastQuery()).toEqual({search: '', page: 2, size: 20, sort: 'name,asc'});
    });

    it('sorts by the clicked column and goes back to page 0', () => {
      component.onPage({pageIndex: 2, pageSize: 10, length: 42});
      component.onSort({active: 'pets', direction: 'desc'});
      expect(lastQuery()).toEqual({search: '', page: 0, size: 10, sort: 'pets,desc'});
    });

    it('debounces typing, then searches from page 0', fakeAsync(() => {
      component.onPage({pageIndex: 3, pageSize: 10, length: 42});
      listOwnersSpy.calls.reset();

      component.onFilterChange('b');
      tick(100);
      component.onFilterChange('be');
      tick(299);
      expect(listOwnersSpy).not.toHaveBeenCalled();
      tick(1);
      expect(listOwnersSpy).toHaveBeenCalledTimes(1);
      expect(lastQuery()).toEqual({search: 'be', page: 0, size: 10, sort: 'name,asc'});
    }));

    it('Find Owner searches immediately, without waiting for the debounce', () => {
      component.filter = 'basil';
      fixture.debugElement.query(By.css('#search-owner-form')).triggerEventHandler('ngSubmit', null);
      expect(lastQuery().search).toBe('basil');
    });

    it('lists each pet name on its own line in the Pets cell', () => {
      listOwnersSpy.and.returnValue(of(pageOf([{...testOwner, pets: [{id: 7, name: 'Basil'} as any,
        {id: 8, name: 'Rex'} as any]}])));
      component.search();
      fixture.detectChanges();
      const pets = fixture.debugElement.queryAll(By.css('tbody td:last-child div'));
      expect(pets.map(p => p.nativeElement.innerText.trim())).toEqual(['Basil', 'Rex']);
    });

    it('says so when nothing matches', () => {
      listOwnersSpy.and.returnValue(of(pageOf([])));
      component.filter = 'nobody';
      component.search();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No owners matching "nobody"');
    });
  });

});
