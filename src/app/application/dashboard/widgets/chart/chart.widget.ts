import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { ChartData } from '../../models/dashboard.model';

const PALETTE = ['#2C5BFF', '#16A34A', '#F59E0B', '#A855F7', '#0EA5E9', '#EF4444'];

@Component({
  selector: 'tc-chart-widget',
  standalone: true,
  imports: [CommonModule, ChartModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-chart">
      <p-chart [type]="chartJsType" [data]="chartData" [options]="chartOptions" height="240px"></p-chart>
    </div>
  `
})
export class ChartWidgetComponent implements OnChanges {
  @Input({ required: true }) data!: ChartData;

  chartJsType: 'line' | 'bar' | 'doughnut' = 'line';
  chartData: any;
  chartOptions: any;

  ngOnChanges(): void {
    this.chartJsType = this.data.chartType === 'bar' ? 'bar' : this.data.chartType === 'donut' ? 'doughnut' : 'line';
    const isArea = this.data.chartType === 'area';

    if (this.chartJsType === 'doughnut') {
      this.chartData = {
        labels: this.data.labels,
        datasets: [{
          data: this.data.series[0]?.data ?? [],
          backgroundColor: PALETTE,
          borderWidth: 0
        }]
      };
      this.chartOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { color: '#5A6479', usePointStyle: true, font: { size: 11 } } } }
      };
      return;
    }

    this.chartData = {
      labels: this.data.labels,
      datasets: (this.data.series ?? []).map((series, i) => ({
        label: series.name,
        data: series.data,
        borderColor: PALETTE[i % PALETTE.length],
        backgroundColor: this.chartJsType === 'bar' ? PALETTE[i % PALETTE.length] : `${PALETTE[i % PALETTE.length]}1A`,
        tension: 0.4,
        fill: isArea,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4
      }))
    };
    this.chartOptions = {
      maintainAspectRatio: false,
      plugins: { legend: { display: (this.data.series?.length ?? 0) > 1, position: 'bottom', labels: { color: '#5A6479', usePointStyle: true, font: { size: 11 } } } },
      scales: {
        x: { grid: { color: 'rgba(148,163,184,0.15)' }, ticks: { color: '#5A6479', font: { size: 11 } } },
        y: { grid: { color: 'rgba(148,163,184,0.15)' }, ticks: { color: '#5A6479', font: { size: 11 } }, beginAtZero: true }
      }
    };
  }
}
