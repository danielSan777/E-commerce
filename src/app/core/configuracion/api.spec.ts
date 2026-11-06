import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { API_URL } from './api';

describe('API_URL', () => {
  it('sale de environment.apiUrl (un solo lugar editable)', () => {
    expect(TestBed.inject(API_URL)).toBe(environment.apiUrl);
    expect(environment.apiUrl).toMatch(/^(\/|https?:\/\/)/);
    expect(environment.apiUrl.endsWith('/')).toBe(false);
  });
});
