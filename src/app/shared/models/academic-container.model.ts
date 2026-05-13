import { ContainerType } from '../../core/enums/container-type.enum';

export interface AcademicContainer {
    containerId?: number;
    containerType: ContainerType;
    containerCode: string;
    containerName: string;
    organisationId: number;
    academicYearId: number;
    courseId?: number;
    parentContainerId?: number;
    childContainers?: AcademicContainer[];
    level: number;
    capacity?: number;
    currentStrength?: number;
}

export interface StructureTemplate {
    rootType: ContainerType;
    rootPrefix: string;
    rootStartRange: number;
    rootEndRange: number;

    childType: ContainerType;
    childPrefix: string;
    childNames: string[];
}
