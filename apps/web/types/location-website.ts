import { BusinessHours } from './business-hours';
import { Location } from './location';
import { Review } from './review';
import { Service } from './service';
import { Staff } from './staff';

export type LocationWebsite = {
  location: Location;

  services: Service[];

  staffs: Staff[];

  reviews: Review[];

  businessHours: BusinessHours[];
};