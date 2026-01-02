import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { AcademicStructureService } from '../../services/academic-structure.service';
import { ContainerType } from '../../../../core/enums/container-type.enum';

@Component({
  selector: 'app-structure-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, DropdownModule, RouterModule],
  templateUrl: './structure-form.component.html',
  styleUrls: ['./structure-form.component.scss']
})
export class StructureFormComponent implements OnInit {
  structureForm: FormGroup;
  isEditMode = false;
  submitted = false;
  containerTypes = Object.values(ContainerType).map(type => ({ label: type, value: type }));

  constructor(
    private fb: FormBuilder,
    private structureService: AcademicStructureService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.structureForm = this.fb.group({
      containerName: ['', Validators.required],
      containerCode: ['', Validators.required],
      containerType: [null, Validators.required],
      level: [1, Validators.required],
      capacity: [null]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.structureService.getContainerById(id).subscribe(data => {
        this.structureForm.patchValue(data);
      });
    }
  }

  onSubmit() {
    this.submitted = true;
    if (this.structureForm.invalid) return;

    const action = this.isEditMode
      ? this.structureService.updateContainer(this.route.snapshot.params['id'], this.structureForm.value)
      : this.structureService.createContainer(this.structureForm.value);

    action.subscribe({
      next: () => this.router.navigate(['/app/academics/structure']),
      error: (err: any) => console.error(err)
    });
  }
}
