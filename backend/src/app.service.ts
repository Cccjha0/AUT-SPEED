import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return 'backend ok';
  }
}
