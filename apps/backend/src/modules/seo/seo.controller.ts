import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../shared/decorators/auth.decorators';
import { SeoService } from './seo.service';

@ApiTags('SEO')
@Controller()
export class SeoController {
  constructor(private seoService: SeoService) {}

  @Public()
  @Get('sitemap.xml')
  async sitemap(@Res() res: Response) {
    const xml = await this.seoService.buildSitemapXml();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  }
}
