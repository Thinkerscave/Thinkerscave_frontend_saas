import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MenuMappingService } from '../../application/services/menu-mapping.service';
import { PageMetaService } from './page-meta.service';

describe('PageMetaService', () => {
  it('falls back to URL metadata when an activated route has no snapshot', () => {
    const router = {
      url: '/app/academics/academic-structure',
      routerState: {
        root: {
          firstChild: {
            snapshot: undefined,
            firstChild: null
          }
        }
      }
    };
    TestBed.configureTestingModule({
      providers: [
        PageMetaService,
        { provide: Router, useValue: router },
        { provide: MenuMappingService, useValue: { trailForUrl: () => [] } }
      ]
    });

    const metadata = TestBed.inject(PageMetaService).resolve(null, false);

    expect(metadata.title).toBe('Academic Structure');
    expect(metadata.crumbs.map(crumb => crumb.label)).toEqual(['Academics', 'Academic Structure']);
  });
});