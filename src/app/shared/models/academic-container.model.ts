import { ContainerType } from '../../core/enums/container-type.enum';

export interface AcademicContainer {
    id?: number;
    containerType: ContainerType;
    containerCode: string;
    containerName: string;
    organisationId: number; // Keeping ID reference to avoid circular dependencies or heavy objects
    academicYearId: number;
    courseId?: number;
    parentContainerId?: number;
    childContainers?: AcademicContainer[];
    level: number;
    capacity?: number;
    currentStrength?: number;
}
