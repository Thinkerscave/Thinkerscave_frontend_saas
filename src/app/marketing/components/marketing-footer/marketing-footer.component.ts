import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'tc-marketing-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: './marketing-footer.component.html',
  styleUrl: './marketing-footer.component.scss'
})
export class MarketingFooterComponent {
  readonly currentYear = new Date().getFullYear();

  readonly columns = [
    {
      title: 'Product',
      links: ['Admissions', 'Academics', 'Finance', 'HR & Payroll', 'Analytics']
    },
    {
      title: 'Solutions',
      links: ['Schools', 'Colleges', 'Universities', 'Multi-Campus', 'International']
    },
    {
      title: 'Platform',
      links: ['Modules', 'Integrations', 'API', 'Security', 'Mobile Apps']
    },
    {
      title: 'Resources',
      links: ['Documentation', 'Blog', 'Case Studies', 'Webinars', 'Help Center']
    },
    {
      title: 'Company',
      links: ['About', 'Careers', 'Contact', 'Partners', 'Press']
    },
    {
      title: 'Legal',
      links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'SLA']
    }
  ];

  readonly socials = [
    { icon: 'pi-linkedin', label: 'LinkedIn' },
    { icon: 'pi-twitter', label: 'Twitter' },
    { icon: 'pi-youtube', label: 'YouTube' },
    { icon: 'pi-instagram', label: 'Instagram' }
  ];
}
